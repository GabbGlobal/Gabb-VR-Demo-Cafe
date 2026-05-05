using Autohand;
using UnityEngine;
using UnityEngine.UI;

public class JoinView : MonoBehaviour
{
    public CanvasGroup group;
    [SerializeField] VRKeyboard vrKeyboard;
    [SerializeField] TMPro.TextMeshProUGUI codeDisplayText;
    [SerializeField] TMPro.TextMeshProUGUI infoText;
    [SerializeField] GameObject loadingObject;
    [SerializeField] BackendConfig config;
    [SerializeField] ApiClient apiClient;

    private const float JoinTimeoutSeconds = 10f;

    private bool isSubmitting;
    private AutoHandPlayer handPlayer;

    private void Start()
    {
        handPlayer = FindFirstObjectByType<AutoHandPlayer>();
        if (handPlayer != null)
            handPlayer.useMovement = false;

        infoText.text = "Enter Join Code";
        codeDisplayText.text = "----–----";
        loadingObject?.SetActive(false);

        vrKeyboard.MaxLength = 8;
        vrKeyboard.OnTextChanged += OnTextChanged;
    }

    private void OnTextChanged(string raw)
    {
        codeDisplayText.text = FormatCode(raw);

        if (raw.Length == 8 && !isSubmitting)
            OnSubmit(raw);
    }

    private async void OnSubmit(string code)
    {
        code = code.Trim().ToUpper();
        if (code.Length != 8)
        {
            infoText.text = "Code must be 8 characters";
            return;
        }

        isSubmitting = true;
        vrKeyboard.gameObject.SetActive(false);
        loadingObject?.SetActive(true);
        infoText.text = "Connecting...";
        codeDisplayText.text = FormatCode(code);

        config.joinCode = FormatCode(code);

        bool connected = await apiClient.WarmUpAsync(JoinTimeoutSeconds);
        if (!connected)
        {
            ShowError("Cannot reach server. Try again.");
            return;
        }

        var request = new SessionEventRequest
        {
            SessionId = "join-validate",
            StudentName = "Student",
            JoinCode = FormatCode(code),
            Language = config.defaultLanguage,
            CurrentScene = "JoinScreen"
        };

        var response = await apiClient.PostAsync<SessionEventRequest, SessionEventResponse>("/session/event", request, JoinTimeoutSeconds);

        if (response != null)
        {
            infoText.text = "Joined!";
            loadingObject?.SetActive(false);
            SessionTelemetryManager.Instance?.StartSession();
            Dismiss();
        }
        else
        {
            ShowError("Invalid code. Try again.");
        }
    }

    private void ShowError(string message)
    {
        isSubmitting = false;
        loadingObject?.SetActive(false);
        infoText.text = message;
        vrKeyboard.gameObject.SetActive(true);
        vrKeyboard.Clear();
    }

    private void Dismiss()
    {
        if (handPlayer != null)
            handPlayer.useMovement = true;

        vrKeyboard.gameObject.SetActive(false);

        group.alpha = 0f;
        group.interactable = false;
        group.blocksRaycasts = false;
    }

    private static string FormatCode(string raw)
    {
        raw = raw.ToUpper().PadRight(8, '-');
        return raw.Substring(0, 4) + "-" + raw.Substring(4, 4);
    }
}
