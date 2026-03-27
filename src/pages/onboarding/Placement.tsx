import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { StepDots, useOnboardingState } from './Welcome'

// 5 quick Italian questions to gauge level
const QUESTIONS = [
  { q: 'What does "Ciao" mean?',          options: ['Hello / Bye', 'Thank you', 'Please', 'Sorry'],           answer: 'Hello / Bye' },
  { q: 'How do you say "Thank you"?',      options: ['Prego', 'Scusa', 'Grazie', 'Bene'],                      answer: 'Grazie' },
  { q: 'What is "Dov\'è la stazione?"',   options: ['Where is the station?', 'How much?', 'I am lost', 'Help me!'], answer: "Where is the station?" },
  { q: 'What does "Non capisco" mean?',    options: ['I don\'t understand', 'I am hungry', 'I\'m fine', 'Beautiful'], answer: "I don't understand" },
  { q: 'How do you say "Two coffees"?',    options: ['Tre caffè', 'Due caffè', 'Un caffè', 'Cinque caffè'],   answer: 'Due caffè' },
]

export default function PlacementPage() {
  const navigate = useNavigate()
  const { save } = useOnboardingState()
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [chosen, setChosen] = useState<string | null>(null)
  const [score, setScore] = useState(0)

  function pick(opt: string) {
    if (chosen !== null) return
    const correct = opt === QUESTIONS[index].answer
    setChosen(opt)
    if (correct) setScore(s => s + 1)
  }

  function advance() {
    if (index + 1 >= QUESTIONS.length) {
      // Calculate level
      const level = score >= 4 ? 3 : score >= 2 ? 2 : 1
      save({ placementLevel: level })
      navigate('/onboarding/course-loading')
    } else {
      setIndex(i => i + 1)
      setChosen(null)
    }
  }

  function skip() {
    save({ placementLevel: 1 })
    navigate('/onboarding/course-loading')
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md text-center">
          <div className="text-5xl mb-4">🧪</div>
          <h2 className="font-display text-3xl font-bold text-white mb-3">Quick Placement Check</h2>
          <p className="text-white/50 text-sm leading-relaxed mb-8">
            5 questions, less than 2 minutes. Gabby uses this to place you in the right starting point so you're never bored or overwhelmed.
          </p>

          <StepDots current={7} total={9} />

          <div className="flex gap-3 mt-8">
            <Button variant="ghost" fullWidth size="lg" onClick={skip}>
              Skip — Start as Beginner
            </Button>
            <Button variant="gradient" fullWidth size="lg" onClick={() => setStarted(true)}>
              Take the Test 🚀
            </Button>
          </div>
          <p className="text-xs text-white/30 mt-4">You can retake this from Settings at any time.</p>
        </motion.div>
      </div>
    )
  }

  const q = QUESTIONS[index]
  const progress = ((index) / QUESTIONS.length) * 100

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-[#4CC8E8] transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs text-white/40">{index + 1}/{QUESTIONS.length}</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
          >
            <div className="glass rounded-2xl p-6 mb-4">
              <p className="text-lg font-semibold text-white text-center mb-6">{q.q}</p>
              <div className="grid grid-cols-2 gap-3">
                {q.options.map(opt => {
                  let style = 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                  if (chosen !== null) {
                    if (opt === q.answer) style = 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                    else if (opt === chosen) style = 'bg-red-500/20 border-red-500/40 text-red-300'
                    else style = 'bg-white/5 border-white/10 text-white/40'
                  }
                  return (
                    <button
                      key={opt}
                      onClick={() => pick(opt)}
                      disabled={chosen !== null}
                      className={`${style} border rounded-xl px-3 py-3 text-sm font-medium transition-all`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>

            {chosen !== null && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-xl flex items-center gap-2 mb-4 ${
                  chosen === q.answer
                    ? 'bg-emerald-500/15 border border-emerald-500/30'
                    : 'bg-red-500/15 border border-red-500/30'
                }`}
              >
                {chosen === q.answer
                  ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  : <XCircle size={16} className="text-red-400 shrink-0" />}
                <span className={`text-sm ${chosen === q.answer ? 'text-emerald-300' : 'text-red-300'}`}>
                  {chosen === q.answer ? 'Esatto! ✓' : `Correct: "${q.answer}"`}
                </span>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {chosen !== null && (
          <Button variant="gradient" fullWidth size="lg" onClick={advance}>
            {index + 1 >= QUESTIONS.length ? 'See My Results →' : 'Next →'}
          </Button>
        )}
      </motion.div>
    </div>
  )
}
