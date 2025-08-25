using UnityEngine;
using TMPro;

public class LetterDisplay : MonoBehaviour
{
    [Header("Text Mesh Pro Component")]
    public TMP_Text letterText;

    [Header("Optional visuals")]
    public Renderer blockRenderer;

    private string currentLetter = "";

    public string CurrentLetter => currentLetter;

    private void Awake()
    {
        // Auto-assign if not set in Inspector
        if (letterText == null)
            letterText = GetComponentInChildren<TMP_Text>();

        if (blockRenderer == null)
            blockRenderer = GetComponentInChildren<Renderer>();
    }

    public void SetLetter(string letter)
    {
        currentLetter = letter;
        if (letterText != null)
            letterText.text = letter;
    }

    public void SetColor(Color color)
    {
        if (blockRenderer != null)
            blockRenderer.material.color = color;
    }

    public void ShowUnderline(bool show)
    {
        if (letterText != null)
            letterText.fontStyle = show ? FontStyles.Underline : FontStyles.Normal;
    }

    public void ResetLetter()
    {
        SetLetter("a");
        SetColor(Color.white);
        ShowUnderline(true);
        //gameObject.SetActive(true);
    }

    public void SetVisible(bool visible)
    {
        gameObject.SetActive(visible);
    }
}
