// ─── Language & Vocabulary ───────────────────────────────────────────────────

export type LanguageCode = 'it' | 'es' | 'fr' | 'pt' | 'en'

export interface Language {
  code: LanguageCode
  name: string
  nativeName: string
  flag: string
  priceMonthly: number
  description: string
  difficulty: 'beginner-friendly' | 'moderate' | 'challenging'
  speakers: string
  /** BCP-47 code of the learner's native language (for ESL paths) */
  nativeLanguage?: string
}

export type VocabCategory =
  | 'essentials'
  | 'travel'
  | 'food'
  | 'social'
  | 'shopping'
  | 'lgbtq'
  | 'romance'
  | 'culture'
  | 'health'
  | 'emergency'
  | 'business'

export interface VocabWord {
  id: string
  native: string           // e.g. "ciao"
  translation: string      // e.g. "hello / bye"
  pronunciation: string    // IPA or simplified
  example: string          // native sentence
  exampleTranslation: string
  category: VocabCategory
  tags: string[]           // e.g. ['travel', 'lgbtq', 'female']
  difficulty: 1 | 2 | 3   // 1=easy, 2=medium, 3=hard
  audioUrl?: string
}

// ─── Lessons ─────────────────────────────────────────────────────────────────

export type LessonType =
  | 'flashcard'
  | 'multiple-choice'
  | 'fill-blank'
  | 'pronunciation'
  | 'listening'
  | 'conversation'

export interface LessonCard {
  id: string
  type: LessonType
  word: VocabWord
  options?: string[]       // for multiple-choice
  correctAnswer: string
  hint?: string
}

export interface Lesson {
  id: string
  title: string
  description: string
  category: VocabCategory
  language: LanguageCode
  cards: LessonCard[]
  xpReward: number
  estimatedMinutes: number
  requiredLevel: number
}

// ─── User & Progress ─────────────────────────────────────────────────────────

export type Gender = 'man' | 'woman' | 'nonbinary' | 'prefer-not'
export type Orientation = 'men' | 'women' | 'everyone' | 'prefer-not'

export interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  gender: Gender
  orientation: Orientation
  interests: VocabCategory[]
  selectedLanguages: LanguageCode[]
  activeLanguage: LanguageCode
  subscription: SubscriptionPlan
  createdAt: string
  // Onboarding extras
  password?: string
  goal?: 'travel' | 'business' | 'academic' | 'family' | 'culture' | 'fluency'
  dailyMinutes?: 5 | 15 | 30 | 60
  placementLevel?: 1 | 2 | 3  // 1=beginner, 2=intermediate, 3=advanced
}

export interface LanguageProgress {
  language: LanguageCode
  level: number
  xp: number
  xpToNextLevel: number
  streak: number
  lastStudied: string
  wordsLearned: string[]  // word IDs
  missedWords: string[]   // word IDs answered wrong — used for STM resurface
  lessonsCompleted: string[]
  accuracy: number
}

// ─── Subscription ────────────────────────────────────────────────────────────

export type SubscriptionPlan = 'free' | 'language' | 'allaccess'

export interface PricingTier {
  id: SubscriptionPlan
  name: string
  priceMonthly: number
  priceAnnual: number
  features: string[]
  highlighted: boolean
}

// ─── Biosensors ──────────────────────────────────────────────────────────────

export type BiosensorType = 'hrm' | 'muse' | 'emotiv' | 'shimmer'
export type BiosensorStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface BiosensorDevice {
  type: BiosensorType
  name: string
  status: BiosensorStatus
  batteryLevel?: number
  lastReading?: BiosensorReading
}

export interface BiosensorReading {
  timestamp: number
  heartRate?: number            // bpm
  hrv?: number                  // ms RMSSD
  eegAlpha?: number             // μV, 8-13 Hz  (relaxed focus)
  eegBeta?: number              // μV, 13-30 Hz (active thinking)
  eegTheta?: number             // μV, 4-8 Hz   (drowsy)
  gsr?: number                  // μS, galvanic skin response
}

// ─── Neuroadaptive State ─────────────────────────────────────────────────────

export type CognitiveState =
  | 'optimal'    // high focus, low stress → push harder
  | 'overloaded' // high stress, low HRV → slow down / break
  | 'bored'      // low engagement, stable HR → increase challenge
  | 'fatigued'   // declining accuracy + theta waves → suggest break
  | 'baseline'   // no sensor data, use adaptive default

export interface AdaptiveState {
  cognitiveState: CognitiveState
  focusScore: number        // 0–1
  stressScore: number       // 0–1
  engagementScore: number   // 0–1
  recommendedDifficulty: 1 | 2 | 3
  recommendedPace: 'slow' | 'normal' | 'fast'
  suggestBreak: boolean
  lastUpdated: number
}
