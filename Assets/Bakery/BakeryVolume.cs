using System.Collections;
using System.Collections.Generic;
using UnityEngine;
#if UNITY_EDITOR
using UnityEditor;
using UnityEditor.IMGUI.Controls;
#endif

[HelpURL("https://geom.io/bakery/wiki/index.php?title=Manual#Bakery_Volume")]
[ExecuteInEditMode]
public class BakeryVolume : MonoBehaviour
{
    public enum Encoding
    {
        // HDR L1 SH, half-float:
        // Tex0 = L0,  L1z.r
        // Tex1 = L1x, L1z.g
        // Tex2 = L1y, L1z.b
        Half4,

        // LDR L1 SH, 8-bit. Components are stored the same way as in Half4,
        // but L1 must be unpacked following way:
        // L1n = (L1n * 2 - 1) * L0 * 0.5 + 0.5
        RGBA8,

        // LDR L1 SH with monochrome directional component (= single color and direction), 8-bit.
        // Tex0 = L0    (alpha unused)
        // Tex1 = L1xyz (alpha unused)
        RGBA8Mono
    }

    public enum ShadowmaskEncoding
    {
        RGBA8,
        A8
    }

    public bool enableBaking = true;
    public Bounds bounds = new Bounds(Vector3.zero, Vector3.one);
    public bool adaptiveRes = true;
    public float voxelsPerUnit = 0.5f;
    public int resolutionX = 16;
    public int resolutionY = 16;
    public int resolutionZ = 16;
    public Encoding encoding = Encoding.Half4;
    public ShadowmaskEncoding shadowmaskEncoding = ShadowmaskEncoding.RGBA8;
    public bool firstLightIsAlwaysAlpha = false;
    public bool denoise = false;
    public bool isGlobal = false;
    public Texture3D bakedTexture0, bakedTexture1, bakedTexture2, bakedTexture3, bakedMask;
    public bool supportRotationAfterBake;
    public bool rotateAroundY;

    public static BakeryVolume globalVolume;

    public static bool showAll = false;

#if UNITY_EDITOR
    // Visualization
    static int probesPreviewCount = 1;
    static int probesPreviewCountCached = -1;
    static Material probesPreviewMaterial;
    static ComputeBuffer probesPreviewPositionBuffer;
    static ComputeBuffer probesPreviewArgsBuffer;
    static uint[] args = new uint[5] { 0, 0, 0, 0, 0 };
    static Vector3[] probesPreviewPositions;
    static Vector3 probesPreviewResolution;
  
    public static bool showIndirectOnly = false;
    public static bool showProbesPreview = false;
    public static float probesPreviewMul = 1.0f;
    public static float probesPreviewSize = 0.15f;
    public static bool showBakedTexture = true;
    static Mesh probePreviewMesh; // shared mesh
    static bool callbackSet = false;
#endif
    
    /*private void OnDrawGizmosSelected()
    {
        if (showProbesPreview) return;
        Gizmos.color = new Color(0.4f, 1f, 0.0f, 0.15f);
        Gizmos.DrawCube( bounds.center , -bounds.size);
        Gizmos.color = new Color(1f, 0.7f, 0.2f, 0.22f);
        Gizmos.DrawCube( bounds.center , bounds.size);
    }*/

    Transform tform;

    public Vector3 GetMin()
    {
        if (rotateAroundY)
        {
            var sc = GetRotationY();
            var p = bounds.min - bounds.center;
            return new Vector3(p.x*sc.y + p.z*sc.x,
                               p.y,
                               p.x*-sc.x + p.z*sc.y) + bounds.center;
        }
        return bounds.min;
    }

    public Vector3 GetInvSize()
    {
        var b = bounds;
        return new Vector3(1.0f/b.size.x, 1.0f/b.size.y, 1.0f/b.size.z);;
    }

    public Matrix4x4 GetMatrix()
    {
        if (tform == null) tform = transform;
        return Matrix4x4.TRS(tform.position, tform.rotation, Vector3.one).inverse;
    }

    public Vector2 GetRotationY()
    {
        if (!rotateAroundY) return new Vector2(0,1);
        if (tform == null) tform = transform;
        float a = tform.eulerAngles.y * Mathf.Deg2Rad;
        return new Vector2(Mathf.Sin(a), Mathf.Cos(a));
    }

    public void SetGlobalParams()
    {
        Shader.SetGlobalTexture("_Volume0", bakedTexture0);
        Shader.SetGlobalTexture("_Volume1", bakedTexture1);
        Shader.SetGlobalTexture("_Volume2", bakedTexture2);
        if (bakedTexture3 != null) Shader.SetGlobalTexture("_Volume3", bakedTexture3);
        Shader.SetGlobalTexture("_VolumeMask", bakedMask);
        Shader.SetGlobalVector("_GlobalVolumeMin", GetMin());
        Shader.SetGlobalVector("_GlobalVolumeInvSize", GetInvSize());
        if (supportRotationAfterBake) Shader.SetGlobalMatrix("_GlobalVolumeMatrix", GetMatrix());
        if (rotateAroundY) Shader.SetGlobalVector("_GlobalVolumeRY", GetRotationY());
        if (bakedTexture0 != null) Shader.SetGlobalVector("_GlobalVolumeVoxelSize", new Vector3(1.0f/bakedTexture0.width, 1.0f/bakedTexture0.height, 1.0f/bakedTexture0.depth));
    }

    public void UpdateBounds()
    {
        var pos = transform.position;
        var size = bounds.size;
        bounds = new Bounds(pos, size);
    }

    public void OnEnable()
    {
        if (isGlobal)
        {
            globalVolume = this;
            SetGlobalParams();
        }
    }

#if UNITY_EDITOR
    static void ProbePreviewUpdate()
    {
        UnityEditor.SceneView.RepaintAll();
    }

    private void Update()
    {
        if (!showProbesPreview && callbackSet)
        {
            EditorApplication.update -= ProbePreviewUpdate;
            callbackSet = false;
            probesPreviewCountCached = -1;
        }
        else if (showProbesPreview && !callbackSet)
        {
            EditorApplication.update -= ProbePreviewUpdate;
            EditorApplication.update += ProbePreviewUpdate;
            callbackSet = true;
        }

        if (Selection.activeObject != gameObject || !showProbesPreview)
        {
            // Reset buffers
            probesPreviewCountCached = -1;
            return;
        }
        
        if (probePreviewMesh == null)
        {
            probePreviewMesh = GenerateSphereMesh();
        }
        
        var bakedTexPreview = showBakedTexture && bakedTexture0 != null;
        if (bakedTexPreview)
        {
            probesPreviewResolution = new Vector3(bakedTexture0.width, bakedTexture0.height, bakedTexture0.depth);
        }
        else
        {
            probesPreviewResolution = new Vector3(resolutionX, resolutionY, resolutionZ);
        }      
        
        probesPreviewCount = (int)(probesPreviewResolution.x * probesPreviewResolution.y * probesPreviewResolution.z);

        if (probesPreviewCountCached != probesPreviewCount)
        {
            ProbesPreviewCreateResources();
            probesPreviewCountCached = probesPreviewCount;
        }
        
        var probesSize = probesPreviewSize / Mathf.Max(Mathf.Max(probesPreviewResolution.x / bounds.size.x,
                                    probesPreviewResolution.y / bounds.size.y),
                                    probesPreviewResolution.z / bounds.size.z);

        probesPreviewMaterial.SetFloat("_ProbeSize", probesSize);
        probesPreviewMaterial.SetFloat("_ProbeMul", probesPreviewMul);
        probesPreviewMaterial.SetVector("_GridPosition", bounds.center);
        probesPreviewMaterial.SetVector("_GridSize", bounds.size);
        probesPreviewMaterial.SetTexture("_VolumePreview0", bakedTexture0);
        probesPreviewMaterial.SetTexture("_VolumePreview1", bakedTexture1);
        probesPreviewMaterial.SetTexture("_VolumePreview2", bakedTexture2);
        probesPreviewMaterial.SetTexture("_VolumePreview3", bakedTexture3);
        probesPreviewMaterial.SetTexture("_VolumePreviewMask", bakedMask);
        
        float bakedMaskState = -1;
        if (bakedMask != null)
            bakedMaskState = shadowmaskEncoding == ShadowmaskEncoding.RGBA8 ? 1 : 2;
        if (showIndirectOnly)
            bakedMaskState = 0;

        probesPreviewMaterial.SetFloat("_ShadowMask", bakedMaskState);
        probesPreviewMaterial.SetFloat("_Encoding", (int)encoding);
        probesPreviewMaterial.SetFloat("_EmptyProbes", bakedTexPreview ? 0 : 1);
        probesPreviewMaterial.SetBuffer("positionBuffer", probesPreviewPositionBuffer);
        // bool isMobilePlatform = EditorUserBuildSettings.activeBuildTarget == BuildTarget.Android ||
        //                         EditorUserBuildSettings.activeBuildTarget == BuildTarget.iOS;
        // if(isMobilePlatform)
        //     probesPreviewMaterial.EnableKeyword("BAKERY_COMPRESSED_VOLUME_RGBM");
        // else
        //     probesPreviewMaterial.DisableKeyword("BAKERY_COMPRESSED_VOLUME_RGBM");
        
        Graphics.DrawMeshInstancedIndirect(probePreviewMesh, 0, probesPreviewMaterial, bounds, probesPreviewArgsBuffer);
    }
    
    private void ProbesPreviewCreateResources()
    {
        if (probesPreviewMaterial == null)
        {
            probesPreviewMaterial = new Material(Shader.Find("Hidden/ftVolumePreview"));
        }

        // Indirect args
        if (probesPreviewArgsBuffer != null) probesPreviewArgsBuffer.Release();
        probesPreviewArgsBuffer = new ComputeBuffer(1, args.Length * sizeof(uint), ComputeBufferType.IndirectArguments);
        args[0] = (uint)probePreviewMesh.GetIndexCount(0);
        args[1] = (uint)probesPreviewCount;
        args[2] = 0;//(uint)probePreviewMesh.GetIndexStart(0);
        args[3] = 0;//(uint)probePreviewMesh.GetBaseVertex(0);

        probesPreviewArgsBuffer.SetData(args);          
        
        // Positions
        if (probesPreviewPositionBuffer != null) probesPreviewPositionBuffer.Release();
        probesPreviewPositionBuffer = new ComputeBuffer(probesPreviewCount, 12);
        
        probesPreviewPositions = new Vector3[probesPreviewCount];
        int index = 0;
        for (int x = 0; x < probesPreviewResolution.x; x++)
        {
            for (int y = 0; y < probesPreviewResolution.y; y++)
            {
                for (int z = 0; z < probesPreviewResolution.z; z++)
                {
                    probesPreviewPositions[index] = new Vector3((x + 0.5f) / (float)probesPreviewResolution.x - 0.5f,
                        (y + 0.5f) / (float)probesPreviewResolution.y - 0.5f,
                        (z + 0.5f) / (float)probesPreviewResolution.z - 0.5f);
                    index++;
                }
            }
        }

        probesPreviewPositionBuffer.SetData(probesPreviewPositions);
    }
    
    void OnDestroy()
    {
        if (probesPreviewPositionBuffer != null) probesPreviewPositionBuffer.Release();
        probesPreviewPositionBuffer = null;

        if (probesPreviewArgsBuffer != null) probesPreviewArgsBuffer.Release();
        probesPreviewArgsBuffer = null;
    } 
    
    private static Mesh GenerateSphereMesh(int stacks = 4, int slices = 6, float radius = 0.5f)
    {
        int vertexCount = (stacks + 1) * (slices + 1);
        Vector3[] vertices = new Vector3[vertexCount];
        Vector3[] normal = new Vector3[vertexCount];
        List<int> indices = new List<int>();
        Mesh mesh = new Mesh();

        int index = 0;
        for (int stack = 0; stack <= stacks; stack++)
        {
            float thetaV = Mathf.PI * ((float)stack / (float)stacks);
            float r = radius * Mathf.Sin(thetaV);
            float y = radius * Mathf.Cos(thetaV);
            for (int slice = 0; slice <= slices; slice++)
            {
                float thetaH = 2.0f * Mathf.PI * ((float)slice / (float)slices);
                float x = r * Mathf.Cos(thetaH);
                float z = r * Mathf.Sin(thetaH);
                vertices[index] = new Vector3(x, y, z);

                index++;
            }
        }

        for (int stack = 0; stack < stacks; stack++)
        {
            for (int slice = 0; slice < slices; slice++)
            {
                int count = slice + ((slices + 1) * stack);

                indices.Add(count);
                indices.Add(count + 1);
                indices.Add(count + slices + 2);

                indices.Add(count);
                indices.Add(count + slices + 2);
                indices.Add(count + slices + 1);
            }
        }
	    
        for (int i = 0; i < vertices.Length; i++)
        {
            normal[i] = vertices[i].normalized;
        }

        mesh.vertices = vertices;
        mesh.normals = normal;
        mesh.triangles = indices.ToArray();
        //mesh.Optimize();
        MeshUtility.Optimize(mesh);
        mesh.RecalculateBounds();

        return mesh;
    }      
    
#endif

    void OnDrawGizmos()
    {
        if (!showAll) return;

        Gizmos.color = new Color(1, 1, 1, 0.35f);

        var tform = transform;
        if (rotateAroundY)
        {
            var e = tform.eulerAngles;
            var r = Quaternion.Euler(0, e.y, 0);
            Gizmos.matrix = Matrix4x4.TRS(r * -tform.position + tform.position, r, Vector3.one);
        }

        Gizmos.DrawWireCube(tform.position, bounds.size);
    }
}
