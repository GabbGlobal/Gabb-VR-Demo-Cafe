using UnityEngine;

public class PlayerDataComponent : MonoBehaviour
{
    public PlayerData Data { get; private set; }

    public void Initialize(string playerId, string playerName = "")
    {
        // In the future, load from backend/storage
        Data = LoadPlayerData(playerId) ?? new PlayerData(playerId, playerName);
    }

    private PlayerData LoadPlayerData(string playerId)
    {
        // TODO: Implement loading from backend/storage
        // For now, return null to create new data
        return null;
    }

    public void SaveData()
    {
        // TODO: Implement saving to backend/storage
        Debug.Log($"Saving player data for {Data.playerId}");
    }
}
