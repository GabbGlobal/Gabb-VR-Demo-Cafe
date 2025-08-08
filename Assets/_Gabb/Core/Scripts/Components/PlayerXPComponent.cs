using UnityEngine;

public class PlayerXPComponent : MonoBehaviour
{
    [Header("Configuration")]
    [SerializeField] private XPConfig xpConfig;
    [SerializeField] private DialogueDatabase dialogueDatabase;

    private Player player;
    private PlayerDataComponent dataComponent;

    public void Initialize(Player playerRef)
    {
        player = playerRef;
        dataComponent = player.DataComponent;

        if(dialogueDatabase != null) 
        { 
            dialogueDatabase.Initialize();
        }
    }

    public void ProcessCompleteDialogue(string dialogueId)
    {
        DialogueData dialogue = dialogueDatabase.GetDialogue(dialogueId);

        if(dialogue == null)
        {
            Debug.LogWarning($"[Player {dataComponent.Data.playerId}] Dialogue ID {dialogueId} not found in database.");
            return;
        }

        if(!dialogue.CanStart(dataComponent.Data))
        {
            Debug.LogWarning($"[Player {dataComponent.Data.playerId}] Dialogue ID {dialogueId} cannot be started due to unmet requirements.");
            return;
        }

        bool isFirstCompletion = !dataComponent.Data.completedDialogues.Contains(dialogueId);

        float xpToGain = xpConfig.CalculateXP(dialogue.baseXPReward, !isFirstCompletion);
        Debug.Log($"[Player {dataComponent.Data.playerId}] XP to gain: {xpToGain}.");

        if (isFirstCompletion)
        {
            dataComponent.Data.completedDialogues.Add(dialogueId);
            Debug.Log($"[Player {dataComponent.Data.playerId}] First completion of dialogue {dialogueId}.");
        }
        else
        {
            Debug.Log($"[Player {dataComponent.Data.playerId}] Repeated dialogue {dialogueId}.");
        }
        AddXP(xpToGain);
        player.InvokeDialogueCompleted(dialogueId);
    }

    public void AddXP(float amount)
    {
        dataComponent.Data.currentXP += amount;
        player.InvokeXPGained(amount);

        // Check for level up
        player.ProgressionComponent.CheckLevelProgression();
    }

    public float GetTotalXP() => dataComponent.Data.currentXP;
}
