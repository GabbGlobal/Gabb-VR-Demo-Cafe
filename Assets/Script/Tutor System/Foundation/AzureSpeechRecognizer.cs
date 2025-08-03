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

    [Header("Listening Indicator")]
    public GameObject listeningIndicator;
    private Material indicatorMaterial;
    private Color listeningColor = Color.green;
    private Color idleColor = Color.red;

    [Header("Recognition Control")]
    public bool canListen = false;

    private string authToken;
    private SpeechRecognizer recognizer;
    private SpeechConfig speechConfig;

    private ConcurrentQueue<Action> mainThreadQueue = new ConcurrentQueue<Action>();

    void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }

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
    }

    private void Update()
    {
        // Dispatch queued actions to Unity's main thread
        while (mainThreadQueue.TryDequeue(out var action))
        {
            action.Invoke();
        }
    }

    private async Task InitializeRecognizer()
    {
        await GetToken();

        speechConfig = SpeechConfig.FromAuthorizationToken(authToken, azureRegion);
        speechConfig.SpeechRecognitionLanguage = languageCode;

        var audioConfig = AudioConfig.FromDefaultMicrophoneInput();
        recognizer = new SpeechRecognizer(speechConfig, audioConfig);

        recognizer.Recognizing += (s, e) =>
        {
            if (!canListen) return;
            Debug.Log("[Azure] Recognizing...");
            SetIndicatorListening();
        };

        recognizer.Recognized += (s, e) =>
        {
            if (!canListen) return;

            if (e.Result.Reason == ResultReason.RecognizedSpeech)
            {
                string resultText = CleanRecognizedText(e.Result.Text);
                Debug.Log("[Azure] Cleaned: " + resultText);

                // Queue action to run on Unity main thread
                mainThreadQueue.Enqueue(() =>
                {
                    Debug.Log("[Azure] Executing on main thread.");
                    var wordFlow = FindFirstObjectByType<WordFlowManager>();
                    if (wordFlow != null)
                    {
                        wordFlow.CheckRecognizedWord(resultText);
                    }
                    else
                    {
                        Debug.LogWarning("[Azure] WordFlowManager not found.");
                    }
                });
            }
        };

        recognizer.Canceled += (s, e) =>
        {
            Debug.LogWarning("[Azure] Recognition canceled.");
            SetIndicatorIdle();
        };

        recognizer.SessionStopped += (s, e) =>
        {
            Debug.LogWarning("[Azure] Session stopped.");
            SetIndicatorIdle();
        };

        await recognizer.StartContinuousRecognitionAsync();
        Debug.Log("[Azure] Speech recognizer started.");
    }

    private async Task GetToken()
    {
        UnityWebRequest request = new UnityWebRequest(apimEndpoint, "POST");
        request.SetRequestHeader("Ocp-Apim-Subscription-Key", apimKey);
        request.downloadHandler = new DownloadHandlerBuffer();

        await request.SendWebRequest();

        if (request.result == UnityWebRequest.Result.Success)
        {
            authToken = request.downloadHandler.text;
        }
        else
        {
            Debug.LogError("Failed to get Azure token: " + request.error);
        }
    }

    private string CleanRecognizedText(string text)
    {
        return text.Trim().TrimEnd('.').ToLowerInvariant();
    }

    public void SetIndicatorListening()
    {
        if (indicatorMaterial != null)
            indicatorMaterial.color = listeningColor;
    }

    public void SetIndicatorIdle()
    {
        if (indicatorMaterial != null)
            indicatorMaterial.color = idleColor;
    }
}