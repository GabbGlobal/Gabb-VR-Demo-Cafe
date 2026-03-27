import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Video, Clock, ChevronDown, Calendar } from 'lucide-react'
import { Button } from '../ui/Button'

interface TutorSession {
  day: string
  time: string
  topic: string
  tutor: string
  avatar: string
  lang: string
  spotsLeft: number
}

const SESSIONS: TutorSession[] = [
  { day: 'Today',     time: '7:00 PM',  topic: 'Italian Café Conversations',  tutor: 'Marco',    avatar: '👨‍🏫', lang: '🇮🇹', spotsLeft: 3 },
  { day: 'Today',     time: '9:00 PM',  topic: 'Spanish Basics Live Q&A',      tutor: 'Valentina', avatar: '👩‍🏫', lang: '🇪🇸', spotsLeft: 8 },
  { day: 'Tomorrow',  time: '6:00 PM',  topic: 'French Pronunciation Drills',  tutor: 'Camille',   avatar: '👩‍🎓', lang: '🇫🇷', spotsLeft: 5 },
  { day: 'Tomorrow',  time: '8:00 PM',  topic: 'Italian Grammar Bootcamp',     tutor: 'Sofia',     avatar: '👩‍🏫', lang: '🇮🇹', spotsLeft: 2 },
  { day: 'Wed',       time: '7:30 PM',  topic: 'Portuguese Samba Phrases',     tutor: 'Lucas',     avatar: '🧑‍🏫', lang: '🇧🇷', spotsLeft: 6 },
]

export default function TutorSchedule() {
  const [open, setOpen] = useState(false)

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Video size={16} className="text-purple-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-white">Live Tutor Sessions</p>
            <p className="text-xs text-white/40">Interactive lessons with native speakers</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
            {SESSIONS.filter(s => s.day === 'Today').length} today
          </span>
          <ChevronDown size={16} className={`text-white/50 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2 border-t border-white/10 pt-4">
              {SESSIONS.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-xl"
                >
                  <span className="text-xl shrink-0">{s.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{s.lang}</span>
                      <p className="text-sm font-medium text-white truncate">{s.topic}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock size={10} className="text-white/30" />
                      <span className="text-xs text-white/40">{s.day} · {s.time}</span>
                      <span className="text-xs text-white/30">with {s.tutor}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-semibold ${s.spotsLeft <= 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {s.spotsLeft} spots
                    </p>
                    <Button size="sm" variant="primary" className="mt-1 text-[10px] h-6 px-2">
                      Join
                    </Button>
                  </div>
                </motion.div>
              ))}

              <div className="flex items-center gap-2 pt-1">
                <Calendar size={12} className="text-white/30" />
                <p className="text-xs text-white/30">Full schedule at gabbglobal.com/live</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
