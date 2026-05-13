using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;

public class SpeechAceClient : MonoBehaviour
{
    public static SpeechAceClient Instance { get; private set; }

    [Header("SpeechAce API")]
    [SerializeField] private string apiKey;
    [SerializeField] private string dialect = "es-mx";

    [Header("Settings")]
    [Tooltip("Enable to send recordings to SpeechAce for pronunciation scoring after cadence check")]
    public bool useSpeechAce = true;

    public bool IsAvailable => useSpeechAce && !string.IsNullOrEmpty(apiKey);

    void Awake()
    {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    public void SetApiKey(string key) => apiKey = key;

    public async Task<SpeechAceResult> ScoreAsync(byte[] wavData, string referenceText)
    {
        if (wavData == null || wavData.Length == 0)
        {
            Debug.LogWarning("[SpeechAce] No audio data");
            return null;
        }

        string url = $"https://api.speechace.co/api/scoring/text/v9/json?key={Uri.EscapeDataString(apiKey)}&dialect={dialect}&user_id=gabb-vr";

        Debug.Log($"[SpeechAce] Scoring {wavData.Length} bytes against \"{referenceText}\"");
        var startTime = DateTime.UtcNow;

        try
        {
            var form = new List<IMultipartFormSection>
            {
                new MultipartFormDataSection("text", referenceText),
                new MultipartFormDataSection("question_info", "u]"),
                new MultipartFormFileSection("user_audio_file", wavData, "audio.wav", "audio/wav")
            };

            using var request = UnityWebRequest.Post(url, form);
            await request.SendWebRequest();

            float latency = (float)(DateTime.UtcNow - startTime).TotalMilliseconds;

            if (request.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError($"[SpeechAce] Failed: {request.error}\n{request.downloadHandler.text}");
                return null;
            }

            string json = request.downloadHandler.text;
            Debug.Log($"[SpeechAce] Response in {latency:F0}ms: {json}");

            var response = JsonUtility.FromJson<SpeechAceResponse>(json);

            if (response.status != "success")
            {
                Debug.LogWarning($"[SpeechAce] Status: {response.status} — {response.detail_message}");
                return null;
            }

            return ParseResult(response, referenceText);
        }
        catch (Exception ex)
        {
            Debug.LogError($"[SpeechAce] Exception: {ex.Message}");
            return null;
        }
    }

    private SpeechAceResult ParseResult(SpeechAceResponse response, string referenceText)
    {
        var ts = response.text_score;
        if (ts == null) return null;

        var result = new SpeechAceResult
        {
            overallScore = ts.quality_score,
            referenceText = referenceText
        };

        if (ts.word_score_list != null)
        {
            result.words = new SpeechAceWordScore[ts.word_score_list.Length];
            for (int i = 0; i < ts.word_score_list.Length; i++)
            {
                var ws = ts.word_score_list[i];
                result.words[i] = new SpeechAceWordScore
                {
                    word = ws.word,
                    qualityScore = ws.quality_score
                };
            }
        }

        return result;
    }

    [Serializable] private class SpeechAceResponse
    {
        public string status;
        public string detail_message;
        public TextScore text_score;
    }

    [Serializable] private class TextScore
    {
        public float quality_score;
        public WordScore[] word_score_list;
    }

    [Serializable] private class WordScore
    {
        public string word;
        public float quality_score;
    }
}

public class SpeechAceResult
{
    public float overallScore;
    public string referenceText;
    public SpeechAceWordScore[] words;
}

public class SpeechAceWordScore
{
    public string word;
    public float qualityScore;
}
