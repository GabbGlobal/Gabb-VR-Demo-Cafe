using Newtonsoft.Json;

[System.Serializable]
public class SessionEndRequest
{
    [JsonProperty("session_id")] public string SessionId;
}
