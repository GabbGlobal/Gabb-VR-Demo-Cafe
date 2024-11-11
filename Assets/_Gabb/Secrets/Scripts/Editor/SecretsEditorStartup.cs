using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEditor;

[InitializeOnLoad]
public static class SecretsEditorStartup
{
    static SecretsEditorStartup()
    {
        Secrets asset = AssetDatabase.LoadAssetAtPath<Secrets>(Secrets.assetPath);
        if (asset == null)
        {
            Log($"No secret data asset found. Creating a new one at {Secrets.assetPath}. Fill in secret keys there only.");
            asset = ScriptableObject.CreateInstance<Secrets>();
            AssetDatabase.CreateAsset(asset, Secrets.assetPath);
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
