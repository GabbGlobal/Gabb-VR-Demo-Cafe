/**
 * VR Practice — 2D interactive café with clickable hotspots.
 * Tap any object to hear its name, see the translation, and practice pronunciation.
 * Supports it / es / fr / pt. Simulates a VR-like immersive feel in the browser.
 */
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Volume2, Mic, MicOff, ChevronRight } from 'lucide-react'
import { useUserStore } from '../store/userStore'

// ─── Language data ─────────────────────────────────────────────────────────

const LANG_BCP47: Record<string, string> = {
  it: 'it-IT', es: 'es-ES', fr: 'fr-FR', pt: 'pt-BR',
}

interface HotspotWord { it: string; es: string; fr: string; pt: string; en: string; phonetic: Record<string, string> }

const HOTSPOTS: {
  id: string
  label: string
  x: number  // % from left in the SVG viewport
  y: number  // % from top
  word: HotspotWord
  emoji: string
}[] = [
  {
    id: 'coffee',
    label: 'Espresso',
    x: 28, y: 62,
    emoji: '☕',
    word: {
      en: 'the coffee / espresso',
      it: 'il caffè', es: 'el café', fr: 'le café', pt: 'o café',
      phonetic: { it: 'eel kah-FEH', es: 'el kah-FEH', fr: 'luh kah-FEH', pt: 'oo kah-FEH' },
    },
  },
  {
    id: 'table',
    label: 'Table',
    x: 50, y: 75,
    emoji: '🪵',
    word: {
      en: 'the table',
      it: 'il tavolo', es: 'la mesa', fr: 'la table', pt: 'a mesa',
      phonetic: { it: 'eel TAH-voh-loh', es: 'lah MEH-sah', fr: 'lah TAH-bluh', pt: 'ah MEH-zah' },
    },
  },
  {
    id: 'menu',
    label: 'Menu',
    x: 72, y: 45,
    emoji: '📋',
    word: {
      en: 'the menu',
      it: 'il menù', es: 'el menú', fr: 'la carte', pt: 'o cardápio',
      phonetic: { it: 'eel meh-NOO', es: 'el meh-NOO', fr: 'lah KART', pt: 'oo kar-DAH-pyoo' },
    },
  },
  {
    id: 'waiter',
    label: 'Waiter',
    x: 80, y: 38,
    emoji: '🧑‍🍳',
    word: {
      en: 'the waiter',
      it: 'il cameriere', es: 'el camarero', fr: 'le serveur', pt: 'o garçom',
      phonetic: { it: 'eel kah-meh-RYEH-reh', es: 'el kah-mah-REH-roh', fr: 'luh sehr-VUR', pt: 'oo gar-SOM' },
    },
  },
  {
    id: 'window',
    label: 'Window',
    x: 15, y: 28,
    emoji: '🪟',
    word: {
      en: 'the window',
      it: 'la finestra', es: 'la ventana', fr: 'la fenêtre', pt: 'a janela',
      phonetic: { it: 'lah fee-NEHS-trah', es: 'lah vehn-TAH-nah', fr: 'lah feh-NEH-truh', pt: 'ah zhah-NEH-lah' },
    },
  },
  {
    id: 'door',
    label: 'Door',
    x: 88, y: 72,
    emoji: '🚪',
    word: {
      en: 'the door',
      it: 'la porta', es: 'la puerta', fr: 'la porte', pt: 'a porta',
      phonetic: { it: 'lah POHR-tah', es: 'lah PWEHR-tah', fr: 'lah POHRT', pt: 'ah POHR-tah' },
    },
  },
  {
    id: 'chair',
    label: 'Chair',
    x: 40, y: 80,
    emoji: '🪑',
    word: {
      en: 'the chair',
      it: 'la sedia', es: 'la silla', fr: 'la chaise', pt: 'a cadeira',
      phonetic: { it: 'lah SEH-dyah', es: 'lah SEE-yah', fr: 'lah SHEZ', pt: 'ah kah-DAY-rah' },
    },
  },
  {
    id: 'sign',
    label: 'Café sign',
    x: 50, y: 18,
    emoji: '🏪',
    word: {
      en: 'the café / bar',
      it: 'il bar', es: 'el café', fr: 'le café', pt: 'o café',
      phonetic: { it: 'eel BAR', es: 'el kah-FEH', fr: 'luh kah-FEH', pt: 'oo kah-FEH' },
    },
  },
]

// Quick phrases for ordering
const PHRASES: Record<string, { text: string; en: string }[]> = {
  it: [
    { text: 'Un caffè, per favore.', en: 'One coffee, please.' },
    { text: 'Il conto, per favore.', en: 'The bill, please.' },
    { text: 'Dov\'è il bagno?', en: 'Where is the bathroom?' },
    { text: 'Parla inglese?', en: 'Do you speak English?' },
  ],
  es: [
    { text: 'Un café, por favor.', en: 'One coffee, please.' },
    { text: 'La cuenta, por favor.', en: 'The bill, please.' },
    { text: '¿Dónde está el baño?', en: 'Where is the bathroom?' },
    { text: '¿Habla inglés?', en: 'Do you speak English?' },
  ],
  fr: [
    { text: 'Un café, s\'il vous plaît.', en: 'One coffee, please.' },
    { text: 'L\'addition, s\'il vous plaît.', en: 'The bill, please.' },
    { text: 'Où sont les toilettes?', en: 'Where is the bathroom?' },
    { text: 'Parlez-vous anglais?', en: 'Do you speak English?' },
  ],
  pt: [
    { text: 'Um café, por favor.', en: 'One coffee, please.' },
    { text: 'A conta, por favor.', en: 'The bill, please.' },
    { text: 'Onde fica o banheiro?', en: 'Where is the bathroom?' },
    { text: 'Você fala inglês?', en: 'Do you speak English?' },
  ],
}

const LANG_LABELS: Record<string, string> = { it: '🇮🇹 Italian', es: '🇪🇸 Spanish', fr: '🇫🇷 French', pt: '🇧🇷 Portuguese' }

// ─── Speech helpers ─────────────────────────────────────────────────────────

function speak(text: string, lang: string, rate = 0.82) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = LANG_BCP47[lang] ?? lang; utt.rate = rate; utt.pitch = 1.0
  const doSpeak = () => window.speechSynthesis.speak(utt)
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true })
  } else { doSpeak() }
}

// ─── Component ────────────────────────────────────────────────────────────

export default function VRPracticePage() {
  const navigate = useNavigate()
  const profile = useUserStore(s => s.profile)
  const lang = profile?.activeLanguage ?? 'it'

  const [activeLang, setActiveLang] = useState(lang)
  const [activeHotspot, setActiveHotspot] = useState<typeof HOTSPOTS[0] | null>(null)
  const [listening, setListening] = useState(false)
  const [heardText, setHeardText] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'try' | null>(null)
  const [found, setFound] = useState<Set<string>>(new Set())
  const [tab, setTab] = useState<'scene' | 'phrases'>('scene')

  const recRef = useRef<any>(null)
  const listeningRef = useRef(false)

  function tapHotspot(hs: typeof HOTSPOTS[0]) {
    setActiveHotspot(hs)
    setFeedback(null)
    setHeardText('')
    speak((hs.word as any)[activeLang], activeLang)
  }

  function startMic() {
    if (!activeHotspot) return
    if (listeningRef.current) {
      listeningRef.current = false; recRef.current?.stop(); setListening(false); setHeardText(''); return
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Voice needs Chrome or Edge.'); return }

    const rec = new SR()
    rec.lang = LANG_BCP47[activeLang] ?? 'it-IT'
    rec.continuous = true; rec.interimResults = true
    recRef.current = rec; listeningRef.current = true; setListening(true); setFeedback(null); setHeardText('')

    let silenceTimer: ReturnType<typeof setTimeout> | null = null
    let latestFinal = ''

    rec.onresult = (e: any) => {
      const results = Array.from(e.results as any[])
      const transcript = results.map((r: any) => r[0].transcript).join('')
      setHeardText(transcript)
      if ((e.results as any)[e.results.length - 1].isFinal) {
        latestFinal = transcript.toLowerCase().trim()
        if (silenceTimer) clearTimeout(silenceTimer)
        silenceTimer = setTimeout(() => {
          listeningRef.current = false; rec.stop(); setListening(false)
          gradeWord(latestFinal)
        }, 1100)
      }
    }
    rec.onend = () => { if (listeningRef.current) { try { rec.start() } catch {} } else { setListening(false) } }
    rec.onerror = (e: any) => {
      if (e.error === 'aborted') return
      if (listeningRef.current) { try { rec.start() } catch {} } else { setListening(false) }
    }
    try { rec.start() } catch { setListening(false); listeningRef.current = false }
  }

  function gradeWord(heard: string) {
    if (!activeHotspot) return
    const target = ((activeHotspot.word as any)[activeLang] as string).toLowerCase()
    const keyWords = target.replace(/[^a-zàáâãäçèéêëìíîïñòóôõöùúûü\s]/gi, '').split(/\s+/).filter(w => w.length > 2)
    const hit = keyWords.some(kw => heard.includes(kw))
    if (hit) {
      setFeedback('correct')
      speak('Perfetto!', activeLang, 1.1)
      setFound(prev => new Set([...prev, activeHotspot.id]))
    } else {
      setFeedback('try')
      speak((activeHotspot.word as any)[activeLang], activeLang, 0.7)
    }
  }

  const phrases = PHRASES[activeLang] ?? PHRASES.it

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 glass border-b border-white/10 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button onClick={() => { window.speechSynthesis.cancel(); navigate('/dashboard') }}
            className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
          <div className="flex-1">
            <p className="font-display font-bold text-white text-sm">VR Practice — Caffè Roma</p>
            <p className="text-xs text-purple-400">Tap objects · Hear them · Say them</p>
          </div>
          {/* Language picker */}
          <div className="flex gap-1">
            {Object.entries(LANG_LABELS).map(([code, label]) => (
              <button key={code} onClick={() => { setActiveLang(code as 'it' | 'es' | 'fr' | 'pt'); setActiveHotspot(null) }}
                className={`text-xs px-2.5 py-1 rounded-lg transition-colors font-medium ${
                  activeLang === code ? 'bg-[#4CC8E8]/20 text-[#4CC8E8] border border-[#4CC8E8]/40' : 'text-white/30 hover:text-white hover:bg-white/10'
                }`}
                title={label}
              >
                {label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full flex-1 p-4 space-y-4">

        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-[#4CC8E8] to-purple-500 rounded-full"
              animate={{ width: `${(found.size / HOTSPOTS.length) * 100}%` }}
              transition={{ type: 'spring', stiffness: 200 }} />
          </div>
          <span className="text-xs text-white/40 font-mono">{found.size}/{HOTSPOTS.length} found</span>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
          {(['scene', 'phrases'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t ? 'bg-[#4CC8E8]/20 text-[#4CC8E8]' : 'text-white/40 hover:text-white'
              }`}>
              {t === 'scene' ? '🏛️ Scene' : '💬 Phrases'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'scene' ? (
            <motion.div key="scene" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              {/* Café scene */}
              <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950"
                style={{ aspectRatio: '16/9' }}>

                {/* Background SVG scene */}
                <svg viewBox="0 0 640 360" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                  {/* Sky */}
                  <rect width="640" height="360" fill="#0a0520" />
                  {/* Stone wall */}
                  <rect y="60" width="640" height="220" fill="#1a0f2e" />
                  {/* Wall tiles */}
                  {[0,1,2,3,4,5,6,7].map(i => [0,1,2].map(j => (
                    <rect key={`${i}-${j}`} x={i * 80 + (j % 2 === 0 ? 0 : 40)} y={100 + j * 40} width="78" height="38" rx="1"
                      fill="none" stroke="#2a1a3e" strokeWidth="1" opacity="0.5" />
                  )))}
                  {/* Ceiling arch */}
                  <path d="M 0 160 Q 320 60 640 160" fill="#0f0820" />
                  {/* Arch detail */}
                  <path d="M 40 160 Q 320 80 600 160" fill="none" stroke="#9333ea" strokeWidth="2" opacity="0.4" />
                  {/* Floor */}
                  <rect y="270" width="640" height="90" fill="#1a0a06" />
                  {/* Floor tiles */}
                  {[0,1,2,3,4,5,6,7].map(i => (
                    <rect key={i} x={i * 80} y="270" width="78" height="90" fill="none" stroke="#2a1506" strokeWidth="1" opacity="0.6" />
                  ))}
                  {/* Main café table */}
                  <rect x="220" y="238" width="200" height="14" rx="4" fill="#5c3010" />
                  <rect x="286" y="252" width="10" height="40" fill="#4a2808" />
                  <rect x="340" y="252" width="10" height="40" fill="#4a2808" />
                  {/* Espresso cups on table */}
                  <ellipse cx="262" cy="239" rx="18" ry="7" fill="#1a0804" />
                  <ellipse cx="262" cy="235" rx="14" ry="5" fill="#2e1008" />
                  <ellipse cx="378" cy="239" rx="18" ry="7" fill="#1a0804" />
                  <ellipse cx="378" cy="235" rx="14" ry="5" fill="#2e1008" />
                  {/* Chairs */}
                  <rect x="215" y="255" width="55" height="8" rx="3" fill="#3a2008" />
                  <rect x="218" y="263" width="8" height="28" fill="#2a1806" />
                  <rect x="258" y="263" width="8" height="28" fill="#2a1806" />
                  <rect x="370" y="255" width="55" height="8" rx="3" fill="#3a2008" />
                  <rect x="373" y="263" width="8" height="28" fill="#2a1806" />
                  <rect x="413" y="263" width="8" height="28" fill="#2a1806" />
                  {/* Window (left) */}
                  <rect x="40" y="110" width="80" height="100" rx="6" fill="#0d1a2e" stroke="#3a2a5e" strokeWidth="2" />
                  <rect x="42" y="112" width="76" height="96" rx="4" fill="#0a1624" />
                  {/* Window panes */}
                  <line x1="80" y1="112" x2="80" y2="208" stroke="#3a2a5e" strokeWidth="1.5" />
                  <line x1="42" y1="160" x2="118" y2="160" stroke="#3a2a5e" strokeWidth="1.5" />
                  {/* Outside glow */}
                  <ellipse cx="80" cy="160" rx="30" ry="40" fill="#6060ff" opacity="0.06" />
                  {/* Menu board */}
                  <rect x="490" y="105" width="120" height="90" rx="6" fill="#1a0828" stroke="#9333ea" strokeWidth="2" opacity="0.9" />
                  <text x="550" y="128" textAnchor="middle" fill="#F0C060" fontSize="13" fontWeight="bold" fontFamily="serif">CAFFÈ ROMA</text>
                  <line x1="500" y1="135" x2="600" y2="135" stroke="#9333ea" strokeWidth="0.8" opacity="0.5" />
                  <text x="550" y="150" textAnchor="middle" fill="#d8b4fe" fontSize="8.5" fontFamily="sans-serif">Espresso · Cappuccino</text>
                  <text x="550" y="163" textAnchor="middle" fill="#d8b4fe" fontSize="8.5" fontFamily="sans-serif">Cornetto · Brioche</text>
                  <text x="550" y="176" textAnchor="middle" fill="#d8b4fe" fontSize="8.5" fontFamily="sans-serif">Aperitivo 18:00–20:00</text>
                  {/* Waiter silhouette */}
                  <ellipse cx="520" cy="218" rx="14" ry="14" fill="#2a1040" stroke="#9333ea" strokeWidth="1.5" />
                  <rect x="508" y="232" width="24" height="36" rx="8" fill="#2a1040" stroke="#9333ea" strokeWidth="1.5" />
                  {/* Waiter bow-tie */}
                  <polygon points="514,237 520,241 526,237 520,243" fill="#9333ea" opacity="0.7" />
                  {/* Door (right) */}
                  <rect x="568" y="200" width="60" height="95" rx="4" fill="#1a0828" stroke="#7C3AED" strokeWidth="2" />
                  <rect x="570" y="202" width="56" height="91" rx="3" fill="#120620" />
                  <circle cx="575" cy="247" r="4" fill="#9333ea" />
                  {/* Door arch */}
                  <path d="M 568 200 Q 598 180 628 200" fill="none" stroke="#7C3AED" strokeWidth="2" />
                  {/* Café sign top */}
                  <rect x="220" y="30" width="200" height="34" rx="8" fill="#1a0828" stroke="#9333ea" strokeWidth="2" />
                  <text x="320" y="53" textAnchor="middle" fill="#F0C060" fontSize="16" fontWeight="bold" fontFamily="serif">CAFFÈ ROMA</text>
                  {/* Ambient lights */}
                  <circle cx="160" cy="90" r="25" fill="#9333ea" opacity="0.08" />
                  <circle cx="320" cy="75" r="30" fill="#F0C060" opacity="0.05" />
                  <circle cx="480" cy="90" r="25" fill="#9333ea" opacity="0.08" />
                </svg>

                {/* Hotspot buttons — positioned % of container */}
                {HOTSPOTS.map(hs => {
                  const isFound = found.has(hs.id)
                  const isActive = activeHotspot?.id === hs.id
                  return (
                    <motion.button
                      key={hs.id}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => tapHotspot(hs)}
                      className={`absolute flex items-center justify-center rounded-full transition-all shadow-lg ${
                        isActive
                          ? 'w-10 h-10 -translate-x-5 -translate-y-5 ring-2 ring-[#4CC8E8] bg-[#4CC8E8]/20'
                          : isFound
                          ? 'w-8 h-8 -translate-x-4 -translate-y-4 bg-emerald-500/30 border border-emerald-400/60'
                          : 'w-8 h-8 -translate-x-4 -translate-y-4 bg-purple-500/30 border border-purple-400/50 hover:bg-purple-500/50'
                      }`}
                      style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                      title={hs.label}
                    >
                      <span className="text-lg leading-none">{isFound ? '✅' : hs.emoji}</span>
                      {!isFound && (
                        <motion.div className="absolute inset-0 rounded-full border border-purple-400/40"
                          animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                          transition={{ duration: 1.8, repeat: Infinity }} />
                      )}
                    </motion.button>
                  )
                })}

                {/* Active label badge */}
                {activeHotspot && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur border border-[#4CC8E8]/40 rounded-full px-4 py-1.5 flex items-center gap-2">
                    <span className="text-[#4CC8E8] text-sm font-bold">{(activeHotspot.word as any)[activeLang]}</span>
                    <span className="text-white/40 text-xs">= {activeHotspot.word.en}</span>
                  </div>
                )}
              </div>

              {/* Info tip */}
              <p className="text-center text-xs text-white/30">Tap any glowing item to hear it · Say it back to score</p>

              {/* Active hotspot panel */}
              <AnimatePresence>
                {activeHotspot && (
                  <motion.div key={activeHotspot.id}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                    className="bg-slate-900 border border-white/10 rounded-2xl p-4 space-y-3">

                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{activeHotspot.emoji}</span>
                      <div className="flex-1">
                        <p className="font-bold text-white text-lg">{(activeHotspot.word as any)[activeLang]}</p>
                        <p className="text-xs text-white/40">{activeHotspot.word.phonetic[activeLang]}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/30">English</p>
                        <p className="text-sm text-white/60">{activeHotspot.word.en}</p>
                      </div>
                    </div>

                    {/* Hear + say */}
                    <div className="flex gap-2">
                      <button onClick={() => speak((activeHotspot.word as any)[activeLang], activeLang)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all text-sm">
                        <Volume2 size={15} /> Hear it
                      </button>
                      <motion.button
                        whileTap={{ scale: 0.93 }}
                        onClick={startMic}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all ${
                          listening
                            ? 'bg-red-500/20 border-red-500/40 text-red-300 animate-pulse'
                            : 'bg-[#4CC8E8]/15 border-[#4CC8E8]/35 text-[#4CC8E8] hover:bg-[#4CC8E8]/25'
                        }`}
                      >
                        {listening ? <MicOff size={15} /> : <Mic size={15} />}
                        {listening ? 'Listening...' : 'Say it'}
                      </motion.button>
                    </div>

                    {/* Feedback */}
                    <AnimatePresence>
                      {(heardText || feedback) && (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className={`p-3 rounded-xl text-sm text-center border ${
                            feedback === 'correct' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                              : feedback === 'try' ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                              : 'bg-white/5 border-white/10 text-white/60'
                          }`}>
                          {feedback === 'correct' && '✅ Perfetto! '}
                          {feedback === 'try' && '🔄 '}
                          {feedback === 'correct' ? 'You nailed it!' : heardText ? `Heard: "${heardText}"${feedback === 'try' ? ' — try again' : ''}` : ''}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Mic waveform */}
                    {listening && (
                      <div className="flex justify-center gap-1">
                        {[0,1,2,3,4].map(i => (
                          <motion.div key={i} className="w-1 bg-[#4CC8E8] rounded-full"
                            animate={{ height: ['4px', '18px', '4px'] }}
                            transition={{ duration: 0.45, delay: i * 0.09, repeat: Infinity }} />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          ) : (
            /* ── PHRASES TAB ── */
            <motion.div key="phrases" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <p className="text-xs text-white/40 uppercase tracking-widest">
                Essential {LANG_LABELS[activeLang]} phrases for the café
              </p>
              {phrases.map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                  className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl group">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{p.text}</p>
                    <p className="text-xs text-white/40 mt-0.5">{p.en}</p>
                  </div>
                  <button onClick={() => speak(p.text, activeLang)}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-[#4CC8E8]/20 text-white/40 hover:text-[#4CC8E8] transition-all shrink-0">
                    <Volume2 size={16} />
                  </button>
                  <button onClick={() => { speak(p.text, activeLang); }}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-purple-500/20 text-white/40 hover:text-purple-300 transition-all shrink-0">
                    <ChevronRight size={16} />
                  </button>
                </motion.div>
              ))}

              <div className="glass rounded-2xl p-4 border border-purple-500/20 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-purple-400 text-sm">🥽</span>
                  <span className="text-sm font-semibold text-white">Coming: Full VR Mode</span>
                </div>
                <p className="text-xs text-white/40 leading-relaxed">
                  Step inside Caffè Roma in full 3D. Sit at a table, order from a real AI barista, and pick up objects — all in {LANG_LABELS[activeLang].split(' ')[1]}.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
