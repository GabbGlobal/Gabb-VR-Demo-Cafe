import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../../components/ui/Button'
import { StepDots, useOnboardingState } from './Welcome'
import type { Gender, Orientation } from '../../types'

const genders: { value: Gender; label: string; emoji: string }[] = [
  { value: 'man',         label: 'Man',            emoji: '👨' },
  { value: 'woman',       label: 'Woman',          emoji: '👩' },
  { value: 'nonbinary',   label: 'Non-binary',     emoji: '🧑' },
  { value: 'prefer-not',  label: 'Prefer not to say', emoji: '🙂' },
]

const orientations: { value: Orientation; label: string; emoji: string }[] = [
  { value: 'men',         label: 'Men',            emoji: '👨' },
  { value: 'women',       label: 'Women',          emoji: '👩' },
  { value: 'everyone',    label: 'Everyone',       emoji: '💖' },
  { value: 'prefer-not',  label: 'Prefer not to say', emoji: '🙂' },
]

export default function PersonalizePage() {
  const navigate = useNavigate()
  const { load, save } = useOnboardingState()
  const data = load()
  const [gender, setGender] = useState<Gender>(data.gender ?? 'prefer-not')
  const [orientation, setOrientation] = useState<Orientation>(data.orientation ?? 'prefer-not')

  function handleNext() {
    save({ gender, orientation })
    navigate('/onboarding/biosensor')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-purple-500/8 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl font-bold text-white">Personalise Your Vocabulary</h2>
          <p className="text-white/50 mt-2">
            This helps us surface the most relevant words for your real conversations.
            All answers are stored only on your device.
          </p>
        </div>

        <StepDots current={3} total={5} />

        <div className="space-y-6 mt-6">
          {/* Gender */}
          <div className="glass rounded-2xl p-5">
            <p className="font-semibold text-white mb-4">I identify as...</p>
            <div className="grid grid-cols-2 gap-2">
              {genders.map(g => (
                <button
                  key={g.value}
                  onClick={() => setGender(g.value)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    gender === g.value
                      ? 'bg-gabb-500/20 border border-gabb-500/50 text-white'
                      : 'bg-white/5 border border-transparent text-white/60 hover:bg-white/10'
                  }`}
                >
                  <span>{g.emoji}</span>
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Orientation */}
          <div className="glass rounded-2xl p-5">
            <p className="font-semibold text-white mb-1">I'm interested in...</p>
            <p className="text-xs text-white/40 mb-4">Used to personalise romance and social vocabulary.</p>
            <div className="grid grid-cols-2 gap-2">
              {orientations.map(o => (
                <button
                  key={o.value}
                  onClick={() => setOrientation(o.value)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    orientation === o.value
                      ? 'bg-gabb-500/20 border border-gabb-500/50 text-white'
                      : 'bg-white/5 border border-transparent text-white/60 hover:bg-white/10'
                  }`}
                >
                  <span>{o.emoji}</span>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-white/30 mt-4">
          You can change these any time in settings.
        </p>

        <div className="flex gap-3 mt-6">
          <Button variant="ghost" onClick={() => navigate('/onboarding/interests')}>Back</Button>
          <Button variant="gradient" fullWidth size="lg" onClick={handleNext}>
            Continue →
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
