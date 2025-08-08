using System.Collections;
using UnityEngine;

// Adjust position to compensate for the player starting away from their roomscale center
// Ensures player always starts where its prefab was placed
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
        Vector3 offset = startPosition - camTransform.position;
        offset.y = 0;
        transform.position += offset;
    }
}
