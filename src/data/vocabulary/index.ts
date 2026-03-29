import type { VocabWord, LanguageCode, VocabCategory } from '../../types'
import { italianVocabulary } from './italian'
import { spanishVocabulary } from './spanish'
import { frenchVocabulary } from './french'
import { portugueseVocabulary } from './portuguese'

export const vocabularyByLanguage: Record<LanguageCode, VocabWord[]> = {
  it: italianVocabulary,
  es: spanishVocabulary,
  fr: frenchVocabulary,
  pt: portugueseVocabulary,
  // English (ESL path for Spanish speakers) — reuses Spanish vocab data as base
  en: spanishVocabulary,
}

export function getVocabByCategory(lang: LanguageCode, category: VocabCategory): VocabWord[] {
  return vocabularyByLanguage[lang].filter(w => w.category === category)
}

export function getVocabByTags(lang: LanguageCode, tags: string[]): VocabWord[] {
  return vocabularyByLanguage[lang].filter(w => tags.some(t => w.tags.includes(t)))
}

export function getVocabByDifficulty(lang: LanguageCode, level: 1 | 2 | 3): VocabWord[] {
  return vocabularyByLanguage[lang].filter(w => w.difficulty <= level)
}

export function getPersonalizedVocab(
  lang: LanguageCode,
  interests: VocabCategory[],
  tags: string[] = [],
): VocabWord[] {
  const words = vocabularyByLanguage[lang]
  const byCategory = words.filter(w => interests.includes(w.category))
  const byTags = tags.length ? words.filter(w => tags.some(t => w.tags.includes(t))) : []
  const combined = [...byCategory, ...byTags]
  // deduplicate
  return combined.filter((w, i, arr) => arr.findIndex(x => x.id === w.id) === i)
}
