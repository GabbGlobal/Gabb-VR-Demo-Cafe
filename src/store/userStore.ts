import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile, LanguageProgress, LanguageCode, VocabCategory, Gender, Orientation, SubscriptionPlan } from '../types'

interface UserState {
  profile: UserProfile | null
  progress: Record<LanguageCode, LanguageProgress>
  isOnboarded: boolean
  isLoggedIn: boolean
  coins: number  // Gabb Gold Coins (GGC) — cross-language currency

  // actions
  setProfile: (profile: UserProfile) => void
  updateProfile: (partial: Partial<UserProfile>) => void
  signIn: () => void
  signOut: () => void
  addXp: (lang: LanguageCode, xp: number) => void
  addCoins: (amount: number) => void
  markWordLearned: (lang: LanguageCode, wordId: string) => void
  markWordMissed: (lang: LanguageCode, wordId: string) => void
  markLessonCompleted: (lang: LanguageCode, lessonId: string) => void
  updateAccuracy: (lang: LanguageCode, correct: boolean) => void
  updateStreak: (lang: LanguageCode) => void
  setSubscription: (plan: SubscriptionPlan) => void
  setActiveLanguage: (lang: LanguageCode) => void
  reset: () => void
}

const defaultProgress = (lang: LanguageCode): LanguageProgress => ({
  language: lang,
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  streak: 0,
  lastStudied: '',
  wordsLearned: [],
  missedWords: [],
  lessonsCompleted: [],
  accuracy: 100,
})

const XP_PER_LEVEL = 100

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      progress: {} as Record<LanguageCode, LanguageProgress>,
      isOnboarded: false,
      isLoggedIn: false,
      coins: 0,

      signIn: () => set({ isLoggedIn: true }),
      signOut: () => set({ isLoggedIn: false }),

      setProfile: (profile) =>
        set({
          profile,
          isOnboarded: true,
          isLoggedIn: true,
          progress: profile.selectedLanguages.reduce(
            (acc, lang) => ({ ...acc, [lang]: defaultProgress(lang) }),
            {} as Record<LanguageCode, LanguageProgress>,
          ),
        }),

      updateProfile: (partial) =>
        set((s) => ({ profile: s.profile ? { ...s.profile, ...partial } : null })),

      addCoins: (amount) => set(s => ({ coins: s.coins + amount })),

      addXp: (lang, xp) =>
        set((s) => {
          const prev = s.progress[lang] ?? defaultProgress(lang)
          let { xp: currentXp, level, xpToNextLevel } = prev
          currentXp += xp
          while (currentXp >= xpToNextLevel) {
            currentXp -= xpToNextLevel
            level++
            xpToNextLevel = Math.round(XP_PER_LEVEL * Math.pow(1.15, level - 1))
          }
          return { progress: { ...s.progress, [lang]: { ...prev, xp: currentXp, level, xpToNextLevel } } }
        }),

      markWordLearned: (lang, wordId) =>
        set((s) => {
          const prev = s.progress[lang] ?? defaultProgress(lang)
          if (prev.wordsLearned.includes(wordId)) return s
          // Also remove from missedWords once correctly answered
          const missedWords = (prev.missedWords ?? []).filter(id => id !== wordId)
          return { progress: { ...s.progress, [lang]: { ...prev, wordsLearned: [...prev.wordsLearned, wordId], missedWords } } }
        }),

      markWordMissed: (lang, wordId) =>
        set((s) => {
          const prev = s.progress[lang] ?? defaultProgress(lang)
          const missed = prev.missedWords ?? []
          if (missed.includes(wordId)) return s
          return { progress: { ...s.progress, [lang]: { ...prev, missedWords: [...missed, wordId] } } }
        }),

      markLessonCompleted: (lang, lessonId) =>
        set((s) => {
          const prev = s.progress[lang] ?? defaultProgress(lang)
          if (prev.lessonsCompleted.includes(lessonId)) return s
          return { progress: { ...s.progress, [lang]: { ...prev, lessonsCompleted: [...prev.lessonsCompleted, lessonId], lastStudied: new Date().toISOString() } } }
        }),

      updateAccuracy: (lang, correct) =>
        set((s) => {
          const prev = s.progress[lang] ?? defaultProgress(lang)
          const newAccuracy = Math.round(prev.accuracy * 0.95 + (correct ? 100 : 0) * 0.05)
          return { progress: { ...s.progress, [lang]: { ...prev, accuracy: newAccuracy } } }
        }),

      updateStreak: (lang) =>
        set((s) => {
          const prev = s.progress[lang] ?? defaultProgress(lang)
          const today = new Date().toDateString()
          const lastDate = prev.lastStudied ? new Date(prev.lastStudied).toDateString() : ''
          const yesterday = new Date(Date.now() - 86400000).toDateString()
          let streak = prev.streak
          if (lastDate === today) return s
          if (lastDate === yesterday) streak++
          else streak = 1
          return { progress: { ...s.progress, [lang]: { ...prev, streak, lastStudied: new Date().toISOString() } } }
        }),

      setSubscription: (plan) =>
        set((s) => ({ profile: s.profile ? { ...s.profile, subscription: plan } : null })),

      setActiveLanguage: (lang) =>
        set((s) => ({ profile: s.profile ? { ...s.profile, activeLanguage: lang } : null })),

      reset: () => set({ profile: null, progress: {} as Record<LanguageCode, LanguageProgress>, isOnboarded: false, isLoggedIn: false, coins: 0 }),
    }),
    {
      name: 'gabb-user',
      version: 2,
      // Migrate existing users: anyone already onboarded is treated as logged in
      migrate: (persisted: any) => ({
        ...persisted,
        isLoggedIn: persisted.isLoggedIn ?? persisted.isOnboarded ?? false,
      }),
    },
  ),
)

// Selectors
export const selectActiveProgress = (s: UserState) => {
  const lang = s.profile?.activeLanguage
  return lang ? (s.progress[lang] ?? defaultProgress(lang)) : null
}
