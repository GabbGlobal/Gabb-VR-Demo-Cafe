import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '../../store/userStore'
import { useOnboardingState } from './Welcome'
import GabbLogo from '../../components/ui/GabbLogo'
import type { UserProfile, LanguageCode, VocabCategory, Gender, Orientation } from '../../types'

const LOADING_STEPS = [
  { emoji: '🌍', text: 'Mapping your language goal...' },
  { emoji: '🧠', text: 'Calibrating your neural learning profile...' },
  { emoji: '📚', text: 'Selecting your first 700 words...' },
  { emoji: '🎯', text: 'Building your personalized curriculum...' },
  { emoji: '🎮', text: 'Preparing your Café Italiano session...' },
  { emoji: '✨', text: 'Your course is ready!' },
]

const GOAL_LABELS: Record<string, string> = {
  travel: 'Travel & Vacation', business: 'Business', academic: 'Academic',
  family: 'Family & Romance', culture: 'Culture', fluency: 'Full Fluency',
}

const LEVEL_LABELS: Record<number, string> = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced' }

export default function CourseLoadingPage() {
  const navigate = useNavigate()
  const { load } = useOnboardingState()
  const { setProfile } = useUserStore()
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)

  const data = load()
  const name = data.name ?? 'Learner'
  const goal = GOAL_LABELS[data.goal] ?? 'Travel'
  const level = LEVEL_LABELS[data.placementLevel ?? 1] ?? 'Beginner'
  const minutes = data.dailyMinutes ?? 15

  // Advance loading steps every 800ms
  useEffect(() => {
    if (step >= LOADING_STEPS.length - 1) {
      setTimeout(() => setDone(true), 600)
      return
    }
    const t = setTimeout(() => setStep(s => s + 1), 800)
    return () => clearTimeout(t)
  }, [step])

  // Create profile and navigate once done
  useEffect(() => {
    if (!done) return
    const languages = (data.languages ?? ['it']) as LanguageCode[]
    const profile: UserProfile = {
      id: crypto.randomUUID(),
      name,
      email: data.email ?? '',
      gender: (data.gender ?? 'prefer-not') as Gender,
      orientation: (data.orientation ?? 'prefer-not') as Orientation,
      interests: (data.interests ?? ['essentials']) as VocabCategory[],
      selectedLanguages: languages,
      activeLanguage: languages[0],
      subscription: 'free',
      createdAt: new Date().toISOString(),
      password: data.password,
      goal: data.goal,
      dailyMinutes: data.dailyMinutes,
      placementLevel: data.placementLevel ?? 1,
    }
    setProfile(profile)
    const t = setTimeout(() => navigate('/dashboard'), 1200)
    return () => clearTimeout(t)
  }, [done])

  const progress = ((step + 1) / LOADING_STEPS.length) * 100

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#4CC8E8]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#4A9660]/8 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-sm text-center"
      >
        {/* Animated globe */}
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="inline-block mb-6"
        >
          <GabbLogo size={80} />
        </motion.div>

        {!done ? (
          <>
            <h2 className="font-display text-2xl font-bold text-white mb-2">
              Designing your course, {name}…
            </h2>
            <p className="text-white/40 text-sm mb-8">
              {goal} · {level} · {minutes} min/day
            </p>

            {/* Progress bar */}
            <div className="h-1.5 bg-white/10 rounded-full mb-6 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#4CC8E8] to-[#4A9660]"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>

            {/* Current step */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-center gap-3"
              >
                <span className="text-2xl">{LOADING_STEPS[step].emoji}</span>
                <span className="text-white/60 text-sm">{LOADING_STEPS[step].text}</span>
              </motion.div>
            </AnimatePresence>

            {/* Completed steps */}
            <div className="mt-6 space-y-1.5">
              {LOADING_STEPS.slice(0, step).map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 justify-center text-xs text-white/25"
                >
                  <span className="text-emerald-400/60">✓</span>
                  <span>{s.text}</span>
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="font-display text-3xl font-bold text-white mb-2">
              Your course is ready!
            </h2>
            <p className="text-[#4CC8E8] font-semibold mb-1">
              {level} · {goal}
            </p>
            <p className="text-white/40 text-sm">Launching your dashboard…</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
