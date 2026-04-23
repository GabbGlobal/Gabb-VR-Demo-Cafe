using System;

[Serializable]
public class PronunciationResult
{
    public string recognizedText;
    public string referenceText;
    public float pronunciationScore;
    public float accuracyScore;
    public float fluencyScore;
    public float completenessScore;
    public bool passed;
    public float latencyMs;

    public PronunciationGrade Grade
    {
        get
        {
            if (pronunciationScore >= 80f) return PronunciationGrade.Pass;
            if (pronunciationScore >= 60f) return PronunciationGrade.SoftPass;
            return PronunciationGrade.Fail;
        }
    }
}

public enum PronunciationGrade
{
    Pass,
    SoftPass,
    Fail
}
