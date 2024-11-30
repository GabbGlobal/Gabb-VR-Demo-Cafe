#if UNITY_EDITOR

using UnityEngine;
using UnityEditor;
using UnityEngine.SceneManagement;
using UnityEditor.SceneManagement;
using System.IO;
using System.Text;
using System.Collections;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public class ftBatchSceneBake : ScriptableWizard
{
    public bool render = true;
    public bool renderLightProbes = true;
    public bool renderReflectionProbes = true;
	public Object[] scenes;

    static bool _render, _renderLightProbes, _renderReflectionProbes;
    static string[] sceneList;
    static IEnumerator progressFunc;
    static bool loaded = false;

    Vector2 m_ScrollPosition;

    void OnGUI()
    {
        EditorGUIUtility.labelWidth = 150;

        m_ScrollPosition = EditorGUILayout.BeginScrollView(m_ScrollPosition);//, false, true, null, GUI.skin.verticalScrollbar, "OL Box");
        bool modified = DrawWizardGUI();
        EditorGUILayout.EndScrollView();

        GUILayout.FlexibleSpace();
        GUILayout.BeginHorizontal();
        GUILayout.FlexibleSpace();

        if (GUILayout.Button("Load scene list..."))
        {
            OnWizardOtherButton();
        }
        if (GUILayout.Button("Save scene list..."))
        {
            OnWizardThirdButton();
        }
        
        if (GUILayout.Button("Batch bake", GUILayout.MinWidth(100)))
        {
            OnWizardCreate();
        }

        GUILayout.EndHorizontal();
        GUILayout.Space(8);

        this.minSize = new Vector2(400, 200);
    }

    static IEnumerator BatchBakeFunc()
    {
        for(int i=0; i<sceneList.Length; i++)
        {
            loaded = false;
            EditorSceneManager.OpenScene(sceneList[i]);
            while(!loaded) yield return null;

            //var storage = ftRenderLightmap.FindRenderSettingsStorage();
            var bakery = ftRenderLightmap.instance != null ? ftRenderLightmap.instance : new ftRenderLightmap();
            bakery.LoadRenderSettings();

            if (_render)
            {
                bakery.RenderButton(false);
                while(ftRenderLightmap.bakeInProgress)
                {
                    yield return null;
                }
            }

            if (_renderLightProbes)
            {
                bakery.RenderLightProbesButton(false);
                while(ftRenderLightmap.bakeInProgress)
                {
                    yield return null;
                }
            }

            if (_renderReflectionProbes)
            {
                bakery.RenderReflectionProbesButton(false);
                while(ftRenderLightmap.bakeInProgress)
                {
                    yield return null;
                }
            }

            EditorSceneManager.MarkAllScenesDirty();
            EditorSceneManager.SaveOpenScenes();
            yield return null;
        }
        Debug.Log("Batch bake finished");
    }

    static void BatchBakeUpdate()
    {
        if (progressFunc.MoveNext()) return;
        EditorApplication.update -= BatchBakeUpdate;
    }

    static void SceneOpened(Scene scene, OpenSceneMode mode)
    {
        loaded = true;
    }

	void OnWizardCreate()
	{
        sceneList = new string[scenes.Length];
        _render = render;
        _renderLightProbes = renderLightProbes;
        _renderReflectionProbes = renderReflectionProbes;
        for(int i=0; i<scenes.Length; i++)
        {
            var path = AssetDatabase.GetAssetPath(scenes[i]);
            sceneList[i] = path;
        }
        loaded = false;
        EditorSceneManager.sceneOpened += SceneOpened;
        progressFunc = BatchBakeFunc();
        EditorApplication.update += BatchBakeUpdate;
	}

    void OnWizardOtherButton()
    {
        var fname = EditorUtility.OpenFilePanel("Load scene list from TXT", "", "txt");
        if (!File.Exists(fname)) return;

        var lines = File.ReadAllLines(fname);
        if (lines == null)
        {
            Debug.LogError("Can't read "+fname);
            return;
        }
        var slist = new List<UnityEngine.Object>();
        for(int i=0; i<lines.Length; i++)
        {
            var asset = AssetDatabase.LoadAssetAtPath<UnityEngine.Object>(lines[i]);
            if (asset != null)
            {
                slist.Add(asset);
            }
        }
        scenes = slist.ToArray();
    }

    void OnWizardThirdButton()
    {
        if (scenes == null) return;
        var fname = EditorUtility.SaveFilePanel("Save scene list to TXT", "", "sceneList", "txt");
        
        var strList = new List<string>();
        for(int i=0; i<scenes.Length; i++)
        {
            var path = AssetDatabase.GetAssetPath(scenes[i]);
            if (path != null && path != "")
            {
                strList.Add(path);
            }
        }
        File.WriteAllLines(fname, strList.ToArray());
    }

#if BAKERY_TOOLSMENU
    [MenuItem ("Tools/Bakery/Utilities/Batch bake")]
#else
	[MenuItem ("Bakery/Utilities/Batch bake")]
#endif
	public static void RenderCubemap () {
		ScriptableWizard.DisplayWizard("Batch bake", typeof(ftBatchSceneBake), "Batch bake", "Load scene list...");
	}
}

#endif
