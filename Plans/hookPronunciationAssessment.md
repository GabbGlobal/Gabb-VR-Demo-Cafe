# Plan: Hook Pronunciation Assessment into Active Flow

## Problem

`PronunciationAssessor.cs` (Legacy) has working Azure pronunciation scoring (0-100 grades for accuracy, fluency, completeness, overall) but is disconnected from everything. `WordFlowManager.cs` uses `AzureSpeechRecognizer.cs` for continuous recognition but only does binary string matching — no scoring. The two systems can't coexist because both are singletons that fight over the microphone.

## Goal

Give `WordFlowManager` access to real pronunciation scores from Azure so every word attempt produces a grade (0-100), not just pass/fail. Expose a clean API that future systems (neuroadaptive difficulty, teacher dashboard, XP weighting) can consume.

---

## Architecture Decision

**Merge assessment into `AzureSpeechRecognizer`**, don't run both singletons.

Reasoning:
- One mic owner, one token lifecycle, one Azure connection
- `AzureSpeechRecognizer` already has the APIM token flow, continuous recognition, and `WordFlowManager` integration
- `PronunciationAssessor` has the scoring config (`PronunciationAssessmentConfig`) — lift that logic into `AzureSpeechRecognizer`
- Kill the Legacy singleton entirely

## Gating: `canListen` Controls Everything

The `canListen` bool on `AzureSpeechRecognizer` is the existing gate for all speech processing. It is toggled by `SpeechZoneTrigger.cs` — a collider-based zone in the VR scene:

- **Player enters trigger zone** → `canListen = true`, indicator turns green
- **Player exits trigger zone** → `canListen = false`, indicator turns red

Both `Recognizing` and `Recognized` callbacks already early-return when `canListen` is false. Pronunciation assessment must respect the same gate:

- `AssessPronunciation()` checks `canListen` first — if false, return null immediately. No Azure API call, no mic activation, no cost.
- This means scoring only happens when the player is actively standing in front of an NPC/lesson station. Walking around the cafe does not trigger assessment calls.
- `SpeechZoneTrigger` requires no changes — it already controls the gate that assessment will sit behind.

**Cost implication:** Without this gate, ambient mic pickup could fire hundreds of spurious Azure calls per session. With it, calls only happen during intentional lesson interactions. Estimated cost: ~$0.20-0.25 per 100 assessed sentences (~$0.10-0.25 per student session).

---

## Steps

### 1. Extend `AzureSpeechRecognizer` with Assessment Mode

Add a method alongside the existing continuous recognition:

```
public async Task<PronunciationResult> AssessPronunciation(string referenceText)
```

This method:
- **Only runs when `canListen == true`** — if the gate is closed (user not in a speech zone, lesson not active), return null immediately. No Azure call, no mic activation, no cost.
- Stops continuous recognition if running
- Creates a `PronunciationAssessmentConfig` with `GradingSystem.HundredMark`, `Granularity.Phoneme`
- Applies it to a new `SpeechRecognizer` instance (short-lived, not the continuous one)
- Listens for a single utterance (10s timeout)
- Parses the JSON response into a result struct
- Resumes continuous recognition if it was running before

Key: the continuous recognizer and the assessment recognizer must NOT overlap. Stop one, run the other, restart.

### 2. Define a Clean Result Type

New file: `PronunciationResult.cs` (in Tutor System/Foundation/)

```
[System.Serializable]
public class PronunciationResult
{
    public string recognizedText;
    public string referenceText;
    public float pronunciationScore;  // 0-100, overall grade
    public float accuracyScore;       // 0-100, correct phonemes
    public float fluencyScore;        // 0-100, pacing/rhythm
    public float completenessScore;   // 0-100, all words said
    public bool passed;               // pronunciationScore >= threshold
}
```

Drop the `custom_score` from Legacy — it's redundant with Azure's actual phoneme analysis.

### 3. Modify `WordFlowManager.CheckRecognizedWord`

Current flow:
```
Azure transcribes -> string match -> pass/fail
```

New flow:
```
Azure transcribes -> if text roughly matches target -> request assessment -> score -> graded result
```

Change `CheckRecognizedWord` to:
- On recognition, do a loose text match first (normalized, trimmed) as a gate — don't assess pronunciation if they said a completely different word
- If the word is in the right ballpark, call `AzureSpeechRecognizer.Instance.AssessPronunciation(targetWord)`
- Use the `pronunciationScore` to determine outcome:
  - **>= 80**: Pass. Full XP. Green feedback.
  - **60-79**: Soft pass. Partial XP (e.g. 50%). Yellow feedback. Word gets flagged for STM resurface.
  - **< 60**: Fail. No XP. Red feedback. Show what was wrong.
- Expose the score so other systems can read it (event or public property)

### 4. Add Events for Score Consumers

On `WordFlowManager` or a new `PronunciationEvents` static class:

```
public static event Action<PronunciationResult> OnPronunciationScored;
```

This lets future systems subscribe without coupling:
- Neuroadaptive difficulty adjustment
- Teacher dashboard telemetry
- UI score display
- Spaced repetition / word difficulty tracking

### 5. Score Display UI

Add a simple UI element near the existing word blocks that shows the score after each attempt:
- Large number (e.g. "87%")
- Color-coded (green/yellow/red)
- Breakdown tooltip or secondary text: "Accuracy: 92 | Fluency: 78 | Completeness: 100"
- Fades after a few seconds or on next word

---

## Testing Plan

### Layer 1: Offline / No Azure (Fast iteration)

**Mock injection** — `AzureSpeechRecognizer` gets a `debugMode` bool (inspector toggle). When enabled:
- `AssessPronunciation()` skips Azure entirely
- Returns a fake `PronunciationResult` with scores you set in the inspector (sliders for each score 0-100)
- Fires `OnPronunciationScored` normally so downstream systems (WordFlowManager, UI, events) all exercise the real code paths

This lets you test the full grading flow (pass/soft-pass/fail routing, XP awards, UI color changes, event propagation) without mic, network, or Azure costs. Works in editor and on device.

**Token validation test** — set `tokenExpirationTime` to the past, verify `IsTokenValid()` returns false and `RefreshSpeechSDKConfig()` re-fetches before assessment.

### Layer 2: Live Mic, English (Cheap validation)

Keep the `englishTestingMode` flag from Legacy. When enabled:
- Language switches to `en-US`
- Reference text overrides to simple English words ("test", "hello", "one two three")
- Speak into mic in English — full Azure round trip, real scores back

This validates the entire pipeline (mic → Azure → scores → grading) without needing a Spanish speaker. Fast to iterate, minimal Azure cost.

### Layer 3: Live Mic, Target Language (Full validation)

Real Spanish (or target language) words against the actual word list. This is the final "does it actually work" test.

Test cases:
1. **Clean pronunciation** — say "hola" clearly. Expect score > 80.
2. **Intentional mispronunciation** — say "jola" or "ola". Expect score 40-70.
3. **Wrong word entirely** — say "gracias" when target is "hola". Expect score < 40 or no match.
4. **Partial / mumble** — half-say the word. Expect mid-range score.
5. **Silence** — say nothing for 10 seconds. Expect timeout, null result, no crash, continuous recognition resumes.
6. **Multi-word phrase** — test with "buenos días" to verify multi-word scoring and completeness.
7. **Gate test** — exit the `SpeechZoneTrigger` collider mid-assessment. Verify `canListen` goes false, assessment returns null, no orphaned Azure call.

### Debug Test Scene

New scene: `Scenes/PronunciationTestBench` with:

**UI Elements:**
- TMP input field for reference text (type what the system expects you to say)
- "Start Assessment" button (calls `AssessPronunciation`)
- "Simulate Score" button (injects mock result, no Azure call)
- Four score sliders (for mock mode — set fake accuracy/fluency/completeness/pronunciation)
- Language dropdown (es-ES, en-US, it-IT) to test different languages

**Live Display:**
- Partial transcription (updates in real-time from `Recognizing` events while user speaks — "I hear you..." feedback)
- Final recognized text vs reference text (side by side)
- All four scores as big numbers, color-coded: green (>=80), yellow (60-79), red (<60)
- Pass/soft-pass/fail badge
- `canListen` status indicator (green = gate open, red = gate closed)
- Token status (valid / expired / refreshing)
- Timestamp + latency (how long Azure took to respond)

**Log Panel:**
- Scrollable text area showing the last 20 assessment results with timestamps
- Export button to dump results to a JSON file for review

This scene is self-contained — no cafe geometry, no NPCs, no word flow. Just mic in, scores out. Anyone on the team can open it, speak, and see exactly what Azure returns.

### Validation Checklist (Run Before Merging)

- [ ] Mock mode: all four score ranges (0-30, 30-60, 60-80, 80-100) route correctly in WordFlowManager
- [ ] Mock mode: `OnPronunciationScored` event fires and carries correct data
- [ ] Mock mode: XP awards match grading tier (full / partial / none)
- [ ] English test mode: mic → Azure → real scores returned
- [ ] English test mode: continuous recognition resumes after assessment completes
- [ ] Spanish test mode: "hola" scores > 80 when pronounced correctly
- [ ] Timeout: 10s silence returns null, no crash
- [ ] Gate test: `canListen = false` prevents Azure call
- [ ] Token refresh: expired token auto-refreshes before assessment
- [ ] Quest hardware: mic permissions work, no Android-specific failures
- [ ] Cost spot-check: run 10 assessments, verify Azure billing matches expected (~$0.02)

---

## Risks & Gotchas

| Risk | Mitigation |
|------|------------|
| **Mic contention** — stopping continuous recognition to run assessment may cause a brief gap where speech is missed | Accept the gap. Assessment mode is intentional (user is actively pronouncing a specific word). Resume continuous after. |
| **Latency** — Azure assessment takes 1-3 seconds round trip | Show a "scoring..." indicator. Don't block the main thread (already using async/await). |
| **Token expiry mid-session** — token refreshes every ~10 min | Already handled by `IsTokenValid()` + `RefreshSpeechSDKConfig()`. Call it before each assessment. |
| **Quest mic permissions** — `PermissionsManager.cs` exists but may not cover all edge cases | Test on Quest hardware. Mic permission should already be granted from continuous recognition. |
| **Cost** — Azure Speech pronunciation assessment is billed per request | Acceptable for real usage. For dev/testing, use `englishTestingMode` with short words to minimize calls. |
| **Singleton bug from Legacy** — `if (Instance == null) { DestroyImmediate(Instance); }` | Already fixed in `AzureSpeechRecognizer`. Don't carry it over. |
| **`custom_score` logic** — crude word-matching that duplicates what Azure already does better | Drop it entirely. Use Azure's `PronScore` as the single source of truth. |

---

## Files Changed

| File | Action |
|------|--------|
| `Assets/Script/Tutor System/Foundation/AzureSpeechRecognizer.cs` | Add `AssessPronunciation()` method, pronunciation config, result parsing |
| `Assets/Script/Tutor System/Foundation/PronunciationResult.cs` | **New** — clean result type |
| `Assets/Script/Tutor System/Foundation/WordFlowManager.cs` | Replace string matching with score-based grading, fire `OnPronunciationScored` event |
| `Assets/Script/Legacy/PronunciationAssessor.cs` | No changes — remains in Legacy as reference, eventually delete |
| `Assets/Scenes/PronunciationTestBench.unity` | **New** — isolated test scene: mic in, scores out, no cafe dependencies |
| `Assets/Script/Tutor System/Foundation/PronunciationTestUI.cs` | **New** — debug panel MonoBehaviour for the test scene (input field, buttons, score display, log) |

---

## Out of Scope (For Now)

- Per-phoneme feedback UI (Azure returns this data — we parse it but don't display yet)
- Neuroadaptive integration (subscribes to `OnPronunciationScored` later)
- Teacher dashboard broadcasting (subscribes to the same event later)
- Multi-language support (currently `es-ES` hardcoded — parameterize later)
- Spaced repetition word tracking based on scores
