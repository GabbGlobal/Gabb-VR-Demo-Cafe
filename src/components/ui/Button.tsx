import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gradient'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, className = '', children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gabb-400 disabled:opacity-40 disabled:cursor-not-allowed select-none'

    const variants = {
      primary:   'bg-gabb-500 hover:bg-gabb-600 active:bg-gabb-700 text-white shadow-lg shadow-gabb-500/20',
      secondary: 'glass border border-white/20 hover:bg-white/10 text-white',
      ghost:     'hover:bg-white/10 text-white/70 hover:text-white',
      danger:    'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20',
      gradient:  'gabb-gradient text-white shadow-xl shadow-gabb-500/30',
    }

    const sizes = {
      sm:  'h-8  px-4  text-sm  gap-1.5',
      md:  'h-10 px-5  text-sm  gap-2',
      lg:  'h-12 px-7  text-base gap-2.5',
      xl:  'h-14 px-9  text-lg  gap-3',
    }

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || loading ? 1 : 0.96 }}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
        disabled={disabled || loading}
        {...(props as any)}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </motion.button>
    )
  },
)
Button.displayName = 'Button'
