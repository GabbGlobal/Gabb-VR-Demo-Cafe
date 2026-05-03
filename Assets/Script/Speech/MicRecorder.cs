using System;
using System.IO;
using UnityEngine;

public class MicRecorder : MonoBehaviour
{
    [Header("Recording Settings")]
    [SerializeField] private float silenceThreshold = 0.02f;
    [SerializeField] private float silenceDuration = 1.5f;
    [SerializeField] private float maxDuration = 15f;
    [SerializeField] private int sampleRate = 16000;

    private AudioClip clip;
    private string device;
    private bool recording;
    private float silenceTimer;
    private float elapsed;

    public bool IsRecording => recording;
    public event Action OnStarted;
    public event Action<float> OnVolume;
    public event Action<byte[]> OnComplete;

    public void StartRecording()
    {
        if (recording) return;
        device = Microphone.devices.Length > 0 ? Microphone.devices[0] : null;
        if (device == null)
        {
            Debug.LogError("[MicRecorder] No microphone found");
            OnComplete?.Invoke(null);
            return;
        }

        clip = Microphone.Start(device, false, Mathf.CeilToInt(maxDuration) + 1, sampleRate);
        recording = true;
        silenceTimer = 0f;
        elapsed = 0f;
        Debug.Log($"[MicRecorder] Recording started on '{device}' at {sampleRate}Hz");
        OnStarted?.Invoke();
    }

    public void StopRecording()
    {
        if (!recording) return;
        int position = Microphone.GetPosition(device);
        Microphone.End(device);
        recording = false;

        if (position <= 0 || clip == null)
        {
            Debug.LogWarning("[MicRecorder] No audio captured");
            OnComplete?.Invoke(null);
            return;
        }

        float[] samples = new float[position * clip.channels];
        clip.GetData(samples, 0);
        byte[] wav = EncodeWav(samples, clip.channels, sampleRate);
        Debug.Log($"[MicRecorder] Recording stopped. {position} samples, {wav.Length} bytes WAV");
        OnComplete?.Invoke(wav);
    }

    void Update()
    {
        if (!recording) return;

        elapsed += Time.deltaTime;
        if (elapsed >= maxDuration)
        {
            StopRecording();
            return;
        }

        float vol = GetVolume();
        OnVolume?.Invoke(vol);

        if (vol < silenceThreshold)
        {
            silenceTimer += Time.deltaTime;
            if (silenceTimer >= silenceDuration && elapsed > 1f)
                StopRecording();
        }
        else
        {
            silenceTimer = 0f;
        }
    }

    private float GetVolume()
    {
        int pos = Microphone.GetPosition(device);
        if (pos <= 0) return 0f;

        int window = Mathf.Min(256, pos);
        float[] buf = new float[window];
        clip.GetData(buf, pos - window);

        float sum = 0f;
        for (int i = 0; i < buf.Length; i++)
            sum += Mathf.Abs(buf[i]);
        return sum / window;
    }

    private static byte[] EncodeWav(float[] samples, int channels, int rate)
    {
        using var ms = new MemoryStream();
        using var w = new BinaryWriter(ms);

        int bits = 16;
        int dataSize = samples.Length * bits / 8;

        w.Write(System.Text.Encoding.ASCII.GetBytes("RIFF"));
        w.Write(36 + dataSize);
        w.Write(System.Text.Encoding.ASCII.GetBytes("WAVE"));
        w.Write(System.Text.Encoding.ASCII.GetBytes("fmt "));
        w.Write(16);
        w.Write((short)1);
        w.Write((short)channels);
        w.Write(rate);
        w.Write(rate * channels * bits / 8);
        w.Write((short)(channels * bits / 8));
        w.Write((short)bits);
        w.Write(System.Text.Encoding.ASCII.GetBytes("data"));
        w.Write(dataSize);

        for (int i = 0; i < samples.Length; i++)
        {
            short pcm = (short)(Mathf.Clamp(samples[i], -1f, 1f) * short.MaxValue);
            w.Write(pcm);
        }

        return ms.ToArray();
    }
}
