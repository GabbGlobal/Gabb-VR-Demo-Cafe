import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Brain, CheckCircle2, XCircle, ChevronRight, Volume2, Turtle, RotateCcw, Mic, Coins } from 'lucide-react'
import { playFanfare } from '../utils/fanfare'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/Progress'
import MnemonicPopup from '../components/lesson/MnemonicPopup'
import Gabby, { useGabby } from '../components/mascot/Gabby'
import { useUserStore } from '../store/userStore'
import { useBiosensorStore } from '../store/biosensorStore'
import { useAdaptiveLearning } from '../hooks/useAdaptiveLearning'
import { getPersonalizedVocab } from '../data/vocabulary'
import { cognitiveStateLabel, cognitiveStateBg } from '../utils/neuroadaptive'
import type { LessonCard, VocabCategory } from '../types'

const CARDS_PER_LESSON = 10
const CARD_TIMER_SECONDS = 10

// ─── Buddy Hackett celebrate messages ─────────────────────────────────────────
const CELEBRATE_MSGS = [
  "You got it! Even I can't remember where I parked my car, but YOU nailed that word! 🔥",
  "Three in a row! At this rate you'll be arguing with Roman waiters by Thursday! 🏆",
  "Magnifico! Your brain is soaking this up like pasta soaks up sauce! 🍝",
  "Bravissimo! You're on fire — and not from the espresso! ☕🔥",
  "Keep going! I've been mispronouncing 'bruschetta' for 20 years and YOU just got it right! 🎉",
]

const ENCOURAGE_MSGS = [
  "Wrong answer? Hey — I've been mispronouncing 'gnocchi' since 1987. You've got time! 💪",
  "Don't sweat it! Even Marco Polo got lost occasionally. We'll circle back to this one! 🗺️",
  "Not quite — but you said it with CONFIDENCE, and in Italy that counts for everything! 😄",
  "Mistakes are just the brain's way of saying 'save this one for later.' It will! 🧠",
  "Nobody learned Italian in a day. Except maybe Julius Caesar, and look how that worked out! 🤌",
]

function randomFrom(arr: string[]) { return arr[Math.floor(Math.random() * arr.length)] }

export default function LessonPage() {
  const { category } = useParams<{ category: string }>()
  const navigate = useNavigate()
  const profile = useUserStore(s => s.profile)
  const { addXp, addCoins, markWordLearned, markWordMissed, markLessonCompleted, updateAccuracy, updateStreak } = useUserStore()
  const { updatePerformance } = useBiosensorStore()
  const adaptiveState = useBiosensorStore(s => s.adaptiveState)
  const connectedDevices = useBiosensorStore(s => s.devices.filter(d => d.status === 'connected'))
  const { buildLessonCards } = useAdaptiveLearning()

  const [cards, setCards] = useState<LessonCard[]>([])
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [coinsEarnedThisLesson, setCoinsEarnedThisLesson] = useState(0)
  const [done, setDone] = useState(false)
  const [fillInput, setFillInput] = useState('')
  const [showMnemonic, setShowMnemonic] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(CARD_TIMER_SECONDS)
  const startTimeRef = useRef<number>(Date.now())
  const { message: gabbyMsg, celebrate, encourage } = useGabby()

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

  // ── Countdown timer — reset on each card ──────────────────────────────────
  useEffect(() => {
    if (answer !== null) return // already answered, don't start
    setTimerSeconds(CARD_TIMER_SECONDS)
    const interval = setInterval(() => {
      setTimerSeconds(prev => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [index]) // eslint-disable-line react-hooks/exhaustive-deps

  // Stop timer when answered
  useEffect(() => {
    if (answer !== null) setTimerSeconds(0)
  }, [answer])

  // Auto-submit as wrong when timer hits 0
  useEffect(() => {
    if (timerSeconds === 0 && answer === null && cards.length > 0) {
      submitAnswer('__timeout__')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerSeconds])

  const current = cards[index]

  const submitAnswer = useCallback((userAnswer: string) => {
    if (answer !== null) return
    const responseTime = Date.now() - startTimeRef.current
    const correct = userAnswer !== '__timeout__' &&
      userAnswer.toLowerCase().trim() === current.correctAnswer.toLowerCase().trim()

    setAnswer(userAnswer)
    setIsCorrect(correct)
    if (correct) {
      addCoins(5)
      setCoinsEarnedThisLesson(c => c + 5)
      setScore(s => {
        const next = s + 1
        if (next % 3 === 0) celebrate(randomFrom(CELEBRATE_MSGS))
        return next
      })
    } else {
      encourage(randomFrom(ENCOURAGE_MSGS))
      markWordMissed(profile!.activeLanguage, current.word.id)
    }

    updatePerformance(correct, responseTime)
    updateAccuracy(profile!.activeLanguage, correct)
    if (correct) markWordLearned(profile!.activeLanguage, current.word.id)

    startTimeRef.current = Date.now()
  }, [answer, current, updatePerformance, updateAccuracy, markWordLearned, markWordMissed, profile, celebrate, encourage])

  function next() {
    setAnswer(null)
    setIsCorrect(null)
    setFillInput('')
    setShowMnemonic(false)
    if (index + 1 >= cards.length) {
      const lessonId = `lesson-${category}-${Date.now()}`
      const xpEarned = Math.round(score * 12 + (score === cards.length ? 20 : 0))
      const isPerfect = score === cards.length
      const bonusCoins = isPerfect ? 50 : 20
      addXp(profile!.activeLanguage, xpEarned)
      addCoins(bonusCoins)
      setCoinsEarnedThisLesson(c => c + bonusCoins)
      markLessonCompleted(profile!.activeLanguage, lessonId)
      updateStreak(profile!.activeLanguage)
      playFanfare(isPerfect ? 'perfect' : 'complete')
      setDone(true)
    } else {
      setIndex(i => i + 1)
    }
  }

  function speak(text: string, lang: string, rate = 0.85) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utt = new SpeechSynthesisUtterance(text)
      utt.lang = lang
      utt.rate = rate
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

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-2xl font-bold text-gabb-400">+{xpEarned}</p>
              <p className="text-xs text-white/50">XP</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-2xl font-bold text-emerald-400">{score}</p>
              <p className="text-xs text-white/50">Correct</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <p className="text-2xl font-bold text-amber-400">+{coinsEarnedThisLesson}</p>
              <p className="text-xs text-amber-400/60">🪙 GGC</p>
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

        {/* Countdown ring */}
        {answer === null && (
          <TimerRing seconds={timerSeconds} total={CARD_TIMER_SECONDS} />
        )}

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

          {/* Mnemonic popup — show after wrong answer */}
          {answer !== null && !isCorrect && !showMnemonic && (
            <div className="mt-3">
              <button
                onClick={() => setShowMnemonic(true)}
                className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
              >
                💡 Show memory hook for "{current.word.native}"
              </button>
            </div>
          )}
          {showMnemonic && current && (
            <div className="mt-3">
              <MnemonicPopup word={current.word} onDismiss={() => setShowMnemonic(false)} />
            </div>
          )}

          {/* Answer feedback + Next */}
          <AnimatePresence>
            {answer !== null && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 p-4 rounded-2xl flex items-center justify-between ${
                  isCorrect
                    ? 'bg-emerald-500/15 border border-emerald-500/30'
                    : 'bg-red-500/15 border border-red-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isCorrect
                    ? <CheckCircle2 size={20} className="text-emerald-400" />
                    : <XCircle size={20} className="text-red-400" />}
                  <div>
                    <p className={`font-semibold text-sm ${isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                      {answer === '__timeout__' ? 'Time\'s up!' : isCorrect ? 'Correct!' : 'Not quite'}
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
      <Gabby message={gabbyMsg} />
    </div>
  )
}

// ─── Timer ring ───────────────────────────────────────────────────────────────

function TimerRing({ seconds, total }: { seconds: number; total: number }) {
  const r = 14
  const circ = 2 * Math.PI * r
  const pct = seconds / total
  const color = seconds <= 3 ? '#ef4444' : seconds <= 6 ? '#f59e0b' : '#22c55e'
  return (
    <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
        <circle
          cx="18" cy="18" r={r} fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={`${pct * circ} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.9s linear, stroke 0.3s' }}
        />
      </svg>
      <span className={`text-[11px] font-bold tabular-nums ${seconds <= 3 ? 'text-red-400' : 'text-white/60'}`}>
        {seconds}
      </span>
    </div>
  )
}

// ─── Pronunciation panel ──────────────────────────────────────────────────────

function PronunciationPanel({ word, lang, onSpeak }: { word: { native: string; pronunciation: string }; lang: string; onSpeak: (text: string, lang: string, rate?: number) => void }) {
  const [listening, setListening] = useState(false)

  function tryMic() {
    // Web Speech Recognition — hint only (full scoring requires native app)
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.lang = lang
    rec.interimResults = false
    rec.maxAlternatives = 1
    setListening(true)
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    rec.start()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 flex items-center justify-center gap-2 flex-wrap"
    >
      <button
        onClick={() => onSpeak(word.native, lang, 0.85)}
        className="flex items-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-white/60 hover:text-white transition-all"
        title="Play at normal speed"
      >
        <Volume2 size={12} /> Normal
      </button>
      <button
        onClick={() => onSpeak(word.native, lang, 0.45)}
        className="flex items-center gap-1.5 text-xs bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg px-3 py-1.5 text-amber-300 hover:text-amber-200 transition-all"
        title="Play slowly"
      >
        <Turtle size={12} /> Slow
      </button>
      <button
        onClick={() => onSpeak(word.native, lang, 0.85)}
        className="flex items-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-white/60 hover:text-white transition-all"
        title="Repeat"
      >
        <RotateCcw size={12} /> Repeat
      </button>
      <button
        onClick={tryMic}
        className={`flex items-center gap-1.5 text-xs border rounded-lg px-3 py-1.5 transition-all ${
          listening
            ? 'bg-red-500/20 border-red-500/40 text-red-300 animate-pulse'
            : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-300 hover:text-emerald-200'
        }`}
        title="Say it out loud"
      >
        <Mic size={12} /> {listening ? 'Listening…' : 'Say it'}
      </button>
    </motion.div>
  )
}

// ─── Card components ──────────────────────────────────────────────────────────

function CardShell({ children, word, onSpeak, lang, showPronPanel = false }: {
  children: React.ReactNode
  word: LessonCard['word']
  onSpeak: (t: string, l: string, rate?: number) => void
  lang: string
  showPronPanel?: boolean
}) {
  return (
    <div className="glass rounded-3xl p-8">
      <div className="flex justify-between items-start mb-6">
        <span className="text-xs text-white/30 uppercase tracking-wider">{word.category}</span>
        <button
          onClick={() => onSpeak(word.native, lang)}
          className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          title="Listen"
        >
          <Volume2 size={16} />
        </button>
      </div>
      {children}
      {showPronPanel && (
        <PronunciationPanel word={word} lang={lang} onSpeak={onSpeak} />
      )}
    </div>
  )
}

function FlashCard({ card, answer, isCorrect, onAnswer, onSpeak, lang }: { card: LessonCard; answer: string | null; isCorrect: boolean | null; onAnswer: (a: string) => void; onSpeak: (t: string, l: string, rate?: number) => void; lang: string }) {
  const [flipped, setFlipped] = useState(false)

  useEffect(() => { setFlipped(false) }, [card.id])

  return (
    <CardShell word={card.word} onSpeak={onSpeak} lang={lang} showPronPanel={flipped || answer !== null}>
      <div className="text-center">
        <p className="text-sm text-white/40 mb-2">Translate this word:</p>
        <p className="font-display text-5xl font-bold text-white mb-2">{card.word.native}</p>
        <p className="text-sm text-white/40 italic">{card.word.pronunciation}</p>

        {!flipped && answer === null && (
          <Button variant="secondary" size="md" className="mt-6" onClick={() => {
            setFlipped(true)
            onSpeak(card.word.native, lang)
          }}>
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

function MultipleChoice({ card, answer, isCorrect, onAnswer, onSpeak, lang }: { card: LessonCard; answer: string | null; isCorrect: boolean | null; onAnswer: (a: string) => void; onSpeak: (t: string, l: string, rate?: number) => void; lang: string }) {
  return (
    <CardShell word={card.word} onSpeak={onSpeak} lang={lang} showPronPanel={answer !== null && !!isCorrect}>
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

function FillBlank({ card, answer, isCorrect, input, setInput, onAnswer, onSpeak, lang }: { card: LessonCard; answer: string | null; isCorrect: boolean | null; input: string; setInput: (v: string) => void; onAnswer: (a: string) => void; onSpeak: (t: string, l: string, rate?: number) => void; lang: string }) {
  return (
    <CardShell word={card.word} onSpeak={onSpeak} lang={lang} showPronPanel={answer !== null}>
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
