Shader "Hidden/ftVolumePreview"
{
    SubShader
    {
        Tags { "RenderType"="Opaque" "Queue"="AlphaTest+50" "ForceNoShadowCasting"="True" }

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma target 4.5

            #pragma multi_compile_fog
            #pragma multi_compile_instancing

            #include "UnityCG.cginc"
            #include "UnityLightingCommon.cginc"
            #include "AutoLight.cginc"
            #pragma multi_compile __ BAKERY_COMPRESSED_VOLUME
            #pragma multi_compile __ BAKERY_COMPRESSED_VOLUME_RGBM

            #if SHADER_TARGET >= 45
            StructuredBuffer<float3> positionBuffer;
            #endif

            Texture3D _VolumePreview0, _VolumePreview1, _VolumePreview2, _VolumePreview3, _VolumePreviewMask;
            SamplerState sampler_VolumePreview0;
            float3 _VolumeMin, _VolumeInvSize;
            float3 _GlobalVolumeMin, _GlobalVolumeInvSize;
            
            bool _ShowIndirectOnly;
            bool _EmptyProbes;
            float _ShadowMask;
            float _Encoding;
            float _ProbeSize;
            float _ProbeMul;
            float3 _GridPosition;
            float3 _GridSize;

            float shEvaluateDiffuseL1Geomerics(float L0, float3 L1, float3 n)
            {
                float R0 = L0;
                float3 R1 = 0.5f * L1;
                float lenR1 = length(R1);
                float q = dot(normalize(R1), n) * 0.5 + 0.5;
                float p = 1.0f + 2.0f * lenR1 / R0;
                float a = (1.0f - lenR1 / R0) / (1.0f + lenR1 / R0);
                return R0 * (a + (1.0f - a) * (p + 1.0f) * pow(q, p));
            }

            struct v2f
            {
                float4 pos : SV_POSITION;
                float3 uvs : TEXCOORD0;
                float3 normal : NORMAL;
            };

            sampler2D _MainTex;
            float4 _Color;
            float _FogBlend;
            float _Bias;

            v2f vert (appdata_full v, uint instanceID : SV_InstanceID)
            {
                #if SHADER_TARGET >= 45
                    float3 data = positionBuffer[instanceID];
                #else
                    float3 data = 0;
                #endif

                float3 localPosition = v.vertex.xyz * _ProbeSize;
                float3 gridPosition = data.xyz * _GridSize + _GridPosition;
                float3 worldPosition = gridPosition + localPosition;
                float3 worldNormal = v.normal;

                // float3 ndotl = saturate(dot(worldNormal, _WorldSpaceLightPos0.xyz));
                // float3 ambient = ShadeSH9(float4(worldNormal, 1.0f));
                // float3 diffuse = (ndotl * _LightColor0.rgb);

                v2f o;
                o.pos = mul(UNITY_MATRIX_VP, float4(worldPosition, 1.0));
                o.uvs = data + 0.5;
                o.normal = v.normal;
                return o;
            }

            float4 frag(v2f i, uint instanceID : SV_InstanceID) : SV_Target
            {
                #if SHADER_TARGET >= 45
                    float3 data = positionBuffer[instanceID];
                #else
                    float3 data = 0;
                #endif
                
                float3 lpUV = i.uvs;
                float3 normal = normalize(i.normal);
                float3 sampleNormal = normal;
                float4 tex0, tex1, tex2, tex3;
                float3 L0, L1x, L1y, L1z;
                float4 mask;

                if(_EmptyProbes)
                {
                    float nv = dot(normal, UNITY_MATRIX_V[2]) * 0.3 + 0.7;
                    float3 color = float3(0.9, 0.7, 0.0) * nv;
                    return float4(color, 1.0);  
                }
                
                tex0 = _VolumePreview0.Sample(sampler_VolumePreview0, lpUV);
                tex1 = _VolumePreview1.Sample(sampler_VolumePreview0, lpUV);
                tex2 = _VolumePreview2.Sample(sampler_VolumePreview0, lpUV);
                tex3 = _VolumePreview3.Sample(sampler_VolumePreview0, lpUV);
                mask = _VolumePreviewMask.Sample(sampler_VolumePreview0, lpUV);
                
                #ifdef BAKERY_COMPRESSED_VOLUME
                    L1x = tex1 * 2 - 1;
                    L1y = tex2 * 2 - 1;
                    L1z = tex3 * 2 - 1;
                    #ifdef BAKERY_COMPRESSED_VOLUME_RGBM
                        L0 = tex0.xyz * (tex0.w * 8.0);
                        L0 *= L0;
                    #else
                        L0 = tex0.xyz;
                    #endif
                    L1x *= L0 * 2;
                    L1y *= L0 * 2;
                    L1z *= L0 * 2;
                #else
                    L0 = tex0.xyz;
                    L1x = tex1.xyz;
                    L1y = tex2.xyz;
                    L1z = float3(tex0.w, tex1.w, tex2.w);
                    // RGBA
                    if(_Encoding == 1)
                    {
                        L1x = (L1x * 2 - 1) * L0 * 2;
                        L1y = (L1y * 2 - 1) * L0 * 2;
                        L1z = (L1z * 2 - 1) * L0 * 2;
                    }
                #endif
                
                
                float3 color;
                color.r = shEvaluateDiffuseL1Geomerics(L0.r, float3(L1x.r, L1y.r, L1z.r), sampleNormal);
                color.g = shEvaluateDiffuseL1Geomerics(L0.g, float3(L1x.g, L1y.g, L1z.g), sampleNormal);
                color.b = shEvaluateDiffuseL1Geomerics(L0.b, float3(L1x.b, L1y.b, L1z.b), sampleNormal);

                float shadowMask = 1.0;

                if(_ShadowMask == 0)
                {
                    shadowMask = 0;
                }
                else if(_ShadowMask == 1)
                {
                    shadowMask = mask.r;        
                }
                else if(_ShadowMask == 2)
                {
                    shadowMask = mask.a;           
                }
                
                // float directShadow = _Masked ? shadowMask : 1.0;
                // directShadow = _ShowIndirectOnly ? 0 : directShadow;
                //
                
                float3 ndotl = saturate(dot(normal, _WorldSpaceLightPos0.xyz));
                color += ndotl * shadowMask * _LightColor0.rgb;

                return float4(color * _ProbeMul, 1.0);
            }
            ENDCG
        }
    }
}
