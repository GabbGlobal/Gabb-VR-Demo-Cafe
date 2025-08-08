using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Player : MonoBehaviour
{
    [Header("Player Identity")]
    [SerializeField] private string playerId;

    public PlayerDataComponent DataComponent { get; private set; }
    public PlayerXPComponent XPComponent { get; private set; }
    public PlayerProgressionComponent ProgressionComponent { get; private set; }

    public event Action<float> OnXPGained;
    public event Action<int> OnLevelUp;
    public event Action<string> OnDialogueCompleted;

    private void Awake()
    {
        DataComponent = GetComponent<PlayerDataComponent>() ?? gameObject.AddComponent<PlayerDataComponent>();
        XPComponent = GetComponent<PlayerXPComponent>() ?? gameObject.AddComponent<PlayerXPComponent>();
        ProgressionComponent = GetComponent<PlayerProgressionComponent>() ?? gameObject.AddComponent<PlayerProgressionComponent>();
    }

    public void Initialize(string id)
    {
        playerId = id;

        DataComponent.Initialize(playerId);
        XPComponent.Initialize(this);
        ProgressionComponent.Initialize(this);
    }

    public void CompleteDialogue(string dialogueId)
    {
        XPComponent.ProcessCompleteDialogue(dialogueId);
    }

    public PlayerData GetPlayerData()
    {
        return DataComponent.Data;
    }

    #region Invoke Event Wrappers
    public void InvokeXPGained(float xp)
    {
        OnXPGained?.Invoke(xp);
    }

    public void InvokeLevelUp(int newLevel)
    {
        OnLevelUp?.Invoke(newLevel);
    }

    public void InvokeDialogueCompleted(string dialogueId)
    {
        OnDialogueCompleted?.Invoke(dialogueId);
    }

    #endregion
}
