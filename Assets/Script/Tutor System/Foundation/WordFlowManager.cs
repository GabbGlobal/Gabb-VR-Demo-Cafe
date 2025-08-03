using UnityEngine;
using System.Collections.Generic;

public class WordFlowManager : MonoBehaviour
{
    [Tooltip("This list must match the order of SpeechSpitterManager's word list")]
    public List<string> wordList;
    public int currentIndex = 0;
    public int failedAttempts = 0;
    private const int maxFails = 3;

    public SpeechSpitterManager speechSpitter;

    private void Awake()
    {
        // No instance logic
    }

    public void CheckRecognizedWord(string recognized)
    {
        string cleaned = TextUtils.NormalizeAccents(recognized.Trim().ToLowerInvariant());
        string target = TextUtils.NormalizeAccents(wordList[currentIndex].Trim().ToLowerInvariant());

        if (cleaned == target)
        {
            Debug.Log($"[WordFlow] Word matched: {recognized}");

            int matchedIndex = speechSpitter.GetIndexForWord(recognized);
            if (matchedIndex >= 0)
            {
                speechSpitter.DisplayMatchedWordAt(matchedIndex);
            }

            AdvanceToNextWord();
        }
        else
        {
            failedAttempts++;
            Debug.LogWarning($"[WordFlow] Incorrect: Heard '{cleaned}', expected '{target}'");

            if (failedAttempts >= maxFails)
            {
                Debug.LogError("[WordFlow] Maximum failed attempts reached.");
                failedAttempts = 0;
            }
        }
    }

    private void AdvanceToNextWord()
    {
        currentIndex = (currentIndex + 1) % wordList.Count;
        failedAttempts = 0;
        speechSpitter.DisplayMatchedWordAt(currentIndex);
        speechSpitter.RefreshInstruction(currentIndex);
    }
}