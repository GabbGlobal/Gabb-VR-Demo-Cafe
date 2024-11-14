using System.Collections.Generic;
using UnityEngine;


[CreateAssetMenu(fileName = "Dialogue", menuName = "Gabb/Dialogue")]
public class Dialogue : ScriptableObject
{
    public List<LineOfDialogue> linesOfDialogue;
    //public string language; not used now, usedlater for modular language
}

[System.Serializable]
public class LineOfDialogue {
    public DialogueSpeaker speaker;
    public string text;
    public AudioClip audioClip;
    public string hintVideoPath; // partial path within StreamingAssets

    public override string ToString() {
        return $"[LineOfDialogue] {speaker.ToString()}: {text}";
    }
}

[System.Serializable]
public enum DialogueSpeaker {
    NPC,
    Player
}
