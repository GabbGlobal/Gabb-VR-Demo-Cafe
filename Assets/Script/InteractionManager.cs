using UnityEngine;
using System.Collections.Generic;
using UnityEngine.SceneManagement;
using TMPro;
using UnityEngine.UI;
using UnityEngine.Video;
using System;

// The InteractionManager class handles interactions between the player and NPCs, 
// manages dialogues, experience points, video hints, and the game's ending screen.
public class InteractionManager : MonoBehaviour
{
    // Delegate for showing text
    // This delegate and event are used to trigger text display actions across different scripts.
    public delegate void ShowText();
    public static event ShowText showText;

    // References to game components
    // Reference to the GameManager script to manage game-related functions.
    GameManager gameManager;

    // Game state variables
    // These variables track the player's progress, including language, lesson count, experience points,
    // the number of correct/incorrect dialogues, and the status of dialogues (e.g., if they should restart).
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
    // These serialized fields are used to connect various UI components, such as dialogue panels,
    // text fields, hint buttons, and video players, to the script in the Unity Editor.
    [SerializeField] ConversationUI conversationUI;
    [SerializeField] DialogUIAnim[] UIAnim;
    [SerializeField] private GameObject[] dialogPanel;
    [SerializeField] private GameObject[] text;
    [SerializeField] private loadDialog[] loadDialog;
    [SerializeField] private TMP_Text advisorText;
    [SerializeField] private Button hintButton;
    [SerializeField] private VideoPlayer videoPlayer; // Reference to VideoPlayer

    // Dialogue data
    // These variables are used to manage and process dialogue data, including the dialogue
    // text stored in a JSON file, the starting speaker, and the current NPC in conversation.
    [SerializeField] private TextAsset jsonFile;
    Root dialogInJson;
    private List<List<string>> dialogData;
    private string startSpeaker;

    // Character and NPC variables
    // These variables manage the characters in the game, particularly the NPCs that the player
    // interacts with. They track the current and previous characters involved in dialogues.
    [SerializeField] private GameObject[] characters;
    private GameObject currentCharacter;
    private GameObject previousCharacter;
    NpcTalking npcTalking;
    bool completeDialog = false;
    private float dialogueDistance = 4f;
    private AudioSource audioSource;

    // Video display
    // These variables manage the display of video hints, including a RawImage for rendering
    // the video content on the screen.
    private RawImage videoRawImage; // For displaying video

    private bool showEndingScreen = false;

    // Pre-created textures
    // These variables hold textures that are pre-created for various UI elements, such as
    // rounded rectangles, circles, experience bars, and star ratings for the ending screen.
    private Texture2D rectTexture;
    private Texture2D circleTexture;
    private Texture2D expBarBackgroundTexture;
    private Texture2D expBarFillTexture;
    private Texture2D pointsOvalTexture;
    private Texture2D starTexture;

    // The Start method is called before the first frame update.
    // It initializes the game state by setting up the GameManager reference, loading JSON data,
    // configuring UI elements (like the advisor text and hint button), and preparing the video player.
    // Additionally, it creates the textures used for various UI elements.
    void Start()
    {
        // Initialize game manager and check for null
        // This ensures that the GameManager script is properly connected and available for use.
        gameManager = GetComponent<GameManager>();
        if (gameManager == null)
        {
            Debug.LogError("gamemanager is null");
        }

        // Get the language and load JSON data
        // Language settings are retrieved from the GameManager, and JSON data is loaded to populate dialogues.
        language = gameManager.language;
        GetJsonData();

        // Set initial state for advisor text and audio source
        // The advisor text UI element is hidden initially, and an AudioSource component is added
        // to the GameObject to handle audio playback for dialogues.
        advisorText.gameObject.SetActive(false);
        audioSource = gameObject.AddComponent<AudioSource>();

        // Set up hint button
        // The hint button is hidden initially and an event listener is added to handle its click event.
        hintButton.gameObject.SetActive(false);
        hintButton.onClick.AddListener(OnHintButtonClick);

        // Set up video player
        // The video player is configured to render videos to a RenderTexture, which is later used by
        // the RawImage to display the video content on the screen. Looping and autoplay are disabled,
        // and a callback is added to handle video end events.
        videoPlayer.renderMode = VideoRenderMode.RenderTexture;
        videoPlayer.targetTexture = new RenderTexture(Screen.width, Screen.height, 0);
        videoPlayer.isLooping = false;
        videoPlayer.playOnAwake = false;
        videoPlayer.loopPointReached += OnVideoEnd;

        // Create RawImage for video display
        // A new GameObject is created to hold the RawImage component, which will display the video content.
        // The RawImage is initially hidden and sized to match the screen dimensions.
        GameObject videoRawImageObject = new GameObject("VideoRawImage");
        Canvas canvas = videoRawImageObject.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        videoRawImage = videoRawImageObject.AddComponent<RawImage>();
        videoRawImage.texture = videoPlayer.targetTexture;
        videoRawImage.rectTransform.sizeDelta = new Vector2(Screen.width, Screen.height);
        videoRawImage.gameObject.SetActive(false); // Initially hidden

        // Pre-create textures
        // This method generates the necessary textures for UI elements such as rectangles,
        // circles, experience bars, and stars, which will be used later in the game.
        CreateTextures();
    }

    // CreateTextures method
    // This method generates textures for UI elements that will be drawn on the screen, such as
    // rounded rectangles, circles, experience bars, ovals, and stars. These textures are created
    // using the specified dimensions and colors.
    void CreateTextures()
    {
        // Define the dimensions and colors for the UI elements, such as rectangles, circles,
        // experience bars, and stars, based on the screen dimensions and required visual appearance.
        float rectWidth = Screen.width * 0.25f;
        float rectHeight = Screen.height * 0.15f;
        float cornerRadius = 20f;
        float circleDiameter = rectHeight * 0.50f;
        float expBarWidth = rectWidth * 0.6f; // 60% of the rect width
        float expBarHeight = rectHeight * 0.15f;
        float pointsOvalHeight = expBarHeight * 1.5f;
        float pointsOvalWidth = pointsOvalHeight * 1.5f;
        float starSize = Screen.height * 0.06f;

        // Create the textures using the dimensions and colors defined above.
        // These textures are stored in the corresponding variables for use later in the game.
        rectTexture = CreateRoundedRectangleTexture((int)rectWidth, (int)rectHeight, (int)cornerRadius, new Color(0.5f, 0.5f, 0.5f, 0.9f));
        circleTexture = CreateCircleTexture((int)circleDiameter, Color.white);
        expBarBackgroundTexture = CreateRoundedRectangleTexture((int)expBarWidth, (int)expBarHeight, (int)(expBarHeight / 2), Color.white);
        expBarFillTexture = CreateRoundedRectangleTexture((int)expBarWidth, (int)expBarHeight, (int)(expBarHeight / 2), new Color(0.5f, 0.75f, 1.0f));
        pointsOvalTexture = CreateOvalTexture((int)pointsOvalWidth, (int)pointsOvalHeight, new Color(0.5f, 0.75f, 1.0f));
        starTexture = CreateStarTexture((int)starSize, (int)starSize, new Color(0.5f, 0.75f, 1.0f));
    }

    // GetJsonData method
    // This method loads dialogue data from a JSON file, which is used to populate the conversation
    // text for NPCs. It retrieves the appropriate dialogue data based on the current character and language.
    void GetJsonData()
    {
        lessons = gameManager.lesson;
        string _json = jsonFile.ToString();
        var data = Newtonsoft.Json.JsonConvert.DeserializeObject<Root>(_json);

        // Find the character index to retrieve the relevant dialogue data from the JSON file.
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

    // Update method
    // This method is called once per frame and handles various interactions, including NPC
    // movement and facing, dialogue progression, pronunciation input, and restarting the game.
    void Update()
    {
        // Handle character facing and movement
        // This section checks if the player is near an NPC and adjusts the NPC's facing direction
        // accordingly. It also resets the NPC's rotation when the player moves away.
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
        // This section checks if the player presses the space bar to progress through the dialogue.
        // It also handles restarting the dialogue if necessary and manages dialogue state.
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
        // This section ends the dialogue if the player moves too far from the NPC during a conversation.
        // It also updates the maximum experience points when this happens.
        if (currentCharacter != null && Vector3.Distance(Camera.main.transform.position, currentCharacter.transform.position) > dialogueDistance)
        {
            EndConv();
            maxExperiencePoints += 3f;
        }

        // Handle pronunciation input
        // This section checks if the player presses the N or M keys to indicate correct or incorrect pronunciation.
        // It updates the dialogue state, experience points, and UI elements accordingly.
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
        // This section checks if the player presses the E or R keys to either show the ending screen
        // or restart the game, respectively.
        if (Input.GetKeyDown(KeyCode.E))
        {
            ShowEndingScreen();
        }

        if (Input.GetKeyDown(KeyCode.R))
        {
            RestartGame();
        }
    }

    // IsInView method
    // This method checks if a given NPC is within the player's view by calculating the screen position
    // of the NPC relative to the camera. It ensures that the NPC is within a defined viewport range.
    bool IsInView(GameObject character)
    {
        Vector3 screenPoint = Camera.main.WorldToViewportPoint(character.transform.position);
        return screenPoint.z > 0 && screenPoint.x > 0.25f && screenPoint.x < 0.75f && screenPoint.y > -0.5f && screenPoint.y < 1.5f;
    }

    // FindNearestCharacter method
    // This method finds the nearest NPC to the player by calculating the distance between the camera
    // and each NPC. It returns the closest NPC that is also within the player's view.
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

    // CheckSpeaker method
    // This method determines which character (player or NPC) should start speaking based on
    // the value of the startSpeaker variable. It returns an integer representing the speaker.
    int CheckSpeaker()
    {
        if (startSpeaker == "npc")
        {
            return 1;
        }
        else { return 0; }
    }

    // StartConv method
    // This method initiates a conversation with an NPC. It sets up the dialogue, updates the UI,
    // and starts playing the corresponding dialogue audio. If no NPC is provided, it triggers a UI animation.
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

    // EndConv method
    // This method ends the current conversation by hiding the dialogue panels, resetting the NPC's talking state,
    // and updating the game state. If all characters have been completed, it triggers the ending screen.
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

    // SetText1 method
    // This method updates the dialogue text for the current speaker. It fetches the relevant text from the
    // dialogue data and displays it in the corresponding UI element. It also ensures the progress is within range.
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

    // SetText2 method
    // This method advances the dialogue to the next speaker and updates the UI accordingly. It also handles
    // audio playback for the new dialogue and sets the dialogue state (e.g., if the conversation is complete).
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

    // PlayDialogueAudio method
    // This method handles the playback of dialogue audio. It constructs the audio clip name based on the
    // current character and progress, then loads and plays the corresponding audio clip.
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

    // HandleCorrectPronunciation method
    // This method is triggered when the player correctly pronounces a dialogue. It updates the UI to reflect
    // the correct pronunciation (e.g., turning text green), increases experience points, and resets the hint state.
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

    // HandleIncorrectPronunciation method
    // This method is triggered when the player incorrectly pronounces a dialogue. It updates the UI to reflect
    // the incorrect pronunciation (e.g., turning text red), tracks consecutive mistakes, and potentially resets the dialogue.
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

    // ShowEndingScreen method
    // This method sets a flag to trigger the display of the ending screen, where the player's performance
    // and experience points are summarized. It is called when all dialogues are completed.
    void ShowEndingScreen()
    {
        showEndingScreen = true;
    }

    // ResetDialogueTextColors method
    // This method resets the colors of the dialogue text back to white, which is the default color.
    // It is used to clear any previous color changes that indicated correct or incorrect pronunciations.
    void ResetDialogueTextColors()
    {
        text[0].GetComponent<TMP_Text>().color = Color.white;
        text[1].GetComponent<TMP_Text>().color = Color.white;
    }

    // RestartDialogue method
    // This method restarts the current dialogue from the beginning. It resets the dialogue state,
    // experience points, and other variables to their initial values. It then starts the conversation again.
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

    // OnHintButtonClick method
    // This method is triggered when the hint button is clicked. It sets the usedHint flag to true and
    // plays a hint video to assist the player with the current dialogue.
    void OnHintButtonClick()
    {
        usedHint = true;
        PlayHintVideo();
    }

    // PlayHintVideo method
    // This method prepares and plays a video that provides a hint for the current dialogue. The video
    // file is selected based on the current character and progress in the conversation.
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

    // OnVideoPrepared method
    // This method is called when the video is ready to play. It starts the video playback.
    void OnVideoPrepared(VideoPlayer vp)
    {
        vp.Play();
    }

    // OnVideoEnd method
    // This method is called when the video reaches the end. It hides the RawImage that was displaying
    // the video content.
    void OnVideoEnd(VideoPlayer vp)
    {
        videoRawImage.gameObject.SetActive(false); // Hide RawImage
    }

    // RestartGame method
    // This method restarts the game by reloading the initial scene. It is typically triggered when
    // the player clicks the restart button on the ending screen.
    void RestartGame()
    {
        SceneManager.LoadScene("Level_1_Cafe");
    }

    // OnGUI method
    // This method handles the drawing of various UI elements directly onto the screen using the Unity GUI system.
    // It includes the experience bar, experience points, and the ending screen with star ratings and feedback text.
    void OnGUI()
    {
        // Define the rectangle dimensions and position
        // These variables define the size and position of the experience bar, including the rectangle and circle shapes.
        float rectWidth = Screen.width * 0.25f;
        float rectHeight = Screen.height * 0.15f;
        float rectX = 10;
        float rectY = 10;
        float cornerRadius = 20f; // Adjust this value for more rounded edges

        // Define the circle dimensions and position
        float circleDiameter = rectHeight * 0.50f; // Smaller circle
        float circleRadius = circleDiameter / 2;
        float circleX = rectX + rectWidth * 0.15f - circleRadius; // More to the right
        float circleY = rectY + (rectHeight / 2) - circleRadius;

        // Define the experience bar dimensions and position
        // These variables define the size and position of the experience bar, which visually represents the player's progress.
        float expBarWidth = (rectWidth - (circleX + circleDiameter - rectX)) * 0.8f; // 80% of the remaining space
        float expBarHeight = rectHeight * 0.15f; // Vertically short
        float expBarX = circleX + circleDiameter + (rectWidth - (circleX + circleDiameter + expBarWidth)) / 2;
        float expBarY = rectY + (rectHeight / 2) - (expBarHeight / 2);

        // Calculate the experience fill width
        // The width of the experience bar's fill is calculated based on the player's total experience points relative to the maximum.
        float expFillWidth = expBarWidth * ((float)totalExperiencePoints / maxExperiencePoints);

        // Calculate the position for the oval and number above the experience bar's right end
        // These variables define the size and position of an oval that displays the total experience points as a number.
        float pointsOvalHeight = expBarHeight * 1.5f;
        float pointsOvalWidth = pointsOvalHeight * 1.5f;
        float pointsOvalX = expBarX + expFillWidth - (pointsOvalWidth / 2);
        float pointsOvalY = expBarY - pointsOvalHeight - 5;

        // Draw the curved rectangle
        // This section draws the main background rectangle for the experience bar using the pre-created texture.
        GUI.color = Color.white;
        GUI.DrawTexture(new Rect(rectX, rectY, rectWidth, rectHeight), rectTexture);

        // Draw the circle
        // This section draws a circular shape next to the experience bar, representing some additional UI element.
        GUI.DrawTexture(new Rect(circleX, circleY, circleDiameter, circleDiameter), circleTexture);

        // Draw the experience bar background
        // This section draws the background of the experience bar using a pre-created texture.
        GUI.DrawTexture(new Rect(expBarX, expBarY, expBarWidth, expBarHeight), expBarBackgroundTexture);

        // Draw the experience bar fill
        // This section draws the filled portion of the experience bar, representing the player's progress.
        GUI.DrawTexture(new Rect(expBarX, expBarY, expFillWidth, expBarHeight), expBarFillTexture);

        // Draw the "XP" text below the experience bar
        // This section adds a label with the text "XP" below the experience bar, indicating that the bar represents experience points.
        GUI.color = Color.white;
        GUI.depth = -1;
        GUIStyle style = new GUIStyle();
        style.fontSize = (int)(expBarHeight);
        style.alignment = TextAnchor.UpperLeft;
        style.fontStyle = FontStyle.Bold;
        style.normal.textColor = Color.white;
        Rect textRect = new Rect(expBarX, expBarY + expBarHeight + 5, expBarWidth, expBarHeight);
        GUI.Label(textRect, "XP", style);

        // Draw the totalExperiencePoints number with a background oval
        // This section draws an oval shape above the experience bar and displays the player's total experience points as a number inside it.
        GUI.DrawTexture(new Rect(pointsOvalX, pointsOvalY, pointsOvalWidth, pointsOvalHeight), pointsOvalTexture);

        // Draw the totalExperiencePoints inside the points oval
        // This section adds a label with the player's total experience points inside the oval shape.
        GUI.color = Color.white;
        GUIStyle pointsStyle = new GUIStyle();
        pointsStyle.fontSize = (int)(pointsOvalHeight * 0.5f);
        pointsStyle.alignment = TextAnchor.MiddleCenter;
        pointsStyle.fontStyle = FontStyle.Bold;
        pointsStyle.normal.textColor = Color.white;
        Rect pointsTextRect = new Rect(pointsOvalX, pointsOvalY, pointsOvalWidth, pointsOvalHeight);
        GUI.Label(pointsTextRect, totalExperiencePoints.ToString(), pointsStyle);

        // Display the ending screen if the showEndingScreen flag is set
        // If the player has completed all dialogues, the ending screen is displayed with performance feedback and options to restart the game.
        if (showEndingScreen)
        {
            // Define the new gray rectangle dimensions and position
            float newRectWidth = Screen.width * 0.33f;
            float newRectHeight = Screen.height * 0.6f; // Increased height to 60%
            float newRectX = (Screen.width - newRectWidth) / 2;
            float newRectY = (Screen.height - newRectHeight) / 2;

            // Draw the new gray rectangle
            GUI.depth = 1; // Push the gray rectangle to the back
            GUI.color = new Color(0.5f, 0.5f, 0.5f, 0.9f); // Same gray color with slight transparency
            GUI.DrawTexture(new Rect(newRectX, newRectY, newRectWidth, newRectHeight), CreateRoundedRectangleTexture((int)newRectWidth, (int)newRectHeight, 20, GUI.color));

            // Define the star dimensions and position
            // This section calculates the size and position of star shapes that represent the player's performance.
            float starSize = newRectHeight * 0.1f;
            float starY = newRectY + newRectHeight * 0.1f;
            float starSpacing = starSize * 0.2f; // Increased spacing
            float star1X = newRectX + (newRectWidth - 3 * starSize - 2 * starSpacing) / 2;
            float star2X = star1X + starSize + starSpacing;
            float star3X = star2X + starSize + starSpacing;

            // Determine star colors based on experience points percentage
            // This section calculates the player's experience percentage and assigns colors to the stars
            // based on their performance. Blue stars indicate better performance.
            Color blueColor = new Color(0.5f, 0.75f, 1.0f);
            Color lightGrayColor = new Color(0.8f, 0.8f, 0.8f);
            float experiencePercentage = (float)totalExperiencePoints / maxExperiencePoints;

            Color star1Color = blueColor;
            Color star2Color = experiencePercentage >= 0.75f ? blueColor : lightGrayColor;
            Color star3Color = experiencePercentage >= 0.90f ? blueColor : lightGrayColor;

            // Draw the stars
            // This section draws the star shapes on the screen, with the colors determined by the player's performance.
            GUI.depth = -2;
            DrawStar(new Rect(star1X, starY, starSize, starSize), star1Color);
            DrawStar(new Rect(star2X, starY, starSize, starSize), star2Color);
            DrawStar(new Rect(star3X, starY, starSize, starSize), star3Color);

            // Draw the text below the stars
            // This section adds a text label below the stars, providing feedback on the player's performance.
            string mainText = experiencePercentage < 0.75f ? "You're getting there." :
                              experiencePercentage < 0.90f ? "Well done!" :
                              "Spectacular work!";
            GUIStyle mainTextStyle = new GUIStyle();
            mainTextStyle.fontSize = (int)(newRectHeight * 0.07f); // Much larger font size
            mainTextStyle.alignment = TextAnchor.MiddleCenter;
            mainTextStyle.fontStyle = FontStyle.Bold;
            mainTextStyle.normal.textColor = Color.white; // Ensure the text color is white
            Rect mainTextRect = new Rect(newRectX, starY + starSize + newRectHeight * 0.05f, newRectWidth, newRectHeight * 0.1f);
            GUI.depth = -3;
            GUI.Label(mainTextRect, mainText, mainTextStyle);

            // Draw the smaller texts below the main text
            // This section adds additional smaller text labels below the main feedback text, providing
            // specific details about the player's correct and incorrect pronunciations and total experience points.
            GUIStyle smallTextStyle = new GUIStyle();
            smallTextStyle.fontSize = (int)(newRectHeight * 0.05f); // Smaller font size
            smallTextStyle.alignment = TextAnchor.MiddleCenter;
            smallTextStyle.fontStyle = FontStyle.Bold;
            smallTextStyle.normal.textColor = Color.white; // Ensure the text color is white

            // Correct dialogues text
            // This section adds a label showing the number of correct pronunciations, with the word "correctly" highlighted in green.
            string correctText = $"You pronounced correctly: {correctDialogues}";
            correctText = correctText.Replace("correctly", "<color=#00FF00FF>correctly</color>"); // Green color for "correctly"
            Rect correctTextRect = new Rect(newRectX, mainTextRect.y + mainTextRect.height + newRectHeight * 0.03f, newRectWidth, newRectHeight * 0.05f);
            GUI.depth = -4;
            GUI.Label(correctTextRect, correctText, smallTextStyle);

            // Incorrect dialogues text
            // This section adds a label showing the number of incorrect pronunciations, with the word "incorrectly" highlighted in orange.
            string incorrectText = $"You pronounced incorrectly: {incorrectDialogues}";
            incorrectText = incorrectText.Replace("incorrectly", "<color=#FFA500FF>incorrectly</color>"); // Orange color for "incorrectly"
            Rect incorrectTextRect = new Rect(newRectX, correctTextRect.y + correctTextRect.height + newRectHeight * 0.03f, newRectWidth, newRectHeight * 0.05f);
            GUI.depth = -5;
            GUI.Label(incorrectTextRect, incorrectText, smallTextStyle);

            // Total XP text
            // This section adds a label showing the player's total experience points, displayed at the bottom of the ending screen.
            string xpText = $"Your total XP: {totalExperiencePoints}";
            Rect xpTextRect = new Rect(newRectX, incorrectTextRect.y + incorrectTextRect.height + newRectHeight * 0.03f, newRectWidth, newRectHeight * 0.05f);
            GUI.depth = -6;
            GUI.Label(xpTextRect, xpText, smallTextStyle);

            // Draw the restart button
            // This section draws a button at the bottom of the ending screen that allows the player to restart the game.
            // It changes color when hovered over and triggers the RestartGame method when clicked.
            float buttonWidth = newRectWidth * 0.4f;
            float buttonHeight = newRectHeight * 0.1f;
            float buttonX = newRectX + (newRectWidth - buttonWidth) / 2;
            float buttonY = newRectY + newRectHeight - buttonHeight - 30;

            Rect buttonRect = new Rect(buttonX, buttonY, buttonWidth, buttonHeight);

            if (buttonRect.Contains(Event.current.mousePosition))
            {
                GUI.color = new Color(0.3f, 0.5f, 0.8f); // Darker blue color when hovering
            }
            else
            {
                GUI.color = new Color(0.5f, 0.75f, 1.0f); // Original blue color
            }

            GUI.DrawTexture(buttonRect, CreateRoundedRectangleTexture((int)buttonWidth, (int)buttonHeight, (int)(buttonHeight / 2), GUI.color));

            GUI.color = Color.white;
            GUIStyle buttonStyle = new GUIStyle();
            buttonStyle.fontSize = (int)(buttonHeight * 0.5f);
            buttonStyle.alignment = TextAnchor.MiddleCenter;
            buttonStyle.fontStyle = FontStyle.Bold;
            buttonStyle.normal.textColor = Color.white;

            GUI.Label(buttonRect, "Restart", buttonStyle);

            if (Event.current.type == EventType.MouseDown && buttonRect.Contains(Event.current.mousePosition))
            {
                RestartGame();
            }
        }
    }

    // CreateRoundedRectangleTexture method
    // This method creates a texture for a rounded rectangle with the specified width, height, corner radius, and color.
    // The texture is generated by setting the appropriate pixels for the rectangle and corners.
    Texture2D CreateRoundedRectangleTexture(int width, int height, int cornerRadius, Color color)
    {
        Texture2D texture = new Texture2D(width, height, TextureFormat.ARGB32, false);
        Color clear = new Color(0, 0, 0, 0);

        for (int y = 0; y < height; y++)
        {
            for (int x = 0; x < width; x++)
            {
                bool inCornerRegion =
                    (x < cornerRadius && y < cornerRadius && (cornerRadius - x) * (cornerRadius - x) + (cornerRadius - y) * (cornerRadius - y) > cornerRadius * cornerRadius) || // Top-left corner
                    (x < cornerRadius && y >= height - cornerRadius && (cornerRadius - x) * (cornerRadius - x) + (y - (height - cornerRadius)) * (y - (height - cornerRadius)) > cornerRadius * cornerRadius) || // Bottom-left corner
                    (x >= width - cornerRadius && y < cornerRadius && (x - (width - cornerRadius)) * (x - (width - cornerRadius)) + (cornerRadius - y) * (cornerRadius - y) > cornerRadius * cornerRadius) || // Top-right corner
                    (x >= width - cornerRadius && y >= height - cornerRadius && (x - (width - cornerRadius)) * (x - (width - cornerRadius)) + (y - (height - cornerRadius)) * (y - (height - cornerRadius)) > cornerRadius * cornerRadius); // Bottom-right corner

                if (inCornerRegion)
                {
                    texture.SetPixel(x, y, clear);
                }
                else
                {
                    texture.SetPixel(x, y, color);
                }
            }
        }

        texture.Apply();
        return texture;
    }

    // CreateRectangleTexture method
    // This method creates a simple rectangle texture with the specified width, height, and color.
    // It fills the entire texture with the provided color.
    Texture2D CreateRectangleTexture(int width, int height, Color color)
    {
        Texture2D texture = new Texture2D(width, height, TextureFormat.ARGB32, false);

        for (int y = 0; y < height; y++)
        {
            for (int x = 0; x < width; x++)
            {
                texture.SetPixel(x, y, color);
            }
        }

        texture.Apply();
        return texture;
    }

    // CreateOvalTexture method
    // This method creates a texture for an oval shape with the specified width, height, and color.
    // The texture is generated by setting the appropriate pixels within the oval's boundaries.
    Texture2D CreateOvalTexture(int width, int height, Color color)
    {
        Texture2D texture = new Texture2D(width, height, TextureFormat.ARGB32, false);
        Color clear = new Color(0, 0, 0, 0);
        float a = width / 2f;
        float b = height / 2f;

        for (int y = 0; y < height; y++)
        {
            for (int x = 0; x < width; x++)
            {
                float dx = x - a;
                float dy = y - b;
                if ((dx * dx) / (a * a) + (dy * dy) / (b * b) <= 1)
                {
                    texture.SetPixel(x, y, color);
                }
                else
                {
                    texture.SetPixel(x, y, clear);
                }
            }
        }

        texture.Apply();
        return texture;
    }

    // CreateCircleTexture method
    // This method creates a texture for a circular shape with the specified diameter and color.
    // The texture is generated by setting the appropriate pixels within the circle's boundaries.
    Texture2D CreateCircleTexture(int diameter, Color color)
    {
        Texture2D texture = new Texture2D(diameter, diameter, TextureFormat.ARGB32, false);

        for (int y = 0; y < diameter; y++)
        {
            for (int x = 0; x < diameter; x++)
            {
                float x0 = x - diameter / 2f;
                float y0 = y - diameter / 2f;
                if (x0 * x0 + y0 * y0 <= diameter * diameter / 4f)
                {
                    texture.SetPixel(x, y, color);
                }
                else
                {
                    texture.SetPixel(x, y, Color.clear);
                }
            }
        }

        texture.Apply();
        return texture;
    }

    // DrawStar method
    // This method draws a five-pointed star shape on the screen using the specified position and color.
    // It calls the CreateStarTexture method to generate the texture for the star.
    void DrawStar(Rect position, Color color)
    {
        Texture2D starTexture = CreateStarTexture((int)position.width, (int)position.height, color);
        GUI.DrawTexture(position, starTexture);
    }

    // CreateStarTexture method
    // This method creates a texture for a five-pointed star shape with the specified width, height, and color.
    // The texture is generated by setting the appropriate pixels within the star's boundaries.
    Texture2D CreateStarTexture(int width, int height, Color color)
    {
        Texture2D texture = new Texture2D(width, height, TextureFormat.ARGB32, false);
        Color clear = new Color(0, 0, 0, 0);
        Vector2 center = new Vector2(width / 2f, height / 2f);
        float radius = width / 2f;

        for (int y = 0; y < height; y++)
        {
            for (int x = 0; x < width; x++)
            {
                if (IsPointInStar(new Vector2(x, y), center, radius))
                {
                    texture.SetPixel(x, y, color);
                }
                else
                {
                    texture.SetPixel(x, y, clear);
                }
            }
        }

        texture.Apply();
        return texture;
    }

    // IsPointInStar method
    // This helper method determines if a given point is inside a five-pointed star shape based on its position
    // relative to the star's center and radius. It is used to create the star texture in the CreateStarTexture method.
    bool IsPointInStar(Vector2 point, Vector2 center, float radius)
    {
        const int numPoints = 5;
        float angle = Mathf.Atan2(point.y - center.y, point.x - center.x) - Mathf.PI / 2;
        if (angle < 0)
        {
            angle += 2 * Mathf.PI;
        }

        float dist = Vector2.Distance(point, center);
        float normalizedDist = dist / radius;
        float starAngle = (2 * Mathf.PI / numPoints) / 2;

        int section = Mathf.FloorToInt((angle + starAngle / 2) / (2 * Mathf.PI / numPoints));
        float angleOffset = angle - (section * 2 * Mathf.PI / numPoints);
        float starFunction = Mathf.Abs(Mathf.Cos(angleOffset / starAngle));

        return normalizedDist <= starFunction;
    }
}
