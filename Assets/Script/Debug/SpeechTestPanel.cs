using UnityEngine;
using TMPro;

public class SpeechTestPanel : MonoBehaviour
{
    [SerializeField] private TMP_InputField inputField;
    [SerializeField] private TMP_Text statusText;
    [SerializeField] private KeyCode toggleKey = KeyCode.BackQuote;
    [SerializeField] private Canvas canvas;

    private WordFlowManager wordFlow;

    void Start()
    {
        if (canvas == null) canvas = GetComponent<Canvas>();
        if (canvas != null) canvas.enabled = false;
        wordFlow = FindFirstObjectByType<WordFlowManager>();
    }

    void Update()
    {
        if (Input.GetKeyDown(toggleKey))
        {
            if (canvas != null) canvas.enabled = !canvas.enabled;
            if (canvas.enabled && inputField != null)
                inputField.ActivateInputField();
        }

        if (canvas != null && canvas.enabled && Input.GetKeyDown(KeyCode.Return))
            Submit();
    }

    public void Submit()
    {
        if (inputField == null || string.IsNullOrWhiteSpace(inputField.text)) return;
        string text = inputField.text.Trim();
        inputField.text = "";
        inputField.ActivateInputField();

        if (statusText != null)
            statusText.text = $"Sent: \"{text}\"";

        Debug.Log($"[SpeechTest] Injecting: \"{text}\"");

        if (wordFlow == null)
            wordFlow = FindFirstObjectByType<WordFlowManager>();

        if (wordFlow != null)
        {
            wordFlow.ShowPartialRecognition(text);
            wordFlow.CheckRecognizedWord(text);
        }

#if !USE_AZURE
        NpcTalking.InjectDebugSpeech(text);
#endif
    }
}
