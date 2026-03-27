import { motion } from 'framer-motion'

interface ProgressBarProps {
  value: number   // 0–100
  max?: number
  color?: 'blue' | 'green' | 'amber' | 'red' | 'gradient'
  height?: 'sm' | 'md' | 'lg'
  label?: string
  showValue?: boolean
  animated?: boolean
}

export function ProgressBar({
  value,
  max = 100,
  color = 'gradient',
  height = 'md',
  label,
  showValue,
  animated = true,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))

  const colors = {
    blue:     'bg-gabb-500',
    green:    'bg-emerald-500',
    amber:    'bg-amber-500',
    red:      'bg-red-500',
    gradient: 'gabb-gradient',
  }
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' }

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm text-white/60">{label}</span>}
          {showValue && <span className="text-sm font-semibold text-white">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={`w-full bg-white/10 rounded-full overflow-hidden ${heights[height]}`}>
        <motion.div
          initial={animated ? { width: 0 } : { width: `${pct}%` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${colors[color]}`}
        />
      </div>
    </div>
  )
}

interface XpBarProps {
  xp: number
  xpToNextLevel: number
  level: number
}

export function XpBar({ xp, xpToNextLevel, level }: XpBarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gabb-500 text-white font-bold text-sm shrink-0">
        {level}
      </div>
      <div className="flex-1">
        <ProgressBar value={xp} max={xpToNextLevel} color="gradient" height="md" animated />
      </div>
      <span className="text-xs text-white/50 shrink-0">{xp}/{xpToNextLevel} XP</span>
    </div>
  )
}
