using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class NpcFacing : MonoBehaviour
{
    
    private Quaternion startRotation;
    public bool facePlayer = false;
    
    void Start() {
        startRotation = transform.rotation;
    }

    void Update() {
        if (facePlayer) {
            FacePlayer();
        } else {
            ReturnToDefaultFacing();
        }
    }

    // Rotate ot face the player
    void FacePlayer() {
        Vector3 targetDirection = Camera.main.transform.position - transform.position;
        targetDirection.y = 0; // Keep the rotation in the horizontal plane
        targetDirection.Normalize();
        Quaternion targetRotation = Quaternion.LookRotation(targetDirection);
        transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, Time.deltaTime * 4.0f);
        //TODO: Instead of rotating the whole NPC, use look at IK
    }

    void ReturnToDefaultFacing() {
        transform.rotation = Quaternion.Slerp(transform.rotation, startRotation, Time.deltaTime * 4.0f);
    }
}
