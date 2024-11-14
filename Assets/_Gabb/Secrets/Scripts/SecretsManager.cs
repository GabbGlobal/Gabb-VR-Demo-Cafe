using System.Collections;
using System.Collections.Generic;
using UnityEngine;
#if UNITY_EDITOR
using UnityEditor;
# endif

/*
*   Helps keep secret data out of the repo.
*   The secret data asset this manages MUST be gitignored to avoid commiting secret keys
*/
public class SecretsManager : MonoBehaviour
{
    // singleton
    public static SecretsManager Instance {get; private set;}
    // Path to the secret data asset
    // This path MUST be gitignored to keep the secret keys out of the repo
    void Awake() {
        if (Instance != null) {
            DestroyImmediate(Instance);
        }
        Instance = this;
    }
    
    public Secrets secretsAsset;

    void OnValidate()
    {
        if (secretsAsset == null) {
            LoadSecrets();
        }
    }

    private void LoadSecrets()
    {
#if UNITY_EDITOR
        if (Application.isEditor)
        {
            Log($"Loading secret data asset from {Secrets.assetPath}");
            // load the secrets asset
            Secrets secrets = AssetDatabase.LoadAssetAtPath<Secrets>(Secrets.assetPath);
            if (secrets == null) {
                LogWarning($"No secret data asset found at {Secrets.assetPath}. Restart the Editor so one is created.");
            }
            this.secretsAsset = secrets;
        }
#endif
    }

    void Log(string message) {
        Debug.Log($"[SecretsManager] {message}");
    }

    void LogWarning(string message) {
        Debug.LogWarning($"[SecretsManager] {message}");
    }
}
