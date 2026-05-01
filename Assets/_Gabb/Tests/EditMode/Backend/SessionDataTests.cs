using System;
using System.Collections.Generic;
using NUnit.Framework;

public class SessionDataTests
{
    private SessionData CreateTestSession()
    {
        return new SessionData(
            sessionId: "test-session-1",
            studentName: "Maria",
            classId: "abc123",
            joinCode: "",
            language: "Spanish"
        );
    }

    [Test]
    public void Constructor_SetsIdentityFields()
    {
        var session = CreateTestSession();

        Assert.AreEqual("test-session-1", session.SessionId);
        Assert.AreEqual("Maria", session.StudentName);
        Assert.AreEqual("abc123", session.ClassId);
        Assert.AreEqual("Spanish", session.Language);
    }

    [Test]
    public void Constructor_SetsJoinCode()
    {
        var session = new SessionData("s1", "Maria", "", "WXYZ-5678", "Spanish");

        Assert.AreEqual("WXYZ-5678", session.JoinCode);
    }

    [Test]
    public void ToRequest_JoinCodeOnly_OmitsClassId()
    {
        var session = new SessionData("s1", "Maria", "", "WXYZ-5678", "Spanish");

        var request = session.ToRequest("Cafe Scene");

        Assert.IsNull(request.ClassId);
        Assert.AreEqual("WXYZ-5678", request.JoinCode);
    }

    [Test]
    public void ToRequest_ClassIdOnly_OmitsJoinCode()
    {
        var session = CreateTestSession();

        var request = session.ToRequest("Cafe Scene");

        Assert.AreEqual("abc123", request.ClassId);
        Assert.IsNull(request.JoinCode);
    }

    [Test]
    public void Constructor_InitializesStartedAt()
    {
        var before = DateTime.UtcNow;
        var session = CreateTestSession();
        var after = DateTime.UtcNow;

        Assert.That(session.StartedAt, Is.InRange(before, after));
    }

    [Test]
    public void Constructor_StartsWithZeroState()
    {
        var session = CreateTestSession();

        Assert.AreEqual(0f, session.Xp);
        Assert.AreEqual(0, session.WordsLearned);
        Assert.AreEqual(0, session.TotalAttempts);
        Assert.AreEqual(0, session.CorrectAttempts);
        Assert.IsFalse(session.HasSentFirstEvent);
    }

    [Test]
    public void Accuracy_ZeroAttempts_ReturnsZero()
    {
        var session = CreateTestSession();

        Assert.AreEqual(0f, session.Accuracy);
    }

    [Test]
    public void Accuracy_AllCorrect_Returns100()
    {
        var session = CreateTestSession();
        session.TotalAttempts = 10;
        session.CorrectAttempts = 10;

        Assert.AreEqual(100f, session.Accuracy);
    }

    [Test]
    public void Accuracy_PartialCorrect_ReturnsPercentage()
    {
        var session = CreateTestSession();
        session.TotalAttempts = 4;
        session.CorrectAttempts = 3;

        Assert.AreEqual(75f, session.Accuracy);
    }

    [Test]
    public void RecordAttempt_Pass_IncrementsCorrectAndTotal()
    {
        var session = CreateTestSession();

        session.RecordAttempt(passed: true);

        Assert.AreEqual(1, session.TotalAttempts);
        Assert.AreEqual(1, session.CorrectAttempts);
    }

    [Test]
    public void RecordAttempt_Fail_IncrementsOnlyTotal()
    {
        var session = CreateTestSession();

        session.RecordAttempt(passed: false);

        Assert.AreEqual(1, session.TotalAttempts);
        Assert.AreEqual(0, session.CorrectAttempts);
    }

    [Test]
    public void RecordWordLearned_NewWord_IncrementsCount()
    {
        var session = CreateTestSession();

        bool added = session.RecordWordLearned("hola");

        Assert.IsTrue(added);
        Assert.AreEqual(1, session.WordsLearned);
    }

    [Test]
    public void RecordWordLearned_DuplicateWord_DoesNotIncrement()
    {
        var session = CreateTestSession();

        session.RecordWordLearned("hola");
        bool addedAgain = session.RecordWordLearned("hola");

        Assert.IsFalse(addedAgain);
        Assert.AreEqual(1, session.WordsLearned);
    }

    [Test]
    public void RecordWordLearned_MultipleUniqueWords_CountsAll()
    {
        var session = CreateTestSession();

        session.RecordWordLearned("hola");
        session.RecordWordLearned("gracias");
        session.RecordWordLearned("cafe");

        Assert.AreEqual(3, session.WordsLearned);
    }

    [Test]
    public void ToRequest_FirstEvent_IncludesStartedAt()
    {
        var session = CreateTestSession();
        session.HasSentFirstEvent = false;

        var request = session.ToRequest("Cafe Scene");

        Assert.IsNotNull(request.StartedAt);
        Assert.That(request.StartedAt, Does.Contain("T"));
    }

    [Test]
    public void ToRequest_SubsequentEvent_OmitsStartedAt()
    {
        var session = CreateTestSession();
        session.HasSentFirstEvent = true;

        var request = session.ToRequest("Cafe Scene");

        Assert.IsNull(request.StartedAt);
    }

    [Test]
    public void ToRequest_MapsAllFields()
    {
        var session = CreateTestSession();
        session.Xp = 145f;
        session.TotalAttempts = 10;
        session.CorrectAttempts = 8;
        session.RecordWordLearned("hola");
        session.RecordWordLearned("gracias");

        var request = session.ToRequest("Cafe Scene");

        Assert.AreEqual("test-session-1", request.SessionId);
        Assert.AreEqual("Maria", request.StudentName);
        Assert.AreEqual("abc123", request.ClassId);
        Assert.AreEqual("Spanish", request.Language);
        Assert.AreEqual("Cafe Scene", request.CurrentScene);
        Assert.AreEqual(145f, request.Xp);
        Assert.AreEqual(80f, request.Accuracy);
        Assert.AreEqual(2, request.WordsLearned);
        Assert.IsNull(request.Summary);
    }

    [Test]
    public void ToRequest_BothIdentifiers_IncludesBoth()
    {
        var session = new SessionData("s1", "Maria", "abc123", "WXYZ-5678", "Spanish");

        var request = session.ToRequest("Cafe Scene");

        Assert.AreEqual("abc123", request.ClassId);
        Assert.AreEqual("WXYZ-5678", request.JoinCode);
    }

    [Test]
    public void ToRequest_BothEmpty_NullsBoth()
    {
        var session = new SessionData("s1", "Maria", "", "", "Spanish");

        var request = session.ToRequest("Cafe Scene");

        Assert.IsNull(request.ClassId);
        Assert.IsNull(request.JoinCode);
    }

    [Test]
    public void ToRequest_NullClassId_NullsClassId()
    {
        var session = new SessionData("s1", "Maria", null, "WXYZ-5678", "Spanish");

        var request = session.ToRequest("Cafe Scene");

        Assert.IsNull(request.ClassId);
        Assert.AreEqual("WXYZ-5678", request.JoinCode);
    }

    [Test]
    public void Accuracy_SingleCorrect_Returns100()
    {
        var session = CreateTestSession();
        session.RecordAttempt(passed: true);

        Assert.AreEqual(100f, session.Accuracy);
    }

    [Test]
    public void Accuracy_SingleFail_ReturnsZero()
    {
        var session = CreateTestSession();
        session.RecordAttempt(passed: false);

        Assert.AreEqual(0f, session.Accuracy);
    }

    [Test]
    public void RecordAttempt_MultipleAttempts_AccumulatesCorrectly()
    {
        var session = CreateTestSession();

        session.RecordAttempt(true);
        session.RecordAttempt(true);
        session.RecordAttempt(false);
        session.RecordAttempt(true);

        Assert.AreEqual(4, session.TotalAttempts);
        Assert.AreEqual(3, session.CorrectAttempts);
        Assert.AreEqual(75f, session.Accuracy);
    }

    [Test]
    public void ToRequest_PassesCurrentScene()
    {
        var session = CreateTestSession();

        var r1 = session.ToRequest("Cafe Scene");
        var r2 = session.ToRequest("Market");

        Assert.AreEqual("Cafe Scene", r1.CurrentScene);
        Assert.AreEqual("Market", r2.CurrentScene);
    }

    [Test]
    public void ToRequest_FirstEventFlag_TransitionsCorrectly()
    {
        var session = CreateTestSession();

        Assert.IsFalse(session.HasSentFirstEvent);

        var first = session.ToRequest("Cafe Scene");
        Assert.IsNotNull(first.StartedAt);

        session.HasSentFirstEvent = true;

        var second = session.ToRequest("Cafe Scene");
        Assert.IsNull(second.StartedAt);

        var third = session.ToRequest("Market");
        Assert.IsNull(third.StartedAt);
    }

    [Test]
    public void Xp_CanBeUpdatedDirectly()
    {
        var session = CreateTestSession();
        Assert.AreEqual(0f, session.Xp);

        session.Xp = 250f;
        var request = session.ToRequest("Cafe Scene");

        Assert.AreEqual(250f, request.Xp);
    }
}
