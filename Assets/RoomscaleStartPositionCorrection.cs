using System.Collections;
using UnityEngine;

// Adjust position to compensate for roomscale position
// Ensures that the player always starts where the player object was placed.
public class RoomscaleStartPositionCorrection : MonoBehaviour
{
    Vector3 startPosition;
    Transform camTransform;
    void Awake() {
        startPosition = transform.position;
    }

    IEnumerator Start() {
        camTransform = Camera.main.transform;
        // wait for a valid tracked camera position;
        yield return new WaitUntil(()=> camTransform.localPosition != Vector3.zero);
        CorrectPosition();
    }

    void CorrectPosition() {
        transform.position += startPosition - camTransform.position;
    }
}
