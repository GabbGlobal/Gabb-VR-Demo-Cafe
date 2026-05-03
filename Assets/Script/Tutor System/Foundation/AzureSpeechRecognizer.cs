using UnityEngine;
using Microsoft.CognitiveServices.Speech;
using Microsoft.CognitiveServices.Speech.Audio;
using Microsoft.CognitiveServices.Speech.PronunciationAssessment;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine.Networking;
using System;

public class AzureSpeechRecognizer : MonoBehaviour
{
    public static AzureSpeechRecognizer Instance { get; private set; }

    [Header("Azure Speech Settings")]
    public string apimKey = "41f39d5a6b424fa58c31b9f1e8d16fa9";
    public string apimEndpoint = "https://speech-apim.azure-api.net/speech/token";
    public string azureRegion = "eastus";
    public string languageCode = "es-ES";

    [Header("Behavior")]
    [SerializeField] private bool autoStart = true;

    [Header("Debug / Testing")]
    public bool debugMode = false;
    public bool englishTestingMode = false;
    [Range(0, 100)] public float debugPronunciationScore = 85f;
    [Range(0, 100)] public float debugAccuracyScore = 90f;
    [Range(0, 100)] public float debugFluencyScore = 80f;
    [Range(0, 100)] public float debugCompletenessScore = 100f;

    [Header("Listening Indicator")]
    public GameObject listeningIndicator;
    private Material indicatorMaterial;
    private readonly Color listeningColor = Color.green;
    private readonly Color idleColor = Color.red;

    [Header("Recognition Control")]
    public bool canListen = false;      // your existing �gate�
    public bool IsListening { get; private set; }  // <- new: actual engine state

    public static event Action<PronunciationResult> OnPronunciationScored;

    private string authToken;
    private SpeechRecognizer recognizer;
    private SpeechConfig speechConfig;
    private bool wasListeningBeforeAssessment = false;

    private readonly ConcurrentQueue<Action> mainThreadQueue = new ConcurrentQueue<Action>();

    void Awake()
    {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    private async void Start()
    {
        await InitializeRecognizer();

        if (listeningIndicator != null)
        {
            var originalMaterial = listeningIndicator.GetComponent<Renderer>().material;
            indicatorMaterial = new Material(originalMaterial);
            listeningIndicator.GetComponent<Renderer>().material = indicatorMaterial;
            indicatorMaterial.color = idleColor;
        }

        if (autoStart) _ = StartListening();  // keep current behavior unless you turn it off
    }

    private void Update()
    {
        while (mainThreadQueue.TryDequeue(out var action))
            action.Invoke();
    }

    private async Task InitializeRecognizer()
    {
        if (recognizer != null) return;

        await GetToken();

        speechConfig = SpeechConfig.FromAuthorizationToken(authToken, azureRegion);
        speechConfig.SpeechRecognitionLanguage = languageCode;

        var audioConfig = AudioConfig.FromDefaultMicrophoneInput();
        recognizer = new SpeechRecognizer(speechConfig, audioConfig);

        recognizer.Recognizing += (s, e) =>
        {
            if (!canListen) return;
            SetIndicatorListening();
            if (e.Result.Reason == ResultReason.RecognizingSpeech)
            {
                string partialText = CleanRecognizedText(e.Result.Text);
                mainThreadQueue.Enqueue(() =>
                {
                    var wordFlow = FindFirstObjectByType<WordFlowManager>();
                    if (wordFlow != null) wordFlow.ShowPartialRecognition(partialText);
                });
            }
        };

        recognizer.Recognized += (s, e) =>
        {
            if (!canListen) return;
            if (e.Result.Reason == ResultReason.RecognizedSpeech)
            {
                string resultText = CleanRecognizedText(e.Result.Text);
                mainThreadQueue.Enqueue(() =>
                {
                    var wordFlow = FindFirstObjectByType<WordFlowManager>();
                    if (wordFlow != null) wordFlow.CheckRecognizedWord(resultText);
                    else Debug.LogWarning("[Azure] WordFlowManager not found.");
                });
            }
        };

        recognizer.Canceled += (s, e) =>
        {
            Debug.LogWarning("[Azure] Recognition canceled: " + e.ErrorDetails);
            SetIndicatorIdle();
            IsListening = false;
        };

        recognizer.SessionStopped += (s, e) =>
        {
            Debug.LogWarning("[Azure] Session stopped.");
            SetIndicatorIdle();
            IsListening = false;
        };
    }

    // ---------- Pronunciation Assessment API ----------

    public async Task<PronunciationResult> AssessPronunciation(string referenceText)
    {
        if (!canListen)
        {
            Debug.Log("[Azure] AssessPronunciation blocked — canListen is false.");
            return null;
        }

        if (debugMode)
            return BuildDebugResult(referenceText);

        string assessText = (Debug.isDebugBuild && englishTestingMode) ? "Test" : referenceText;
        string assessLang = (Debug.isDebugBuild && englishTestingMode) ? "en-US" : languageCode;

        wasListeningBeforeAssessment = IsListening;
        if (IsListening)
        {
            await recognizer.StopContinuousRecognitionAsync();
            IsListening = false;
            Debug.Log("[Azure] Paused continuous recognition for assessment.");
        }

        var startTime = DateTime.UtcNow;

        try
        {
            await GetToken();

            var assessConfig = SpeechConfig.FromAuthorizationToken(authToken, azureRegion);
            assessConfig.SpeechRecognitionLanguage = assessLang;

            var pronConfig = new PronunciationAssessmentConfig(
                assessText,
                GradingSystem.HundredMark,
                Granularity.Phoneme,
                true
            );

            using var audioConfig = AudioConfig.FromDefaultMicrophoneInput();
            using var assessRecognizer = new SpeechRecognizer(assessConfig, audioConfig);
            pronConfig.ApplyTo(assessRecognizer);

            var tcs = new TaskCompletionSource<SpeechRecognitionResult>();

            assessRecognizer.Recognized += (s, e) =>
            {
                if (e.Result.Reason == ResultReason.RecognizedSpeech)
                    tcs.TrySetResult(e.Result);
            };

            assessRecognizer.Canceled += (s, e) =>
            {
                Debug.LogWarning("[Azure] Assessment canceled: " + e.ErrorDetails);
                tcs.TrySetCanceled();
            };

            await assessRecognizer.StartContinuousRecognitionAsync();

            var timeoutTask = Task.Delay(10000);
            var completedTask = await Task.WhenAny(tcs.Task, timeoutTask);

            await assessRecognizer.StopContinuousRecognitionAsync();

            if (completedTask == timeoutTask)
            {
                Debug.Log("[Azure] Assessment timed out — no speech detected.");
                return null;
            }

            if (tcs.Task.IsCanceled)
                return null;

            var speechResult = await tcs.Task;
            var jsonResult = speechResult.Properties.GetProperty(PropertyId.SpeechServiceResponse_JsonResult);
            var parsed = JsonUtility.FromJson<PronunciationAssessmentJsonResult>(jsonResult);
            var scores = parsed.NBest[0].PronunciationAssessment;

            float latency = (float)(DateTime.UtcNow - startTime).TotalMilliseconds;

            var result = new PronunciationResult
            {
                recognizedText = CleanRecognizedText(speechResult.Text),
                referenceText = referenceText,
                pronunciationScore = scores.PronScore,
                accuracyScore = scores.AccuracyScore,
                fluencyScore = scores.FluencyScore,
                completenessScore = scores.CompletenessScore,
                passed = scores.PronScore >= 80f,
                latencyMs = latency
            };

            Debug.Log($"[Azure] Assessment: {result.pronunciationScore}/100 " +
                      $"(Acc:{result.accuracyScore} Flu:{result.fluencyScore} Comp:{result.completenessScore}) " +
                      $"in {latency:F0}ms");

            mainThreadQueue.Enqueue(() => OnPronunciationScored?.Invoke(result));
            return result;
        }
        catch (Exception ex)
        {
            Debug.LogError("[Azure] Assessment failed: " + ex.Message);
            return null;
        }
        finally
        {
            if (wasListeningBeforeAssessment)
            {
                await recognizer.StartContinuousRecognitionAsync();
                IsListening = true;
                Debug.Log("[Azure] Resumed continuous recognition after assessment.");
            }
        }
    }

    private PronunciationResult BuildDebugResult(string referenceText)
    {
        var result = new PronunciationResult
        {
            recognizedText = referenceText,
            referenceText = referenceText,
            pronunciationScore = debugPronunciationScore,
            accuracyScore = debugAccuracyScore,
            fluencyScore = debugFluencyScore,
            completenessScore = debugCompletenessScore,
            passed = debugPronunciationScore >= 80f,
            latencyMs = 0f
        };
        Debug.Log($"[Azure][DEBUG] Mock assessment: {result.pronunciationScore}/100");
        mainThreadQueue.Enqueue(() => OnPronunciationScored?.Invoke(result));
        return result;
    }

    // ---------- Public control API ----------

    public async Task StartListening()
    {
        canListen = true;                       // allow callbacks
        await InitializeRecognizer();           // ensure built
        if (recognizer == null || IsListening) return;

        await recognizer.StartContinuousRecognitionAsync();
        IsListening = true;
        SetIndicatorListening();
        Debug.Log("[Azure] Speech recognizer started.");
    }

    public async Task StopListening()
    {
        // Hard stop: block callbacks FIRST, then stop engine.
        canListen = false;

        if (recognizer != null && IsListening)
        {
            await recognizer.StopContinuousRecognitionAsync();
            IsListening = false;
            Debug.Log("[Azure] Speech recognizer stopped.");
        }

        SetIndicatorIdle();
    }

    // ---------------------------------------

    private async Task GetToken()
    {
        using var request = new UnityWebRequest(apimEndpoint, "POST");
        request.SetRequestHeader("Ocp-Apim-Subscription-Key", apimKey);
        request.downloadHandler = new DownloadHandlerBuffer();
        await request.SendWebRequest();

        if (request.result == UnityWebRequest.Result.Success)
            authToken = request.downloadHandler.text;
        else
            Debug.LogError("Failed to get Azure token: " + request.error);
    }

    private string CleanRecognizedText(string text)
    {
        return text.Trim().TrimEnd('.').ToLowerInvariant();
    }

    public void SetIndicatorListening()
    {
        if (indicatorMaterial != null) indicatorMaterial.color = listeningColor;
    }

    public void SetIndicatorIdle()
    {
        if (indicatorMaterial != null) indicatorMaterial.color = idleColor;
    }

    private async void OnDestroy()
    {
        try { await StopListening(); } catch { /* ignore */ }
        recognizer?.Dispose();
    }

    // ---------- JSON parsing for Azure pronunciation response ----------

    [Serializable]
    private class PronunciationAssessmentJsonResult
    {
        public List<NBestResult> NBest;
    }

    [Serializable]
    private class NBestResult
    {
        public PronunciationAssessmentScores PronunciationAssessment;
    }

    [Serializable]
    private class PronunciationAssessmentScores
    {
        public float PronScore;
        public float AccuracyScore;
        public float FluencyScore;
        public float CompletenessScore;
    }
}