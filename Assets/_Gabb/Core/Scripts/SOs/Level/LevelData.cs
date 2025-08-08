using System;
using System.Collections.Generic;
using UnityEngine;

[CreateAssetMenu(fileName = "LevelData", menuName = "ScriptableObjects/Level/Level Data")]
public class LevelData : ScriptableObject
{
    [Header("Level Requirements")]
    public List<Level> levels;

    [Header("Global Settings")]
    public int dialoguesPerLevel = 4;
    public bool requireAllDialoguesForProgression = true;

    public Level GetLevel(int level)
    {
        if (level <= 0 || level > levels.Count)
            return null;
        return levels[level - 1];
    }

    public int CalculateLevel(int completedDialogues)
    {
        return (completedDialogues / dialoguesPerLevel) + 1;
    }

    public float GetTotalXPRequired(int level)
    {
        float total = 0;
        for (int i = 0; i < level && i < levels.Count; i++)
        {
            total += levels[i].xpRequired;
        }
        return total;
    }
}

[Serializable]
public class Level
{
    public int levelNumber;
    public string levelName;
    public float xpRequired;
    public List<string> availableDialogueIds;
}

