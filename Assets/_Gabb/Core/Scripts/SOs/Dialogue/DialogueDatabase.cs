using System;
using System.Collections.Generic;
using UnityEngine;

[CreateAssetMenu(fileName = "DialogueDatabase", menuName = "ScriptableObjects/Dialogue/Dialogue Database")]
public class DialogueDatabase : ScriptableObject
{
    [Header("All Dialogues")]
    public List<DialogueData> allDialogues;

    private Dictionary<string, DialogueData> dialogueLookup;

    public void Initialize()
    {
        dialogueLookup = new Dictionary<string, DialogueData>();
        foreach (var dialogue in allDialogues)
        {
            if (dialogue != null && !string.IsNullOrEmpty(dialogue.dialogueId))
            {
                dialogueLookup[dialogue.dialogueId] = dialogue;
            }
        }
    }

    public DialogueData GetDialogue(string dialogueId)
    {
        if (dialogueLookup == null)
            Initialize();

        return dialogueLookup.TryGetValue(dialogueId, out var dialogue) ? dialogue : null;
    }

    public List<DialogueData> GetAvailableDialogues(PlayerData playerData)
    {
        List<DialogueData> available = new List<DialogueData>();

        foreach (var dialogue in allDialogues)
        {
            if (dialogue.CanStart(playerData))
            {
                available.Add(dialogue);
            }
        }

        return available;
    }

    public List<DialogueData> GetDialoguesByLevel(int level)
    {
        return allDialogues.FindAll(d => d.requiredLevel == level);
    }

    public List<DialogueData> GetDialoguesByCategory(DialogueCategory category)
    {
        return allDialogues.FindAll(d => d.category == category);
    }
}
