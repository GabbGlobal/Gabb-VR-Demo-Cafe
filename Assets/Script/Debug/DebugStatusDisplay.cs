using UnityEngine;
using TMPro;

public class DebugStatusDisplay : MonoBehaviour
{
    [SerializeField] private TMP_Text display;
    [SerializeField] private float refreshInterval = 0.5f;

    private SessionTelemetryManager telemetry;
    private WordFlowManager wordFlow;
    private string lastRecognized = "(none)";
    private int recognizedCount;
    private float lastActivityTime;
    private float nextRefreshTime;

    private string cachedMicDevice;
    private int cachedMicCount;

    void Start()
    {
        if (display == null)
            display = GetComponent<TMP_Text>();

        telemetry = FindFirstObjectByType<SessionTelemetryManager>();
        wordFlow = FindFirstObjectByType<WordFlowManager>();
        CacheMicInfo();

#if USE_AZURE
        AzureSpeechRecognizer.OnPronunciationScored += OnScored;
#endif
    }

    void OnDestroy()
    {
#if USE_AZURE
        AzureSpeechRecognizer.OnPronunciationScored -= OnScored;
#endif
    }

#if USE_AZURE
    void OnScored(PronunciationResult r)
    {
        lastRecognized = $"{r.recognizedText} ({r.pronunciationScore:F0}%)";
        recognizedCount++;
        lastActivityTime = Time.time;
    }
#endif

    void CacheMicInfo()
    {
        var devices = Microphone.devices;
        cachedMicCount = devices.Length;
        cachedMicDevice = cachedMicCount > 0 ? devices[0] : null;
    }

    void Update()
    {
        if (display == null) return;
        if (Time.time < nextRefreshTime) return;
        nextRefreshTime = Time.time + refreshInterval;

        if (wordFlow == null)
            wordFlow = FindFirstObjectByType<WordFlowManager>();

        CacheMicInfo();

        bool serverOnline = telemetry != null && telemetry.IsOnline;
        string sessionId = telemetry?.CurrentSession?.SessionId ?? "n/a";

        bool wfActive = wordFlow != null;
        string currentWord = wfActive ? (wordFlow.CurrentWord ?? "---") : "n/a";
        string wfProgress = wfActive ? $"{wordFlow.CurrentIndex + 1}/{wordFlow.TotalWords}" : "n/a";
        int wfFails = wfActive ? wordFlow.FailedAttempts : 0;
        bool wfAssessing = wfActive && wordFlow.IsAssessing;

#if USE_AZURE
        string backend = "Azure";
        var azure = AzureSpeechRecognizer.Instance;
        bool azureExists = azure != null;
        bool isListening = azureExists && azure.IsListening;
        bool canListen = azureExists && azure.canListen;

        float actAge = lastActivityTime > 0 ? Time.time - lastActivityTime : -1f;
        string actStr = actAge < 0 ? "never" : $"{actAge:F0}s ago";
        string actColor = actAge >= 0 && actAge < 5f ? "green" : actAge >= 0 && actAge < 15f ? "#FFC107" : "red";

        string speechBlock =
            $"Exists:   {Col(azureExists)}\n" +
            $"canListen:{Col(canListen)}\n" +
            $"Listening:{Col(isListening)}\n" +
            $"Scored:   {recognizedCount}x\n" +
            $"Activity: <color={actColor}>{actStr}</color>\n" +
            $"Last:     {lastRecognized}";
#else
        string backend = "Dictation";
    #if UNITY_STANDALONE_WIN || UNITY_EDITOR_WIN
        bool dictRunning = wfActive && wordFlow.DictationRunning;
        string speechBlock =
            $"Running: {Col(dictRunning)}";
    #else
        string speechBlock = "<color=red>No speech backend on this platform</color>";
    #endif
#endif

        display.text =
            $"<b>--- SERVER ---</b>\n" +
            $"Online:   {Col(serverOnline)}\n" +
            $"Session:  {sessionId[..Mathf.Min(8, sessionId.Length)]}\n" +
            $"\n" +
            $"<b>--- MICROPHONE ---</b>\n" +
            $"Device:   {(cachedMicDevice ?? "<color=red>NONE</color>")}\n" +
            $"Count:    {cachedMicCount} device(s)\n" +
            $"\n" +
            $"<b>--- SPEECH ({backend}) ---</b>\n" +
            speechBlock + "\n" +
            $"\n" +
            $"<b>--- WORD FLOW ---</b>\n" +
            $"Active:   {Col(wfActive)}\n" +
            $"Word:     <color=yellow>{currentWord}</color>\n" +
            $"Progress: {wfProgress}\n" +
            $"Fails:    {wfFails}\n" +
            $"Assessing:{Col(wfAssessing)}\n" +
            $"\n" +
            $"<b>--- PIPELINE ---</b>\n" +
            $"{PipelineStatus(wfActive, wfAssessing)}";
    }

    string Col(bool val) => val ? " <color=green>YES</color>" : " <color=red>NO</color>";

    string PipelineStatus(bool wfActive, bool wfAssessing)
    {
        if (cachedMicDevice == null)
            return "<color=red>No microphone detected!</color>";

#if USE_AZURE
        var azure = AzureSpeechRecognizer.Instance;
        if (azure == null)
            return "<color=red>Azure recognizer missing!</color>";
        if (!azure.IsListening)
            return "<color=red>Engine not started</color>";
        if (!azure.canListen)
            return "<color=red>Gate closed — canListen is false</color>";
#else
    #if UNITY_STANDALONE_WIN || UNITY_EDITOR_WIN
        if (!wfActive || !wordFlow.DictationRunning)
            return "<color=red>DictationRecognizer not running</color>";
    #else
        return "<color=red>No speech backend on this platform</color>";
    #endif
#endif

        if (!wfActive)
            return "<color=#FFC107>WordFlowManager not found in scene</color>";
        if (wfAssessing)
            return "<color=#60a5fa>Assessing pronunciation...</color>";
        return "<color=green>Ready — speak now</color>";
    }
}
