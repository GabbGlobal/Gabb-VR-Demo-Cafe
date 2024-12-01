using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UnityEngine.Video;
using System.Threading;
using Microsoft.CognitiveServices.Speech;
using System.Linq;

public class ConversationUI : MonoBehaviour
{
    [SerializeField] private float yOffset;
    public TMP_Text npcDialogueText;
    public TMP_Text playerDialogueText;
    public TMP_Text advisorText;
    public Transform showHideChild;
    private Color playerTextStartColor;
    //public Color successColor = Color.green;
    //public Color failColor = Color.red;
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
                    npcDialogueText.text = lineOfDialogue.text;
                    // when speaking npc dialogue, clear the player's dialogue
                    break;
                }
            case DialogueSpeaker.Player:
                {
                    Debug.Log("PLAYER");
                    hintButton.gameObject.SetActive(true); // show hint button
                    playerDialogueText.text = lineOfDialogue.text;
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


    public void ShowSuccess(PronunciationAssessor.PronunciationAssessmentResultRoot rawResult)
    {
        //playerDialogueText.color = successColor;
        playerDialogueText.text = $"<color=\"green\">{playerDialogueText.text}</color>"; // make text green
        advisorText.text = "Well done! Let's hear what they have to say next.";

        string phonemeResults = GetColoredPhonemesResultString(rawResult);
        if (!string.IsNullOrWhiteSpace(phonemeResults)) {
            playerDialogueText.text += $"\n{phonemeResults}"; // add phoneme results on a new line
        }
        audioSource.PlayOneShot(successSound);
    }

    public void ShowFail(int failedAttempts, PronunciationAssessor.PronunciationAssessmentResultRoot rawResult)
    {
        playerDialogueText.text = $"<color=\"red\">{playerDialogueText.text}</color>"; // make text red
        advisorText.text = advisorFailMessages[failedAttempts - 1]; // show advisor message by failed attempt #
        string phonemeResults = GetColoredPhonemesResultString(rawResult);
        if (!string.IsNullOrWhiteSpace(phonemeResults)) {
            playerDialogueText.text += $"\n{phonemeResults}"; // add phoneme results on a new line
        }
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

    public float phonemePassThreshold = 0.98f;

    string GetColoredPhonemesResultString(PronunciationAssessor.PronunciationAssessmentResultRoot rawResult) {
        Debug.Log("EEEEE");
        string coloredString = "";
        //rawResult.
        var words = rawResult?.NBest?.First()?.Words;
        if (words == null) { return null; }
        foreach (PronunciationAssessor.WordModel word in words) {
            if (word.Phonemes == null) { return null; }
            foreach (PronunciationAssessor.PhonemeModel phoneme in word.Phonemes) {
                Debug.Log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
                // check if phoneme was pronounced accurately
                if (phoneme.PronunciationAssessment.AccuracyScore > phonemePassThreshold) {
                    coloredString += $"<color=\"green\">{phoneme.Phoneme}</color>"; // add green phoneme to string
                } else {
                    coloredString += $"<color=\"red\">{phoneme.Phoneme}</color>"; // add red phoneme to string
                }
            }
        }
        return coloredString;
        //speechRecognitionResult.get
    }
}
