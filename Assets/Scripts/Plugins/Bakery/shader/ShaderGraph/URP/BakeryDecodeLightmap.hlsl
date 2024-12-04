//#define NOURP
//#define SURFACE

#if defined(SURFACE) && defined(SHADER_TARGET_SURFACE_ANALYSIS)
#define SURFACEANALYSIS
#endif

// Declare URP stuff if not in URP
#ifdef NOURP
#define LIGHTMAP_RGBM_MAX_GAMMA     5.0f       // NB: Must match value in RGBMRanges.h
#define LIGHTMAP_RGBM_MAX_LINEAR    34.493242f // LIGHTMAP_RGBM_MAX_GAMMA ^ 2.2

#ifdef UNITY_LIGHTMAP_RGBM_ENCODING
    #ifdef UNITY_COLORSPACE_GAMMA
        #define LIGHTMAP_HDR_MULTIPLIER LIGHTMAP_RGBM_MAX_GAMMA
        #define LIGHTMAP_HDR_EXPONENT   1.0f   // Not used in gamma color space
    #else
        #define LIGHTMAP_HDR_MULTIPLIER LIGHTMAP_RGBM_MAX_LINEAR
        #define LIGHTMAP_HDR_EXPONENT   2.2f
    #endif
#elif defined(UNITY_LIGHTMAP_DLDR_ENCODING)
    #ifdef UNITY_COLORSPACE_GAMMA
        #define LIGHTMAP_HDR_MULTIPLIER 2.0f
    #else
        #define LIGHTMAP_HDR_MULTIPLIER 4.59f // 2.0 ^ 2.2
    #endif
    #define LIGHTMAP_HDR_EXPONENT 0.0f
#else // (UNITY_LIGHTMAP_FULL_HDR)
    #define LIGHTMAP_HDR_MULTIPLIER 1.0f
    #define LIGHTMAP_HDR_EXPONENT 1.0f
#endif
#endif

#define BAKERY_INV_PI        0.31830988618f

#ifdef SURFACE
sampler2D _RNM0, _RNM1, _RNM2;
float4 SAMPLERNM(sampler2D t, float2 uv)
{
    return tex2D(t, uv);
}
#else
Texture2D _RNM0, _RNM1, _RNM2;
SamplerState sampler_RNM1;
float4 SAMPLERNM(Texture2D t, float2 uv)
{
    return t.Sample(sampler_RNM1, uv);
}
#endif

#ifndef SURFACEANALYSIS
Texture3D _Volume0, _Volume1, _Volume2, _VolumeMask;
#ifdef BAKERY_COMPRESSED_VOLUME
    Texture3D _Volume3;
#endif
SamplerState sampler_Volume0;
SamplerState sampler_VolumeMask;
#endif

float4x4 _VolumeMatrix, _GlobalVolumeMatrix;
float3 _VolumeMin, _VolumeInvSize;
float3 _GlobalVolumeMin, _GlobalVolumeInvSize;

//#ifdef BAKERY_VOLROTATIONY
float2 _GlobalVolumeRY, _VolumeRY;
//#endif

#if defined(BAKERY_MODE_NONE) || defined(BAKERY_MODE_RNM) || defined(BAKERY_MODE_SH) || defined(BAKERY_MODE_MONOSH) || defined(BAKERY_MODE_VERTEXBAKED) || defined(BAKERY_MODE_VOLUME) || defined(BAKERY_MODE_NONLINEARLIGHTPROBE)
#define BAKERY_NOSPECULARWEIGHTING
#endif


void LightmapUV_float(float2 uv, out float2 lightmapUV)
{
    lightmapUV = uv * unity_LightmapST.xy + unity_LightmapST.zw;
}

#ifdef NOURP
float3 DecodeHDREnvironment(float4 encodedIrradiance, float4 decodeInstructions)
{
    // Take into account texture alpha if decodeInstructions.w is true(the alpha value affects the RGB channels)
    float alpha = max(decodeInstructions.w * (encodedIrradiance.a - 1.0) + 1.0, 0.0);

    // If Linear mode is not supported we can skip exponent part
    return (decodeInstructions.x * pow(abs(alpha), decodeInstructions.y)) * encodedIrradiance.rgb;
}
#endif

void DecodeLightmap2(float4 lightmap, out float3 result)
{

#ifdef UNITY_LIGHTMAP_FULL_HDR
    float4 decodeInstructions = float4(0.0, 0.0, 0.0, 0.0); // Never used but needed for the interface since it supports gamma lightmaps
#else
    #if defined(UNITY_LIGHTMAP_RGBM_ENCODING)
        float4 decodeInstructions = float4(34.493242, 2.2, 0.0, 0.0); // range^2.2 = 5^2.2, gamma = 2.2
    #else
        float4 decodeInstructions = float4(2.0, 2.2, 0.0, 0.0); // range = 2.0^2.2 = 4.59
    #endif
#endif

#ifdef NOURP
    result = DecodeLightmap(lightmap);
#else
    result = DecodeLightmap(lightmap, decodeInstructions);
#endif
}

void SampleRNM0_float(float2 lightmapUV, out float3 result)
{
    DecodeLightmap2(SAMPLERNM(_RNM0, lightmapUV), result);
}

void SampleRNM1_float(float2 lightmapUV, out float3 result)
{
    DecodeLightmap2(SAMPLERNM(_RNM1, lightmapUV), result);
}

void SampleRNM2_float(float2 lightmapUV, out float3 result)
{
    DecodeLightmap2(SAMPLERNM(_RNM2, lightmapUV), result);
}

void SampleL1x_float(float2 lightmapUV, out float3 result)
{
    result = SAMPLERNM(_RNM0, lightmapUV);
}

void SampleL1y_float(float2 lightmapUV, out float3 result)
{
    result = SAMPLERNM(_RNM1, lightmapUV);
}

void SampleL1z_float(float2 lightmapUV, out float3 result)
{
    result = SAMPLERNM(_RNM2, lightmapUV);
}

// Following two functions are copied from the original Unity standard shader for compatibility
// -----
#ifndef SURFACE
float SmoothnessToPerceptualRoughness(float smoothness)
{
    return (1 - smoothness);
}
#endif
float BakeryPerceptualRoughnessToRoughness(float perceptualRoughness)
{
    return perceptualRoughness * perceptualRoughness;
}

#ifndef SURFACE
float GGXTerm (half NdotH, half roughness)
{
    half a2 = roughness * roughness;
    half d = (NdotH * a2 - NdotH) * NdotH + 1.0f; // 2 mad
    return BAKERY_INV_PI * a2 / (d * d + 1e-7f); // This function is not intended to be running on Mobile,
                                            // therefore epsilon is smaller than what can be represented by half
}
#endif

#ifndef NOURP
inline half3 DecodeDirectionalLightmap (half3 color, half4 dirTex, half3 normalWorld)
{
    // In directional (non-specular) mode Enlighten bakes dominant light direction
    // in a way, that using it for half Lambert and then dividing by a "rebalancing coefficient"
    // gives a result close to plain diffuse response lightmaps, but normalmapped.

    // Note that dir is not unit length on purpose. Its length is "directionality", like
    // for the directional specular lightmaps.

    half halfLambert = dot(normalWorld, dirTex.xyz - 0.5) + 0.5;

    return color * halfLambert / max(1e-4h, dirTex.w);
}
#endif

#define UNITY_SPECCUBE_LOD_STEPS 6

float BakeryPerceptualRoughnessToMipmapLevel(float perceptualRoughness, uint mipMapCount)
{
    perceptualRoughness = perceptualRoughness * (1.7 - 0.7 * perceptualRoughness);

    return perceptualRoughness * mipMapCount;
}

float BakeryPerceptualRoughnessToMipmapLevel(float perceptualRoughness)
{
    return BakeryPerceptualRoughnessToMipmapLevel(perceptualRoughness, UNITY_SPECCUBE_LOD_STEPS);
}

#define unity_ColorSpaceDielectricSpec half4(0.04, 0.04, 0.04, 1.0 - 0.04) // standard dielectric reflectivity coef at incident angle (= 4%)

// -----

void DirectionalSpecular_float(float2 lightmapUV, float3 normalWorld, float3 viewDir, float smoothness, out float3 color)
{
#ifdef LIGHTMAP_ON
#ifdef DIRLIGHTMAP_COMBINED
#ifdef NOURP
    float3 lmColor = DecodeLightmap(unity_Lightmap.Sample(samplerunity_Lightmap, lightmapUV));
#else
    float3 lmColor = DecodeLightmap(unity_Lightmap.Sample(samplerunity_Lightmap, lightmapUV), half4(LIGHTMAP_HDR_MULTIPLIER, LIGHTMAP_HDR_EXPONENT, 0.0h, 0.0h));
#endif
    float3 lmDir = unity_LightmapInd.Sample(samplerunity_Lightmap, lightmapUV) * 2 - 1;
    float3 halfDir = normalize(normalize(lmDir) + viewDir);
    float nh = saturate(dot(normalWorld, halfDir));
    float perceptualRoughness = SmoothnessToPerceptualRoughness(smoothness);
    float roughness = BakeryPerceptualRoughnessToRoughness(perceptualRoughness);
    float spec = GGXTerm(nh, roughness);
    color = lmColor * spec * 0.99999;
    return;
#endif
#endif
    color = 0;
}

void DirectionalDiffuse_float(float2 lightmapUV, float3 normalWorld, out float3 color)
{
#ifdef LIGHTMAP_ON
#ifdef DIRLIGHTMAP_COMBINED
#ifdef NOURP
    float3 lmColor = DecodeLightmap(unity_Lightmap.Sample(samplerunity_Lightmap, lightmapUV));
#else
    float3 lmColor = DecodeLightmap(unity_Lightmap.Sample(samplerunity_Lightmap, lightmapUV), half4(LIGHTMAP_HDR_MULTIPLIER, LIGHTMAP_HDR_EXPONENT, 0.0h, 0.0h));
#endif
    float4 lmDir = unity_LightmapInd.Sample(samplerunity_Lightmap, lightmapUV);
    color = DecodeDirectionalLightmap(lmColor, lmDir, normalWorld);
#endif
#endif
    color = 0;
}

void Specular_float(float3 lightDir, float3 normalWorld, float3 viewDir, float smoothness, out float specular)
{
    float3 halfDir = normalize(lightDir + viewDir);
    float nh = saturate(dot(normalWorld, halfDir));
    float perceptualRoughness = SmoothnessToPerceptualRoughness(smoothness);
    float roughness = BakeryPerceptualRoughnessToRoughness(perceptualRoughness);
    specular = GGXTerm(nh, roughness);
}

float shEvaluateDiffuseL1Geomerics(float L0, float3 L1, float3 n)
{
    // average energy
    float R0 = L0;

    // avg direction of incoming light
    float3 R1 = 0.5f * L1;

    // directional brightness
    float lenR1 = length(R1);

    // linear angle between normal and direction 0-1
    //float q = 0.5f * (1.0f + dot(R1 / lenR1, n));
    //float q = dot(R1 / lenR1, n) * 0.5 + 0.5;
    float q = dot(normalize(R1), n) * 0.5 + 0.5;

    // power for q
    // lerps from 1 (linear) to 3 (cubic) based on directionality
    float p = 1.0f + 2.0f * lenR1 / R0;

    // dynamic range constant
    // should vary between 4 (highly directional) and 0 (ambient)
    float a = (1.0f - lenR1 / R0) / (1.0f + lenR1 / R0);

    return R0 * (a + (1.0f - a) * (p + 1.0f) * pow(q, p));
}

void NonLinearLightProbe_float(float3 normalWorld, out float3 color)
{
    float3 L0 = float3(unity_SHAr.w, unity_SHAg.w, unity_SHAb.w);
    color.r = shEvaluateDiffuseL1Geomerics(L0.r, unity_SHAr.xyz, normalWorld);
    color.g = shEvaluateDiffuseL1Geomerics(L0.g, unity_SHAg.xyz, normalWorld);
    color.b = shEvaluateDiffuseL1Geomerics(L0.b, unity_SHAb.xyz, normalWorld);
}

void BakerySH_float(float3 L0, float3 normalWorld, float2 lightmapUV, out float3 sh)
{
#ifdef LIGHTMAP_ON
    float3 nL1x = SAMPLERNM(_RNM0, lightmapUV) * 2 - 1;
    float3 nL1y = SAMPLERNM(_RNM1, lightmapUV) * 2 - 1;
    float3 nL1z = SAMPLERNM(_RNM2, lightmapUV) * 2 - 1;
    float3 L1x = nL1x * L0 * 2;
    float3 L1y = nL1y * L0 * 2;
    float3 L1z = nL1z * L0 * 2;

    float lumaL0 = dot(L0, 1);
    float lumaL1x = dot(L1x, 1);
    float lumaL1y = dot(L1y, 1);
    float lumaL1z = dot(L1z, 1);
    float lumaSH = shEvaluateDiffuseL1Geomerics(lumaL0, float3(lumaL1x, lumaL1y, lumaL1z), normalWorld);

    sh = L0 + normalWorld.x * L1x + normalWorld.y * L1y + normalWorld.z * L1z;
    float regularLumaSH = dot(sh, 1);

    sh *= lerp(1, lumaSH / regularLumaSH, saturate(regularLumaSH*16));

    sh = max(sh, 0);
    return;
#endif
    NonLinearLightProbe_float(normalWorld, sh);
}

void BakeryMonoSH_float(float3 normalWorld, float2 lightmapUV, out float3 sh)
{
#ifdef LIGHTMAP_ON
#ifdef DIRLIGHTMAP_COMBINED
#ifdef NOURP
    float3 L0 = DecodeLightmap(unity_Lightmap.Sample(samplerunity_Lightmap, lightmapUV));
#else
    float3 L0 = DecodeLightmap(unity_Lightmap.Sample(samplerunity_Lightmap, lightmapUV), half4(LIGHTMAP_HDR_MULTIPLIER, LIGHTMAP_HDR_EXPONENT, 0.0h, 0.0h));
#endif
    float3 dominantDir = unity_LightmapInd.Sample(samplerunity_Lightmap, lightmapUV);

    float3 nL1 = dominantDir * 2 - 1;
    float3 L1x = nL1.x * L0 * 2;
    float3 L1y = nL1.y * L0 * 2;
    float3 L1z = nL1.z * L0 * 2;

    float lumaL0 = dot(L0, 1);
    float lumaL1x = dot(L1x, 1);
    float lumaL1y = dot(L1y, 1);
    float lumaL1z = dot(L1z, 1);
    float lumaSH = shEvaluateDiffuseL1Geomerics(lumaL0, float3(lumaL1x, lumaL1y, lumaL1z), normalWorld);

    sh = L0 + normalWorld.x * L1x + normalWorld.y * L1y + normalWorld.z * L1z;
    float regularLumaSH = dot(sh, 1);

    sh *= lerp(1, lumaSH / regularLumaSH, saturate(regularLumaSH*16));

    sh = max(sh, 0);
    return;
#endif
#endif
    //sh = 0;
    NonLinearLightProbe_float(normalWorld, sh);
}

void BakerySpecSHFull_float(float3 L0, float3 normalWorld, float2 lightmapUV, float3 viewDir, float smoothness, float3 albedo, float metalness,
                                                                                                    out float3 diffuseSH, out float3 specularSH)
{
#ifdef LIGHTMAP_ON
    float3 nL1x = SAMPLERNM(_RNM0, lightmapUV) * 2 - 1;
    float3 nL1y = SAMPLERNM(_RNM1, lightmapUV) * 2 - 1;
    float3 nL1z = SAMPLERNM(_RNM2, lightmapUV) * 2 - 1;
    float3 L1x = nL1x * L0 * 2;
    float3 L1y = nL1y * L0 * 2;
    float3 L1z = nL1z * L0 * 2;

    float lumaL0 = dot(L0, 1);
    float lumaL1x = dot(L1x, 1);
    float lumaL1y = dot(L1y, 1);
    float lumaL1z = dot(L1z, 1);
    float lumaSH = shEvaluateDiffuseL1Geomerics(lumaL0, float3(lumaL1x, lumaL1y, lumaL1z), normalWorld);

    diffuseSH = L0 + normalWorld.x * L1x + normalWorld.y * L1y + normalWorld.z * L1z;
    float regularLumaSH = dot(diffuseSH, 1);

    diffuseSH *= lerp(1, lumaSH / regularLumaSH, saturate(regularLumaSH*16));
    diffuseSH = max(diffuseSH, 0.0);

    const float3 lumaConv = float3(0.2125f, 0.7154f, 0.0721f);

    float3 dominantDir = float3(dot(nL1x, lumaConv), dot(nL1y, lumaConv), dot(nL1z, lumaConv));
    float focus = saturate(length(dominantDir));
    float3 halfDir = normalize(normalize(dominantDir) - -viewDir);
    float nh = saturate(dot(normalWorld, halfDir));
    float perceptualRoughness = SmoothnessToPerceptualRoughness(smoothness);
    float roughness = BakeryPerceptualRoughnessToRoughness(perceptualRoughness);
    float spec = GGXTerm(nh, roughness);

    specularSH = L0 + dominantDir.x * L1x + dominantDir.y * L1y + dominantDir.z * L1z;

    specularSH = max(spec * specularSH, 0.0);

#ifndef BAKERY_NOSPECULARWEIGHTING
    // Convert metalness to specular and "oneMinusReflectivity"
    float3 specularColor = lerp(float3(0.04, 0.04, 0.04), albedo, metalness);
    float oneMinusDielectricSpec = 1.0 - 0.04;
    float oneMinusReflectivity = oneMinusDielectricSpec - metalness * oneMinusDielectricSpec;

    // Directly apply fresnel and smoothness-dependent grazing term
    float nv = 1.0f - saturate(dot(normalWorld, viewDir));
    float nv2 = nv * nv;
    float fresnel = nv * nv2 * nv2;

    float reflectivity = max(max(specularColor.r, specularColor.g), specularColor.b); // hack, but consistent with Unity code
    float grazingTerm = saturate(smoothness + reflectivity);
    float3 fresnel3 = lerp(specularColor, float3(grazingTerm, grazingTerm, grazingTerm), fresnel);

    diffuseSH *= oneMinusReflectivity; // no baked GI override: modify diffuse
    specularSH *= fresnel3;

    diffuseSH = max(diffuseSH, 0);
    specularSH = max(specularSH, 0);
#endif
    return;
#endif
    specularSH = 0;
    NonLinearLightProbe_float(normalWorld, diffuseSH);
}

void BakerySpecMonoSHFull_float(float3 normalWorld, float2 lightmapUV, float3 viewDir, float smoothness, float3 albedo, float metalness,
                                                                                                    out float3 diffuseSH, out float3 specularSH)
{
#ifdef LIGHTMAP_ON
#ifdef DIRLIGHTMAP_COMBINED
#ifdef NOURP
    float3 L0 = DecodeLightmap(unity_Lightmap.Sample(samplerunity_Lightmap, lightmapUV));
#else
    float3 L0 = DecodeLightmap(unity_Lightmap.Sample(samplerunity_Lightmap, lightmapUV), half4(LIGHTMAP_HDR_MULTIPLIER, LIGHTMAP_HDR_EXPONENT, 0.0h, 0.0h));
#endif
    float3 dominantDir = unity_LightmapInd.Sample(samplerunity_Lightmap, lightmapUV);

    float3 nL1 = dominantDir * 2 - 1;
    float3 L1x = nL1.x * L0 * 2;
    float3 L1y = nL1.y * L0 * 2;
    float3 L1z = nL1.z * L0 * 2;

    float lumaL0 = dot(L0, 1);
    float lumaL1x = dot(L1x, 1);
    float lumaL1y = dot(L1y, 1);
    float lumaL1z = dot(L1z, 1);
    float lumaSH = shEvaluateDiffuseL1Geomerics(lumaL0, float3(lumaL1x, lumaL1y, lumaL1z), normalWorld);

    diffuseSH = L0 + normalWorld.x * L1x + normalWorld.y * L1y + normalWorld.z * L1z;
    float regularLumaSH = dot(diffuseSH, 1);

    diffuseSH *= lerp(1, lumaSH / regularLumaSH, saturate(regularLumaSH*16));
    diffuseSH = max(diffuseSH, 0.0);

    const float3 lumaConv = float3(0.2125f, 0.7154f, 0.0721f);

    dominantDir = nL1;
    float focus = saturate(length(dominantDir));
    float3 halfDir = normalize(normalize(dominantDir) - -viewDir);
    float nh = saturate(dot(normalWorld, halfDir));
    float perceptualRoughness = SmoothnessToPerceptualRoughness(smoothness);
    float roughness = BakeryPerceptualRoughnessToRoughness(perceptualRoughness);
    float spec = GGXTerm(nh, roughness);

    specularSH = L0 + dominantDir.x * L1x + dominantDir.y * L1y + dominantDir.z * L1z;

    specularSH = max(spec * specularSH, 0.0);

#ifndef BAKERY_NOSPECULARWEIGHTING
    // Convert metalness to specular and "oneMinusReflectivity"
    float3 specularColor = lerp(float3(0.04, 0.04, 0.04), albedo, metalness);
    float oneMinusDielectricSpec = 1.0 - 0.04;
    float oneMinusReflectivity = oneMinusDielectricSpec - metalness * oneMinusDielectricSpec;

    // Directly apply fresnel and smoothness-dependent grazing term
    float nv = 1.0f - saturate(dot(normalWorld, viewDir));
    float nv2 = nv * nv;
    float fresnel = nv * nv2 * nv2;

    float reflectivity = max(max(specularColor.r, specularColor.g), specularColor.b); // hack, but consistent with Unity code
    float grazingTerm = saturate(smoothness + reflectivity);
    float3 fresnel3 = lerp(specularColor, float3(grazingTerm, grazingTerm, grazingTerm), fresnel);

    diffuseSH *= oneMinusReflectivity; // no baked GI override: modify diffuse
    specularSH *= fresnel3;

    diffuseSH = max(diffuseSH, 0);
    specularSH = max(specularSH, 0);
#endif
    return;
#endif
#endif
    diffuseSH = 0;
    specularSH = 0;
    NonLinearLightProbe_float(normalWorld, diffuseSH);
}

void BakerySpecMonoSHFullVertex_float(float3 normalWorld, float3 L0, float3 dominantDir, float3 viewDir, float smoothness, float3 albedo, float metalness,
                                                                                                    out float3 diffuseSH, out float3 specularSH)
{
    float3 nL1 = dominantDir;
    float3 L1x = nL1.x * L0 * 2;
    float3 L1y = nL1.y * L0 * 2;
    float3 L1z = nL1.z * L0 * 2;

    float lumaL0 = dot(L0, 1);
    float lumaL1x = dot(L1x, 1);
    float lumaL1y = dot(L1y, 1);
    float lumaL1z = dot(L1z, 1);
    float lumaSH = shEvaluateDiffuseL1Geomerics(lumaL0, float3(lumaL1x, lumaL1y, lumaL1z), normalWorld);

    diffuseSH = L0 + normalWorld.x * L1x + normalWorld.y * L1y + normalWorld.z * L1z;
    float regularLumaSH = dot(diffuseSH, 1);

    diffuseSH *= lerp(1, lumaSH / regularLumaSH, saturate(regularLumaSH*16));
    diffuseSH = max(diffuseSH, 0.0);

    const float3 lumaConv = float3(0.2125f, 0.7154f, 0.0721f);

    dominantDir = nL1;
    float focus = saturate(length(dominantDir));
    float3 halfDir = normalize(normalize(dominantDir) - -viewDir);
    float nh = saturate(dot(normalWorld, halfDir));
    float perceptualRoughness = SmoothnessToPerceptualRoughness(smoothness);
    float roughness = BakeryPerceptualRoughnessToRoughness(perceptualRoughness);
    float spec = GGXTerm(nh, roughness);

    specularSH = L0 + dominantDir.x * L1x + dominantDir.y * L1y + dominantDir.z * L1z;

    specularSH = max(spec * specularSH, 0.0);

#ifndef BAKERY_NOSPECULARWEIGHTING
    // Convert metalness to specular and "oneMinusReflectivity"
    float3 specularColor = lerp(float3(0.04, 0.04, 0.04), albedo, metalness);
    float oneMinusDielectricSpec = 1.0 - 0.04;
    float oneMinusReflectivity = oneMinusDielectricSpec - metalness * oneMinusDielectricSpec;

    // Directly apply fresnel and smoothness-dependent grazing term
    float nv = 1.0f - saturate(dot(normalWorld, viewDir));
    float nv2 = nv * nv;
    float fresnel = nv * nv2 * nv2;

    float reflectivity = max(max(specularColor.r, specularColor.g), specularColor.b); // hack, but consistent with Unity code
    float grazingTerm = saturate(smoothness + reflectivity);
    float3 fresnel3 = lerp(specularColor, float3(grazingTerm, grazingTerm, grazingTerm), fresnel);

    diffuseSH *= oneMinusReflectivity; // no baked GI override: modify diffuse
    specularSH *= fresnel3;

    diffuseSH = max(diffuseSH, 0);
    specularSH = max(specularSH, 0);
#endif
}

void BakeryVolume(float3 lpUV, float3 normalWorld, out float3 sh)
{
#ifdef SURFACEANALYSIS
        sh = 0;
#else
    #ifdef BAKERY_COMPRESSED_VOLUME
        float4 tex0, tex1, tex2, tex3;
        float3 L0, L1x, L1y, L1z;
        tex0 = _Volume0.Sample(sampler_Volume0, lpUV);
        tex1 = _Volume1.Sample(sampler_Volume0, lpUV) * 2 - 1;
        tex2 = _Volume2.Sample(sampler_Volume0, lpUV) * 2 - 1;
        tex3 = _Volume3.Sample(sampler_Volume0, lpUV) * 2 - 1;
        L0 = tex0.xyz;
        L1x = tex1.xyz * L0 * 2;
        L1y = tex2.xyz * L0 * 2;
        L1z = tex3.xyz * L0 * 2;
    #else
        float4 tex0, tex1, tex2;
        float3 L0, L1x, L1y, L1z;
        tex0 = _Volume0.Sample(sampler_Volume0, lpUV);
        tex1 = _Volume1.Sample(sampler_Volume0, lpUV);
        tex2 = _Volume2.Sample(sampler_Volume0, lpUV);
        L0 = tex0.xyz;
        L1x = tex1.xyz;
        L1y = tex2.xyz;
        L1z = float3(tex0.w, tex1.w, tex2.w);
    #endif
    sh.r = shEvaluateDiffuseL1Geomerics(L0.r, float3(L1x.r, L1y.r, L1z.r), normalWorld);
    sh.g = shEvaluateDiffuseL1Geomerics(L0.g, float3(L1x.g, L1y.g, L1z.g), normalWorld);
    sh.b = shEvaluateDiffuseL1Geomerics(L0.b, float3(L1x.b, L1y.b, L1z.b), normalWorld);
    sh = max(sh, 0);
#endif
}

float3 VolumeCoords(float3 posWorld, float supportBakedVolumeRotation)
{
    bool isGlobal = dot(abs(_VolumeInvSize),1) == 0;
    float3 lpUV = posWorld - (isGlobal ? _GlobalVolumeMin : _VolumeMin);
//#ifdef BAKERY_VOLROTATIONY
    if (supportBakedVolumeRotation > 0)
    {
        float2 sc = (isGlobal ? _GlobalVolumeRY : _VolumeRY);
        lpUV.xz = mul(float2x2(sc.y, -sc.x, sc.x, sc.y), lpUV.xz);
    }
//#endif
    lpUV *= (isGlobal ? _GlobalVolumeInvSize : _VolumeInvSize);
    return lpUV;
}

void BakeryVolume_float(float3 posWorld, float3 normalWorld, float supportBakedVolumeRotation, out float3 sh)
{
    float3 lpUV = VolumeCoords(posWorld, supportBakedVolumeRotation);
    BakeryVolume(lpUV, normalWorld, sh);
}

void BakeryVolumeRotatable_float(float3 posWorld, float3 normalWorld, out float3 sh)
{
    bool isGlobal = dot(abs(_VolumeInvSize),1) == 0;

    float4x4 volMatrix = (isGlobal ? _GlobalVolumeMatrix : _VolumeMatrix);
    float3 volInvSize = (isGlobal ? _GlobalVolumeInvSize : _VolumeInvSize);
    float3 lpUV = mul(volMatrix, float4(posWorld,1)).xyz * volInvSize + 0.5f;
    normalWorld = mul((float3x3)volMatrix, normalWorld);

    BakeryVolume(lpUV, normalWorld, sh);
}

void BakeryVolumeSpec_float(float3 posWorld, float3 normalWorld, float3 viewDir, float smoothness, float3 albedo, float metalness, float supportBakedVolumeRotation,
                                                                                                    out float3 diffuseSH, out float3 specularSH)
{
#ifdef SURFACEANALYSIS
        diffuseSH = specularSH = 0;
#else
    float3 lpUV = VolumeCoords(posWorld, supportBakedVolumeRotation);

    #ifdef BAKERY_COMPRESSED_VOLUME
        float4 tex0, tex1, tex2, tex3;
        float3 L0, L1x, L1y, L1z;
        tex0 = _Volume0.Sample(sampler_Volume0, lpUV);
        tex1 = _Volume1.Sample(sampler_Volume0, lpUV) * 2 - 1;
        tex2 = _Volume2.Sample(sampler_Volume0, lpUV) * 2 - 1;
        tex3 = _Volume3.Sample(sampler_Volume0, lpUV) * 2 - 1;
        L0 = tex0.xyz;
        L1x = tex1.xyz * L0 * 2;
        L1y = tex2.xyz * L0 * 2;
        L1z = tex3.xyz * L0 * 2;
    #else
        float4 tex0, tex1, tex2;
        float3 L0, L1x, L1y, L1z;
        tex0 = _Volume0.Sample(sampler_Volume0, lpUV);
        tex1 = _Volume1.Sample(sampler_Volume0, lpUV);
        tex2 = _Volume2.Sample(sampler_Volume0, lpUV);
        L0 = tex0.xyz;
        L1x = tex1.xyz;
        L1y = tex2.xyz;
        L1z = float3(tex0.w, tex1.w, tex2.w);
    #endif
    diffuseSH.r = shEvaluateDiffuseL1Geomerics(L0.r, float3(L1x.r, L1y.r, L1z.r), normalWorld);
    diffuseSH.g = shEvaluateDiffuseL1Geomerics(L0.g, float3(L1x.g, L1y.g, L1z.g), normalWorld);
    diffuseSH.b = shEvaluateDiffuseL1Geomerics(L0.b, float3(L1x.b, L1y.b, L1z.b), normalWorld);
    diffuseSH = max(diffuseSH, 0);

    const float3 lumaConv = float3(0.2125f, 0.7154f, 0.0721f);

    float3 nL1x = L1x / L0;
    float3 nL1y = L1y / L0;
    float3 nL1z = L1z / L0;
    float3 dominantDir = float3(dot(nL1x, lumaConv), dot(nL1y, lumaConv), dot(nL1z, lumaConv));
    float3 halfDir = normalize(normalize(dominantDir) - -viewDir);
    float nh = saturate(dot(normalWorld, halfDir));
    float perceptualRoughness = SmoothnessToPerceptualRoughness(smoothness);
    float roughness = BakeryPerceptualRoughnessToRoughness(perceptualRoughness);
    float spec = GGXTerm(nh, roughness);

    specularSH = L0 + dominantDir.x * L1x + dominantDir.y * L1y + dominantDir.z * L1z;

    specularSH = max(spec * specularSH, 0.0);

#ifndef BAKERY_NOSPECULARWEIGHTING
    // Convert metalness to specular and "oneMinusReflectivity"
    float3 specularColor = lerp(float3(0.04, 0.04, 0.04), albedo, metalness);
    float oneMinusDielectricSpec = 1.0 - 0.04;
    float oneMinusReflectivity = oneMinusDielectricSpec - metalness * oneMinusDielectricSpec;

    // Directly apply fresnel and smoothness-dependent grazing term
    float nv = 1.0f - saturate(dot(normalWorld, viewDir));
    float nv2 = nv * nv;
    float fresnel = nv * nv2 * nv2;

    float reflectivity = max(max(specularColor.r, specularColor.g), specularColor.b); // hack, but consistent with Unity code
    float grazingTerm = saturate(smoothness + reflectivity);
    float3 fresnel3 = lerp(specularColor, float3(grazingTerm, grazingTerm, grazingTerm), fresnel);

    diffuseSH *= oneMinusReflectivity; // no baked GI override: modify diffuse
    specularSH *= fresnel3;

    diffuseSH = max(diffuseSH, 0);
    specularSH = max(specularSH, 0);
#endif
#endif
}

void URPMainLightDiffuse_float(float3 normalWorld, float3 albedo, out float3 diffuseLight)
{
    #ifndef UNIVERSAL_LIGHTING_INCLUDED
        float3 direction = float3(0.5, 0.5, 1);
        float3 color = 1;
    #else
        Light mainLight = GetMainLight();
        float3 direction = mainLight.direction;
        float3 color = mainLight.color;
    #endif

    diffuseLight = saturate(dot(normalWorld, direction)) * albedo * color;
}

void VolumeShadowmaskA_float(float3 posWorld, float supportBakedVolumeRotation, out float shadowmask)
{
#ifdef SURFACEANALYSIS
    shadowmask = 0;
#else
    float3 lpUV = VolumeCoords(posWorld, supportBakedVolumeRotation);
    shadowmask = _VolumeMask.Sample(sampler_VolumeMask, lpUV).a;
#endif
}

void SmoothnessToMip_float(float smoothness, out float mip)
{
    float pr = SmoothnessToPerceptualRoughness(smoothness);
    mip = BakeryPerceptualRoughnessToMipmapLevel(pr);
}

void WeightReflection_float(float smoothness, float metallic, float occlusion,
                                     float3 baseColor, float3 normal, float3 viewDir, float3 reflection,
                                     out float3 newReflection)
{
    half perceptualRoughness = SmoothnessToPerceptualRoughness(smoothness);
    half roughness = BakeryPerceptualRoughnessToRoughness(perceptualRoughness);
    half surfaceReduction = 1.0 / (roughness*roughness + 1.0);

    float3 pSpecular = lerp(unity_ColorSpaceDielectricSpec.rgb, baseColor, metallic);
    //baseColor = lerp(baseColor, 0, metallic);

    half reflectivity = max(max(pSpecular.r, pSpecular.g), pSpecular.b);
    half grazingTerm = saturate(smoothness + reflectivity);

    surfaceReduction *= occlusion;

    float3 pNdotV = saturate(dot(normal, viewDir));

    float fresnel = 1 - pNdotV;
    float t2 = fresnel * fresnel;
    fresnel *= t2 * t2;

    newReflection = surfaceReduction * reflection * lerp(pSpecular, grazingTerm, fresnel);
}

void GetReflectionProjected_float(float3 worldPos, float3 viewDir, float3 normal, float lod, float smoothness, out float3 reflection)
{
    float3 reflDir = normalize(reflect(-viewDir, normal));
    float3 specCol = 0;

    #ifdef _REFLECTION_PROBE_BOX_PROJECTION
    #ifdef NOURP
        if (unity_SpecCube0_ProbePosition.w > 0.0f)
        {
            float3 factors = ((reflDir > 0 ? unity_SpecCube0_BoxMax.xyz : unity_SpecCube0_BoxMin.xyz) - worldPos) / reflDir;
            float scalar = min(min(factors.x, factors.y), factors.z);
            reflDir = reflDir * scalar + (worldPos - unity_SpecCube0_ProbePosition.xyz);
        }
    #endif
    #endif

#ifdef NOURP
    #ifdef SURFACEANALYSIS
        float4 sampleRefl = 0;
    #else
        float4 sampleRefl = unity_SpecCube0.Sample(samplerunity_SpecCube0, reflDir, lod);
    #endif
#else
    //float4 sampleRefl = SAMPLE_TEXTURECUBE_LOD(unity_SpecCube0, samplerunity_SpecCube0, reflDir, lod);

    half perceptualRoughness = SmoothnessToPerceptualRoughness(smoothness);
#if UNITY_VERSION >= 202210
    specCol = GlossyEnvironmentReflection(reflDir, worldPos, perceptualRoughness, 1, 0); // omit screenspace UVs for F+ for now
#else
    specCol = GlossyEnvironmentReflection(reflDir, worldPos, perceptualRoughness, 1);
#endif

#endif
    //float3 specCol = DecodeHDREnvironment(sampleRefl, unity_SpecCube0_HDR);

    reflection = specCol;
}

void GetURPShadow_float(float3 worldPos, float3 worldNormal, float3 bakedGI, out float3 modifiedGI, out float shadow)
{
#if defined(UNIVERSAL_SHADOWS_INCLUDED) && defined(LIGHTMAP_SHADOW_MIXING) && !defined(SHADOWS_SHADOWMASK)
    #ifdef _MAIN_LIGHT_SHADOWS_CASCADE
        half cascadeIndex = ComputeCascadeIndex(worldPos);
    #else
        half cascadeIndex = 0;
    #endif

    float4 shadowCoord = mul(_MainLightWorldToShadow[cascadeIndex], float4(worldPos, 1.0));

    ShadowSamplingData shadowSamplingData = GetMainLightShadowSamplingData();
    half4 shadowParams = _MainLightShadowParams;

    shadow =  SampleShadowmap(TEXTURE2D_ARGS(_MainLightShadowmapTexture, sampler_LinearClampCompare), shadowCoord, shadowSamplingData, shadowParams, false);

    float3 lightDir = _MainLightPosition.xyz;
    float3 lightColor = _MainLightColor.rgb;

    half shadowStrength = GetMainLightShadowStrength();
    half contributionTerm = saturate(dot(lightDir, worldNormal));
    half3 lambert = lightColor * contributionTerm;
    half3 estimatedLightContributionMaskedByInverseOfShadow = lambert * (1.0 - shadow);
    half3 subtractedLightmap = bakedGI - estimatedLightContributionMaskedByInverseOfShadow;

    // Subtractive shadows are awful
    // But it is the only thing URP supports ¯\_(ツ)_/¯

    half3 realtimeShadow = max(subtractedLightmap, _SubtractiveShadowColor.xyz);
    realtimeShadow = lerp(bakedGI, realtimeShadow, shadowStrength);

    modifiedGI = min(bakedGI, realtimeShadow);
#else
    modifiedGI = bakedGI; // shadows are undefined in this scene!
    shadow = 1;
#endif
}

void WeightReflection2_float(float smoothness, float metallic, float occlusion,
                                     float3 baseColor, float3 worldPos, float3 normal, float3 viewDir, float3 diffuse, float3 specular, float3 specularColor,
                                     out float3 newDiffuse, out float3 newSpecular)
{
    // Convert metalness to specular and "oneMinusReflectivity"
    float3 specularColorFinal = lerp(float3(0.04, 0.04, 0.04), baseColor, metallic);
    float oneMinusDielectricSpec = 1.0 - 0.04;
    float oneMinusReflectivity = oneMinusDielectricSpec - metallic * oneMinusDielectricSpec;

#ifdef _SPECULAR_SETUP
    specularColorFinal = specularColor;
#endif

    // Directly apply fresnel and smoothness-dependent grazing term
    float nv = 1.0f - saturate(dot(normal, viewDir));
    float nv2 = nv * nv;
    float fresnel = nv * nv2 * nv2;

    float reflectivity = max(max(specularColorFinal.r, specularColorFinal.g), specularColorFinal.b); // hack, but consistent with Unity code

#ifdef _SPECULAR_SETUP
    oneMinusReflectivity = 1.0f - reflectivity;
#endif

    float grazingTerm = saturate(smoothness + reflectivity);
    float3 fresnel3 = lerp(specularColorFinal, float3(grazingTerm, grazingTerm, grazingTerm), fresnel);

    diffuse *= oneMinusReflectivity; // no baked GI override: modify diffuse
    specular *= fresnel3;

    diffuse = max(diffuse, 0);
    specular = max(specular, 0);

    // Subtract shadows if needed
    float shadow;
    GetURPShadow_float(worldPos, normal, diffuse, newDiffuse, shadow);

    newDiffuse = newDiffuse * baseColor * occlusion;
    newSpecular = specular * shadow;
}

void UnpackNormal_float(float4 tex, out float3 normal)
{

#if defined(UNITY_NO_DXT5nm)
    normal = tex.xyz * 2 - 1;
    normal.z = sqrt(1 - saturate(dot(normal.xy, normal.xy))); // do not trust normal map z
#else
    normal = UnpackNormal(tex);
#endif    
}

void FullVolumeLighting_float(float3 objPos, float3 worldNormal, float3 viewDir, float ao, float supportBakedVolumeRotation, out float3 color)
{
#ifdef UNIVERSAL_LIGHTING_INCLUDED

    VertexPositionInputs vertexInput = GetVertexPositionInputs(objPos);

    float3 lpUV = VolumeCoords(vertexInput.positionWS, supportBakedVolumeRotation);
    float4 mask = _VolumeMask.Sample(sampler_VolumeMask, lpUV);

    Light light = GetMainLight(GetShadowCoord(vertexInput), vertexInput.positionWS, mask);

    //float specular = 1;
    //float smoothness = 1;

    float3 attenColor = light.color * light.distanceAttenuation * light.shadowAttenuation;
    color = LightingLambert(attenColor, light.direction, worldNormal);
    //color = LightingSpecular(attenColor, light.direction, worldNormal, viewDir, specular, smoothness);

    int pixelLightCount = GetAdditionalLightsCount();
    for (int i = 0; i < pixelLightCount; i++)
    {
        light = GetAdditionalLight(i, vertexInput.positionWS, mask);
        attenColor = light.color * light.distanceAttenuation * light.shadowAttenuation;
        color += LightingLambert(attenColor, light.direction, worldNormal);
    }

    float3 sh;
    BakeryVolume_float(vertexInput.positionWS, worldNormal, supportBakedVolumeRotation, sh);
    color += sh * ao;

#else
    color = 0;
#endif
}


void FullVolumeLightingSpec_float(float3 objPos, float3 worldNormal, float3 viewDir, float3 albedo, float ao, float smoothness, float metalness, float supportBakedVolumeRotation, out float3 diffuse, out float3 specular, out float3 indirectSpecular)
{
#ifdef UNIVERSAL_LIGHTING_INCLUDED

    VertexPositionInputs vertexInput = GetVertexPositionInputs(objPos);

    float3 lpUV = VolumeCoords(vertexInput.positionWS, supportBakedVolumeRotation);
    float4 mask = _VolumeMask.Sample(sampler_VolumeMask, lpUV);

    Light light = GetMainLight(GetShadowCoord(vertexInput), vertexInput.positionWS, mask);

    float3 attenColor = light.color * light.distanceAttenuation * light.shadowAttenuation;
    diffuse = LightingLambert(attenColor, light.direction, worldNormal);
    float spec;
    Specular_float(light.direction, worldNormal, viewDir, smoothness, spec);
    specular = spec * attenColor;

    int pixelLightCount = GetAdditionalLightsCount();
    for (int i = 0; i < pixelLightCount; i++)
    {
        light = GetAdditionalLight(i, vertexInput.positionWS, mask);
        attenColor = light.color * light.distanceAttenuation * light.shadowAttenuation;
        diffuse += LightingLambert(attenColor, light.direction, worldNormal);
        Specular_float(light.direction, worldNormal, viewDir, smoothness, spec);
        specular += spec * attenColor;
    }

#ifdef BAKERY_LMSPEC
    float3 diffuseSH, specularSH;
    BakeryVolumeSpec_float(vertexInput.positionWS, worldNormal, viewDir, smoothness, albedo, metalness, supportBakedVolumeRotation, diffuseSH, specularSH);
    diffuse += diffuseSH * ao;
    indirectSpecular = specularSH * ao;
#else
    float3 sh;
    BakeryVolume_float(vertexInput.positionWS, worldNormal, supportBakedVolumeRotation, sh);
    diffuse += sh * ao;
    indirectSpecular = 0;
#endif

#ifndef BAKERY_NOSPECULARWEIGHTING
    // Convert metalness to specular and "oneMinusReflectivity"
    float3 specularColor = lerp(float3(0.04, 0.04, 0.04), albedo, metalness);
    float oneMinusDielectricSpec = 1.0 - 0.04;
    float oneMinusReflectivity = oneMinusDielectricSpec - metalness * oneMinusDielectricSpec;

    // Directly apply fresnel and smoothness-dependent grazing term
    float nv = 1.0f - saturate(dot(worldNormal, viewDir));
    float nv2 = nv * nv;
    float fresnel = nv * nv2 * nv2;

    float reflectivity = max(max(specularColor.r, specularColor.g), specularColor.b); // hack, but consistent with Unity code
    float grazingTerm = saturate(smoothness + reflectivity);
    float3 fresnel3 = lerp(specularColor, float3(grazingTerm, grazingTerm, grazingTerm), fresnel);

    diffuse *= oneMinusReflectivity; // no baked GI override: modify diffuse
    specular *= fresnel3;

    diffuse = max(diffuse, 0);
    specular = max(specular, 0);
#endif

#else
    diffuse = 0;
    specular = 0;
#endif
}

void unpack3NFloats_float(float src, out float3 dest)
{
    float r = frac(src);
    float g = frac(src * 256.0);
    float b = frac(src * 65536.0);
    dest = float3(r, g, b);
}