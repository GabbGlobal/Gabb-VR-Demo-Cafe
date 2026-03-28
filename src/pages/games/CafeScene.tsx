/**
 * Caffè Roma 2D Scene — cinematic interactive Italian café for Rich.
 * Walk through the café, tap objects, order from Marco the barista,
 * and practice the 20 real phrases from the Caffè Roma game.
 * Uses the same amber/gold aesthetic + Web Speech API.
 */
import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Volume2, Mic, MicOff, ChevronRight, Star } from 'lucide-react'
import { useUserStore } from '../../store/userStore'
import { playFanfare } from '../../utils/fanfare'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Hotspot {
  id: string
  label: string
  emoji: string
  x: number   // % in SVG viewport
  y: number
  phrase: { it: string; en: string; tip: string }
  color: string
}

// ─── Scene hotspots — each one teaches a real café phrase ────────────────────

const HOTSPOTS: Hotspot[] = [
  {
    id: 'door',
    label: 'Entrance',
    emoji: '🚪',
    x: 12, y: 55,
    color: '#c9893a',
    phrase: { it: 'Buongiorno!', en: 'Good morning!', tip: "Roll the 'r' in buonGIORno — warm and sunny." },
  },
  {
    id: 'seat',
    label: 'Find a table',
    emoji: '🪑',
    x: 35, y: 70,
    color: '#e8b86d',
    phrase: { it: "C'è un tavolo libero?", en: 'Is there a free table?', tip: 'TAH-vo-lo — stress on the first syllable.' },
  },
  {
    id: 'menu',
    label: 'Menu',
    emoji: '📋',
    x: 55, y: 40,
    color: '#c9893a',
    phrase: { it: 'Quanto costa?', en: 'How much does it cost?', tip: 'KWAHN-to KOS-tah — the most useful Italian phrase.' },
  },
  {
    id: 'barista',
    label: 'Order coffee',
    emoji: '☕',
    x: 72, y: 38,
    color: '#e8b86d',
    phrase: { it: 'Un caffè, per favore.', en: 'A coffee, please.', tip: "In Italy 'caffè' means espresso — short and strong!" },
  },
  {
    id: 'pastry',
    label: 'Order pastry',
    emoji: '🥐',
    x: 78, y: 58,
    color: '#c9893a',
    phrase: { it: 'Vorrei un cornetto alla crema.', en: 'I would like a cream croissant.', tip: 'KREM-ah — the classic Italian pastry filling.' },
  },
  {
    id: 'table',
    label: 'Your table',
    emoji: '🪵',
    x: 43, y: 75,
    color: '#e8b86d',
    phrase: { it: 'Con latte caldo, per favore.', en: 'With warm milk, please.', tip: 'LAT-teh — ask for coffee customized this way.' },
  },
  {
    id: 'waiter',
    label: 'Get attention',
    emoji: '🧑‍🍳',
    x: 88, y: 48,
    color: '#c9893a',
    phrase: { it: 'Mi scusi!', en: 'Excuse me!', tip: 'Classic way to flag down a barista in Italy.' },
  },
  {
    id: 'bill',
    label: 'Pay the bill',
    emoji: '💳',
    x: 62, y: 72,
    color: '#e8b86d',
    phrase: { it: 'Il conto, per favore.', en: 'The bill, please.', tip: "Always ask — Italian staff won't bring it unannounced." },
  },
  {
    id: 'exit',
    label: 'Say goodbye',
    emoji: '👋',
    x: 20, y: 42,
    color: '#c9893a',
    phrase: { it: 'Era delizioso, grazie mille!', en: 'It was delicious, thank you!', tip: 'DEH-lee-TSYO-so — compliments go a long way here.' },
  },
]

// ─── Scoring ─────────────────────────────────────────────────────────────────

function normalizeIT(text: string) {
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

function speakIT(text: string, rate = 0.78) {
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = 'it-IT'; utt.rate = rate; utt.pitch = 1.05
  const go = () => window.speechSynthesis.speak(utt)
  window.speechSynthesis.getVoices().length === 0
    ? window.speechSynthesis.addEventListener('voiceschanged', go, { once: true })
    : go()
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CafeScenePage() {
  const navigate  = useNavigate()
  const addXp     = useUserStore(s => s.addXp)
  const addCoins  = useUserStore(s => s.addCoins)
  const profile   = useUserStore(s => s.profile)
  const lang      = (profile?.activeLanguage ?? 'it') as 'it'

  const [found,     setFound]     = useState<Set<string>>(new Set())
  const [active,    setActive]    = useState<Hotspot | null>(null)
  const [listening, setListening] = useState(false)
  const [transcript,setTranscript]= useState('')
  const [feedback,  setFeedback]  = useState<'pass' | 'fail' | null>(null)
  const [pct,       setPct]       = useState(0)
  const [done,      setDone]      = useState(false)

  const recRef       = useRef<any>(null)
  const listeningRef = useRef(false)
  const activeRef    = useRef<Hotspot | null>(null)
  activeRef.current  = active

  function tap(hs: Hotspot) {
    setActive(hs)
    setFeedback(null)
    setTranscript('')
    setPct(0)
    speakIT(hs.phrase.it)
  }

  function closePanel() {
    window.speechSynthesis.cancel()
    stopMic()
    setActive(null)
    setFeedback(null)
    setTranscript('')
  }

  const gradeResult = useCallback((score: number, heard: string) => {
    setPct(score)
    setTranscript(heard ? `Heard: "${heard}"` : '')
    const pass = score >= 75

    if (pass) {
      setFeedback('pass')
      const hs = activeRef.current
      if (hs && !found.has(hs.id)) {
        setFound(prev => {
          const next = new Set([...prev, hs.id])
          if (next.size === HOTSPOTS.length) {
            setTimeout(() => { setDone(true); playFanfare('perfect'); addXp(lang, 100); addCoins(20) }, 1200)
          }
          return next
        })
        addXp(lang, 12)
        addCoins(3)
      }
      speakIT('Perfetto!', 1.0)
      setTimeout(closePanel, 2000)
    } else {
      setFeedback('fail')
      setTimeout(() => { speakIT(activeRef.current?.phrase.it ?? '', 0.65) }, 600)
    }
  }, [found, lang, addXp, addCoins]) // eslint-disable-line react-hooks/exhaustive-deps

  function startMic() {
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
      const scores  = results.map(r => gabbScore(r, activeRef.current?.phrase.it ?? ''))
      gradeResult(Math.max(...scores), results[0])
    }

    rec.onerror = (e: any) => {
      listeningRef.current = false
      setListening(false)
      if (e.error === 'no-speech') gradeResult(0, '')
    }
    rec.onend = () => { listeningRef.current = false; setListening(false) }
    try { rec.start() } catch { listeningRef.current = false; setListening(false) }
  }

  function stopMic() {
    listeningRef.current = false
    recRef.current?.stop()
    setListening(false)
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0e0a07, #1a1009 60%, #2a1608)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl" style={{ background: '#c9893a20' }} />
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-sm text-center space-y-5">
          <motion.div animate={{ rotate: [-5, 5, -5], scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }} className="text-7xl">🏆</motion.div>
          <h1 className="font-serif text-3xl font-bold" style={{ color: '#e8b86d' }}>
            Bravissimo, Rich!
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: '#7a5c3e' }}>
            You just walked through Caffè Roma like a local.<br />
            {HOTSPOTS.length} phrases, {HOTSPOTS.length} moments of Italian confidence.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4 border" style={{ background: '#c9893a18', borderColor: '#c9893a40' }}>
              <p className="text-2xl font-bold" style={{ color: '#e8b86d' }}>9/9</p>
              <p className="text-xs" style={{ color: '#7a5c3e' }}>Scenes cleared ✅</p>
            </div>
            <div className="rounded-2xl p-4 border" style={{ background: '#c9893a18', borderColor: '#c9893a40' }}>
              <p className="text-2xl font-bold" style={{ color: '#e8b86d' }}>+20</p>
              <p className="text-xs" style={{ color: '#7a5c3e' }}>GGC earned 🪙</p>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => { setFound(new Set()); setDone(false); setActive(null) }}
            className="w-full py-4 rounded-2xl font-bold text-lg"
            style={{ background: 'linear-gradient(135deg, #c9893a, #a0621f)', color: '#fff9f0' }}>
            Play Again 🔁
          </motion.button>
          <button onClick={() => navigate('/dashboard')} className="text-sm w-full" style={{ color: '#7a5c3e' }}>
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0e0a07 0%, #1a1009 55%, #2a1608 100%)' }}>

      {/* Ambient lights */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-48 rounded-full blur-3xl" style={{ background: '#3b1f0a60' }} />
        <div className="absolute bottom-0 left-[15%] w-72 h-56 rounded-full blur-3xl" style={{ background: '#c9893a15' }} />
        <div className="absolute bottom-0 right-[15%] w-72 h-56 rounded-full blur-3xl" style={{ background: '#c9893a10' }} />
      </div>

      {/* Header */}
      <div className="relative z-20 flex items-center gap-3 px-5 py-4 max-w-2xl mx-auto w-full">
        <button onClick={() => { window.speechSynthesis.cancel(); navigate('/dashboard') }}
          className="p-2 rounded-xl transition-colors" style={{ color: '#7a5c3e' }}>
          <X size={20} />
        </button>
        <div className="flex-1">
          <p className="font-serif italic text-sm" style={{ color: '#e8b86d' }}>Caffè Roma — 2D Experience</p>
          <p className="text-xs" style={{ color: '#7a5c3e' }}>Tap a glowing object · Hear it · Say it</p>
        </div>
        {/* Progress */}
        <div className="flex items-center gap-2">
          {[...Array(HOTSPOTS.length)].map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full transition-colors"
              style={{ background: i < found.size ? '#c9893a' : '#3d2b1a' }} />
          ))}
        </div>
      </div>

      {/* Scene */}
      <div className="relative flex-1 flex flex-col items-center px-5 pb-4 max-w-2xl mx-auto w-full">

        {/* SVG Café Scene */}
        <div className="relative w-full rounded-2xl overflow-hidden border"
          style={{ aspectRatio: '16/9', borderColor: '#3d2b1a', background: '#0e0a07' }}>

          <svg viewBox="0 0 640 360" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">

            {/* ── Background / architecture ── */}
            {/* Sky through back windows */}
            <rect width="640" height="180" fill="#0a0618" />
            {/* Stone floor */}
            <rect y="250" width="640" height="110" fill="#1a0d06" />
            {/* Floor tile lines */}
            {[0,1,2,3,4,5,6,7].map(i => (
              <rect key={i} x={i * 80} y="250" width="79" height="110" fill="none" stroke="#2a1508" strokeWidth="1" opacity="0.7" />
            ))}
            {/* Back wall - stone */}
            <rect y="180" width="640" height="70" fill="#14090a" />
            {/* Ceiling beam */}
            <rect y="0" width="640" height="60" fill="#0a0408" />
            {/* Stone wall texture - horizontal lines */}
            {[0,1,2,3].map(i => (
              <rect key={i} y={62 + i * 30} width="640" height="1" fill="#2a1810" opacity="0.4" />
            ))}

            {/* ── Pendant lights ── */}
            {[120, 320, 520].map(x => (
              <g key={x}>
                <rect x={x - 1} y="0" width="2" height="30" fill="#2a1810" />
                <ellipse cx={x} cy="34" rx="18" ry="10" fill="#3a2010" stroke="#c9893a" strokeWidth="1" />
                <ellipse cx={x} cy="34" rx="14" ry="7" fill="#c9893a" opacity="0.15" />
                {/* Light cone */}
                <polygon points={`${x-8},44 ${x+8},44 ${x+30},130 ${x-30},130`} fill="#c9893a" opacity="0.04" />
              </g>
            ))}

            {/* ── Left wall with windows and entrance ── */}
            {/* Entrance door */}
            <rect x="30" y="180" width="80" height="90" rx="4" fill="#1a0828" stroke="#3d2b1a" strokeWidth="2" />
            <rect x="32" y="182" width="76" height="86" rx="3" fill="#0d0414" />
            <path d="M 30 180 Q 70 155 110 180" fill="none" stroke="#3d2b1a" strokeWidth="2" />
            <circle cx="36" cy="225" r="4" fill="#c9893a" opacity="0.8" />
            {/* Window left */}
            <rect x="145" y="90" width="90" height="100" rx="5" fill="#0d1a2e" stroke="#3d2b1a" strokeWidth="2" />
            <rect x="147" y="92" width="86" height="96" rx="3" fill="#0a1624" />
            <line x1="190" y1="92" x2="190" y2="188" stroke="#3d2b1a" strokeWidth="1.5" />
            <line x1="147" y1="140" x2="233" y2="140" stroke="#3d2b1a" strokeWidth="1.5" />
            <ellipse cx="190" cy="140" rx="35" ry="42" fill="#3060c0" opacity="0.07" />

            {/* ── Back wall features ── */}
            {/* Café sign */}
            <rect x="230" y="68" width="180" height="40" rx="6" fill="#1a0828" stroke="#c9893a" strokeWidth="1.5" opacity="0.95" />
            <text x="320" y="94" textAnchor="middle" fill="#e8b86d" fontSize="16" fontWeight="bold" fontFamily="Georgia, serif">CAFFÈ ROMA</text>
            {/* Arch over back wall */}
            <path d="M 120 250 Q 320 140 520 250" fill="none" stroke="#3d2b1a" strokeWidth="1.5" opacity="0.5" />
            {/* Menu board */}
            <rect x="430" y="80" width="130" height="110" rx="6" fill="#14091e" stroke="#c9893a" strokeWidth="1.5" opacity="0.9" />
            <text x="495" y="103" textAnchor="middle" fill="#e8b86d" fontSize="10" fontWeight="bold" fontFamily="Georgia, serif">MENU</text>
            <line x1="440" y1="110" x2="550" y2="110" stroke="#c9893a" strokeWidth="0.7" opacity="0.4" />
            <text x="495" y="126" textAnchor="middle" fill="#7a5c3e" fontSize="7.5" fontFamily="sans-serif">Espresso · Cappuccino</text>
            <text x="495" y="139" textAnchor="middle" fill="#7a5c3e" fontSize="7.5" fontFamily="sans-serif">Cornetto · Brioche</text>
            <text x="495" y="152" textAnchor="middle" fill="#7a5c3e" fontSize="7.5" fontFamily="sans-serif">Macchiato · Americano</text>
            <text x="495" y="165" textAnchor="middle" fill="#c9893a" fontSize="7" fontFamily="sans-serif">Aperitivo 18:00–20:00</text>
            <text x="495" y="180" textAnchor="middle" fill="#7a5c3e" fontSize="7" fontFamily="sans-serif">Accettiamo carte</text>

            {/* ── Counter / bar ── */}
            <rect x="480" y="220" width="160" height="50" rx="4" fill="#2a1608" stroke="#3d2b1a" strokeWidth="1.5" />
            <rect x="478" y="216" width="164" height="10" rx="3" fill="#3d2010" />
            {/* Espresso machine */}
            <rect x="540" y="185" width="45" height="35" rx="4" fill="#1a1010" stroke="#c9893a" strokeWidth="1" opacity="0.9" />
            <circle cx="555" cy="200" r="7" fill="#2a1808" stroke="#c9893a" strokeWidth="0.8" />
            <circle cx="575" cy="200" r="7" fill="#2a1808" stroke="#c9893a" strokeWidth="0.8" />
            {/* Pastry display */}
            <rect x="490" y="196" width="44" height="24" rx="3" fill="#14090a" stroke="#3d2b1a" strokeWidth="1" />
            <ellipse cx="512" cy="204" rx="10" ry="6" fill="#c9893a" opacity="0.6" />
            <ellipse cx="512" cy="204" rx="8" ry="4" fill="#e8b86d" opacity="0.4" />

            {/* ── Waiter ── */}
            <ellipse cx="590" cy="192" rx="15" ry="15" fill="#2d1a0e" stroke="#c9893a" strokeWidth="1.5" />
            <rect x="578" y="207" width="24" height="34" rx="8" fill="#1a0828" stroke="#c9893a" strokeWidth="1" opacity="0.9" />
            <polygon points="585,212 590,216 595,212 590,218" fill="#c9893a" opacity="0.7" />
            {/* Waiter tray */}
            <ellipse cx="570" cy="210" rx="14" ry="4" fill="#5c3010" />
            <ellipse cx="570" cy="208" rx="5" ry="3" fill="#2C1408" />

            {/* ── Main dining table ── */}
            <rect x="240" y="262" width="180" height="14" rx="4" fill="#5c3010" />
            <rect x="240" y="272" width="180" height="5" rx="2" fill="#f5e6cc" opacity="0.8" /> {/* tablecloth */}
            {/* Table legs */}
            <rect x="260" y="276" width="8" height="34" fill="#4a2808" />
            <rect x="372" y="276" width="8" height="34" fill="#4a2808" />
            {/* Cups on table */}
            <ellipse cx="295" cy="263" rx="12" ry="5" fill="#2C1408" />
            <ellipse cx="295" cy="261" rx="9" ry="3.5" fill="#4A2010" />
            <ellipse cx="345" cy="263" rx="12" ry="5" fill="#2C1408" />
            <ellipse cx="345" cy="261" rx="9" ry="3.5" fill="#4A2010" />
            {/* Chairs */}
            <rect x="256" y="278" width="50" height="8" rx="3" fill="#3a2008" />
            <rect x="335" y="278" width="50" height="8" rx="3" fill="#3a2008" />

            {/* ── Bill / receipt on table ── */}
            <rect x="295" y="262" width="28" height="18" rx="2" fill="#f5e6cc" opacity="0.9" />
            <line x1="300" y1="267" x2="318" y2="267" stroke="#7a5c3e" strokeWidth="0.8" />
            <line x1="300" y1="272" x2="318" y2="272" stroke="#7a5c3e" strokeWidth="0.8" />
          </svg>

          {/* ── Hotspot buttons ── */}
          {HOTSPOTS.map(hs => {
            const isFound = found.has(hs.id)
            const isActive = active?.id === hs.id
            return (
              <motion.button
                key={hs.id}
                whileHover={{ scale: 1.18 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => tap(hs)}
                className="absolute flex items-center justify-center rounded-full border-2 shadow-lg"
                style={{
                  left: `${hs.x}%`, top: `${hs.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: isActive ? 40 : 32,
                  height: isActive ? 40 : 32,
                  background: isFound ? '#4caf6e30' : `${hs.color}20`,
                  borderColor: isFound ? '#4caf6e' : isActive ? '#fff9f0' : hs.color,
                  boxShadow: isActive ? `0 0 16px ${hs.color}` : 'none',
                  zIndex: isActive ? 10 : 5,
                }}
                title={hs.label}
              >
                <span className="text-sm leading-none">{isFound ? '✅' : hs.emoji}</span>
                {/* Pulse ring */}
                {!isFound && (
                  <motion.div className="absolute inset-0 rounded-full"
                    style={{ border: `1px solid ${hs.color}60` }}
                    animate={{ scale: [1, 1.6], opacity: [0.7, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity }} />
                )}
              </motion.button>
            )
          })}

          {/* Progress badge */}
          <div className="absolute top-2 right-2 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border"
            style={{ background: '#0e0a07cc', borderColor: '#3d2b1a', color: '#e8b86d' }}>
            <Star size={11} className="fill-current" />
            {found.size}/{HOTSPOTS.length}
          </div>
        </div>

        {/* Word panel */}
        <AnimatePresence>
          {active && (
            <motion.div key={active.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="w-full rounded-2xl p-5 border relative"
              style={{
                background: 'linear-gradient(160deg, #241508ee, #1a0f07ee)',
                borderColor: '#3d2b1a',
                boxShadow: '0 0 0 1px #c9893a12 inset',
              }}>

              {/* Close */}
              <button onClick={closePanel} className="absolute top-3 right-3 p-1.5 rounded-lg text-xs"
                style={{ color: '#7a5c3e' }}>
                <X size={14} />
              </button>

              <div className="flex items-start gap-3">
                <span className="text-3xl mt-0.5">{active.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#7a5c3e' }}>
                    {active.label}
                  </p>
                  <p className="font-serif text-xl font-bold" style={{ color: '#fff9f0' }}>{active.phrase.it}</p>
                  <p className="text-sm italic mt-0.5" style={{ color: '#7a5c3e' }}>{active.phrase.en}</p>
                </div>
              </div>

              {/* Tip */}
              <div className="mt-3 p-2.5 rounded-xl border" style={{ background: '#c9893a10', borderColor: '#c9893a30' }}>
                <p className="text-xs" style={{ color: '#7a5c3e' }}>💡 {active.phrase.tip}</p>
              </div>

              {/* Feedback */}
              <AnimatePresence>
                {(transcript || feedback) && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mt-3 p-2.5 rounded-xl text-sm text-center"
                    style={{
                      background: feedback === 'pass' ? '#4caf6e20' : feedback === 'fail' ? '#d94f4f20' : '#c9893a10',
                      border: `1px solid ${feedback === 'pass' ? '#4caf6e50' : feedback === 'fail' ? '#d94f4f50' : '#c9893a30'}`,
                      color: feedback === 'pass' ? '#4caf6e' : feedback === 'fail' ? '#d94f4f' : '#7a5c3e',
                    }}>
                    {feedback === 'pass' && `✅ Perfetto! ${pct}%`}
                    {feedback === 'fail' && `🔄 ${pct > 0 ? `${pct}% — ` : ''}try again`}
                    {transcript && <span className="block text-xs mt-0.5 opacity-70">{transcript}</span>}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mic waveform */}
              {listening && (
                <div className="flex justify-center gap-1 mt-2">
                  {[0,1,2,3,4].map(i => (
                    <motion.div key={i} className="w-1 rounded-full"
                      style={{ background: '#c9893a' }}
                      animate={{ height: ['4px', '18px', '4px'] }}
                      transition={{ duration: 0.45, delay: i * 0.09, repeat: Infinity }} />
                  ))}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2 mt-4">
                <button onClick={() => speakIT(active.phrase.it)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm border transition-colors"
                  style={{ background: '#c9893a10', borderColor: '#c9893a30', color: '#e8b86d' }}>
                  <Volume2 size={14} /> Hear it
                </button>
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={startMic}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                  style={{
                    background: listening ? '#d94f4f20' : '#c9893a20',
                    borderColor: listening ? '#d94f4f60' : '#c9893a60',
                    color: listening ? '#d94f4f' : '#e8b86d',
                  }}>
                  {listening ? <MicOff size={14} /> : <Mic size={14} />}
                  {listening ? 'Listening...' : 'Say it'}
                </motion.button>
                <button onClick={() => { const i = HOTSPOTS.findIndex(h => h.id === active.id); const next = HOTSPOTS[(i+1) % HOTSPOTS.length]; closePanel(); setTimeout(() => tap(next), 200) }}
                  className="flex items-center justify-center p-2.5 rounded-xl border transition-colors"
                  style={{ borderColor: '#3d2b1a', color: '#7a5c3e' }}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!active && (
          <p className="text-xs text-center mt-3" style={{ color: '#7a5c3e' }}>
            Tap any glowing item to practice • {HOTSPOTS.length - found.size} phrases left
          </p>
        )}
      </div>
    </div>
  )
}
