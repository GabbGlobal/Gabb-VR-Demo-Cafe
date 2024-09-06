using UnityEngine;
using UnityEngine.UI;
using System.Collections;

public class PronunciationTestManager : MonoBehaviour
{
    public Text promptText;
    public Button startButton;
    public Text resultText;

    private PronunciationAssessor assessor;
    private int currentPromptIndex = 0;

    void Start()
    {
        assessor = GetComponent<PronunciationAssessor>();
        startButton.onClick.AddListener(StartAssessment);
        DisplayNextPrompt();
    }

    void DisplayNextPrompt()
    {
        if (currentPromptIndex < assessor.prompts.Length)
        {
            promptText.text = assessor.prompts[currentPromptIndex];
        }
        else
        {
            promptText.text = "All prompts completed!";
            startButton.interactable = false;
        }
    }

    void StartAssessment()
    {
        startButton.interactable = false;
        resultText.text = "Listening...";
        StartCoroutine(RunAssessment());
    }

    IEnumerator RunAssessment()
    {
        yield return StartCoroutine(assessor.AssessPronunciation(assessor.prompts[currentPromptIndex]));
        
        // The result is logged in the AssessPronunciation method, so we don't need to display it here
        // You can modify the AssessPronunciation method to return the result if you want to display it in the UI

        resultText.text = "Assessment complete. Check the console for results.";
        currentPromptIndex++;
        DisplayNextPrompt();
        startButton.interactable = true;
    }
}