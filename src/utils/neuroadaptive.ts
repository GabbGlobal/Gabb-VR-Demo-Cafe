import type { BiosensorReading, AdaptiveState, CognitiveState } from '../types'

// ─── Scoring helpers ──────────────────────────────────────────────────────────

/** Normalise a value to 0–1 given a min/max range */
function normalise(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(1, (value - min) / (max - min)))
}

/**
 * Heart rate variability score (RMSSD ms).
 * High HRV → relaxed/resilient (low stress). Low HRV → stressed/fatigued.
 * Typical resting range: 20–80 ms
 */
function hrvStressScore(hrv: number): number {
  // invert: high HRV = low stress
  return 1 - normalise(hrv, 15, 80)
}

/**
 * Heart rate based arousal / cognitive load proxy.
 * Elevated HR during a cognitive task suggests engagement or stress.
 * Baseline typically 60–80 bpm.
 */
function hrArousalScore(hr: number, restingHr: number = 70): number {
  const delta = hr - restingHr
  return normalise(delta, -5, 30)
}

/**
 * EEG focus score from alpha/beta ratio.
 * High beta + moderate alpha = focused engagement.
 * High alpha alone = relaxed/drowsy. High theta = sleepy.
 */
function eegFocusScore(alpha: number, beta: number, theta: number): number {
  if (alpha + beta + theta === 0) return 0.5
  const betaRatio = beta / (alpha + beta + theta)
  const thetaPenalty = normalise(theta, 0, 15) * 0.3
  return Math.max(0, Math.min(1, betaRatio * 1.5 - thetaPenalty))
}

/** GSR engagement score. Higher skin conductance = more aroused/engaged. */
function gsrEngagementScore(gsr: number): number {
  // Typical range 0.5–20 μS; >5 suggests notable arousal
  return normalise(gsr, 0.5, 15)
}

// ─── Main algorithm ───────────────────────────────────────────────────────────

export interface AdaptiveInputs {
  reading: BiosensorReading | null
  recentAccuracy: number    // 0–1, last N answers
  recentResponseTimeMs: number // average response time
  restingHr?: number
}

export function computeAdaptiveState(inputs: AdaptiveInputs): AdaptiveState {
  const { reading, recentAccuracy, recentResponseTimeMs, restingHr = 70 } = inputs

  let focusScore = 0.5
  let stressScore = 0.3
  let engagementScore = 0.5

  if (reading) {
    // Heart rate
    if (reading.heartRate) {
      const arousal = hrArousalScore(reading.heartRate, restingHr)
      engagementScore = 0.4 + arousal * 0.6
    }
    // HRV (overrides HR-based stress if available)
    if (reading.hrv) {
      stressScore = hrvStressScore(reading.hrv)
    }
    // EEG
    if (reading.eegAlpha !== undefined && reading.eegBeta !== undefined) {
      const theta = reading.eegTheta ?? 0
      focusScore = eegFocusScore(reading.eegAlpha, reading.eegBeta, theta)
    }
    // GSR
    if (reading.gsr !== undefined) {
      engagementScore = gsrEngagementScore(reading.gsr)
    }
  }

  // Blend bio scores with performance metrics
  const performanceFocus = normalise(recentAccuracy, 0.4, 1.0)
  const speedFocus = 1 - normalise(recentResponseTimeMs, 2000, 12000)
  focusScore = reading ? focusScore * 0.6 + performanceFocus * 0.4
                       : performanceFocus * 0.7 + speedFocus * 0.3

  // Determine cognitive state
  let cognitiveState: CognitiveState = 'baseline'
  if (reading) {
    if (focusScore > 0.65 && stressScore < 0.5 && engagementScore > 0.5) {
      cognitiveState = 'optimal'
    } else if (stressScore > 0.7 || (reading.hrv && reading.hrv < 20)) {
      cognitiveState = 'overloaded'
    } else if (engagementScore < 0.3 && focusScore < 0.4) {
      cognitiveState = 'bored'
    } else if (focusScore < 0.3 && recentAccuracy < 0.5) {
      cognitiveState = 'fatigued'
    } else {
      cognitiveState = 'optimal'
    }
  } else {
    // Derive from performance alone
    if (recentAccuracy > 0.85) cognitiveState = 'bored'
    else if (recentAccuracy < 0.45) cognitiveState = 'overloaded'
    else cognitiveState = 'optimal'
  }

  // Recommended difficulty
  let recommendedDifficulty: 1 | 2 | 3 = 2
  if (cognitiveState === 'optimal' || cognitiveState === 'bored') {
    recommendedDifficulty = recentAccuracy > 0.8 ? 3 : 2
  } else if (cognitiveState === 'overloaded' || cognitiveState === 'fatigued') {
    recommendedDifficulty = 1
  }

  const recommendedPace =
    cognitiveState === 'optimal' ? 'fast'
    : cognitiveState === 'overloaded' || cognitiveState === 'fatigued' ? 'slow'
    : 'normal'

  const suggestBreak =
    cognitiveState === 'fatigued' ||
    (cognitiveState === 'overloaded' && stressScore > 0.8)

  return {
    cognitiveState,
    focusScore: Math.round(focusScore * 100) / 100,
    stressScore: Math.round(stressScore * 100) / 100,
    engagementScore: Math.round(engagementScore * 100) / 100,
    recommendedDifficulty,
    recommendedPace,
    suggestBreak,
    lastUpdated: Date.now(),
  }
}

export function cognitiveStateLabel(state: CognitiveState): string {
  switch (state) {
    case 'optimal':    return 'In the Zone'
    case 'overloaded': return 'Take It Easy'
    case 'bored':      return 'Ready for More'
    case 'fatigued':   return 'Break Recommended'
    case 'baseline':   return 'Calibrating...'
  }
}

export function cognitiveStateColor(state: CognitiveState): string {
  switch (state) {
    case 'optimal':    return 'text-neural-calm'
    case 'overloaded': return 'text-neural-stress'
    case 'bored':      return 'text-neural-flow'
    case 'fatigued':   return 'text-neural-stress'
    case 'baseline':   return 'text-neural-focus'
  }
}

export function cognitiveStateBg(state: CognitiveState): string {
  switch (state) {
    case 'optimal':    return 'bg-emerald-500/20 border-emerald-500/40'
    case 'overloaded': return 'bg-red-500/20 border-red-500/40'
    case 'bored':      return 'bg-amber-500/20 border-amber-500/40'
    case 'fatigued':   return 'bg-red-500/20 border-red-500/40'
    case 'baseline':   return 'bg-indigo-500/20 border-indigo-500/40'
  }
}
