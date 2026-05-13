using System;
using System.Collections;
using System.Collections.Generic;
using System.Threading;
using UnityEngine;
using UnityEngine.AI;
using UnityEngine.InputSystem;
using UnityEngine.XR.Interaction.Toolkit.AffordanceSystem.Receiver.Primitives;

public class NpcTalking : MonoBehaviour
{
    private Transform player;
    private bool talking = false;
    private Animator animator;
    private Quaternion originalRotation;
    private Coroutine turnBackCoroutine;
    private Coroutine faceUserCoroutine;
    public Transform placeUIHere;
    public InputActionReference progressDialogueInput;
    private Renderer[] renderers;
    private PlayerTriggerZone playerTriggerZone;
    private NpcFacing npcFacing;
    public Dialogue dialogue;
    public AudioSource speechAudioSource;
    public static NpcTalking currentNpcTalking = null; // static var to help enforce 1 NPC talking at a time
    public static NpcTalking previousNpcTalking = null;
    public static event System.Action<float, string> OnSpeechAttemptScored;
    bool hasFinishedDialogueAndNotLeftAreaYet = false;
    public static LineOfDialogue GetCurrentLineOfDialogueGlobal()
    {
        if (currentNpcTalking != null)
        {
            return currentNpcTalking.dialogue.linesOfDialogue[currentNpcTalking.lineOfDialogueIndex];
        }
        return null;
    }
    void Start()
    {
        renderers = GetComponentsInChildren<Renderer>();
        npcFacing = GetComponent<NpcFacing>();
        playerTriggerZone = GetComponentInChildren<PlayerTriggerZone>();
        player = Camera.main.transform;
        animator = GetComponentInChildren<Animator>();
        if (animator == null)
        {
            Debug.LogError("animator is null");
        }
        originalRotation = transform.rotation;
        playerTriggerZone.onPlayerExit.AddListener(() => { hasFinishedDialogueAndNotLeftAreaYet = false; }); // reset convo block once the player leaves the trigger area.
    }

    CancellationTokenSource convoCancellation;
    void Update()
    {
        // if facing player is in trigger zone and looking at this NPC
        bool canTalkWithPlayer = playerTriggerZone.PlayerIsInTriggerZone && IsInView();

        // if can talk, face player
        if (canTalkWithPlayer)
        {
            npcFacing.facePlayer = true; // look at the player   
        }
        else
        {
            npcFacing.facePlayer = false;
        }

        // if can talk and not player is not already talking to somebody
        if (canTalkWithPlayer && currentNpcTalking == null)
        {
            convoCancellation = new CancellationTokenSource();
            StartConvo(convoCancellation.Token); // intentionally not awaiting this
        }

        // if player leaves the trigger zone, end the convo
        if (!playerTriggerZone.PlayerIsInTriggerZone && currentNpcTalking == this)
        {
            StopConvo();
        }
    }

    // Conversation state
    protected int lineOfDialogueIndex = 0;
    protected float xpToReward = 0;
    protected int failedAttempts = 0;

    async Awaitable StartConvo(CancellationToken cancellationToken)
    {
        try
        {
            Debug.Log($"[NpcTalking.Start] {gameObject.name}", gameObject);
            if (previousNpcTalking == this && hasFinishedDialogueAndNotLeftAreaYet)
            {
                Debug.Log("Preventing endless looping convo after finishing. Go talk to somebody else first.");
                return;
            }

            // reset conversation state variables
            lineOfDialogueIndex = 0; // start at the beginning
            xpToReward = 0;
            failedAttempts = 0;
            currentNpcTalking = this;

            ConversationUI.Instance.OnStartConvo(this); // bring up the conversation UI

            // iterate through all lines of dialogue
            while (lineOfDialogueIndex < dialogue.linesOfDialogue.Count)
            {
                if (cancellationToken.IsCancellationRequested) { return; } // end early
                Debug.Log($"LINE #{lineOfDialogueIndex}");
                await HandleLineOfDialogue(lineOfDialogueIndex, cancellationToken);
                await Awaitable.NextFrameAsync();
            }
            // Reward xp once after finishing this covno
            RewardXP();
            hasFinishedDialogueAndNotLeftAreaYet = true; // remember that we just finished this convo, don't immediately start it again
            if (cancellationToken.IsCancellationRequested) { return; } // end early
            convoCancellation = null;
            StopConvo();
        }
        catch (Exception e)
        {
            Debug.LogException(e);
        }
    }

    // runs for every line of dialogue in order during a conversation
   protected virtual async Awaitable HandleLineOfDialogue(int lineIndex, CancellationToken cancellationToken)
    {
        var line = dialogue.linesOfDialogue[lineIndex];
        Log($"Line:{line.ToString()}\nFailed Attempts:{failedAttempts}");
        ConversationUI.Instance.DisplayLineOfDialogue(line); // show current line of dialogue on the UI

        switch (line.speaker)
        {
            // if this line is spoken by an NPC
            case DialogueSpeaker.NPC:
                {
                    // play npc talking animation
                    animator.SetTrigger("Talk");
                    if (line.audioClip == null)
                    {
                        Debug.LogWarning($"Missing audio clip for NPC dialogue at line {line} on {gameObject.name}", gameObject);
                    }
                    else
                    {
                        // play speech audio
                        speechAudioSource.Stop();
                        speechAudioSource.clip = line.audioClip;
                        speechAudioSource.Play();
                        // wait for the NPC to finish speaking in a way that handles tempo changes
                        while (speechAudioSource.isPlaying)
                        {
                            await Awaitable.NextFrameAsync();
                        }
                        await Awaitable.WaitForSecondsAsync(1f, cancellationToken); // 1 second buffer
                    }

                    MoveToNextLineOfDialogue();
                    break;
                }

            // if this line is spoken by the Player
            case DialogueSpeaker.Player:
                {
#if USE_AZURE
                    if (PronunciationAssessor.Instance == null)
                    {
                        Debug.LogError("[NpcTalking] PronunciationAssessor not in scene — skipping player line.");
                        MoveToNextLineOfDialogue();
                        break;
                    }
                    PronunciationAssessor.AssessmentResult assessmentTask = await PronunciationAssessor.Instance.AssessPronunciation(line.text);
                    if (cancellationToken.IsCancellationRequested) { return; }
                    if (assessmentTask?.recognition_status == "success")
                    {
                        ConversationUI.Instance.ShowSuccess();
                        xpToReward += 3f - failedAttempts;
                        await Awaitable.WaitForSecondsAsync(3f, cancellationToken);
                        MoveToNextLineOfDialogue();
                    }
                    else
                    {
                        failedAttempts++;
                        ConversationUI.Instance.ShowFail(failedAttempts);
                        if (failedAttempts >= 3)
                        {
                            Log($"{failedAttempts} failed attempts, stopping convo.");
                            await Awaitable.WaitForSecondsAsync(3f, cancellationToken);
                            if (cancellationToken.IsCancellationRequested) { return; }
                            StopConvo();
                        }
                        else
                        {
                            Log($"{failedAttempts} failed attempts, trying again.");
                        }
                    }
#else
                    await HandlePlayerLineWithDictation(line, cancellationToken);
#endif
                    break;
                }
        }
        if (cancellationToken.IsCancellationRequested) { return; } // end early
    }

    protected void MoveToNextLineOfDialogue()
    {
        lineOfDialogueIndex++; // move onto next line of dialogue
        failedAttempts = 0; // reset attempts
    }

#if !USE_AZURE
    private static Action<string> onDebugSpeechInput;
    public static void InjectDebugSpeech(string text)
    {
        onDebugSpeechInput?.Invoke(text);
    }

    private async Awaitable HandlePlayerLineWithDictation(LineOfDialogue line, CancellationToken cancellationToken)
    {
        var mic = FindFirstObjectByType<MicRecorder>();
        if (mic == null)
        {
            var go = new GameObject("MicRecorder");
            mic = go.AddComponent<MicRecorder>();
            Log("Auto-created MicRecorder.");
        }

        string[] refWords = line.text.Split(' ');
        float estimatedPhraseDuration = refWords.Length * 0.25f;
        const float speakingThreshold = 0.015f;
        const float settleDelay = 0.5f;

        ConversationUI.Instance.ShowListening();
        await Awaitable.WaitForSecondsAsync(settleDelay, cancellationToken);
        if (cancellationToken.IsCancellationRequested) return;

        bool recordingDone = false;
        bool debugDone = false;
        bool hintPlaying = false;
        string debugResult = null;
        float speechTime = 0f;
        int lastWordIdx = -1;
        byte[] capturedWav = null;

        Action<byte[]> onMicDone = (wav) => { capturedWav = wav; if (!hintPlaying) recordingDone = true; };
        mic.OnComplete += onMicDone;

        Action<string> debugHandler = (text) =>
        {
            debugResult = text;
            debugDone = true;
        };
        onDebugSpeechInput += debugHandler;

        Action onHintStart = () =>
        {
            hintPlaying = true;
            if (mic.IsRecording) mic.StopRecording();
        };
        Action onHintEnd = () =>
        {
            hintPlaying = false;
            recordingDone = false;
            mic.StartRecording();
        };
        ConversationUI.OnHintStarted += onHintStart;
        ConversationUI.OnHintEnded += onHintEnd;

        mic.StartRecording();
        Log($"Recording for: \"{line.text}\" ({refWords.Length} words, ~{estimatedPhraseDuration:F1}s)");

        while (!recordingDone && !debugDone)
        {
            if (cancellationToken.IsCancellationRequested)
            {
                mic.OnComplete -= onMicDone;
                onDebugSpeechInput -= debugHandler;
                ConversationUI.OnHintStarted -= onHintStart;
                ConversationUI.OnHintEnded -= onHintEnd;
                if (mic.IsRecording) mic.StopRecording();
                return;
            }

            if (!hintPlaying && mic.IsRecording && mic.CurrentVolume >= speakingThreshold)
            {
                speechTime += Time.deltaTime;
                float progress = Mathf.Clamp01(speechTime / estimatedPhraseDuration);
                int wordIdx = Mathf.Min((int)(progress * refWords.Length), refWords.Length - 1);
                if (wordIdx != lastWordIdx)
                {
                    lastWordIdx = wordIdx;
                    HighlightWordsUpTo(refWords, wordIdx);
                }
            }

            await Awaitable.NextFrameAsync();
        }

        mic.OnComplete -= onMicDone;
        onDebugSpeechInput -= debugHandler;
        ConversationUI.OnHintStarted -= onHintStart;
        ConversationUI.OnHintEnded -= onHintEnd;
        if (mic.IsRecording) mic.StopRecording();

        HighlightWordsUpTo(refWords, refWords.Length - 1);

        // Phase 1: Immediate cadence-based score
        float refDuration = (line.audioClip != null) ? line.audioClip.length : estimatedPhraseDuration;
        var engagement = WordProgressEstimator.GradeEngagement(speechTime, refDuration, refWords.Length);
        float accuracy = WordProgressEstimator.CalculateAccuracy(speechTime, refDuration, engagement.passed);
        Log($"[Phase1] Cadence: speech={speechTime:F1}s engagement={engagement.overallScore:P0} accuracy={accuracy:F0}%");

        if (debugDone && !string.IsNullOrEmpty(debugResult))
        {
            var grade = PhraseGrader.Grade(debugResult, line.text);
            ConversationUI.Instance.ShowGradeResult(grade);
            accuracy = grade.accuracy * 100f;
        }

        // Phase 2: SpeechAce pronunciation scoring (async refinement)
        var speechAce = SpeechAceClient.Instance;
        if (speechAce != null && speechAce.IsAvailable && capturedWav != null && capturedWav.Length > 0)
        {
            Log("[Phase2] Sending audio to SpeechAce...");
            var scoreResult = await speechAce.ScoreAsync(capturedWav, line.text);

            if (scoreResult != null && scoreResult.words != null)
            {
                var gradeResult = SpeechAceToGrade(scoreResult);
                ConversationUI.Instance.ShowGradeResult(gradeResult);
                accuracy = scoreResult.overallScore;
                Log($"[Phase2] SpeechAce: {accuracy:F0}% ({gradeResult.matchedCount}/{gradeResult.totalWords} words passed)");
                await Awaitable.WaitForSecondsAsync(2f, cancellationToken);
                if (cancellationToken.IsCancellationRequested) return;
            }
            else
            {
                Log("[Phase2] SpeechAce returned null — staying on cadence score.");
            }
        }

        OnSpeechAttemptScored?.Invoke(accuracy, line.text);

        float lineXP = Mathf.Max(0f, 3f - failedAttempts);
        xpToReward += lineXP;
        var localPlayer = GameManager.Instance?.LocalPlayer;
        if (localPlayer != null && localPlayer.XPComponent != null)
            localPlayer.XPComponent.AddXP(lineXP);

        failedAttempts = 0;
        ConversationUI.Instance.ShowSuccess();
        await Awaitable.WaitForSecondsAsync(2f, cancellationToken);
        if (cancellationToken.IsCancellationRequested) return;
        MoveToNextLineOfDialogue();
    }

    private void HighlightWordsUpTo(string[] refWords, int upToIndex)
    {
        var sb = new System.Text.StringBuilder();
        for (int i = 0; i < refWords.Length; i++)
        {
            sb.Append(i <= upToIndex
                ? $"<color=green>{refWords[i]}</color>"
                : refWords[i]);
            if (i < refWords.Length - 1) sb.Append(' ');
        }
        ConversationUI.Instance.playerDialogueText.text = sb.ToString();
    }

    private static PhraseGrader.GradeResult SpeechAceToGrade(SpeechAceResult result)
    {
        const float passThreshold = 50f;
        var words = new PhraseGrader.WordResult[result.words.Length];
        int matched = 0;
        for (int i = 0; i < result.words.Length; i++)
        {
            bool passed = result.words[i].qualityScore >= passThreshold;
            if (passed) matched++;
            words[i] = new PhraseGrader.WordResult
            {
                referenceWord = result.words[i].word,
                matched = passed
            };
        }
        float acc = result.words.Length > 0 ? (float)matched / result.words.Length : 0f;
        return new PhraseGrader.GradeResult
        {
            words = words,
            matchedCount = matched,
            totalWords = result.words.Length,
            accuracy = acc,
            passed = result.overallScore >= 50f
        };
    }
#endif

   protected void StopConvo()
    {
        ConversationUI.Instance.OnEndConvo();

        Debug.Log($"[NpcTalking.StopConvo] {gameObject.name}", gameObject);
        if (convoCancellation != null)
        {
            Debug.Log($"[NpcTalking.StopConvo] {gameObject.name} Cancelling convo awaitable", gameObject);
            convoCancellation.Cancel();
            convoCancellation = null;
        }
        previousNpcTalking = this;
        currentNpcTalking = null;
    }

    // Check if the NPC is in view of the camera. Does not account for occlusion.
    public bool IsInView()
    {
        var planes = GeometryUtility.CalculateFrustumPlanes(Camera.main);
        foreach (Renderer r in renderers)
        {
            if (GeometryUtility.TestPlanesAABB(planes, r.bounds))
            {
                return true;
            }
        }
        return false;
    }

    void OnDestroy()
    {
        if (convoCancellation != null)
        {
            convoCancellation.Cancel();
        }
    }

    public void RewardXP()
    {
        float xpForOnePlayerResponse = 3f;
        float xp = (dialogue.linesOfDialogue.Count / 2f) * xpForOnePlayerResponse;
        ExperienceUI.Instance.AddXP(xp);
    }

    void Log(string message)
    {
        Debug.Log($"[NpcTakling] {message}");
    }
}