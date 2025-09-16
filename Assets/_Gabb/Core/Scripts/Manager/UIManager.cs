using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class UIManager : MonoBehaviour
{
    public static UIManager Instance { get; private set; }

    public bool testMode = false;
    public float testXPInitAmount = 10f;
    public int testWordInitCount = 10;
    public int testMistakeInitCount = 2;
    [SerializeField] private List<GameObject> panellist;

    private void Awake()
    {
        // Singleton
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    public event Action<float> OnXPChanged;
    public event Action<List<int>> OnPlayerStatsChange;

    //Placeholder
    public Player player;

    private void Start()
    {
        if (!player)
        {
            Debug.LogError("[UIManager]: Player not referenced!");
        }
    }

    public void InvokeXPChanged(float amount)
    {
        OnXPChanged?.Invoke(amount);
    }

    public void InvokePlayerWordStatsChange(List<int> wordStats)
    {
        OnPlayerStatsChange?.Invoke(wordStats);
    }
    public void DisablePanel(GameObject target) 
    {
        target.SetActive(false);
    }
    public void EnablePanel(GameObject target)
    {
        target.SetActive(true);
    }
}

