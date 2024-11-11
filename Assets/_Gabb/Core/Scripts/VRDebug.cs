using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class VRDebug : MonoBehaviour
{
    public CharacterController characterController;
    //public CharacterContoller characterContoller;
    // Start is called before the first frame update
    void Update()
    {
        Vector3 characterControllerCenter = characterController.center;
        characterControllerCenter.y = 0;
        Vector3 feetWorldPosition = characterController.transform.TransformPoint(characterControllerCenter);
        transform.position = feetWorldPosition;
        
    }
}
