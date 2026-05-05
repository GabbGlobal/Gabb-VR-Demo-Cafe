using UnityEngine;
using UnityEditor;

[CustomEditor(typeof(VRKeyboardBuilder))]
public class VRKeyboardBuilderEditor : Editor
{
    public override void OnInspectorGUI()
    {
        DrawDefaultInspector();

        GUILayout.Space(10);

        if (GUILayout.Button("Build Keyboard", GUILayout.Height(40)))
        {
            var builder = (VRKeyboardBuilder)target;
            Undo.RegisterFullObjectHierarchyUndo(builder.gameObject, "Build VR Keyboard");
            builder.BuildKeyboard();
        }

        if (GUILayout.Button("Clear Keyboard", GUILayout.Height(30)))
        {
            var builder = (VRKeyboardBuilder)target;
            Undo.RegisterFullObjectHierarchyUndo(builder.gameObject, "Clear VR Keyboard");
            for (int i = builder.transform.childCount - 1; i >= 0; i--)
                DestroyImmediate(builder.transform.GetChild(i).gameObject);
            EditorUtility.SetDirty(builder.gameObject);
        }
    }
}
