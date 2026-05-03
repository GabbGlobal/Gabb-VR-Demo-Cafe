using UnityEngine;

public enum GrammaticalGender { Masculine, Feminine, Neutral }

[CreateAssetMenu(fileName = "WordData", menuName = "ScriptableObjects/Word Data", order = 2)]
public class WordData : ScriptableObject
{
    [SerializeField] private string word;
    [SerializeField] private GrammaticalGender gender;
    [SerializeField] private AudioClip pronunciationAudio;

    public string Word => word;
    public GrammaticalGender Gender => gender;
    public AudioClip PronunciationAudio => pronunciationAudio;

    public string GetDefiniteArticle()
    {
        return gender switch
        {
            GrammaticalGender.Masculine => "el",
            GrammaticalGender.Feminine => "la",
            GrammaticalGender.Neutral => "lo",
            _ => ""
        };
    }
}
