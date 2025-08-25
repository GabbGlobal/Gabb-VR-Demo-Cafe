using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class RecordUI : MonoBehaviour
{
    //record button indecate using speech to text
    private SpriteRenderer spriteRenderer;
    // Start is called before the first frame update
    void Start()
    {
 
        spriteRenderer = GetComponent<SpriteRenderer>();
        if (spriteRenderer == null)
        {
            Debug.LogError("spriteRenderer is null");
        }
        //InteractionManager.listening += ListeningOnUI;

    }

    // Update is called once per frame
    void Update()
    {
        
    }

    void ListeningOnUI() { 
        spriteRenderer.color = Color.red;
    }
    void ListeningOffUI() {
        spriteRenderer.color = Color.red;
    }
    private void OnDisable()
    {
       //InteractionManager.listening -= ListeningOnUI;
    }

}
