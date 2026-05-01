using Newtonsoft.Json;

[System.Serializable]
public class SessionEventResponse
{
    [JsonProperty("status")]      public string Status;
    [JsonProperty("adaptations")] public Adaptations Adaptations;
}

[System.Serializable]
public class Adaptations
{
    [JsonProperty("difficulty")] public string Difficulty;
    [JsonProperty("hint_level")] public int HintLevel;
    [JsonProperty("pace")]       public string Pace;
    [JsonProperty("message")]    public string Message;
}
