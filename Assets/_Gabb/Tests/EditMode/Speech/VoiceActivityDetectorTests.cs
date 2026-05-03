using NUnit.Framework;

public class VoiceActivityDetectorTests
{
    private const float DT = 1f / 60f; // simulate 60fps

    // --- Silence detection ---

    [Test]
    public void PureSilence_NeverDetectsSilence_BecauseNeverSpoke()
    {
        var vad = new VoiceActivityDetector(threshold: 0.02f, requiredSilence: 1.5f);
        for (int i = 0; i < 300; i++) // 5 seconds of silence
            vad.Update(0.001f, DT);
        Assert.IsFalse(vad.SilenceDetected);
        Assert.IsFalse(vad.HasSpoken);
    }

    [Test]
    public void SpeakThenSilence_DetectsSilenceAfterThreshold()
    {
        var vad = new VoiceActivityDetector(threshold: 0.02f, requiredSilence: 1.5f);

        // Speak for 1 second
        for (int i = 0; i < 60; i++)
            vad.Update(0.1f, DT);
        Assert.IsTrue(vad.HasSpoken);
        Assert.IsFalse(vad.SilenceDetected);

        // Silent for 1 second — not enough
        for (int i = 0; i < 60; i++)
            vad.Update(0.001f, DT);
        Assert.IsFalse(vad.SilenceDetected);

        // Silent for 1 more second — now over 1.5s total
        for (int i = 0; i < 60; i++)
            vad.Update(0.001f, DT);
        Assert.IsTrue(vad.SilenceDetected);
    }

    [Test]
    public void SpeakPauseSpeakSilence_OnlyDetectsAfterFinalSilence()
    {
        var vad = new VoiceActivityDetector(threshold: 0.02f, requiredSilence: 1.5f);

        // Speak 0.5s
        for (int i = 0; i < 30; i++)
            vad.Update(0.1f, DT);

        // Brief pause 0.5s — shouldn't trigger
        for (int i = 0; i < 30; i++)
            vad.Update(0.001f, DT);
        Assert.IsFalse(vad.SilenceDetected);

        // Speak again 0.5s — resets silence timer
        for (int i = 0; i < 30; i++)
            vad.Update(0.08f, DT);
        Assert.IsFalse(vad.SilenceDetected);

        // Final silence 2s — triggers
        for (int i = 0; i < 120; i++)
            vad.Update(0.001f, DT);
        Assert.IsTrue(vad.SilenceDetected);
    }

    // --- IsSpeaking state ---

    [Test]
    public void IsSpeaking_TrueWhileAboveThreshold()
    {
        var vad = new VoiceActivityDetector(threshold: 0.05f);
        vad.Update(0.1f, DT);
        Assert.IsTrue(vad.IsSpeaking);
    }

    [Test]
    public void IsSpeaking_FalseWhenBelowThreshold()
    {
        var vad = new VoiceActivityDetector(threshold: 0.05f);
        vad.Update(0.01f, DT);
        Assert.IsFalse(vad.IsSpeaking);
    }

    // --- Elapsed speech tracking ---

    [Test]
    public void ElapsedSpeech_TracksOnlySpeakingTime()
    {
        var vad = new VoiceActivityDetector(threshold: 0.02f, requiredSilence: 5f);

        // Speak 1s
        for (int i = 0; i < 60; i++)
            vad.Update(0.1f, DT);

        // Silent 1s
        for (int i = 0; i < 60; i++)
            vad.Update(0.001f, DT);

        // Speak 0.5s
        for (int i = 0; i < 30; i++)
            vad.Update(0.1f, DT);

        Assert.That(vad.ElapsedSpeech, Is.EqualTo(1.5f).Within(0.05f));
    }

    // --- Min speech duration ---

    [Test]
    public void VeryBriefNoise_DoesNotTriggerSilenceDetection()
    {
        var vad = new VoiceActivityDetector(threshold: 0.02f, requiredSilence: 1.5f, minSpeechDuration: 0.3f);

        // Tiny spike — 0.1s
        for (int i = 0; i < 6; i++)
            vad.Update(0.1f, DT);

        // Silence 3s
        for (int i = 0; i < 180; i++)
            vad.Update(0.001f, DT);

        // Should NOT detect end-of-speech because 0.1s < 0.3s minSpeech
        Assert.IsFalse(vad.SilenceDetected);
    }

    // --- Reset ---

    [Test]
    public void Reset_ClearsAllState()
    {
        var vad = new VoiceActivityDetector(threshold: 0.02f, requiredSilence: 1f);

        for (int i = 0; i < 60; i++)
            vad.Update(0.1f, DT);
        for (int i = 0; i < 90; i++)
            vad.Update(0.001f, DT);
        Assert.IsTrue(vad.SilenceDetected);

        vad.Reset();
        Assert.IsFalse(vad.SilenceDetected);
        Assert.IsFalse(vad.HasSpoken);
        Assert.IsFalse(vad.IsSpeaking);
        Assert.AreEqual(0f, vad.ElapsedSpeech);
    }
}
