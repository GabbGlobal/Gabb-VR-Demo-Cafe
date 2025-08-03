using UnityEngine;

[RequireComponent(typeof(Collider))]
public class SpeechZoneTrigger : MonoBehaviour
{
    private bool playerInside = false;
    public AzureSpeechRecognizer azureRecognizer;

    void OnTriggerEnter(Collider other)
    {
        if (other.CompareTag("Player"))
        {
            azureRecognizer.canListen = true;
            azureRecognizer.SetIndicatorListening();
            Debug.Log("player entered trigger");
        }
    }

    void OnTriggerExit(Collider other)
    {
        if (other.CompareTag("Player"))
        {
            azureRecognizer.canListen = false;
            azureRecognizer.SetIndicatorIdle();
            Debug.Log("player exit trigger");
        }
    }
}
