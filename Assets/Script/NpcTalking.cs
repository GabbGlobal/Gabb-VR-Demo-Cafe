using System;
using System.Collections;
using System.Collections.Generic;
using System.Threading;
using UnityEditor.UI;
using UnityEngine;
using UnityEngine.InputSystem;

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
    private ConversationUI conversationUI;
    public static NpcTalking currentNpcTalking = null; // static var to help enforce 1 NPC talking at a time
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
        conversationUI = FindFirstObjectByType<ConversationUI>(); // TODO: replace with proper singleton
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
            StartConvo(convoCancellation.Token);
        }

        // if player leaves the trigger zone, end the convo
        if (!playerTriggerZone.PlayerIsInTriggerZone && currentNpcTalking == this)
        {
            StopConvo();
        }
    }

    // Conversation state
    private int lineOfDialogueIndex = 0;

    async Awaitable StartConvo(CancellationToken cancellationToken)
    {
        try {
            Debug.Log($"[NpcTalking.Start] {gameObject.name}", gameObject);
            currentNpcTalking = this;
            conversationUI.OnStartConvo(this); // bring up the conversation UI

            // iterate through all lines of dialogue
            lineOfDialogueIndex = 0; // start at the beginning
            while (lineOfDialogueIndex < dialogue.linesOfDialogue.Count)
            {
                if (cancellationToken.IsCancellationRequested) { return; } // end early
                Debug.Log($"LINE #{lineOfDialogueIndex}");
                await HandleLineOfDialogue(lineOfDialogueIndex, cancellationToken);
                await Awaitable.NextFrameAsync();
            }
        } catch (Exception e) {
            Debug.LogException(e);
        }
    }

    void StopConvo()
    {
        conversationUI.OnEndConvo();
        Debug.Log($"[NpcTalking.StopConvo] {gameObject.name}", gameObject);
        if (convoCancellation != null)
        {
            Debug.Log($"[NpcTalking.StopConvo] {gameObject.name} Cancelling convo awaitable", gameObject);
            convoCancellation.Cancel();
            convoCancellation = null;
        }
        currentNpcTalking = null;
    }

    // runs for every line of dialogue in order during a conversation
    async Awaitable HandleLineOfDialogue(int lineIndex, CancellationToken cancellationToken)
    {
        var line = dialogue.linesOfDialogue[lineIndex];
        Debug.Log(line.ToString());
        conversationUI.DisplayLineOfDialogue(line); // show current line of dialogue on the UI

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
                    lineOfDialogueIndex++; // move onto next line of dialogue
                    break;
                }

            case DialogueSpeaker.Player:
                {
                    // begin pronunciationa ssement
                    PronunciationAssessor.AssessmentResult assessmentTask = await PronunciationAssessor.Instance.AssessPronunciation(line.text);
                    if (cancellationToken.IsCancellationRequested) { return; } // end early
                    if (assessmentTask?.recognition_status == "success") {
                        //InteractionManager.Instance.HandleCorrectPronunciation();
                        conversationUI.ShowSuccess(); // let the player know they succeeded
                        await Awaitable.WaitForSecondsAsync(5f, cancellationToken); // TODO: replace this with progress button click
                        lineOfDialogueIndex++; // move onto next line of dialogue
                    } else {
                        conversationUI.ShowFail(); // let the player know they fucked up
                        //InteractionManager.Instance.HandleIncorrectPronunciation();
                        //DO NOT move onto next line of dialogue, we'll try this one again
                    }
                    break;
                }
        }
        if (cancellationToken.IsCancellationRequested) { return; } // end early
        Debug.Log("OK TIME FOR NEXT");
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
}