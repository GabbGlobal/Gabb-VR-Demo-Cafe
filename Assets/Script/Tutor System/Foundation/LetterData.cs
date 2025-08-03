using UnityEngine;
using System.Collections.Generic;

[CreateAssetMenu(fileName = "Letter_X_Data", menuName = "ScriptableObjects/Letter Data", order = 1)]
public class LetterData : ScriptableObject
{
    public char character; // The actual letter (e.g., 'A', 'ñ', '!')
    public string phonemeSymbol; // The phonetic symbol (e.g., "/a/", "/n/", "/ɲ/")

    [Header("Colors")]
    public Color defaultColor = Color.white;
    public Color correctColor = Color.green;
    public Color incorrectColor = Color.red;
    public Color closeColor = Color.yellow;

    [Header("Confusability")]
    // List of characters that are commonly confused with this one (e.g., 'b' with 'v', 'n' with 'ñ')
    public List<char> commonlyConfusedWith;

    // public AudioClip pronunciationAudio;
    // public Sprite imageRepresentation; // If you have visual aids
}
