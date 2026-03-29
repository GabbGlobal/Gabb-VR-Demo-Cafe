/**
 * Caffè Roma — 20-phrase Italian pronunciation game.
 * Ported from standalone HTML version. Uses Web Speech API for recognition
 * + client-side gabbScore for immediate feedback.
 * Optional: swap gabbScore for Azure Pronunciation Assessment via server.py.
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mic, MicOff, SkipForward } from 'lucide-react'
import { useUserStore } from '../../store/userStore'
import { playFanfare } from '../../utils/fanfare'

// ─── Phrase data ─────────────────────────────────────────────────────────────

const PHRASES = [
  { scene: 'Entering the Café',  it: 'Buongiorno!',                    en: 'Good morning!',                          tip: "Roll the 'r' in buonGIORno — warm and sunny." },
  { scene: 'Entering the Café',  it: 'Buongiorno, come sta?',          en: 'Good morning, how are you?',             tip: '"Come sta" is formal — right for a stranger.' },
  { scene: 'Finding a Seat',     it: "C'è un tavolo libero?",          en: 'Is there a free table?',                 tip: 'TAH-vo-lo — stress on the first syllable.' },
  { scene: 'Getting Attention',  it: 'Mi scusi!',                      en: 'Excuse me!',                             tip: 'Classic way to flag down a barista in Italy.' },
  { scene: 'Ordering Coffee',    it: 'Un caffè, per favore.',          en: 'A coffee, please.',                      tip: "In Italy 'caffè' means espresso — short and strong!" },
  { scene: 'Ordering Coffee',    it: 'Vorrei un cappuccino.',          en: 'I would like a cappuccino.',             tip: 'Vor-REI — polite form. No cappuccino after 11am!' },
  { scene: 'Ordering Coffee',    it: 'Un macchiato, per piacere.',     en: 'A macchiato, please.',                   tip: "'Per piacere' and 'per favore' are interchangeable." },
  { scene: 'Ordering Food',      it: 'Avete dei cornetti freschi?',    en: 'Do you have fresh croissants?',          tip: 'A cornetto is the Italian croissant — sweeter and buttery.' },
  { scene: 'Ordering Food',      it: 'Vorrei un cornetto alla crema.', en: 'I would like a cream-filled croissant.', tip: 'KREM-ah — the classic Italian pastry filling.' },
  { scene: 'Ordering Food',      it: "Cos'è questo?",                  en: 'What is this?',                          tip: 'Point and ask — Italians love showing off their pastries.' },
  { scene: 'Customizing',        it: 'Con latte caldo, per favore.',   en: 'With warm milk, please.',                tip: 'LAT-teh — ask for coffee customized this way.' },
  { scene: 'Customizing',        it: 'Senza zucchero, grazie.',        en: 'Without sugar, thank you.',              tip: "DZOOK-keh-ro = sugar. 'Senza' = without." },
  { scene: 'Waiting',            it: 'Quanto tempo ci vuole?',         en: 'How long will it take?',                 tip: "Literal: 'how much time does it need?'" },
  { scene: 'Asking the Price',   it: 'Quanto costa?',                  en: 'How much does it cost?',                 tip: 'KWAHN-to KOS-tah — the most useful Italian phrase.' },
  { scene: 'Asking the Price',   it: 'Quanto viene in totale?',        en: 'How much is it in total?',               tip: "'viene' means 'comes to' as in the total." },
  { scene: 'Paying',             it: 'Il conto, per favore.',          en: 'The bill, please.',                      tip: "Always ask — Italian staff won't bring it unannounced." },
  { scene: 'Paying',             it: 'Posso pagare con carta?',        en: 'Can I pay by card?',                     tip: 'Some small cafes are cash-only — good to ask.' },
  { scene: 'Paying',             it: 'Tenga il resto.',                en: 'Keep the change.',                       tip: 'TEHN-gah — a generous gesture Italians appreciate.' },
  { scene: 'Compliments',        it: 'Era delizioso, grazie mille!',   en: 'It was delicious, thank you so much!',   tip: 'DEH-lee-TSYO-so — compliments go a long way here.' },
  { scene: 'Saying Goodbye',     it: 'Arrivederci, a presto!',         en: 'Goodbye, see you soon!',                 tip: "Ah-ree-veh-DEHR-chee. 'A presto' = until soon." },
]

const MAX_ATTEMPTS = 3

// ─── Scoring ──────────────────────────────────────────────────────────────────

function normalizeIT(text: string): string {
  return text.toLowerCase()
    .replace(/[àá]/g,'a').replace(/[èé]/g,'e')
    .replace(/[ìí]/g,'i').replace(/[òó]/g,'o').replace(/[ùú]/g,'u')
    .replace(/[.,!?']/g,'').trim()
}

function gabbScore(recognized: string, reference: string): number {
  const rec = normalizeIT(recognized).split(/\s+/).filter(Boolean)
  const ref = normalizeIT(reference).split(/\s+/).filter(Boolean)
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

export default function CaffeRomaPage() {
  const navigate = useNavigate()
  const addXp    = useUserStore(s => s.addXp)
  const addCoins = useUserStore(s => s.addCoins)
  const profile  = useUserStore(s => s.profile)
  const lang     = (profile?.activeLanguage ?? 'it') as 'it'

  const [idx,        setIdx]        = useState(0)
  const [streak,     setStreak]     = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [scoreCount, setScoreCount] = useState(0)
  const [attempts,   setAttempts]   = useState(0)
  const [dots,       setDots]       = useState<DotState[]>(Array(MAX_ATTEMPTS).fill('idle'))
  const [listening,  setListening]  = useState(false)
  const [transcript, setTranscript] = useState('')
  const [feedback,   setFeedback]   = useState<FeedbackType>(null)
  const [feedbackPct, setFeedbackPct] = useState(0)
  const [tip,        setTip]        = useState('')
  const [done,       setDone]       = useState(false)
  const [locked,     setLocked]     = useState(false) // locked between phrases

  const recRef        = useRef<any>(null)
  const listeningRef  = useRef(false)
  const attemptsRef   = useRef(0)
  const dotsRef       = useRef<DotState[]>(Array(MAX_ATTEMPTS).fill('idle'))
  const idxRef        = useRef(0)

  useEffect(() => { attemptsRef.current = attempts }, [attempts])
  useEffect(() => { dotsRef.current = dots }, [dots])
  useEffect(() => { idxRef.current = idx }, [idx])

  // Auto-speak the Italian phrase whenever the phrase changes
  useEffect(() => {
    if (done) return
    const p = PHRASES[idx]
    if (!p) return
    const t = setTimeout(() => {
      window.speechSynthesis.cancel()
      const utt = new SpeechSynthesisUtterance(p.it)
      utt.lang = 'it-IT'; utt.rate = 0.78; utt.pitch = 1.05
      const go = () => window.speechSynthesis.speak(utt)
      window.speechSynthesis.getVoices().length === 0
        ? window.speechSynthesis.addEventListener('voiceschanged', go, { once: true })
        : go()
    }, 300)
    return () => clearTimeout(t)
  }, [idx, done])

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
    if (next >= PHRASES.length) {
      setDone(true)
      playFanfare('perfect')
      addXp(lang, 80)
      addCoins(15)
      return
    }
    setIdx(next)
    setAttempts(0)
    setDots(Array(MAX_ATTEMPTS).fill('idle'))
    setFeedback(null)
    setFeedbackPct(0)
    setTip('')
    setTranscript('')
    setLocked(false)
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
      setTip(PHRASES[idxRef.current].tip)
      setLocked(true)
      addXp(lang, 10)
      addCoins(2)
      window.speechSynthesis.cancel()
      const praise = new SpeechSynthesisUtterance('Perfetto!')
      praise.lang = 'it-IT'; praise.rate = 1.0
      window.speechSynthesis.speak(praise)
      setTimeout(advance, 2200)
    } else {
      markDot('fail')
      setStreak(0)
      setTip(PHRASES[idxRef.current].tip)
      const nextAttempts = attemptsRef.current + 1
      setAttempts(nextAttempts)
      if (nextAttempts >= MAX_ATTEMPTS) {
        setFeedback('timeout')
        setLocked(true)
        setTimeout(() => {
          setFeedback(null); setTip(''); setTranscript('')
          setTimeout(advance, 400)
        }, 2000)
      } else {
        setFeedback('fail')
      }
    }
  }, [lang, addXp, addCoins]) // eslint-disable-line react-hooks/exhaustive-deps

  function startMic() {
    if (locked) return
    if (listeningRef.current) { stopMic(); return }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Voice needs Chrome or Edge.'); return }

    const rec = new SR()
    rec.lang = 'it-IT'
    rec.continuous = false
    rec.interimResults = false
    rec.maxAlternatives = 5
    recRef.current = rec
    listeningRef.current = true
    setListening(true)
    setFeedback(null)
    setTranscript('')

    rec.onresult = (e: any) => {
      listeningRef.current = false
      setListening(false)
      const results = Array.from(e.results[0] as any[]).map((r: any) => r.transcript as string)
      const scores  = results.map(r => gabbScore(r, PHRASES[idxRef.current].it))
      const best    = Math.max(...scores)
      handleScore(best, results[0])
    }

    rec.onerror = (e: any) => {
      listeningRef.current = false
      setListening(false)
      if (e.error === 'no-speech') handleScore(0, '')
    }

    rec.onend = () => {
      listeningRef.current = false
      setListening(false)
    }

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

  const phrase = PHRASES[idx]
  const progressPct = Math.round((idx / PHRASES.length) * 100)
  const avgScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0

  // ── End screen ──
  if (done) {
    const endMsg =
      avgScore >= 90 ? "Sei fantastico! You sound like a native. Marco is very impressed." :
      avgScore >= 75 ? "Molto bene! You're ready to order in any Italian café." :
      avgScore >= 55 ? "Buono! A few more rounds and you'll be fluent." :
                       "Non ti preoccupare — every espresso starts as a bean. Keep going!"
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0e0a07 0%, #1a1009 60%, #2a1608 100%)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl" style={{ background: '#c9893a18' }} />
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-sm text-center space-y-6">

          <motion.div animate={{ rotate: [-4, 4, -4], scale: [1, 1.08, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }} className="text-7xl">☕</motion.div>

          <h1 className="font-display text-3xl font-extrabold" style={{ color: '#e8b86d' }}>
            Bravissimo!
          </h1>

          {/* Score ring */}
          <div className="mx-auto w-28 h-28 rounded-full flex items-center justify-center text-xl font-bold relative"
            style={{
              background: `conic-gradient(#e8b86d ${avgScore}%, #3d2b1a ${avgScore}%)`,
              color: '#fff9f0',
            }}>
            <div className="absolute inset-2.5 rounded-full flex items-center justify-center text-2xl font-bold"
              style={{ background: '#1f1510', color: '#fff9f0' }}>
              {avgScore}%
            </div>
          </div>

          <p className="text-sm leading-relaxed" style={{ color: '#7a5c3e' }}>{endMsg}</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4 text-center border" style={{ background: '#c9893a18', borderColor: '#c9893a40' }}>
              <p className="text-2xl font-bold" style={{ color: '#e8b86d' }}>{streak}</p>
              <p className="text-xs" style={{ color: '#7a5c3e' }}>Final streak 🔥</p>
            </div>
            <div className="rounded-2xl p-4 text-center border" style={{ background: '#c9893a18', borderColor: '#c9893a40' }}>
              <p className="text-2xl font-bold" style={{ color: '#e8b86d' }}>+15</p>
              <p className="text-xs" style={{ color: '#7a5c3e' }}>GGC earned 🪙</p>
            </div>
          </div>

          <motion.button whileTap={{ scale: 0.97 }} onClick={restart}
            className="w-full py-4 rounded-2xl font-bold text-lg"
            style={{ background: 'linear-gradient(135deg, #c9893a, #a0621f)', color: '#fff9f0' }}>
            Riprova — Try Again
          </motion.button>
          <button onClick={() => navigate('/dashboard')}
            className="w-full text-sm" style={{ color: '#7a5c3e' }}>
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    )
  }

  // ── Main game ──
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0e0a07 0%, #1a1009 60%, #2a1608 100%)' }}>

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-64 rounded-full blur-3xl" style={{ background: '#3b1f0a55' }} />
        <div className="absolute bottom-0 left-[20%] w-64 h-64 rounded-full blur-3xl" style={{ background: '#c9893a18' }} />
        <div className="absolute bottom-0 right-[20%] w-64 h-64 rounded-full blur-3xl" style={{ background: '#c9893a12' }} />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center gap-3 px-5 py-4 max-w-2xl mx-auto w-full">
        <button onClick={() => { window.speechSynthesis.cancel(); navigate('/dashboard') }}
          className="p-2 rounded-xl hover:bg-white/10 transition-colors shrink-0" style={{ color: '#7a5c3e' }}>
          <X size={20} />
        </button>
        <p className="font-serif italic shrink-0 text-sm" style={{ color: '#e8b86d' }}>Gabb Voice</p>
        {/* Progress bar */}
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#3d2b1a' }}>
          <motion.div className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #c9893a, #e8b86d)' }}
            animate={{ width: `${progressPct}%` }}
            transition={{ type: 'spring', stiffness: 200 }} />
        </div>
        {/* Streak */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shrink-0 border"
          style={{ background: '#c9893a18', borderColor: '#c9893a40', color: '#e8b86d' }}>
          🔥 {streak}
        </div>
      </div>

      {/* Barista */}
      <div className="relative z-10 text-center mb-2">
        <motion.div
          animate={listening ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={{ duration: 0.6, repeat: listening ? Infinity : 0 }}
          className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center text-3xl border-2 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #2d1a0e, #4a2a14)', borderColor: '#c9893a', boxShadow: '0 0 24px #c9893a40' }}>
          ☕
        </motion.div>
        <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#e8b86d' }}>
          Marco — Your Barista
        </p>
      </div>

      {/* Main card */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 pb-6 max-w-2xl mx-auto w-full gap-4">

        {/* Scene label */}
        <p className="text-xs uppercase tracking-widest" style={{ color: '#7a5c3e' }}>{phrase.scene}</p>

        <AnimatePresence mode="wait">
          <motion.div key={idx}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 1.02 }}
            className="w-full rounded-2xl p-8 text-center relative overflow-hidden border"
            style={{
              background: 'linear-gradient(160deg, #241508cc, #1a0f07cc)',
              borderColor: '#3d2b1a99',
              boxShadow: '0 0 0 1px #c9893a12 inset, 0 24px 60px #00000070',
            }}>
            {/* Top gold line */}
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #c9893a, transparent)' }} />

            <p className="text-xs uppercase tracking-wider mb-5" style={{ color: '#7a5c3e' }}>
              Phrase {idx + 1} of {PHRASES.length}
            </p>

            {/* Italian */}
            <motion.p key={`it-${idx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="font-serif text-3xl sm:text-4xl leading-tight mb-3 min-h-[2.5em] flex items-center justify-center"
              style={{ color: '#fff9f0' }}>
              {phrase.it}
            </motion.p>

            {/* English */}
            <p className="text-sm italic mb-6" style={{ color: '#7a5c3e' }}>{phrase.en}</p>

            {/* Feedback area */}
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
                      <p className="text-xs text-center max-w-xs leading-relaxed" style={{ color: '#7a5c3e' }}>
                        {feedback === 'pass' ? `Perfetto! ${tip}` : tip}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Transcript */}
            {transcript && (
              <p className="text-xs italic mt-2" style={{ color: '#7a5c3e' }}>{transcript}</p>
            )}

            {/* Attempt dots */}
            <div className="flex justify-center gap-2 mt-4">
              {dots.map((d, i) => (
                <motion.div key={i}
                  animate={{ scale: d !== 'idle' ? [1, 1.4, 1] : 1 }}
                  className="w-2.5 h-2.5 rounded-full transition-colors"
                  style={{
                    background: d === 'pass' ? '#4caf6e' : d === 'fail' ? '#d94f4f' : '#3d2b1a',
                  }} />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Mic button */}
        <motion.button
          whileHover={!locked ? { scale: 1.06 } : {}}
          whileTap={!locked ? { scale: 0.94 } : {}}
          onClick={startMic}
          className="w-20 h-20 rounded-full flex items-center justify-center border-none shadow-xl relative"
          style={{
            background: locked
              ? 'linear-gradient(145deg, #3a2a1a, #2a1a0a)'
              : listening
              ? 'linear-gradient(145deg, #e85555, #c03030)'
              : 'linear-gradient(145deg, #c9893a, #a0621f)',
            opacity: locked ? 0.5 : 1,
            cursor: locked ? 'not-allowed' : 'pointer',
          }}
        >
          {listening
            ? <MicOff size={30} color="#fff9f0" />
            : <Mic size={30} color="#fff9f0" />
          }
          {listening && (
            <motion.div className="absolute inset-0 rounded-full border-2"
              style={{ borderColor: '#e85555' }}
              animate={{ scale: [1, 1.5], opacity: [0.7, 0] }}
              transition={{ duration: 1, repeat: Infinity }} />
          )}
        </motion.button>

        <p className="text-xs uppercase tracking-widest" style={{ color: '#7a5c3e' }}>
          {listening ? 'Listening...' : locked ? 'Moving on...' : 'Tap & Speak'}
        </p>

        {/* Mic waveform */}
        {listening && (
          <div className="flex gap-1 items-center">
            {[0,1,2,3,4].map(i => (
              <motion.div key={i} className="w-1 rounded-full"
                style={{ background: '#c9893a' }}
                animate={{ height: ['4px', '20px', '4px'] }}
                transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }} />
            ))}
          </div>
        )}

        {/* Skip button */}
        <button onClick={() => { stopMic(); setStreak(0); advance() }}
          className="flex items-center gap-1.5 text-xs uppercase tracking-wider px-5 py-2 rounded-full border transition-colors hover:border-yellow-600/50 hover:text-yellow-600"
          style={{ borderColor: '#3d2b1a', color: '#7a5c3e' }}>
          <SkipForward size={13} /> Skip phrase
        </button>
      </div>
    </div>
  )
}
