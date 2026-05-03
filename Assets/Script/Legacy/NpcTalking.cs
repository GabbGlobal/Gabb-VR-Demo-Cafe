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
        Debug.Log("OK TIME FOR NEXT");
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
        string finalResult = null;
        bool recognitionDone = false;

#if UNITY_STANDALONE_WIN || UNITY_EDITOR_WIN
        DictationRecognizer dictation = null;
        try
        {
            dictation = new DictationRecognizer();
            dictation.DictationHypothesis += (text) =>
            {
                Debug.Log($"[NpcTalking] Partial: \"{text}\"");
                ConversationUI.Instance.ShowPartialPhrase(line.text, text);
            };
            dictation.DictationResult += (text, confidence) =>
            {
                Debug.Log($"[NpcTalking] Final: \"{text}\" ({confidence})");
                finalResult = text;
                recognitionDone = true;
            };
            dictation.DictationError += (err, hr) =>
            {
                Debug.LogWarning($"[NpcTalking] Dictation error: {err} (0x{hr:X})");
                recognitionDone = true;
            };
            dictation.Start();
            Debug.Log("[NpcTalking] Dictation started for player line");
        }
        catch (Exception ex)
        {
            Debug.LogWarning($"[NpcTalking] DictationRecognizer failed to start: {ex.Message}");
        }
#endif

        Action<string> debugHandler = (text) =>
        {
            Debug.Log($"[NpcTalking] Debug input: \"{text}\"");
            finalResult = text;
            recognitionDone = true;
        };
        onDebugSpeechInput += debugHandler;

        float timeout = 15f;
        float elapsed = 0f;
        while (!recognitionDone && elapsed < timeout)
        {
            if (cancellationToken.IsCancellationRequested)
            {
                onDebugSpeechInput -= debugHandler;
#if UNITY_STANDALONE_WIN || UNITY_EDITOR_WIN
                DisposeDictation(dictation);
#endif
                return;
            }
            elapsed += Time.deltaTime;
            await Awaitable.NextFrameAsync();
        }

        onDebugSpeechInput -= debugHandler;
#if UNITY_STANDALONE_WIN || UNITY_EDITOR_WIN
        DisposeDictation(dictation);
#endif

        if (string.IsNullOrEmpty(finalResult))
        {
            failedAttempts++;
            Log($"No speech detected (timeout). Failed attempts: {failedAttempts}");
            ConversationUI.Instance.ShowFail(Mathf.Min(failedAttempts, 3));
            if (failedAttempts >= 3)
            {
                await Awaitable.WaitForSecondsAsync(3f, cancellationToken);
                if (cancellationToken.IsCancellationRequested) return;
                StopConvo();
            }
            return;
        }

        if (PhraseMatches(finalResult, line.text))
        {
            ConversationUI.Instance.ShowSuccess();
            xpToReward += 3f - failedAttempts;
            await Awaitable.WaitForSecondsAsync(3f, cancellationToken);
            if (cancellationToken.IsCancellationRequested) return;
            MoveToNextLineOfDialogue();
        }
        else
        {
            failedAttempts++;
            ConversationUI.Instance.ShowFail(Mathf.Min(failedAttempts, 3));
            ConversationUI.Instance.ShowPartialPhrase(line.text, finalResult);
            Log($"{failedAttempts} failed attempts.");
            if (failedAttempts >= 3)
            {
                await Awaitable.WaitForSecondsAsync(3f, cancellationToken);
                if (cancellationToken.IsCancellationRequested) return;
                StopConvo();
            }
        }
    }

    private static bool PhraseMatches(string recognized, string reference)
    {
        string recNorm = TextUtils.NormalizeAccents(recognized.Trim().TrimEnd('.'));
        string refNorm = TextUtils.NormalizeAccents(reference.Trim());
        if (recNorm == refNorm) return true;

        string[] recWords = recNorm.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        string[] refWords = refNorm.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (refWords.Length == 0) return false;

        int matched = 0;
        foreach (string rw in refWords)
        {
            foreach (string rr in recWords)
            {
                if (rw == rr) { matched++; break; }
            }
        }
        return (float)matched / refWords.Length >= 0.7f;
    }

#if UNITY_STANDALONE_WIN || UNITY_EDITOR_WIN
    private static void DisposeDictation(DictationRecognizer dictation)
    {
        if (dictation == null) return;
        try
        {
            if (dictation.Status == SpeechSystemStatus.Running)
                dictation.Stop();
            dictation.Dispose();
        }
        catch { }
    }
#endif
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