using System;
using System.Collections;
using Unity.Collections;
using UnityEngine;
using UnityEngine.XR;
using UnityEngine.XR.Management;
using UnityEngine.XR.OpenXR.Features.Meta;

public class XRRefreshRateManager : MonoBehaviour
{
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    IEnumerator Start()
    {
        XRDisplaySubsystem displaySubsystem = null;
        while (displaySubsystem == null)
        {
            try
            {
                displaySubsystem = XRGeneralSettings.Instance.Manager.activeLoader.GetLoadedSubsystem<XRDisplaySubsystem>();
            }
            catch (NullReferenceException nre)
            {
                Log("XR Diaplay Subsystem not ready.");
            }
            yield return null;
        }

        Log("Requesting 120hz refresh rate");
        // request 120 hz
        bool success = displaySubsystem.TryRequestDisplayRefreshRate(120f);
        Log($"TryRequestDisplayRefreshRate success: {success}");

        // Get the supported refresh rates.
        // If you will save the refresh rate values for longer than this frame, pass
        // Allocator.Persistent and remember to Dispose the array when you are done with it.
        
        if (displaySubsystem.TryGetSupportedDisplayRefreshRates(Allocator.Temp, out var refreshRates))
        {
            // Request a refresh rate.
            // Returns false if you request a value that is not in the refreshRates array.
            //bool success = displaySubsystem.TryRequestDisplayRefreshRate(refreshRates[0]);
            foreach (float refreshRate in refreshRates) {
                Debug.Log($"supported refresh rate: {refreshRate}");
            }
        }
    }

    void Log(string message) {
        Debug.Log($"[XRRefreshRateManager] {message}");
    }


}
