using System;
using System.Collections;
using System.Collections.Generic;
using System.Xml.Linq;
using TMPro;
using UnityEngine;

public class LevelStatsUI : MonoBehaviour
{
    [SerializeField] private TextMeshProUGUI wordsLearnedTXT;
    [SerializeField] private TextMeshProUGUI mistakesMadeTXT;
    [SerializeField] private TextMeshProUGUI xpGainedTXT;

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
        if (xpGainedTXT == null)
        {
            Debug.LogWarning("XP Text component is not assigned.");
            return;
        }
        xpGainedTXT.text = "XP: " + xp.ToString();
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

        wordsLearnedTXT.text = "You learned " + wordCount.ToString() + " words";
        mistakesMadeTXT.text = "You had " + mistakeCount.ToString() + " mistakes";
    }

    private void PollCurrentValues()
    {
        if (UIManager.Instance == null || UIManager.Instance.player == null) return;

        var data = UIManager.Instance.player.DataComponent.Data;
        UpdateXPUI(data.currentXP);
        UpdateWordStatsUI(new List<int> { data.wordslearned, data.mistakesmade });
    }

    private IEnumerator WaitForManagerThenSubscribe()
    {
        while (UIManager.Instance == null) yield return null; // wait 1+ frames

        UIManager.Instance.OnXPChanged += UpdateXPUI;
        UIManager.Instance.OnPlayerStatsChange += UpdateWordStatsUI;
        if (UIManager.Instance.testMode)
        {
            UpdateXPUI(UIManager.Instance.testXPInitAmount);
            UpdateWordStatsUI(new List<int> { UIManager.Instance.testWordInitCount, UIManager.Instance.testMistakeInitCount });
        }
        else
        {
            PollCurrentValues();
        }
    }

}
