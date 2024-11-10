using System.Collections;
using System.Collections.Generic;
using UnityEngine;
#if PLATFORM_ANDROID
using UnityEngine.Android;
#endif
public class PermissionsManager : MonoBehaviour
{
    public static PermissionsManager Instance;
    void Awake() {
        if (Instance != null) {
            DestroyImmediate(Instance);
        }
        Instance = this;
    }
    
    private Microphone mic; // not used, but required for Microphone permissions on Android

    private void PermissionCallbacks_PermissionDeniedAndDontAskAgain(string permissionName)
    {
        Debug.Log($"{permissionName} PermissionDeniedAndDontAskAgain");
        Application.Quit(); // force quit if no micrpohone permissions
        // TODO: display a message with a prompt to ask for permissions again instead of quitting
    }

    private void PermissionCallbacks_PermissionGranted(string permissionName)
    {
        Debug.Log($"{permissionName} PermissionCallbacks_PermissionGranted");
    }

    private void PermissionCallbacks_PermissionDenied(string permissionName)
    {
        Debug.Log($"{permissionName} PermissionCallbacks_PermissionDenied");
        Application.Quit(); // force quit if no micrpohone permissions
    }
    void Start() {
        RequestPermissions();
    }

    // Start is called before the first frame update
    public void RequestPermissions()
    {
#if PLATFORM_ANDROID
        var callbacks = new PermissionCallbacks();
        callbacks.PermissionDenied += PermissionCallbacks_PermissionDenied;
        callbacks.PermissionGranted += PermissionCallbacks_PermissionGranted;
        callbacks.PermissionDeniedAndDontAskAgain += PermissionCallbacks_PermissionDeniedAndDontAskAgain;
        // request microphone permission
        if (!Permission.HasUserAuthorizedPermission(Permission.Microphone))
        {
            Permission.RequestUserPermission(Permission.Microphone);
        }
#endif
    }
}
