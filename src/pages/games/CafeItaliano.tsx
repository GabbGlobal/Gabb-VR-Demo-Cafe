/**
 * Café Italiano — 3-minute mind snack game
 * Cartoon Italian café scene + 12 quick flashcards about ordering food/coffee.
 * Teaches ~700 core words through the café context.
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Volume2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useUserStore } from '../../store/userStore'
import { playFanfare } from '../../utils/fanfare'

const CAFE_WORDS = [
  { it: 'un caffè',         en: 'a coffee',           hint: 'The lifeblood of Rome' },
  { it: 'un cappuccino',    en: 'a cappuccino',        hint: 'Never after 11am — Italians will judge you 😄' },
  { it: 'un cornetto',      en: 'a croissant',         hint: 'Lighter and sweeter than a French croissant' },
  { it: 'il conto',         en: 'the bill',            hint: '"Il conto, per favore" = your magic phrase' },
  { it: 'per favore',       en: 'please',              hint: 'Works everywhere, always appreciated' },
  { it: 'grazie',           en: 'thank you',           hint: '"Grat-zee-yeh" — the most useful word' },
  { it: 'prego',            en: 'you\'re welcome',     hint: 'Also said when handing something to someone' },
  { it: 'quanto costa?',    en: 'how much is it?',     hint: 'Shopping, cafés, taxis — essential everywhere' },
  { it: 'un tavolo per due', en: 'a table for two',    hint: 'Raise two fingers for extra Italian flair 🤌' },
  { it: 'l\'acqua',         en: 'water',               hint: 'Always ask — tap water (gratis) or bottled' },
  { it: 'delizioso!',       en: 'delicious!',          hint: 'Say this and the chef will love you forever' },
  { it: 'vorrei...',        en: 'I would like...',     hint: 'The polite way to order anything' },
]

const WAITER_LINES = [
  'Buongiorno! Cosa desidera?', 'Prego, cosa prende?',
  'Benvenuto! Cosa vuole ordinare?', 'Buon pomeriggio! Cosa le porto?',
]

const SCENE_ITEMS = ['☕', '🥐', '🍷', '🧆', '🎺', '🌺', '🕯️', '📰']

function speak(text: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = 'it-IT'
  utt.rate = 0.85
  window.speechSynthesis.speak(utt)
}

export default function CafeItalianoPage() {
  const navigate = useNavigate()
  const profile = useUserStore(s => s.profile)
  const { addXp, addCoins } = useUserStore()

  const [cardIndex, setCardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [timeLeft, setTimeLeft] = useState(180) // 3 minutes

  const waiter = WAITER_LINES[Math.floor(Math.random() * WAITER_LINES.length)]

  // Timer countdown
  useEffect(() => {
    if (done) return
    const t = setInterval(() => setTimeLeft(s => {
      if (s <= 1) { clearInterval(t); setDone(true); return 0 }
      return s - 1
    }), 1000)
    return () => clearInterval(t)
  }, [done])

  const current = CAFE_WORDS[cardIndex]
  const timerPct = (timeLeft / 180) * 100
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  function gotIt() {
    setScore(s => s + 1)
    advance()
  }

  function missed() {
    advance()
  }

  function advance() {
    if (cardIndex + 1 >= CAFE_WORDS.length) {
      playFanfare(score >= CAFE_WORDS.length - 1 ? 'perfect' : 'complete')
      addXp(profile!.activeLanguage, 25)
      addCoins(score >= 10 ? 20 : 10)
      setDone(true)
    } else {
      setCardIndex(i => i + 1)
      setFlipped(false)
    }
  }

  if (done) {
    const pct = Math.round((score / CAFE_WORDS.length) * 100)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-3xl p-8 max-w-sm w-full text-center"
        >
          <div className="text-5xl mb-3">☕</div>
          <h2 className="font-display text-2xl font-bold text-white mb-1">Benissimo!</h2>
          <p className="text-white/50 text-sm mb-6">{score} of {CAFE_WORDS.length} words nailed · {pct}%</p>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white/5 rounded-xl p-3">
              <p className="font-bold text-gabb-400">+25 XP</p>
              <p className="text-xs text-white/40">XP</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="font-bold text-emerald-400">{score}</p>
              <p className="text-xs text-white/40">Words</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <p className="font-bold text-amber-400">+{score >= 10 ? 20 : 10} 🪙</p>
              <p className="text-xs text-amber-400/60">GGC</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => navigate('/dashboard')}>Dashboard</Button>
            <Button variant="gradient" fullWidth onClick={() => { setCardIndex(0); setFlipped(false); setScore(0); setDone(false); setTimeLeft(180) }}>
              Again ☕
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* Café scene background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Warm amber café glow */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-amber-900/20 to-transparent" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-amber-600/6 rounded-full blur-3xl" />
        {/* Floating café items */}
        {SCENE_ITEMS.map((item, i) => (
          <motion.span
            key={i}
            className="absolute text-2xl opacity-10"
            style={{ left: `${8 + i * 12}%`, top: `${10 + (i % 3) * 25}%` }}
            animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
          >
            {item}
          </motion.span>
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-4 p-4 max-w-2xl mx-auto w-full">
        <button onClick={() => navigate('/dashboard')} className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
          <X size={20} />
        </button>
        <div className="flex-1">
          {/* Timer bar */}
          <div className="flex items-center justify-between text-xs text-white/40 mb-1">
            <span>☕ Caffè Italiano</span>
            <span className={`font-mono font-bold ${timeLeft <= 30 ? 'text-red-400' : 'text-[#4CC8E8]'}`}>
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${timeLeft <= 30 ? 'bg-red-500' : 'bg-gradient-to-r from-amber-500 to-[#4CC8E8]'}`}
              animate={{ width: `${timerPct}%` }}
              transition={{ duration: 0.9 }}
            />
          </div>
        </div>
        <span className="text-sm text-white/50">{cardIndex + 1}/{CAFE_WORDS.length}</span>
      </div>

      {/* Waiter speech */}
      <div className="relative z-10 max-w-2xl mx-auto w-full px-4 mb-2">
        <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <span className="text-2xl">🧑‍🍳</span>
          <p className="text-sm text-amber-200 italic">"{waiter}"</p>
        </div>
      </div>

      {/* Card */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={cardIndex}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.22 }}
            >
              {/* Card */}
              <div className="glass rounded-3xl p-8 border border-amber-500/10 text-center">
                {/* Italian word */}
                <div className="flex items-center justify-center gap-3 mb-2">
                  <p className="font-display text-4xl font-bold text-white">{current.it}</p>
                  <button
                    onClick={() => speak(current.it)}
                    className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                  >
                    <Volume2 size={16} />
                  </button>
                </div>

                {/* Hint always visible */}
                <p className="text-xs text-amber-300/70 italic mb-4">{current.hint}</p>

                {!flipped ? (
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => { setFlipped(true); speak(current.it) }}
                    className="mt-2"
                  >
                    See Translation
                  </Button>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="text-2xl font-semibold text-[#4CC8E8] mb-6">{current.en}</p>
                    <div className="flex gap-3 justify-center">
                      <Button variant="danger" size="md" onClick={missed}>
                        ✗ Missed it
                      </Button>
                      <Button variant="primary" size="md" onClick={gotIt}>
                        ✓ Got it!
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Score dots */}
          <div className="flex justify-center gap-1.5 mt-4">
            {CAFE_WORDS.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all ${
                  i < cardIndex
                    ? i < score ? 'w-2 h-2 bg-emerald-400' : 'w-2 h-2 bg-red-400/60'
                    : i === cardIndex
                    ? 'w-4 h-2 bg-[#4CC8E8]'
                    : 'w-2 h-2 bg-white/15'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
