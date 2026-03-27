import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../../components/ui/Button'
import { INTEREST_CATEGORIES } from '../../data/languages'
import { StepDots, useOnboardingState } from './Welcome'
import type { VocabCategory } from '../../types'

export default function InterestSelectPage() {
  const navigate = useNavigate()
  const { load, save } = useOnboardingState()
  const existing: VocabCategory[] = load().interests ?? ['essentials']
  const [selected, setSelected] = useState<VocabCategory[]>(existing)

  function toggle(id: VocabCategory) {
    if (id === 'essentials') return // always included
    setSelected(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id],
    )
  }

  function handleNext() {
    const withEssentials = selected.includes('essentials') ? selected : ['essentials' as VocabCategory, ...selected]
    save({ interests: withEssentials })
    navigate('/onboarding/personalize')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-gabb-500/8 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-lg">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl font-bold text-white">What Do You Want to Talk About?</h2>
          <p className="text-white/50 mt-2">We'll prioritise these 1,000 words in your lessons.</p>
        </div>

        <StepDots current={2} total={5} />

        <div className="grid grid-cols-2 gap-3 mt-6">
          {INTEREST_CATEGORIES.map((cat, i) => {
            const isSelected = selected.includes(cat.id as VocabCategory)
            const isLocked = cat.id === 'essentials'
            return (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => toggle(cat.id as VocabCategory)}
                className={`glass rounded-xl p-4 text-left relative transition-all ${
                  isSelected
                    ? 'border-gabb-500/60 bg-gabb-500/10'
                    : 'hover:bg-white/8'
                } ${isLocked ? 'cursor-default' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{cat.icon}</span>
                  {isSelected && (
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isLocked ? 'bg-gabb-500/50' : 'bg-gabb-500'}`}>
                      <span className="text-white text-[8px] leading-none font-bold">✓</span>
                    </div>
                  )}
                </div>
                <p className="font-medium text-sm text-white mt-2">{cat.label}</p>
                <p className="text-xs text-white/40 mt-0.5">{cat.description}</p>
                {isLocked && <span className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] text-gabb-400">Always on</span>}
              </motion.button>
            )
          })}
        </div>

        <p className="text-center text-sm text-white/40 mt-4">
          {selected.length - 1} topic{selected.length - 1 !== 1 ? 's' : ''} selected · Essentials always included
        </p>

        <div className="flex gap-3 mt-6">
          <Button variant="ghost" onClick={() => navigate('/onboarding/language')}>Back</Button>
          <Button variant="gradient" fullWidth size="lg" onClick={handleNext}>
            Continue →
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
