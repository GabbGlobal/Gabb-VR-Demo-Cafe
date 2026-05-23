using UnityEngine;

public class JoinCodeTest : MonoBehaviour
{
    [SerializeField] private BackendConfig config;
    [SerializeField] private ApiClient apiClient;

    public bool testJoin;

    private void Update()
    {
        if (testJoin)
        {
            testJoin = false;
            TestJoin();
        }
    }


    [ContextMenu("Test Join 3KJN-CK6K")]
    public async void TestJoin()
    {
        string code = "3KJN-CK6K";
        Debug.Log($"[JoinTest] Testing join with code: {code}");

        config.joinCode = code;

        Debug.Log("[JoinTest] Warming up...");
        bool connected = await apiClient.WarmUpAsync(10f);
        if (!connected)
        {
            Debug.LogError("[JoinTest] Cannot reach server.");
            return;
        }

        Debug.Log("[JoinTest] Server reachable. Posting join event...");
        var request = new SessionEventRequest
        {
            SessionId = "join-validate",
            StudentName = "Student",
            JoinCode = code,
            Language = config.defaultLanguage,
            CurrentScene = "JoinTest"
        };

        var response = await apiClient.PostAsync<SessionEventRequest, SessionEventResponse>("/session/event", request, 10f);

        if (response != null)
        {
            Debug.Log($"[JoinTest] SUCCESS — Status: {response.Status}");
            SessionTelemetryManager.Instance?.StartSession();
        }
        else
        {
            Debug.LogError("[JoinTest] FAILED — response was null (server rejected or timed out).");
        }
    }
}
