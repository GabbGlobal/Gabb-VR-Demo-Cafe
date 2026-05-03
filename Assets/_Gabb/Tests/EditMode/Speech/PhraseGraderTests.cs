using NUnit.Framework;

public class PhraseGraderTests
{
    // --- Exact matches ---

    [Test]
    public void ExactMatch_AllWordsGreen()
    {
        var result = PhraseGrader.Grade("Buenos días", "Buenos días");
        Assert.AreEqual(2, result.matchedCount);
        Assert.AreEqual(2, result.totalWords);
        Assert.AreEqual(1f, result.accuracy);
        Assert.IsTrue(result.passed);
        Assert.IsTrue(result.words[0].matched);
        Assert.IsTrue(result.words[1].matched);
    }

    [Test]
    public void ExactMatch_CaseInsensitive()
    {
        var result = PhraseGrader.Grade("buenos días", "Buenos Días");
        Assert.AreEqual(2, result.matchedCount);
        Assert.IsTrue(result.passed);
    }

    // --- Accent normalization ---

    [Test]
    public void AccentNormalization_DiasMatchesDías()
    {
        var result = PhraseGrader.Grade("buenos dias", "Buenos días");
        Assert.AreEqual(2, result.matchedCount);
        Assert.IsTrue(result.passed);
    }

    [Test]
    public void AccentNormalization_CafeMatchesCafé()
    {
        var result = PhraseGrader.Grade("cafe", "Café");
        Assert.AreEqual(1, result.matchedCount);
        Assert.IsTrue(result.passed);
    }

    // --- Partial matches ---

    [Test]
    public void PartialMatch_OneOfThreeWords()
    {
        var result = PhraseGrader.Grade("hola", "Hola buenos días");
        Assert.AreEqual(1, result.matchedCount);
        Assert.AreEqual(3, result.totalWords);
        Assert.That(result.accuracy, Is.EqualTo(1f / 3f).Within(0.01f));
        Assert.IsFalse(result.passed); // 33% < 70%
    }

    [Test]
    public void PartialMatch_TwoOfThreeWords_Passes()
    {
        var result = PhraseGrader.Grade("hola dias", "Hola buenos días");
        Assert.AreEqual(2, result.matchedCount);
        Assert.That(result.accuracy, Is.EqualTo(2f / 3f).Within(0.01f));
        Assert.IsFalse(result.passed); // 66% < 70%
    }

    [Test]
    public void PartialMatch_ThreeOfFour_Passes()
    {
        var result = PhraseGrader.Grade("me llamo tony", "Me llamo Tony García");
        Assert.AreEqual(3, result.matchedCount);
        Assert.AreEqual(4, result.totalWords);
        Assert.That(result.accuracy, Is.EqualTo(0.75f).Within(0.01f));
        Assert.IsTrue(result.passed);
    }

    // --- No speech ---

    [Test]
    public void NoSpeech_AllWordsRed()
    {
        var result = PhraseGrader.Grade("", "Buenos días");
        Assert.AreEqual(0, result.matchedCount);
        Assert.AreEqual(0f, result.accuracy);
        Assert.IsFalse(result.passed);
        Assert.IsFalse(result.words[0].matched);
        Assert.IsFalse(result.words[1].matched);
    }

    [Test]
    public void NullRecognized_AllWordsRed()
    {
        var result = PhraseGrader.Grade(null, "Buenos días");
        Assert.AreEqual(0, result.matchedCount);
        Assert.IsFalse(result.passed);
    }

    // --- Edge cases ---

    [Test]
    public void EmptyReference_PassesByDefault()
    {
        var result = PhraseGrader.Grade("anything", "");
        Assert.IsTrue(result.passed);
        Assert.AreEqual(1f, result.accuracy);
    }

    [Test]
    public void NullReference_PassesByDefault()
    {
        var result = PhraseGrader.Grade("anything", null);
        Assert.IsTrue(result.passed);
    }

    [Test]
    public void TrailingPeriod_StrippedFromRecognized()
    {
        var result = PhraseGrader.Grade("hola.", "Hola");
        Assert.AreEqual(1, result.matchedCount);
        Assert.IsTrue(result.passed);
    }

    [Test]
    public void ExtraWordsInRecognized_StillMatchesReference()
    {
        var result = PhraseGrader.Grade("sí hola buenos días amigo", "Hola buenos días");
        Assert.AreEqual(3, result.matchedCount);
        Assert.AreEqual(3, result.totalWords);
        Assert.IsTrue(result.passed);
    }

    [Test]
    public void WrongWords_AllRed()
    {
        var result = PhraseGrader.Grade("gato perro", "Buenos días");
        Assert.AreEqual(0, result.matchedCount);
        Assert.IsFalse(result.passed);
        Assert.IsFalse(result.words[0].matched);
        Assert.IsFalse(result.words[1].matched);
    }

    // --- Custom threshold ---

    [Test]
    public void CustomThreshold_StricterPassRate()
    {
        var result = PhraseGrader.Grade("hola dias", "Hola buenos días", passThreshold: 0.9f);
        Assert.IsFalse(result.passed); // 66% < 90%
    }

    [Test]
    public void CustomThreshold_Lenient()
    {
        var result = PhraseGrader.Grade("hola", "Hola buenos días", passThreshold: 0.3f);
        Assert.IsTrue(result.passed); // 33% >= 30%
    }

    // --- Rich text output ---

    [Test]
    public void RichText_CorrectColoring()
    {
        var result = PhraseGrader.Grade("hola", "Hola amigo");
        string rt = PhraseGrader.ToColoredRichText(result);
        Assert.That(rt, Does.Contain("<color=green>Hola</color>"));
        Assert.That(rt, Does.Contain("<color=red>amigo</color>"));
    }

    // --- Normalize helper ---

    [Test]
    public void Normalize_RemovesAccents()
    {
        Assert.AreEqual("dias", PhraseGrader.Normalize("Días"));
        Assert.AreEqual("cafe", PhraseGrader.Normalize("Café"));
        Assert.AreEqual("lapiz", PhraseGrader.Normalize("Lápiz"));
        Assert.AreEqual("nino", PhraseGrader.Normalize("Niño"));
    }

    [Test]
    public void Normalize_EmptyAndNull()
    {
        Assert.AreEqual(string.Empty, PhraseGrader.Normalize(""));
        Assert.AreEqual(string.Empty, PhraseGrader.Normalize(null));
    }
}
