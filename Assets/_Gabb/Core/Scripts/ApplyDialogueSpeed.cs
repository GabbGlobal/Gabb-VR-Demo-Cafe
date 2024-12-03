using UnityEngine;

[RequireComponent(typeof(AudioSource))]
public class ApplyDialogueSpeed : MonoBehaviour
{
    private AudioSource audioSource;

    void Awake() {
        audioSource = GetComponent<AudioSource>();
    }

    // Update is called once per frame
    void Update()
    {
        // this increases tempo which we do want
        // but also pitch which we don't want
        // see SpeechTempoUI for the code the corrects unwanted pitch shifting.
        audioSource.pitch = SpeechTempoUI.Instance.SpeechTempoMultiplier;

    }
}
