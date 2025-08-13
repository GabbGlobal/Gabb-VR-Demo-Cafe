using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using TMPro;
using UnityEngine;

public class WordBlockManager : MonoBehaviour
{
    [Header("Blocks in table order (left ? right)")]
    public List<LetterDisplay> Blocks = new List<LetterDisplay>();

    [Header("Defaults")]
    [SerializeField] private string defaultLetter = "a";

    [Header("Debug (read-only)")]
    [SerializeField] private int _targetWordLength;
    [SerializeField] private int _usedBlocks;
    [SerializeField] private int _unusedBlocks;

    void Awake()
    {
        HideAllBlocks();
    }

    // ---- Round sizing API (call at start of each round) ----
    public void SetRoundBlockCount(int length)
    {
        _targetWordLength = Mathf.Clamp(length, 0, Blocks.Count);
        _usedBlocks = _targetWordLength;
        _unusedBlocks = Blocks.Count - _usedBlocks;

        for (int i = 0; i < Blocks.Count; i++)
        {
            var b = Blocks[i];
            if (i < _usedBlocks)
            {
                b.SetLetter(defaultLetter);
                b.ResetLetter();      // white + underline
                b.SetVisible(true);
            }
            else
            {
                b.SetVisible(false);
                b.ResetLetter();
            }
        }
    }

    // Show exact target word (after success)
    public void DisplayWord(string word, bool keepCasing = true)
    {
        if (string.IsNullOrEmpty(word)) return;

        int count = Mathf.Min(word.Length, Blocks.Count);
        UpdateCounters(count);

        for (int i = 0; i < Blocks.Count; i++)
        {
            var b = Blocks[i];
            if (i < count)
            {
                string ch = keepCasing ? word[i].ToString() : word[i].ToString().ToUpperInvariant();
                b.SetLetter(ch);
                b.SetVisible(true);
                b.SetColor(Color.white);
                b.ShowUnderline(false);
            }
            else
            {
                b.SetVisible(false);
                b.ResetLetter();
            }
        }
    }

    // Show guess vs target (index-based red/green)
    // - Shows the user's spoken letters as-is (no forced uppercase)
    // - Unfilled positions: default letter + red + underline
    public void DisplayComparison(string target, string guess)
    {
        target ??= "";
        guess ??= "";

        string nt = Normalize(target);
        string ng = Normalize(guess);

        int count = Mathf.Min(Mathf.Max(target.Length, guess.Length), Blocks.Count);
        UpdateCounters(count);

        for (int i = 0; i < Blocks.Count; i++)
        {
            var b = Blocks[i];

            if (i < count)
            {
                b.SetVisible(true);

                // letter to show
                if (i < guess.Length) b.SetLetter(guess[i].ToString());
                else b.SetLetter(defaultLetter);

                // color
                bool inT = i < nt.Length;
                bool inG = i < ng.Length;

                if (!inG)
                {
                    b.SetColor(Color.red);
                    b.ShowUnderline(true);
                    continue;
                }

                b.SetColor(inT && ng[i] == nt[i] ? Color.green : Color.red);
                b.ShowUnderline(true);
            }
            else
            {
                b.SetVisible(false);
                b.ResetLetter();
            }
        }
    }

    // ---- helpers ----
    private void HideAllBlocks()
    {
        foreach (var b in Blocks)
        {
            b.SetVisible(false);
            b.ResetLetter();
        }
        UpdateCounters(0);
    }

    private void UpdateCounters(int used)
    {
        _usedBlocks = Mathf.Clamp(used, 0, Blocks.Count);
        _unusedBlocks = Blocks.Count - _usedBlocks;
        _targetWordLength = _usedBlocks;
    }

    private static string Normalize(string s)
    {
        return new string((s ?? "").Normalize(NormalizationForm.FormD)
            .Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
            .ToArray()).ToLowerInvariant();
    }
}