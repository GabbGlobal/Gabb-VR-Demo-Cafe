using UnityEngine;
using UnityEngine.SceneManagement;

public class SceneTransition : MonoBehaviour
{
    // Name of the scene to load upon collision
    public string targetScene;

    public void LoadTargetScene()
    {
        SceneManager.LoadScene(targetScene);
    }
}
