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

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;

        foreach (var pair in wordList)
        {
            if (pair.sceneObject != null)
                pair.sceneObject.SetActive(false);
        }

        RefreshInstruction(0);
    }

    private void Update()
    {
        if (Input.GetKeyDown(KeyCode.M))
            wordFlow.CheckRecognizedWord("mesa");

        if (Input.GetKeyDown(KeyCode.L))
            wordFlow.CheckRecognizedWord("lápiz");
    }

    public void DisplayMatchedWordAt(int index)
    {
        if (index < 0 || index >= wordList.Count)
            return;

        var pair = wordList[index];

        if (pair.sceneObject != null)
            pair.sceneObject.SetActive(true);

        var blockManager = FindFirstObjectByType<WordBlockManager>();
        if (blockManager != null)
            blockManager.DisplayWord(pair.word);

        RefreshInstruction(index);
    }

    public void RefreshInstruction(int index)
    {
        if (instructionText != null && index >= 0 && index < wordList.Count)
            instructionText.text = wordList[index].instructions;
    }

    public int GetIndexForWord(string word)
    {
        string cleaned = TextUtils.NormalizeAccents(word);
        return wordList.FindIndex(pair => TextUtils.NormalizeAccents(pair.word) == cleaned);
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
