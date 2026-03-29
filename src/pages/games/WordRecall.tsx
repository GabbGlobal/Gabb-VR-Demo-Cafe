/**
 * Word Recall — aphasia & stroke-friendly vocabulary game.
 *
 * Design principles:
 *  • No timer, no pressure, no failure state
 *  • Extra-large text and tap targets
 *  • Picture + word matching with optional hints
 *  • Tip-of-the-tongue help: first letter, audio, related word
 *  • Calm teal/navy palette — no red errors
 *  • Each round is just one word — learner moves at their own pace
 */
import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, ChevronRight, Lightbulb, RotateCcw, X, Check } from 'lucide-react'
import { useUserStore } from '../../store/userStore'
import { playFanfare } from '../../utils/fanfare'

// ─── Word data (bilingual: Italian shown, English known) ──────────────────────

interface RecallWord {
  emoji: string
  it: string
  en: string
  firstLetter: string
  relatedWord: string   // English word that helps recall
  tip: string           // gentle reminder cue
}

const WORD_SETS: RecallWord[] = [
  { emoji: '☕', it: 'caffè',      en: 'coffee',     firstLetter: 'c', relatedWord: 'café',          tip: 'A warm drink you make in the morning.' },
  { emoji: '🍞', it: 'pane',       en: 'bread',      firstLetter: 'p', relatedWord: 'bakery',         tip: 'You toast it and spread butter on it.' },
  { emoji: '💧', it: 'acqua',      en: 'water',      firstLetter: 'a', relatedWord: 'aqua',           tip: 'Clear liquid you drink when thirsty.' },
  { emoji: '🍎', it: 'mela',       en: 'apple',      firstLetter: 'm', relatedWord: 'fruit',          tip: 'A round red or green fruit.' },
  { emoji: '🐱', it: 'gatto',      en: 'cat',        firstLetter: 'g', relatedWord: 'kitten',         tip: 'A soft animal that purrs.' },
  { emoji: '🐶', it: 'cane',       en: 'dog',        firstLetter: 'c', relatedWord: 'puppy',          tip: 'A loyal pet that wags its tail.' },
  { emoji: '🌞', it: 'sole',       en: 'sun',        firstLetter: 's', relatedWord: 'solar',          tip: 'It rises in the morning and gives warmth.' },
  { emoji: '🌙', it: 'luna',       en: 'moon',       firstLetter: 'l', relatedWord: 'lunar',          tip: 'The bright circle you see at night.' },
  { emoji: '🏠', it: 'casa',       en: 'house',      firstLetter: 'c', relatedWord: 'home',           tip: 'The place where you live.' },
  { emoji: '🚗', it: 'macchina',   en: 'car',        firstLetter: 'm', relatedWord: 'machine',        tip: 'You drive it on the road.' },
  { emoji: '📖', it: 'libro',      en: 'book',       firstLetter: 'l', relatedWord: 'library',        tip: 'Has pages and tells a story.' },
  { emoji: '🌸', it: 'fiore',      en: 'flower',     firstLetter: 'f', relatedWord: 'flora',          tip: 'Colorful and fragrant — grows in gardens.' },
  { emoji: '🎵', it: 'musica',     en: 'music',      firstLetter: 'm', relatedWord: 'musical',        tip: 'Sounds and melodies you listen to.' },
  { emoji: '👨‍👩‍👧', it: 'famiglia',   en: 'family',     firstLetter: 'f', relatedWord: 'familiar',       tip: 'The people closest to you.' },
  { emoji: '❤️', it: 'amore',      en: 'love',       firstLetter: 'a', relatedWord: 'amour',          tip: 'The feeling you have for someone dear.' },
]

// ─── Helper: text-to-speech ───────────────────────────────────────────────────

function speak(text: string) {
  try {
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = 'it-IT'
    utt.rate = 0.75   // slower for accessibility
    utt.pitch = 1
    const load = () => {
      const voices = window.speechSynthesis.getVoices()
      const it = voices.find(v => v.lang.startsWith('it'))
      if (it) utt.voice = it
      window.speechSynthesis.speak(utt)
    }
    if (window.speechSynthesis.getVoices().length) load()
    else window.speechSynthesis.addEventListener('voiceschanged', load, { once: true })
  } catch (_) {}
}

// ─── Shuffle helper ───────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WordRecallPage() {
  const navigate = useNavigate()
  const addXp    = useUserStore(s => s.addXp)
  const addCoins = useUserStore(s => s.addCoins)

  const [deck]         = useState(() => shuffle(WORD_SETS))
  const [idx, setIdx]  = useState(0)
  const [phase, setPhase] = useState<'show' | 'choose' | 'correct' | 'done'>('show')
  const [choices, setChoices] = useState<RecallWord[]>([])
  const [hintLevel, setHintLevel] = useState(0) // 0=none 1=first letter 2=full hint
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)

  const word = deck[idx]

  // Build 4-choice options whenever we enter 'choose' phase
  const buildChoices = useCallback((current: RecallWord) => {
    const others = shuffle(deck.filter(w => w.it !== current.it)).slice(0, 3)
    return shuffle([current, ...others])
  }, [deck])

  // Auto-speak the Italian word when it's shown
  useEffect(() => {
    if (phase === 'show') speak(word.it)
  }, [idx, phase, word.it])

  function startChoose() {
    setChoices(buildChoices(word))
    setHintLevel(0)
    setPhase('choose')
  }

  function handleChoice(chosen: RecallWord) {
    const isCorrect = chosen.it === word.it
    setTotal(t => t + 1)
    if (isCorrect) {
      setScore(s => s + 1)
      playFanfare('ding')
      setPhase('correct')
    } else {
      // Not a failure — just gently show the right answer
      speak(word.it)
      setPhase('correct')
    }
  }

  function next() {
    if (idx + 1 >= deck.length) {
      addXp('it', 60)
      addCoins(10)
      playFanfare('complete')
      setPhase('done')
    } else {
      setIdx(i => i + 1)
      setPhase('show')
      setHintLevel(0)
    }
  }

  function restart() {
    setIdx(0)
    setPhase('show')
    setScore(0)
    setTotal(0)
    setHintLevel(0)
  }

  // ── Done screen ──────────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm space-y-6">
          <div className="text-7xl">🌟</div>
          <h1 className="font-display text-3xl font-extrabold text-white">
            Well done!
          </h1>
          <p className="text-white/60 text-lg">
            {score} of {total} words remembered
          </p>
          <p className="text-white/40 text-sm">
            +60 XP · +10 coins added to your account
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={restart}
              className="w-full py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-lg transition-colors">
              Practice Again
            </button>
            <button onClick={() => navigate('/dashboard')}
              className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 font-medium text-base transition-colors">
              Back to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── Main game UI ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col" style={{ fontSize: '18px' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <button onClick={() => navigate('/dashboard')}
          className="p-2.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors">
          <X size={22} />
        </button>
        <div className="text-center">
          <p className="text-white/50 text-sm">Word Recall</p>
          <p className="text-white font-bold">{idx + 1} / {deck.length}</p>
        </div>
        {/* Progress dots */}
        <div className="flex gap-1">
          {deck.slice(0, Math.min(deck.length, 10)).map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i < idx ? 'bg-teal-400' : i === idx ? 'bg-teal-300' : 'bg-white/15'}`} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-8">

        <AnimatePresence mode="wait">
          <motion.div key={`word-${idx}-${phase}`}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md flex flex-col items-center gap-8">

            {/* Big emoji picture */}
            <motion.div
              animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
              className="w-40 h-40 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center"
              style={{ fontSize: '72px' }}>
              {word.emoji}
            </motion.div>

            {/* SHOW phase — display the word, let them hear it */}
            {phase === 'show' && (
              <div className="text-center space-y-5 w-full">
                <div>
                  <p className="text-white/40 text-base mb-1">The Italian word is:</p>
                  <p className="font-display text-6xl font-extrabold text-white tracking-wide">{word.it}</p>
                  <p className="text-white/50 text-xl mt-2">({word.en})</p>
                </div>
                {/* Hear it button */}
                <button onClick={() => speak(word.it)}
                  className="mx-auto flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-300 hover:bg-teal-500/25 transition-colors text-lg">
                  <Volume2 size={22} />
                  Hear it again
                </button>
                {/* Hint box */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white/50 text-base italic">
                  {word.tip}
                </div>
                {/* Continue */}
                <button onClick={startChoose}
                  className="w-full py-5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-xl transition-colors flex items-center justify-center gap-2">
                  I'm ready — test me
                  <ChevronRight size={24} />
                </button>
              </div>
            )}

            {/* CHOOSE phase — 4 picture+word choices */}
            {phase === 'choose' && (
              <div className="w-full space-y-5">
                <p className="text-center text-white/60 text-lg">Which word matches this picture?</p>

                {/* Tip-of-the-tongue help */}
                <div className="flex justify-center gap-3">
                  {hintLevel < 1 && (
                    <button onClick={() => { setHintLevel(1); speak(word.it[0] + '...') }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 hover:bg-yellow-500/20 transition-colors text-sm">
                      <Lightbulb size={16} />
                      First letter
                    </button>
                  )}
                  {hintLevel >= 1 && hintLevel < 2 && (
                    <button onClick={() => { setHintLevel(2); speak(word.it) }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/25 transition-colors text-sm">
                      <Lightbulb size={16} />
                      More help
                    </button>
                  )}
                  <button onClick={() => speak(word.it)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 hover:bg-teal-500/20 transition-colors text-sm">
                    <Volume2 size={16} />
                    Hear it
                  </button>
                </div>

                {/* Hint display */}
                {hintLevel >= 1 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-center text-yellow-200 text-lg">
                    {hintLevel === 1
                      ? <>Starts with <strong className="text-yellow-100 text-2xl">{word.firstLetter.toUpperCase()}</strong> — related to: <em>{word.relatedWord}</em></>
                      : <>"{word.tip}" — the word is <strong className="text-yellow-100">{word.it}</strong></>
                    }
                  </motion.div>
                )}

                {/* Choice buttons — large tap targets */}
                <div className="grid grid-cols-2 gap-3">
                  {choices.map(c => (
                    <button key={c.it}
                      onClick={() => handleChoice(c)}
                      className="flex flex-col items-center gap-2 py-5 px-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-teal-500/15 hover:border-teal-500/30 active:scale-95 transition-all text-center">
                      <span style={{ fontSize: '36px' }}>{c.emoji}</span>
                      <span className="text-white font-bold text-xl">{c.it}</span>
                      <span className="text-white/40 text-sm">{c.en}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CORRECT phase — gentle positive feedback */}
            {phase === 'correct' && (
              <div className="text-center space-y-6 w-full">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center">
                    <Check size={26} className="text-teal-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-display text-2xl font-bold text-white">{word.it}</p>
                    <p className="text-white/50 text-base">{word.en} · {word.emoji}</p>
                  </div>
                </div>
                <div className="bg-teal-500/10 border border-teal-500/20 rounded-2xl p-4 text-teal-200 text-base">
                  {word.tip}
                </div>
                <button onClick={() => speak(word.it)}
                  className="mx-auto flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors text-lg">
                  <Volume2 size={20} />
                  Hear it one more time
                </button>
                <button onClick={next}
                  className="w-full py-5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-xl transition-colors flex items-center justify-center gap-2">
                  {idx + 1 >= deck.length ? 'See my results' : 'Next word'}
                  <ChevronRight size={24} />
                </button>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer — restart anytime */}
      <div className="pb-6 px-6 flex justify-center">
        <button onClick={restart}
          className="flex items-center gap-2 text-white/30 hover:text-white/60 text-sm transition-colors">
          <RotateCcw size={14} />
          Start over from the beginning
        </button>
      </div>
    </div>
  )
}
