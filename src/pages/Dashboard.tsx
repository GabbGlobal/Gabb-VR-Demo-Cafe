import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, Trophy, BookOpen, Brain, Zap, Mic, Headset, Heart, ChevronRight, Apple } from 'lucide-react'
import Header from '../components/layout/Header'
import BiosensorPanel from '../components/biosensor/BiosensorPanel'
import TutorSchedule from '../components/tutor/TutorSchedule'
import Gabby from '../components/mascot/Gabby'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ProgressBar, XpBar } from '../components/ui/Progress'
import { Badge } from '../components/ui/Badge'
import { useUserStore, selectActiveProgress } from '../store/userStore'
import { useBiosensorStore } from '../store/biosensorStore'
import { LANGUAGES, INTEREST_CATEGORIES } from '../data/languages'
import { cognitiveStateLabel, cognitiveStateBg } from '../utils/neuroadaptive'
import { vocabularyByLanguage } from '../data/vocabulary'

const TODAY_SESSION = [
  { id: 'food',     icon: '☕', title: 'Café in Rome',         desc: 'Order coffee, pastries & ask for the bill',   category: 'food' },
  { id: 'travel',   icon: '🗺️', title: 'Directions & Hotels',  desc: 'Check in, ask for help, find your way',       category: 'travel' },
  { id: 'essentials', icon: '💬', title: 'Essential Phrases',  desc: 'The 20 phrases every Italy traveller needs',  category: 'essentials' },
]

const NOT_DUOLINGO = [
  { icon: '🧠', text: 'No streaks or gems — only real conversations.' },
  { icon: '🎙️', text: 'Voice & audio practice at native speed, not just multiple-choice.' },
  { icon: '🔄', text: 'Adaptive review of words you forget, not generic lists.' },
]

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
  const tripReadyPct = Math.round((learnedWords / Math.max(totalWords, 1)) * 100)
  const categories = INTEREST_CATEGORIES.filter(c => profile.interests.includes(c.id as any))

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* Hero greeting */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-extrabold text-white">
            Neuroadaptive {lang?.name ?? 'Italian'} for Real Conversations
          </h1>
          <p className="text-white/50 mt-2 text-lg">
            Built for your next trip — not for streaks.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Trip-ready progress */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card glow>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{lang?.flag ?? '🇮🇹'}</span>
                    <div>
                      <h2 className="font-display font-bold text-lg text-white">
                        Trip-Ready {lang?.name ?? 'Italian'}
                      </h2>
                      <p className="text-sm text-white/40">Level {progress?.level ?? 1} · {learnedWords} words learned</p>
                    </div>
                  </div>
                  {profile.selectedLanguages.length > 1 && (
                    <div className="flex gap-1">
                      {LANGUAGES.filter(l => profile.selectedLanguages.includes(l.code) && l.code !== profile.activeLanguage).map(l => (
                        <button key={l.code} onClick={() => setActiveLanguage(l.code)}
                          className="text-2xl p-1.5 rounded-lg hover:bg-white/10 transition-colors opacity-50 hover:opacity-100"
                          title={`Switch to ${l.name}`}>
                          {l.flag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Trip-ready bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-white/40 mb-1">
                    <span>Trip-ready Italian</span>
                    <span>{tripReadyPct}% of {totalWords} words</span>
                  </div>
                  <ProgressBar value={learnedWords} max={totalWords} color="gradient" height="lg" animated />
                </div>

                {progress && <XpBar xp={progress.xp} xpToNextLevel={progress.xpToNextLevel} level={progress.level} />}

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <Stat label="Words Learned" value={learnedWords} icon="📚" />
                  <Stat label="Accuracy"       value={`${progress?.accuracy ?? 0}%`} icon="🎯" />
                  <Stat label="Streak"          value={`${progress?.streak ?? 0}d`}  icon="🔥" />
                </div>
              </Card>
            </motion.div>

            {/* Today's Session */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-bold text-xl text-white">Today's Session</h2>
                  <Badge color="blue">~15 min</Badge>
                </div>
                <div className="space-y-3">
                  {TODAY_SESSION.map((task, i) => (
                    <motion.button
                      key={task.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.07 }}
                      onClick={() => navigate(`/lesson/${task.category}`)}
                      className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-gabb-500/10 border border-white/10 hover:border-gabb-500/30 rounded-xl transition-all group text-left"
                    >
                      <span className="text-2xl">{task.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white group-hover:text-gabb-300 transition-colors">{task.title}</p>
                        <p className="text-xs text-white/40 truncate">{task.desc}</p>
                      </div>
                      <ChevronRight size={16} className="text-white/30 group-hover:text-gabb-400 shrink-0 transition-colors" />
                    </motion.button>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Neuroadaptive status (when sensor connected) */}
            {connectedDevices.length > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-2xl border flex items-center gap-4 ${cognitiveStateBg(adaptiveState.cognitiveState)}`}>
                <Brain size={24} className="text-gabb-400 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-white">{cognitiveStateLabel(adaptiveState.cognitiveState)}</p>
                  <p className="text-sm text-white/50">
                    Focus {Math.round(adaptiveState.focusScore * 100)}% ·
                    Stress {Math.round(adaptiveState.stressScore * 100)}% ·
                    Difficulty set to {['', 'Easy', 'Medium', 'Hard'][adaptiveState.recommendedDifficulty]}
                  </p>
                </div>
                {adaptiveState.suggestBreak && <Badge color="amber">Take a Break</Badge>}
              </motion.div>
            )}

            {/* Not Duolingo strip */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div className="glass rounded-2xl p-5 border-gabb-500/20">
                <p className="text-xs text-gabb-400 font-semibold uppercase tracking-wider mb-3">Why this isn't Duolingo</p>
                <div className="space-y-2">
                  {NOT_DUOLINGO.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-white/70">
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* All lesson categories */}
            <div>
              <h2 className="font-display font-bold text-xl text-white mb-4">All Topics</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {categories.map((cat, i) => (
                  <motion.div key={cat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card hover padding="md" className="cursor-pointer group" onClick={() => navigate(`/lesson/${cat.id}`)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{cat.icon}</span>
                          <div>
                            <p className="font-semibold text-white group-hover:text-gabb-300 transition-colors">{cat.label}</p>
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

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-5">

            {/* START DEMO CTA */}
            <Card glow className="border-gabb-500/40 bg-gabb-500/5">
              <h3 className="font-display font-bold text-white text-lg mb-1">Start Immersive Demo</h3>
              <p className="text-xs text-white/40 mb-4">Jump straight into today's Italy-focused session</p>
              <Button variant="gradient" fullWidth size="lg" onClick={() => navigate(`/lesson/food`)}>
                <Play size={18} /> Begin Session
              </Button>
              <p className="text-xs text-center text-white/30 mt-2">
                ~15 min · {adaptiveState.recommendedDifficulty === 1 ? 'Easy' : adaptiveState.recommendedDifficulty === 3 ? 'Hard' : 'Medium'} mode
              </p>
            </Card>

            {/* Vocab progress */}
            <Card>
              <h3 className="font-semibold text-white mb-4">
                <BookOpen size={16} className="inline mr-2 text-gabb-400" />
                Vocabulary
              </h3>
              <ProgressBar value={learnedWords} max={totalWords} label={`${learnedWords} / ${totalWords} words`} showValue color="gradient" />
            </Card>

            {/* Coming Soon — Biosensors */}
            <div className="glass rounded-2xl p-5 border border-dashed border-gabb-500/30 space-y-3">
              <div className="flex items-center gap-2">
                <Brain size={16} className="text-gabb-400" />
                <span className="text-sm font-semibold text-white">Coming Soon: Bio-Adaptive Mode</span>
                <Badge color="purple">Soon</Badge>
              </div>
              <p className="text-xs text-white/40 leading-relaxed">
                Connect a heart rate monitor, Muse EEG headband, or Shimmer GSR sensor. Gabb reads your stress, focus and fatigue in real-time and adjusts every lesson automatically — something Duolingo can't do.
              </p>
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <Apple size={14} className="text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-300 leading-relaxed">
                  <span className="font-semibold">Apple Health</span> integration requires a native iOS app with HealthKit. Web browsers cannot access HealthKit directly — this feature will arrive with the Gabb iOS app.
                </p>
              </div>
              <BiosensorPanel />
              <TutorSchedule />
            </div>

            {/* VR Practice Mode teaser */}
            <div className="glass rounded-2xl p-5 border border-dashed border-purple-500/30 space-y-3">
              <div className="flex items-center gap-2">
                <Headset size={16} className="text-purple-400" />
                <span className="text-sm font-semibold text-white">VR Practice Mode</span>
                <Badge color="purple">Coming</Badge>
              </div>
              <p className="text-xs text-white/40 leading-relaxed">
                Step inside a virtual Rome café, hotel lobby, or market. Practice full conversations in immersive 3D — powered by the Gabb VR engine.
              </p>
              <Button variant="secondary" fullWidth size="sm" disabled>
                <Headset size={14} /> Launch VR (Coming Soon)
              </Button>
            </div>

            {/* Speech recognition teaser */}
            <div className="glass rounded-2xl p-5 border border-dashed border-emerald-500/30 space-y-3">
              <div className="flex items-center gap-2">
                <Mic size={16} className="text-emerald-400" />
                <span className="text-sm font-semibold text-white">Pronunciation Coach</span>
                <Badge color="green">Soon</Badge>
              </div>
              <p className="text-xs text-white/40 leading-relaxed">
                Speak a word and see colour-coded phoneme feedback — red where you're off, green where you nailed it. Native speaker audio on every word.
              </p>
            </div>

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
      <Gabby />
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
