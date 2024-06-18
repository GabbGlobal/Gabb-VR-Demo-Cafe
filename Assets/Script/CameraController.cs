using UnityEngine;

// This script is designed for PC testing purposes only.
// It allows the main camera to navigate using the arrow keys and rotate using the mouse.
// This is not intended for final deployment.

public class CameraController : MonoBehaviour
{
    // Speed at which the camera moves
    public float moveSpeed = 10f;
    // Speed at which the camera rotates
    public float turnSpeed = 3.0f;

    void Update()
    {
        // Get horizontal input (left/right)
        float moveHorizontal = Input.GetAxis("Horizontal"); 
        // Get vertical input (forward/backward)
        float moveVertical = Input.GetAxis("Vertical"); 

        // Calculate the forward movement relative to the camera's facing direction
        Vector3 forwardMovement = transform.forward * moveVertical;
        // Calculate the rightward movement relative to the camera's facing direction
        Vector3 rightMovement = transform.right * moveHorizontal;

        // Combine the forward and rightward movements
        Vector3 movement = forwardMovement + rightMovement;
        // Ensure the movement is restricted to the horizontal plane by setting y to 0
        movement.y = 0;

        // Move the camera based on the calculated movement vector, scaled by moveSpeed and frame time
        transform.Translate(movement * moveSpeed * Time.deltaTime, Space.World);

        // Get input from the mouse's horizontal movement (left/right mouse movement)
        float turnHorizontal = Input.GetAxis("Mouse X");
        // Get input from the mouse's vertical movement (up/down mouse movement)
        float turnVertical = Input.GetAxis("Mouse Y");

        // Rotate the camera around the y-axis (yaw) based on horizontal mouse movement
        transform.Rotate(Vector3.up, turnHorizontal * turnSpeed, Space.World);
        // Rotate the camera around the x-axis (pitch) based on vertical mouse movement
        transform.Rotate(Vector3.left, turnVertical * turnSpeed);
    }
}