using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using Microsoft.CognitiveServices.Speech;
using Microsoft.CognitiveServices.Speech.Audio;
using Microsoft.CognitiveServices.Speech.PronunciationAssessment;
using System.Threading.Tasks;
using System.Linq;
using UnityEngine.Networking;

public class PronunciationAssessor : MonoBehaviour
{

    // -- Azure API Management --
    // Request a speech token from this URL
    private string APIM_ENDPOINT = "https://speech-apim.azure-api.net/speech/token";
    // Subscription key for requesting a token via Azure APIM.
    // Not a true secret because this can easily be obtained from a decompiled APK.
    // True secret subscription keys do not need to be and should not be in the Unity project at all anymore.
    private const string APIM_SUBSCRIPTION_KEY = "41f39d5a6b424fa58c31b9f1e8d16fa9";
    private const int TOKEN_EXPIRATION_BUFFER_SECCONDS = 120; // 2 minute buffer so token is refreshed early with time to spare
    // the token we will get back from APIM and pass to the Speech SDK
    private string tokenFromAPIM = "";
    private System.DateTime? tokenExpirationTime; // cached time the current token will expire

    // -- Azure Speech Recongiton --
    //private const string SubscriptionKey = "key"; // DO NOT COMMIT THE SECRET KEY. 
    private const string AZURE_REGION = "eastus";
    // Must be a BCP-47 locale value https://gist.github.com/typpo/b2b828a35e683b9bf8db91b5404f1bd1
    // es-ES is Castilian Spanish (as spoken in Central-Northern Spain)
    private const string languageCode = "es-ES";
    private SpeechConfig speechConfig;
    private AudioConfig audioConfig;

    // -- public inspector variables --
    public bool englishTestingMode = false; // if true, just say "test" in US English for faster testing.

    // singleton
    public static PronunciationAssessor Instance { get; private set; }
    void Awake()
    {
        if (Instance == null)
        {
            DestroyImmediate(Instance);
        }
        Instance = this;
    }

    async void Start()
    {
        await RefreshSpeechSDKConfig();
    }

    async Awaitable RefreshSpeechSDKConfig()
    {
        if (!IsTokenValid())
        {
            Log("Need a new token from APIM, getting one now...");
            await GetTokenFromAPIM();
            ConfigureSpeechSDK();
        }
    }

    private async Awaitable GetTokenFromAPIM()
    {
        Log("Requesting authorization token from APIM");
        UnityWebRequest request = new UnityWebRequest(APIM_ENDPOINT, UnityWebRequest.kHttpVerbPOST);
        request.SetRequestHeader("Ocp-Apim-Subscription-Key", APIM_SUBSCRIPTION_KEY);
        request.downloadHandler = new DownloadHandlerBuffer();
        await request.SendWebRequest();

        if (request.result == UnityWebRequest.Result.Success)
        {
            Log("Got token from APIM");
            tokenFromAPIM = request.downloadHandler.text;
            tokenExpirationTime = JWTUtil.GetTokenExpiration(tokenFromAPIM);
            Log($"Got token from APIM");
        }
        else
        {
            LogError("Failed to get token: " + request.error);
            LogError(request.downloadHandler.text);
            LogError(request.responseCode.ToString());
        }
        request.Dispose();
    }

    private bool IsTokenValid()
    {
        // if token exists and is not going to expire soon
        return !string.IsNullOrEmpty(tokenFromAPIM) &&
            tokenExpirationTime.HasValue &&
            System.DateTime.UtcNow < tokenExpirationTime.Value.AddSeconds(-TOKEN_EXPIRATION_BUFFER_SECCONDS);
    }

    void ConfigureSpeechSDK()
    {
        Log("Configuring Speech SDK...");
        // Configuer speech sdk
        speechConfig = SpeechConfig.FromAuthorizationToken(
            tokenFromAPIM,
            AZURE_REGION);
        speechConfig.SpeechRecognitionLanguage = languageCode;  // Apply language setting

        // Use US English for testing if enabled
        if (Debug.isDebugBuild && englishTestingMode)
        {
            speechConfig.SpeechRecognitionLanguage = "en-US"; // use US english for testing only
        }

        audioConfig = AudioConfig.FromDefaultMicrophoneInput();
        Log("Configuring Speech SDK done.");
    }

    public async Awaitable<AssessmentResult> AssessPronunciation(string referenceText)
    {
        await RefreshSpeechSDKConfig(); // always make sure speech sdk config is valid before assessment
        if (Debug.isDebugBuild && englishTestingMode)
        {
            referenceText = "Test"; // Say "Test" in US english. For testing only.
        }
        Log($"[AssessPronunciation] referenceText: {referenceText}");
        await Awaitable.BackgroundThreadAsync();
        AssessmentResult result = await AssessWithSpeechRecognition(referenceText);
        if (result != null)
        {
            Log($"[AssessPronunciation] result not null");
            LogAssessmentResult(result);
        }
        else
        {
            Log("[AssessPronunciation]  No speech recognized or assessment failed.");
            //interactionManager.HandleIncorrectPronunciation();  // Call HandleIncorrectPronunciation on failure
        }
        Debug.Log("End of AssessPronunciation");
        await Awaitable.MainThreadAsync();
        return result;
    }

    private async Awaitable<AssessmentResult> AssessWithSpeechRecognition(string referenceText)
    {
        Log($"[AssessPronunciationAsync] referenceText: {referenceText}");
        using (var recognizer = new SpeechRecognizer(speechConfig, audioConfig))
        {
            var pronunciationAssessmentConfig = new PronunciationAssessmentConfig(
                referenceText,
                GradingSystem.HundredMark,
                Granularity.Phoneme,
                true
            );
            pronunciationAssessmentConfig.ApplyTo(recognizer);

            var taskCompletionSource = new TaskCompletionSource<SpeechRecognitionResult>();
            recognizer.Recognized += (s, e) =>
            {
                Log($"[AssessPronunciationAsync] s: {s} e: {e} {e.Result}");
                if (e.Result.Reason == ResultReason.RecognizedSpeech)
                {
                    taskCompletionSource.TrySetResult(e.Result);
                }
            };

            recognizer.Canceled += (s, e) =>
            {
                taskCompletionSource.TrySetCanceled();
            };

            await recognizer.StartContinuousRecognitionAsync();

            var timeoutTask = Task.Delay(10000);  // 10-second timeout
            var completedTask = await Task.WhenAny(taskCompletionSource.Task, timeoutTask);

            await recognizer.StopContinuousRecognitionAsync();

            if (completedTask == timeoutTask)
            {
                Log("[AssessPronunciationAsync] Speech recognition timeout.");
                return null;
            }

            var speechRecognitionResult = await taskCompletionSource.Task;
            Log("[AssessPronunciationAsync] Recognized: " + speechRecognitionResult.Text);

            // Extract pronunciation assessment results from Properties
            var pronunciationAssessmentResultJson = speechRecognitionResult.Properties.GetProperty(PropertyId.SpeechServiceResponse_JsonResult);
            var pronunciationAssessmentResult = JsonUtility.FromJson<PronunciationAssessmentJsonResult>(pronunciationAssessmentResultJson);

            var pronunciationScore = pronunciationAssessmentResult.NBest[0].PronunciationAssessment.PronScore;
            var fluencyScore = pronunciationAssessmentResult.NBest[0].PronunciationAssessment.FluencyScore;
            var completenessScore = pronunciationAssessmentResult.NBest[0].PronunciationAssessment.CompletenessScore;
            var accuracyScore = pronunciationAssessmentResult.NBest[0].PronunciationAssessment.AccuracyScore;

            // Implement custom scoring
            float customScore = CalculateCustomScore(speechRecognitionResult.Text, referenceText);

            Debug.Log("Returning Assesment Result");
            return new AssessmentResult
            {
                recognized_text = speechRecognitionResult.Text,
                reference_text = referenceText,
                scores = new Scores
                {
                    pronunciation_score = pronunciationScore,
                    fluency_score = fluencyScore,
                    completeness_score = completenessScore,
                    accuracy_score = accuracyScore,
                    custom_score = customScore
                },
                recognition_status = customScore >= 90.0f ? "success" : "failure"
            };
        }
    }

    private float CalculateCustomScore(string recognizedText, string referenceText)
    {
        string[] recognizedWords = NormalizeText(recognizedText).Split(' ');
        string[] referenceWords = NormalizeText(referenceText).Split(' ');

        int matchedWords = recognizedWords.Count(word => referenceWords.Contains(word));
        float wordAccuracy = (float)matchedWords / referenceWords.Length;
        float lengthRatio = Mathf.Min(recognizedWords.Length, referenceWords.Length) /
                            (float)Mathf.Max(recognizedWords.Length, referenceWords.Length);

        return Mathf.Min(100f, 100f * (wordAccuracy * 0.7f + lengthRatio * 0.3f));
    }

    private string NormalizeText(string text)
    {
        return System.Text.RegularExpressions.Regex.Replace(text.ToLower(), @"[^\w\s]", "");
    }

    private void LogAssessmentResult(AssessmentResult result)
    {
        string message = "AssessmentResult:\n"
        + $"Pronunciation Score: {result.scores.pronunciation_score}\n"
        + $"Fluency Score: {result.scores.fluency_score}\n"
        + $"Completeness Score: {result.scores.completeness_score}\n"
        + $"Accuracy Score: {result.scores.accuracy_score}\n"
        + $"Custom Score: {result.scores.custom_score}\n"
        + $"Recognized Text: {result.recognized_text}\n"
        + $"Reference Text: {result.reference_text}\n"
        + $"Recognition Status: {result.recognition_status}";
        Debug.Log(message);

        if (result.recognition_status == "success")
        {
            //interactionManager.HandleCorrectPronunciation();
        }
        else
        {
            //interactionManager.HandleIncorrectPronunciation();
        }
    }

    void Log(string message)
    {
        Debug.Log($"[PronunciationAssesor] {message}");
    }

    void LogError(string message)
    {
        Debug.Log($"[PronunciationAssesor] {message}");
    }

    // Helper classes for result handling
    [System.Serializable]
    private class PronunciationAssessmentJsonResult
    {
        public List<NBestResult> NBest;
    }

    [System.Serializable]
    private class NBestResult
    {
        public PronunciationAssessmentResult PronunciationAssessment;
    }

    [System.Serializable]
    private class PronunciationAssessmentResult
    {
        public float PronScore;
        public float FluencyScore;
        public float CompletenessScore;
        public float AccuracyScore;
    }

    [System.Serializable]
    public class AssessmentResult
    {
        public string recognized_text;
        public string reference_text;
        public Scores scores;
        public string recognition_status;
    }

    [System.Serializable]
    public class Scores
    {
        public float pronunciation_score;
        public float fluency_score;
        public float completeness_score;
        public float accuracy_score;
        public float custom_score;
    }
}
