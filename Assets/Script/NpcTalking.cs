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
    }

    public void Talk(bool _talk)
    {
        talking = _talk;

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
        }
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

        /*// can talk and progress dialogue input is pressed
        if (canTalkWithPlayer && && InteractionManager.Instance.CurrentNpc == null && progressDialogueInput.action.WasPressedThisFrame()) {
            InteractionManager.Instance.StartConv(this); // start conversation with this NPC
        }*/

        // if can talk and not player is not already talking to somebody
        if (canTalkWithPlayer && InteractionManager.Instance.CurrentNpc == null) {
            InteractionManager.Instance.StartConv(this); // start conversation with this NPC
        }

        // if player leaves the trigger zone, end the convo
        if (!playerTriggerZone.PlayerIsInTriggerZone && InteractionManager.Instance.CurrentNpc == this) {
            InteractionManager.Instance.EndConv();
        }
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