using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using Microsoft.CognitiveServices.Speech;
using Microsoft.CognitiveServices.Speech.Audio;
using Microsoft.CognitiveServices.Speech.PronunciationAssessment;
using System.Threading.Tasks;
using System.Linq;
using Newtonsoft.Json;

public class PronunciationAssessor : MonoBehaviour
{
    // Azure Speech Recongiton config
    //private const string SubscriptionKey = "key"; // DO NOT COMMIT THE SECRET KEY. 
    private const string Region = "eastus";
    // Must be a BCP-47 locale value https://gist.github.com/typpo/b2b828a35e683b9bf8db91b5404f1bd1
    // es-ES is Castilian Spanish (as spoken in Central-Northern Spain)
    private const string languageCode = "es-ES";

    private SpeechConfig speechConfig;
    private AudioConfig audioConfig;

    // Reference to InteractionManager
    private InteractionManager interactionManager;
    public bool englishTestingMode = false; // if true, just say "Test" in US English. For faster testing.
    private const string englishTestPhrase = "Test";
    // singleton
    public static PronunciationAssessor Instance {get; private set;}
    void Awake() {
        if (Instance == null) {
            DestroyImmediate(Instance);
        }
        Instance = this;
    }

    IEnumerator Start()
    {
        // Get the InteractionManager component
        interactionManager = FindFirstObjectByType<InteractionManager>();  // Ensure InteractionManager exists in the scene

        // Configuser speech sdk
        speechConfig = SpeechConfig.FromSubscription(
            SecretsManager.Instance.secretsAsset.azureSpeechSubscriptionKey,
            Region);
        speechConfig.SpeechRecognitionLanguage = languageCode;  // Apply language setting

        // Use US English for testing if enabled
        if (Debug.isDebugBuild && englishTestingMode)
        {
            speechConfig.SpeechRecognitionLanguage = "en-US"; // use US english for testing only
        }
        
        audioConfig = AudioConfig.FromDefaultMicrophoneInput();

        yield break;
    }

    public async Awaitable<CustomAssessmentResult> AssessPronunciation(string referenceText)
    {
        if (Debug.isDebugBuild && englishTestingMode)
        {
            referenceText = englishTestPhrase; // Say "Test" or another specified phrase in US english. For testing only.
        }
        Log($"[AssessPronunciation] referenceText: {referenceText}");
        await Awaitable.BackgroundThreadAsync();
        CustomAssessmentResult result = await AssessWithSpeechRecognition(referenceText);
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

    private async Awaitable<CustomAssessmentResult> AssessWithSpeechRecognition(string referenceText)
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
                //Log($"[AssessPronunciationAsync] s: {s} e: {e} {e.Result}");
                Log($"[AssessPronunciationAsync] AAAAAAAAResult: {e.Result}");
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

            SpeechRecognitionResult speechRecognitionResult = await taskCompletionSource.Task;
            Log("[AssessPronunciationAsync] Recognized: " + speechRecognitionResult.Text);

            // Extract pronunciation assessment results from Properties
            var pronunciationAssessmentResultJson = speechRecognitionResult.Properties.GetProperty(PropertyId.SpeechServiceResponse_JsonResult);
            Log(pronunciationAssessmentResultJson);
            var pronunciationAssessmentResult = JsonConvert.DeserializeObject<PronunciationAssessmentResultRoot>(pronunciationAssessmentResultJson);

            var pronunciationScore = pronunciationAssessmentResult.NBest[0].PronunciationAssessment.PronScore;
            var fluencyScore = pronunciationAssessmentResult.NBest[0].PronunciationAssessment.FluencyScore;
            var completenessScore = pronunciationAssessmentResult.NBest[0].PronunciationAssessment.CompletenessScore;
            var accuracyScore = pronunciationAssessmentResult.NBest[0].PronunciationAssessment.AccuracyScore;

            // Implement custom scoring
            float customScore = CalculateCustomScore(speechRecognitionResult.Text, referenceText);

            Debug.Log("Returning Assesment Result");
            return new CustomAssessmentResult
            {
                recognized_text = speechRecognitionResult.Text,
                reference_text = referenceText,
                scores = new CustomScores
                {
                    pronunciation_score = pronunciationScore,
                    fluency_score = fluencyScore,
                    completeness_score = completenessScore,
                    accuracy_score = accuracyScore,
                    custom_score = customScore
                },
                recognition_status = customScore >= 90.0f ? "success" : "failure",
                rawResult = pronunciationAssessmentResult
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

    private void LogAssessmentResult(CustomAssessmentResult result)
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

    // JSON model classes
    [System.Serializable]
    public class PronunciationAssessmentResultRoot
    {
        public string Id { get; set; }
        public string RecognitionStatus { get; set; }
        public int Offset { get; set; }
        public int Duration { get; set; }
        public int Channel { get; set; }
        public string DisplayText { get; set; }
        public float SNR { get; set; }
        public List<NBestModel> NBest { get; set; }
    }

    [System.Serializable]
    public class NBestModel
    {
        public float Confidence { get; set; }
        public string Lexical { get; set; }
        public string ITN { get; set; }
        public string MaskedITN { get; set; }
        public string Display { get; set; }
        public PronunciationAssessmentModel PronunciationAssessment { get; set; }
        public List<WordModel> Words { get; set; }
    }

    public class PhonemeModel
    {
        public string Phoneme { get; set; }
        public PronunciationAssessmentModel PronunciationAssessment { get; set; }
        public int Offset { get; set; }
        public int Duration { get; set; }
    }

    public class PronunciationAssessmentModel
    {
        public float AccuracyScore { get; set; }
        public float FluencyScore { get; set; }
        public float CompletenessScore { get; set; }
        public float PronScore { get; set; }
        public string ErrorType { get; set; }
    }

    public class SyllableModel
    {
        public string Syllable { get; set; }
        public string Grapheme { get; set; }
        public PronunciationAssessmentModel PronunciationAssessment { get; set; }
        public int Offset { get; set; }
        public int Duration { get; set; }
    }

    public class WordModel
    {
        public string Word { get; set; }
        public int Offset { get; set; }
        public int Duration { get; set; }
        public PronunciationAssessmentModel PronunciationAssessment { get; set; }
        public List<SyllableModel> Syllables { get; set; }
        public List<PhonemeModel> Phonemes { get; set; }
    }
    // ----- classes for custom data


    [System.Serializable]
    public class CustomAssessmentResult
    {
        public string recognized_text;
        public string reference_text;
        public CustomScores scores;
        public string recognition_status;
        public PronunciationAssessmentResultRoot rawResult; // raw speech result from Azure Speech
    }

    [System.Serializable]
    public class CustomScores
    {
        public float pronunciation_score;
        public float fluency_score;
        public float completeness_score;
        public float accuracy_score;
        public float custom_score;
    }
}
