/**
 * AI Tutor — "Gabby Gabb the Globe"
 * Zoom-style conversation interface with the animated globe avatar.
 * Scripted Italian conversation flows + Web Speech synthesis + mic input.
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mic, MicOff, PhoneOff, Volume2 } from 'lucide-react'
import { useUserStore } from '../store/userStore'
import GabbLogo from '../components/ui/GabbLogo'

interface Message { id: string; from: 'gabby' | 'user'; text: string; timestamp: Date }

// Scripted conversation flows — Gabby guides the user through Italian topics
const CONVERSATIONS: { topic: string; emoji: string; exchanges: { gabby: string; prompt: string; hint: string }[] }[] = [
  {
    topic: 'Ordering Coffee',
    emoji: '☕',
    exchanges: [
      { gabby: 'Ciao! I\'m Gabby. Ready to practice ordering at an Italian café? Say "Ciao!" to start!', prompt: 'Ciao!', hint: '"Ciao" means Hello / Bye' },
      { gabby: 'Buongiorno! What can I get you? Try saying "Un caffè, per favore" — one coffee please!', prompt: 'Un caffè, per favore', hint: '"Un caffè, per favore" = a coffee, please' },
      { gabby: 'Perfetto! And do you want milk? Say "Con latte" (with milk) or "Senza latte" (without milk).', prompt: 'Con latte', hint: '"Con" = with, "Senza" = without' },
      { gabby: 'Bene! When you\'re ready to pay, say "Il conto, per favore" — the bill, please!', prompt: 'Il conto, per favore', hint: 'The magic phrase at any Italian restaurant' },
      { gabby: 'Meraviglioso! You just ordered your first Italian coffee. Say "Grazie!" to thank me!', prompt: 'Grazie!', hint: '"Grat-zee-yeh" — thank you' },
    ],
  },
  {
    topic: 'Getting Around',
    emoji: '🗺️',
    exchanges: [
      { gabby: 'Ciao di nuovo! Let\'s practice asking for directions. First, say "Scusi" to politely get someone\'s attention.', prompt: 'Scusi', hint: '"Scusi" = Excuse me (polite form)' },
      { gabby: 'Bene! Now ask where the train station is: "Dov\'è la stazione?"', prompt: "Dov'è la stazione?", hint: '"Dov\'è" = Where is, "la stazione" = the station' },
      { gabby: 'The Italian says "A destra!" — meaning To the right! Can you repeat that?', prompt: 'A destra!', hint: '"A destra" = to the right, "a sinistra" = to the left' },
      { gabby: 'And if you\'re lost, say "Sono perso/a" — I\'m lost!', prompt: 'Sono persa', hint: '"Sono" = I am, "perso/a" depends on gender' },
      { gabby: 'Bravo! Now say "Grazie mille" — thank you very much!', prompt: 'Grazie mille', hint: '"Mille" = a thousand — so "a thousand thanks!"' },
    ],
  },
  {
    topic: 'Shopping',
    emoji: '🛍️',
    exchanges: [
      { gabby: 'Benvenuto al mercato! Let\'s shop. Ask "Quanto costa?" — How much does it cost?', prompt: 'Quanto costa?', hint: '"Quanto" = how much, "costa" = costs' },
      { gabby: 'È caro! (It\'s expensive!) Try to negotiate: "Può fare uno sconto?" — Can you give a discount?', prompt: 'Può fare uno sconto?', hint: '"Sconto" = discount — Italians love a deal' },
      { gabby: 'Say you want to buy it: "Lo prendo" — I\'ll take it!', prompt: 'Lo prendo', hint: '"Prendo" = I take/I\'ll have' },
      { gabby: 'Ask if they accept cards: "Accetta carte di credito?"', prompt: 'Accetta carte di credito?', hint: 'Essential everywhere — not all Italian shops take cards!' },
      { gabby: 'Eccellente! Say goodbye: "Arrivederci!"', prompt: 'Arrivederci!', hint: '"Arrivederci" = Goodbye (formal)' },
    ],
  },
]

function speak(text: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = 'it-IT'
  utt.rate = 0.8
  utt.pitch = 1.1
  const doSpeak = () => window.speechSynthesis.speak(utt)
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true })
  } else {
    doSpeak()
  }
}

export default function AITutorPage() {
  const navigate = useNavigate()
  const profile = useUserStore(s => s.profile)

  const [convoIdx, setConvoIdx] = useState(0)
  const [exchangeIdx, setExchangeIdx] = useState(0)
  const [messages, setMessages] = useState<Message[]>([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [micOn, setMicOn] = useState(false)
  const [listening, setListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [callActive, setCallActive] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recRef = useRef<any>(null)
  const listeningRef = useRef(false)

  const convo = CONVERSATIONS[convoIdx]
  const exchange = convo.exchanges[exchangeIdx]

  // Gabby speaks first on load and when exchange changes
  useEffect(() => {
    if (!callActive) return
    const t = setTimeout(() => {
      addMessage('gabby', exchange.gabby)
      setIsSpeaking(true)
      speak(exchange.gabby)
      setTimeout(() => setIsSpeaking(false), exchange.gabby.length * 55)
    }, 600)
    return () => clearTimeout(t)
  }, [exchangeIdx, convoIdx, callActive])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function addMessage(from: 'gabby' | 'user', text: string) {
    setMessages(prev => [...prev, { id: `${Date.now()}-${from}`, from, text, timestamp: new Date() }])
  }

  function userSays(text: string) {
    addMessage('user', text)
    setTimeout(() => {
      if (exchangeIdx + 1 >= convo.exchanges.length) {
        // Conversation complete!
        addMessage('gabby', `Fantastico, ${profile?.name ?? 'amico'}! You completed "${convo.topic}"! 🎉 Pick another topic to keep going!`)
        speak('Fantastico! You completed this topic!')
      } else {
        setExchangeIdx(i => i + 1)
      }
    }, 800)
  }

  function startMic() {
    // Toggle off if already listening
    if (listeningRef.current) {
      listeningRef.current = false
      recRef.current?.stop()
      setListening(false)
      setInterimText('')
      return
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Voice needs Chrome or Edge — or tap the phrase button below.'); return }

    const rec = new SR()
    rec.lang = 'it-IT'
    rec.continuous = true
    rec.interimResults = true
    recRef.current = rec
    listeningRef.current = true
    setListening(true)

    let silenceTimer: ReturnType<typeof setTimeout> | null = null
    let finalText = ''

    rec.onresult = (e: any) => {
      const results = Array.from(e.results as any[])
      const transcript = results.map((r: any) => r[0].transcript).join('')
      setInterimText(transcript)

      // Once we have a final result, wait 1.2s of silence then submit
      if ((e.results as any)[e.results.length - 1].isFinal) {
        finalText = transcript
        if (silenceTimer) clearTimeout(silenceTimer)
        silenceTimer = setTimeout(() => {
          if (!finalText.trim()) return
          listeningRef.current = false
          rec.stop()
          setListening(false)
          setInterimText('')
          userSays(finalText)
          finalText = ''
        }, 1200)
      }
    }

    // Auto-restart on end so it never times out mid-conversation
    rec.onend = () => {
      if (listeningRef.current) {
        try { rec.start() } catch { /* already restarting */ }
      } else {
        setListening(false)
      }
    }

    rec.onerror = (e: any) => {
      if (e.error === 'aborted') return
      if (listeningRef.current) {
        try { rec.start() } catch {}
      } else {
        setListening(false)
        setInterimText('')
      }
    }

    try { rec.start() } catch { setListening(false); listeningRef.current = false }
  }

  function endCall() {
    window.speechSynthesis.cancel()
    setCallActive(false)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Call header */}
      <div className="sticky top-0 z-20 glass border-b border-white/10 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button onClick={endCall} className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <GabbLogo size={32} />
            <div>
              <p className="font-display font-bold text-white text-sm">Gabby · AI Tutor</p>
              <p className="text-xs text-emerald-400">{callActive ? '● Live Session' : 'Ended'}</p>
            </div>
          </div>
          {/* Topic selector */}
          <div className="flex gap-1">
            {CONVERSATIONS.map((c, i) => (
              <button
                key={i}
                onClick={() => { setConvoIdx(i); setExchangeIdx(0); setMessages([]) }}
                className={`text-lg p-1.5 rounded-lg transition-colors ${convoIdx === i ? 'bg-[#4CC8E8]/20 text-[#4CC8E8]' : 'text-white/30 hover:text-white hover:bg-white/10'}`}
                title={c.topic}
              >
                {c.emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Video call area */}
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col p-4 gap-4">

        {/* Gabby "video" tile */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 aspect-video flex items-center justify-center">
          {/* Animated background waves */}
          <div className="absolute inset-0">
            {[1,2,3].map(i => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-3xl border border-[#4CC8E8]/10"
                animate={{ scale: [1, 1 + i * 0.04], opacity: [0.5, 0] }}
                transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
              />
            ))}
          </div>

          {/* Gabby Globe avatar — full face, animated */}
          <div className="relative flex flex-col items-center gap-3">
            <motion.div
              className="relative w-32 h-32"
              animate={isSpeaking
                ? { scale: [1, 1.04, 0.98, 1.03, 1], rotate: [0, 1.5, -1.5, 1, 0] }
                : { scale: [1, 1.015, 1] }
              }
              transition={{ duration: isSpeaking ? 0.55 : 4, repeat: Infinity }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_18px_rgba(76,200,232,0.45)]">
                <defs>
                  <radialGradient id="tutor-globe" cx="38%" cy="32%" r="65%">
                    <stop offset="0%" stopColor="#B8ECF8" />
                    <stop offset="55%" stopColor="#4CC8E8" />
                    <stop offset="100%" stopColor="#1A90B8" />
                  </radialGradient>
                </defs>
                <circle cx="50" cy="50" r="49" fill="url(#tutor-globe)" />
                <ellipse cx="50" cy="50" rx="49" ry="16" fill="none" stroke="white" strokeWidth="0.8" opacity="0.15" />
                <ellipse cx="50" cy="50" rx="49" ry="33" fill="none" stroke="white" strokeWidth="0.7" opacity="0.10" />
                <ellipse cx="27" cy="34" rx="14" ry="9" fill="#4A9660" opacity="0.88" transform="rotate(-20 27 34)" />
                <ellipse cx="58" cy="27" rx="10" ry="6" fill="#4A9660" opacity="0.82" transform="rotate(12 58 27)" />
                <ellipse cx="73" cy="50" rx="8" ry="6.5" fill="#5AA870" opacity="0.78" transform="rotate(20 73 50)" />
                <ellipse cx="34" cy="68" rx="10" ry="6" fill="#4A9660" opacity="0.80" transform="rotate(-12 34 68)" />
                {/* Eyes */}
                <circle cx="37" cy="50" r="6" fill="white" />
                <circle cx="63" cy="50" r="6" fill="white" />
                <circle cx="38.8" cy="51.5" r="3.2" fill="#18293E" />
                <circle cx="64.8" cy="51.5" r="3.2" fill="#18293E" />
                <circle cx="40.2" cy="49.5" r="1.3" fill="white" />
                <circle cx="66.2" cy="49.5" r="1.3" fill="white" />
                {/* Mouth: open oval when speaking, smile when not */}
                {isSpeaking
                  ? <ellipse cx="50" cy="67" rx="9" ry="7" fill="white" opacity="0.92" />
                  : <path d="M 35 63 Q 50 75 65 63" stroke="white" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                }
                {/* Cheek blush when speaking */}
                {isSpeaking && <>
                  <ellipse cx="26" cy="58" rx="6" ry="4" fill="#FF9999" opacity="0.25" />
                  <ellipse cx="74" cy="58" rx="6" ry="4" fill="#FF9999" opacity="0.25" />
                </>}
                <ellipse cx="32" cy="25" rx="11" ry="7" fill="white" opacity="0.18" transform="rotate(-30 32 25)" />
              </svg>

              {/* Blinking eyelids */}
              <BlinkingEyes />
            </motion.div>

            {/* Speaking waveform */}
            {isSpeaking && (
              <div className="flex gap-1 items-center">
                {[0,1,2,3,4].map(i => (
                  <motion.div key={i} className="w-1 rounded-full bg-[#4CC8E8]"
                    animate={{ height: ['4px', '18px', '4px'] }}
                    transition={{ duration: 0.45, delay: i * 0.09, repeat: Infinity }} />
                ))}
              </div>
            )}

            {/* Interim speech text */}
            {listening && interimText && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-white/10 backdrop-blur rounded-xl px-3 py-1 text-xs text-white/80 max-w-[200px] text-center">
                "{interimText}"
              </motion.div>
            )}

            <p className="text-white/60 text-sm font-medium tracking-wide">Gabby</p>
          </div>

          {/* Your video tile (corner) */}
          <div className="absolute bottom-3 right-3 w-20 h-14 rounded-xl bg-slate-700/80 border border-white/10 flex items-center justify-center overflow-hidden">
            <span className="text-3xl">🧑</span>
          </div>
        </div>

        {/* Hint bubble */}
        <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <span className="text-amber-400">💡</span>
          <p className="text-xs text-amber-300">
            <span className="font-semibold">Try saying:</span> "{exchange.prompt}" · <span className="text-amber-400/60">{exchange.hint}</span>
          </p>
          <button
            onClick={() => speak(exchange.prompt)}
            className="ml-auto p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 transition-colors shrink-0"
          >
            <Volume2 size={12} />
          </button>
        </div>

        {/* Chat messages */}
        <div className="flex-1 space-y-3 max-h-48 overflow-y-auto pr-1">
          <AnimatePresence>
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${msg.from === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                  msg.from === 'gabby'
                    ? 'bg-slate-800 border border-white/10 text-white rounded-tl-sm'
                    : 'bg-[#4CC8E8]/20 border border-[#4CC8E8]/30 text-white rounded-tr-sm'
                }`}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {/* Quick-type the prompt */}
          <button
            onClick={() => userSays(exchange.prompt)}
            className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-white/60 hover:bg-white/10 hover:text-white transition-all text-center"
          >
            Type: <span className="text-[#4CC8E8] font-medium">"{exchange.prompt}"</span>
          </button>

          {/* Mic button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={startMic}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
              listening
                ? 'bg-red-500 border-2 border-red-300 animate-pulse'
                : 'bg-[#4CC8E8] border-2 border-[#4CC8E8]/50 hover:scale-105'
            }`}
          >
            {listening ? <MicOff size={22} className="text-white" /> : <Mic size={22} className="text-white" />}
          </motion.button>

          {/* End call */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={endCall}
            className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center hover:bg-red-500 transition-all"
          >
            <PhoneOff size={20} className="text-red-400 hover:text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}

/** Animated eyelids that blink over the globe's eyes every ~4 seconds */
function BlinkingEyes() {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      {/* Left eyelid */}
      <motion.div
        className="absolute rounded-full"
        style={{
          background: '#4CC8E8',
          left: '24%',
          top: '40%',
          width: '13%',
          height: '13%',
          transformOrigin: 'center top',
        }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: [0, 1, 0] }}
        transition={{ duration: 0.14, repeat: Infinity, repeatDelay: 4.2 }}
      />
      {/* Right eyelid */}
      <motion.div
        className="absolute rounded-full"
        style={{
          background: '#4CC8E8',
          left: '56%',
          top: '40%',
          width: '13%',
          height: '13%',
          transformOrigin: 'center top',
        }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: [0, 1, 0] }}
        transition={{ duration: 0.14, repeat: Infinity, repeatDelay: 4.2 }}
      />
    </div>
  )
}
