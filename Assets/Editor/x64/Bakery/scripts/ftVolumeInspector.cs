// Disable 'obsolete' warnings
#pragma warning disable 0618

using System.Collections;
using System.Collections.Generic;
using UnityEngine;
#if UNITY_EDITOR
using UnityEditor;
using UnityEditor.IMGUI.Controls;
#endif

#if UNITY_EDITOR
[CustomEditor(typeof(BakeryVolume))]
[CanEditMultipleObjects]
public class BakeryVolumeInspector : Editor
{
    BoxBoundsHandle boundsHandle = new BoxBoundsHandle(typeof(BakeryVolumeInspector).GetHashCode());

    SerializedProperty ftraceAdaptiveRes, ftraceResX, ftraceResY, ftraceResZ, ftraceVoxelsPerUnit, ftraceAdjustSamples, ftraceEnableBaking, ftraceEncoding, ftraceShadowmaskEncoding, ftraceShadowmaskFirstLightIsAlwaysAlpha;
    SerializedProperty ftraceDenoise, ftraceGlobal, ftraceRotation, ftraceRotationY;

    bool showExperimental = false;

    ftLightmapsStorage storage;

    static BakeryProjectSettings pstorage;

    void OnEnable()
    {
        ftraceAdaptiveRes = serializedObject.FindProperty("adaptiveRes");
        ftraceVoxelsPerUnit = serializedObject.FindProperty("voxelsPerUnit");
        ftraceResX = serializedObject.FindProperty("resolutionX");
        ftraceResY = serializedObject.FindProperty("resolutionY");
        ftraceResZ = serializedObject.FindProperty("resolutionZ");
        ftraceEnableBaking = serializedObject.FindProperty("enableBaking");
        ftraceEncoding = serializedObject.FindProperty("encoding");
        ftraceShadowmaskEncoding = serializedObject.FindProperty("shadowmaskEncoding");
        ftraceShadowmaskFirstLightIsAlwaysAlpha = serializedObject.FindProperty("firstLightIsAlwaysAlpha");
        ftraceDenoise = serializedObject.FindProperty("denoise");
        ftraceGlobal = serializedObject.FindProperty("isGlobal");
        ftraceRotation = serializedObject.FindProperty("supportRotationAfterBake");
        ftraceRotationY = serializedObject.FindProperty("rotateAroundY");
        //ftraceAdjustSamples = serializedObject.FindProperty("adjustSamples");
    }

    string F(float f)
    {
        // Unity keeps using comma for float printing on some systems since ~2018, even if system-wide decimal symbol is "."
        return (f + "").Replace(",", ".");
    }

    string FormatSize(int b)
    {
        float mb = b / (float)(1024*1024);
        return mb.ToString("0.0");
    }

    public override void OnInspectorGUI()
    {
        var vol = target as BakeryVolume;
        if (pstorage == null) pstorage = ftLightmaps.GetProjectSettings();

        //if (targets.Length == 1)
        {
            serializedObject.Update();


            EditorGUILayout.PropertyField(ftraceEnableBaking, new GUIContent("Enable baking", "Should the volume be (re)computed? Disable to prevent overwriting existing data."));
            bool wasGlobal = ftraceGlobal.boolValue;
            EditorGUILayout.PropertyField(ftraceGlobal, new GUIContent("Global", "Automatically assign this volume to all volume-compatible shaders, unless they have overrides."));
            if (!wasGlobal && ftraceGlobal.boolValue)
            {
                for(int i=0; i<targets.Length; i++) (targets[i] as BakeryVolume).SetGlobalParams();
            }
            EditorGUILayout.PropertyField(ftraceDenoise, new GUIContent("Denoise", "Apply denoising after baking the volume."));
            EditorGUILayout.Space();

            BakeryVolume.showAll = EditorGUILayout.Toggle("Show all volumes", BakeryVolume.showAll);
            EditorGUILayout.Space();

            EditorGUILayout.PropertyField(ftraceAdaptiveRes, new GUIContent("Adaptive resolution", "Calculate voxel resolution based on size?"));
            if (ftraceAdaptiveRes.boolValue)
            {
                EditorGUILayout.PropertyField(ftraceVoxelsPerUnit, new GUIContent("Voxels per unit"));

                GUI.enabled = false;
                //EditorGUI.showMixedValue = targets.Length > 1;
                for(int i=0; i<targets.Length; i++)
                {
                    var b = targets[i] as BakeryVolume;
                    var size = b.bounds.size;
                    b.resolutionX = System.Math.Max((int)(size.x * b.voxelsPerUnit), 1);
                    b.resolutionY = System.Math.Max((int)(size.y * b.voxelsPerUnit), 1);
                    b.resolutionZ = System.Math.Max((int)(size.z * b.voxelsPerUnit), 1);
                    EditorUtility.SetDirty(b);
                }
                //EditorGUI.showMixedValue = false;
            }
            EditorGUILayout.PropertyField(ftraceResX, new GUIContent("Resolution X"));
            EditorGUILayout.PropertyField(ftraceResY, new GUIContent("Resolution Y"));
            EditorGUILayout.PropertyField(ftraceResZ, new GUIContent("Resolution Z"));
            if (ftraceResX.intValue < 1) ftraceResX.intValue = 1;
            if (ftraceResY.intValue < 1) ftraceResY.intValue = 1;
            if (ftraceResZ.intValue < 1) ftraceResZ.intValue = 1;
            GUI.enabled = true;

            bool wasSet2 = ftraceRotationY.boolValue;
            EditorGUILayout.PropertyField(ftraceRotationY, new GUIContent("Rotate around Y", "Allows rotating volumes around the Y axis before baking. Shaders must have a similar checkbox enabled."));
            if (wasSet2 != ftraceRotationY.boolValue && ftraceGlobal.boolValue)
            {
                serializedObject.ApplyModifiedProperties();
                for(int i=0; i<targets.Length; i++) (targets[i] as BakeryVolume).SetGlobalParams();
            }
        }
        //else
        {
            //EditorGUILayout.Space();
            //EditorGUILayout.LabelField("Multiple volumes are selected.");
        }

        EditorGUILayout.Space();

        if (storage == null) storage = ftRenderLightmap.FindRenderSettingsStorage();
        var rmode = storage.renderSettingsUserRenderMode;
        int vSize = 0;
        int sSize = 0;
        bool isShadowmask = (rmode == (int)ftRenderLightmap.RenderMode.Shadowmask || pstorage.volumeRenderMode == (int)BakeryLightmapGroup.RenderMode.Shadowmask);
        for(int i=0; i<targets.Length; i++)
        {
            var t = targets[i] as BakeryVolume;
            int sizeX = ftRenderLightmap.VolumeDimension(t.resolutionX);
            int sizeY = ftRenderLightmap.VolumeDimension(t.resolutionY);
            int sizeZ = ftRenderLightmap.VolumeDimension(t.resolutionZ);
            if (storage.renderSettingsCompressVolumes)
            {
                const int blockDimension = 4;
                const int blockByteSize = 16; // both BC6H and BC7
                int numBlocks = (sizeX/blockDimension) * (sizeY/blockDimension);
                vSize += numBlocks * blockByteSize * sizeZ * 4;
            }
            else
            {
                vSize += sizeX*sizeY*sizeZ*8*3;
            }
            if (isShadowmask) sSize += sizeX*sizeY*sizeZ * (t.shadowmaskEncoding == 0 ? 4 : 1);
        }
        string note = "VRAM: " + FormatSize(vSize) + " MB " + (storage.renderSettingsCompressVolumes ? "(compressed color)" : "(color)");
        if (isShadowmask)
        {
            note += ", " + FormatSize(sSize) + " MB (mask)";
        }
        EditorGUILayout.LabelField(note);

        //EditorGUILayout.PropertyField(ftraceAdjustSamples, new GUIContent("Adjust sample positions", "Fixes light leaking from inside surfaces"));

        //if (targets.Length == 1)
        {
            EditorGUILayout.Space();

            showExperimental = EditorGUILayout.Foldout(showExperimental, "Experimental", EditorStyles.foldout);
            if (showExperimental)
            {
                EditorGUILayout.PropertyField(ftraceEncoding, new GUIContent("Encoding"));
                EditorGUILayout.PropertyField(ftraceShadowmaskEncoding, new GUIContent("Shadowmask Encoding"));
                EditorGUILayout.PropertyField(ftraceShadowmaskFirstLightIsAlwaysAlpha, new GUIContent("First light uses Alpha", "In RGBA8 mode, the first light will always be in the alpha channel. This is useful when unifying RGBA8 and A8 volumes, as the main/first light is always in the same channel."));

                bool wasSet = ftraceRotation.boolValue;
                EditorGUILayout.PropertyField(ftraceRotation, new GUIContent("Support rotation after bake", "Normally volumes can only be repositioned or rescaled at runtime. With this checkbox volume's rotation matrix will also be sent to shaders. Shaders must have a similar checkbox enabled."));
                if (wasSet != ftraceRotation.boolValue)
                {
                    for(int i=0; i<targets.Length; i++) (targets[i] as BakeryVolume).SetGlobalParams();
                }
            }

            EditorGUILayout.Space();

            if (vol.bakedTexture0 == null)
            {
                EditorGUILayout.LabelField("Baked texture: none");
            }
            else
            {
                EditorGUILayout.LabelField("Baked texture: " + vol.bakedTexture0.name);
            }

            EditorGUILayout.Space();

            var wrapObj = EditorGUILayout.ObjectField("Wrap to object", null, typeof(GameObject), true) as GameObject;
            if (wrapObj != null)
            {
                var mrs = wrapObj.GetComponentsInChildren<MeshRenderer>() as MeshRenderer[];
                if (mrs.Length > 0)
                {
                    var b = mrs[0].bounds;
                    for(int i=1; i<mrs.Length; i++)
                    {
                        b.Encapsulate(mrs[i].bounds);
                    }
                    Undo.RecordObject(vol, "Change Bounds");
                    Undo.RecordObject(vol.transform, "Change Bounds");
                    vol.transform.position = b.center;
                    vol.bounds = b;
                    Debug.Log("Bounds set");
                }
                else
                {
                    Debug.LogError("No mesh renderers to wrap to");
                }
            }

            var boxCol = vol.GetComponent<BoxCollider>();
            if (boxCol != null)
            {
                if (GUILayout.Button("Set from box collider"))
                {
                    Undo.RecordObject(vol, "Change Bounds");
                    vol.bounds = boxCol.bounds;
                }
                if (GUILayout.Button("Set to box collider"))
                {
                    boxCol.center = Vector3.zero;
                    boxCol.size = vol.bounds.size;
                }
            }

            var bmin = vol.bounds.min;
            var bmax = vol.bounds.max;
            var bsize = vol.bounds.size;
            EditorGUILayout.LabelField("Min: " + bmin.x+", "+bmin.y+", "+bmin.z);
            EditorGUILayout.LabelField("Max: " + bmax.x+", "+bmax.y+", "+bmax.z);

            if (GUILayout.Button("Copy bounds to clipboard"))
            {
                GUIUtility.systemCopyBuffer = "float3 bmin = float3(" + F(bmin.x)+", "+F(bmin.y)+", "+F(bmin.z) + "); float3 bmax = float3(" + F(bmax.x)+", "+F(bmax.y)+", "+F(bmax.z) + "); float3 binvsize = float3(" + F(1.0f/bsize.x)+", "+F(1.0f/bsize.y)+", "+F(1.0f/bsize.z) + ");";
            }

            GUILayout.Space(5);
            BakeryVolume.showProbesPreview = EditorGUILayout.Foldout(BakeryVolume.showProbesPreview, "Show Probes", EditorStyles.foldout);

            if (BakeryVolume.showProbesPreview)
            {
                BakeryVolume.showIndirectOnly = EditorGUILayout.Toggle("Indirect Light Only", BakeryVolume.showIndirectOnly);
                BakeryVolume.showBakedTexture = EditorGUILayout.Toggle("Baked Texture", BakeryVolume.showBakedTexture);   
                BakeryVolume.probesPreviewMul = EditorGUILayout.Slider("Brightness", BakeryVolume.probesPreviewMul, 0.01f, 1.0f);
                BakeryVolume.probesPreviewSize = EditorGUILayout.Slider("Size", BakeryVolume.probesPreviewSize, 0.01f, 1.0f);
            }
            serializedObject.ApplyModifiedProperties();
        }
    }

    protected virtual void OnSceneGUI()
    {
        var vol = (BakeryVolume)target;

        if (vol.rotateAroundY)
        {
            var e = vol.transform.eulerAngles;
            var r = Quaternion.Euler(0, e.y, 0);
            Handles.matrix = Matrix4x4.TRS(r * -vol.transform.position + vol.transform.position, r, Vector3.one);
        }

        boundsHandle.center = vol.transform.position;
        boundsHandle.size = vol.bounds.size;
        // Draw Handle twice for semi-transparent look
        EditorGUI.BeginChangeCheck();
        Handles.color = new Color(1f, 1f, 1f, 0.3f);
        boundsHandle.DrawHandle();
        Handles.zTest = UnityEngine.Rendering.CompareFunction.Less;
        Handles.color = new Color(1f, 1f, 1f, 1f);
        boundsHandle.DrawHandle();
        if (EditorGUI.EndChangeCheck())
        {
            Undo.RecordObject(vol, "Change Bounds");
            Undo.RecordObject(vol.transform, "Change Bounds");

            Bounds newBounds = new Bounds();
            newBounds.center = boundsHandle.center;
            newBounds.size = boundsHandle.size;
            vol.bounds = newBounds;
            if (vol.rotateAroundY)
            {
                var c = boundsHandle.center;
                var sc = vol.GetRotationY();
                var delta = c - vol.transform.position;
                vol.transform.position += new Vector3(delta.x*sc.y + delta.z*sc.x, delta.y, delta.x*-sc.x + delta.z*sc.y);
            }
            else
            {
                vol.transform.position = boundsHandle.center;
            }
        }
        else if ((vol.bounds.center - boundsHandle.center).sqrMagnitude > 0.0001f)
        {
            Bounds newBounds = new Bounds();
            newBounds.center = boundsHandle.center;
            newBounds.size = boundsHandle.size;
            vol.bounds = newBounds;
        }

        if (vol.rotateAroundY)
        {
            Handles.matrix = Matrix4x4.identity;
        }
    }
}
#endif
