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

    public int WordsLearned => uniqueWordsLearned.Count;
    public float Accuracy => TotalAttempts > 0 ? (float)CorrectAttempts / TotalAttempts * 100f : 0f;

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
        TotalAttempts++;
        if (passed) CorrectAttempts++;
    }

    public bool RecordWordLearned(string word)
    {
        return uniqueWordsLearned.Add(word);
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
            Xp = Xp,
            Accuracy = Accuracy,
            WordsLearned = WordsLearned,
            Summary = null,
            StartedAt = HasSentFirstEvent ? null : StartedAt.ToString("o")
        };
    }
}
