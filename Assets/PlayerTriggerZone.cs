using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Events;

public class PlayerTriggerZone : MonoBehaviour
{
    public bool PlayerIsInTriggerZone { get; private set; }
    public UnityEvent onPlayerEnter;
    public UnityEvent onPlayerExit;
    // when player enters, scale by this.
    // Mitigates jittering enter/exit on the near the edge of the collider.
    public float multiplyScaleOnEnter = 1.1f; 
    private Vector3 startScale;
    void Awake() {
        startScale = transform.localScale;
    }

    private void OnTriggerEnter(Collider other)
    {
        Player player = other.GetComponent<Player>();
        if (player)
        {
            Log("Enter");
            PlayerIsInTriggerZone = true;
            // multiply scale to avoid trigger jitter
            transform.localScale = startScale * multiplyScaleOnEnter; 
            onPlayerEnter.Invoke();
        }
    }

    private void OnTriggerExit(Collider other)
    {
        Player player = other.GetComponent<Player>();
        if (player)
        {
            Log("Exit");
            PlayerIsInTriggerZone = false;
             // return to original scale
            transform.localScale = startScale;
            onPlayerExit.Invoke();
        }
    }

    private void Log(string message) {
        Debug.Log($"[PlayerTriggerZone] [{gameObject}] [{transform.root.gameObject.name}] {message}", gameObject);
    }
    
}
