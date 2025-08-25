using System.Collections.Generic;
using UnityEngine;

public class WordRewardManager : MonoBehaviour
{
    [SerializeField] private List<WordReward> rewards = new List<WordReward>();

    public void TriggerReward(string word)
    {
        string cleaned = TextUtils.NormalizeAccents(word);
        foreach (var r in rewards)
        {
            if (TextUtils.NormalizeAccents(r.word) == cleaned)
                r.Show();
        }
    }

    /// Hide only rewards flagged to hide at end of round.
    public void OnRoundEnd()
    {
        foreach (var r in rewards)
        {
            if (r.hideAtEndOfRound)
                r.Hide();
        }
    }
}


