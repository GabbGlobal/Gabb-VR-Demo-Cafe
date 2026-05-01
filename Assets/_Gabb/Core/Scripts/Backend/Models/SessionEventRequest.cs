using Newtonsoft.Json;

[System.Serializable]
public class SessionEventRequest
{
    [JsonProperty("session_id")]    public string SessionId;
    [JsonProperty("student_name")]  public string StudentName;
    [JsonProperty("class_id")]      public string ClassId;
    [JsonProperty("join_code")]     public string JoinCode;
    [JsonProperty("language")]      public string Language;
    [JsonProperty("current_scene")] public string CurrentScene;
    [JsonProperty("xp")]            public float Xp;
    [JsonProperty("accuracy")]      public float Accuracy;
    [JsonProperty("words_learned")] public int WordsLearned;
    [JsonProperty("summary")]       public string Summary;
    [JsonProperty("started_at")]    public string StartedAt;
}
