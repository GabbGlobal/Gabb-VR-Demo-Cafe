/**
 * PhraseGame — shared pronunciation drill engine.
 * 20 phrases, mic scoring, streak, 3 attempts per phrase.
 * Each language gets its own config: name, phrases, theme, guide.
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mic, MicOff, SkipForward } from 'lucide-react'
import { useUserStore } from '../../store/userStore'
import { playFanfare } from '../../utils/fanfare'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GamePhrase {
  scene: string       // context label shown above the card
  phrase: string      // target-language phrase to say
  translation: string // English gloss
  tip: string         // cultural or pronunciation tip
}

export interface PhraseGameConfig {
  /** Display name: "Bar Roma", "El Mercado", etc. */
  name: string
  /** Language code for addXp / addCoins */
  langCode: 'it' | 'es' | 'fr' | 'pt'
  /** BCP-47 for SpeechRecognition + TTS */
  bcp47: string
  /** Exactly 20 phrases */
  phrases: GamePhrase[]
  guide: {
    name: string    // "Marco", "Sofia", "Pierre", "Carla"
    role: string    // "Your Barista", "La Vendedora", etc.
    emoji: string   // ☕ 🥘 🥐 🍺
    praise: string  // what they say on correct — "Perfetto!", "¡Muy bien!", etc.
  }
  theme: {
    bg: string        // full CSS for background (gradient)
    glow1: string     // ambient glow color (with alpha)
    glow2: string     // second glow
    primary: string   // accent: gold / saffron / burgundy / green
    muted: string     // muted text color
    card: string      // card background CSS
    border: string    // card border color
    bar: string       // progress bar gradient
  }
  endMessages: {
    great: string
    good: string
    ok: string
    low: string
  }
  xpReward?: number
  coinReward?: number
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function normalize(text: string): string {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip all accents universally
    .replace(/[.,!?¿¡'"«»]/g, '')
    .replace(/\s+/g, ' ').trim()
}

function gabbScore(recognized: string, reference: string): number {
  const rec = normalize(recognized).split(' ').filter(Boolean)
  const ref = normalize(reference).split(' ').filter(Boolean)
  if (!ref.length) return 0
  const refSet = new Set(ref)
  const wordAcc = rec.filter(w => refSet.has(w)).length / ref.length
  const lenRatio = rec.length && ref.length
    ? Math.min(rec.length, ref.length) / Math.max(rec.length, ref.length) : 0
  return Math.min(100, Math.round(100 * (wordAcc * 0.7 + lenRatio * 0.3)))
}

// ─── Component ────────────────────────────────────────────────────────────────

type DotState = 'idle' | 'pass' | 'fail'
type FeedbackType = 'pass' | 'fail' | 'timeout' | null
const MAX_ATTEMPTS = 3

interface Props { config: PhraseGameConfig }

export default function PhraseGame({ config }: Props) {
  const navigate  = useNavigate()
  const addXp     = useUserStore(s => s.addXp)
  const addCoins  = useUserStore(s => s.addCoins)

  const { name, langCode, bcp47, phrases, guide, theme, endMessages } = config
  const xpReward   = config.xpReward   ?? 80
  const coinReward = config.coinReward ?? 15

  const [idx,         setIdx]         = useState(0)
  const [streak,      setStreak]      = useState(0)
  const [totalScore,  setTotalScore]  = useState(0)
  const [scoreCount,  setScoreCount]  = useState(0)
  const [attempts,    setAttempts]    = useState(0)
  const [dots,        setDots]        = useState<DotState[]>(Array(MAX_ATTEMPTS).fill('idle'))
  const [listening,   setListening]   = useState(false)
  const [transcript,  setTranscript]  = useState('')
  const [feedback,    setFeedback]    = useState<FeedbackType>(null)
  const [feedbackPct, setFeedbackPct] = useState(0)
  const [tip,         setTip]         = useState('')
  const [done,        setDone]        = useState(false)
  const [locked,      setLocked]      = useState(false)

  const recRef       = useRef<any>(null)
  const listeningRef = useRef(false)
  const attemptsRef  = useRef(0)
  const idxRef       = useRef(0)

  useEffect(() => { attemptsRef.current = attempts }, [attempts])
  useEffect(() => { idxRef.current = idx }, [idx])

  // Auto-speak phrase on load
  useEffect(() => {
    if (done) return
    const p = phrases[idx]
    if (!p) return
    const t = setTimeout(() => {
      window.speechSynthesis.cancel()
      const utt = new SpeechSynthesisUtterance(p.phrase)
      utt.lang = bcp47; utt.rate = 0.78; utt.pitch = 1.05
      const go = () => window.speechSynthesis.speak(utt)
      window.speechSynthesis.getVoices().length === 0
        ? window.speechSynthesis.addEventListener('voiceschanged', go, { once: true })
        : go()
    }, 300)
    return () => clearTimeout(t)
  }, [idx, done, phrases, bcp47])

  function markDot(type: 'pass' | 'fail') {
    setDots(prev => {
      const next = [...prev]
      const i = next.findIndex(d => d === 'idle')
      if (i >= 0) next[i] = type
      return next
    })
  }

  function advance() {
    const next = idxRef.current + 1
    if (next >= phrases.length) {
      setDone(true)
      playFanfare('perfect')
      addXp(langCode, xpReward)
      addCoins(coinReward)
      return
    }
    setIdx(next)
    setAttempts(0)
    setDots(Array(MAX_ATTEMPTS).fill('idle'))
    setFeedback(null); setFeedbackPct(0)
    setTip(''); setTranscript(''); setLocked(false)
  }

  const handleScore = useCallback((pct: number, heard: string) => {
    const pass = pct >= 85
    setTotalScore(s => s + pct)
    setScoreCount(s => s + 1)
    setTranscript(heard ? `You said: "${heard}"` : '')
    setFeedbackPct(pct)

    if (pass) {
      markDot('pass')
      setFeedback('pass')
      setStreak(s => s + 1)
      setTip(phrases[idxRef.current].tip)
      setLocked(true)
      addXp(langCode, 10); addCoins(2)
      window.speechSynthesis.cancel()
      const praise = new SpeechSynthesisUtterance(guide.praise)
      praise.lang = bcp47; praise.rate = 1.0
      window.speechSynthesis.speak(praise)
      setTimeout(advance, 2200)
    } else {
      markDot('fail')
      setStreak(0)
      setTip(phrases[idxRef.current].tip)
      const next = attemptsRef.current + 1
      setAttempts(next)
      if (next >= MAX_ATTEMPTS) {
        setFeedback('timeout')
        setLocked(true)
        setTimeout(() => { setFeedback(null); setTip(''); setTranscript(''); setTimeout(advance, 400) }, 2000)
      } else {
        setFeedback('fail')
      }
    }
  }, [langCode, bcp47, phrases, guide.praise, addXp, addCoins]) // eslint-disable-line react-hooks/exhaustive-deps

  function startMic() {
    if (locked) return
    if (listeningRef.current) { stopMic(); return }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Voice recognition needs Chrome or Edge.'); return }
    const rec = new SR()
    rec.lang = bcp47; rec.continuous = false
    rec.interimResults = false; rec.maxAlternatives = 5
    recRef.current = rec
    listeningRef.current = true
    setListening(true); setFeedback(null); setTranscript('')

    rec.onresult = (e: any) => {
      listeningRef.current = false; setListening(false)
      const results = Array.from(e.results[0] as any[]).map((r: any) => r.transcript as string)
      const scores  = results.map(r => gabbScore(r, phrases[idxRef.current].phrase))
      handleScore(Math.max(...scores), results[0])
    }
    rec.onerror = (e: any) => {
      listeningRef.current = false; setListening(false)
      if (e.error === 'no-speech') handleScore(0, '')
    }
    rec.onend = () => { listeningRef.current = false; setListening(false) }
    try { rec.start() } catch { listeningRef.current = false; setListening(false) }
  }

  function stopMic() {
    listeningRef.current = false
    recRef.current?.stop()
    setListening(false)
  }

  function restart() {
    window.speechSynthesis.cancel()
    setIdx(0); setStreak(0); setTotalScore(0); setScoreCount(0)
    setAttempts(0); setDots(Array(MAX_ATTEMPTS).fill('idle'))
    setFeedback(null); setFeedbackPct(0); setTip('')
    setTranscript(''); setDone(false); setLocked(false)
  }

  const phrase      = phrases[idx]
  const progressPct = Math.round((idx / phrases.length) * 100)
  const avgScore    = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0

  // ── End screen ───────────────────────────────────────────────────────────────
  if (done) {
    const msg = avgScore >= 90 ? endMessages.great
              : avgScore >= 75 ? endMessages.good
              : avgScore >= 55 ? endMessages.ok
              :                  endMessages.low
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
        style={{ background: theme.bg }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl"
            style={{ background: theme.glow1 }} />
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-sm text-center space-y-6">

          <motion.div animate={{ rotate: [-4, 4, -4], scale: [1, 1.08, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }} style={{ fontSize: '72px' }}>
            {guide.emoji}
          </motion.div>

          <h1 className="font-display text-3xl font-extrabold" style={{ color: theme.primary }}>
            {guide.praise}
          </h1>

          {/* Score ring */}
          <div className="mx-auto w-28 h-28 rounded-full flex items-center justify-center relative"
            style={{ background: `conic-gradient(${theme.primary} ${avgScore}%, ${theme.border} ${avgScore}%)` }}>
            <div className="absolute inset-2.5 rounded-full flex items-center justify-center text-2xl font-bold"
              style={{ background: '#141414', color: '#fff' }}>
              {avgScore}%
            </div>
          </div>

          <p className="text-sm leading-relaxed" style={{ color: theme.muted }}>{msg}</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4 text-center border" style={{ background: theme.glow1, borderColor: theme.border }}>
              <p className="text-2xl font-bold" style={{ color: theme.primary }}>{streak}</p>
              <p className="text-xs" style={{ color: theme.muted }}>Final streak 🔥</p>
            </div>
            <div className="rounded-2xl p-4 text-center border" style={{ background: theme.glow1, borderColor: theme.border }}>
              <p className="text-2xl font-bold" style={{ color: theme.primary }}>+{coinReward}</p>
              <p className="text-xs" style={{ color: theme.muted }}>GGC earned 🪙</p>
            </div>
          </div>

          <motion.button whileTap={{ scale: 0.97 }} onClick={restart}
            className="w-full py-4 rounded-2xl font-bold text-lg text-white"
            style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.muted})` }}>
            Try Again
          </motion.button>
          <button onClick={() => navigate('/dashboard')} className="w-full text-sm" style={{ color: theme.muted }}>
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    )
  }

  // ── Main game ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: theme.bg }}>

      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-64 rounded-full blur-3xl"
          style={{ background: theme.glow1 }} />
        <div className="absolute bottom-0 left-[20%] w-64 h-64 rounded-full blur-3xl"
          style={{ background: theme.glow2 }} />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center gap-3 px-5 py-4 max-w-2xl mx-auto w-full">
        <button onClick={() => { window.speechSynthesis.cancel(); navigate('/dashboard') }}
          className="p-2 rounded-xl hover:bg-white/10 transition-colors" style={{ color: theme.muted }}>
          <X size={20} />
        </button>
        <p className="font-serif italic shrink-0 text-sm font-semibold" style={{ color: theme.primary }}>{name}</p>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: theme.border }}>
          <motion.div className="h-full rounded-full" style={{ background: theme.bar }}
            animate={{ width: `${progressPct}%` }} transition={{ type: 'spring', stiffness: 200 }} />
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shrink-0 border"
          style={{ background: theme.glow1, borderColor: theme.border, color: theme.primary }}>
          🔥 {streak}
        </div>
      </div>

      {/* Guide avatar */}
      <div className="relative z-10 text-center mb-2">
        <motion.div
          animate={listening ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={{ duration: 0.6, repeat: listening ? Infinity : 0 }}
          className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center text-3xl border-2 shadow-lg"
          style={{ background: theme.card, borderColor: theme.primary, boxShadow: `0 0 24px ${theme.glow2}` }}>
          {guide.emoji}
        </motion.div>
        <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: theme.primary }}>
          {guide.name} — {guide.role}
        </p>
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 pb-6 max-w-2xl mx-auto w-full gap-4">
        <p className="text-xs uppercase tracking-widest" style={{ color: theme.muted }}>{phrase.scene}</p>

        <AnimatePresence mode="wait">
          <motion.div key={idx}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 1.02 }}
            className="w-full rounded-2xl p-8 text-center relative overflow-hidden border"
            style={{ background: theme.card, borderColor: theme.border,
              boxShadow: `0 0 0 1px ${theme.glow1} inset, 0 24px 60px #00000070` }}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${theme.primary}, transparent)` }} />

            <p className="text-xs uppercase tracking-wider mb-5" style={{ color: theme.muted }}>
              Phrase {idx + 1} of {phrases.length}
            </p>

            <motion.p key={`ph-${idx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="font-serif text-3xl sm:text-4xl leading-tight mb-3 min-h-[2.5em] flex items-center justify-center"
              style={{ color: '#fff9f0' }}>
              {phrase.phrase}
            </motion.p>

            <p className="text-sm italic mb-6" style={{ color: theme.muted }}>{phrase.translation}</p>

            <div className="min-h-14 flex flex-col items-center justify-center gap-1">
              <AnimatePresence mode="wait">
                {feedback && (
                  <motion.div key={feedback}
                    initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-1">
                    <span className="text-3xl">
                      {feedback === 'pass' ? '✅' : feedback === 'timeout' ? '❌' : '🔄'}
                    </span>
                    {feedbackPct > 0 && (
                      <span className="text-sm font-semibold"
                        style={{ color: feedback === 'pass' ? '#4caf6e' : '#d94f4f' }}>
                        Score: {feedbackPct}%
                      </span>
                    )}
                    {tip && (
                      <p className="text-xs text-center max-w-xs leading-relaxed" style={{ color: theme.muted }}>
                        {feedback === 'pass' ? `${guide.praise} ${tip}` : tip}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {transcript && (
              <p className="text-xs italic mt-2" style={{ color: theme.muted }}>{transcript}</p>
            )}

            <div className="flex justify-center gap-2 mt-4">
              {dots.map((d, i) => (
                <motion.div key={i}
                  animate={{ scale: d !== 'idle' ? [1, 1.4, 1] : 1 }}
                  className="w-2.5 h-2.5 rounded-full transition-colors"
                  style={{ background: d === 'pass' ? '#4caf6e' : d === 'fail' ? '#d94f4f' : theme.border }} />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Mic button */}
        <motion.button
          whileHover={!locked ? { scale: 1.06 } : {}}
          whileTap={!locked ? { scale: 0.94 } : {}}
          onClick={startMic}
          className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl relative"
          style={{
            background: locked ? '#2a2a2a'
              : listening ? 'linear-gradient(145deg,#e85555,#c03030)'
              : `linear-gradient(145deg,${theme.primary},${theme.muted})`,
            opacity: locked ? 0.5 : 1,
            cursor: locked ? 'not-allowed' : 'pointer',
          }}>
          {listening ? <MicOff size={30} color="#fff9f0" /> : <Mic size={30} color="#fff9f0" />}
          {listening && (
            <motion.div className="absolute inset-0 rounded-full border-2"
              style={{ borderColor: '#e85555' }}
              animate={{ scale: [1, 1.5], opacity: [0.7, 0] }}
              transition={{ duration: 1, repeat: Infinity }} />
          )}
        </motion.button>

        <p className="text-xs uppercase tracking-widest" style={{ color: theme.muted }}>
          {listening ? 'Listening…' : locked ? 'Moving on…' : 'Tap & Speak'}
        </p>

        {listening && (
          <div className="flex gap-1 items-center">
            {[0,1,2,3,4].map(i => (
              <motion.div key={i} className="w-1 rounded-full"
                style={{ background: theme.primary }}
                animate={{ height: ['4px','20px','4px'] }}
                transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }} />
            ))}
          </div>
        )}

        <button onClick={() => { stopMic(); setStreak(0); advance() }}
          className="flex items-center gap-1.5 text-xs uppercase tracking-wider px-5 py-2 rounded-full border transition-colors"
          style={{ borderColor: theme.border, color: theme.muted }}>
          <SkipForward size={13} /> Skip phrase
        </button>
      </div>
    </div>
  )
}
