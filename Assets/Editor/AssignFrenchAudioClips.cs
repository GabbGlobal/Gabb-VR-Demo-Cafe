using UnityEditor;
using UnityEngine;

public class AssignFrenchAudioClips
{
    struct DialogueMapping
    {
        public string soPath;
        public string audioPrefix;
    }

    static readonly DialogueMapping[] Mappings =
    {
        new DialogueMapping
        {
            soPath = "Assets/_Gabb/Cafe/Dialogues/Lola/French/Dialogue Lola French.asset",
            audioPrefix = "Assets/Resources/ElevenLabs/dialogue_french/lola/dialogue_lola_french"
        },
        new DialogueMapping
        {
            soPath = "Assets/_Gabb/Cafe/Dialogues/FemaleBarista/FrenchFemaleBarista/Dialogue Cafe Female Barista French.asset",
            audioPrefix = "Assets/Resources/ElevenLabs/dialogue_french/femalebarista/dialogue_cafe_female_barista_french"
        },
        new DialogueMapping
        {
            soPath = "Assets/_Gabb/Cafe/Dialogues/MaleBarista/French/Dialogue Cafe MaleBarista French.asset",
            audioPrefix = "Assets/Resources/ElevenLabs/dialogue_french/malebarista/dialogue_cafe_malebarista_french"
        },
        new DialogueMapping
        {
            soPath = "Assets/_Gabb/Cafe/Dialogues/Tapping/French/Dialogue Cafe Tapping French.asset",
            audioPrefix = "Assets/Resources/ElevenLabs/dialogue_french/tapping/dialogue_cafe_tapping_french"
        },
        new DialogueMapping
        {
            soPath = "Assets/_Gabb/Cafe/Dialogues/Typing/French/Dialogue Cafe Typing French.asset",
            audioPrefix = "Assets/Resources/ElevenLabs/dialogue_french/typing/dialogue_cafe_typing_french"
        },
    };

    static readonly string[] DifficultyNames = { "easy", "medium", "hard", "expert" };

    [MenuItem("Gabb/Assign French Audio Clips")]
    static void Assign()
    {
        int totalAssigned = 0;
        int totalMissing = 0;

        foreach (var mapping in Mappings)
        {
            var dialogue = AssetDatabase.LoadAssetAtPath<Dialogue>(mapping.soPath);
            if (dialogue == null)
            {
                Debug.LogWarning($"[FrenchAudio] Could not load SO at: {mapping.soPath}");
                continue;
            }

            var so = new SerializedObject(dialogue);
            var linesProp = so.FindProperty("linesOfDialogue");

            for (int i = 0; i < linesProp.arraySize; i++)
            {
                var lineProp = linesProp.GetArrayElementAtIndex(i);
                var variantsProp = lineProp.FindPropertyRelative("textVariants");
                string lineNum = (i + 1).ToString("D2");

                if (variantsProp == null || variantsProp.arraySize == 0)
                    continue;

                for (int v = 0; v < variantsProp.arraySize; v++)
                {
                    var variant = variantsProp.GetArrayElementAtIndex(v);
                    int diffIdx = variant.FindPropertyRelative("difficulty").intValue;
                    if (diffIdx < 0 || diffIdx >= DifficultyNames.Length)
                        continue;

                    string audioPath = $"{mapping.audioPrefix}_{lineNum}_{DifficultyNames[diffIdx]}.mp3";
                    var clip = AssetDatabase.LoadAssetAtPath<AudioClip>(audioPath);

                    if (clip != null)
                    {
                        variant.FindPropertyRelative("audioClip").objectReferenceValue = clip;
                        totalAssigned++;
                    }
                    else
                    {
                        Debug.LogWarning($"[FrenchAudio] Missing: {audioPath}");
                        totalMissing++;
                    }
                }
            }

            so.ApplyModifiedProperties();
            EditorUtility.SetDirty(dialogue);
            Debug.Log($"[FrenchAudio] Processed: {mapping.soPath}");
        }

        AssetDatabase.SaveAssets();
        Debug.Log($"[FrenchAudio] Done! Assigned {totalAssigned} clips, {totalMissing} missing.");
    }
}
