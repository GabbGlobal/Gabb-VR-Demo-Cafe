using System;
using UnityEngine;

[CreateAssetMenu(fileName = "XPConfig", menuName = "ScriptableObjects/XP/XP Configuration")]
public class XPConfig : ScriptableObject
{
    [Header("XP Multipliers")]
    public float baseXPMultiplier = 1f;
    public float repeatDialogueMultiplier = 0.5f;

    public float CalculateXP(float baseXP, bool isRepeat)
    {
        float xp = baseXP * baseXPMultiplier;

        if (isRepeat)
        {
            xp *= repeatDialogueMultiplier;
        }

        return xp;
    }
}
