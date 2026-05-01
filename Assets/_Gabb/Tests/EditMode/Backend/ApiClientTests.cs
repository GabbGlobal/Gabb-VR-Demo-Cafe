using NUnit.Framework;

public class ApiClientTests
{
    [Test]
    public void BuildUrl_CombinesBaseAndEndpoint()
    {
        string result = ApiClient.BuildUrl("https://gabb-vr-demo.vercel.app", "/session/event");
        Assert.AreEqual("https://gabb-vr-demo.vercel.app/session/event", result);
    }

    [Test]
    public void BuildUrl_StripsTrailingSlashFromBase()
    {
        string result = ApiClient.BuildUrl("https://gabb-vr-demo.vercel.app/", "/session/event");
        Assert.AreEqual("https://gabb-vr-demo.vercel.app/session/event", result);
    }

    [Test]
    public void BuildUrl_HandlesEndpointWithoutLeadingSlash()
    {
        string result = ApiClient.BuildUrl("https://gabb-vr-demo.vercel.app", "session/event");
        Assert.AreEqual("https://gabb-vr-demo.vercel.app/session/event", result);
    }

    [Test]
    public void BuildUrl_RenderUrl_CombinesCorrectly()
    {
        string result = ApiClient.BuildUrl("https://gabb-vr-unity-api.onrender.com", "/session/event");
        Assert.AreEqual("https://gabb-vr-unity-api.onrender.com/session/event", result);
    }

    [Test]
    public void BuildUrl_RenderUrl_SessionEnd()
    {
        string result = ApiClient.BuildUrl("https://gabb-vr-unity-api.onrender.com", "/session/end");
        Assert.AreEqual("https://gabb-vr-unity-api.onrender.com/session/end", result);
    }

    [Test]
    public void BuildUrl_RenderUrl_Health()
    {
        string result = ApiClient.BuildUrl("https://gabb-vr-unity-api.onrender.com", "/health");
        Assert.AreEqual("https://gabb-vr-unity-api.onrender.com/health", result);
    }

    [Test]
    public void BuildUrl_MultipleTrailingSlashes_StripsAll()
    {
        string result = ApiClient.BuildUrl("https://example.com///", "/session/event");
        Assert.AreEqual("https://example.com/session/event", result);
    }
}
