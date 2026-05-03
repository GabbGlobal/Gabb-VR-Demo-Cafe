using NUnit.Framework;

public class WordProgressEstimatorTests
{
    // --- Word index estimation ---

    [Test]
    public void ZeroElapsed_ReturnsFirstWord()
    {
        int idx = WordProgressEstimator.EstimateWordIndex(0f, 2f, 4);
        Assert.AreEqual(0, idx);
    }

    [Test]
    public void HalfwayThrough_ReturnsMiddleWord()
    {
        int idx = WordProgressEstimator.EstimateWordIndex(1f, 2f, 4);
        Assert.AreEqual(2, idx);
    }

    [Test]
    public void FullDuration_ReturnsLastWord()
    {
        int idx = WordProgressEstimator.EstimateWordIndex(2f, 2f, 4);
        Assert.AreEqual(3, idx);
    }

    [Test]
    public void OverDuration_ClampsToLastWord()
    {
        int idx = WordProgressEstimator.EstimateWordIndex(5f, 2f, 4);
        Assert.AreEqual(3, idx);
    }

    [Test]
    public void OneWord_AlwaysZero()
    {
        Assert.AreEqual(0, WordProgressEstimator.EstimateWordIndex(0f, 1f, 1));
        Assert.AreEqual(0, WordProgressEstimator.EstimateWordIndex(0.5f, 1f, 1));
        Assert.AreEqual(0, WordProgressEstimator.EstimateWordIndex(1f, 1f, 1));
    }

    [Test]
    public void ZeroWords_ReturnsZero()
    {
        Assert.AreEqual(0, WordProgressEstimator.EstimateWordIndex(1f, 2f, 0));
    }

    [Test]
    public void ZeroDuration_ReturnsZero()
    {
        Assert.AreEqual(0, WordProgressEstimator.EstimateWordIndex(1f, 0f, 4));
    }

    // --- Duration score ---

    [Test]
    public void PerfectDuration_ScoreIsOne()
    {
        float score = WordProgressEstimator.DurationScore(2f, 2f);
        Assert.That(score, Is.EqualTo(1f).Within(0.01f));
    }

    [Test]
    public void HalfDuration_ReasonableScore()
    {
        float score = WordProgressEstimator.DurationScore(1f, 2f);
        Assert.That(score, Is.GreaterThan(0.5f));
        Assert.That(score, Is.LessThan(1f));
    }

    [Test]
    public void DoubleDuration_ReasonableScore()
    {
        float score = WordProgressEstimator.DurationScore(4f, 2f);
        Assert.That(score, Is.GreaterThan(0.3f));
        Assert.That(score, Is.LessThan(1f));
    }

    [Test]
    public void VeryShort_LowScore()
    {
        float score = WordProgressEstimator.DurationScore(0.1f, 2f);
        Assert.That(score, Is.LessThan(0.5f));
    }

    [Test]
    public void ZeroRecording_ZeroScore()
    {
        float score = WordProgressEstimator.DurationScore(0f, 2f);
        Assert.That(score, Is.LessThanOrEqualTo(0.5f));
    }

    [Test]
    public void ZeroReference_ZeroScore()
    {
        float score = WordProgressEstimator.DurationScore(2f, 0f);
        Assert.AreEqual(0f, score);
    }

    // --- Engagement grading ---

    [Test]
    public void GoodEngagement_Passes()
    {
        var result = WordProgressEstimator.GradeEngagement(
            speechDuration: 2f, referenceDuration: 2f, totalWords: 4);
        Assert.IsTrue(result.spoke);
        Assert.IsTrue(result.passed);
        Assert.That(result.overallScore, Is.GreaterThan(0.8f));
        Assert.AreEqual(3, result.estimatedWordIndex); // last word
    }

    [Test]
    public void NoSpeech_Fails()
    {
        var result = WordProgressEstimator.GradeEngagement(
            speechDuration: 0.1f, referenceDuration: 2f, totalWords: 4);
        Assert.IsFalse(result.spoke);
        Assert.IsFalse(result.passed);
        Assert.AreEqual(0f, result.overallScore);
    }

    [Test]
    public void HalfSpeech_MayPass()
    {
        var result = WordProgressEstimator.GradeEngagement(
            speechDuration: 1f, referenceDuration: 2f, totalWords: 4, passThreshold: 0.5f);
        Assert.IsTrue(result.spoke);
        Assert.That(result.overallScore, Is.GreaterThan(0.5f));
    }

    [Test]
    public void PartialProgress_CorrectWordIndex()
    {
        var result = WordProgressEstimator.GradeEngagement(
            speechDuration: 1.5f, referenceDuration: 3f, totalWords: 6);
        Assert.AreEqual(3, result.estimatedWordIndex); // halfway = word 3 of 6
    }
}
