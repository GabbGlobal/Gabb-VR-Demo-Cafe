using NUnit.Framework;

public class AdaptationBusTests
{
    [SetUp]
    public void SetUp()
    {
        AdaptationBus.Reset();
    }

    [Test]
    public void Publish_FiresOnAdaptationReceived()
    {
        SessionEventResponse received = null;
        AdaptationBus.OnAdaptationReceived += r => received = r;

        var response = new SessionEventResponse
        {
            Status = "green",
            Adaptations = new Adaptations
            {
                Difficulty = "increase",
                HintLevel = 1,
                Pace = "fast",
                Message = null
            }
        };

        AdaptationBus.Publish(response);

        Assert.IsNotNull(received);
        Assert.AreEqual("green", received.Status);
        Assert.AreEqual("increase", received.Adaptations.Difficulty);
    }

    [Test]
    public void Publish_FiresOnStatusChanged()
    {
        string receivedStatus = null;
        AdaptationBus.OnStatusChanged += s => receivedStatus = s;

        var response = new SessionEventResponse
        {
            Status = "red",
            Adaptations = new Adaptations()
        };

        AdaptationBus.Publish(response);

        Assert.AreEqual("red", receivedStatus);
    }

    [Test]
    public void Publish_WithMessage_FiresOnTeacherMessage()
    {
        string receivedMessage = null;
        AdaptationBus.OnTeacherMessage += m => receivedMessage = m;

        var response = new SessionEventResponse
        {
            Status = "yellow",
            Adaptations = new Adaptations { Message = "Student needs help" }
        };

        AdaptationBus.Publish(response);

        Assert.AreEqual("Student needs help", receivedMessage);
    }

    [Test]
    public void Publish_WithNullMessage_DoesNotFireOnTeacherMessage()
    {
        bool messageFired = false;
        AdaptationBus.OnTeacherMessage += _ => messageFired = true;

        var response = new SessionEventResponse
        {
            Status = "green",
            Adaptations = new Adaptations { Message = null }
        };

        AdaptationBus.Publish(response);

        Assert.IsFalse(messageFired);
    }

    [Test]
    public void Reset_ClearsAllSubscribers()
    {
        bool fired = false;
        AdaptationBus.OnAdaptationReceived += _ => fired = true;
        AdaptationBus.OnStatusChanged += _ => fired = true;
        AdaptationBus.OnTeacherMessage += _ => fired = true;

        AdaptationBus.Reset();

        var response = new SessionEventResponse
        {
            Status = "green",
            Adaptations = new Adaptations { Message = "test" }
        };

        AdaptationBus.Publish(response);

        Assert.IsFalse(fired);
    }

    [Test]
    public void Publish_NullAdaptations_DoesNotThrow()
    {
        string receivedStatus = null;
        AdaptationBus.OnStatusChanged += s => receivedStatus = s;

        var response = new SessionEventResponse
        {
            Status = "yellow",
            Adaptations = null
        };

        Assert.DoesNotThrow(() => AdaptationBus.Publish(response));
        Assert.AreEqual("yellow", receivedStatus);
    }

    [Test]
    public void Publish_MultipleSubscribers_AllFire()
    {
        int callCount = 0;
        AdaptationBus.OnAdaptationReceived += _ => callCount++;
        AdaptationBus.OnAdaptationReceived += _ => callCount++;
        AdaptationBus.OnAdaptationReceived += _ => callCount++;

        var response = new SessionEventResponse
        {
            Status = "green",
            Adaptations = new Adaptations()
        };

        AdaptationBus.Publish(response);

        Assert.AreEqual(3, callCount);
    }

    [Test]
    public void Publish_EmptyMessage_DoesNotFireOnTeacherMessage()
    {
        bool messageFired = false;
        AdaptationBus.OnTeacherMessage += _ => messageFired = true;

        var response = new SessionEventResponse
        {
            Status = "green",
            Adaptations = new Adaptations { Message = null }
        };

        AdaptationBus.Publish(response);

        Assert.IsFalse(messageFired);
    }

    [Test]
    public void Publish_StatusAlwaysFires_EvenIfSameValue()
    {
        int statusCount = 0;
        AdaptationBus.OnStatusChanged += _ => statusCount++;

        var response = new SessionEventResponse
        {
            Status = "green",
            Adaptations = new Adaptations()
        };

        AdaptationBus.Publish(response);
        AdaptationBus.Publish(response);

        Assert.AreEqual(2, statusCount);
    }
}
