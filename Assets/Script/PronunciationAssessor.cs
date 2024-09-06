using UnityEngine;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using Microsoft.CognitiveServices.Speech;
using Microsoft.CognitiveServices.Speech.Audio;
using Microsoft.CognitiveServices.Speech.PronunciationAssessment;
using System.Threading.Tasks;

public class PronunciationAssessor : MonoBehaviour
{
    // Replace with your actual subscription key and region
    private const string SubscriptionKey = "6762f076f08140b3afa3c1888cd3f642";
    private const string Region = "eastus";

    // These are a list of prompts from the food and drinks v1
    public readonly string[] prompts = new string[]
    {
        "Hi, May I see the menu please?",
        "I want a coffee with milk please.",
        "Yes, I would like an egg sandwich.",
        "What kind of muffin is that?",
        "No thanks, not today.",
        "Can I pay by card?",
        "Okay, here you go. Here's $6.",
        "Thank you!"
    };

    private SpeechConfig speechConfig;
    private AudioConfig audioConfig;

    void Awake()
    {
        speechConfig = SpeechConfig.FromSubscription(SubscriptionKey, Region);
        speechConfig.SpeechRecognitionLanguage = "en-US";
        audioConfig = AudioConfig.FromDefaultMicrophoneInput();
    }

    public IEnumerator AssessPronunciation(string referenceText)
    {
        Debug.Log($"\nPlease say: \"{referenceText}\"");
        Debug.Log("Listening... (Will timeout after 10 seconds if no speech is detected)");

        AssessmentResult result = null;
        yield return StartCoroutine(AssessPronunciationCoroutine(referenceText, r => result = r));

        if (result != null)
        {
            float successThreshold = 95.0f;

            if (result.scores.custom_score >= successThreshold)
            {
                Debug.Log("\nPronunciation Assessment Results: Success");
            }
            else
            {
                Debug.Log("\nPronunciation Assessment Results: Failure");
                result.error = "Recognized text does not match reference text closely enough";
            }

            Debug.Log(JsonUtility.ToJson(result, true));
        }
        else
        {
            Debug.Log("Assessment failed or timed out.");
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
            // Create PronunciationAssessmentConfig directly
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

            var timeoutTask = Task.Delay(TimeSpan.FromSeconds(10));
            var completedTask = await Task.WhenAny(taskCompletionSource.Task, timeoutTask);

            await recognizer.StopContinuousRecognitionAsync();

            if (completedTask == timeoutTask)
            {
                Debug.Log("No speech recognized within the timeout period.");
                return null;
            }

            var speechRecognitionResult = await taskCompletionSource.Task;

            Debug.Log($"\nRecognized: {speechRecognitionResult.Text}");
            
            // Get pronunciation assessment results from Properties
            var pronunciationAssessmentResultJson = speechRecognitionResult.Properties.GetProperty(PropertyId.SpeechServiceResponse_JsonResult);
            var pronunciationAssessmentResult = JsonUtility.FromJson<PronunciationAssessmentJsonResult>(pronunciationAssessmentResultJson);

            var pronunciationScore = pronunciationAssessmentResult.NBest[0].PronunciationAssessment.PronScore;
            var accuracyScore = pronunciationAssessmentResult.NBest[0].PronunciationAssessment.AccuracyScore;
            var fluencyScore = pronunciationAssessmentResult.NBest[0].PronunciationAssessment.FluencyScore;
            var completenessScore = pronunciationAssessmentResult.NBest[0].PronunciationAssessment.CompletenessScore;

            var customScore = CalculateCustomScore(speechRecognitionResult.Text, referenceText);

            return new AssessmentResult
            {
                recognition_status = "success",
                recognized_text = speechRecognitionResult.Text,
                reference_text = referenceText,
                scores = new Scores
                {
                    pronunciation_score = pronunciationScore,
                    fluency_score = fluencyScore,
                    completeness_score = completenessScore,
                    accuracy_score = accuracyScore,
                    custom_score = customScore
                }
            };
        }
    }

    private float CalculateCustomScore(string recognized, string reference)
    {
        string[] recognizedWords = NormalizeText(recognized).Split();
        string[] referenceWords = NormalizeText(reference).Split();
        
        int matchedWords = recognizedWords.Intersect(referenceWords).Count();
        float wordAccuracy = (float)matchedWords / referenceWords.Length;
        float lengthRatio = (float)Math.Min(recognizedWords.Length, referenceWords.Length) / 
                            Math.Max(recognizedWords.Length, referenceWords.Length);

        return Mathf.Min(100f, 100f * (wordAccuracy * 0.7f + lengthRatio * 0.3f));
    }

    private string NormalizeText(string text)
    {
        return Regex.Replace(text.ToLower(), @"[^\w\s]", "");
    }

    // Classes to parse the JSON result
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
        public float AccuracyScore;
        public float FluencyScore;
        public float CompletenessScore;
    }
}

[System.Serializable]
public class AssessmentResult
{
    public string recognition_status;
    public string recognized_text;
    public string reference_text;
    public Scores scores;
    public string error;
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