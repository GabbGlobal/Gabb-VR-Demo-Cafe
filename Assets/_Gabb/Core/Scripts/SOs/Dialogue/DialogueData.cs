using System;
using System.Collections.Generic;
using UnityEngine;

[CreateAssetMenu(fileName = "DialogueData", menuName = "ScriptableObjects/Dialogue/Dialogue Data")]
public class DialogueData : ScriptableObject
{
    [Header("Dialogue Info")]
    public string dialogueId;
    public string dialogueName;
    [TextArea(3, 5)]
    public string description;

    [Header("Requirements")]
    public int requiredLevel = 1;
    public List<string> prerequisiteDialogueIds;

    [Header("Rewards")]
    public float baseXPReward = 10f;

    [Header("Dialogue Settings")]
    public DialogueDifficulty difficulty = DialogueDifficulty.Easy;
    public DialogueCategory category = DialogueCategory.Grammar;

    public bool CanStart(PlayerData playerData)
    {
        // Check level requirement
        if (playerData.currentLevel < requiredLevel)
            return false;

        // Check prerequisites
        foreach (var prereq in prerequisiteDialogueIds)
        {
            if (!playerData.completedDialogues.Contains(prereq))
                return false;
        }

        return true;
    }
}

public enum DialogueDifficulty
{
    Easy,
    Medium,
    Hard,
    Expert
}

public enum DialogueCategory
{
    Grammar,
    Vocabulary,
    Pronunciation,
    Conversation,
    Culture
}