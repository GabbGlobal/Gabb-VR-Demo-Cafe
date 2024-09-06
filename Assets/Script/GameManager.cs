using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class GameManager : MonoBehaviour
{
    public int lesson { get; private set; }
    public string language { get; private set; }

    // Start is called before the first frame update
    void Start()
    {
        lesson = 0;
        language = "english";
        //get from backend
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
}