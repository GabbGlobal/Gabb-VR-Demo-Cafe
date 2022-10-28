using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;

public class loadDialog : MonoBehaviour
{
    [SerializeField]
    private TMP_Text text;

    void Start()
    {
        //text = GetComponent<TMP_Text>();
        if (text == null)
        {
            Debug.LogError("tmp is null");
        }
    }
    private void OnEnable()
    {
        
    }

    public void UpdateText(string _text)
    {
    text.text = _text;
    }
    private void OnDisable()
    {
        text.text = "";
    }

    // Update is called once per frame
    void Update()
    {
        
    }
}
