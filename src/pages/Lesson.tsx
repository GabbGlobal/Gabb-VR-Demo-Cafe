import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Brain, CheckCircle2, XCircle, ChevronRight, Volume2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/Progress'
import { useUserStore } from '../store/userStore'
import { useBiosensorStore } from '../store/biosensorStore'
import { useAdaptiveLearning } from '../hooks/useAdaptiveLearning'
import { getPersonalizedVocab } from '../data/vocabulary'
import { cognitiveStateLabel, cognitiveStateBg } from '../utils/neuroadaptive'
import type { LessonCard, VocabCategory } from '../types'

const CARDS_PER_LESSON = 10

export default function LessonPage() {
  const { category } = useParams<{ category: string }>()
  const navigate = useNavigate()
  const profile = useUserStore(s => s.profile)
  const { addXp, markWordLearned, markLessonCompleted, updateAccuracy, updateStreak } = useUserStore()
  const { updatePerformance } = useBiosensorStore()
  const adaptiveState = useBiosensorStore(s => s.adaptiveState)
  const connectedDevices = useBiosensorStore(s => s.devices.filter(d => d.status === 'connected'))
  const { buildLessonCards } = useAdaptiveLearning()

  const [cards, setCards] = useState<LessonCard[]>([])
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [fillInput, setFillInput] = useState('')
  const startTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    if (!profile) return
    const lang = profile.activeLanguage
    const interests = profile.interests as VocabCategory[]
    const tags: string[] = []
    if (profile.orientation !== 'prefer-not') tags.push(profile.orientation)
    if (profile.gender !== 'prefer-not') tags.push(profile.gender)
    const words = getPersonalizedVocab(lang, interests, tags)
    const categoryWords = category
      ? words.filter(w => w.category === category || category === 'all')
      : words
    const pool = categoryWords.length >= 5 ? categoryWords : words
    setCards(buildLessonCards(pool, CARDS_PER_LESSON))
    startTimeRef.current = Date.now()
  }, [profile, category, buildLessonCards])

  const current = cards[index]

  const submitAnswer = useCallback((userAnswer: string) => {
    if (answer !== null) return
    const responseTime = Date.now() - startTimeRef.current
    const correct = userAnswer.toLowerCase().trim() === current.correctAnswer.toLowerCase().trim()

    setAnswer(userAnswer)
    setIsCorrect(correct)
    if (correct) setScore(s => s + 1)

    // Update stores
    updatePerformance(correct, responseTime)
    updateAccuracy(profile!.activeLanguage, correct)
    if (correct) markWordLearned(profile!.activeLanguage, current.word.id)

    startTimeRef.current = Date.now()
  }, [answer, current, updatePerformance, updateAccuracy, markWordLearned, profile])

  function next() {
    setAnswer(null)
    setIsCorrect(null)
    setFillInput('')
    if (index + 1 >= cards.length) {
      const lessonId = `lesson-${category}-${Date.now()}`
      const xpEarned = Math.round(score * 12 + (score === cards.length ? 20 : 0))
      addXp(profile!.activeLanguage, xpEarned)
      markLessonCompleted(profile!.activeLanguage, lessonId)
      updateStreak(profile!.activeLanguage)
      setDone(true)
    } else {
      setIndex(i => i + 1)
    }
  }

  function speak(text: string, lang: string) {
    if ('speechSynthesis' in window) {
      const utt = new SpeechSynthesisUtterance(text)
      utt.lang = lang
      utt.rate = 0.85
      window.speechSynthesis.speak(utt)
    }
  }

  if (!profile || cards.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white/50">Loading lesson...</div>
      </div>
    )
  }

  if (done) {
    const pct = Math.round((score / cards.length) * 100)
    const xpEarned = Math.round(score * 12 + (score === cards.length ? 20 : 0))
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-3xl p-8 max-w-md w-full text-center"
        >
          <div className="text-6xl mb-4">{pct === 100 ? '🏆' : pct >= 70 ? '🎉' : '💪'}</div>
          <h2 className="font-display text-3xl font-bold text-white mb-2">
            {pct === 100 ? 'Perfect!' : pct >= 70 ? 'Well Done!' : 'Keep Practising!'}
          </h2>
          <p className="text-white/50 mb-6">
            {score} / {cards.length} correct · {pct}% accuracy
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-2xl font-bold text-gabb-400">+{xpEarned}</p>
              <p className="text-xs text-white/50">XP Earned</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-2xl font-bold text-emerald-400">{score}</p>
              <p className="text-xs text-white/50">Words Correct</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => navigate('/dashboard')}>Dashboard</Button>
            <Button variant="gradient" fullWidth onClick={() => { setIndex(0); setScore(0); setDone(false); setAnswer(null); setIsCorrect(null); }}>
              Again
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  const progress = ((index) / cards.length) * 100

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top bar */}
      <div className="p-4 flex items-center gap-4 max-w-2xl mx-auto w-full">
        <button onClick={() => navigate('/dashboard')} className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
          <X size={20} />
        </button>
        <div className="flex-1">
          <ProgressBar value={progress} color="gradient" height="md" />
        </div>
        <span className="text-sm text-white/50 shrink-0">{index + 1}/{cards.length}</span>

        {/* Adaptive indicator */}
        {connectedDevices.length > 0 && (
          <div className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${cognitiveStateBg(adaptiveState.cognitiveState)}`}>
            <Brain size={11} />
            <span>{cognitiveStateLabel(adaptiveState.cognitiveState)}</span>
          </div>
        )}
      </div>

      {/* Card area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
            >
              {current.type === 'flashcard' && (
                <FlashCard card={current} answer={answer} isCorrect={isCorrect} onAnswer={submitAnswer} onSpeak={speak} lang={profile.activeLanguage} />
              )}
              {current.type === 'multiple-choice' && (
                <MultipleChoice card={current} answer={answer} isCorrect={isCorrect} onAnswer={submitAnswer} onSpeak={speak} lang={profile.activeLanguage} />
              )}
              {current.type === 'fill-blank' && (
                <FillBlank card={current} answer={answer} isCorrect={isCorrect} input={fillInput} setInput={setFillInput} onAnswer={submitAnswer} onSpeak={speak} lang={profile.activeLanguage} />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Answer feedback + Next */}
          <AnimatePresence>
            {answer !== null && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 p-4 rounded-2xl flex items-center justify-between ${isCorrect ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-red-500/15 border border-red-500/30'}`}
              >
                <div className="flex items-center gap-3">
                  {isCorrect
                    ? <CheckCircle2 size={20} className="text-emerald-400" />
                    : <XCircle size={20} className="text-red-400" />}
                  <div>
                    <p className={`font-semibold text-sm ${isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                      {isCorrect ? 'Correct!' : 'Not quite'}
                    </p>
                    {!isCorrect && (
                      <p className="text-xs text-white/60">
                        Answer: <span className="font-semibold text-white">{current.correctAnswer}</span>
                      </p>
                    )}
                    <p className="text-xs text-white/40 mt-0.5 italic">"{current.word.example}"</p>
                  </div>
                </div>
                <Button variant={isCorrect ? 'primary' : 'secondary'} size="md" onClick={next}>
                  Next <ChevronRight size={16} />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ─── Card components ──────────────────────────────────────────────────────────

function CardShell({ children, word, onSpeak, lang }: { children: React.ReactNode; word: LessonCard['word']; onSpeak: (t: string, l: string) => void; lang: string }) {
  return (
    <div className="glass rounded-3xl p-8">
      <div className="flex justify-between items-start mb-6">
        <span className="text-xs text-white/30 uppercase tracking-wider">{word.category}</span>
        <button
          onClick={() => onSpeak(word.native, lang)}
          className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
        >
          <Volume2 size={16} />
        </button>
      </div>
      {children}
    </div>
  )
}

function FlashCard({ card, answer, isCorrect, onAnswer, onSpeak, lang }: { card: LessonCard; answer: string | null; isCorrect: boolean | null; onAnswer: (a: string) => void; onSpeak: (t: string, l: string) => void; lang: string }) {
  const [flipped, setFlipped] = useState(false)

  useEffect(() => { setFlipped(false) }, [card.id])

  return (
    <CardShell word={card.word} onSpeak={onSpeak} lang={lang}>
      <div className="text-center">
        <p className="text-sm text-white/40 mb-2">Translate this word:</p>
        <p className="font-display text-5xl font-bold text-white mb-2">{card.word.native}</p>
        <p className="text-sm text-white/40 italic">{card.word.pronunciation}</p>

        {!flipped && answer === null && (
          <Button variant="secondary" size="md" className="mt-6" onClick={() => setFlipped(true)}>
            Reveal Translation
          </Button>
        )}

        {(flipped || answer !== null) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <p className="text-2xl font-semibold text-gabb-300">{card.word.translation}</p>

            {answer === null && (
              <div className="flex gap-3 mt-4 justify-center">
                <Button variant="danger" size="md" onClick={() => onAnswer('__wrong__')}>
                  <XCircle size={16} /> Didn't know
                </Button>
                <Button variant="primary" size="md" onClick={() => onAnswer(card.correctAnswer)}>
                  <CheckCircle2 size={16} /> Got it!
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </CardShell>
  )
}

function MultipleChoice({ card, answer, isCorrect, onAnswer, onSpeak, lang }: { card: LessonCard; answer: string | null; isCorrect: boolean | null; onAnswer: (a: string) => void; onSpeak: (t: string, l: string) => void; lang: string }) {
  return (
    <CardShell word={card.word} onSpeak={onSpeak} lang={lang}>
      <p className="text-sm text-white/40 mb-2 text-center">What does this mean?</p>
      <p className="font-display text-5xl font-bold text-white text-center mb-2">{card.word.native}</p>
      <p className="text-sm text-white/40 italic text-center mb-8">{card.word.pronunciation}</p>

      <div className="grid grid-cols-2 gap-3">
        {card.options?.map(opt => {
          let style = 'glass hover:bg-white/10'
          if (answer !== null) {
            if (opt === card.correctAnswer) style = 'bg-emerald-500/20 border-emerald-500/50'
            else if (opt === answer && !isCorrect) style = 'bg-red-500/20 border-red-500/50'
          }
          return (
            <button
              key={opt}
              disabled={answer !== null}
              onClick={() => onAnswer(opt)}
              className={`${style} border rounded-xl p-4 text-left text-sm font-medium text-white transition-all`}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </CardShell>
  )
}

function FillBlank({ card, answer, isCorrect, input, setInput, onAnswer, onSpeak, lang }: { card: LessonCard; answer: string | null; isCorrect: boolean | null; input: string; setInput: (v: string) => void; onAnswer: (a: string) => void; onSpeak: (t: string, l: string) => void; lang: string }) {
  return (
    <CardShell word={card.word} onSpeak={onSpeak} lang={lang}>
      <p className="text-sm text-white/40 mb-2 text-center">Type the translation:</p>
      <p className="font-display text-5xl font-bold text-white text-center mb-2">{card.word.native}</p>
      <p className="text-sm text-white/40 italic text-center mb-6">{card.word.pronunciation}</p>

      {card.hint && (
        <p className="text-xs text-center text-white/30 mb-4">Hint: {card.hint}</p>
      )}

      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && input.trim() && answer === null && onAnswer(input.trim())}
        disabled={answer !== null}
        placeholder="Type your answer..."
        autoFocus
        className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-center text-lg placeholder-white/20 outline-none transition focus:ring-2 ${
          answer === null
            ? 'border-white/10 focus:border-gabb-500 focus:ring-gabb-500/20'
            : isCorrect
            ? 'border-emerald-500 bg-emerald-500/10'
            : 'border-red-500 bg-red-500/10'
        }`}
      />
      {answer === null && (
        <Button
          variant="primary"
          fullWidth
          size="lg"
          className="mt-4"
          disabled={!input.trim()}
          onClick={() => onAnswer(input.trim())}
        >
          Check →
        </Button>
      )}
    </CardShell>
  )
}
