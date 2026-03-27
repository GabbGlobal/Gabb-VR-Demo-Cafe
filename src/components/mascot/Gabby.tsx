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

const MOOD_FACE: Record<GabbyMessage['mood'], string> = {
  happy:     '😊',
  excited:   '🤩',
  thinking:  '🤔',
  celebrate: '🎉',
  encourage: '💪',
}

const MOOD_COLOR: Record<GabbyMessage['mood'], string> = {
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
  // Buddy Hackett style — warm, self-deprecating, comedic
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
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${MOOD_COLOR[mood]} blur-md opacity-60`}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {/* Gabb Globe avatar — brand colors */}
        <div className="relative w-16 h-16 rounded-full shadow-xl overflow-hidden">
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
            <rect width="100" height="100" rx="50" fill="#DCF0F9"/>
            <defs>
              <mask id="gm">
                <rect width="100" height="100" fill="white"/>
                <circle cx="50" cy="50" r="26" fill="black"/>
                <polygon points="50,50 62,6 96,6 96,52" fill="black"/>
              </mask>
            </defs>
            <circle cx="50" cy="50" r="46" fill="#4CC8E8" mask="url(#gm)"/>
            <rect x="56" y="43" width="38" height="14" rx="5" fill="#4CC8E8"/>
            <path d="M 34 12 C 46 8 60 12 62 20 C 64 26 56 28 48 26 C 42 24 34 20 34 16 Z" fill="#4A9660"/>
            <path d="M 74 36 L 86 42 L 84 54 L 72 50 Z" fill="#4A9660"/>
            <path d="M 70 60 C 78 60 84 66 82 74 C 80 80 70 82 64 76 C 60 72 62 64 68 62 Z" fill="#4A9660"/>
          </svg>
          {/* Face overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl select-none drop-shadow-sm">{MOOD_FACE[mood]}</span>
          </div>
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
