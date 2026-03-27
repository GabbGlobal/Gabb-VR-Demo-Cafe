import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import GabbLogo from '../../components/ui/GabbLogo'

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
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)

  function handleNext() {
    if (!name.trim() || !password.trim()) return
    save({ name: name.trim(), email: email.trim(), password })
    navigate('/onboarding/language')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Background splash */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#4CC8E8]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#4A9660]/6 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <GabbLogo size={72} className="mb-4 drop-shadow-xl" />
          <h1 className="font-display text-3xl font-extrabold text-white tracking-tight">
            Welcome to Gabb Global
          </h1>
          <p className="text-white/50 mt-2 text-center text-sm leading-relaxed max-w-sm">
            The world's first neuroadaptive language platform. No stress, no streaks — just real conversation confidence.
          </p>
        </div>

        {/* No-anxiety promise */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-5"
        >
          <span className="text-2xl">🎙️</span>
          <p className="text-xs text-emerald-300 leading-relaxed">
            <span className="font-semibold">Speak without anxiety.</span> Start with listening and reading — switch on the mic only when you're ready. No pressure, ever.
          </p>
        </motion.div>

        {/* Step indicator */}
        <StepDots current={0} total={9} />

        <div className="glass rounded-2xl p-6 mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Your first name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNext()}
              placeholder="e.g. Rich"
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[#4CC8E8] focus:ring-1 focus:ring-[#4CC8E8] transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              Email <span className="text-white/30">(optional — for progress sync)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[#4CC8E8] focus:ring-1 focus:ring-[#4CC8E8] transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Create a PIN / password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleNext()}
                placeholder="Choose a password (min 4 chars)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/30 outline-none focus:border-[#4CC8E8] focus:ring-1 focus:ring-[#4CC8E8] transition"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-white/30 mt-1">Keeps your progress locked on this device</p>
          </div>

          <Button
            variant="gradient"
            fullWidth
            size="lg"
            disabled={!name.trim() || password.trim().length < 4}
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
          className={`rounded-full transition-all ${
            i === current
              ? 'w-6 h-1.5 bg-[#4CC8E8]'
              : i < current
              ? 'w-1.5 h-1.5 bg-[#4CC8E8]/50'
              : 'w-1.5 h-1.5 bg-white/20'
          }`}
        />
      ))}
    </div>
  )
}
