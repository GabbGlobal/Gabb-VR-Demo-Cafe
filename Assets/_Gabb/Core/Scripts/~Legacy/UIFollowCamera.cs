using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class UIFollowCamera : MonoBehaviour
{
    //float signedAngle;
    // Start is called before the first frame update
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
        transform.position = Camera.main.transform.position;
        Vector3 forward = Camera.main.transform.forward;
        forward.y = 0;
        forward.Normalize();
        //Vector3.SignedAngle(Vector3.forward, forward, Vector3.up);
        Quaternion goalRotation = Quaternion.LookRotation(forward);
        transform.rotation = Quaternion.Slerp(transform.rotation, goalRotation, Time.deltaTime);

    }
}
