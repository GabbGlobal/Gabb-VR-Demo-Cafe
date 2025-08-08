using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using TMPro;
using UnityEngine;

public class WordBlockManager : MonoBehaviour
{
    [Header("Blocks in order, left ? right on the table")]
    public List<LetterDisplay> Blocks = new List<LetterDisplay>();

    [Header("Default letter to show when idle")]
    public string DefaultLetter = "A";

    void Awake()
    {
        // Start hidden & clean. WordFlow will size them per first word.
        HideAll();
    }

    // ---------- Public API ----------

    // Show first <count> as default (A underlined white). Hide the rest.
    public void InitializeDefaultForWordLength(int count)
    {
        count = Mathf.Clamp(count, 0, Blocks.Count);

        for (int i = 0; i < Blocks.Count; i++)
        {
            var b = Blocks[i];
            if (i < count)
            {
                b.SetLetter(DefaultLetter);
                b.ResetLetter();   // white + underline
                b.SetVisible(true);
            }
            else
            {
                HideAndReset(b);
            }
        }
    }

    // Show a specific word exactly (used when the user gets it right)
    public void DisplayWord(string word)
    {
        if (string.IsNullOrEmpty(word)) return;

        word = word.ToUpperInvariant();
        int count = Mathf.Min(word.Length, Blocks.Count);

        for (int i = 0; i < Blocks.Count; i++)
        {
            var b = Blocks[i];
            if (i < count)
            {
                b.SetLetter(word[i].ToString());
                b.SetVisible(true);
                b.ShowUnderline(false);
                b.SetColor(Color.white);
            }
            else
            {
                HideAndReset(b);
            }
        }
    }

    // Red/green feedback (no yellow yet). Keeps guessed letters visible.
    public void DisplayComparison(string target, string guess)
    {
        if (string.IsNullOrEmpty(target)) return;

        string t = Normalize(target);
        string g = Normalize(guess);

        int showCount = Mathf.Min(Mathf.Max(t.Length, g.Length), Blocks.Count);

        for (int i = 0; i < showCount; i++)
        {
            var b = Blocks[i];
            b.SetVisible(true);
            b.ShowUnderline(true);

            char letter = (i < g.Length) ? char.ToUpperInvariant(g[i]) : DefaultLetter[0];
            b.SetLetter(letter.ToString());

            if (i < t.Length && i < g.Length && g[i] == t[i])
                b.SetColor(Color.green);
            else
                b.SetColor(Color.red);
        }

        // Hide anything beyond the needed count
        for (int i = showCount; i < Blocks.Count; i++)
            HideAndReset(Blocks[i]);
    }

    // ---------- Helpers ----------

    private void HideAll()
    {
        foreach (var b in Blocks) HideAndReset(b);
    }

    private void HideAndReset(LetterDisplay b)
    {
        b.SetVisible(false);
        b.SetLetter(DefaultLetter);
        b.ResetLetter(); // white + underline
    }

    private static string Normalize(string s)
    {
        return TextUtils.NormalizeAccents(s ?? "").ToLowerInvariant();
    }
}

