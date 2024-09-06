using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using Microsoft.CognitiveServices.Speech;
using Microsoft.CognitiveServices.Speech.Audio;
using Microsoft.CognitiveServices.Speech.PronunciationAssessment;
using System.Threading.Tasks;

public class PronunciationAssessor : MonoBehaviour
{
    private const string SubscriptionKey = "6762f076f08140b3afa3c1888cd3f642";
    private const string Region = "eastus";
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

            return new AssessmentResult
            {
                recognized_text = speechRecognitionResult.Text,
                scores = new Scores
                {
                    pronunciation_score = pronunciationScore,
                }
            };
        }
    }

    private void LogAssessmentResult(AssessmentResult result)
    {
        Debug.Log($"Pronunciation Score: {result.scores.pronunciation_score}");
        Debug.Log($"Recognized Text: {result.recognized_text}");

        // If the pronunciation score is greater than or equal to 90, handle it as correct
        if (result.scores.pronunciation_score >= 90)
        {
            interactionManager.HandleCorrectPronunciation();  // Call HandleCorrectPronunciation
        }
        else
        {
            interactionManager.HandleIncorrectPronunciation();  // Call HandleIncorrectPronunciation
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
    }

    [System.Serializable]
    public class AssessmentResult
    {
        public string recognized_text;
        public Scores scores;
    }

    [System.Serializable]
    public class Scores
    {
        public float pronunciation_score;
    }
}
