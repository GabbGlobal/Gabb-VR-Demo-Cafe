import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../../components/ui/Button'
import { StepDots, useOnboardingState } from './Welcome'
import type { UserProfile } from '../../types'

const GOALS: { value: UserProfile['goal']; emoji: string; label: string; desc: string }[] = [
  { value: 'travel',   emoji: '✈️', label: 'Travel & Vacation',    desc: 'Order food, get around, make memories' },
  { value: 'business', emoji: '💼', label: 'Business',              desc: 'Meetings, negotiations, networking' },
  { value: 'academic', emoji: '🎓', label: 'School / Academic',     desc: 'Exams, essays, academic reading' },
  { value: 'family',   emoji: '❤️', label: 'Family & Romance',      desc: 'Connect with loved ones & partners' },
  { value: 'culture',  emoji: '🎭', label: 'Culture & Hobby',       desc: 'Films, music, art, cuisine' },
  { value: 'fluency',  emoji: '🗣️', label: 'Full Fluency',          desc: 'Think and dream in the language' },
]

export default function GoalPage() {
  const navigate = useNavigate()
  const { load, save } = useOnboardingState()
  const [goal, setGoal] = useState<UserProfile['goal']>(load().goal ?? 'travel')

  function handleNext() {
    save({ goal })
    navigate('/onboarding/time-commit')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-[#4CC8E8]/7 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🎯</div>
          <h2 className="font-display text-3xl font-bold text-white">What's your main goal?</h2>
          <p className="text-white/50 mt-2 text-sm">
            Gabby will build your vocabulary plan around this.
          </p>
        </div>

        <StepDots current={5} total={9} />

        <div className="grid grid-cols-2 gap-3 mt-6">
          {GOALS.map((g, i) => (
            <motion.button
              key={g.value}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => setGoal(g.value)}
              className={`p-4 rounded-2xl text-left transition-all border ${
                goal === g.value
                  ? 'bg-[#4CC8E8]/15 border-[#4CC8E8]/50 shadow-lg shadow-[#4CC8E8]/10'
                  : 'bg-white/5 border-white/10 hover:bg-white/8'
              }`}
            >
              <span className="text-2xl block mb-2">{g.emoji}</span>
              <p className={`font-semibold text-sm ${goal === g.value ? 'text-white' : 'text-white/70'}`}>
                {g.label}
              </p>
              <p className="text-xs text-white/40 mt-0.5 leading-snug">{g.desc}</p>
            </motion.button>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="ghost" onClick={() => navigate('/onboarding/biosensor')}>Back</Button>
          <Button variant="gradient" fullWidth size="lg" onClick={handleNext}>
            Continue →
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
