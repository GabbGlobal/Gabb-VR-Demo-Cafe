using System.Collections.Generic;
using UnityEngine;

public class PlayerProgressionComponent : MonoBehaviour
{
    [Header("Configuration")]
    [SerializeField] private LevelData levelDataConfig;

    private Player player;
    private PlayerDataComponent dataComponent;

    public void Initialize(Player playerRef)
    {
        player = playerRef;
        dataComponent = player.DataComponent;
    }

    public void CheckLevelProgression()
    {
        int expectedLevel = levelDataConfig.CalculateLevel(dataComponent.Data.completedDialogues.Count);

        if (expectedLevel > dataComponent.Data.currentLevel)
        {
            LevelUp(expectedLevel);
        }
    }

    private void LevelUp(int newLevel)
    {
        int oldLevel = dataComponent.Data.currentLevel;
        dataComponent.Data.currentLevel = newLevel;

        Level newLevelConfig = levelDataConfig.GetLevel(newLevel);

        if(newLevelConfig != null)
        {
            Debug.Log($"[Player {dataComponent.Data.playerId}] reached level: {newLevelConfig.levelName}");
            return;
        }

        Debug.Log($"[Player {dataComponent.Data.playerId}] Leveled up from {oldLevel} to {newLevel}!");
        player.InvokeLevelUp(newLevel);
    }

    public List<string> GetAvailableDialoguesForCurrentLevel()
    {
        Level currentLevelData = levelDataConfig.GetLevel(dataComponent.Data.currentLevel);
        return currentLevelData?.availableDialogueIds ?? new List<string>();
    }

    public float GetProgressToNextLevel()
    {
        float currentLevelXP = levelDataConfig.GetTotalXPRequired(dataComponent.Data.currentLevel);
        float nextLevelXP = levelDataConfig.GetTotalXPRequired(dataComponent.Data.currentLevel + 1);
        float progress = (dataComponent.Data.currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP);
        return Mathf.Clamp01(progress);
    }
}
