using UnityEngine;
using UnityEngine.UI;

public class VRToggle : MonoBehaviour
{
    [SerializeField] Color activeColor;
    [SerializeField] Color inactiveColor;

    [SerializeField] Image highlightableImage;
    public bool startHighlighted;

    private void Start()
    {
        if (startHighlighted)
        {
            startHighlighted = false;
            SetEnabledHighlight();
        }
    }

    public void SetEnabledHighlight()
    {
        highlightableImage.color = activeColor;
    }

    public void SetDisabledHighlight()
    {
        highlightableImage.color = inactiveColor;
    }
}
