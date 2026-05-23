using UnityEngine;

public enum GabbLanguage { Spanish, French }

public class LanguageToggle : MonoBehaviour
{
    public static LanguageToggle Instance { get; private set; }
    public static GabbLanguage CurrentLanguage { get; private set; } = GabbLanguage.Spanish;

    [SerializeField] private BackendConfig backendConfig;

    void Awake()
    {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    public void ToggleSpanish() => SetLanguage(GabbLanguage.Spanish);
    public void ToggleFrench() => SetLanguage(GabbLanguage.French);

    public void SetLanguage(GabbLanguage language)
    {
        CurrentLanguage = language;
        Debug.Log($"[LanguageToggle] Switching to {language}");

        UpdateSpeechAce(language);
        UpdateCloudRecognizer(language);
        UpdateAzureRecognizer(language);
        UpdateBackendConfig(language);
        UpdateNpcDialogues(language);
    }

    void UpdateSpeechAce(GabbLanguage language)
    {
        if (SpeechAceClient.Instance == null) return;
        string dialect = language switch
        {
            GabbLanguage.French => "fr-fr",
            _ => "es-mx"
        };
        SpeechAceClient.Instance.SetDialect(dialect);
    }

    void UpdateCloudRecognizer(GabbLanguage language)
    {
        if (CloudSpeechRecognizer.Instance == null) return;
        string code = language switch
        {
            GabbLanguage.French => "fr",
            _ => "es"
        };
        CloudSpeechRecognizer.Instance.SetLanguage(code);
    }

    void UpdateAzureRecognizer(GabbLanguage language)
    {
        if (AzureSpeechRecognizer.Instance == null) return;
        string code = language switch
        {
            GabbLanguage.French => "fr-FR",
            _ => "es-ES"
        };
        AzureSpeechRecognizer.Instance.SetLanguageCode(code);
    }

    void UpdateBackendConfig(GabbLanguage language)
    {
        if (backendConfig == null) return;
        backendConfig.defaultLanguage = language switch
        {
            GabbLanguage.French => "French",
            _ => "Spanish"
        };

        if (SessionTelemetryManager.Instance?.CurrentSession != null)
            SessionTelemetryManager.Instance.CurrentSession.Language = backendConfig.defaultLanguage;
    }

    void UpdateNpcDialogues(GabbLanguage language)
    {
        var npcs = FindObjectsByType<NpcTalking>(FindObjectsSortMode.None);
        foreach (var npc in npcs)
        {
            npc.ApplyLanguage(language);
        }
    }
}
