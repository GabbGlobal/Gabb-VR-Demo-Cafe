using System;
using System.Collections.Generic;

public static class PhraseGrader
{
    public struct WordResult
    {
        public string referenceWord;
        public bool matched;
    }

    public struct GradeResult
    {
        public WordResult[] words;
        public int matchedCount;
        public int totalWords;
        public float accuracy;
        public bool passed;
    }

    public static GradeResult Grade(string recognized, string reference, float passThreshold = 0.7f)
    {
        if (string.IsNullOrEmpty(reference))
            return new GradeResult { words = Array.Empty<WordResult>(), passed = true, accuracy = 1f };

        string[] refWords = reference.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        string[] recWords = string.IsNullOrEmpty(recognized)
            ? Array.Empty<string>()
            : recognized.Split(' ', StringSplitOptions.RemoveEmptyEntries);

        var recNormSet = new HashSet<string>();
        foreach (string w in recWords)
            recNormSet.Add(TextUtils.NormalizeAccents(w.Trim().TrimEnd('.')));

        var words = new WordResult[refWords.Length];
        int matched = 0;

        for (int i = 0; i < refWords.Length; i++)
        {
            string refNorm = TextUtils.NormalizeAccents(refWords[i]);
            bool hit = recNormSet.Contains(refNorm);
            if (hit) matched++;
            words[i] = new WordResult { referenceWord = refWords[i], matched = hit };
        }

        float accuracy = refWords.Length > 0 ? (float)matched / refWords.Length : 0f;

        return new GradeResult
        {
            words = words,
            matchedCount = matched,
            totalWords = refWords.Length,
            accuracy = accuracy,
            passed = accuracy >= passThreshold
        };
    }

    public static string ToColoredRichText(GradeResult result)
    {
        var sb = new System.Text.StringBuilder();
        for (int i = 0; i < result.words.Length; i++)
        {
            var w = result.words[i];
            sb.Append(w.matched
                ? $"<color=green>{w.referenceWord}</color>"
                : $"<color=red>{w.referenceWord}</color>");
            if (i < result.words.Length - 1) sb.Append(' ');
        }
        return sb.ToString();
    }
}
