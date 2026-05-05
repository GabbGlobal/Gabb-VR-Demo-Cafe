using System;

public static class WordProgressEstimator
{
    public static int EstimateWordIndex(float elapsedSpeaking, float referenceDuration, int totalWords)
    {
        if (totalWords <= 0 || referenceDuration <= 0f) return 0;
        float progress = Math.Min(elapsedSpeaking / referenceDuration, 1f);
        return Math.Min((int)(progress * totalWords), totalWords - 1);
    }

    public static float DurationScore(float recordedDuration, float referenceDuration)
    {
        if (referenceDuration <= 0f) return 0f;
        float ratio = recordedDuration / referenceDuration;
        if (ratio >= 0.5f && ratio <= 2f)
            return 1f - Math.Abs(1f - ratio) * 0.5f;
        return Math.Max(0f, 0.5f - Math.Abs(1f - ratio) * 0.25f);
    }

    public struct EngagementResult
    {
        public bool spoke;
        public float durationScore;
        public int estimatedWordIndex;
        public float overallScore;
        public bool passed;
    }

    public static EngagementResult GradeEngagement(
        float speechDuration, float referenceDuration, int totalWords, float passThreshold = 0.5f)
    {
        bool spoke = speechDuration > 0.3f;
        float durScore = DurationScore(speechDuration, referenceDuration);
        int wordIdx = EstimateWordIndex(speechDuration, referenceDuration, totalWords);
        float overall = spoke ? durScore : 0f;

        return new EngagementResult
        {
            spoke = spoke,
            durationScore = durScore,
            estimatedWordIndex = wordIdx,
            overallScore = overall,
            passed = overall >= passThreshold
        };
    }

    // fast + pass = 100%, fastish + pass ~75%, slow + pass = 50%, fail = 0-25%
    public static float CalculateAccuracy(float speechTime, float refDuration, bool passed)
    {
        if (!passed)
        {
            if (speechTime <= 0.3f) return 0f;
            float effort = refDuration > 0f ? Math.Min(speechTime / refDuration, 1f) : 0f;
            return effort * 25f;
        }

        if (refDuration <= 0f) return 100f;
        float timeRatio = speechTime / refDuration;
        if (timeRatio <= 1f) return 100f;
        if (timeRatio >= 3f) return 65f;
        return 100f - (timeRatio - 1f) * 17.5f;
    }
}
