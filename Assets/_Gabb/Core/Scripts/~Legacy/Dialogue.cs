using System.Collections.Generic;
using System.Linq;
using UnityEngine;


[CreateAssetMenu(fileName = "Dialogue", menuName = "Gabb/Dialogue")]
public class Dialogue : ScriptableObject
{
    public List<LineOfDialogue> linesOfDialogue;

    /*public float GetTotalXPValue() {
        float totalXpValue = 0;
        foreach (LineOfDialogue line in linesOfDialogue) {
            if (line.speaker == DialogueSpeaker.Player) {
                totalXpValue += 3f;
            }
        }
        return totalXpValue;
    }*/

    //public string language; not used now, usedlater for modular language
}

[System.Serializable]
public class TextWithDifficulty
{
    public DialogueDifficulty difficulty;
    public string text;
    public AudioClip audioClip;
}

[System.Serializable]
public class LineOfDialogue {
    public DialogueSpeaker speaker;
    public string text;
    public AudioClip audioClip;
    public string hintVideoPath; // partial path within StreamingAssets
    // NEW FIELDS FOR CHALLENGE LINES
    public bool _isChallenge = false;
    public List<GameObject> objectsToActivateOnSuccess;

    public List<TextWithDifficulty> textVariants;

    public string GetText(DialogueDifficulty difficulty)
    {
        var variant = textVariants?.FirstOrDefault(v => v.difficulty == difficulty);
        return variant != null ? variant.text : text;
    }

    public AudioClip GetAudioClip(DialogueDifficulty difficulty)
    {
        var variant = textVariants?.FirstOrDefault(v => v.difficulty == difficulty);
        return variant != null ? variant.audioClip : audioClip;
    }

    public override string ToString() {
        return $"[LineOfDialogue] {speaker.ToString()}: {text}";
    }
}

[System.Serializable]
public enum DialogueSpeaker {
    NPC,
    Player
}
