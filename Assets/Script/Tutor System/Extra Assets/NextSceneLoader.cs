using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;

public class NextSceneLoader : MonoBehaviour
{
    [SerializeField] private string sceneName = "Level2";
    [SerializeField] private float waitBeforeFade = 0.7f;  // wait after pressing button
    [SerializeField] private float fadeDuration = 0.5f; // blink speed

    public void TriggerSceneChange()
    {
        StartCoroutine(LoadSceneRoutine());
    }

    private IEnumerator LoadSceneRoutine()
    {
        // Optional: small pause before fade
        if (waitBeforeFade > 0f)
            yield return new WaitForSeconds(waitBeforeFade);

        // Fade to black
        if (ScreenFader.Instance != null)
            yield return ScreenFader.Instance.FadeOut(fadeDuration);

        // Load the scene synchronously
        SceneManager.LoadScene(sceneName);
    }
}
