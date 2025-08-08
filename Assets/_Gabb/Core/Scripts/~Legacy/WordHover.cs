using System.Collections.Generic;
using Newtonsoft.Json;
using TMPro;
using UnityEngine;

[RequireComponent(typeof(ConversationUI))]
public class WordHover : MonoBehaviour
{
    private PointAtWords pointAtWords;
    public GameObject popupPrefab;
    private Dictionary<string, DictionaryEntry> dictionary; // Dictionary to store word-meaning and POS pairs
    private GameObject popup; // Reference to the popup GameObject
    private UIFaceCamera popupFaceCamera; // cache reference to the UIFaceCamera script on the popup
    private TMP_Text currentlyHoveredText; // Track which text is currently being hovered
    
    void Awake() {
        LoadDictionary();
    }

    void Start() {
        // Create a new popup GameObject
        pointAtWords = FindFirstObjectByType<PointAtWords>();
        popup = Instantiate(popupPrefab);
        Canvas canvas = popup.GetComponent<Canvas>();
        canvas.worldCamera = Camera.main;
        popupFaceCamera = popup.GetComponent<UIFaceCamera>();
        popup.SetActive(false);
    }

    // Update is called once per frame
    void Update()
    {
        HandleWordHoverForText(ConversationUI.Instance.npcDialogueText);
        HandleWordHoverForText(ConversationUI.Instance.playerDialogueText);
    }

    private void HandleWordHoverForText(TMP_Text dialogueText)
    {
        // Ensure that the dialogueText GameObject is active
        if (!dialogueText.gameObject.activeInHierarchy)
        {
            popup.SetActive(false);
            return; // Exit if the text GameObject is not active
        }
        //currentlyHoveredText = null;
        //popup.SetActive(true);

        // Get the current mouse position in world space
        Vector3 mousePosition = Vector3.zero;
        Camera camera = Camera.main; // Assuming the main camera is used for screen space calculations
        Vector3 cursorWorldPosition = Vector3.zero;
        if (pointAtWords.pointerWorldPositionOnUI.HasValue) {
            cursorWorldPosition = pointAtWords.pointerWorldPositionOnUI.Value;
            mousePosition = Camera.main.WorldToScreenPoint(cursorWorldPosition);
        } else {
            popup.SetActive(false);
            //mousePosition = Input.mousePosition;
        }

        int wordIndex = TMP_TextUtilities.FindIntersectingWord(dialogueText, mousePosition, camera);
        if (wordIndex != -1) // If a word is detected
        {
            string word = dialogueText.textInfo.wordInfo[wordIndex].GetWord();

            // Convert to lowercase to match dictionary keys
            word = word.ToLower();

            // Check if the word exists in the dictionary
            if (dictionary.ContainsKey(word))
            {
                popup.SetActive(true);
                string meaning = dictionary[word].Meaning;
                string pos = dictionary[word].POS;
                Debug.Log($"Word: {word}, Meaning: {meaning}, POS: {pos}");

                // Set the currently hovered text
                currentlyHoveredText = dialogueText;

                // Create or update the popup with meaning and POS
                CreateOrUpdatePopup(cursorWorldPosition, meaning, pos);
                
            } else {
                popup.SetActive(false);
            }
        } else {
            //popup.SetActive(false);
        }
    }

    private void LoadDictionary()
    {
        // Load the dictionary JSON file from Resources
        TextAsset jsonFile = Resources.Load<TextAsset>("dictionary");
        if (jsonFile == null)
        {
            Debug.LogError("Dictionary JSON file not found in Resources folder.");
            return;
        }

        // Parse the JSON file
        var data = JsonConvert.DeserializeObject<DictionaryData>(jsonFile.text);

        // Initialize the dictionary
        dictionary = new Dictionary<string, DictionaryEntry>();

        // Fill the dictionary with word-meaning and POS pairs
        foreach (var entry in data.dictionary)
        {
            dictionary[entry.word.ToLower()] = entry; // Store the entire DictionaryEntry object
        }
    }

    private void CreateOrUpdatePopup(Vector3 cursorWorldPosition, string meaning, string pos)
    {
        // Update the text of the popup
        TextMeshProUGUI textComponent = popup.GetComponentInChildren<TextMeshProUGUI>();
        textComponent.text = $"{meaning}\n({pos})"; // Include both meaning and POS

        // Position the popup higher above the word
        //Debug.Log(cursorWorldPosition);
        popup.transform.position = cursorWorldPosition + new Vector3(0f, 0.17f, 0f); // Offset to place popup higher above word
        popupFaceCamera.FaceCamera(); // face camera here to avoid a 1 frame flicker where the popup is not facing the camera
    }
}
