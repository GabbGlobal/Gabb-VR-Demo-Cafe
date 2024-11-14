using System.Collections;
using System.Collections.Generic;
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

    public void Talk(bool _talk)
    {
        /*talking = _talk;

        if (talking)
        {
            animator.SetInteger("talking", Random.Range(0, 1));
            animator.SetTrigger("Talk");
            if (turnBackCoroutine != null)
            {
                StopCoroutine(turnBackCoroutine);
            }
        }
        else
        {
            animator.ResetTrigger("Talk");
        }*/
    }

    void Update() {
         // if facing player is in trigger zone and looking at this NPC
        bool canTalkWithPlayer = playerTriggerZone.PlayerIsInTriggerZone && IsInView(); 

        // if can talk, face player
        if (canTalkWithPlayer) {
            npcFacing.facePlayer = true; // look at the player   
        } else { 
            npcFacing.facePlayer = false;
        }

        // if can talk and not player is not already talking to somebody
        if (canTalkWithPlayer && currentNpcTalking == null) {
            StartCoroutine(StartConvo());
        }

        // if player leaves the trigger zone, end the convo
        if (!playerTriggerZone.PlayerIsInTriggerZone && currentNpcTalking == this) {
            EndConvo();
        }
    }

    IEnumerator StartConvo() {
        currentNpcTalking = this;
        conversationUI.StartConvo(this); // bring up the conversation UI

        // iterate through all lines of dialogue
        for (int i = 0; i < dialogue.linesOfDialogue.Count; i++) {
            yield return HandleLineOfDialogue(i);
        }
    }

    void EndConvo() {
        currentNpcTalking = null;
    }

    // runs for every line of dialogue in order during a conversation
    IEnumerator HandleLineOfDialogue(int lineIndex) {
        var line = dialogue.linesOfDialogue[lineIndex];
        conversationUI.DisplayLineOfDialogue(line); // show current line of dialogue on the UI

        switch (line.speaker) {
            
            case DialogueSpeaker.NPC: {
                 // play npc talking animation
                animator.SetTrigger("Talk");
                // play speech audio clip
                if (line.speaker == DialogueSpeaker.NPC) {
                    if (line.audioClip == null) {
                        Debug.LogWarning($"Missing audio clip for NPC dialogue at line {line} on {gameObject.name}", gameObject);
                    } else {
                        speechAudioSource.PlayOneShot(line.audioClip);
                        // wait for the NPC to finish speaking
                        yield return new WaitForSecondsRealtime(line.audioClip.length);
                    }
                }
                break;
            }

            case DialogueSpeaker.Player: {
                // begin pronunciationa ssement
                PronunciationAssessor.Instance.StartAssessment(line.text);
                yield return new WaitForSeconds(20f); // as a test
                break;
            }
        }
        yield break;
    }



    // Check if the NPC is in view of the camera. Does not account for occlusion.
    public bool IsInView() {
        var planes = GeometryUtility.CalculateFrustumPlanes(Camera.main);
        foreach (Renderer r in renderers) {
            if(GeometryUtility.TestPlanesAABB(planes, r.bounds)) {
                return true;
            }
        }
        return false;        
    }
}