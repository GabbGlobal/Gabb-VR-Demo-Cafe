using System.Collections.Generic;
using UnityEngine;

[CreateAssetMenu(fileName = "LetterDatabase", menuName = "ScriptableObjects/Letter Database")]
public class LetterDatabase : ScriptableObject
{
    public List<LetterData> letterDataList;

    private Dictionary<char, LetterData> letterLookup;

    private void OnEnable()
    {
        BuildLookup();
    }

    private void BuildLookup()
    {
        letterLookup = new Dictionary<char, LetterData>();

        foreach (var data in letterDataList)
        {
            if (data == null) continue;
            char key = char.ToUpper(data.character);

            if (!letterLookup.ContainsKey(key))
                letterLookup[key] = data;

            // Optional: Support lowercase lookup too
            char lowerKey = char.ToLower(data.character);
            if (!letterLookup.ContainsKey(lowerKey))
                letterLookup[lowerKey] = data;
        }
    }

    public LetterData GetLetterData(char c)
    {
        if (letterLookup == null)
        {
            BuildLookup();
        }

        if (letterLookup.TryGetValue(c, out var data))
        {
            return data;
        }

        Debug.LogWarning($"[LetterDatabase] No LetterData found for character '{c}'");
        return null;
    }
}
