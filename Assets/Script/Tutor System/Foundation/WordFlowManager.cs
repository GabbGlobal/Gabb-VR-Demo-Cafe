using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;

public class WordFlowManager : MonoBehaviour
{
    [Header("Target words (must match SpeechSpitterManager order/words)")]
    public List<string> wordList;

    [Header("Round flow")]
    [SerializeField] private float roundAdvanceDelay = 3.5f;
    [SerializeField] private int maxFails = 3;

    [Header("Refs")]
    public SpeechSpitterManager speechSpitter;
    public WordBlockManager blockManager;
    public WordRewardManager rewardManager;

    [Header("Feedback")]
    [SerializeField] private AudioSource sfxSource;
    [SerializeField] private AudioClip correctSfx;
    [SerializeField] private AudioClip tryAgainSfx;

    [Header("XP")]
    [SerializeField] private Player player;
    [SerializeField] private float xpPerWord = 5f;
    [SerializeField] private float xpSoftPassMultiplier = 0.5f;
    [SerializeField] private TextMeshProUGUI xpText;

    [Header("Pronunciation Scoring")]
    [SerializeField] private AudioClip softPassSfx;
    [SerializeField] private TextMeshProUGUI scoreText;
    [SerializeField] private bool usePronunciationScoring = true;

    private int currentIndex = 0;
    private int failedAttempts = 0;
    private bool isAssessing = false;

    private void Start()
    {
        // Initial sized to first word
        if (wordList != null && wordList.Count > 0 && blockManager != null)
            blockManager.SetRoundBlockCount(wordList[0].Length);

        // Optional: show instructions for first word
        if (speechSpitter) speechSpitter.RefreshInstruction(0);
        UpdateXPUI();
    }

    public async void CheckRecognizedWord(string recognized)
    {
        if (wordList == null || wordList.Count == 0) return;
        if (isAssessing) return;

        string targetRaw = wordList[currentIndex];
        string cleanedRecognized = TextUtils.NormalizeAccents(recognized.Trim().ToLowerInvariant());
        string cleanedTarget = TextUtils.NormalizeAccents(targetRaw.Trim().ToLowerInvariant());

        if (cleanedRecognized != cleanedTarget)
        {
            failedAttempts++;
            blockManager.DisplayComparison(targetRaw, recognized);

            if (failedAttempts >= maxFails)
            {
                failedAttempts = 0;
                if (sfxSource != null && tryAgainSfx != null) sfxSource.PlayOneShot(tryAgainSfx);
            }
            UpdateScoreUI(null);
            return;
        }

        if (usePronunciationScoring && AzureSpeechRecognizer.Instance != null)
        {
            isAssessing = true;
            var result = await AzureSpeechRecognizer.Instance.AssessPronunciation(targetRaw);
            isAssessing = false;

            if (result == null)
            {
                HandlePass(targetRaw, xpPerWord);
                UpdateScoreUI(null);
                return;
            }

            UpdateScoreUI(result);

            switch (result.Grade)
            {
                case PronunciationGrade.Pass:
                    HandlePass(targetRaw, xpPerWord);
                    break;
                case PronunciationGrade.SoftPass:
                    HandleSoftPass(targetRaw, xpPerWord * xpSoftPassMultiplier);
                    break;
                case PronunciationGrade.Fail:
                    HandleScoredFail(targetRaw, recognized);
                    return;
            }
        }
        else
        {
            HandlePass(targetRaw, xpPerWord);
            UpdateScoreUI(null);
        }
    }

    private void HandlePass(string targetRaw, float xp)
    {
        blockManager.DisplayWord(targetRaw, keepCasing: true);
        if (sfxSource != null && correctSfx != null) sfxSource.PlayOneShot(correctSfx);
        if (rewardManager) rewardManager.TriggerReward(targetRaw);
        if (speechSpitter) speechSpitter.RevealCorrectWord(currentIndex);

        if (player != null && player.XPComponent != null)
        {
            player.XPComponent.AddXP(xp);
            UpdateXPUI();
        }

        failedAttempts = 0;
        StartCoroutine(AdvanceAfterDelay(roundAdvanceDelay));
    }

    private void HandleSoftPass(string targetRaw, float xp)
    {
        blockManager.DisplayWord(targetRaw, keepCasing: true);
        if (sfxSource != null && softPassSfx != null) sfxSource.PlayOneShot(softPassSfx);
        else if (sfxSource != null && correctSfx != null) sfxSource.PlayOneShot(correctSfx);
        if (speechSpitter) speechSpitter.RevealCorrectWord(currentIndex);

        if (player != null && player.XPComponent != null)
        {
            player.XPComponent.AddXP(xp);
            UpdateXPUI();
        }

        failedAttempts = 0;
        StartCoroutine(AdvanceAfterDelay(roundAdvanceDelay));
    }

    private void HandleScoredFail(string targetRaw, string recognized)
    {
        failedAttempts++;
        blockManager.DisplayComparison(targetRaw, recognized);

        if (failedAttempts >= maxFails)
        {
            failedAttempts = 0;
            if (sfxSource != null && tryAgainSfx != null) sfxSource.PlayOneShot(tryAgainSfx);
        }
    }

    private void UpdateScoreUI(PronunciationResult result)
    {
        if (scoreText == null) return;
        if (result == null)
        {
            scoreText.text = "";
            return;
        }

        string color = result.Grade switch
        {
            PronunciationGrade.Pass => "#4CAF50",
            PronunciationGrade.SoftPass => "#FFC107",
            PronunciationGrade.Fail => "#F44336",
            _ => "#FFFFFF"
        };

        scoreText.text = $"<color={color}>{result.pronunciationScore:F0}%</color>\n" +
                         $"<size=60%>Acc:{result.accuracyScore:F0} Flu:{result.fluencyScore:F0} Comp:{result.completenessScore:F0}</size>";
    }

    private IEnumerator AdvanceAfterDelay(float seconds)
    {
        

        if (rewardManager) rewardManager.OnRoundEnd();

        //Only advance if not at last index
        if (currentIndex < wordList.Count - 1)
        {
            yield return new WaitForSeconds(seconds);
            currentIndex++;

            string next = wordList[currentIndex];
            if (blockManager) blockManager.SetRoundBlockCount(next.Length);
            if (speechSpitter) speechSpitter.RefreshInstruction(currentIndex);
        }
        else
        {
            if (AzureSpeechRecognizer.Instance != null)
            {
                _ = AzureSpeechRecognizer.Instance.StopListening();
            }
            Debug.Log("Last word reached � holding position.");
        }
    }

    private void UpdateXPUI()
    {
        if (xpText != null && player != null && player.XPComponent != null)
        {
            xpText.text = $"XP: {player.XPComponent.GetTotalXP()}";
        }
    }

    private void OnEnable()
    {
        if (player != null)
        {
            player.OnXPGained += HandleXPGained;
            player.OnLevelUp += HandleLevelUp;
        }
    }

    private void OnDisable()
    {
        if (player != null)
        {
            player.OnXPGained -= HandleXPGained;
            player.OnLevelUp -= HandleLevelUp;
        }
    }

    private void HandleXPGained(float _) => UpdateXPUI();
    private void HandleLevelUp(int _) => UpdateXPUI();
}