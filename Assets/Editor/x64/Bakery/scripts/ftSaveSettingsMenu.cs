using UnityEngine;
using UnityEditor;
using UnityEngine.SceneManagement;

public class ftSaveSettingsMenu
{
#if BAKERY_TOOLSMENU
    [MenuItem("Tools/Bakery/Utilities/Save settings as default", false, 41)]
#else
    [MenuItem("Bakery/Utilities/Save settings as default", false, 41)]
#endif
    private static void SaveSettings()
    {
        var bakeryRuntimePath = ftLightmaps.GetRuntimePath();
        var gstorage = AssetDatabase.LoadAssetAtPath(bakeryRuntimePath + "ftGlobalStorage.asset", typeof(ftGlobalStorage)) as ftGlobalStorage;

        if (gstorage == null)
        {
            Debug.Log("Bakery is not initalized");
            return;
        }

        if (EditorUtility.DisplayDialog("Bakery", "Save current scene settings as global defaults?", "OK", "Cancel"))
        {
            var storage = ftRenderLightmap.FindRenderSettingsStorage();
            ftRenderLightmap bakery = ftRenderLightmap.instance != null ? ftRenderLightmap.instance : new ftRenderLightmap();
            bakery.LoadRenderSettings();
            ftLightmapsStorage.CopySettings(storage, gstorage);
            EditorUtility.SetDirty(gstorage);
            Debug.Log("Default settings saved");
        }
    }

#if BAKERY_TOOLSMENU
    [MenuItem("Tools/Bakery/Utilities/Load default settings", false, 42)]
#else
    [MenuItem("Bakery/Utilities/Load default settings", false, 42)]
#endif
    private static void LoadSettings()
    {
        var bakeryRuntimePath = ftLightmaps.GetRuntimePath();
        var gstorage = AssetDatabase.LoadAssetAtPath(bakeryRuntimePath + "ftGlobalStorage.asset", typeof(ftGlobalStorage)) as ftGlobalStorage;

        if (gstorage == null)
        {
            Debug.Log("Bakery is not initalized");
            return;
        }

        if (EditorUtility.DisplayDialog("Bakery", "Set default baking settings for the current scene?", "OK", "Cancel"))
        {
            var storage = ftRenderLightmap.FindRenderSettingsStorage();
            ftRenderLightmap bakery = ftRenderLightmap.instance != null ? ftRenderLightmap.instance : new ftRenderLightmap();
            ftLightmapsStorage.CopySettings(gstorage, storage);
            EditorUtility.SetDirty(storage);
            bakery.LoadRenderSettings();
            Debug.Log("Default settings loaded");
        }
    }
}

