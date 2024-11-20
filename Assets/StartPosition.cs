using UnityEngine;

// Used to indicate where the player should be at the start.
public class StartPosition : MonoBehaviour
{
    public static StartPosition Instance {get; private set;}

    void Awake() {
        if (Instance != null) {
            DestroyImmediate(Instance);
        }
        Instance = this;
    }
}
