using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEditor;

[InitializeOnLoad]
public static class SecretsEditorStartup
{
    private const string assetPath = "Assets/_Gabb/Secrets/SecretData.asset";

    static SecretsEditorStartup()
    {
        Secrets asset = AssetDatabase.LoadAssetAtPath<Secrets>(assetPath);
        if (asset == null)
        {
            Log($"No secret data asset found. Creating a new one at {assetPath}. Fill in secret keys there only.");
            asset = ScriptableObject.CreateInstance<Secrets>();
            AssetDatabase.CreateAsset(asset, assetPath);
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            // if secrets asset does not exist already, then create it
            //secrets = CreateSecretDataAsset();
        }
    }

    static void Log(string message) {
        Debug.Log($"[SecretsEditorStartup] {message}");
    }
}
