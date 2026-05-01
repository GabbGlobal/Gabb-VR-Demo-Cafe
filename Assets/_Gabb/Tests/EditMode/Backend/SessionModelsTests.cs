using NUnit.Framework;
using Newtonsoft.Json;

public class SessionModelsTests
{
    [Test]
    public void SessionEventRequest_SerializesToSnakeCase()
    {
        var request = new SessionEventRequest
        {
            SessionId = "headset-42",
            StudentName = "Maria Santos",
            ClassId = "abc123",
            JoinCode = "ABCD-1234",
            Language = "Spanish",
            CurrentScene = "Cafe Scene",
            Xp = 145,
            Accuracy = 82,
            WordsLearned = 12,
            Summary = "Struggling with past tense",
            StartedAt = "2025-04-24T14:00:00Z"
        };

        string json = JsonConvert.SerializeObject(request);

        Assert.That(json, Does.Contain("\"session_id\":\"headset-42\""));
        Assert.That(json, Does.Contain("\"student_name\":\"Maria Santos\""));
        Assert.That(json, Does.Contain("\"class_id\":\"abc123\""));
        Assert.That(json, Does.Contain("\"join_code\":\"ABCD-1234\""));
        Assert.That(json, Does.Contain("\"current_scene\":\"Cafe Scene\""));
        Assert.That(json, Does.Contain("\"words_learned\":12"));
        Assert.That(json, Does.Contain("\"started_at\":\"2025-04-24T14:00:00Z\""));
    }

    [Test]
    public void SessionEventRequest_NullStartedAt_OmittedFromJson()
    {
        var request = new SessionEventRequest
        {
            SessionId = "headset-42",
            StartedAt = null
        };

        var settings = new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore };
        string json = JsonConvert.SerializeObject(request, settings);

        Assert.That(json, Does.Not.Contain("started_at"));
    }

    [Test]
    public void SessionEventRequest_NullJoinCode_OmittedFromJson()
    {
        var request = new SessionEventRequest
        {
            SessionId = "headset-42",
            ClassId = "abc123",
            JoinCode = null
        };

        var settings = new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore };
        string json = JsonConvert.SerializeObject(request, settings);

        Assert.That(json, Does.Contain("\"class_id\":\"abc123\""));
        Assert.That(json, Does.Not.Contain("join_code"));
    }

    [Test]
    public void SessionEventRequest_NullClassId_OmittedFromJson()
    {
        var request = new SessionEventRequest
        {
            SessionId = "headset-42",
            ClassId = null,
            JoinCode = "WXYZ-5678"
        };

        var settings = new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore };
        string json = JsonConvert.SerializeObject(request, settings);

        Assert.That(json, Does.Not.Contain("class_id"));
        Assert.That(json, Does.Contain("\"join_code\":\"WXYZ-5678\""));
    }

    [Test]
    public void SessionEventResponse_DeserializesAllStatusValues()
    {
        foreach (var status in new[] { "green", "yellow", "red" })
        {
            string json = $@"{{ ""status"": ""{status}"", ""adaptations"": {{}} }}";
            var response = JsonConvert.DeserializeObject<SessionEventResponse>(json);
            Assert.AreEqual(status, response.Status);
        }
    }

    [Test]
    public void SessionEventResponse_NullAdaptations_DeserializesAsNull()
    {
        string json = @"{ ""status"": ""green"", ""adaptations"": null }";

        var response = JsonConvert.DeserializeObject<SessionEventResponse>(json);

        Assert.AreEqual("green", response.Status);
        Assert.IsNull(response.Adaptations);
    }

    [Test]
    public void SessionEventResponse_MissingAdaptations_DeserializesAsNull()
    {
        string json = @"{ ""status"": ""green"" }";

        var response = JsonConvert.DeserializeObject<SessionEventResponse>(json);

        Assert.AreEqual("green", response.Status);
        Assert.IsNull(response.Adaptations);
    }

    [Test]
    public void SessionEndResponse_DeserializesFalse()
    {
        string json = @"{ ""ok"": false }";

        var response = JsonConvert.DeserializeObject<SessionEndResponse>(json);

        Assert.IsFalse(response.Ok);
    }

    [Test]
    public void Adaptations_AllDifficultyValues_Deserialize()
    {
        foreach (var diff in new[] { "increase", "maintain", "decrease" })
        {
            string json = $@"{{ ""status"": ""green"", ""adaptations"": {{ ""difficulty"": ""{diff}"" }} }}";
            var response = JsonConvert.DeserializeObject<SessionEventResponse>(json);
            Assert.AreEqual(diff, response.Adaptations.Difficulty);
        }
    }

    [Test]
    public void Adaptations_AllPaceValues_Deserialize()
    {
        foreach (var pace in new[] { "fast", "normal", "slow" })
        {
            string json = $@"{{ ""status"": ""green"", ""adaptations"": {{ ""pace"": ""{pace}"" }} }}";
            var response = JsonConvert.DeserializeObject<SessionEventResponse>(json);
            Assert.AreEqual(pace, response.Adaptations.Pace);
        }
    }

    [Test]
    public void Adaptations_HintLevelRange_Deserializes()
    {
        for (int level = 0; level <= 3; level++)
        {
            string json = $@"{{ ""status"": ""green"", ""adaptations"": {{ ""hint_level"": {level} }} }}";
            var response = JsonConvert.DeserializeObject<SessionEventResponse>(json);
            Assert.AreEqual(level, response.Adaptations.HintLevel);
        }
    }

    [Test]
    public void SessionEventResponse_DeserializesFromSnakeCase()
    {
        string json = @"{
            ""status"": ""green"",
            ""adaptations"": {
                ""difficulty"": ""increase"",
                ""hint_level"": 2,
                ""pace"": ""slow"",
                ""message"": ""Student needs help""
            }
        }";

        var response = JsonConvert.DeserializeObject<SessionEventResponse>(json);

        Assert.AreEqual("green", response.Status);
        Assert.IsNotNull(response.Adaptations);
        Assert.AreEqual("increase", response.Adaptations.Difficulty);
        Assert.AreEqual(2, response.Adaptations.HintLevel);
        Assert.AreEqual("slow", response.Adaptations.Pace);
        Assert.AreEqual("Student needs help", response.Adaptations.Message);
    }

    [Test]
    public void SessionEventResponse_NullMessage_DeserializesAsNull()
    {
        string json = @"{
            ""status"": ""yellow"",
            ""adaptations"": {
                ""difficulty"": ""maintain"",
                ""hint_level"": 0,
                ""pace"": ""normal"",
                ""message"": null
            }
        }";

        var response = JsonConvert.DeserializeObject<SessionEventResponse>(json);

        Assert.IsNull(response.Adaptations.Message);
    }

    [Test]
    public void SessionEndRequest_SerializesToSnakeCase()
    {
        var request = new SessionEndRequest { SessionId = "headset-42" };

        string json = JsonConvert.SerializeObject(request);

        Assert.That(json, Does.Contain("\"session_id\":\"headset-42\""));
    }

    [Test]
    public void SessionEndResponse_DeserializesOk()
    {
        string json = @"{ ""ok"": true }";

        var response = JsonConvert.DeserializeObject<SessionEndResponse>(json);

        Assert.IsTrue(response.Ok);
    }

    [Test]
    public void Adaptations_DefaultValues_WhenMissingFromJson()
    {
        string json = @"{ ""status"": ""red"", ""adaptations"": {} }";

        var response = JsonConvert.DeserializeObject<SessionEventResponse>(json);

        Assert.AreEqual(0, response.Adaptations.HintLevel);
        Assert.IsNull(response.Adaptations.Difficulty);
        Assert.IsNull(response.Adaptations.Pace);
        Assert.IsNull(response.Adaptations.Message);
    }
}
