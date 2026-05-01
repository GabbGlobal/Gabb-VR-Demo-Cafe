using UnityEngine;

[CreateAssetMenu(menuName = "Gabb/Backend Config")]
public class BackendConfig : ScriptableObject
{
    [Header("Server")]
    public string apiBaseUrl = "https://gabb-vr-unity-api.onrender.com";
    public float requestTimeoutSeconds = 5f;

    [Header("Session")]
    public string classId = "";
    public string joinCode = "";
    public string defaultLanguage = "Spanish";
    public float heartbeatIntervalSeconds = 15f;
}
