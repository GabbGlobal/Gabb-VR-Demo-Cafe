using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using TMPro;


#if PLATFORM_ANDROID
using UnityEngine.Android;
#endif
public class PermissionsManager : MonoBehaviour
{
    public string nextSceneName;
    public Transform ui;

    private Microphone mic; // not used, but required for Microphone permissions on Android

    private void PermissionCallbacks_PermissionDeniedAndDontAskAgain(string permissionName)
    {
        
        Debug.Log($"{permissionName} PermissionDeniedAndDontAskAgain");
        ui.gameObject.SetActive(true);
    }

    private void PermissionCallbacks_PermissionDenied(string permissionName)
    {
        Debug.Log($"{permissionName} PermissionCallbacks_PermissionDenied");
        ui.gameObject.SetActive(true);
    }

    private void PermissionCallbacks_PermissionGranted(string permissionName)
    {
        Debug.Log($"{permissionName} PermissionCallbacks_PermissionGranted");
        ui.gameObject.SetActive(false);
    }

    // Start is called before the first frame update
    IEnumerator Start()
    {
#if PLATFORM_ANDROID
        RequestPermissions();
        // wait for user to grant microphone permission
        yield return new WaitUntil(()=> Permission.HasUserAuthorizedPermission(Permission.Microphone));
#endif
        LoadNextScene();
        yield break;
    }

    public void RequestPermissions()
    {
#if PLATFORM_ANDROID
        Debug.Log("[PermissionManager] [RequestPermissions]");
        var callbacks = new PermissionCallbacks();
        callbacks.PermissionDenied += PermissionCallbacks_PermissionDenied;
        callbacks.PermissionGranted += PermissionCallbacks_PermissionGranted;
        callbacks.PermissionDeniedAndDontAskAgain += PermissionCallbacks_PermissionDeniedAndDontAskAgain;
        // request microphone permission
        if (!Permission.HasUserAuthorizedPermission(Permission.Microphone))
        {
            Debug.Log("[PermissionManager] [RequestPermissions] calling RequestUserPermission");
            Permission.RequestUserPermission(Permission.Microphone);
            StartCoroutine(ShowUIDelayed());
        }
#endif 
    }

    // Quest 3 does not trigger the expected callbacks in some cases,
    // so display the permissions denied UI after a short delay as a fallback.
    // Notably, the denied callbacks are not called any time after the user denies permission with "Remember" checked.
    IEnumerator ShowUIDelayed() {
        yield return new WaitForSecondsRealtime(2f);
        if (!Permission.HasUserAuthorizedPermission(Permission.Microphone)) {
            ui.gameObject.SetActive(true);
        }
    }

    void LoadNextScene()
    {
        SceneManager.LoadScene(nextSceneName);
    }
}
