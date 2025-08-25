using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;

public class ScreenFader : MonoBehaviour
{
    public static ScreenFader Instance { get; private set; }

    [Header("Canvas")]
    [SerializeField] private CanvasGroup group;

    [Header("Timings")]
    [SerializeField] private float defaultDuration = 0.5f;
    [SerializeField] private float sceneFadeInDuration = 0.35f;

    [Header("Behavior")]
    [SerializeField] private bool autoFadeOnSceneLoad = true;
    [SerializeField] private bool startBlackOnFirstScene = true;

    void Awake()
    {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }
        Instance = this;
        DontDestroyOnLoad(gameObject);

        if (!group) group = GetComponent<CanvasGroup>();

        // On app start, show black (blink open)
        group.alpha = startBlackOnFirstScene ? 1f : 0f;

        if (autoFadeOnSceneLoad)
            SceneManager.sceneLoaded += OnSceneLoaded;
    }

    void OnDestroy()
    {
        if (Instance == this)
            SceneManager.sceneLoaded -= OnSceneLoaded;
    }

    private void OnSceneLoaded(Scene scene, LoadSceneMode mode)
    {
        group.alpha = 1f;
        FadeIn(sceneFadeInDuration);
    }

    // --- Public API ---
    public Coroutine FadeOut(float duration = -1f) => StartCoroutine(FadeTo(1f, duration));
    public Coroutine FadeIn(float duration = -1f) => StartCoroutine(FadeTo(0f, duration));

    // Optional helper if you want a delayed fade-in somewhere
    public Coroutine FadeInAfter(float delay, float duration = -1f) =>
        StartCoroutine(FadeInAfterCo(delay, duration));

    IEnumerator FadeInAfterCo(float delay, float duration)
    {
        yield return new WaitForSecondsRealtime(delay);
        yield return FadeIn(duration);
    }

    // --- Core tween ---
    IEnumerator FadeTo(float target, float duration)
    {
        if (duration < 0f) duration = defaultDuration;
        float start = group.alpha;
        float t = 0f;
        while (t < 1f)
        {
            t += Time.unscaledDeltaTime / duration;
            group.alpha = Mathf.Lerp(start, target, t);
            yield return null;
        }
        group.alpha = target;
    }
}
