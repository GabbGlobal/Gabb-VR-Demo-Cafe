public class VoiceActivityDetector
{
    private readonly float threshold;
    private readonly float requiredSilence;
    private readonly float minSpeechDuration;

    private float silenceTimer;
    private float speechTimer;
    private bool hasSpokeOnce;

    public bool IsSpeaking { get; private set; }
    public bool SilenceDetected { get; private set; }
    public float ElapsedSpeech => speechTimer;
    public bool HasSpoken => hasSpokeOnce;

    public VoiceActivityDetector(float threshold = 0.02f, float requiredSilence = 1.5f, float minSpeechDuration = 0.3f)
    {
        this.threshold = threshold;
        this.requiredSilence = requiredSilence;
        this.minSpeechDuration = minSpeechDuration;
    }

    public void Reset()
    {
        silenceTimer = 0f;
        speechTimer = 0f;
        hasSpokeOnce = false;
        IsSpeaking = false;
        SilenceDetected = false;
    }

    public void Update(float volume, float deltaTime)
    {
        if (SilenceDetected) return;

        if (volume >= threshold)
        {
            IsSpeaking = true;
            hasSpokeOnce = true;
            silenceTimer = 0f;
            speechTimer += deltaTime;
        }
        else
        {
            IsSpeaking = false;
            if (hasSpokeOnce && speechTimer >= minSpeechDuration)
            {
                silenceTimer += deltaTime;
                if (silenceTimer >= requiredSilence)
                    SilenceDetected = true;
            }
        }
    }
}
