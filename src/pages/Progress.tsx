import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { BarChart2, Flame, Target, BookOpen, Clock, Trophy } from 'lucide-react'
import Header from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { ProgressBar, XpBar } from '../components/ui/Progress'
import { Badge } from '../components/ui/Badge'
import { useUserStore } from '../store/userStore'
import { LANGUAGES, INTEREST_CATEGORIES } from '../data/languages'
import { vocabularyByLanguage } from '../data/vocabulary'

export default function ProgressPage() {
  const navigate = useNavigate()
  const profile = useUserStore(s => s.profile)
  const allProgress = useUserStore(s => s.progress)

  if (!profile) return null

  const activeLanguages = LANGUAGES.filter(l => profile.selectedLanguages.includes(l.code))

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-white flex items-center gap-2">
            <BarChart2 className="text-gabb-400" /> Your Progress
          </h1>
          <p className="text-white/50 mt-1">Track your learning journey across all languages.</p>
        </motion.div>

        {/* Per-language cards */}
        {activeLanguages.map((lang, li) => {
          const prog = allProgress[lang.code]
          if (!prog) return null
          const total = vocabularyByLanguage[lang.code]?.length ?? 0
          const learned = prog.wordsLearned.length

          return (
            <motion.div
              key={lang.code}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: li * 0.1 }}
            >
              <Card glow padding="lg">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{lang.flag}</span>
                    <div>
                      <h2 className="font-display text-xl font-bold text-white">{lang.name}</h2>
                      <p className="text-sm text-white/40">{lang.nativeName}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {prog.streak > 6 && <Badge color="amber">🔥 {prog.streak}-day streak</Badge>}
                    {prog.accuracy >= 90 && <Badge color="green">Sharp 🎯</Badge>}
                    {prog.level >= 5 && <Badge color="purple">Level {prog.level}</Badge>}
                  </div>
                </div>

                {/* XP */}
                <XpBar xp={prog.xp} xpToNextLevel={prog.xpToNextLevel} level={prog.level} />

                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                  <StatCard icon={<BookOpen size={18} className="text-gabb-400" />} label="Words Learned" value={`${learned}/${total}`} />
                  <StatCard icon={<Target size={18} className="text-emerald-400" />} label="Accuracy" value={`${prog.accuracy}%`} />
                  <StatCard icon={<Flame size={18} className="text-amber-400" />} label="Streak" value={`${prog.streak} days`} />
                  <StatCard icon={<Trophy size={18} className="text-purple-400" />} label="Lessons" value={prog.lessonsCompleted.length} />
                </div>

                {/* Vocab progress */}
                <div className="mt-5">
                  <ProgressBar
                    value={learned}
                    max={total}
                    label="Vocabulary coverage"
                    showValue
                    color="gradient"
                    height="lg"
                  />
                </div>

                {/* Category breakdown */}
                <div className="mt-5">
                  <p className="text-sm font-semibold text-white/70 mb-3">Topics</p>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_CATEGORIES.filter(c => profile.interests.includes(c.id as any)).map(c => (
                      <button
                        key={c.id}
                        onClick={() => navigate(`/lesson/${c.id}`)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/5 hover:bg-gabb-500/20 border border-white/10 hover:border-gabb-500/30 rounded-full transition-all text-white/60 hover:text-white"
                      >
                        {c.icon} {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}

        {/* Achievements */}
        <Card>
          <h2 className="font-display font-bold text-xl text-white mb-4">
            <Trophy size={18} className="inline mr-2 text-amber-400" />
            Achievements
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: '🌟', label: 'First Lesson', unlocked: Object.values(allProgress).some(p => p.lessonsCompleted.length > 0) },
              { icon: '🔥', label: '7-Day Streak', unlocked: Object.values(allProgress).some(p => p.streak >= 7) },
              { icon: '📚', label: '50 Words', unlocked: Object.values(allProgress).some(p => p.wordsLearned.length >= 50) },
              { icon: '🎯', label: '90% Accuracy', unlocked: Object.values(allProgress).some(p => p.accuracy >= 90) },
              { icon: '🏆', label: 'Level 5', unlocked: Object.values(allProgress).some(p => p.level >= 5) },
              { icon: '🌍', label: '2 Languages', unlocked: profile.selectedLanguages.length >= 2 },
              { icon: '🧠', label: 'Biosensor User', unlocked: false },
              { icon: '💎', label: 'Perfect Lesson', unlocked: false },
            ].map((a) => (
              <div
                key={a.label}
                className={`p-3 rounded-xl text-center ${a.unlocked ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/5 border border-transparent opacity-40'}`}
              >
                <span className="text-2xl">{a.icon}</span>
                <p className="text-xs mt-1 font-medium text-white">{a.label}</p>
                {!a.unlocked && <p className="text-[10px] text-white/30 mt-0.5">Locked</p>}
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center p-4 bg-white/5 rounded-xl">
      {icon}
      <p className="font-bold text-lg text-white mt-2">{value}</p>
      <p className="text-xs text-white/40 text-center">{label}</p>
    </div>
  )
}
