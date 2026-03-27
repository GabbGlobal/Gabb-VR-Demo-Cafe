import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, BarChart2, Home, Settings, Zap } from 'lucide-react'
import { useUserStore, selectActiveProgress } from '../../store/userStore'
import { useBiosensorStore } from '../../store/biosensorStore'
import { XpBar } from '../ui/Progress'
import { LANGUAGES } from '../../data/languages'
import { cognitiveStateBg, cognitiveStateLabel } from '../../utils/neuroadaptive'

export default function Header() {
  const location = useLocation()
  const profile = useUserStore(s => s.profile)
  const progress = useUserStore(selectActiveProgress)
  const adaptiveState = useBiosensorStore(s => s.adaptiveState)
  const connectedDevices = useBiosensorStore(s => s.devices.filter(d => d.status === 'connected'))

  const lang = LANGUAGES.find(l => l.code === profile?.activeLanguage)

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Home' },
    { to: '/progress',  icon: BarChart2, label: 'Progress' },
    { to: '/subscribe', icon: Zap, label: 'Upgrade' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl gabb-gradient flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <span className="font-display font-bold text-white hidden sm:block">Gabb Languages</span>
        </Link>

        {/* XP bar (centre) */}
        {progress && (
          <div className="flex-1 max-w-xs hidden md:block">
            <XpBar xp={progress.xp} xpToNextLevel={progress.xpToNextLevel} level={progress.level} />
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Neural state indicator */}
          {connectedDevices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${cognitiveStateBg(adaptiveState.cognitiveState)}`}
            >
              <Brain size={12} className="opacity-80" />
              <span>{cognitiveStateLabel(adaptiveState.cognitiveState)}</span>
            </motion.div>
          )}

          {/* Streak */}
          {progress && progress.streak > 0 && (
            <div className="flex items-center gap-1 text-amber-400 text-sm font-semibold">
              <span>🔥</span>
              <span>{progress.streak}</span>
            </div>
          )}

          {/* Active language */}
          {lang && (
            <span className="text-lg hidden sm:block" title={lang.name}>{lang.flag}</span>
          )}

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className={`p-2 rounded-lg transition-colors ${
                  location.pathname.startsWith(to)
                    ? 'bg-gabb-500/20 text-gabb-400'
                    : 'text-white/50 hover:text-white hover:bg-white/10'
                }`}
                title={label}
              >
                <Icon size={18} />
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
