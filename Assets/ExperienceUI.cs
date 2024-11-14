using System.Collections;
using NUnit.Framework.Constraints;
using UnityEngine;
using UnityEngine.UI;

public class ExperienceUI : MonoBehaviour
{
    public Slider xpSlider;
    public float XP {get; private set;}
    public float MaxXP {get; private set;} = 100f;
    public AudioSource audioSource;
    public float lerpSpeed = 4f;

    // singleton
    public static ExperienceUI Instance {get; private set;}
    void Awake() {
        if (Instance == null) {
            DestroyImmediate(Instance);
        }
        Instance = this;
    }
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        UpdateUIInstant();
        //StartCoroutine(Test());
    }

    IEnumerator Test() {
        while (isActiveAndEnabled) {
            yield return new WaitForSecondsRealtime(4f);
            AddXP(Random.Range(-3f, 20f));
        }
    }

    void Update() {
        // smoothly increase the experience bar
        xpSlider.maxValue = MaxXP;
        float xpClamped = Mathf.Min(XP, MaxXP);
        if (xpSlider.value < xpClamped) {
            xpSlider.value = Mathf.Lerp(xpSlider.value, xpClamped, Time.deltaTime * lerpSpeed);
        }
    }

    void UpdateUIInstant() {
        xpSlider.maxValue = MaxXP;
        xpSlider.value = Mathf.Min(XP, MaxXP);
    }

    public void AddXP(float xp) {
        if (xp < 0f) {
            Debug.LogWarning($"Not allowed to add negative xp: {xp}");
            return;
        }
        this.XP += xp;
        audioSource.PlayOneShot(audioSource.clip);
    }
}
