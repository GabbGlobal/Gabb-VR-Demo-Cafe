using UnityEngine;

[DefaultExecutionOrder(+200)]
public class PlayerBootstrapper : MonoBehaviour
{
    [SerializeField] private Player player;
    [SerializeField] private string fallbackPlayerId = "LocalPlayer";

    private void Start()
    {
        if (player == null) player = GetComponent<Player>();
        if (player == null) return;

        var id = string.IsNullOrEmpty(fallbackPlayerId) ? "LocalPlayer" : fallbackPlayerId;
        player.Initialize(id);
    }
}