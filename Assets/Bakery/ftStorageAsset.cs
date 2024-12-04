#define USE_TERRAINS

using UnityEngine;
using System.Collections.Generic;
using UnityEditor;

public class ftStorageAsset : ScriptableObject
{
#if UNITY_EDITOR

    [SerializeField]
    public string path;

    // Light settings from the last bake
    [SerializeField]
    public List<ftLightmapsStorage.LightData> lights = new List<ftLightmapsStorage.LightData>();

    // List of baked lightmap world-space bounds
    [SerializeField]
    public List<Bounds> bounds = new List<Bounds>();

    // Per-lightmap flags
    [SerializeField]
    public List<bool> hasEmissive = new List<bool>();

    [SerializeField]
    public int[] uvBuffOffsets;
    [SerializeField]
    public int[] uvBuffLengths;
    [SerializeField]
    public float[] uvSrcBuff;
    [SerializeField]
    public float[] uvDestBuff;
    [SerializeField]
    public int[] lmrIndicesOffsets;
    [SerializeField]
    public int[] lmrIndicesLengths;
    [SerializeField]
    public int[] lmrIndicesBuff;

    [SerializeField]
    public int[] lmGroupLODResFlags; // bits which lods are needed for which LMGroups
    [SerializeField]
    public int[] lmGroupMinLOD; // minimum possible resolution for given LMGroup given UV island count
    [SerializeField]
    public int[] lmGroupLODMatrix;

    // Reuired for network bakes
    [SerializeField]
    public List<string> serverGetFileList = new List<string>();
    [SerializeField]
    public List<bool> lightmapHasColor = new List<bool>();
    [SerializeField]
    public List<int> lightmapHasMask = new List<int>();
    [SerializeField]
    public List<bool> lightmapHasDir = new List<bool>();
    [SerializeField]
    public List<bool> lightmapHasRNM = new List<bool>();

    // Partial copy of GlobalStorage to recover UV padding if needed
    [SerializeField]
    public List<string> modifiedAssetPathList = new List<string>();
    [SerializeField]
    public List<ftGlobalStorage.AdjustedMesh> modifiedAssets = new List<ftGlobalStorage.AdjustedMesh>();
    [SerializeField]
    public ftLightmapsStorage.L2[] prevBakedProbes;
    [SerializeField]
    public Vector3[] prevBakedProbePos;
#endif

    // List of baked lightmaps
    [SerializeField]
    public List<Texture2D> maps = new List<Texture2D>();
    [SerializeField]
    public List<Texture2D> masks = new List<Texture2D>();
    [SerializeField]
    public List<Texture2D> dirMaps = new List<Texture2D>();
    [SerializeField]
    public List<Texture2D> rnmMaps0 = new List<Texture2D>();
    [SerializeField]
    public List<Texture2D> rnmMaps1 = new List<Texture2D>();
    [SerializeField]
    public List<Texture2D> rnmMaps2 = new List<Texture2D>();
    [SerializeField]
    public List<int> mapsMode = new List<int>();

    // new props
    [SerializeField]
    public List<int> bakedIDs = new List<int>();
    [SerializeField]
    public List<Vector4> bakedScaleOffset = new List<Vector4>();
#if UNITY_EDITOR
    [SerializeField]
    public List<int> bakedVertexOffset = new List<int>();
#endif
    [SerializeField]
    public List<Mesh> bakedVertexColorMesh = new List<Mesh>();

    [SerializeField]
    public List<int> bakedLightChannels = new List<int>();

#if USE_TERRAINS
    [SerializeField]
    public List<int> bakedIDsTerrain = new List<int>();
    [SerializeField]
    public List<Vector4> bakedScaleOffsetTerrain = new List<Vector4>();
#endif

    [SerializeField]
    public List<string> assetList = new List<string>();
    [SerializeField]
    public List<int> uvOverlapAssetList = new List<int>(); // -1 = no UV1, 0 = no overlap, 1 = overlap

    [SerializeField]
    public int[] idremap;
}

