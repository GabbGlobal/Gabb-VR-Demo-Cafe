using System;
using System.IO;
using UnityEngine;
#if UNITY_ANDROID && !UNITY_EDITOR
using UnityEngine.Android;
#endif

public class MicRecorder : MonoBehaviour
{
    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    static void RequestMicPermissionOnStart()
    {
#if UNITY_ANDROID && !UNITY_EDITOR
        if (!Permission.HasUserAuthorizedPermission(Permission.Microphone))
            Permission.RequestUserPermission(Permission.Microphone);
#endif
    }

    [Header("Recording Settings")]
    [SerializeField] private float silenceThreshold = 0.01f;
    [SerializeField] private float silenceDuration = 1.2f;
    [SerializeField] private float maxDuration = 15f;
    [SerializeField] private int sampleRate = 16000;

    private AudioClip clip;
    private string device;
    private bool recording;
    private bool hasSpoken;
    private float silenceTimer;
    private float elapsed;
    private float currentVolume;

    public bool IsRecording => recording;
    public bool HasSpoken => hasSpoken;
    public float CurrentVolume => currentVolume;
    public float Elapsed => elapsed;
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
        hasSpoken = false;
        silenceTimer = 0f;
        elapsed = 0f;
        currentVolume = 0f;
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
        Debug.Log($"[MicRecorder] Recording stopped. {elapsed:F1}s, {position} samples, hasSpoken={hasSpoken}");
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

        currentVolume = GetVolume();
        OnVolume?.Invoke(currentVolume);

        if (currentVolume >= silenceThreshold)
        {
            hasSpoken = true;
            silenceTimer = 0f;
        }
        else if (hasSpoken)
        {
            silenceTimer += Time.deltaTime;
            if (silenceTimer >= silenceDuration)
                StopRecording();
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
