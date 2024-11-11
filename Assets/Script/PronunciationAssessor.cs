using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using Microsoft.CognitiveServices.Speech;
using Microsoft.CognitiveServices.Speech.Audio;
using Microsoft.CognitiveServices.Speech.PronunciationAssessment;
using System.Threading.Tasks;
using System.Linq;

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

    IEnumerator Start()
    {
        // Get the InteractionManager component
        interactionManager = FindObjectOfType<InteractionManager>();  // Ensure InteractionManager exists in the scene

        speechConfig = SpeechConfig.FromSubscription(
            SecretsManager.Instance.secretsAsset.azureSpeechSubscriptionKey,
            Region);
        speechConfig.SpeechRecognitionLanguage = languageCode;  // Apply language setting

        // US English language setting for debug only
        if (Debug.isDebugBuild && englishTestingMode)
        {
            speechConfig.SpeechRecognitionLanguage = "en-US"; // use US english for testing only
        }
        
        audioConfig = AudioConfig.FromDefaultMicrophoneInput();

        yield break;
    }



    public void StartAssessment(string referenceText)
    {
        if (Debug.isDebugBuild && englishTestingMode)
        {
            referenceText = "Test"; // Say "Test" in US english. For testing only.
        }
        Log($"[StartAssessment] Assessing pronunciation for: {referenceText}");
        StartCoroutine(AssessPronunciation(referenceText));
    }

    private IEnumerator AssessPronunciation(string referenceText)
    {
        Log($"[AssessPronunciation] referenceText: {referenceText}");
        AssessmentResult result = null;
        yield return StartCoroutine(AssessPronunciationCoroutine(referenceText, r => result = r));

        if (result != null)
        {
            Log($"[AssessPronunciation] result not null");
            LogAssessmentResult(result);
        }
        else
        {
            Log("[AssessPronunciation]  No speech recognized or assessment failed.");
            interactionManager.HandleIncorrectPronunciation();  // Call HandleIncorrectPronunciation on failure
        }
    }

    private IEnumerator AssessPronunciationCoroutine(string referenceText, System.Action<AssessmentResult> callback)
    {
        Log($"[AssessPronunciationCoroutine] referenceText: {referenceText}");
        var task = AssessPronunciationAsync(referenceText);
        yield return new WaitUntil(() => task.IsCompleted);
        callback(task.Result);
    }

    private async Task<AssessmentResult> AssessPronunciationAsync(string referenceText)
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

        if (result.recognition_status == "success")
        {
            interactionManager.HandleCorrectPronunciation();
        }
        else
        {
            interactionManager.HandleIncorrectPronunciation();
        }
    }

    void Log(string message)
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
