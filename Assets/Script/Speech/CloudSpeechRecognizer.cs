using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;

public class CloudSpeechRecognizer : MonoBehaviour
{
    public static CloudSpeechRecognizer Instance { get; private set; }

    [Header("Whisper API")]
    [SerializeField] private string apiKey;
    [SerializeField] private string endpoint = "https://api.openai.com/v1/audio/transcriptions";
    [SerializeField] private string language = "es";
    [SerializeField] private string model = "whisper-1";

    [Header("Settings")]
    [Tooltip("Enable to send recordings to Whisper for word-level grading after cadence check")]
    public bool useWhisper = true;

    [Header("Custom Endpoint (leave blank to use Whisper directly)")]
    [Tooltip("If set, audio is POSTed here instead. Expects JSON { text: '...' } response.")]
    [SerializeField] private string customEndpoint;

    public bool IsAvailable => useWhisper && !string.IsNullOrEmpty(apiKey);

    void Awake()
    {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    public void SetApiKey(string key) => apiKey = key;
    public void SetLanguage(string lang) { language = lang; Debug.Log($"[CloudSTT] Language set to {lang}"); }

    public async Task<string> Transcribe(byte[] wavData)
    {
        if (wavData == null || wavData.Length == 0)
        {
            Debug.LogWarning("[CloudSTT] No audio data to transcribe");
            return null;
        }

        string url = string.IsNullOrEmpty(customEndpoint) ? endpoint : customEndpoint;
        bool isWhisper = string.IsNullOrEmpty(customEndpoint);

        Debug.Log($"[CloudSTT] Sending {wavData.Length} bytes to {(isWhisper ? "Whisper API" : "custom endpoint")}");
        var startTime = DateTime.UtcNow;

        try
        {
            List<IMultipartFormSection> form = new List<IMultipartFormSection>
            {
                new MultipartFormFileSection("file", wavData, "audio.wav", "audio/wav")
            };

            if (isWhisper)
            {
                form.Add(new MultipartFormDataSection("model", model));
                form.Add(new MultipartFormDataSection("language", language));
                form.Add(new MultipartFormDataSection("response_format", "json"));
            }
            else
            {
                form.Add(new MultipartFormDataSection("language", language));
            }

            using var request = UnityWebRequest.Post(url, form);

            if (isWhisper && !string.IsNullOrEmpty(apiKey))
                request.SetRequestHeader("Authorization", $"Bearer {apiKey}");
            else if (!isWhisper && !string.IsNullOrEmpty(apiKey))
                request.SetRequestHeader("x-api-key", apiKey);

            await request.SendWebRequest();

            float latency = (float)(DateTime.UtcNow - startTime).TotalMilliseconds;

            if (request.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError($"[CloudSTT] Request failed: {request.error}\n{request.downloadHandler.text}");
                return null;
            }

            string json = request.downloadHandler.text;
            var result = JsonUtility.FromJson<TranscribeResponse>(json);
            string text = result?.text?.Trim();

            Debug.Log($"[CloudSTT] Transcribed in {latency:F0}ms: \"{text}\"");
            return text;
        }
        catch (Exception ex)
        {
            Debug.LogError($"[CloudSTT] Exception: {ex.Message}");
            return null;
        }
    }

    [Serializable]
    private class TranscribeResponse
    {
        public string text;
    }
}
