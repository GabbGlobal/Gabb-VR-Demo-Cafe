using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class GameManager : MonoBehaviour
{
    public int lesson { get; private set; }
    public string language { get; private set; }
    private PronunciationAssessor assessor;

    // Start is called before the first frame update
    void Start()
    {
        lesson = 0;
        language = "english";
        //get from backend

        // Add this line to get the PronunciationAssessor component
        assessor = GetComponent<PronunciationAssessor>();
        
        // If PronunciationAssessor is not attached to the same GameObject, add it
        if (assessor == null)
        {
            assessor = gameObject.AddComponent<PronunciationAssessor>();
        }
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    public void UpdateLessons()
    {
        lesson++;
    }

    public int getLessons()
    {
        return lesson;
    }

    // Add this method to assess player pronunciation
    public void AssessPlayerPronunciation(string referenceText)
    {
        StartCoroutine(assessor.AssessPronunciation(referenceText));
    }
}