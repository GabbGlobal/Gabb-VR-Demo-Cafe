import { useCallback } from 'react'
import { useBiosensorStore } from '../store/biosensorStore'
import { useUserStore } from '../store/userStore'
import type { VocabWord, LessonCard, LessonType } from '../types'
import { vocabularyByLanguage } from '../data/vocabulary'

/**
 * Returns lesson cards adapted to the current cognitive state.
 * - Overloaded/fatigued → easier words, slower pacing, more review
 * - Bored/optimal       → harder words, new material, faster pacing
 * - Baseline            → balanced mix
 */
export function useAdaptiveLearning() {
  const adaptiveState = useBiosensorStore(s => s.adaptiveState)
  const profile = useUserStore(s => s.profile)
  const progress = useUserStore(s => s.progress)

  const buildLessonCards = useCallback((wordPool: VocabWord[], count = 10): LessonCard[] => {
    const { recommendedDifficulty, recommendedPace, cognitiveState } = adaptiveState
    const lang = profile?.activeLanguage ?? 'it'
    const learned = progress[lang]?.wordsLearned ?? []

    // Filter by difficulty
    let eligible = wordPool.filter(w => w.difficulty <= recommendedDifficulty)
    if (eligible.length < count) eligible = wordPool // fallback to full pool

    // Mix review (known) vs new based on cognitive state
    const reviewRatio = cognitiveState === 'overloaded' || cognitiveState === 'fatigued' ? 0.6 : 0.2
    const reviewWords  = eligible.filter(w => learned.includes(w.id))
    const newWords     = eligible.filter(w => !learned.includes(w.id))

    const reviewCount = Math.min(Math.round(count * reviewRatio), reviewWords.length)
    const newCount    = Math.min(count - reviewCount, newWords.length)

    const selected = [
      ...shuffle(reviewWords).slice(0, reviewCount),
      ...shuffle(newWords).slice(0, newCount),
    ]
    if (selected.length < count) {
      const filler = shuffle(eligible).slice(0, count - selected.length)
      selected.push(...filler.filter(w => !selected.find(s => s.id === w.id)))
    }

    return shuffle(selected).slice(0, count).map((word, i) =>
      buildCard(word, i, eligible, recommendedPace),
    )
  }, [adaptiveState, profile, progress])

  return { buildLessonCards, adaptiveState }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildCard(
  word: VocabWord,
  index: number,
  pool: VocabWord[],
  pace: 'slow' | 'normal' | 'fast',
): LessonCard {
  // Vary lesson types for engagement
  const types: LessonType[] = ['flashcard', 'multiple-choice', 'fill-blank']
  if (pace === 'slow') {
    // Easy mode: more flashcards
    const type: LessonType = index % 3 === 0 ? 'multiple-choice' : 'flashcard'
    return makeCard(word, type, pool)
  }
  const type = types[index % types.length]
  return makeCard(word, type, pool)
}

function makeCard(word: VocabWord, type: LessonType, pool: VocabWord[]): LessonCard {
  const wrongOptions = shuffle(pool.filter(w => w.id !== word.id))
    .slice(0, 3)
    .map(w => w.translation)

  const options = type === 'multiple-choice'
    ? shuffle([word.translation, ...wrongOptions])
    : undefined

  return {
    id: `card-${word.id}-${type}`,
    type,
    word,
    options,
    correctAnswer: word.translation,
    hint: type === 'fill-blank' ? word.pronunciation : undefined,
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
