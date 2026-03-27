interface BadgeProps {
  children: React.ReactNode
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'gray'
  size?: 'sm' | 'md'
}

export function Badge({ children, color = 'blue', size = 'sm' }: BadgeProps) {
  const colors = {
    blue:   'bg-gabb-500/20 text-gabb-300 border-gabb-500/30',
    green:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    amber:  'bg-amber-500/20 text-amber-300 border-amber-500/30',
    red:    'bg-red-500/20 text-red-300 border-red-500/30',
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    gray:   'bg-white/10 text-white/60 border-white/10',
  }
  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${colors[color]} ${sizes[size]}`}>
      {children}
    </span>
  )
}
