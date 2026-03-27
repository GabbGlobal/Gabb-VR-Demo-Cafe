import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../../components/ui/Button'
import { StepDots, useOnboardingState } from './Welcome'
import type { UserProfile } from '../../types'

const OPTIONS: { value: UserProfile['dailyMinutes']; emoji: string; label: string; desc: string; words: string }[] = [
  { value: 5,  emoji: '⚡', label: '5 min / day',     desc: 'Quick Mind Snack',       words: '~200 words in 6 months' },
  { value: 15, emoji: '🌱', label: '15 min / day',    desc: 'The Steady Climber',     words: '~700 words in 6 months' },
  { value: 30, emoji: '🚀', label: '30 min / day',    desc: 'The Fast Tracker',       words: '~1,500 words in 6 months' },
  { value: 60, emoji: '🔥', label: '1+ hour / day',   desc: 'Full Immersion',         words: '2,000 words in 6 months ✓' },
]

export default function TimeCommitPage() {
  const navigate = useNavigate()
  const { load, save } = useOnboardingState()
  const [minutes, setMinutes] = useState<UserProfile['dailyMinutes']>(load().dailyMinutes ?? 15)

  function handleNext() {
    save({ dailyMinutes: minutes })
    navigate('/onboarding/placement')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-purple-600/6 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">⏱️</div>
          <h2 className="font-display text-3xl font-bold text-white">How much time can you commit?</h2>
          <p className="text-white/50 mt-2 text-sm">
            We'll build your daily plan around this. You can always adjust in settings.
          </p>
        </div>

        <StepDots current={6} total={9} />

        <div className="space-y-3 mt-6">
          {OPTIONS.map((opt, i) => (
            <motion.button
              key={String(opt.value)}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => setMinutes(opt.value)}
              className={`w-full p-4 rounded-2xl text-left flex items-center gap-4 transition-all border ${
                minutes === opt.value
                  ? 'bg-[#4CC8E8]/15 border-[#4CC8E8]/50'
                  : 'bg-white/5 border-white/10 hover:bg-white/8'
              }`}
            >
              <span className="text-3xl">{opt.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className={`font-semibold ${minutes === opt.value ? 'text-white' : 'text-white/70'}`}>
                    {opt.label}
                  </p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    opt.value === 60
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-white/10 text-white/40'
                  }`}>
                    {opt.words}
                  </span>
                </div>
                <p className="text-xs text-white/40 mt-0.5">{opt.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>

        {minutes === 60 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl"
          >
            <p className="text-xs text-amber-300 text-center">
              🏆 <span className="font-semibold">Money-back guarantee:</span> 2,000 words in 6 months — or your money back.
            </p>
          </motion.div>
        )}

        <div className="flex gap-3 mt-6">
          <Button variant="ghost" onClick={() => navigate('/onboarding/goal')}>Back</Button>
          <Button variant="gradient" fullWidth size="lg" onClick={handleNext}>
            Continue →
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
