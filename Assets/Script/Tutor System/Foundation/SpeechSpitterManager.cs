using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using TMPro;
using UnityEngine;

[System.Serializable]
public class WordObjectPair
{
    public string word;
    public GameObject sceneObject;
    [TextArea]
    public string instructions;
}

public class SpeechSpitterManager : MonoBehaviour
{
    public static SpeechSpitterManager Instance;

    [Header("Managers")]
    public WordFlowManager wordFlow;

    [Header("Word & Object Sequence")]
    public List<WordObjectPair> wordList = new List<WordObjectPair>();

    [Header("Instruction Text UI")]
    public TMP_Text instructionText;

    void Awake()
    {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }
        Instance = this;

        // Ensure no reward object is visible at boot
        foreach (var p in wordList)
            if (p.sceneObject) p.sceneObject.SetActive(false);

        RefreshInstruction(0);
    }

    // Called at round start – no reveal
    public void PrepareRound(int index, WordBlockManager blockManager)
    {
        if (index < 0 || index >= wordList.Count || blockManager == null) return;

        // Hide reward object for this round
        var pair = wordList[index];
        if (pair.sceneObject) pair.sceneObject.SetActive(false);

        // Size placeholders: “aaaa…” of target length
        blockManager.SetRoundBlockCount(pair.word.Length);

        // Update instructions
        RefreshInstruction(index);
    }

    // Called only after a correct answer – reveal object and show word
    public void RevealCorrectWord(int index, WordBlockManager blockManager)
    {
        if (index < 0 || index >= wordList.Count || blockManager == null) return;

        var pair = wordList[index];

        if (pair.sceneObject) pair.sceneObject.SetActive(true);
        blockManager.DisplayWord(pair.word, keepCasing: true);
    }

    public void RefreshInstruction(int index)
    {
        if (instructionText != null && index >= 0 && index < wordList.Count)
            instructionText.text = wordList[index].instructions;
    }

    public int GetIndexForWord(string word)
    {
        string cleaned = TextUtils.NormalizeAccents(word);
        return wordList.FindIndex(p => TextUtils.NormalizeAccents(p.word) == cleaned);
    }

    public static class TextUtils
    {
        public static string NormalizeAccents(string input)
        {
            return new string(input
                .Normalize(NormalizationForm.FormD)
                .Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                .ToArray())
                .ToLowerInvariant();
        }
    }
}
