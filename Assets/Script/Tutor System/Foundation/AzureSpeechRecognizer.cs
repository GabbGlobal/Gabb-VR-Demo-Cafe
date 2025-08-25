using UnityEngine;
using Microsoft.CognitiveServices.Speech;
using Microsoft.CognitiveServices.Speech.Audio;
using System.Collections.Concurrent;
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
    [SerializeField] private bool autoStart = true;   // <- new: keep old behavior by default

    [Header("Listening Indicator")]
    public GameObject listeningIndicator;
    private Material indicatorMaterial;
    private readonly Color listeningColor = Color.green;
    private readonly Color idleColor = Color.red;

    [Header("Recognition Control")]
    public bool canListen = false;      // your existing “gate”
    public bool IsListening { get; private set; }  // <- new: actual engine state

    private string authToken;
    private SpeechRecognizer recognizer;
    private SpeechConfig speechConfig;

    private readonly ConcurrentQueue<Action> mainThreadQueue = new ConcurrentQueue<Action>();

    void Awake()
    {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }
        Instance = this;
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
       // speechConfig?.Dispose();
    }
}