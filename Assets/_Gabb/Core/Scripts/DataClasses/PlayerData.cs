using System;
using System.Collections.Generic;
using UnityEngine;

[Serializable]
public class PlayerData
{
    public string playerId;
    public string playerName;
    public int wordslearned;
    public int mistakesmade;

    public float currentXP;

    public int currentLevel;
    public HashSet<string> completedDialogues = new HashSet<string>();

    public PlayerData(string id)
    {
        playerId = id;

        wordslearned = 0;
        mistakesmade = 0;


        currentXP = 0;
        currentLevel = 1;
    }
}
