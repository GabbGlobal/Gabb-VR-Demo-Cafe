using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UnityEngine.Video;
using System.Threading;

public class ConversationUI : MonoBehaviour
{
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
    public List<string> advisorFailMessages;
    public Renderer videoSurface;
    public VideoPlayer videoPlayer;
    public Button hintButton;

    public static ConversationUI Instance {get; private set;}

    void Awake() {
        if (Instance != null) {
            DestroyImmediate(Instance);
        }
        Instance = this;
    }

    void Start()
    {
        playerTextStartColor = playerDialogueText.color;
        ResetText();
        ResetVideo();
        hintButton.gameObject.SetActive(false); // hide hint button
        showHideChild.gameObject.SetActive(false); // hide ui
        hintButton.onClick.AddListener(OnHintButtonClick);
    }

    public void OnStartConvo(NpcTalking npcTalking)
    {
        ResetText();
        hintButton.gameObject.SetActive(false); // hide hint button
        showHideChild.gameObject.SetActive(true); // show ui
        transform.SetParent(null);
        transform.position = npcTalking.placeUIHere.position;
        transform.rotation = npcTalking.placeUIHere.rotation;
        transform.SetParent(npcTalking.placeUIHere);
    }

    public void OnEndConvo()
    {
        showHideChild.gameObject.SetActive(true); // show ui
        if (videoCancellation != null)
        {
            videoCancellation.Cancel();
            videoCancellation.Dispose();
            videoCancellation = null;
        }
        ResetVideo();
        ResetText();
        transform.SetParent(null);
    }

    public void DisplayLineOfDialogue(LineOfDialogue lineOfDialogue)
    {
        switch (lineOfDialogue.speaker)
        {
            case DialogueSpeaker.NPC:
                {
                    Debug.Log("NPC");
                    hintButton.gameObject.SetActive(false); // hide hint button
                    ResetVideo();
                    ResetText(); // when speaking npc dialogue, clear the previous dialogue
                    npcDialogueText.text = $"THEM: {lineOfDialogue.text}";
                    // when speaking npc dialogue, clear the player's dialogue
                    break;
                }
            case DialogueSpeaker.Player:
                {
                    Debug.Log("PLAYER");
                    hintButton.gameObject.SetActive(true); // show hint button
                    playerDialogueText.text = $"YOU: {lineOfDialogue.text}";
                    break;
                }
        }
    }


    public void OnHintButtonClick()
    {
        PlayHintVideo();
    }

    CancellationTokenSource videoCancellation;
    public async Awaitable PlayHintVideo()
    {
        // get video path from the latest line of dialogue, globally
        var currentLineOfDialogue = NpcTalking.GetCurrentLineOfDialogueGlobal();
        //string videoPath = System.IO.Path.Combine(Application.streamingAssetsPath, currentLineOfDialogue?.hintVideoPath);
        string videoPath = $"{Application.streamingAssetsPath}/{currentLineOfDialogue?.hintVideoPath}";
        if (string.IsNullOrWhiteSpace(videoPath))
        {
            Debug.Log("No hint video available");
            return;
        }
        // play video from path if possible
        if (videoPlayer.isPlaying)
        {
            Debug.Log("Don't allow interrupting video.");
            return;
        }

        videoCancellation = new CancellationTokenSource();
        ResetVideo();
        videoPlayer.gameObject.SetActive(true);

        videoPlayer.url = videoPath;
        videoPlayer.Prepare();
        while (!videoPlayer.isPrepared)
        {
            if (videoCancellation.IsCancellationRequested) { return; }
            await Awaitable.NextFrameAsync();
        }
        videoSurface.enabled = true;
        videoPlayer.Play();
        // wait for video to finish
        while (videoPlayer.isPlaying)
        {
            if (videoCancellation.IsCancellationRequested) { return; }
            await Awaitable.NextFrameAsync();
        }
        ResetVideo(); // hide video player again
    }


    public void ShowSuccess()
    {
        playerDialogueText.color = successColor;
        advisorText.text = "Well done! Let's hear what they have to say next.";
        audioSource.PlayOneShot(successSound);
    }

    public void ShowFail()
    {
        playerDialogueText.color = failColor;
        advisorText.text = advisorFailMessages[Random.Range(0, advisorFailMessages.Count)]; // random advisor message
        audioSource.PlayOneShot(failSound);
    }

    public void ResetText()
    {
        npcDialogueText.text = "";
        playerDialogueText.text = "";
        playerDialogueText.color = playerTextStartColor;
        advisorText.text = "";
    }

    void ResetVideo()
    {
        videoSurface.enabled = false; // hide video renderer
        videoPlayer.Stop();
        videoPlayer.gameObject.SetActive(false);
    }
}
