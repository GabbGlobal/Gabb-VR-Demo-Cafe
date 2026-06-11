using System;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

public class VRKeyboard : MonoBehaviour
{
    [Header("Layout")]
    [SerializeField] private Transform keyContainer;
    [SerializeField] private GameObject keyPrefab;
    [SerializeField] private float keyWidth = 60f;
    [SerializeField] private float keyHeight = 60f;
    [SerializeField] private float keySpacing = 6f;

    [Header("Special Keys")]
    [SerializeField] private Button backspaceButton;
    [SerializeField] private Button submitButton;

    public event Action<string> OnTextChanged;
    public event Action<string> OnSubmit;

    [SerializeField] VRToggle frenchToggle;
    [SerializeField] VRToggle spanishToggle;

    public string Text { get; private set; } = "";
    public int MaxLength { get; set; } = 8;

    private static readonly string[] rows = {
        "1234567890",
        "QWERTYUIOP",
        "ASDFGHJKL",
        "ZXCVBNM"
    };

    private void Start()
    {
        if (keyContainer != null && keyPrefab != null)
            BuildKeys();
        else
            WireExistingKeys();

        if (backspaceButton != null)
            backspaceButton.onClick.AddListener(Backspace);

        if (submitButton != null)
            submitButton.onClick.AddListener(() => OnSubmit?.Invoke(Text));
    }

    private void WireExistingKeys()
    {
        foreach (var btn in GetComponentsInChildren<Button>())
        {
            if (btn == backspaceButton || btn == submitButton) continue;
            var label = btn.GetComponentInChildren<TMP_Text>();
            if (label != null && label.text.Length == 1)
            {
                char ch = label.text[0];
                btn.onClick.AddListener(() => TypeChar(ch));
            }
        }
    }

    private void BuildKeys()
    {
        float[] rowOffsets = { 0f, 0f, 0.5f, 1.5f };

        for (int r = 0; r < rows.Length; r++)
        {
            float xStart = rowOffsets[r] * (keyWidth + keySpacing);
            for (int c = 0; c < rows[r].Length; c++)
            {
                char ch = rows[r][c];
                GameObject keyObj = Instantiate(keyPrefab, keyContainer);
                keyObj.name = $"Key_{ch}";

                RectTransform rt = keyObj.GetComponent<RectTransform>();
                float x = xStart + c * (keyWidth + keySpacing);
                float y = -r * (keyHeight + keySpacing);
                rt.anchoredPosition = new Vector2(x, y);
                rt.sizeDelta = new Vector2(keyWidth, keyHeight);

                TMP_Text label = keyObj.GetComponentInChildren<TMP_Text>();
                if (label != null) label.text = ch.ToString();

                Button btn = keyObj.GetComponent<Button>();
                if (btn != null)
                {
                    char captured = ch;
                    btn.onClick.AddListener(() => TypeChar(captured));
                }
            }
        }
    }

    public void TypeChar(char c)
    {
        if (Text.Length >= MaxLength) return;
        Text += c;
        OnTextChanged?.Invoke(Text);
    }

    public void TypeCharFromString(string s)
    {
        if (!string.IsNullOrEmpty(s))
            TypeChar(s[0]);
    }

    public void Backspace()
    {
        if (Text.Length == 0) return;
        Text = Text.Substring(0, Text.Length - 1);
        OnTextChanged?.Invoke(Text);
    }

    public void Clear()
    {
        Text = "";
        OnTextChanged?.Invoke(Text);
    }

    public void ToggleClicked(VRToggle whichToggle)
    {
        spanishToggle.SetDisabledHighlight();
        frenchToggle.SetDisabledHighlight();
        if (whichToggle == spanishToggle)
        {
            LanguageToggle.Instance.ToggleSpanish();
            spanishToggle.SetEnabledHighlight();
        } else
        {
            LanguageToggle.Instance.ToggleFrench();
            frenchToggle.SetEnabledHighlight();

        }
    }
}
