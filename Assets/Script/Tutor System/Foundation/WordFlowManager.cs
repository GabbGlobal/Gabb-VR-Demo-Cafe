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
    [SerializeField] private TextMeshProUGUI xpText;

    private int currentIndex = 0;
    private int failedAttempts = 0;

    private void Start()
    {
        // Initial sized to first word
        if (wordList != null && wordList.Count > 0 && blockManager != null)
            blockManager.SetRoundBlockCount(wordList[0].Length);

        // Optional: show instructions for first word
        if (speechSpitter) speechSpitter.RefreshInstruction(0);
        UpdateXPUI();
    }

    public void CheckRecognizedWord(string recognized)
    {
        if (wordList == null || wordList.Count == 0) return;

        string targetRaw = wordList[currentIndex];
        string cleanedRecognized = TextUtils.NormalizeAccents(recognized.Trim().ToLowerInvariant());
        string cleanedTarget = TextUtils.NormalizeAccents(targetRaw.Trim().ToLowerInvariant());

        if (cleanedRecognized == cleanedTarget)
        {
            blockManager.DisplayWord(targetRaw, keepCasing: true);
            // SFX
            if (sfxSource != null && correctSfx != null) sfxSource.PlayOneShot(correctSfx);

            if (rewardManager) rewardManager.TriggerReward(targetRaw);
            if (speechSpitter) speechSpitter.RevealCorrectWord(currentIndex);
            // XP
            if (player != null && player.XPComponent != null)
            {
                if (UIManager.Instance.testMode)
                    UIManager.Instance.testXPInitAmount += xpPerWord;
                else
                    player.XPComponent.AddXP(xpPerWord);
                UpdateXPUI();
            }

            // Word Stats
            if (player != null && player.DataComponent != null)
            {
                if (UIManager.Instance.testMode)
                {
                    UIManager.Instance.testWordInitCount++;
                    UpdateWordStatsUI(UIManager.Instance.testWordInitCount, UIManager.Instance.testMistakeInitCount);
                }
                else
                {
                    PlayerData playerData = player.DataComponent.Data;
                    playerData.wordslearned++;
                    UpdateWordStatsUI(playerData.wordslearned, playerData.mistakesmade);
                }

            }


            failedAttempts = 0;
            StartCoroutine(AdvanceAfterDelay(roundAdvanceDelay));
        }
        else
        {
            failedAttempts++;
            if (player != null && player.DataComponent != null)
            {
                if (UIManager.Instance.testMode)
                {
                    UIManager.Instance.testMistakeInitCount++;
                    UpdateWordStatsUI(UIManager.Instance.testWordInitCount, UIManager.Instance.testMistakeInitCount);
                }
                else
                {
                    PlayerData playerData = player.DataComponent.Data;
                    playerData.mistakesmade++;
                    UpdateWordStatsUI(playerData.wordslearned, playerData.mistakesmade);
                }

            }

            // Visual feedback: show what the system heard vs target
            blockManager.DisplayComparison(targetRaw, recognized);

            if (failedAttempts >= maxFails)
            {
                failedAttempts = 0;
                if (sfxSource != null && tryAgainSfx != null) sfxSource.PlayOneShot(tryAgainSfx);
            }
        }
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
            Debug.Log("Last word reached — holding position.");
        }
    }

    private void UpdateXPUI()
    {
        if (xpText != null && player != null && player.XPComponent != null)
        {
            xpText.text = $"XP: {player.XPComponent.GetTotalXP()}";
        }

        // Add UIManager Invoke Event
        if (UIManager.Instance.testMode)
        {
            UIManager.Instance.InvokeXPChanged(UIManager.Instance.testXPInitAmount);
        }
        else
        {
            UIManager.Instance.InvokeXPChanged(player.XPComponent.GetTotalXP());
        }

    }

    private void UpdateWordStatsUI(int wordsLearned, int mistakesMade)
    {
        List<int> wordStats = new List<int>();
        wordStats.Add(wordsLearned);
        wordStats.Add(mistakesMade);
        UIManager.Instance.InvokePlayerWordStatsChange(wordStats);
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