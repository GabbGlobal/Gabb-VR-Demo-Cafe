using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;

public class loadDialog : MonoBehaviour
{
    [SerializeField]
    private TMP_Text text;
    [SerializeField]
    private InteractionManager interactionManager;
    [SerializeField]
    private int speaker;
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
        //text.text = _text;
        StartCoroutine(SettingTexts(_text));
    }
    private void OnDisable()
    {
        text.text = "";
    }
    IEnumerator SettingTexts(string _text) {
        WaitForEndOfFrame _wait= new WaitForEndOfFrame();
        int i = 0; 
        while(i <= _text.Length)
        {
            string _t = _text.Substring(0,i);
            text.text = _t;
            yield return _wait;
            i++;
        }
        interactionManager.SetText2(speaker);
    }
}
