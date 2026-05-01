using System;
using UnityEngine;

public class AdaptationReceiver : MonoBehaviour
{
    [Header("Current State (read-only)")]
    [SerializeField] private string currentStatus = "green";
    [SerializeField] private string currentDifficulty = "maintain";
    [SerializeField] private int currentHintLevel = 0;
    [SerializeField] private string currentPace = "normal";

    public string CurrentStatus => currentStatus;
    public string CurrentDifficulty => currentDifficulty;
    public int CurrentHintLevel => currentHintLevel;
    public string CurrentPace => currentPace;

    public event Action<string> OnDifficultyChanged;
    public event Action<int> OnHintLevelChanged;
    public event Action<string> OnPaceChanged;
    public event Action<string> OnStatusUpdated;

    private void OnEnable()
    {
        AdaptationBus.OnAdaptationReceived += HandleAdaptation;
    }

    private void OnDisable()
    {
        AdaptationBus.OnAdaptationReceived -= HandleAdaptation;
    }

    private void HandleAdaptation(SessionEventResponse response)
    {
        currentStatus = response.Status;
        OnStatusUpdated?.Invoke(currentStatus);

        if (response.Adaptations == null) return;

        if (response.Adaptations.Difficulty != null && response.Adaptations.Difficulty != currentDifficulty)
        {
            currentDifficulty = response.Adaptations.Difficulty;
            OnDifficultyChanged?.Invoke(currentDifficulty);
        }

        if (response.Adaptations.HintLevel != currentHintLevel)
        {
            currentHintLevel = response.Adaptations.HintLevel;
            OnHintLevelChanged?.Invoke(currentHintLevel);
        }

        if (response.Adaptations.Pace != null && response.Adaptations.Pace != currentPace)
        {
            currentPace = response.Adaptations.Pace;
            OnPaceChanged?.Invoke(currentPace);
        }

        Debug.Log($"[AdaptationReceiver] status={currentStatus} difficulty={currentDifficulty} " +
                  $"hints={currentHintLevel} pace={currentPace}");
    }
}
