using UnityEngine;
using UnityEngine.Audio;
using UnityEngine.UI;

public class SpeechTempoUI : MonoBehaviour
{
    public const string AUDIOMIXER_PITCH_FLOAT_KEY = "SpeechPitchShift";

    // singleton
    public static SpeechTempoUI Instance;
    public Slider slider;
    void Awake() {
        if (Instance != null) {
            DestroyImmediate(Instance);
        }
        Instance = this;
    }

    public float SpeechTempoMultiplier { get; private set; } = 1f;
    public AudioMixerGroup speechMixerGroup;

    void Start() {
        UpdateAudioMixer();
        slider.onValueChanged.AddListener((value)=> {
            SpeechTempoMultiplier = 1f + (value * 0.25f); // remap slide value range (-2x to 2x) to tempo multiplier (0.5 to 1.5f)
            Debug.Log(SpeechTempoMultiplier);
            UpdateAudioMixer();
        });
    }


    void UpdateAudioMixer() {
        // AudioSource.pitch affects both tempo and pitch,
        // but we only want to increase speech tempo,
        // so we counter-shift the pitch via Audio Mixer
        speechMixerGroup.audioMixer.SetFloat(AUDIOMIXER_PITCH_FLOAT_KEY, 1f / SpeechTempoMultiplier);
    }
}
