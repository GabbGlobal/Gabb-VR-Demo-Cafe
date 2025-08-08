using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class WordFlowManager : MonoBehaviour
{
    [Tooltip("Must match SpeechSpitterManager order")]
    public List<string> wordList;

    public int currentIndex = 0;
    public int failedAttempts = 0;
    private const int maxFails = 5;

    [Header("References")]
    public SpeechSpitterManager speechSpitter;
    [SerializeField] private WordBlockManager blockManager;

    void Start()
    {
        // Default “AAAA…” sized to the first word
        if (wordList != null && wordList.Count > 0 && blockManager != null)
        {
            int firstLen = Mathf.Clamp(wordList[0].Length, 0, blockManager.Blocks.Count);
            blockManager.InitializeDefaultForWordLength(firstLen);
            speechSpitter.RefreshInstruction(0);
        }
    }

    public void CheckRecognizedWord(string recognized)
    {
        string cleaned = TextUtils.NormalizeAccents(recognized.Trim().ToLowerInvariant());
        string target = TextUtils.NormalizeAccents(wordList[currentIndex].Trim().ToLowerInvariant());

        if (cleaned == target)
        {
            Debug.Log($"[WordFlow] Word matched: {recognized}");

            // Show the real word and activate its object
            int idx = speechSpitter.GetIndexForWord(recognized);
            if (idx >= 0)
                speechSpitter.DisplayMatchedWordAt(idx);

            // Move to the next round after a short delay
            StopAllCoroutines();
            StartCoroutine(AdvanceToNextWordDelayed(4f));
        }
        else
        {
            failedAttempts++;
            Debug.LogWarning($"[WordFlow] Incorrect: heard '{cleaned}', expected '{target}'");

            // Visual feedback on the blocks
            if (blockManager != null)
                blockManager.DisplayComparison(wordList[currentIndex], recognized);

            if (failedAttempts >= maxFails)
            {
                failedAttempts = 0;
                // Optional: provide a hint or reset visuals here
            }
        }
    }

    private IEnumerator AdvanceToNextWordDelayed(float delaySeconds)
    {
        yield return new WaitForSeconds(delaySeconds);

        currentIndex = (currentIndex + 1) % wordList.Count;
        failedAttempts = 0;

        // Prep next round as “AAAA…” with the new length; do NOT reveal the answer
        if (blockManager != null)
            blockManager.InitializeDefaultForWordLength(wordList[currentIndex].Length);

        speechSpitter.RefreshInstruction(currentIndex);
    }
}