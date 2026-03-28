/**
 * Rich Playlist — Personalized 15-minute cinematic Italian session.
 * 4 Worlds: Classics · Queens · Food & Family · Survival & Sports
 * 5 Phases: Check-in → Mission → Drill → Replay → Signoff
 * Voice-driven via Web Speech API — no external APIs required.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Volume2, ChevronRight, X, Trophy, Flame, Star, RotateCcw } from 'lucide-react'

// ─── Data ──────────────────────────────────────────────────────────────────

interface Word {
  it: string
  en: string
  phonetic: string
  world: 'classics' | 'queens' | 'family' | 'sports'
  hint: string
}

const WORDS: Word[] = [
  // Classics — Godfather / Shawshank / Gladiator
  { it: 'la famiglia',   en: 'the family',     phonetic: 'lah fa-MEE-lyah',   world: 'classics', hint: 'Like "the family" — the Corleones knew this one.' },
  { it: 'il rispetto',   en: 'respect',         phonetic: 'eel ree-SPET-toh',  world: 'classics', hint: 'What Vito demanded before anything else.' },
  { it: 'la libertà',    en: 'freedom',         phonetic: 'lah lee-behr-TAH',  world: 'classics', hint: 'What Andy Dufresne crawled through a river to find.' },
  { it: 'l\'onore',      en: 'honor',           phonetic: 'loh-NOH-reh',       world: 'classics', hint: '"My honor is my life." — gladiators swore by it.' },
  { it: 'il coraggio',   en: 'courage',         phonetic: 'eel koh-RAH-joh',   world: 'classics', hint: 'What it took to face the Colosseum.' },
  // Queens — stickball, first car, the block
  { it: 'la strada',     en: 'the street',      phonetic: 'lah STRAH-dah',     world: 'queens',   hint: 'The block where you grew up.' },
  { it: 'il quartiere',  en: 'the neighborhood',phonetic: 'eel kwahr-TYEH-reh',world: 'queens',   hint: 'Your corner of Queens.' },
  { it: 'la macchina',   en: 'the car',         phonetic: 'lah MAH-kee-nah',   world: 'queens',   hint: 'First car, hand-me-down from Uncle Sal.' },
  { it: 'il gioco',      en: 'the game',        phonetic: 'eel JOH-koh',       world: 'queens',   hint: 'Stickball in the street after school.' },
  { it: 'l\'amico',      en: 'the friend',      phonetic: 'lah-MEE-koh',       world: 'queens',   hint: 'The guy you\'d take a bullet for.' },
  // Food & Family — Sunday sauce, Christmas Eve, nonna's kitchen
  { it: 'il sugo',       en: 'the sauce',       phonetic: 'eel SOO-goh',       world: 'family',   hint: 'Sunday sauce, simmering since 7am.' },
  { it: 'la nonna',      en: 'grandma',         phonetic: 'lah NOH-nah',       world: 'family',   hint: 'She never used a recipe. Never needed one.' },
  { it: 'il pranzo',     en: 'Sunday lunch',    phonetic: 'eel PRAHN-tsoh',    world: 'family',   hint: 'Starts at noon. Ends when it ends.' },
  { it: 'il pane',       en: 'bread',           phonetic: 'eel PAH-neh',       world: 'family',   hint: 'For wiping the bowl clean — la scarpetta.' },
  { it: 'il vino',       en: 'wine',            phonetic: 'eel VEE-noh',       world: 'family',   hint: 'Watered down for the kids at Christmas Eve dinner.' },
  // Survival & Sports — shelter, fire, football
  { it: 'il fuoco',      en: 'fire',            phonetic: 'eel FWOH-koh',      world: 'sports',   hint: 'First thing you need. Also what you felt on that JV touchdown.' },
  { it: 'l\'acqua',      en: 'water',           phonetic: 'LAH-kwah',          world: 'sports',   hint: 'More important than food. More important than ego.' },
  { it: 'la vittoria',   en: 'victory',         phonetic: 'lah veet-TOH-ryah', world: 'sports',   hint: 'End zone. Trophy. Same word.' },
  { it: 'la forza',      en: 'strength',        phonetic: 'lah FOHR-tsah',     world: 'sports',   hint: '"Be strong." Your coach said it every practice.' },
  { it: 'il campo',      en: 'the field',       phonetic: 'eel KAHM-poh',      world: 'sports',   hint: 'The field where you made the play.' },
]

const WORLD_META = {
  classics: { label: 'The Classics',      emoji: '🎬', color: 'from-amber-900 to-slate-900',    accent: '#F59E0B', desc: 'Godfather · Shawshank · Gladiator' },
  queens:   { label: 'Queens, NY',        emoji: '🏙️', color: 'from-blue-950 to-slate-900',     accent: '#60A5FA', desc: 'The block · First car · Stickball' },
  family:   { label: 'Food & Family',     emoji: '🍝', color: 'from-red-950 to-slate-900',      accent: '#F87171', desc: 'Nonna\'s kitchen · Sunday sauce · Christmas Eve' },
  sports:   { label: 'Survival & Sports', emoji: '🏈', color: 'from-emerald-950 to-slate-900',  accent: '#34D399', desc: 'Shelter · Fire · JV touchdown' },
}

type Phase = 'checkin' | 'mission' | 'drill' | 'replay' | 'signoff'

// ─── Streak helpers ────────────────────────────────────────────────────────

function getStreak(): number {
  const last = localStorage.getItem('gabb-rich-last')
  const streak = parseInt(localStorage.getItem('gabb-rich-streak') ?? '0', 10)
  if (!last) return 0
  const diff = Math.floor((Date.now() - parseInt(last, 10)) / 86400000)
  return diff <= 1 ? streak : 0
}

function saveStreak(streak: number) {
  localStorage.setItem('gabb-rich-streak', String(streak))
  localStorage.setItem('gabb-rich-last', String(Date.now()))
}

// ─── Speech helpers ────────────────────────────────────────────────────────

function speak(text: string, lang = 'it-IT', rate = 0.82) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = lang; utt.rate = rate; utt.pitch = 1.05
  const doSpeak = () => window.speechSynthesis.speak(utt)
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true })
  } else { doSpeak() }
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function RichPlaylistPage() {
  const navigate = useNavigate()

  const [phase, setPhase] = useState<Phase>('checkin')
  const [worldKey, setWorldKey] = useState<Word['world']>('classics')
  const [drillIdx, setDrillIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [maxScore, setMaxScore] = useState(0)
  const [missed, setMissed] = useState<Word[]>([])
  const [replayIdx, setReplayIdx] = useState(0)
  const [listening, setListening] = useState(false)
  const [heardText, setHeardText] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'try' | null>(null)
  const [streak] = useState(() => getStreak())
  const [finalStreak, setFinalStreak] = useState(streak)

  const recRef = useRef<any>(null)
  const listeningRef = useRef(false)

  const worldWords = WORDS.filter(w => w.world === worldKey)
  const drillWord = phase === 'replay' ? missed[replayIdx] : worldWords[drillIdx]
  const meta = WORLD_META[worldKey]

  // Auto-speak drill word when it changes
  useEffect(() => {
    if ((phase === 'drill' || phase === 'replay') && drillWord) {
      const t = setTimeout(() => speak(drillWord.it), 500)
      return () => clearTimeout(t)
    }
  }, [drillIdx, replayIdx, phase, worldKey])

  function stopMic() {
    listeningRef.current = false
    recRef.current?.stop()
    setListening(false)
    setHeardText('')
  }

  const startMic = useCallback(() => {
    if (listeningRef.current) { stopMic(); return }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Voice needs Chrome or Edge.'); return }

    const rec = new SR()
    rec.lang = 'it-IT'
    rec.continuous = true
    rec.interimResults = true
    recRef.current = rec
    listeningRef.current = true
    setListening(true)
    setFeedback(null)
    setHeardText('')

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
          listeningRef.current = false
          rec.stop()
          setListening(false)
          gradeMic(latestFinal)
        }, 1200)
      }
    }

    rec.onend = () => {
      if (listeningRef.current) {
        try { rec.start() } catch { /* restarting */ }
      } else {
        setListening(false)
      }
    }

    rec.onerror = (e: any) => {
      if (e.error === 'aborted') return
      if (listeningRef.current) { try { rec.start() } catch {} }
      else { setListening(false) }
    }

    try { rec.start() } catch { setListening(false); listeningRef.current = false }
  }, [drillWord, phase]) // eslint-disable-line react-hooks/exhaustive-deps

  function gradeMic(heard: string) {
    if (!drillWord) return
    const target = drillWord.it.toLowerCase().replace(/[''']/g, "'")
    // Accept if heard contains at least one key word from the phrase
    const keyWords = target.split(/[\s,]+/).filter(w => w.length > 2)
    const hit = keyWords.some(kw => heard.includes(kw)) || heard.includes(target)
    if (hit) {
      setFeedback('correct')
      setScore(s => s + 1)
      speak('Bravo!', 'it-IT', 1.0)
      setTimeout(() => { setFeedback(null); advanceDrill() }, 1400)
    } else {
      setFeedback('try')
      speak(drillWord.it, 'it-IT', 0.7) // slower repeat
    }
  }

  function advanceDrill() {
    if (phase === 'replay') {
      if (replayIdx + 1 >= missed.length) { finishSession() }
      else { setReplayIdx(i => i + 1) }
    } else {
      if (drillIdx + 1 >= worldWords.length) {
        // Go to replay or signoff
        if (missed.length > 0) { setPhase('replay'); setReplayIdx(0) }
        else { finishSession() }
      } else { setDrillIdx(i => i + 1) }
    }
  }

  function skipWord() {
    if (phase === 'drill' && drillWord) {
      setMissed(prev => [...prev, drillWord])
    }
    advanceDrill()
  }

  function startDrill(world: Word['world']) {
    setWorldKey(world)
    setDrillIdx(0)
    setScore(0)
    setMaxScore(WORDS.filter(w => w.world === world).length)
    setMissed([])
    setPhase('drill')
  }

  function finishSession() {
    const newStreak = streak + 1
    setFinalStreak(newStreak)
    saveStreak(newStreak)
    setPhase('signoff')
    speak('Fantastico! Ottimo lavoro oggi, amico!', 'it-IT')
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${meta.color} relative overflow-hidden`}>

      {/* Cinematic top grain */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundSize: '200px' }} />

      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-4 bg-black/30 backdrop-blur border-b border-white/10">
        <button onClick={() => { window.speechSynthesis.cancel(); navigate('/dashboard') }}
          className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors">
          <X size={20} />
        </button>
        <div className="text-center">
          <p className="text-xs text-white/50 uppercase tracking-widest">Rich's Playlist</p>
          <p className="font-bold text-white text-sm">{meta.emoji} {meta.label}</p>
        </div>
        <div className="flex items-center gap-1.5 bg-orange-500/20 border border-orange-500/30 rounded-full px-3 py-1">
          <Flame size={13} className="text-orange-400" />
          <span className="text-xs font-bold text-orange-300">{streak}d</span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 py-6">
        <AnimatePresence mode="wait">

          {/* ── PHASE: Check-in ── */}
          {phase === 'checkin' && (
            <motion.div key="checkin" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="space-y-6">

              {/* Hero */}
              <div className="text-center pt-4 pb-2">
                <motion.div className="text-7xl mb-4" animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 3, repeat: Infinity }}>
                  🎬
                </motion.div>
                <h1 className="font-display text-3xl font-extrabold text-white leading-tight">
                  Buongiorno,<br />Rich.
                </h1>
                <p className="text-white/50 mt-2 text-sm">
                  Your 15-minute Italian session is ready.
                </p>
                {streak > 0 && (
                  <div className="inline-flex items-center gap-1.5 mt-3 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-1.5">
                    <Flame size={14} className="text-orange-400" />
                    <span className="text-sm text-orange-200 font-semibold">{streak}-day streak — keep it alive!</span>
                  </div>
                )}
              </div>

              {/* World selector */}
              <div>
                <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Choose your world</p>
                <div className="space-y-2.5">
                  {(Object.keys(WORLD_META) as Word['world'][]).map(key => {
                    const m = WORLD_META[key]
                    return (
                      <motion.button
                        key={key}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setWorldKey(key); setPhase('mission') }}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/25 hover:bg-white/10 transition-all text-left group"
                      >
                        <span className="text-3xl">{m.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white">{m.label}</p>
                          <p className="text-xs text-white/40 truncate">{m.desc}</p>
                        </div>
                        <div className="text-xs text-white/30 font-mono">{WORDS.filter(w => w.world === key).length} words</div>
                        <ChevronRight size={16} className="text-white/30 group-hover:text-white transition-colors shrink-0" />
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── PHASE: Mission ── */}
          {phase === 'mission' && (
            <motion.div key="mission" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="space-y-5">

              <div className="text-center">
                <span className="text-5xl">{meta.emoji}</span>
                <h2 className="font-display text-2xl font-extrabold text-white mt-3">{meta.label}</h2>
                <p className="text-white/50 text-sm mt-1">{meta.desc}</p>
              </div>

              {/* Today's words preview */}
              <div className="bg-black/30 border border-white/10 rounded-2xl p-4 space-y-2">
                <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Today's {worldWords.length} words</p>
                {worldWords.map(w => (
                  <div key={w.it} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                    <div>
                      <span className="text-white font-semibold text-sm">{w.it}</span>
                      <span className="text-white/30 text-xs ml-2">= {w.en}</span>
                    </div>
                    <button onClick={() => speak(w.it)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-colors">
                      <Volume2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => startDrill(worldKey)}
                className="w-full py-4 rounded-2xl font-bold text-lg text-slate-900 transition-all shadow-lg shadow-black/30"
                style={{ background: `linear-gradient(135deg, ${meta.accent}, ${meta.accent}CC)` }}
              >
                Let's Go! 🎯
              </motion.button>

              <button onClick={() => setPhase('checkin')} className="w-full text-center text-sm text-white/30 hover:text-white/60 transition-colors">
                ← Back to worlds
              </button>
            </motion.div>
          )}

          {/* ── PHASE: Drill ── */}
          {(phase === 'drill' || phase === 'replay') && drillWord && (
            <motion.div key={`drill-${phase}-${drillIdx}-${replayIdx}`}
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.02, y: -12 }}
              className="space-y-4">

              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: meta.accent }}
                    animate={{ width: `${((phase === 'replay' ? replayIdx : drillIdx) / (phase === 'replay' ? missed.length : worldWords.length)) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  />
                </div>
                <span className="text-xs text-white/40 font-mono shrink-0">
                  {phase === 'replay' ? `${replayIdx + 1}/${missed.length}` : `${drillIdx + 1}/${worldWords.length}`}
                </span>
              </div>

              {phase === 'replay' && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/15 border border-amber-500/25 rounded-xl">
                  <RotateCcw size={13} className="text-amber-400" />
                  <span className="text-xs text-amber-300 font-semibold">Replay — words you missed</span>
                </div>
              )}

              {/* Main card */}
              <div className="relative bg-black/40 border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
                {/* World badge */}
                <div className="absolute top-4 right-4 text-lg opacity-40">{meta.emoji}</div>

                <p className="text-white/30 text-xs uppercase tracking-widest mb-4">Say it in Italian</p>

                {/* English meaning */}
                <p className="text-white/60 text-base mb-2">{drillWord.en}</p>

                {/* Italian word */}
                <motion.div key={drillWord.it} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <h2 className="font-display text-4xl font-extrabold text-white mb-2">{drillWord.it}</h2>
                  <p className="text-sm font-mono text-white/40">{drillWord.phonetic}</p>
                </motion.div>

                {/* Hint */}
                <div className="mt-5 p-3 bg-white/5 rounded-xl">
                  <p className="text-xs text-white/40 italic">"{drillWord.hint}"</p>
                </div>

                {/* Listen button */}
                <button onClick={() => speak(drillWord.it)}
                  className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 rounded-xl bg-white/8 hover:bg-white/15 text-white/60 hover:text-white transition-all text-sm">
                  <Volume2 size={14} /> Hear it
                </button>
              </div>

              {/* Heard text feedback */}
              <AnimatePresence>
                {heardText && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className={`p-3 rounded-xl text-center text-sm border ${
                      feedback === 'correct'
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : feedback === 'try'
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                        : 'bg-white/5 border-white/10 text-white/60'
                    }`}>
                    {feedback === 'correct' && '✅ '}{feedback === 'try' && '🔄 '}
                    {feedback === 'correct' ? 'Bravo! Perfetto!' : feedback === 'try' ? `Heard "${heardText}" — try again` : `"${heardText}"`}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Controls */}
              <div className="flex items-center gap-3">
                {/* Skip */}
                <button onClick={skipWord}
                  className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/50 hover:text-white text-sm transition-all">
                  Skip →
                </button>

                {/* Mic */}
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={startMic}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg shadow-black/40 ${
                    listening
                      ? 'bg-red-500 border-2 border-red-300'
                      : 'border-2 border-white/20 hover:scale-105'
                  }`}
                  style={listening ? {} : { background: meta.accent }}
                >
                  {listening
                    ? <MicOff size={22} className="text-white" />
                    : <Mic size={22} className="text-slate-900" />
                  }
                </motion.button>

                {/* Tap to type */}
                <button onClick={() => { setFeedback('correct'); setScore(s => s + 1); setTimeout(advanceDrill, 600) }}
                  className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/50 hover:text-white text-sm transition-all">
                  ✓ Got it
                </button>
              </div>

              {/* Live mic pulse */}
              {listening && (
                <div className="flex justify-center gap-1">
                  {[0,1,2,3,4].map(i => (
                    <motion.div key={i} className="w-1 rounded-full"
                      style={{ background: meta.accent }}
                      animate={{ height: ['4px', '20px', '4px'] }}
                      transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }} />
                  ))}
                </div>
              )}

              {/* Score */}
              <div className="text-center text-xs text-white/30">
                Score: <span className="font-bold text-white/60">{score}</span>{maxScore > 0 && ` / ${maxScore}`}
              </div>
            </motion.div>
          )}

          {/* ── PHASE: Signoff ── */}
          {phase === 'signoff' && (
            <motion.div key="signoff" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="text-center space-y-6 pt-4">

              {/* Trophy */}
              <motion.div
                animate={{ rotate: [-5, 5, -5], scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-8xl"
              >
                🏆
              </motion.div>

              <div>
                <h2 className="font-display text-3xl font-extrabold text-white">Ottimo lavoro,<br />Rich!</h2>
                <p className="text-white/50 mt-2">That's how you do it — just like the old neighborhood.</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: <Star size={18} />, value: `${score}/${maxScore}`, label: 'Score' },
                  { icon: <Flame size={18} />, value: `${finalStreak}d`, label: 'Streak' },
                  { icon: <Trophy size={18} />, value: worldWords.length, label: 'Words' },
                ].map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="text-white/40 flex justify-center mb-1">{s.icon}</div>
                    <p className="font-display font-extrabold text-2xl text-white">{s.value}</p>
                    <p className="text-xs text-white/40">{s.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Missed words recap */}
              {missed.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-left">
                  <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider mb-2">Keep practicing</p>
                  {missed.map(w => (
                    <div key={w.it} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                      <span className="text-sm text-white">{w.it}</span>
                      <span className="text-xs text-white/40">{w.en}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Quote */}
              <div className="bg-black/30 border border-white/10 rounded-2xl p-4">
                <p className="text-sm text-white/60 italic">
                  "Leave the gun. Take the cannoli."<br />
                  <span className="text-white/30 text-xs not-italic">— Come back tomorrow to keep the streak going.</span>
                </p>
              </div>

              <div className="space-y-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setPhase('checkin'); setScore(0); setMissed([]) }}
                  className="w-full py-4 rounded-2xl font-bold text-slate-900"
                  style={{ background: meta.accent }}
                >
                  Play Again 🔁
                </motion.button>
                <button onClick={() => { window.speechSynthesis.cancel(); navigate('/dashboard') }}
                  className="w-full py-3 text-white/40 hover:text-white text-sm transition-colors">
                  Back to Dashboard
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
