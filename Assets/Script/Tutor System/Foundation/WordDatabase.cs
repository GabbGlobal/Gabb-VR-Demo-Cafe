using System.Collections.Generic;
using UnityEngine;

[CreateAssetMenu(fileName = "WordDatabase", menuName = "ScriptableObjects/Word Database", order = 3)]
public class WordDatabase : ScriptableObject
{
    [SerializeField] private WordData[] words;

    public WordData GetWord(string word)
    {
        word = word.Trim().ToLower();
        foreach (var wd in words)
        {
            if (wd.Word.ToLower() == word)
                return wd;
        }
        return null;
    }

    public List<WordData> GetAllWords()
    {
        return new List<WordData>(words);
    }
}