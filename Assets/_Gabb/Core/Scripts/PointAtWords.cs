using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;


public class PointAtWords : MonoBehaviour
{
    private UnityEngine.XR.Interaction.Toolkit.Interactors.XRRayInteractor rayInteractor;
    public Vector3? pointerWorldPositionOnUI;
    // Start is called before the first frame update
    void Start()
    {
        rayInteractor = GetComponent<UnityEngine.XR.Interaction.Toolkit.Interactors.XRRayInteractor>();
    }

    // Update is called once per frame
    void Update()
    {
        if (rayInteractor.TryGetCurrentUIRaycastResult(out RaycastResult result)) {
            pointerWorldPositionOnUI = result.worldPosition;
        } else {
            pointerWorldPositionOnUI = null;
        }
    }

    void OnDrawGizmosSelected() {
        if (pointerWorldPositionOnUI.HasValue) {
            // Draw a yellow sphere at the transform's position
            Gizmos.color = Color.yellow;
            Gizmos.DrawSphere (pointerWorldPositionOnUI.Value, 0.1f);  
        }
    }
}
