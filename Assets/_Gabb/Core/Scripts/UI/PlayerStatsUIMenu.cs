using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;

public class PlayerStatsUIMenu : MonoBehaviour
{
    [Header("Word Stats UI Elements")]
    [SerializeField] private TextMeshProUGUI wordCountTXT;
    [SerializeField] private TextMeshProUGUI mistakeCountTXT;

    [Header("XP UI Elements")]
    [SerializeField] private TextMeshProUGUI xpTXT;

    private Coroutine waitForManagerCoroutine;

    private void OnEnable()
    {
        waitForManagerCoroutine = StartCoroutine(WaitForManagerThenSubscribe());
    }

    private void OnDisable()
    {
        if (waitForManagerCoroutine != null)
        {
            StopCoroutine(waitForManagerCoroutine);
            waitForManagerCoroutine = null;
        }
        if (UIManager.Instance != null)
        {
            UIManager.Instance.OnXPChanged -= UpdateXPUI;
            UIManager.Instance.OnPlayerStatsChange -= UpdateWordStatsUI;
        }
    }

    private void UpdateXPUI(float xp)
    {
        if (xpTXT == null)
        {
            Debug.LogWarning("XP Text component is not assigned.");
            return;
        }
        xpTXT.text = "XP: " + xp.ToString();
    }


    private void UpdateWordStatsUI(List<int> wordStats)
    {
        if (wordStats == null)
        {
            Debug.LogWarning("Stats list is null or does not contain enough elements.");
            return;
        }

        int wordCount = wordStats[0];
        int mistakeCount = wordStats[1];

        wordCountTXT.text = "You learned " + wordCount.ToString() + " words";
        mistakeCountTXT.text = "You had " + mistakeCount.ToString() + " mistakes";
    }

    private void PollCurrentValues()
    {
        if (UIManager.Instance == null || UIManager.Instance.player == null) return;

        Debug.Log("[LevelStatsUI]: Polling current player data for UI update.");
        var data = UIManager.Instance.player.DataComponent.Data;
        UpdateXPUI(data.currentXP);
        UpdateWordStatsUI(new List<int> { data.wordslearned, data.mistakesmade });
    }

    private IEnumerator WaitForManagerThenSubscribe()
    {
        while (UIManager.Instance == null) yield return null; // wait 1+ frames
        UIManager.Instance.OnXPChanged += UpdateXPUI;
        UIManager.Instance.OnPlayerStatsChange += UpdateWordStatsUI;
        PollCurrentValues();
    }
}
