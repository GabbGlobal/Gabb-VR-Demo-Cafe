using System;
using System.Threading;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.SceneManagement;

[DefaultExecutionOrder(+300)]
public class SessionTelemetryManager : MonoBehaviour
{
    [Header("Configuration")]
    [SerializeField] private BackendConfig config;
    [SerializeField] private ApiClient apiClient;

    public SessionData CurrentSession { get; private set; }
    public bool IsOnline => apiClient != null && apiClient.IsConnected;

    private SessionApiService sessionApi;
    private CancellationTokenSource heartbeatCts;
    private Player player;
    private bool sessionEnded;

    public static SessionTelemetryManager Instance { get; private set; }

    private void Awake()
    {
        Instance = this;
    }

    private void Start()
    {
        if (apiClient == null || config == null)
        {
            Debug.LogError("[SessionTelemetry] Missing ApiClient or BackendConfig reference.");
            enabled = false;
            return;
        }

        sessionApi = new SessionApiService(apiClient);
    }

    public void StartSession()
    {
        if (CurrentSession != null) return;
        BeginSession();
    }

    private void BeginSession()
    {
        player = GameManager.Instance?.LocalPlayer;

        CurrentSession = new SessionData(
            sessionId: Guid.NewGuid().ToString(),
            studentName: player?.GetPlayerData()?.playerName ?? "Student",
            classId: config.classId,
            joinCode: config.joinCode,
            language: config.defaultLanguage
        );

        if (player != null)
        {
            CurrentSession.Xp = player.XPComponent.GetTotalXP();
            player.OnXPGained += HandleXPGained;
            player.OnDialogueCompleted += HandleDialogueCompleted;
        }

        AzureSpeechRecognizer.OnPronunciationScored += HandlePronunciationScored;
        NpcTalking.OnSpeechAttemptScored += HandleSpeechAttemptScored;

        heartbeatCts = new CancellationTokenSource();
        RunHeartbeat(heartbeatCts.Token);

        Debug.Log($"[SessionTelemetry] Session started: {CurrentSession.SessionId}");
    }

    private async Awaitable RunHeartbeat(CancellationToken ct)
    {
        try
        {
            while (!ct.IsCancellationRequested)
            {
                await Awaitable.WaitForSecondsAsync(config.heartbeatIntervalSeconds, ct);
                if (ct.IsCancellationRequested) break;

                var request = CurrentSession.ToRequest(SceneManager.GetActiveScene().name);
                var response = await sessionApi.SendEventAsync(request);

                if (response != null)
                {
                    CurrentSession.HasSentFirstEvent = true;
                    AdaptationBus.Publish(response);
                }
            }
        }
        catch (OperationCanceledException) { }
    }

    private void HandleXPGained(float amount)
    {
        if (player != null)
            CurrentSession.Xp = player.XPComponent.GetTotalXP();
    }

    private void HandleDialogueCompleted(string dialogueId)
    {
        CurrentSession.RecordWordLearned(dialogueId);
    }

    private void HandlePronunciationScored(PronunciationResult result)
    {
        bool passed = result.Grade == PronunciationGrade.Pass || result.Grade == PronunciationGrade.SoftPass;
        CurrentSession.RecordAttemptWithScore(passed ? result.pronunciationScore : 0f);

        if (passed && !string.IsNullOrEmpty(result.referenceText))
            CurrentSession.RecordWordsFromPhrase(result.referenceText);
    }

    private void HandleSpeechAttemptScored(float accuracy, string referenceText)
    {
        CurrentSession.RecordAttemptWithScore(accuracy);
        CurrentSession.Xp += 3f * (accuracy / 100f);

        if (accuracy >= 50f && !string.IsNullOrEmpty(referenceText))
            CurrentSession.RecordWordsFromPhrase(referenceText);
    }

    private async void OnApplicationQuit()
    {
        await EndSession();
    }

    private async void OnDestroy()
    {
        await EndSession();
    }

    private async Task EndSession()
    {
        if (sessionEnded || CurrentSession == null) return;
        sessionEnded = true;

        heartbeatCts?.Cancel();
        heartbeatCts?.Dispose();
        heartbeatCts = null;

        if (player != null)
        {
            player.OnXPGained -= HandleXPGained;
            player.OnDialogueCompleted -= HandleDialogueCompleted;
        }
        AzureSpeechRecognizer.OnPronunciationScored -= HandlePronunciationScored;
        NpcTalking.OnSpeechAttemptScored -= HandleSpeechAttemptScored;

        try
        {
            await sessionApi.SendEventAsync(
                CurrentSession.ToRequest(SceneManager.GetActiveScene().name));
        }
        catch { }

        try
        {
            var endResponse = await sessionApi.EndSessionAsync(
                new SessionEndRequest { SessionId = CurrentSession.SessionId });

            Debug.Log(endResponse is { Ok: true }
                ? $"[SessionTelemetry] Session ended: {CurrentSession.SessionId}"
                : "[SessionTelemetry] Session end call failed");
        }
        catch
        {
            Debug.LogWarning("[SessionTelemetry] Could not send /session/end");
        }

        AdaptationBus.Reset();
    }
}
