import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { LANGUAGES } from '../../data/languages'
import { StepDots, useOnboardingState } from './Welcome'
import type { LanguageCode } from '../../types'

export default function LanguageSelectPage() {
  const navigate = useNavigate()
  const { load, save } = useOnboardingState()
  const existing: LanguageCode[] = load().languages ?? []
  const [selected, setSelected] = useState<LanguageCode[]>(existing)

  function toggle(code: LanguageCode) {
    setSelected(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code],
    )
  }

  function handleNext() {
    if (selected.length === 0) return
    save({ languages: selected, activeLanguage: selected[0] })
    navigate('/onboarding/interests')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-lg">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl font-bold text-white">Choose Your Languages</h2>
          <p className="text-white/50 mt-2">Select all the languages you want to learn.</p>
        </div>

        <StepDots current={1} total={5} />

        <div className="grid grid-cols-2 gap-4 mt-6">
          {LANGUAGES.map((lang, i) => {
            const isSelected = selected.includes(lang.code)
            return (
              <motion.button
                key={lang.code}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => toggle(lang.code)}
                className={`glass rounded-2xl p-5 text-left relative transition-all ${isSelected ? 'border-gabb-500/60 bg-gabb-500/10' : 'hover:bg-white/8'}`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-gabb-500 flex items-center justify-center">
                    <Check size={12} strokeWidth={3} className="text-white" />
                  </div>
                )}
                <div className="text-4xl mb-3">{lang.flag}</div>
                <p className="font-semibold text-white">{lang.name}</p>
                <p className="text-xs text-white/40">{lang.nativeName}</p>
                <p className="text-xs text-white/30 mt-2">{lang.difficulty}</p>
                <p className="text-sm text-gabb-400 font-semibold mt-2">${lang.priceMonthly}/mo</p>
              </motion.button>
            )
          })}
        </div>

        {selected.length > 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm text-white/40 mt-4">
            {selected.length === 1 ? 'Perfect choice!' : `${selected.length} languages selected — ${selected.length > 1 ? 'All Access plan recommended' : ''}`}
          </motion.p>
        )}

        <div className="flex gap-3 mt-6">
          <Button variant="ghost" onClick={() => navigate('/onboarding/welcome')}>Back</Button>
          <Button variant="gradient" fullWidth size="lg" disabled={selected.length === 0} onClick={handleNext}>
            Continue →
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
