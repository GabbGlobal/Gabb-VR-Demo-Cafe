using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.XR;

public class XRRenderScaling : MonoBehaviour
{
    [Range(1, 2)]
    public float renderScale = 1f;
    // Start is called before the first frame update
    void Start()
    {
        XRSettings.eyeTextureResolutionScale = renderScale;
    }
}
