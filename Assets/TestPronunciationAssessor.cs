using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections;

public class TestPronunciationAssessor : MonoBehaviour
{
    public TMP_Text PromptText;
    public Button StartButton;
    public TMP_Text ResultText;

    private PronunciationAssessor assessor;
    private int currentPromptIndex = 0;

    void Start()
    {
        assessor = GetComponent<PronunciationAssessor>();
        StartButton.onClick.AddListener(StartAssessment);
        DisplayNextPrompt();
    }

    void DisplayNextPrompt()
    {
        if (currentPromptIndex < assessor.prompts.Length)
        {
            PromptText.text = assessor.prompts[currentPromptIndex];
        }
        else
        {
            PromptText.text = "All prompts completed!";
            StartButton.interactable = false;
        }
    }

    void StartAssessment()
    {
        StartButton.interactable = false;
        ResultText.text = "Listening...";
        StartCoroutine(RunAssessment());
    }

    IEnumerator RunAssessment()
    {
        yield return StartCoroutine(assessor.AssessPronunciation(assessor.prompts[currentPromptIndex]));
        
        // The result is logged in the AssessPronunciation method
        // You can modify the AssessPronunciation method to return the result if you want to display it in the UI
        ResultText.text = "Assessment complete. Check the console for results.";
        
        currentPromptIndex++;
        DisplayNextPrompt();
        StartButton.interactable = true;
    }
}