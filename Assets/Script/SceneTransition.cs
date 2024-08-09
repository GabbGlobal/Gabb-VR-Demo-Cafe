using UnityEngine;
using UnityEngine.SceneManagement;

public class SceneTransition : MonoBehaviour
{
    // Name of the scene to load upon collision
    public string targetScene;

    private void OnTriggerEnter(Collider other)
    {
        // Check if the object colliding is the user
        if (other.CompareTag("Player"))
        {
            // Load the target scene
            SceneManager.LoadScene(targetScene);
        }
    }
}
