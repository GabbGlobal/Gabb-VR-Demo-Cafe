using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SocialPlatforms;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    [Header("Player Configuration")]
    [SerializeField] private GameObject playerPrefab;
    [SerializeField] private Transform playerSpawnPoint;

    // TODO: Multiplayer Support
    //private Dictionary<string, Player> activePlayers = new Dictionary<string, Player>();

    public Player LocalPlayer { get; private set; } // For Demo Use

    #region Old Stuff
    public int lesson { get; private set; }
    public string language { get; private set; }
    #endregion

    private void Awake()
    {
        // Singleton
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    // Start is called before the first frame update
    private void Start()
    {
        #region Old Stuff
        lesson = 0;
        language = "english";
        //get from backend
        #endregion
        CreateLocalPlayer();
    }

    private void CreateLocalPlayer()
    {
        string localPlayerId = GetLocalPlayerId();
        string localPlayerName = GetLocalPlayerName();

        LocalPlayer = CreatePlayer(localPlayerId, localPlayerName, true);
    }


    #region Old Stuff Functions
    public void UpdateLessons()
    {
        lesson++;
    }

    public int getLessons()
    {
        return lesson;
    }
    #endregion

    #region Helper Methods
    public Player CreatePlayer(string playerId, string playerName, bool isLocalPlayer = false)
    {
        //if (activePlayers.ContainsKey(playerId))
        //{
        //    Debug.LogWarning($"[GameManager] Player {playerId} already exists");
        //    return activePlayers[playerId];
        //}
        if (playerPrefab == null)
        {
            Debug.LogError("Player prefab is not assigned!");
            return null;
        }
        GameObject playerObj = Instantiate(playerPrefab, playerSpawnPoint.position, Quaternion.identity);
        Player player = playerObj.GetComponent<Player>();

        if (player == null)
        {
            Debug.LogError("Player prefab doesn't have Player component!");
            Destroy(playerObj);
            return null;
        }

        player.Initialize(playerId);
        //activePlayers[playerId] = player;

        if(isLocalPlayer)
        {
            SetupLocalPlayer(player);
        }

        Debug.Log($"Created player: {playerId}");
        return player;
    }

    private void SetupLocalPlayer(Player player)
    {
        // TODO: Setup local player specific settings and components
    }
    private string GetLocalPlayerId()
    {
        // TODO: Load from device storage or generate
        return "LocalPlayer"; // Placeholder for now
    }

    private string GetLocalPlayerName()
    {
        // TODO: Load from device storage or generate
        return "Player"; // Placeholder for now
    }

    private string GetPlayer(string playerId)
    {
        //if (activePlayers.TryGetValue(playerId, out Player player))
        //{
        //    return player;
        //}
        //else
        //{
        //    LogWarning($"Player {playerId} not found");
        //    return null;
        //}
        return null; // Placeholder for now
    }

    public void RemovePlayer(string playerId)
    {
        //if (activePlayers.TryGetValue(playerId, out Player player))
        //{
        //    activePlayers.Remove(playerId);
        //    Destroy(player.gameObject);
        //}
    }
    #endregion

    #region Logging
    private void Log(string message)
    {
        Debug.Log($"[GameManager] { message }");
    }
    private void LogWarning(string message)
    {
        Debug.LogWarning($"[GameManager] {message}");
    }
    private void LogError(string message)
    {
        Debug.LogError($"[GameManager] {message}");
    }
    #endregion
}
