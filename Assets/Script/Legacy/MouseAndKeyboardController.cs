using UnityEngine;
using UnityEngine.XR.Interaction.Toolkit.Locomotion.Movement;

// This script is designed for PC testing purposes only.
// It allows the main camera to navigate using the arrow keys and rotate using the mouse.
// This is not intended for final deployment.


public class MouseAndKeyboardController : MonoBehaviour
{
    public float moveSpeed = 5f;
    public float turnSpeed = 3.0f;
    public float fixedYPosition = 1.75f; // Set this to the desired fixed height of the camera

    private CharacterController characterController;
    private ContinuousMoveProvider continuousMoveProvider;
    private Camera cam;

    void Start()
    {
        if (!Application.isEditor) { return; }
        characterController = transform.root.GetComponentInChildren<CharacterController>();
        cam = Camera.main;
        // Disable tracked pose driver so we don't have to fight HMD tracking
        cam.GetComponent<UnityEngine.InputSystem.XR.TrackedPoseDriver>().enabled = false;
        Vector3 pos = cam.transform.position;
        pos.y = fixedYPosition;
        cam.transform.position = pos;

        continuousMoveProvider = GetComponent<ContinuousMoveProvider>();
        continuousMoveProvider.forwardSource = cam.transform;
        
    }

    void Update()
    {
        if (!Application.isEditor) { return; }
        /*
        // Get horizontal input (left/right)
        float moveHorizontal = Input.GetAxis("Horizontal");
        // Get vertical input (forward/backward)
        float moveVertical = Input.GetAxis("Vertical");

        // Forward direction relative relative to the camera's facing direction on xz plane
        Vector3 flatForward = cam.transform.forward;
        flatForward.y = 0;
        flatForward.Normalize();


        // Right direction relative relative to the camera's facing direction on xz plane
        Vector3 flatRight = cam.transform.right;
        flatRight.y = 0;
        flatRight.Normalize();

        // Calculate the forward movement relative to the camera's facing direction
        Vector3 forwardMovement = flatForward * moveVertical;
        // Calculate the rightward movement relative to the camera's facing direction
        Vector3 rightMovement = flatRight * moveHorizontal;

        // Combine the forward and rightward movements
        Vector3 movement = forwardMovement + rightMovement;
        // Ensure the movement is restricted to the horizontal plane by setting y to 0 (This seems unnecessary.)
        //movement.y = 0;

        // Move the camera using CharacterController to ensure collision detection
        characterController.Move(movement * moveSpeed * Time.deltaTime);

        // Ensure the camera's y position remains fixed and restricted to the horizontal plane
        Vector3 localPosition = cam.transform.localPosition;
        localPosition.y = fixedYPosition;
        cam.transform.localPosition = localPosition;
        */

        // Check if the Q key is pressed
        /*if (!Input.GetKey(KeyCode.Q))
        {
            // Get input from the mouse's horizontal movement (left/right mouse movement)
            float turnHorizontal = Input.GetAxis("Mouse X");
            // Get input from the mouse's vertical movement (up/down mouse movement)
            float turnVertical = Input.GetAxis("Mouse Y");

            // Rotate the camera around the y-axis (yaw) based on horizontal mouse movement
            cam.transform.Rotate(Vector3.up, turnHorizontal * turnSpeed, Space.World);
            // Rotate the camera around the x-axis (pitch) based on vertical mouse movement
            cam.transform.Rotate(Vector3.left, turnVertical * turnSpeed);
        }*/
    }
}
