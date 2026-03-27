import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface GabbyMessage {
  text: string
  mood: 'happy' | 'excited' | 'thinking' | 'celebrate' | 'encourage'
}

interface GabbyProps {
  message?: GabbyMessage
  autoMessages?: GabbyMessage[]
  autoInterval?: number // ms between auto messages
  position?: 'bottom-right' | 'bottom-left'
}

/** SVG path for Gabby's smile — curves based on mood */
const SMILE_PATH: Record<GabbyMessage['mood'], string> = {
  happy:     'M 36 63 Q 50 74 64 63',
  excited:   'M 32 61 Q 50 78 68 61',
  celebrate: 'M 30 60 Q 50 80 70 60',
  thinking:  'M 40 66 Q 50 68 60 66',
  encourage: 'M 37 63 Q 50 72 63 63',
}

/** Glow ring color behind Gabby avatar per mood */
const MOOD_GLOW: Record<GabbyMessage['mood'], string> = {
  happy:     'from-gabb-500 to-blue-500',
  excited:   'from-purple-500 to-pink-500',
  thinking:  'from-amber-500 to-orange-500',
  celebrate: 'from-emerald-500 to-teal-500',
  encourage: 'from-gabb-600 to-purple-600',
}

export const DEFAULT_MESSAGES: GabbyMessage[] = [
  { text: "Ciao! I'm Gabby 🌍 Ready to explore Italian together?", mood: 'happy' },
  { text: "Pro tip: Say each word OUT LOUD — your brain retains 3× more!", mood: 'thinking' },
  { text: "You're doing great! Consistency beats intensity every time. 🔥", mood: 'encourage' },
  { text: "Fun fact: Italian and English share 60% of their vocabulary roots!", mood: 'excited' },
  { text: "VR practice mode is coming — you'll walk into a real Roman café! 🍕", mood: 'excited' },
  { text: "Try connecting a heart rate monitor — I'll adapt your lessons live!", mood: 'thinking' },
  { text: "I've been pronouncing 'bruschetta' wrong for 20 years. YOU can do better! 🤌", mood: 'happy' },
  { text: "Hey — even Marco Polo got lost. That's no reason to quit Italian! 🗺️", mood: 'encourage' },
  { text: "Words you miss come back around. That's not a bug — that's how your brain works! 🧠", mood: 'thinking' },
  { text: "In Italy, saying ANYTHING in Italian with confidence will get you a free dessert. Probably. 🍮", mood: 'excited' },
  { text: "The timer is just keeping you honest. Italians talk FAST — might as well practice! ⏱️", mood: 'happy' },
  { text: "Hit 'Slow' on any word to hear it broken down. Even Romans needed practice! 🏛️", mood: 'thinking' },
]

export default function Gabby({ message, autoMessages, autoInterval = 12000, position = 'bottom-right' }: GabbyProps) {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [currentMsg, setCurrentMsg] = useState<GabbyMessage | null>(null)
  const [msgIndex, setMsgIndex] = useState(0)

  const messages = autoMessages ?? DEFAULT_MESSAGES

  // Show Gabby after a short delay on mount
  useEffect(() => {
    const show = setTimeout(() => {
      setCurrentMsg(message ?? messages[0])
      setVisible(true)
    }, 2000)
    return () => clearTimeout(show)
  }, [])

  // Cycle through messages if no specific message provided
  useEffect(() => {
    if (message) return
    if (!visible || dismissed) return
    const interval = setInterval(() => {
      const next = (msgIndex + 1) % messages.length
      setMsgIndex(next)
      setCurrentMsg(messages[next])
      setVisible(true)
    }, autoInterval)
    return () => clearInterval(interval)
  }, [visible, dismissed, msgIndex, message, messages, autoInterval])

  const mood = currentMsg?.mood ?? 'happy'
  const posClass = position === 'bottom-right' ? 'bottom-6 right-6' : 'bottom-6 left-6'
  const bubbleAlign = position === 'bottom-right' ? 'right-0' : 'left-0'

  return (
    <div className={`fixed ${posClass} z-50 flex flex-col items-end gap-2`}>
      <AnimatePresence>
        {visible && currentMsg && (
          <motion.div
            key={currentMsg.text}
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className={`absolute bottom-20 ${bubbleAlign} w-64 glass-strong rounded-2xl p-4 shadow-2xl shadow-black/40`}
          >
            {/* Dismiss */}
            <button
              onClick={() => { setVisible(false); setDismissed(true) }}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            >
              <X size={12} />
            </button>

            {/* Tail */}
            <div className={`absolute -bottom-2 ${position === 'bottom-right' ? 'right-6' : 'left-6'} w-4 h-4 glass-strong rotate-45 border-r border-b border-white/10`} />

            <p className="text-sm text-white leading-relaxed pr-4">{currentMsg.text}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gabby avatar */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setDismissed(false)
          setVisible(v => !v)
        }}
        className="relative"
        title="Gabby the Globe"
      >
        {/* Glow ring when has message */}
        {visible && (
          <motion.div
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${MOOD_GLOW[mood]} blur-md opacity-60`}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {/* Gabby Globe — full sphere with face */}
        <div className="relative w-16 h-16 rounded-full shadow-xl overflow-hidden">
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
            <defs>
              {/* Sphere gradient: lighter top-left → sky blue → deeper bottom-right */}
              <radialGradient id="gabby-sphere" cx="38%" cy="32%" r="65%">
                <stop offset="0%"   stopColor="#B8ECF8" />
                <stop offset="55%"  stopColor="#4CC8E8" />
                <stop offset="100%" stopColor="#1A90B8" />
              </radialGradient>
            </defs>

            {/* Sphere body */}
            <circle cx="50" cy="50" r="49" fill="url(#gabby-sphere)" />

            {/* Latitude lines — subtle globe feel */}
            <ellipse cx="50" cy="50" rx="49" ry="16" fill="none" stroke="white" strokeWidth="0.8" opacity="0.15" />
            <ellipse cx="50" cy="50" rx="49" ry="33" fill="none" stroke="white" strokeWidth="0.7" opacity="0.10" />

            {/* Continental blobs */}
            <ellipse cx="27" cy="34" rx="14" ry="9"   fill="#4A9660" opacity="0.88" transform="rotate(-20 27 34)" />
            <ellipse cx="58" cy="27" rx="10" ry="6"   fill="#4A9660" opacity="0.82" transform="rotate(12 58 27)" />
            <ellipse cx="73" cy="50" rx="8"  ry="6.5" fill="#5AA870" opacity="0.78" transform="rotate(20 73 50)" />
            <ellipse cx="34" cy="68" rx="10" ry="6"   fill="#4A9660" opacity="0.80" transform="rotate(-12 34 68)" />

            {/* Eyes — white sclera, dark pupils, shine dot */}
            <circle cx="37" cy="52" r="5.5" fill="white" />
            <circle cx="63" cy="52" r="5.5" fill="white" />
            <circle cx="38.8" cy="53.5" r="2.9" fill="#18293E" />
            <circle cx="64.8" cy="53.5" r="2.9" fill="#18293E" />
            <circle cx="40"   cy="51.8" r="1.1" fill="white" />
            <circle cx="66"   cy="51.8" r="1.1" fill="white" />

            {/* Smile — mood aware */}
            <path
              d={SMILE_PATH[mood]}
              stroke="white"
              strokeWidth="3.2"
              fill="none"
              strokeLinecap="round"
            />

            {/* Sphere highlight — top-left shine */}
            <ellipse cx="32" cy="25" rx="11" ry="7" fill="white" opacity="0.18" transform="rotate(-30 32 25)" />
          </svg>
        </div>

        {/* Name tag */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-2 py-0.5">
          <span className="text-[9px] font-bold text-white whitespace-nowrap">Gabby</span>
        </div>

        {/* Notification dot */}
        {!visible && (
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-gabb-500 rounded-full border-2 border-slate-950 flex items-center justify-center"
          >
            <span className="text-[8px] text-white font-bold">!</span>
          </motion.div>
        )}
      </motion.button>
    </div>
  )
}

// Hook to trigger custom Gabby messages from anywhere
export function useGabby() {
  const [message, setMessage] = useState<GabbyMessage | undefined>()

  const say = (text: string, mood: GabbyMessage['mood'] = 'happy') => {
    setMessage({ text, mood })
    setTimeout(() => setMessage(undefined), 8000)
  }

  const celebrate = (text = "Amazing! You're on fire! 🔥") => say(text, 'celebrate')
  const encourage = (text = "Don't worry — mistakes are how we learn!") => say(text, 'encourage')
  const hint = (text: string) => say(text, 'thinking')

  return { message, say, celebrate, encourage, hint }
}
