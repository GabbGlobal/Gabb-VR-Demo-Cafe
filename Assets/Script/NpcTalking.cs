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
    public static LineOfDialogue GetCurrentLineOfDialogueGlobal() {
        if (currentNpcTalking != null) {
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
        playerTriggerZone.onPlayerExit.AddListener(()=> {hasFinishedDialogueAndNotLeftAreaYet = false; }); // reset convo block once the player leaves the trigger area.
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
    private int lineOfDialogueIndex = 0;
    private float xpToReward = 0;
    private int failedAttempts = 0;

    async Awaitable StartConvo(CancellationToken cancellationToken)
    {
        try {
            Debug.Log($"[NpcTalking.Start] {gameObject.name}", gameObject);
            if (previousNpcTalking == this && hasFinishedDialogueAndNotLeftAreaYet) {
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
        } catch (Exception e) {
            Debug.LogException(e);
        }
    }

    // runs for every line of dialogue in order during a conversation
    async Awaitable HandleLineOfDialogue(int lineIndex, CancellationToken cancellationToken)
    {
        var line = dialogue.linesOfDialogue[lineIndex];
        Log($"Line:{line.ToString()}\nFailed Attempts:{failedAttempts}");
        ConversationUI.Instance.DisplayLineOfDialogue(line); // show current line of dialogue on the UI

        switch (line.speaker)
        {
            case DialogueSpeaker.NPC:
                {
                    // play npc talking animation
                    animator.SetTrigger("Talk");
                    // play speech audio clip
                    if (line.speaker == DialogueSpeaker.NPC)
                    {
                        if (line.audioClip == null)
                        {
                            Debug.LogWarning($"Missing audio clip for NPC dialogue at line {line} on {gameObject.name}", gameObject);
                        }
                        else
                        {
                            speechAudioSource.PlayOneShot(line.audioClip);
                            // wait for the NPC to finish speaking
                            await Awaitable.WaitForSecondsAsync(line.audioClip.length, cancellationToken);
                        }
                    }
                    MoveToNextLineOfDialogue();
                    break;
                }

            case DialogueSpeaker.Player:
                {
                    // begin pronunciation assessment
                    PronunciationAssessor.CustomAssessmentResult assessmentTask = await PronunciationAssessor.Instance.AssessPronunciation(line.text);
                    if (cancellationToken.IsCancellationRequested) { return; } // end early
                    if (assessmentTask?.recognition_status == "success") {
                        ConversationUI.Instance.ShowSuccess(assessmentTask?.rawResult); // let the player know they succeeded
                        xpToReward += 3f - failedAttempts; // keep track of xp to reward. Up to 3 points, -1 for every failed attempt.
                        await Awaitable.WaitForSecondsAsync(5f, cancellationToken);
                        MoveToNextLineOfDialogue();
                    } else {
                        failedAttempts++; // count the failed attempt
                        ConversationUI.Instance.ShowFail(failedAttempts, assessmentTask?.rawResult); // let the player know they fucked up
                        if (failedAttempts >= 3) {
                            Log($"{failedAttempts} failed attempts, stopping convo to restart.");
                            if (cancellationToken.IsCancellationRequested) { return; } // end early
                            StopConvo(); // to many failed attempts, stop the convo. it should then automatically restart.
                        } else {
                            Log($"{failedAttempts} failed attempts, trying again.");
                            // we'll try this line again
                        }
                        await Awaitable.WaitForSecondsAsync(5f, cancellationToken);
                    }
                    break;
                }
        }
        if (cancellationToken.IsCancellationRequested) { return; } // end early
        Debug.Log("OK TIME FOR NEXT");
    }

    void MoveToNextLineOfDialogue() {
        lineOfDialogueIndex++; // move onto next line of dialogue
        failedAttempts = 0; // reset attempts
    }

    void StopConvo()
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

    void OnDestroy() {
        if (convoCancellation != null) {
            convoCancellation.Cancel();
        }
    }

    public void RewardXP() {
        float xpForOnePlayerResponse = 3f;
        float xp = (dialogue.linesOfDialogue.Count / 2f) * xpForOnePlayerResponse;
        ExperienceUI.Instance.AddXP(xp);
    }

    void Log(string message) {
        Debug.Log($"[NpcTakling] {message}");
    }
}