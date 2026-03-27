import { motion, AnimatePresence } from 'framer-motion'
import { Lightbulb, X } from 'lucide-react'
import type { VocabWord } from '../../types'

interface MnemonicPopupProps {
  word: VocabWord
  onDismiss: () => void
}

// Generate a simple mnemonic hint based on the word
function getMnemonic(word: VocabWord): string {
  const mnemonics: Record<string, string> = {
    'ciao':         '"Ciao" sounds like "chow" — imagine saying bye to your chow mein! 🍜',
    'grazie':       '"Grazie" → think "grassy" — thank the grass for existing! 🌿',
    'prego':        '"Prego" like the pasta sauce — serve it up with a smile! 🍝',
    'buongiorno':   '"Buon" = good + "giorno" = day. Good day, sunshine! ☀️',
    'buonasera':    '"Sera" sounds like "sierra" mountains at sunset. Good evening! 🏔️',
    'per favore':   '"Per favore" — picture a favour being passed per person! 🤝',
    'aeroporto':    '"Aero" (air) + "porto" (port) = air port. Same in English! ✈️',
    'ristorante':   '"Ristorante" → restaurant. Almost identical! 🍽️',
    'biglietto':    '"Biglietto" sounds like "billy-etto" — Billy bought a ticket! 🎫',
    'passaporto':   '"Passa" (pass) + "porto" (port) = passport! Same root! 🛂',
    'sinistra':     '"Sinistra" = sinister = left (historically "unlucky" side) 👈',
    'destra':       '"Destra" sounds like "dexterous" — right hand is often dominant! 👉',
    'quanto costa': '"Quanto costa" — how much does it COST? "Costa" = cost! 💰',
  }
  return mnemonics[word.native.toLowerCase()]
    ?? `"${word.native}" → "${word.translation}". Say it 3× and picture it clearly: ${word.exampleTranslation}`
}

export default function MnemonicPopup({ word, onDismiss }: MnemonicPopupProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="glass-strong rounded-2xl p-5 border border-amber-500/30 bg-amber-500/5 relative"
      >
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Lightbulb size={16} className="text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1">Memory Hook</p>
            <p className="text-sm text-white leading-relaxed">{getMnemonic(word)}</p>
            <p className="text-xs text-white/40 mt-2 italic">"{word.example}"</p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
