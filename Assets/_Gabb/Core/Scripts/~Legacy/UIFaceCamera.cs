using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class UIFaceCamera : MonoBehaviour
{
    public bool rotate180AroundY = false;
    // Update is called once per frame
    void Awake() {
        FaceCamera();
    }

    void Update()
    {
        FaceCamera();
    }

    public void FaceCamera() {
        transform.rotation = Quaternion.identity;
        Vector3 lookAtWorldPosition = Camera.main.transform.position;
        lookAtWorldPosition.y = transform.position.y;
        transform.LookAt(lookAtWorldPosition);
        if (rotate180AroundY) {
            transform.Rotate(transform.up, 180f); // correction because UI faces the opposite direction in unity
        }
    }
}
