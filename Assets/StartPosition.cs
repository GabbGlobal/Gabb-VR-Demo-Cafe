using UnityEngine;

// Used to indicate where the player should be at the start.
public class StartPosition : MonoBehaviour
{
    public StartPosition Instance;

    void Awake() {
        if (Instance != null) {
            DestroyImmediate(Instance);
        }
        Instance = this;
    }
}
