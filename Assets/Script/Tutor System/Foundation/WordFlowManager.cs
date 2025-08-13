using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class WordFlowManager : MonoBehaviour
{
    [Tooltip("Order must match SpeechSpitterManager.wordList")]
    public List<string> wordList;

    public int currentIndex = 0;
    public int failedAttempts = 0;
    private const int maxFails = 5;

    [SerializeField] private SpeechSpitterManager speechSpitter;
    [SerializeField] private WordBlockManager blockManager;

    void Start()
    {
        // Round 0: placeholders only
        if (speechSpitter != null && blockManager != null && wordList != null && wordList.Count > 0)
            speechSpitter.PrepareRound(currentIndex, blockManager);
    }

    public void CheckRecognizedWord(string recognized)
    {
        string cleaned = SpeechSpitterManager.TextUtils.NormalizeAccents(recognized.Trim().ToLowerInvariant());
        string target = SpeechSpitterManager.TextUtils.NormalizeAccents(wordList[currentIndex].Trim().ToLowerInvariant());

        if (cleaned == target)
        {
            failedAttempts = 0;

            // Reveal the correct word and object
            speechSpitter.RevealCorrectWord(currentIndex, blockManager);

            StopAllCoroutines();
            StartCoroutine(AdvanceToNextWordAfterDelay(4f));
        }
        else
        {
            failedAttempts++;
            blockManager.DisplayComparison(wordList[currentIndex], recognized);

            if (failedAttempts >= maxFails)
            {
                failedAttempts = 0; // optional: add hint/reset here
            }
        }
    }

    private IEnumerator AdvanceToNextWordAfterDelay(float seconds)
    {
        yield return new WaitForSeconds(seconds);

        currentIndex = (currentIndex + 1) % wordList.Count;
        failedAttempts = 0;

        // New round: placeholders only; reward object hidden
        speechSpitter.PrepareRound(currentIndex, blockManager);
    }
}