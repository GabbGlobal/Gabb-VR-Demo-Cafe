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
    private Color playerTextStartColor;
    public Color successColor = Color.green;
    public Color failColor = Color.red;
    public AudioSource audioSource;
    public AudioClip successSound;
    public AudioClip failSound;

    void Start() {

        playerTextStartColor = playerDialogueText.color;
        showHideChild.gameObject.SetActive(false); // hide ui
    }

    public void StartConvo(NpcTalking npcTalking)
    {
        showHideChild.gameObject.SetActive(true); // show ui
        ResetText();
        transform.SetParent(null);
        transform.position = npcTalking.placeUIHere.position;
        transform.rotation = npcTalking.placeUIHere.rotation;
        transform.SetParent(npcTalking.placeUIHere);

    }

    public void DisplayLineOfDialogue(LineOfDialogue lineOfDialogue) {
        switch (lineOfDialogue.speaker) {
            case DialogueSpeaker.NPC: {
                ResetText(); // when speaking npc dialogue, clear the previous dialogue
                npcDialogueText.text = lineOfDialogue.text;
                // when speaking npc dialogue, clear the player's dialogue
                break;
            }
            case DialogueSpeaker.Player:  {
                playerDialogueText.text = lineOfDialogue.text;
                break;
            }
        }
    }

    public void ShowSuccess() {
        playerDialogueText.color = successColor;
        advisorText.text = "Well done! Let's hear what they have to say next.";
        audioSource.PlayOneShot(successSound);
    }

    public void ShowFail() {
        playerDialogueText.color = failColor;
        advisorText.text = "And now you will cast into a pit for all time. :(";
        audioSource.PlayOneShot(failSound);
    }

    public void ResetText() {
        npcDialogueText.text = "";
        playerDialogueText.text = "";
        playerDialogueText.color = playerTextStartColor;
        advisorText.text = "";
    }
}
