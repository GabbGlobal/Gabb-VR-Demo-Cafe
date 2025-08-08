using System;
using UnityEngine;

public class XRRoomscaleCollision : MonoBehaviour
{
    CharacterController characterController;
    void Awake() {
        characterController = GetComponent<CharacterController>();
    }

    // Update is called once per frame
    void Update()
    {
        // force a character controller update every frame
        characterController.Move(Vector3.zero);
    }
}
