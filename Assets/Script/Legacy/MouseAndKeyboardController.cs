#if !VR_BUILD
using Autohand;
using System.Collections;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem;
using UnityEngine.UI;

public class MouseAndKeyboardController : MonoBehaviour
{
    [Header("Movement")]
    public float moveSpeed = 5f;
    public float mouseSensitivity = 2f;
    public float fixedYPosition = 1.75f;
    public Transform handLeft, handRight;

    [Header("Debug")]
    public bool logMicVolume;
    private Camera cam;
    private AutoHandPlayer player;
    private Rigidbody playerBody;
    private float pitch;
    private bool cursorLocked;
    public MicRecorder mic;

    private InputAction moveAction;
    private InputAction lookAction;
    private InputAction clickAction;
    private InputAction escapeAction;

    void Start()
    {
        cam = Camera.main;
        if (cam == null) return;

        var trackedPose = cam.GetComponent<UnityEngine.InputSystem.XR.TrackedPoseDriver>();
        if (trackedPose != null)
            trackedPose.enabled = false;

        StartCoroutine(MoveHands());

        player = FindFirstObjectByType<AutoHandPlayer>();
        if (player != null)
        {
            playerBody = player.body;
            player.useMovement = false;

        }

        var vrLink = FindFirstObjectByType<Autohand.Demo.XRHandPlayerControllerLink>();
        if (vrLink != null)
            vrLink.enabled = false;

        foreach (var pointer in FindObjectsByType<HandCanvasPointer>(FindObjectsSortMode.None))
            pointer.enabled = false;

        var simType = System.Type.GetType("UnityEngine.XR.Interaction.Toolkit.Inputs.Simulation.XRDeviceSimulator, Unity.XR.Interaction.Toolkit");
        if (simType != null)
        {
            foreach (var sim in FindObjectsByType(simType, FindObjectsSortMode.None))
                Destroy(((Component)sim).gameObject);
        }

        if (cam.GetComponent<PhysicsRaycaster>() == null)
            cam.gameObject.AddComponent<PhysicsRaycaster>();

        var eventSystem = FindFirstObjectByType<EventSystem>();
        if (eventSystem != null && eventSystem.GetComponent<StandaloneInputModule>() == null)
            eventSystem.gameObject.AddComponent<StandaloneInputModule>();

        foreach (var canvas in FindObjectsByType<Canvas>(FindObjectsSortMode.None))
        {
            if (canvas.renderMode == RenderMode.WorldSpace && canvas.GetComponent<GraphicRaycaster>() == null)
            {
                canvas.gameObject.AddComponent<GraphicRaycaster>();
                canvas.worldCamera = cam;
            }
        }


        SetupInputActions();
        LockCursor();

        Debug.Log("[DesktopMode] Active — WASD to move, mouse to look, Escape to toggle cursor");
    }

    private void SetupInputActions()
    {
        moveAction = new InputAction("Move", InputActionType.Value, null);
        moveAction.AddCompositeBinding("2DVector")
            .With("Up", "<Keyboard>/w")
            .With("Down", "<Keyboard>/s")
            .With("Left", "<Keyboard>/a")
            .With("Right", "<Keyboard>/d");
        moveAction.Enable();

        lookAction = new InputAction("Look", InputActionType.Value, "<Mouse>/delta");
        lookAction.Enable();

        clickAction = new InputAction("Click", InputActionType.Button, "<Mouse>/leftButton");
        clickAction.Enable();

        escapeAction = new InputAction("Escape", InputActionType.Button, "<Keyboard>/escape");
        escapeAction.Enable();
    }


    IEnumerator MoveHands()
    {
        yield return new WaitForSeconds(3);
        // Hide VR hands by moving them well below the player
        if (handRight != null)
            handRight.transform.parent.localPosition = new Vector3(0f, -2f, 0f);
        if (handLeft != null)
            handLeft.transform.parent.localPosition = new Vector3(0f, -2f, 0f);

    }
    void Update()
    {
        if (cam == null) return;

        if (escapeAction.WasPressedThisFrame())
        {
            if (cursorLocked) UnlockCursor();
            else LockCursor();
        }

        if (!cursorLocked && clickAction.WasPressedThisFrame())
            LockCursor();

        if (cursorLocked)
            HandleMouseLook();

        HandleMovement();
        SyncCameraToPlayer();

        if (logMicVolume)
        {
            if (mic == null) mic = FindFirstObjectByType<MicRecorder>();
            if (mic != null && mic.IsRecording)
                Debug.Log($"[Mic] vol={mic.CurrentVolume:F4} speaking={mic.HasSpoken} elapsed={mic.Elapsed:F1}s");
        }
    }

    private void HandleMovement()
    {
        Vector2 input = moveAction.ReadValue<Vector2>();
        if (input.sqrMagnitude < 0.01f)
        {
            if (playerBody != null)
                playerBody.linearVelocity = new Vector3(0f, playerBody.linearVelocity.y, 0f);
            return;
        }

        // Movement direction relative to camera yaw
        float yaw = cam.transform.eulerAngles.y;
        Vector3 forward = Quaternion.Euler(0f, yaw, 0f) * Vector3.forward;
        Vector3 right = Quaternion.Euler(0f, yaw, 0f) * Vector3.right;
        Vector3 move = (forward * input.y + right * input.x).normalized * moveSpeed;

        if (playerBody != null)
        {
            playerBody.linearVelocity = new Vector3(move.x, playerBody.linearVelocity.y, move.z);
        }
        else
        {
            cam.transform.position += move * Time.deltaTime;
        }
    }

    private void HandleMouseLook()
    {
        Vector2 delta = lookAction.ReadValue<Vector2>();
        float mouseX = delta.x * mouseSensitivity * 0.1f;
        float mouseY = delta.y * mouseSensitivity * 0.1f;

        // Yaw: rotate the player body
        if (player != null)
            player.transform.Rotate(Vector3.up, mouseX);

        // Pitch: track and clamp
        pitch -= mouseY;
        pitch = Mathf.Clamp(pitch, -80f, 80f);
    }

    private void SyncCameraToPlayer()
    {
        if (player == null) return;

        // Position camera at player body + eye height
        Vector3 pos = player.transform.position;
        pos.y = fixedYPosition;
        cam.transform.position = pos;

        // Match player yaw + our pitch
        cam.transform.rotation = Quaternion.Euler(pitch, player.transform.eulerAngles.y, 0f);

        // Move tracking container to follow so colliders stay in sync
        if (player.trackingContainer != null)
            player.trackingContainer.position = pos;
    }

    private void LockCursor()
    {
        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;
        cursorLocked = true;
    }

    private void UnlockCursor()
    {
        Cursor.lockState = CursorLockMode.None;
        Cursor.visible = true;
        cursorLocked = false;
    }

    void OnDestroy()
    {
        moveAction?.Disable();
        lookAction?.Disable();
        clickAction?.Disable();
        escapeAction?.Disable();
    }
}
#endif
