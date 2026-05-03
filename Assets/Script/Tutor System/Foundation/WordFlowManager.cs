using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;
#if !USE_AZURE && (UNITY_STANDALONE_WIN || UNITY_EDITOR_WIN)
using UnityEngine.Windows.Speech;
#endif

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

    [Header("Word Pronunciation Audio")]
    [SerializeField] private WordDatabase wordDatabase;
    [SerializeField] private bool playPronunciationOnNewWord = true;

    private int currentIndex = 0;
    private int failedAttempts = 0;
    private bool isAssessing = false;

    public int CurrentIndex => currentIndex;
    public int FailedAttempts => failedAttempts;
    public bool IsAssessing => isAssessing;
    public string CurrentWord => (wordList != null && currentIndex < wordList.Count) ? wordList[currentIndex] : null;
    public int TotalWords => wordList?.Count ?? 0;

#if !USE_AZURE && (UNITY_STANDALONE_WIN || UNITY_EDITOR_WIN)
    private DictationRecognizer dictation;
    public bool DictationRunning => dictation != null && dictation.Status == SpeechSystemStatus.Running;
#endif

    private
#if USE_AZURE
    async
#endif
    void Start()
    {
        if (wordList != null && wordList.Count > 0 && blockManager != null)
            blockManager.SetRoundBlockCount(wordList[0].Length);

        if (speechSpitter) speechSpitter.RefreshInstruction(0);
        UpdateXPUI();
        PlayWordPronunciation(0);

#if USE_AZURE
        if (AzureSpeechRecognizer.Instance != null)
            await AzureSpeechRecognizer.Instance.StartListening();
#else
        StartDictation();
#endif
    }

#if !USE_AZURE
    private void StartDictation()
    {
#if UNITY_STANDALONE_WIN || UNITY_EDITOR_WIN
        dictation = new DictationRecognizer();
        dictation.DictationResult += OnDictationResult;
        dictation.DictationHypothesis += OnDictationHypothesis;
        dictation.DictationError += (err, hr) =>
            Debug.LogWarning($"[WordFlow] Dictation error: {err} (0x{hr:X})");
        dictation.Start();
        Debug.Log("[WordFlow] DictationRecognizer started (non-Azure fallback)");
#else
        Debug.LogWarning("[WordFlow] No speech backend available — define USE_AZURE or run on Windows");
#endif
    }

    private void StopDictation()
    {
#if UNITY_STANDALONE_WIN || UNITY_EDITOR_WIN
        if (dictation != null)
        {
            if (dictation.Status == SpeechSystemStatus.Running)
                dictation.Stop();
            dictation.DictationResult -= OnDictationResult;
            dictation.DictationHypothesis -= OnDictationHypothesis;
            dictation.Dispose();
            dictation = null;
            Debug.Log("[WordFlow] DictationRecognizer stopped");
        }
#endif
    }

#if UNITY_STANDALONE_WIN || UNITY_EDITOR_WIN
    private void OnDictationResult(string text, ConfidenceLevel confidence)
    {
        string cleaned = text.Trim().TrimEnd('.').ToLowerInvariant();
        Debug.Log($"[WordFlow] Dictation heard: \"{cleaned}\" ({confidence})");
        CheckRecognizedWord(cleaned);
    }

    private void OnDictationHypothesis(string text)
    {
        Debug.Log($"[WordFlow] Dictation partial: \"{text}\"");
        ShowPartialRecognition(text);
    }
#endif
#endif

    public void ShowPartialRecognition(string partial)
    {
        if (wordList == null || wordList.Count == 0) return;
        if (isAssessing) return;
        string targetRaw = wordList[currentIndex];
        string cleaned = partial.Trim().TrimEnd('.').ToLowerInvariant();
        if (blockManager != null && !string.IsNullOrEmpty(cleaned))
            blockManager.DisplayComparison(targetRaw, cleaned);
    }

    public
#if USE_AZURE
    async
#endif
    void CheckRecognizedWord(string recognized)
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

#if USE_AZURE
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
#else
        HandlePass(targetRaw, xpPerWord);
        UpdateScoreUI(null);
#endif
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
#if USE_AZURE
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
#else
        scoreText.text = "";
#endif
    }

    private IEnumerator AdvanceAfterDelay(float seconds)
    {
        if (rewardManager) rewardManager.OnRoundEnd();

        if (currentIndex < wordList.Count - 1)
        {
            yield return new WaitForSeconds(seconds);
            currentIndex++;

            string next = wordList[currentIndex];
            if (blockManager) blockManager.SetRoundBlockCount(next.Length);
            if (speechSpitter) speechSpitter.RefreshInstruction(currentIndex);
            PlayWordPronunciation(currentIndex);
        }
        else
        {
#if USE_AZURE
            if (AzureSpeechRecognizer.Instance != null)
                _ = AzureSpeechRecognizer.Instance.StopListening();
#else
            StopDictation();
#endif
            Debug.Log("Last word reached — holding position.");
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

    private
#if USE_AZURE
    async
#endif
    void OnDisable()
    {
        if (player != null)
        {
            player.OnXPGained -= HandleXPGained;
            player.OnLevelUp -= HandleLevelUp;
        }

#if USE_AZURE
        if (AzureSpeechRecognizer.Instance != null)
            await AzureSpeechRecognizer.Instance.StopListening();
#else
        StopDictation();
#endif
    }

    private void PlayWordPronunciation(int index)
    {
        if (!playPronunciationOnNewWord || wordDatabase == null || sfxSource == null) return;
        if (index < 0 || index >= wordList.Count) return;

        var wordData = wordDatabase.GetWord(wordList[index]);
        if (wordData != null && wordData.PronunciationAudio != null)
            sfxSource.PlayOneShot(wordData.PronunciationAudio);
    }

    private void HandleXPGained(float _) => UpdateXPUI();
    private void HandleLevelUp(int _) => UpdateXPUI();
}
