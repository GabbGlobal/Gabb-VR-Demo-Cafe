Shader "Bakery/Example shader with Alpha Meta Pass"
{
    Properties
    {
        _MainTex ("Albedo", 2D) = "white" { }
        _BumpMap ("Normal map", 2D) = "bump" { }
        _MyMask ("My alpha mask", 2D) = "white" {}
        [HideInInspector] BAKERY_META_ALPHA_ENABLE ("Enable Bakery alpha meta pass", Float) = 1.0
    }
    SubShader
    {
        Tags {"RenderType"="Transparent"}

        Pass
        {
            CGPROGRAM
            #pragma vertex vs
            #pragma fragment ps
            #include "UnityCG.cginc"

            sampler2D _MainTex, _BumpMap;
            sampler2D _MyMask;

            struct pi
            {
                float4 Position : SV_POSITION;
                float2 TexCoords : TEXCOORD0;
                float2 TexCoords2 : TEXCOORD1;
            };

            void vs(in appdata_full IN, out pi OUT)
            {
                OUT.Position = UnityObjectToClipPos(IN.vertex);
                OUT.TexCoords = IN.texcoord.xy;
                OUT.TexCoords2 = IN.texcoord1.xy * unity_LightmapST.xy + unity_LightmapST.zw;
            }

            float4 ps( in pi IN ) : COLOR
            {
                float4 tex = tex2D(_MainTex, IN.TexCoords);
                float3 lm = DecodeLightmap(UNITY_SAMPLE_TEX2D(unity_Lightmap, IN.TexCoords2));
                tex.rgb *= lm;
                float alpha = tex2D(_MyMask, IN.TexCoords*2);
                clip(alpha-0.5);
                return tex;
            }
            ENDCG
        }

        Pass
        {
            // Alpha map enabled Bakery-specific meta pass

            Name "META_BAKERY"

            Tags {"LightMode"="Meta"}
            Cull Off
            CGPROGRAM

            #include"UnityStandardMeta.cginc"

            // Include Bakery meta pass
            #include "../../BakeryMetaPass.cginc"

            sampler2D _MyMask;

            float4 frag_customMeta (v2f_bakeryMeta i): SV_Target
            {
                UnityMetaInput o;
                UNITY_INITIALIZE_OUTPUT(UnityMetaInput, o);

                // Output custom alpha to Bakery
                if (unity_MetaFragmentControl.w)
                {
                    // Calculate custom alpha
                    float alpha = tex2D(_MyMask, i.uv*2);

                    // Output
                    return alpha;
                }

                // Regular Unity meta pass
                o.Albedo = tex2D(_MainTex, i.uv);
                return UnityMetaFragment(o);
            }

            // Must use vert_bakerymt vertex shader
            #pragma vertex vert_bakerymt
            #pragma fragment frag_customMeta
            ENDCG
        }
    }
}
