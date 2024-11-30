#if UNITY_EDITOR

//#define SUPPORT_MBLOCKS

using UnityEngine;
using UnityEditor;
using System.IO;
using System.Reflection;

public class ftUVGBufferGen
{
    static RenderTexture rtAlbedo, rtEmissive, rtNormal, rtAlpha;
    public static Texture2D texAlbedo, texEmissive, texNormal, texBestFit, texAlpha;
    //static GameObject dummyCamGO;
    //static Camera dummyCam;
    static float texelSize;
    //static Vector4 shaBlack, shaWhite;
    static Material matFromRGBM;
    static Material matDilate, matMultiply;
    static bool emissiveEnabled = false;
    static bool normalEnabled = false;
    static bool alphaEnabled = false;
    static Vector4 metaControl, metaControlAlbedo, metaControlEmission, metaControlNormal, metaControlAlpha;
    static Material fallbackMat, normalMat, blackMat;
    static int fallbackMatMetaPass;
    static BakeryProjectSettings pstorage;

    public static float[] vertexBakeSamples;
    static int vertexBakeSampleCounter;

    const int PASS_ALBEDO = 0;
    const int PASS_EMISSIVE = 1;
    const int PASS_NORMAL = 2;
    const int PASS_ALPHA = 3;
    const int PASS_COUNT = 4; // just a marker


    static Material activeMaterial;
    static int activeMaterialPass;
    static MaterialPropertyBlock mb = new MaterialPropertyBlock();
    static Material tmpMaterial;

    public static float[] uvOffset =
    {
        -2, -2,
        2, -2,
        -2, 2,
        2, 2,

        -1, -2,
        1, -2,
        -2, -1,
        2, -1,
        -2, 1,
        2, 1,
        -1, 2,
        1, 2,

        -2, 0,
        2, 0,
        0, -2,
        0, 2,

        -1, -1,
        1, -1,
        -1, 0,
        1, 0,
        -1, 1,
        1, 1,
        0, -1,
        0, 1,

        0, 0
    };

    static public void UpdateMatrix(Matrix4x4 worldMatrix, float offsetX, float offsetY)//Matrix4x4 worldMatrix)
    {
        // Generate a projection matrix similar to LoadOrtho
        /*var dummyCamGO = new GameObject();
        dummyCamGO.name = "dummyCam";
        var dummyCam = dummyCamGO.AddComponent<Camera>();
        dummyCam.cullingMask = 0;
        dummyCam.orthographic = true;
        dummyCam.orthographicSize = 0.5f;
        dummyCam.nearClipPlane = -10;
        dummyCam.aspect = 1;
        var proj = dummyCam.projectionMatrix;
        var c3 = proj.GetColumn(3);
        proj.SetColumn(3, new Vector4(-1, -1, c3.z, c3.w));
        Debug.Log(proj);*/

        var proj = new Matrix4x4();
        proj.SetRow(0, new Vector4(2.00000f,  0.00000f, 0.00000f, -1.00000f + offsetX));
        proj.SetRow(1, new Vector4(0.00000f,  2.00000f, 0.00000f, -1.00000f + offsetY));
        proj.SetRow(2, new Vector4(0.00000f,  0.00000f, -0.00198f,    -0.98f));
        proj.SetRow(3, new Vector4(0.00000f,  0.00000f, 0.00000f, 1.00000f));

        //if (ftBuildGraphics.unityVersionMajor < 2018) // Unity 2018 stopped multiplying vertices by world matrix in meta pass
        //{
#if UNITY_2018_1_OR_NEWER
#else
            proj = proj * worldMatrix.inverse;
#endif
        //}

        // If Camera.current is set, multiply our matrix by the inverse of its view matrix
        if (Camera.current != null)
        {
            proj = proj * Camera.current.worldToCameraMatrix.inverse;
        }

        GL.LoadProjectionMatrix(proj);
    }

    static Mesh GenerateVertexBakeSamples(Mesh mesh, int vertexSamplingDensity, Vector3[] wpos)
    {
        int vertexCount = mesh.vertexCount;
        var verts = wpos;//mesh.vertices;
        var normals = mesh.normals;
        var uv = mesh.uv;
        bool hasUV = uv != null && uv.Length > 0;
        Vector2 tA = Vector2.zero;
        Vector2 tB = Vector2.zero;
        Vector2 tC = Vector2.zero;
        int newVertexCount = ftBuildGraphics.GetNumVertexSamples(mesh, vertexSamplingDensity);
        var newMesh = new Mesh();
        if (newVertexCount > 65000)
        {
#if UNITY_2017_3_OR_NEWER
            newMesh.indexFormat = UnityEngine.Rendering.IndexFormat.UInt32;
#else
            ftBuildGraphics.DebugLogError("Using this vertexSamplingDensity value (" + vertexSamplingDensity + ") on this mesh (" + mesh.name + ") results in more than 65000 new vertices. Please lower the value, split the mesh, or use Unity >= 2017.3. Alternatively, annoy me via email, so I fix it.");
            return null;
#endif
        }
        var newVerts = new Vector3[newVertexCount];
        var newNormals = new Vector3[newVertexCount];
        var newUV = new Vector2[newVertexCount];
        int subMeshCount = mesh.subMeshCount;
        int sampleCount = 0;
        UnityEngine.Random.InitState(vertexCount); // instead of storing barycentrics we will regenerate them
        for(int subMesh=0; subMesh<subMeshCount; subMesh++)
        {
            var inds = mesh.GetIndices(subMesh);
            int tris = inds.Length / 3;
            for(int tri=0; tri<tris; tri++)
            {
                var A = verts[inds[tri*3]];
                var B = verts[inds[tri*3+1]];
                var C = verts[inds[tri*3+2]];
                
                var nA = normals[inds[tri*3]];
                var nB = normals[inds[tri*3+1]];
                var nC = normals[inds[tri*3+2]];

                if (hasUV)
                {
                    tA = uv[inds[tri*3]];
                    tB = uv[inds[tri*3+1]];
                    tC = uv[inds[tri*3+2]];
                }

                for(int i=0; i<vertexSamplingDensity; i++)
                {
                    float rndA = UnityEngine.Random.value;
                    float rndB = UnityEngine.Random.value;
                    float rndC = UnityEngine.Random.value;

                    float baryA = 1.0f - Mathf.Sqrt(rndA);
                    float baryB = Mathf.Sqrt(rndA) * (1.0f - rndB);
                    float baryC = Mathf.Sqrt(rndA) * rndB;
            
                    //var testPos = new Vector3[3];
                    //testPos[0] = A;
                    //testPos[1] = B;
                    //testPos[2] = C;
                    //var testNormal = new Vector3[3];
                    //testNormal[0] = nA;
                    //testNormal[1] = nB;
                    //testNormal[2] = nC;

                    newVerts[sampleCount]   = baryA * A + baryB * B + baryC * C;
                    newNormals[sampleCount] = baryA * nA + baryB * nB + baryC * nC;
                    newUV[sampleCount] = baryA * tA + baryB * tB + baryC * tC;

                    vertexBakeSamples[vertexBakeSampleCounter*4] = newVerts[sampleCount].x;
                    vertexBakeSamples[vertexBakeSampleCounter*4+1] = newVerts[sampleCount].y;
                    vertexBakeSamples[vertexBakeSampleCounter*4+2] = newVerts[sampleCount].z;

                    sampleCount++;
                    vertexBakeSampleCounter++;
                }
                
            }
        }
        newMesh.vertices = newVerts;
        newMesh.normals = newNormals;
        newMesh.uv = newUV;
        newMesh.subMeshCount = subMeshCount;
        int offset = 0;
        for(int subMesh=0; subMesh<subMeshCount; subMesh++)
        {
            int tris = (int)mesh.GetIndexCount(subMesh)/3;
            int samples = tris * vertexSamplingDensity;
            var newIndices = new int[samples];
            for(int i=0; i<samples; i++)
            {
                newIndices[i] = offset + i;
            }
            offset += samples;
            newMesh.SetIndices(newIndices, MeshTopology.Points, subMesh, false);
        }

        return newMesh;
    }

    static public void StartUVGBuffer(int size, bool hasEmissive, bool hasNormal, int vertexBakeSampleBufferSize = 0)
    {
        emissiveEnabled = hasEmissive;
        normalEnabled = hasNormal;
        alphaEnabled = false;

        vertexBakeSampleCounter = 0;
        if (vertexBakeSampleBufferSize > 0)
        {
            vertexBakeSamples = new float[vertexBakeSampleBufferSize * 4];
        }

        rtAlbedo = new RenderTexture(size, size, 0, RenderTextureFormat.ARGB32, RenderTextureReadWrite.sRGB);
        texAlbedo = new Texture2D(size, size, TextureFormat.RGBA32, false, false);

        Graphics.SetRenderTarget(rtAlbedo);
        GL.Clear(true, true, new Color(0,0,0,0));

        if (hasEmissive)
        {
            rtEmissive = new RenderTexture(size, size, 0, RenderTextureFormat.ARGBHalf, RenderTextureReadWrite.Linear);
            texEmissive = new Texture2D(size, size, TextureFormat.RGBAHalf, false, true);
            Graphics.SetRenderTarget(rtEmissive);
            GL.Clear(true, true, new Color(0,0,0,0));
        }

        if (hasNormal)
        {
            rtNormal = new RenderTexture(size, size, 0, RenderTextureFormat.ARGB32, RenderTextureReadWrite.Linear);
            texNormal = new Texture2D(size, size, TextureFormat.RGBA32, false, true);
            Graphics.SetRenderTarget(rtNormal);
            GL.Clear(true, true, new Color(0,0,0,0));
        }

        //GL.sRGBWrite = true;//!hasEmissive;
        GL.invertCulling = false;
        GL.PushMatrix();
        //GL.LoadOrtho();
        //UpdateMatrix();
        /*float ambR, ambG, ambB;
        //ambR = ambG = ambB = emissiveOnly ? 0 : 1;
        Shader.SetGlobalVector("unity_SHBr", Vector4.zero);
        Shader.SetGlobalVector("unity_SHBg", Vector4.zero);
        Shader.SetGlobalVector("unity_SHBb", Vector4.zero);
        Shader.SetGlobalVector("unity_SHC", Vector4.zero);*/
        texelSize = (1.0f / size) / 5;
        //shaBlack = new Vector4(0,0,0,0);
        //shaWhite = new Vector4(0,0,0,1);
        metaControl = new Vector4(1,0,0,0);
        metaControlAlbedo = new Vector4(1,0,0,0);
        metaControlEmission = new Vector4(0,1,0,0);
        metaControlNormal = new Vector4(0,0,1,0);
        metaControlAlpha = new Vector4(0,0,0,1);
        Shader.SetGlobalVector("unity_MetaVertexControl", metaControl);
        Shader.SetGlobalFloat("unity_OneOverOutputBoost", 1.0f);
        Shader.SetGlobalFloat("unity_MaxOutputValue", 10000000.0f);
        Shader.SetGlobalFloat("unity_UseLinearSpace", PlayerSettings.colorSpace == ColorSpace.Linear ? 1.0f : 0.0f);
    }

    static public void InitAlphaBuffer(int size)
    {
        alphaEnabled = true;
        rtAlpha = new RenderTexture(size, size, 0, RenderTextureFormat.ARGB32, RenderTextureReadWrite.Linear);
        rtAlpha.name = "BakeryRTAlpha";
        texAlpha = new Texture2D(size, size, TextureFormat.RGBA32, false, true);
        texAlpha.name = "BakeryTexAlpha";
        Graphics.SetRenderTarget(rtAlpha);
        GL.Clear(true, true, new Color(0,0,0,0));
    }

#if SUPPORT_MBLOCKS
        static void OverrideColor(MaterialPropertyBlock mb, string pname)
        {
    #if UNITY_2021_1_OR_NEWER
            if (!mb.HasColor(pname)) return;
            tmpMaterial.SetColor(pname, mb.GetColor(pname));
    #else
    
        #if UNITY_2017_3_OR_NEWER
                var v = mb.GetColor(pname);
                if (v.r == 0 && v.g == 0 && v.b == 0 && v.a == 0) return; // not the best workaround - can't override with 0 on < 2021.1
                tmpMaterial.SetColor(pname, v);
        #else
            var v = mb.GetVector(pname);
            if (v.x == 0 && v.y == 0 && v.z == 0 && v.w == 0) return; // not the best workaround - can't override with 0 on < 2021.1
            tmpMaterial.SetVector(pname, v);
        #endif

    #endif
        }

        static void OverrideVector(MaterialPropertyBlock mb, string pname)
        {
    #if UNITY_2021_1_OR_NEWER
            if (!mb.HasVector(pname)) return;
            tmpMaterial.SetVector(pname, mb.GetVector(pname));
    #else
            var v = mb.GetVector(pname);
            if (v.x == 0 && v.y == 0 && v.z == 0 && v.w == 0) return; // not the best workaround - can't override with 0 on < 2021.1
            tmpMaterial.SetVector(pname, v);
    #endif
        }

        static void OverrideFloat(MaterialPropertyBlock mb, string pname)
        {
    #if UNITY_2021_1_OR_NEWER
            if (!mb.HasFloat(pname)) return;
            tmpMaterial.SetFloat(pname, mb.GetFloat(pname));
    #else
            var v = mb.GetFloat(pname);
            if (v == 0) return; // not the best workaround - can't override with 0 on < 2021.1
            tmpMaterial.SetFloat(pname, v);
    #endif
        }

        static void OverrideTexture(MaterialPropertyBlock mb, string pname)
        {
    #if UNITY_2021_1_OR_NEWER
            if (!mb.HasTexture(pname)) return;
            tmpMaterial.SetTexture(pname, mb.GetTexture(pname));
    #else
            var v = mb.GetTexture(pname);
            if (v == null) return;
            tmpMaterial.SetTexture(pname, v);
    #endif
        }
#endif

    static void DrawWithOverrides(Renderer renderer, Mesh m, ref Matrix4x4 worldMatrix, int i)
    {
#if SUPPORT_MBLOCKS

    #if UNITY_2018_1_OR_NEWER
            if (renderer.HasPropertyBlock())
    #endif
            {

            //#if UNITY_2018_1_OR_NEWER
              //  renderer.GetPropertyBlock(mb, i);
            //#else
                renderer.GetPropertyBlock(mb);
            //#endif

                var shader = activeMaterial.shader;
                if ((!mb.isEmpty) && activeMaterial != null && shader != null)
                {
                    tmpMaterial = new Material(activeMaterial);

                    int numPropsInShader = ShaderUtil.GetPropertyCount(shader);
                    for(int j=0; j<numPropsInShader; j++)
                    {
                        var pname = ShaderUtil.GetPropertyName(shader, j);
                        int ptype = (int)ShaderUtil.GetPropertyType(shader, j);
                        if (ptype == 0) // color
                        {
                            OverrideColor(mb, pname);
                        }
                        else if (ptype == 1) // vector
                        {
                            OverrideVector(mb, pname);
                        }
                        else if (ptype == 2) // float
                        {
                            OverrideFloat(mb, pname);
                        }
                        else if (ptype == 4) // TexEnv
                        {
                            OverrideTexture(mb, pname);
                        }
                    }

                    tmpMaterial.SetPass(activeMaterialPass);
                }
            }
#endif
        Graphics.DrawMeshNow(m, worldMatrix, i);
    }

    static public void RenderUVGBuffer(Mesh mesh, Renderer renderer, Vector4 scaleOffset, Transform worldTransform, bool vertexBake, int vertexSamplingDensity, Vector3[] tformedPos,
        Vector2[] uvOverride, bool terrainNormals = false, bool metaAlpha = false)
    {
        var worldMatrix = worldTransform.localToWorldMatrix;

        if (pstorage == null) pstorage = ftLightmaps.GetProjectSettings();

        if (metaAlpha && !alphaEnabled)
        {
            int res = rtAlbedo.width * pstorage.alphaMetaPassResolutionMultiplier;
            if (res > 8192) res = 8192;
            InitAlphaBuffer(res);
        }

        Material[] materials = renderer.sharedMaterials;

        var m = mesh;
        if (uvOverride != null)
        {
            if (vertexBake && vertexSamplingDensity > 1)
            {
                m = GenerateVertexBakeSamples(mesh, vertexSamplingDensity, tformedPos);
            }
            else
            {
                m = Mesh.Instantiate(mesh);
                if (vertexBake)
                {
                    for(int i=0; i<mesh.subMeshCount; i++)
                    {
                        var indices = m.GetIndices(i);
                        m.SetIndices(indices, MeshTopology.Points, i, false);
                    }
                }
            }
            m.uv2 = uvOverride;
        }

        //var scaleOffsetFlipped = new Vector4(scaleOffset.x, -scaleOffset.y, scaleOffset.z, 1.0f - scaleOffset.w);

        //UpdateMatrix(worldMatrix);

        for(int pass=0; pass<PASS_COUNT; pass++)
        {
            if (pass == PASS_EMISSIVE && !emissiveEnabled) continue;
            if (pass == PASS_NORMAL && !normalEnabled) continue;
            if (pass == PASS_ALPHA && !alphaEnabled) continue; // per Start-End
            if (pass == PASS_ALPHA && !metaAlpha) continue; // per this object

            if (pass == PASS_ALBEDO)
            {
                Graphics.SetRenderTarget(rtAlbedo);
            }
            else if (pass == PASS_EMISSIVE)
            {
                Graphics.SetRenderTarget(rtEmissive);
            }
            else if (pass == PASS_NORMAL)
            {
                Graphics.SetRenderTarget(rtNormal);
            }
            else if (pass == PASS_ALPHA)
            {
                Graphics.SetRenderTarget(rtAlpha);
            }

            for(int i=0; i<mesh.subMeshCount; i++)
            {
                if (materials.Length <= i) break;
                if (materials[i] ==  null) continue;
                if (materials[i].shader ==  null) continue;

                // Optionally skip emission
                bool passAsBlack = (pass == PASS_EMISSIVE && materials[i].globalIlluminationFlags != MaterialGlobalIlluminationFlags.BakedEmissive);

                var rpTag = materials[i].GetTag("RenderPipeline", true, "");
                bool isHDRP = rpTag == "HDRenderPipeline";
                if (pass >= PASS_NORMAL) isHDRP = false; // custom meta shaders are not affected
                int bakeryPass = -1;

                if (pass < PASS_NORMAL)
                {
                    int metaPass = -1;
                    if (!materials[i].HasProperty("BAKERY_FORCE_NO_META"))
                    {
                        if (!passAsBlack)
                        {
                            metaPass = materials[i].FindPass("META");
                            if (metaPass < 0)
                            {
                                // Try finding another pass pass with "META" in it
                                for(int mpass=0; mpass<materials[i].passCount; mpass++)
                                {
                                    if (materials[i].GetPassName(mpass).IndexOf("META") >= 0)
                                    {
                                        metaPass = mpass;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    Shader.SetGlobalVector("unity_LightmapST", scaleOffset);//(isHDRP) ? scaleOffsetFlipped : scaleOffset);
                    Shader.SetGlobalVector("unity_MetaFragmentControl", pass == PASS_ALBEDO ? metaControlAlbedo : metaControlEmission);

                    if (metaPass >= 0)
                    {
                        materials[i].SetPass(metaPass);
                        activeMaterial = materials[i];
                        activeMaterialPass = metaPass;
                    }
                    else
                    {
                        if (passAsBlack)
                        {
                            if (blackMat == null)
                            {
                                blackMat = new Material(Shader.Find("Hidden/ftBlack"));
                            }
                            Shader.SetGlobalVector("unity_LightmapST", scaleOffset);
                            blackMat.SetPass(0);
                            activeMaterial = blackMat;
                            activeMaterialPass = 0;
                        }
                        else
                        {
                            if (fallbackMat == null)
                            {
                                fallbackMat = new Material(Shader.Find("Standard"));
                                fallbackMat.EnableKeyword("_EMISSION");
                                fallbackMatMetaPass = fallbackMat.FindPass("META");
                            }
                            if ((pstorage.logLevel & (int)BakeryProjectSettings.LogLevel.Warning) != 0)
                            {
                                if (materials[i].name != "Hidden/ftFarSphere")
                                {
                                    Debug.LogWarning("Material " + materials[i].name + " doesn't have meta pass - maps are taken by name");
                                }
                            }
                            if (materials[i].HasProperty("_MainTex"))
                            {
                                fallbackMat.mainTexture = materials[i].GetTexture("_MainTex");
                            }
                            else if (materials[i].HasProperty("_BaseColorMap"))
                            {
                                // HDRP
                                fallbackMat.mainTexture = materials[i].GetTexture("_BaseColorMap");
                            }
                            else if (materials[i].HasProperty("_BaseMap"))
                            {
                                // URP
                                fallbackMat.mainTexture = materials[i].GetTexture("_BaseMap");
                            }
                            if (materials[i].HasProperty("_Color"))
                            {
                                fallbackMat.SetVector("_Color", materials[i].GetVector("_Color"));
                            }
                            else
                            {
                                fallbackMat.SetVector("_Color", Color.white);
                            }
                            if (materials[i].HasProperty("_EmissionMap"))
                            {
                                fallbackMat.SetTexture("_EmissionMap", materials[i].GetTexture("_EmissionMap"));
                            }
                            else
                            {
                                fallbackMat.SetTexture("_EmissionMap", null);
                            }
                            if (materials[i].HasProperty("_EmissionColor"))
                            {
                                fallbackMat.SetVector("_EmissionColor", materials[i].GetVector("_EmissionColor"));
                            }
                            else
                            {
                                fallbackMat.SetVector("_EmissionColor", Color.black);
                            }
                            fallbackMat.SetPass(fallbackMatMetaPass);
                            activeMaterial = fallbackMat;
                            activeMaterialPass = fallbackMatMetaPass;
                        }
                    }
                }
                else if (pass == PASS_NORMAL)
                {
                    bool isURP = rpTag == "UniversalPipeline";

                    var metaPass = materials[i].FindPass("META_BAKERY");
                    bakeryPass = metaPass;

                    if (normalMat == null && metaPass < 0)
                    {
                        normalMat = new Material(Shader.Find("Hidden/ftUVNormalMap"));
                    }
                    if (texBestFit == null)
                    {
                        texBestFit = new Texture2D(1024, 1024, TextureFormat.RGBA32, false, true);
                        var edPath = ftLightmaps.GetEditorPath();
                        var fbestfit = new BinaryReader(File.Open(edPath + "NormalsFittingTexture_dds", FileMode.Open, FileAccess.Read));
                        fbestfit.BaseStream.Seek(128, SeekOrigin.Begin);
                        var bytes = fbestfit.ReadBytes(1024 * 1024 * 4);
                        fbestfit.Close();
                        texBestFit.LoadRawTextureData(bytes);
                        texBestFit.Apply();
                    }

                    if (metaPass < 0)
                    {
                        if (materials[i].HasProperty("_BumpMap"))
                        {
                            normalMat.SetTexture("_BumpMap", materials[i].GetTexture("_BumpMap"));
                            if (materials[i].HasProperty("_MainTex_ST"))
                            {
                                normalMat.SetVector("_BumpMap_scaleOffset", materials[i].GetVector("_MainTex_ST"));
                                //Debug.LogError(materials[i].GetVector("_MainTex_ST"));
                            }
                            else
                            {
                                normalMat.SetVector("_BumpMap_scaleOffset", new Vector4(1,1,0,0));
                            }
                        }
                        else if (materials[i].HasProperty("_NormalMap"))
                        {
                            normalMat.SetTexture("_BumpMap", materials[i].GetTexture("_NormalMap"));
                            normalMat.SetVector("_BumpMap_scaleOffset", new Vector4(1,1,0,0));
                        }
                        else
                        {
                            normalMat.SetTexture("_BumpMap", null);
                        }
                        normalMat.SetFloat("_IsTerrain", terrainNormals ? 1.0f : 0.0f);
                        normalMat.SetTexture("bestFitNormalMap", texBestFit);
                        normalMat.SetFloat("_IsPerPixel", (isURP||isHDRP) ? 1.0f : 0.0f);
                        normalMat.SetPass(0);
                        activeMaterial = normalMat;
                        activeMaterialPass = 0;
                    }
                    else
                    {
                        materials[i].SetTexture("bestFitNormalMap", texBestFit);
                        materials[i].SetFloat("_IsPerPixel", (isURP||isHDRP) ? 1.0f : 0.0f);
                        materials[i].SetPass(metaPass);
                        activeMaterial = materials[i];
                        activeMaterialPass = metaPass;
                    }
                    Shader.SetGlobalVector("unity_MetaFragmentControl", metaControlNormal);
                }
                else if (pass == PASS_ALPHA)
                {
                    // Unity does not output alpha in its meta pass, so only custom shaders are supported
                    var metaPass = materials[i].FindPass("META_BAKERY");
                    if (metaPass < 0)
                    {
                        Debug.LogError("BAKERY_META_ALPHA_ENABLE is set, but there is no META_BAKERY pass in " + materials[i].name);
                        continue;
                    }
                    bakeryPass = metaPass;
                    materials[i].SetPass(metaPass);
                    activeMaterial = materials[i];
                    activeMaterialPass = metaPass;
                    Shader.SetGlobalVector("unity_MetaFragmentControl", metaControlAlpha);
                }

                GL.sRGBWrite = pass == PASS_ALBEDO;

                if (!vertexBake)
                {
                    for(int j=0; j<uvOffset.Length/2; j++)
                    {
                        if (pass < PASS_NORMAL)
                        {
                            UpdateMatrix(worldMatrix, uvOffset[j*2] * texelSize, uvOffset[j*2+1] * texelSize);
                        }
                        else
                        {
                            // TODO: use in HDRP as well
                            var srcVec = scaleOffset;//(isHDRP) ? scaleOffsetFlipped : scaleOffset;
                            var vec = new Vector4(srcVec.x, srcVec.y, srcVec.z + uvOffset[j*2] * texelSize, srcVec.w + uvOffset[j*2+1] * texelSize);
                            Shader.SetGlobalVector("unity_LightmapST", vec);
                            if (bakeryPass >= 0)
                            {
                                materials[i].SetPass(bakeryPass);
                                activeMaterial = materials[i];
                                activeMaterialPass = bakeryPass;
                            }
                            else
                            {
                                var s = worldTransform.lossyScale;
                                bool isFlipped = Mathf.Sign(s.x*s.y*s.z) < 0;
                                normalMat.SetFloat("_IsFlipped", isFlipped ? -1.0f : 1.0f);
                                normalMat.SetPass(0);
                                activeMaterial = normalMat;
                                activeMaterialPass = 0;
                            }
                        }
                        DrawWithOverrides(renderer, m, ref worldMatrix, i);
                    }
                }
                else
                {
                    UpdateMatrix(worldMatrix, 0, 0);

                    DrawWithOverrides(renderer, m, ref worldMatrix, i);
                }
            }
        }
    }

    static public void EndUVGBuffer()
    {
        GL.PopMatrix();

        Graphics.SetRenderTarget(rtAlbedo);
        texAlbedo.ReadPixels(new Rect(0,0,rtAlbedo.width,rtAlbedo.height), 0, 0, false);
        texAlbedo.Apply();
        Graphics.SetRenderTarget(null);
        rtAlbedo.Release();

        if (emissiveEnabled)
        {
            Graphics.SetRenderTarget(rtEmissive);
            texEmissive.ReadPixels(new Rect(0,0,rtEmissive.width,rtEmissive.height), 0, 0, false);
            texEmissive.Apply();
            Graphics.SetRenderTarget(null);
            rtEmissive.Release();
        }

        if (normalEnabled)
        {
            Graphics.SetRenderTarget(rtNormal);
            texNormal.ReadPixels(new Rect(0,0,rtNormal.width,rtNormal.height), 0, 0, false);
            texNormal.Apply();
            Graphics.SetRenderTarget(null);
            rtNormal.Release();
        }

        if (alphaEnabled)
        {
            Graphics.SetRenderTarget(rtAlpha);
            texAlpha.ReadPixels(new Rect(0,0,rtAlpha.width,rtAlpha.height), 0, 0, false);
            texAlpha.Apply();
            Graphics.SetRenderTarget(null);
            rtAlpha.Release();
            rtAlpha = null;
        }
    }

    static public Texture2D DecodeFromRGBM(Texture2D emissive)
    {
        var rt = new RenderTexture(emissive.width, emissive.height, 0, RenderTextureFormat.ARGBHalf, RenderTextureReadWrite.Linear);
        var tex = new Texture2D(emissive.width, emissive.height, TextureFormat.RGBAHalf, false, true);

        if (matFromRGBM == null) matFromRGBM = new Material(Shader.Find("Hidden/ftRGBM2Half"));

        Graphics.SetRenderTarget(rt);
        GL.sRGBWrite = false;

        matFromRGBM.SetTexture("_MainTex", emissive);

        Graphics.Blit(emissive, rt, matFromRGBM);

        tex.ReadPixels(new Rect(0,0,rt.width,rt.height), 0, 0, false);
        tex.Apply();

        Graphics.SetRenderTarget(null);
        rt.Release();
        Object.DestroyImmediate(emissive);

        return tex;
    }

    static public void Dilate(Texture2D albedo, int pass = 0)
    {
        if (matDilate == null) matDilate = new Material(Shader.Find("Hidden/ftDilate"));

        RenderTexture rt, rt2;
        if (albedo.format == TextureFormat.RGBA32)
        {
            rt = new RenderTexture(albedo.width, albedo.height, 0, RenderTextureFormat.ARGB32, RenderTextureReadWrite.sRGB);
            rt2 = new RenderTexture(albedo.width, albedo.height, 0, RenderTextureFormat.ARGB32, RenderTextureReadWrite.sRGB);
        }
        else
        {
            rt = new RenderTexture(albedo.width, albedo.height, 0, RenderTextureFormat.ARGBHalf, RenderTextureReadWrite.Linear);
            rt2 = new RenderTexture(albedo.width, albedo.height, 0, RenderTextureFormat.ARGBHalf, RenderTextureReadWrite.Linear);
        }

        GL.sRGBWrite = albedo.format == TextureFormat.RGBA32;
        Graphics.Blit(albedo, rt, matDilate, pass);

        for(int i=0; i<8; i++)
        {
            Graphics.Blit(rt, rt2, matDilate, pass);
            Graphics.Blit(rt2, rt, matDilate, pass);
        }

        Graphics.SetRenderTarget(rt);
        albedo.ReadPixels(new Rect(0,0,rt.width,rt.height), 0, 0, false);
        albedo.Apply();

        Graphics.SetRenderTarget(null);
        rt.Release();
        rt2.Release();
    }

    static public void Multiply(Texture2D albedo, float val)
    {
        if (matMultiply == null) matMultiply = new Material(Shader.Find("Hidden/ftMultiply"));

        RenderTexture rt;
        if (albedo.format == TextureFormat.RGBA32)
        {
            rt = new RenderTexture(albedo.width, albedo.height, 0, RenderTextureFormat.ARGB32, RenderTextureReadWrite.sRGB);
        }
        else
        {
            rt = new RenderTexture(albedo.width, albedo.height, 0, RenderTextureFormat.ARGBHalf, RenderTextureReadWrite.Linear);
        }

        GL.sRGBWrite = albedo.format == TextureFormat.RGBA32;
        matMultiply.SetFloat("multiplier", val);
        Graphics.Blit(albedo, rt, matMultiply);

        Graphics.SetRenderTarget(rt);
        albedo.ReadPixels(new Rect(0,0,rt.width,rt.height), 0, 0, false);
        albedo.Apply();

        Graphics.SetRenderTarget(null);
        rt.Release();
    }
}

#endif

