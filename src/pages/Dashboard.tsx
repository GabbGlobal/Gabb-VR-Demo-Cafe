import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, Trophy, Flame, BookOpen, Brain } from 'lucide-react'
import Header from '../components/layout/Header'
import BiosensorPanel from '../components/biosensor/BiosensorPanel'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ProgressBar, XpBar } from '../components/ui/Progress'
import { Badge } from '../components/ui/Badge'
import { useUserStore, selectActiveProgress } from '../store/userStore'
import { useBiosensorStore } from '../store/biosensorStore'
import { LANGUAGES, INTEREST_CATEGORIES } from '../data/languages'
import { cognitiveStateLabel, cognitiveStateBg } from '../utils/neuroadaptive'
import { vocabularyByLanguage } from '../data/vocabulary'

export default function DashboardPage() {
  const navigate = useNavigate()
  const profile = useUserStore(s => s.profile)
  const progress = useUserStore(selectActiveProgress)
  const setActiveLanguage = useUserStore(s => s.setActiveLanguage)
  const adaptiveState = useBiosensorStore(s => s.adaptiveState)
  const connectedDevices = useBiosensorStore(s => s.devices.filter(d => d.status === 'connected'))

  if (!profile) return null

  const lang = LANGUAGES.find(l => l.code === profile.activeLanguage)
  const totalWords = vocabularyByLanguage[profile.activeLanguage]?.length ?? 0
  const learnedWords = progress?.wordsLearned.length ?? 0
  const categories = INTEREST_CATEGORIES.filter(c => profile.interests.includes(c.id as any))

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white">
            Ciao, {profile.name}! 👋
          </h1>
          <p className="text-white/50 mt-1">
            {progress?.streak
              ? `🔥 ${progress.streak}-day streak — keep going!`
              : 'Ready to start your first lesson?'}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active language + XP */}
            <Card glow>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{lang?.flag}</span>
                  <div>
                    <h2 className="font-display font-bold text-lg text-white">{lang?.name}</h2>
                    <p className="text-sm text-white/40">Level {progress?.level ?? 1}</p>
                  </div>
                </div>
                {profile.selectedLanguages.length > 1 && (
                  <div className="flex gap-1">
                    {LANGUAGES.filter(l => profile.selectedLanguages.includes(l.code) && l.code !== profile.activeLanguage).map(l => (
                      <button
                        key={l.code}
                        onClick={() => setActiveLanguage(l.code)}
                        className="text-2xl p-1.5 rounded-lg hover:bg-white/10 transition-colors opacity-50 hover:opacity-100"
                        title={`Switch to ${l.name}`}
                      >
                        {l.flag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {progress && (
                <XpBar xp={progress.xp} xpToNextLevel={progress.xpToNextLevel} level={progress.level} />
              )}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <Stat label="Words Learned" value={learnedWords} icon="📚" />
                <Stat label="Accuracy" value={`${progress?.accuracy ?? 0}%`} icon="🎯" />
                <Stat label="Streak" value={`${progress?.streak ?? 0}d`} icon="🔥" />
              </div>
            </Card>

            {/* Neuroadaptive status */}
            {connectedDevices.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-2xl border flex items-center gap-4 ${cognitiveStateBg(adaptiveState.cognitiveState)}`}
              >
                <Brain size={24} className="text-gabb-400 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-white">{cognitiveStateLabel(adaptiveState.cognitiveState)}</p>
                  <p className="text-sm text-white/50">
                    Focus {Math.round(adaptiveState.focusScore * 100)}% ·
                    Stress {Math.round(adaptiveState.stressScore * 100)}% ·
                    Difficulty set to {['', 'Easy', 'Medium', 'Hard'][adaptiveState.recommendedDifficulty]}
                  </p>
                </div>
                {adaptiveState.suggestBreak && (
                  <Badge color="amber">Take a Break</Badge>
                )}
              </motion.div>
            )}

            {/* Lesson categories */}
            <div>
              <h2 className="font-display font-bold text-xl text-white mb-4">Your Lessons</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {categories.map((cat, i) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Card
                      hover
                      padding="md"
                      className="cursor-pointer group"
                      onClick={() => navigate(`/lesson/${cat.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{cat.icon}</span>
                          <div>
                            <p className="font-semibold text-white group-hover:text-gabb-300 transition-colors">
                              {cat.label}
                            </p>
                            <p className="text-xs text-white/40">{cat.description}</p>
                          </div>
                        </div>
                        <Play size={16} className="text-white/30 group-hover:text-gabb-400 transition-colors shrink-0" />
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Quick start */}
            <Card glow>
              <h3 className="font-semibold text-white mb-3">Quick Start</h3>
              <Button
                variant="gradient"
                fullWidth
                size="lg"
                onClick={() => navigate(`/lesson/${profile.interests[0] ?? 'essentials'}`)}
              >
                <Play size={18} /> Start Lesson
              </Button>
              <p className="text-xs text-center text-white/30 mt-2">
                ~10 min · {adaptiveState.recommendedDifficulty === 1 ? 'Easy' : adaptiveState.recommendedDifficulty === 3 ? 'Hard' : 'Medium'} mode
              </p>
            </Card>

            {/* Vocabulary progress */}
            <Card>
              <h3 className="font-semibold text-white mb-4">
                <BookOpen size={16} className="inline mr-2 text-gabb-400" />
                Vocabulary
              </h3>
              <ProgressBar
                value={learnedWords}
                max={totalWords}
                label={`${learnedWords} / ${totalWords} words`}
                showValue
                color="gradient"
              />
            </Card>

            {/* Biosensor */}
            <BiosensorPanel />

            {/* Upgrade CTA */}
            {profile.subscription === 'free' && (
              <Card className="border-gabb-500/30 bg-gabb-500/5 cursor-pointer" hover onClick={() => navigate('/subscribe')}>
                <div className="flex items-center gap-2 mb-2">
                  <Trophy size={16} className="text-gabb-400" />
                  <span className="font-semibold text-sm text-white">Unlock Full Access</span>
                </div>
                <p className="text-xs text-white/50 mb-3">1,000 words · All topics · Biosensor AI · $9.99/mo</p>
                <Button variant="gradient" fullWidth size="sm">Upgrade Now</Button>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="text-center p-3 bg-white/5 rounded-xl">
      <p className="text-xl mb-1">{icon}</p>
      <p className="font-bold text-lg text-white">{value}</p>
      <p className="text-xs text-white/40">{label}</p>
    </div>
  )
}
