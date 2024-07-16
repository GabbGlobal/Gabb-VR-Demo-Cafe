using UnityEngine;
using System.Collections.Generic;
using UnityEngine.SceneManagement;
using TMPro;
using UnityEngine.UI;
using UnityEngine.Video;

public class InteractionManager : MonoBehaviour
{
    // Delegate for showing text
    public delegate void ShowText();
    public static event ShowText showText;
    
    // References to game components
    GameManager gameManager;

    // Game state variables
    private string language;
    private int progress = 0;
    private int lessons;
    private bool usedHint = false;
    private float totalExperiencePoints = 0;
    private float maxExperiencePoints = 0;
    private int correctDialogues = 0;
    private int incorrectDialogues = 0;
    private int consecutiveIncorrect = 0;
    private bool restartDialogueNext = false;
    private HashSet<GameObject> completedCharacters = new HashSet<GameObject>();

    // UI elements and components
    [SerializeField] ConversationUI conversationUI;
    [SerializeField] DialogUIAnim[] UIAnim;
    [SerializeField] private GameObject[] dialogPanel;
    [SerializeField] private GameObject[] text;
    [SerializeField] private loadDialog[] loadDialog;
    [SerializeField] private TMP_Text advisorText;
    [SerializeField] private Button hintButton;
    [SerializeField] private VideoPlayer videoPlayer; // Reference to VideoPlayer

    // Dialogue data
    [SerializeField] private TextAsset jsonFile;
    Root dialogInJson;
    private List<List<string>> dialogData;
    private string startSpeaker;

    // Character and NPC variables
    [SerializeField] private GameObject[] characters;
    private GameObject currentCharacter;
    private GameObject previousCharacter;
    NpcTalking npcTalking;
    bool completeDialog = false;
    private float dialogueDistance = 4f;
    private AudioSource audioSource;

    // Experience text and video display
    private TMP_Text experienceText;
    private RawImage videoRawImage; // For displaying video

    void Start()
    {
        // Initialize game manager and check for null
        gameManager = GetComponent<GameManager>();
        if (gameManager == null)
        {
            Debug.LogError("gamemanager is null");
        }

        // Get the language and load JSON data
        language = gameManager.language;
        GetJsonData();

        // Set initial state for advisor text and audio source
        advisorText.gameObject.SetActive(false);
        audioSource = gameObject.AddComponent<AudioSource>();

        // Create experience text UI element
        GameObject expTextObject = new GameObject("ExperienceText");
        expTextObject.transform.SetParent(this.transform);
        expTextObject.AddComponent<Canvas>().renderMode = RenderMode.ScreenSpaceOverlay;
        experienceText = expTextObject.AddComponent<TextMeshProUGUI>();
        experienceText.fontSize = 24;
        experienceText.color = Color.white;
        experienceText.alignment = TextAlignmentOptions.TopLeft;
        RectTransform rectTransform = experienceText.GetComponent<RectTransform>();
        rectTransform.anchorMin = new Vector2(0, 1);
        rectTransform.anchorMax = new Vector2(0, 1);
        rectTransform.pivot = new Vector2(0, 1);
        rectTransform.anchoredPosition = new Vector2(10, -10);

        // Set up hint button
        hintButton.gameObject.SetActive(false);
        hintButton.onClick.AddListener(OnHintButtonClick);

        // Set up video player
        videoPlayer.renderMode = VideoRenderMode.RenderTexture;
        videoPlayer.targetTexture = new RenderTexture(Screen.width, Screen.height, 0);
        videoPlayer.isLooping = false;
        videoPlayer.playOnAwake = false;
        videoPlayer.loopPointReached += OnVideoEnd;

        // Create RawImage for video display
        GameObject videoRawImageObject = new GameObject("VideoRawImage");
        Canvas canvas = videoRawImageObject.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        videoRawImage = videoRawImageObject.AddComponent<RawImage>();
        videoRawImage.texture = videoPlayer.targetTexture;
        videoRawImage.rectTransform.sizeDelta = new Vector2(Screen.width, Screen.height);
        videoRawImage.gameObject.SetActive(false); // Initially hidden
    }

    // Load JSON data
    void GetJsonData()
    {
        lessons = gameManager.lesson;
        string _json = jsonFile.ToString();
        var data = Newtonsoft.Json.JsonConvert.DeserializeObject<Root>(_json);

        int characterIndex = System.Array.IndexOf(characters, currentCharacter);
        if (characterIndex >= 0 && characterIndex < data.english.Count)
        {
            startSpeaker = data.english[characterIndex].start;
            dialogData = data.english[characterIndex].dialog;
        }
        else
        {
            Debug.LogError("Invalid character index or data.");
        }
    }

    void Update()
    {
        // Update experience text
        experienceText.text = $"Experience: {totalExperiencePoints} / {maxExperiencePoints}";

        // Handle character facing and movement
        if (currentCharacter == null)
        {
            GameObject nearestCharacter = FindNearestCharacter();

            if (nearestCharacter != null && Vector3.Distance(Camera.main.transform.position, nearestCharacter.transform.position) <= dialogueDistance)
            {
                if (previousCharacter != nearestCharacter)
                {
                    if (previousCharacter != null)
                    {
                        previousCharacter.GetComponent<NpcTalking>().ReturnToOriginalRotation();
                    }
                    previousCharacter = nearestCharacter;
                }
                nearestCharacter.GetComponent<NpcTalking>().FaceUser(true);
            }
            else
            {
                if (previousCharacter != null)
                {
                    previousCharacter.GetComponent<NpcTalking>().ReturnToOriginalRotation();
                    previousCharacter = null;
                }
            }
        }
        else
        {
            if (IsInView(currentCharacter) && Vector3.Distance(Camera.main.transform.position, currentCharacter.transform.position) <= dialogueDistance)
            {
                currentCharacter.GetComponent<NpcTalking>().FaceUser(true);
            }
        }

        // Handle input for progressing or restarting dialogue
        if (Input.GetKeyDown(KeyCode.Space))
        {
            Debug.Log("User pressed space.");
            if (restartDialogueNext)
            {
                RestartDialogue();
            }
            else
            {
                if (currentCharacter == null)
                {
                    GameObject nearestCharacter = FindNearestCharacter();
                    if (nearestCharacter != null && IsInView(nearestCharacter) && Vector3.Distance(Camera.main.transform.position, nearestCharacter.transform.position) <= dialogueDistance)
                    {
                        currentCharacter = nearestCharacter;
                        StartConv(currentCharacter);
                    }
                }
                else if (IsInView(currentCharacter) && completeDialog)
                {
                    progress++;
                    if (progress >= dialogData.Count)
                    {
                        gameManager.UpdateLessons();
                        EndConv();
                    }
                    else
                    {
                        StartConv(currentCharacter);
                    }
                    completeDialog = false;
                }
                else if (IsInView(currentCharacter))
                {
                    StartConv(currentCharacter);
                }
                ResetDialogueTextColors();
                advisorText.gameObject.SetActive(false);
            }
        }

        // Handle dialogue end when user moves too far
        if (currentCharacter != null && Vector3.Distance(Camera.main.transform.position, currentCharacter.transform.position) > dialogueDistance)
        {
            EndConv();
            maxExperiencePoints += 3f;
        }

        // Handle pronunciation input
        if (currentCharacter != null)
        {
            if (Input.GetKeyDown(KeyCode.N))
            {
                HandleCorrectPronunciation();
            }
            else if (Input.GetKeyDown(KeyCode.M))
            {
                HandleIncorrectPronunciation();
            }
        }

        // Handle input for showing ending screen and restarting game
        if (Input.GetKeyDown(KeyCode.E))
        {
            ShowEndingScreen();
        }

        if (Input.GetKeyDown(KeyCode.R))
        {
            RestartGame();
        }
    }

    // Check if a character is in view of the camera
    bool IsInView(GameObject character)
    {
        Vector3 screenPoint = Camera.main.WorldToViewportPoint(character.transform.position);
        return screenPoint.z > 0 && screenPoint.x > 0.25f && screenPoint.x < 0.75f && screenPoint.y > -0.5f && screenPoint.y < 1.5f;
    }

    // Find the nearest character to the player
    GameObject FindNearestCharacter()
    {
        GameObject nearestCharacter = null;
        float shortestDistance = Mathf.Infinity;
        Vector3 cameraPosition = Camera.main.transform.position;

        foreach (GameObject character in characters)
        {
            float distance = Vector3.Distance(cameraPosition, character.transform.position);
            if (distance < shortestDistance && IsInView(character))
            {
                shortestDistance = distance;
                nearestCharacter = character;
            }
        }
        return nearestCharacter;
    }

    // Check which speaker starts the conversation
    int CheckSpeaker()
    {
        if (startSpeaker == "npc")
        {
            return 1;
        }
        else { return 0; }
    }

    // Start a conversation with an NPC
    void StartConv(GameObject _npcName = null)
    {
        if (_npcName != null)
        {
            currentCharacter = _npcName;
            GetJsonData();
            npcTalking = _npcName.GetComponent<NpcTalking>();
            if (npcTalking == null)
            {
                Debug.LogError("npctalking is null");
            }
            npcTalking.Talk(true);
            conversationUI.StartConv(_npcName);
            dialogPanel[CheckSpeaker()].SetActive(true);

            // Only show the hint button if the user dialogue text is not empty
            string userDialogueText = dialogData[progress][1];
            hintButton.gameObject.SetActive(!string.IsNullOrEmpty(userDialogueText));
            SetText1(CheckSpeaker());
        }
        else
        {
            UIAnim[CheckSpeaker()].UIDisplay();
        }
        Debug.Log("Dialogue Character Text Played.");
        PlayDialogueAudio();
    }

    // End a conversation
    void EndConv()
    {
        foreach (var panel in dialogPanel)
        {
            panel.SetActive(false);
        }
        hintButton.gameObject.SetActive(false);
        if (npcTalking != null)
        {
            npcTalking.Talk(false);
            npcTalking = null;
        }

        if (progress >= dialogData.Count && currentCharacter != null)
        {
            completedCharacters.Add(currentCharacter);
        }

        currentCharacter = null;
        progress = 0;
        completeDialog = false;
        usedHint = false;
        consecutiveIncorrect = 0;

        if (completedCharacters.Count >= characters.Length)
        {
            ShowEndingScreen();
        }
    }

    // Set dialogue text for the current speaker
    public void SetText1(int _speaker)
    {
        if (progress < dialogData.Count)
        {
            text[_speaker].SetActive(true);
            int _n = _speaker;
            if (CheckSpeaker() == 1)
            {
                _n = (_n - 1) * -1;
            }
            string _text = dialogData[progress][_n];
            loadDialog[_speaker].UpdateText(_text);
        }
        else
        {
            Debug.LogError("Progress out of range");
        }
    }

    // Advance dialogue text
    public void SetText2(int _speaker)
    {
        if (_speaker == CheckSpeaker())
        {
            int newSpeaker = (CheckSpeaker() - 1) * -1;
            if (dialogPanel[newSpeaker].activeSelf)
            {
                UIAnim[newSpeaker].UIDisplay();
            }
            else
            {
                dialogPanel[newSpeaker].SetActive(true);
            }
            SetText1(newSpeaker);
        }
        else
        {
            completeDialog = true;
        }

        audioSource.Stop(); // Stop any currently playing audio
        PlayDialogueAudio(); // Play the corresponding audio when dialogue advances
    }

    // Play dialogue audio
    void PlayDialogueAudio()
    {
        int characterIndex = System.Array.IndexOf(characters, currentCharacter);
        string conversation = characterIndex < 2 ? "7" : "8";
        string version = (characterIndex % 2 == 0) ? "1" : "2";
        string audioClipName = $"conversation{conversation}_version{version}_audio{progress + 1}";
        AudioClip clip = Resources.Load<AudioClip>(audioClipName);

        if (clip != null)
        {
            audioSource.Stop(); // Stop any currently playing audio
            audioSource.clip = clip;
            audioSource.Play();
        }
        else
        {
            Debug.LogError($"Audio clip {audioClipName} not found.");
        }
    }

    // Handle correct pronunciation
    void HandleCorrectPronunciation()
    {
        Debug.Log("User pronounced the dialogue user text correctly.");
        Debug.Log("The dialogue user text became green.");
        correctDialogues++;

        text[0].GetComponent<TMP_Text>().color = Color.green;
        advisorText.gameObject.SetActive(true);
        advisorText.text = "Well done! Let's hear what they have to say next.";

        float experienceGained = 3f;

        if (consecutiveIncorrect == 1)
        {
            experienceGained = 2f;
        }
        else if (consecutiveIncorrect == 2)
        {
            experienceGained = 1f;
        }

        if (usedHint)
        {
            experienceGained *= 0.5f;
        }

        totalExperiencePoints += experienceGained;
        maxExperiencePoints += 3f;
        Debug.Log($"Experience Increased by {experienceGained} Points. Experience Points: {totalExperiencePoints} out of {maxExperiencePoints}.");
        Debug.Log("Advisor 0 Audio Played.");
        usedHint = false;
        consecutiveIncorrect = 0;
    }

    // Handle incorrect pronunciation
    void HandleIncorrectPronunciation()
    {
        Debug.Log("User pronounced the dialogue user text incorrectly.");
        Debug.Log("The dialogue user text became red.");
        incorrectDialogues++;
        consecutiveIncorrect++;

        text[0].GetComponent<TMP_Text>().color = Color.red;

        advisorText.gameObject.SetActive(true);
        if (consecutiveIncorrect == 1)
        {
            advisorText.text = "That wasn't quite right. Let's see what went wrong.";
            Debug.Log("Advisor 1 Audio Played.");
        }
        else if (consecutiveIncorrect == 2)
        {
            advisorText.text = "Let's try that again.";
            Debug.Log("Advisor 2 Audio Played.");
        }
        else if (consecutiveIncorrect == 3)
        {
            advisorText.text = "All right, let's start from the beginning.";
            Debug.Log("Advisor 3 Audio Played.");
            Debug.Log("Dialogue Reset.");
            restartDialogueNext = true;
        }
    }

    // Show the ending screen with the results
    void ShowEndingScreen()
    {
        // Create a canvas for the ending screen
        GameObject canvasObject = new GameObject("EndingScreenCanvas");
        Canvas canvas = canvasObject.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        CanvasScaler canvasScaler = canvasObject.AddComponent<CanvasScaler>();
        canvasScaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        canvasScaler.referenceResolution = new Vector2(1920, 1080);
        canvasObject.AddComponent<GraphicRaycaster>();

        // Create a panel for the popup background
        GameObject panelObject = new GameObject("PopupPanel");
        RectTransform panelRect = panelObject.AddComponent<RectTransform>();
        panelRect.SetParent(canvasObject.transform, false);
        panelRect.sizeDelta = new Vector2(1600, 900);
        Image panelImage = panelObject.AddComponent<Image>();
        panelImage.sprite = Resources.Load<Sprite>("option_tab1");
        panelImage.color = Color.white; // Ensure image is visible

        // Create a text element for the ending message
        GameObject textObject = new GameObject("EndingMessage");
        RectTransform textRect = textObject.AddComponent<RectTransform>();
        textRect.SetParent(panelObject.transform, false);
        textRect.sizeDelta = new Vector2(1400, 500);
        textRect.anchoredPosition = new Vector2(0, 100);
        Text messageText = textObject.AddComponent<Text>();
        messageText.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
        messageText.fontSize = 30;
        messageText.alignment = TextAnchor.MiddleCenter;
        messageText.color = Color.black;

        float experiencePercentage = (totalExperiencePoints / maxExperiencePoints) * 100f;
        string medal;
        string message;

        if (experiencePercentage >= 90f)
        {
            medal = "Gold";
            message = "Spectacular work! You've got the gift of gab.";
        }
        else if (experiencePercentage >= 75f)
        {
            medal = "Silver";
            message = "Well done. Keep up the good work.";
        }
        else
        {
            medal = "Bronze";
            message = "You're getting there, just keep practicing.";
        }

        messageText.text = $"Medal: {medal}\n\nMessage: {message}\n\nExperience: {totalExperiencePoints} out of {maxExperiencePoints}\n\nNumber of Exchanges Pronounced Correctly: {correctDialogues}\nNumber of Exchanges Pronounced Incorrectly: {incorrectDialogues}";

        // Create a button for restarting the game
        GameObject buttonObject = new GameObject("RestartButton");
        RectTransform buttonRect = buttonObject.AddComponent<RectTransform>();
        buttonRect.SetParent(panelObject.transform, false);
        buttonRect.sizeDelta = new Vector2(300, 100);
        buttonRect.anchoredPosition = new Vector2(0, -300);
        Image buttonImage = buttonObject.AddComponent<Image>();
        buttonImage.sprite = Resources.Load<Sprite>("newgame1");

        Button restartButton = buttonObject.AddComponent<Button>();
        restartButton.onClick.AddListener(RestartGame);

        // Disable all user inputs except for the restart button
        foreach (GameObject character in characters)
        {
            character.GetComponent<NpcTalking>().enabled = false;
        }
        this.enabled = false;

        // Make sure there is a camera rendering
        if (Camera.main == null)
        {
            GameObject cameraObject = new GameObject("MainCamera");
            Camera camera = cameraObject.AddComponent<Camera>();
            cameraObject.tag = "MainCamera";
        }
    }

    // Restart the game by loading the initial scene
    void RestartGame()
    {
        SceneManager.LoadScene("Level_1_Cafe");
    }

    // Reset dialogue text colors to default
    void ResetDialogueTextColors()
    {
        text[0].GetComponent<TMP_Text>().color = Color.white;
        text[1].GetComponent<TMP_Text>().color = Color.white;
    }

    // Restart the dialogue from the beginning
    void RestartDialogue()
    {
        restartDialogueNext = false;
        usedHint = false;
        consecutiveIncorrect = 0;
        maxExperiencePoints += 3f;
        ResetDialogueTextColors();
        advisorText.gameObject.SetActive(false);
        progress = 0;
        StartConv(currentCharacter);
    }

    // Handle hint button click
    void OnHintButtonClick()
    {
        usedHint = true;
        PlayHintVideo();
    }

    // Play hint video
    void PlayHintVideo()
    {
        int characterIndex = System.Array.IndexOf(characters, currentCharacter);
        string conversation = characterIndex < 2 ? "7" : "8";
        string version = (characterIndex % 2 == 0) ? "1" : "2";
        string hintVideoName = $"conversation{conversation}_version{version}_hint{progress + 1}.mp4";
        string videoPath = System.IO.Path.Combine(Application.streamingAssetsPath, hintVideoName);
        videoPlayer.url = videoPath;
        videoRawImage.gameObject.SetActive(true); // Show RawImage
        videoPlayer.Prepare();
        videoPlayer.prepareCompleted += OnVideoPrepared;
    }

    // Handle video preparation completion
    void OnVideoPrepared(VideoPlayer vp)
    {
        vp.Play();
    }

    // Handle video end
    void OnVideoEnd(VideoPlayer vp)
    {
        videoRawImage.gameObject.SetActive(false); // Hide RawImage
    }
}
