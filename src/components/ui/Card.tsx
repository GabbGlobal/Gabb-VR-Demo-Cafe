import { motion } from 'framer-motion'
import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  glow?: boolean
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

export function Card({ hover, glow, padding = 'md', className = '', children, ...props }: CardProps) {
  const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' }

  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, y: -2 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`
        glass rounded-2xl
        ${glow ? 'shadow-lg shadow-gabb-500/10' : ''}
        ${paddings[padding]}
        ${className}
      `}
      {...(props as any)}
    >
      {children}
    </motion.div>
  )
}
