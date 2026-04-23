using UnityEngine;
using TMPro;
using System.Collections.Generic;

public class PronunciationTestUI : MonoBehaviour
{
    [Header("Input")]
    [SerializeField] private TMP_InputField referenceTextField;
    [SerializeField] private TMP_Dropdown languageDropdown;

    [Header("Buttons — assign OnClick in inspector")]
    // Wire StartAssessment() and SimulateScore() to buttons via inspector

    [Header("Score Display")]
    [SerializeField] private TextMeshProUGUI pronunciationScoreText;
    [SerializeField] private TextMeshProUGUI accuracyScoreText;
    [SerializeField] private TextMeshProUGUI fluencyScoreText;
    [SerializeField] private TextMeshProUGUI completenessScoreText;
    [SerializeField] private TextMeshProUGUI gradeText;
    [SerializeField] private TextMeshProUGUI recognizedText;
    [SerializeField] private TextMeshProUGUI latencyText;
    [SerializeField] private TextMeshProUGUI statusText;

    [Header("Gate Status")]
    [SerializeField] private TextMeshProUGUI canListenText;

    [Header("Log")]
    [SerializeField] private TextMeshProUGUI logText;
    [SerializeField] private int maxLogEntries = 20;

    private readonly List<string> logEntries = new List<string>();
    private readonly string[] languageCodes = { "es-ES", "en-US", "it-IT", "fr-FR", "pt-BR" };

    private void Start()
    {
        if (languageDropdown != null)
        {
            languageDropdown.ClearOptions();
            languageDropdown.AddOptions(new List<string>(languageCodes));
        }

        AzureSpeechRecognizer.OnPronunciationScored += OnScoreReceived;
        ClearDisplay();
    }

    private void Update()
    {
        if (canListenText != null && AzureSpeechRecognizer.Instance != null)
        {
            bool gate = AzureSpeechRecognizer.Instance.canListen;
            canListenText.text = gate ? "<color=#4CAF50>GATE: OPEN</color>" : "<color=#F44336>GATE: CLOSED</color>";
        }
    }

    public async void StartAssessment()
    {
        if (AzureSpeechRecognizer.Instance == null)
        {
            SetStatus("AzureSpeechRecognizer not found in scene.");
            return;
        }

        string refText = referenceTextField != null ? referenceTextField.text.Trim() : "";
        if (string.IsNullOrEmpty(refText))
        {
            SetStatus("Enter a reference word or phrase first.");
            return;
        }

        if (languageDropdown != null && languageDropdown.value < languageCodes.Length)
            AzureSpeechRecognizer.Instance.languageCode = languageCodes[languageDropdown.value];

        AzureSpeechRecognizer.Instance.canListen = true;

        SetStatus("Listening... speak now.");
        ClearDisplay();

        var result = await AzureSpeechRecognizer.Instance.AssessPronunciation(refText);

        if (result == null)
            SetStatus("No speech detected or assessment timed out.");
        else
            SetStatus("Assessment complete.");
    }

    public void SimulateScore()
    {
        if (AzureSpeechRecognizer.Instance == null)
        {
            SetStatus("AzureSpeechRecognizer not found in scene.");
            return;
        }

        AzureSpeechRecognizer.Instance.debugMode = true;
        AzureSpeechRecognizer.Instance.canListen = true;

        string refText = referenceTextField != null ? referenceTextField.text.Trim() : "test";
        if (string.IsNullOrEmpty(refText)) refText = "test";

        _ = AzureSpeechRecognizer.Instance.AssessPronunciation(refText);

        AzureSpeechRecognizer.Instance.debugMode = false;
        SetStatus("Simulated score injected.");
    }

    private void OnScoreReceived(PronunciationResult result)
    {
        if (pronunciationScoreText != null)
        {
            string color = result.Grade switch
            {
                PronunciationGrade.Pass => "#4CAF50",
                PronunciationGrade.SoftPass => "#FFC107",
                PronunciationGrade.Fail => "#F44336",
                _ => "#FFFFFF"
            };
            pronunciationScoreText.text = $"<color={color}><size=150%>{result.pronunciationScore:F0}%</size></color>";
        }

        if (accuracyScoreText != null)
            accuracyScoreText.text = $"Accuracy: {result.accuracyScore:F0}";
        if (fluencyScoreText != null)
            fluencyScoreText.text = $"Fluency: {result.fluencyScore:F0}";
        if (completenessScoreText != null)
            completenessScoreText.text = $"Completeness: {result.completenessScore:F0}";

        if (gradeText != null)
        {
            gradeText.text = result.Grade switch
            {
                PronunciationGrade.Pass => "<color=#4CAF50>PASS</color>",
                PronunciationGrade.SoftPass => "<color=#FFC107>SOFT PASS</color>",
                PronunciationGrade.Fail => "<color=#F44336>FAIL</color>",
                _ => ""
            };
        }

        if (recognizedText != null)
            recognizedText.text = $"Heard: \"{result.recognizedText}\"\nExpected: \"{result.referenceText}\"";
        if (latencyText != null)
            latencyText.text = $"Latency: {result.latencyMs:F0}ms";

        AddLogEntry($"[{System.DateTime.Now:HH:mm:ss}] \"{result.referenceText}\" → {result.pronunciationScore:F0}% ({result.Grade})");
    }

    private void ClearDisplay()
    {
        if (pronunciationScoreText != null) pronunciationScoreText.text = "--";
        if (accuracyScoreText != null) accuracyScoreText.text = "Accuracy: --";
        if (fluencyScoreText != null) fluencyScoreText.text = "Fluency: --";
        if (completenessScoreText != null) completenessScoreText.text = "Completeness: --";
        if (gradeText != null) gradeText.text = "";
        if (recognizedText != null) recognizedText.text = "";
        if (latencyText != null) latencyText.text = "";
    }

    private void SetStatus(string msg)
    {
        if (statusText != null) statusText.text = msg;
        Debug.Log($"[PronunciationTest] {msg}");
    }

    private void AddLogEntry(string entry)
    {
        logEntries.Add(entry);
        if (logEntries.Count > maxLogEntries)
            logEntries.RemoveAt(0);

        if (logText != null)
            logText.text = string.Join("\n", logEntries);
    }

    private void OnDestroy()
    {
        AzureSpeechRecognizer.OnPronunciationScored -= OnScoreReceived;
    }
}
