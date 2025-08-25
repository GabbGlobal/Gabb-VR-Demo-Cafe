using UnityEngine;

[System.Serializable]
public class WordReward
{
    [Tooltip("Exact target word (accents allowed).")]
    public string word;

    [Tooltip("Object to show when the word is correctly spoken.")]
    public GameObject rewardObject;

    [Tooltip("If true, this object will be hidden at END of round. If false, it stays visible into the next round(s).")]
    public bool hideAtEndOfRound = false;

    public void Show()
    {
        if (rewardObject != null) rewardObject.SetActive(true);
    }

    public void Hide()
    {
        if (rewardObject != null) rewardObject.SetActive(false);
    }
}
