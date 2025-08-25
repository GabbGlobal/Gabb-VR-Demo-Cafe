using System.Collections.Generic;
using TMPro;
using UnityEngine;
using System.Globalization;
using System.Linq;

[System.Serializable]
public class WordObjectPair
{
    public string word;
    public GameObject sceneObject;     // Optional: object to reveal on success
    [TextArea] public string instructions;
}

public class SpeechSpitterManager : MonoBehaviour
{
    public static SpeechSpitterManager Instance;

    [Header("Word & Object Sequence")]
    public List<WordObjectPair> wordList = new List<WordObjectPair>();

    [Header("Instruction Text UI")]
    public TMP_Text instructionText;

    private void Awake()
    {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }
        Instance = this;

        // Ensure all scene objects start hidden
        foreach (var pair in wordList)
        {
            if (pair.sceneObject != null)
                pair.sceneObject.SetActive(false);
        }
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

    /// <summary>
    /// Optionally reveal the scene object tied to the correct word.
    /// </summary>
    public void RevealCorrectWord(int index)
    {
        if (index < 0 || index >= wordList.Count) return;
        var pair = wordList[index];
        if (pair.sceneObject != null)
            pair.sceneObject.SetActive(true);
    }
}