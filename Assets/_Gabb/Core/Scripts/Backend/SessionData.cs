using System;
using System.Collections.Generic;

public class SessionData
{
    public string SessionId { get; }
    public string StudentName { get; }
    public string ClassId { get; }
    public string JoinCode { get; }
    public string Language { get; }
    public DateTime StartedAt { get; }
    public bool HasSentFirstEvent;

    public float Xp;
    public int TotalAttempts;
    public int CorrectAttempts;
    private float accuracyScoreSum;
    private const int PronunciationWindowSize = 5;
    private readonly Queue<float> pronunciationWindow = new Queue<float>();

    public int WordsLearned => uniqueWordsLearned.Count;
    public int WordsSpoken;
    public float Accuracy => TotalAttempts > 0 ? accuracyScoreSum / TotalAttempts : 0f;
    public float PronunciationScore
    {
        get
        {
            if (pronunciationWindow.Count == 0) return 100f;
            float sum = 0f;
            foreach (var s in pronunciationWindow) sum += s;
            return sum / pronunciationWindow.Count;
        }
    }

    private readonly HashSet<string> uniqueWordsLearned = new HashSet<string>();

    public SessionData(string sessionId, string studentName, string classId, string joinCode, string language)
    {
        SessionId = sessionId;
        StudentName = studentName;
        ClassId = classId;
        JoinCode = joinCode;
        Language = language;
        StartedAt = DateTime.UtcNow;
    }

    public void RecordAttempt(bool passed)
    {
        RecordAttemptWithScore(passed ? 100f : 0f);
    }

    public void RecordAttemptWithScore(float score)
    {
        TotalAttempts++;
        float clamped = System.Math.Max(0f, System.Math.Min(score, 100f));
        accuracyScoreSum += clamped;
        if (clamped >= 50f) CorrectAttempts++;
    }

    public void RecordPronunciationScore(float score)
    {
        pronunciationWindow.Enqueue(System.Math.Max(0f, System.Math.Min(score, 100f)));
        if (pronunciationWindow.Count > PronunciationWindowSize)
            pronunciationWindow.Dequeue();
    }

    public bool RecordWordLearned(string word)
    {
        return uniqueWordsLearned.Add(word);
    }

    public void RecordWordsFromPhrase(string phrase)
    {
        if (string.IsNullOrEmpty(phrase)) return;
        foreach (var w in phrase.Split(' '))
        {
            var trimmed = w.Trim();
            if (trimmed.Length > 0)
            {
                uniqueWordsLearned.Add(trimmed.ToLowerInvariant());
                WordsSpoken++;
            }
        }
    }

    public SessionEventRequest ToRequest(string currentScene)
    {
        return new SessionEventRequest
        {
            SessionId = SessionId,
            StudentName = StudentName,
            ClassId = string.IsNullOrEmpty(ClassId) ? null : ClassId,
            JoinCode = string.IsNullOrEmpty(JoinCode) ? null : JoinCode,
            Language = Language,
            CurrentScene = currentScene,
            Xp = (int)Xp,
            Accuracy = (int)System.Math.Round(Accuracy),
            PronunciationScore = (int)System.Math.Round(PronunciationScore),
            WordsLearned = WordsSpoken,
            Summary = null,
            StartedAt = HasSentFirstEvent ? null : StartedAt.ToString("o")
        };
    }
}
