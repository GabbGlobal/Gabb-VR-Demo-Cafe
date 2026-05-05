using UnityEngine;
using UnityEngine.UI;
using TMPro;
#if UNITY_EDITOR
using UnityEditor;
#endif

[ExecuteInEditMode]

public class VRKeyboardBuilder : MonoBehaviour
{
    [Header("Key Sizing")]
    public float keyWidth = 60f;
    public float keyHeight = 60f;
    public float keySpacing = 6f;
    public float rowSpacing = 6f;

    [Header("Key Appearance")]
    public Color keyColor = new Color(0.2f, 0.2f, 0.2f, 1f);
    public Color textColor = Color.white;
    public float fontSize = 24f;
    public Font font;
    public TMP_FontAsset tmpFont;

    [Header("Special Keys")]
    public float backspaceWidth = 140f;
    public float spaceWidth = 300f;

    private static readonly string[] rows = {
        "1234567890",
        "QWERTYUIOP",
        "ASDFGHJKL",
        "ZXCVBNM"
    };

    private static readonly float[] rowIndents = { 0f, 0f, 0.5f, 1.5f };

#if UNITY_EDITOR
    [ContextMenu("Build Keyboard")]
    public void BuildKeyboard()
    {
        // Clear existing children
        for (int i = transform.childCount - 1; i >= 0; i--)
            DestroyImmediate(transform.GetChild(i).gameObject);

        // Add VRKeyboard component if not present
        VRKeyboard vk = GetComponent<VRKeyboard>();
        if (vk == null)
            vk = gameObject.AddComponent<VRKeyboard>();

        float totalHeight = rows.Length * (keyHeight + rowSpacing) + keyHeight + rowSpacing;
        float startY = totalHeight / 2f;

        // Build letter/number rows
        for (int r = 0; r < rows.Length; r++)
        {
            float indent = rowIndents[r] * (keyWidth + keySpacing);
            float rowWidth = rows[r].Length * (keyWidth + keySpacing) - keySpacing;
            float xStart = -(rowWidth / 2f) + (indent / 2f);
            float y = startY - r * (keyHeight + rowSpacing);

            for (int c = 0; c < rows[r].Length; c++)
            {
                char ch = rows[r][c];
                float x = xStart + indent + c * (keyWidth + keySpacing);
                CreateKey(ch.ToString(), new Vector2(x, y), new Vector2(keyWidth, keyHeight), vk, ch);
            }
        }

        // Backspace key on the right of ZXCVBNM row
        float bkspY = startY - 3 * (keyHeight + rowSpacing);
        float bkspX = (rows[3].Length * (keyWidth + keySpacing)) / 2f + backspaceWidth / 2f;
        GameObject bksp = CreateKey("⌫", new Vector2(bkspX, bkspY), new Vector2(backspaceWidth, keyHeight), null, ' ');
        Button bkspBtn = bksp.GetComponent<Button>();

        // Wire backspace via serialized field
        SerializedObject so = new SerializedObject(vk);
        so.FindProperty("backspaceButton").objectReferenceValue = bkspBtn;
        so.ApplyModifiedProperties();

        EditorUtility.SetDirty(gameObject);
        Debug.Log("[VRKeyboardBuilder] Keyboard built! Assign this VRKeyboard to your JoinView.");
    }

    private GameObject CreateKey(string label, Vector2 position, Vector2 size, VRKeyboard vk, char ch)
    {
        GameObject keyObj = new GameObject($"Key_{label}");
        keyObj.transform.SetParent(transform, false);

        RectTransform rt = keyObj.AddComponent<RectTransform>();
        rt.anchoredPosition = position;
        rt.sizeDelta = size;

        Image img = keyObj.AddComponent<Image>();
        img.color = keyColor;

        Button btn = keyObj.AddComponent<Button>();
        ColorBlock colors = btn.colors;
        colors.highlightedColor = new Color(0.4f, 0.4f, 0.8f, 1f);
        colors.pressedColor = new Color(0.2f, 0.2f, 0.6f, 1f);
        btn.colors = colors;

        // Label
        GameObject textObj = new GameObject("Label");
        textObj.transform.SetParent(keyObj.transform, false);

        RectTransform textRt = textObj.AddComponent<RectTransform>();
        textRt.anchorMin = Vector2.zero;
        textRt.anchorMax = Vector2.one;
        textRt.offsetMin = Vector2.zero;
        textRt.offsetMax = Vector2.zero;

        TextMeshProUGUI tmp = textObj.AddComponent<TextMeshProUGUI>();
        tmp.text = label;
        tmp.fontSize = fontSize;
        tmp.color = textColor;
        tmp.alignment = TextAlignmentOptions.Center;
        if (tmpFont != null) tmp.font = tmpFont;

        return keyObj;
    }
#endif
}
