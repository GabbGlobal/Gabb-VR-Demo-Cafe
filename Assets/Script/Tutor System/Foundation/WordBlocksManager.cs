using System.Collections.Generic;
using UnityEngine;
using TMPro;

public class WordBlockManager : MonoBehaviour
{
    [Header("Blocks to Assign Letters To")]
    public List<LetterDisplay> Blocks = new List<LetterDisplay>();

    [Header("Default fallback letter")]
    public string DefaultLetter = "A";

    private void Awake()
    {
        ResetBlocks();
    }

    public void ResetBlocks()
    {
        foreach (var block in Blocks)
        {
            block.SetLetter(DefaultLetter);
            block.SetVisible(true);
        }
    }

    public void DisplayWord(string word)
    {
        word = word.ToUpperInvariant();

        for (int i = 0; i < Blocks.Count; i++)
        {
            if (i < word.Length)
            {
                Blocks[i].SetLetter(word[i].ToString());
                Blocks[i].SetVisible(true);
            }
            else
            {
                Blocks[i].SetLetter(DefaultLetter);
                Blocks[i].SetVisible(false);
            }
        }
        Debug.Log("Blocks have been set in WBM");
    }
}
