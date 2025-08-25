using UnityEngine;

public class PlayerXPComponent : MonoBehaviour
{
    [Header("Configuration")]
    [SerializeField] private XPConfig xpConfig;
    [SerializeField] private DialogueDatabase dialogueDatabase; // optional

    private Player player;
    private PlayerDataComponent dataComponent;

    // --- NEW: convenience accessor for safe data checks
    private bool IsReady => (player != null && dataComponent != null && dataComponent.Data != null && xpConfig != null);

    public void Initialize(Player playerRef)
    {
        player = playerRef;
        dataComponent = player.DataComponent;

        // Dialogue DB is optional. Initialize if present.
        if (dialogueDatabase != null)
        {
            dialogueDatabase.Initialize();
        }

        if (!IsReady)
        {
            Debug.LogWarning("[PlayerXPComponent] Not fully ready. Ensure Player.Initialize(id) was called and XPConfig is assigned.");
        }
    }

    // --- NEW: use this for mini-games or any non-dialogue XP
    public void GainXPForMinigame(float baseXP, float multiplier = 1f)
    {
        float amount = Mathf.Max(0f, baseXP * multiplier);
        AddXP(amount);
    }

    public void ProcessCompleteDialogue(string dialogueId)
    {
        if (dialogueDatabase == null)
        {
            Debug.LogWarning("[PlayerXPComponent] Dialogue database is not assigned; ignoring dialogue XP.");
            return;
        }

        DialogueData dialogue = dialogueDatabase.GetDialogue(dialogueId);

        if (dialogue == null)
        {
            Debug.LogWarning($"[Player {dataComponent?.Data?.playerId}] Dialogue ID {dialogueId} not found.");
            return;
        }

        if (!dialogue.CanStart(dataComponent.Data))
        {
            Debug.LogWarning($"[Player {dataComponent.Data.playerId}] Dialogue {dialogueId} cannot be started due to unmet requirements.");
            return;
        }

        bool isFirstCompletion = !dataComponent.Data.completedDialogues.Contains(dialogueId);
        float xpToGain = xpConfig != null
            ? xpConfig.CalculateXP(dialogue.baseXPReward, !isFirstCompletion)
            : dialogue.baseXPReward;

        if (isFirstCompletion)
        {
            dataComponent.Data.completedDialogues.Add(dialogueId);
        }

        AddXP(xpToGain);
        player.InvokeDialogueCompleted(dialogueId);
    }

    public void AddXP(float amount)
    {
        if (!IsReady)
        {
            Debug.LogWarning("[PlayerXPComponent] AddXP called before ready (missing data/xpConfig).");
            return;
        }

        dataComponent.Data.currentXP += amount;
        player.InvokeXPGained(amount);

        // Check for level up
        player.ProgressionComponent.CheckLevelProgression();
    }

    public float GetTotalXP()
    {
        if (!IsReady) return 0f;
        return dataComponent.Data.currentXP;
    }
}
