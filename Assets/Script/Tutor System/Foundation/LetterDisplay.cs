using UnityEngine;
using TMPro;

public class LetterDisplay : MonoBehaviour
{
    public TMP_Text letterText;

    public void SetLetter(string letter)
    {
        if (letterText != null)
            letterText.text = letter;
    }

    public void SetVisible(bool show)
    {
        if (letterText != null)
            letterText.alpha = show ? 1f : 0f;

        // Optional: also disable gravity or collider
        if (TryGetComponent<Rigidbody>(out var rb))
            rb.useGravity = show;
    }
}
