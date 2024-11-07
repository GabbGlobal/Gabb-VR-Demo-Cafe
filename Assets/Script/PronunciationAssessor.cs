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
    private const string SubscriptionKey = "placeholder_key";
    private const string Region = "region";
    private SpeechConfig speechConfig;
    private AudioConfig audioConfig;

    // Reference to InteractionManager
    private InteractionManager interactionManager;

    void Awake()
    {
        speechConfig = SpeechConfig.FromSubscription(SubscriptionKey, Region);
        speechConfig.SpeechRecognitionLanguage = "es-ES";  // Spanish language setting
        audioConfig = AudioConfig.FromDefaultMicrophoneInput();

        // Get the InteractionManager component
        interactionManager = FindObjectOfType<InteractionManager>();  // Ensure InteractionManager exists in the scene
    }

    public void StartAssessment(string referenceText)
    {
        Debug.Log("Assessing pronunciation for: " + referenceText);
        StartCoroutine(AssessPronunciation(referenceText));
    }

    private IEnumerator AssessPronunciation(string referenceText)
    {
        AssessmentResult result = null;
        yield return StartCoroutine(AssessPronunciationCoroutine(referenceText, r => result = r));

        if (result != null)
        {
            LogAssessmentResult(result);
        }
        else
        {
            Debug.Log("No speech recognized or assessment failed.");
            interactionManager.HandleIncorrectPronunciation();  // Call HandleIncorrectPronunciation on failure
        }
    }

    private IEnumerator AssessPronunciationCoroutine(string referenceText, System.Action<AssessmentResult> callback)
    {
        var task = AssessPronunciationAsync(referenceText);
        yield return new WaitUntil(() => task.IsCompleted);
        callback(task.Result);
    }

    private async Task<AssessmentResult> AssessPronunciationAsync(string referenceText)
    {
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
                Debug.Log("Speech recognition timeout.");
                return null;
            }

            var speechRecognitionResult = await taskCompletionSource.Task;
            Debug.Log("Recognized: " + speechRecognitionResult.Text);

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
        Debug.Log($"Pronunciation Score: {result.scores.pronunciation_score}");
        Debug.Log($"Fluency Score: {result.scores.fluency_score}");
        Debug.Log($"Completeness Score: {result.scores.completeness_score}");
        Debug.Log($"Accuracy Score: {result.scores.accuracy_score}");
        Debug.Log($"Custom Score: {result.scores.custom_score}");
        Debug.Log($"Recognized Text: {result.recognized_text}");
        Debug.Log($"Reference Text: {result.reference_text}");
        Debug.Log($"Recognition Status: {result.recognition_status}");

        if (result.recognition_status == "success")
        {
            interactionManager.HandleCorrectPronunciation();
        }
        else
        {
            interactionManager.HandleIncorrectPronunciation();
        }
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
