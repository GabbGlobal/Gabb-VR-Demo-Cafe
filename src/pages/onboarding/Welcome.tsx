import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain } from 'lucide-react'
import { Button } from '../../components/ui/Button'

// Temporary onboarding state stored in sessionStorage so all steps share it
export function useOnboardingState() {
  const load = () => {
    try { return JSON.parse(sessionStorage.getItem('gabb-onboarding') ?? '{}') } catch { return {} }
  }
  const save = (data: Record<string, unknown>) => {
    sessionStorage.setItem('gabb-onboarding', JSON.stringify({ ...load(), ...data }))
  }
  return { load, save }
}

export default function WelcomePage() {
  const navigate = useNavigate()
  const { save } = useOnboardingState()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  function handleNext() {
    if (!name.trim()) return
    save({ name: name.trim(), email: email.trim() })
    navigate('/onboarding/language')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-gabb-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl gabb-gradient flex items-center justify-center mb-4 shadow-xl shadow-gabb-500/20">
            <Brain size={32} className="text-white" />
          </div>
          <h1 className="font-display text-3xl font-extrabold text-white">Welcome to Gabb</h1>
          <p className="text-white/50 mt-2 text-center">The world's first neuroadaptive language app.</p>
        </div>

        {/* Step indicator */}
        <StepDots current={0} total={5} />

        <div className="glass rounded-2xl p-6 mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Your first name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNext()}
              placeholder="e.g. Sofia"
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-gabb-500 focus:ring-1 focus:ring-gabb-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Email <span className="text-white/30">(optional — for progress sync)</span></label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNext()}
              placeholder="you@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-gabb-500 focus:ring-1 focus:ring-gabb-500 transition"
            />
          </div>

          <Button
            variant="gradient"
            fullWidth
            size="lg"
            disabled={!name.trim()}
            onClick={handleNext}
            className="mt-2"
          >
            Let's Go →
          </Button>
        </div>

        <p className="text-center text-xs text-white/30 mt-4">
          Your data stays on your device. We never sell it.
        </p>
      </motion.div>
    </div>
  )
}

export function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex justify-center gap-1.5">
      {[...Array(total)].map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all ${i === current ? 'w-6 h-1.5 bg-gabb-500' : i < current ? 'w-1.5 h-1.5 bg-gabb-500/50' : 'w-1.5 h-1.5 bg-white/20'}`}
        />
      ))}
    </div>
  )
}
