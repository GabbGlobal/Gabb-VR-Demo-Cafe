using System.Collections.Generic;
using UnityEngine;

public class DialogueSystemManager : MonoBehaviour
{
    public static DialogueSystemManager Instance { get; private set; }

    //[Header("Dialogue Settings")]
    //[SerializeField] private List<DialogueReward> dialogueRewards;

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
    }

    public void StartDialogue(Player player, string npcId)
    {
        // Start dialogue logic
        Debug.Log($"Starting dialogue with {npcId} for player {player.GetPlayerData().playerId}");
    }

    public void CompleteDialogue(Player player, string dialogueId)
    {
        // Notify the player's XP component
        player.CompleteDialogue(dialogueId);
    }
}
