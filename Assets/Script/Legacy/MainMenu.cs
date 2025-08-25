using System.Collections;
using System.Collections.Generic;
//using UnityEditor.SearchService; Commented out - Any UnityEditor invocation will error if you try to build the project.
using UnityEngine;
using UnityEngine.SceneManagement;

public class MainMenu : MonoBehaviour
{
    // Start is called before the first frame update
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
        
    }
    public void loadGame() {
        SceneManager.LoadScene(1);
    }
}
