using UnityEngine;
using UnityEngine.InputSystem;

public class XRHandAnimator : MonoBehaviour
{
    [SerializeField] Animator animator;
    [SerializeField] string gripParam = "Grip";
    [SerializeField] string triggerParam = "Trigger";

    public InputActionProperty gripAction;     // XRI *Hand Interaction/Select Value
    public InputActionProperty triggerAction;  // XRI *Hand Interaction/Activate Value

    int gripHash, triggerHash;

    void Awake()
    {
        if (!animator) animator = GetComponentInChildren<Animator>();
        gripHash = Animator.StringToHash(gripParam);
        triggerHash = Animator.StringToHash(triggerParam);
    }
    void OnEnable() { gripAction.action?.Enable(); triggerAction.action?.Enable(); }
    void OnDisable() { gripAction.action?.Disable(); triggerAction.action?.Disable(); }

    void Update()
    {
        animator.SetFloat(gripHash, gripAction.action?.ReadValue<float>() ?? 0f);
        animator.SetFloat(triggerHash, triggerAction.action?.ReadValue<float>() ?? 0f);
    }
}

