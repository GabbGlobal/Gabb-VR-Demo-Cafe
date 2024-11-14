using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class ConversationUI : MonoBehaviour
{

    [SerializeField] private GameObject player;

    [SerializeField] private float yOffset;
    public TMP_Text npcDialogueText;
    public TMP_Text playerDialogueText;
    public TMP_Text advisorText;
    public Transform showHideChild;

    void Start() {
        showHideChild.gameObject.SetActive(false); // hide ui
    }

    public void StartConvo(NpcTalking npcTalking)
    {
        showHideChild.gameObject.SetActive(true); // show ui
        npcDialogueText.text = "";
        playerDialogueText.text = "";
        advisorText.text = "";
        transform.SetParent(null);
        transform.position = npcTalking.placeUIHere.position;
        transform.rotation = npcTalking.placeUIHere.rotation;
        transform.SetParent(npcTalking.placeUIHere);

    }

    public void DisplayLineOfDialogue(LineOfDialogue lineOfDialogue) {
        switch (lineOfDialogue.speaker) {
            case (DialogueSpeaker.NPC): {
                npcDialogueText.text = lineOfDialogue.text;
                // when speaking npc dialogue, clear the player's dialogue
                playerDialogueText.text = "";
                break;
            }
            case (DialogueSpeaker.Player):  {
                playerDialogueText.text = lineOfDialogue.text;
                break;
            }
        }
    }
}
