using System.Collections;
using System.Collections.Generic;
using Autohand;
using UnityEngine;
using UnityEngine.EventSystems;

public class PointAtWords : MonoBehaviour
{
    private Autohand.HandCanvasPointer handCanvasPointer;
    public Vector3? pointerWorldPositionOnUI;
    private AutoInputModule autoInputModule;
    // Start is called before the first frame update
    void Start()
    {
        autoInputModule = FindAnyObjectByType<AutoInputModule>();
        handCanvasPointer = GetComponent<Autohand.HandCanvasPointer>();
    }

    // Update is called once per frame
    void Update()
    {
        // get pointer position on canvas in worldspace if any
        var target = handCanvasPointer.currTarget;
        if (target != null) {
            var pointerData = autoInputModule.GetData(handCanvasPointer.pointerIndex);
            pointerWorldPositionOnUI = pointerData.pointerCurrentRaycast.worldPosition;
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
