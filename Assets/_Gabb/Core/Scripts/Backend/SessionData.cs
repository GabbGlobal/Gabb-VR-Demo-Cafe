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

    public int WordsLearned => uniqueWordsLearned.Count;
    public int WordsSpoken;
    public float Accuracy => TotalAttempts > 0 ? accuracyScoreSum / TotalAttempts : 0f;

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
            WordsLearned = WordsSpoken,
            Summary = null,
            StartedAt = HasSentFirstEvent ? null : StartedAt.ToString("o")
        };
    }
}
