import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, Trophy, BookOpen, Brain, Zap, Mic, Headset, Heart, ChevronRight, Apple, Gamepad2, MessageCircle } from 'lucide-react'
import Header from '../components/layout/Header'
import BiosensorPanel from '../components/biosensor/BiosensorPanel'
import TutorSchedule from '../components/tutor/TutorSchedule'
import Gabby from '../components/mascot/Gabby'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ProgressBar, XpBar } from '../components/ui/Progress'
import { Badge } from '../components/ui/Badge'
import { useUserStore, selectActiveProgress } from '../store/userStore'
import { playFanfare } from '../utils/fanfare'
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
  const coins = useUserStore(s => s.coins)
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
    <div className="min-h-screen bg-slate-950 relative overflow-x-hidden">
      {/* Decorative color splashes */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-gabb-600/8 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-[400px] h-[400px] rounded-full bg-purple-600/6 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[350px] h-[350px] rounded-full bg-gabb-500/5 blur-3xl" />
      </div>
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

                <div className="grid grid-cols-4 gap-3 mt-4">
                  <Stat label="Words"    value={learnedWords}                   icon="📚" />
                  <Stat label="Accuracy" value={`${progress?.accuracy ?? 0}%`} icon="🎯" />
                  <Stat label="Streak"   value={`${progress?.streak ?? 0}d`}   icon="🔥" />
                  <button
                    onClick={() => playFanfare('ding')}
                    className="text-center p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-colors group"
                    title="Gabb Gold Coins — earn by practising!"
                  >
                    <p className="text-xl mb-1">🪙</p>
                    <p className="font-bold text-lg text-amber-400 group-hover:scale-110 transition-transform">{coins}</p>
                    <p className="text-xs text-amber-400/60">GGC</p>
                  </button>
                </div>
              </Card>
            </motion.div>

            {/* Daily Training — 3 games */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-bold text-xl text-white">Daily Training</h2>
                  <span className="text-xs text-[#4CC8E8] font-semibold">🪙 Earn GGC</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: '🏛️', label: 'Café Scene',    desc: '2D cinematic café',   path: '/games/cafe-scene',    color: 'border-yellow-700/30 bg-yellow-900/10 hover:bg-yellow-800/20', badge: 'NEW' },
                    { icon: '🎙️', label: 'Gabb Voice',    desc: '20-phrase drill',      path: '/games/caffe-roma',    color: 'border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10', badge: 'Voice' },
                    { icon: '🤖', label: 'Talk to Gabby', desc: 'Live voice tutor',     path: '/tutor',               color: 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10', badge: 'AI' },
                    { icon: '🧩', label: 'Word Recall',   desc: 'Gentle memory game',   path: '/games/word-recall',   color: 'border-teal-500/20 bg-teal-500/5 hover:bg-teal-500/10', badge: 'Accessible' },
                  ].map(g => (
                    <motion.button
                      key={g.path}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate(g.path)}
                      className={`rounded-xl border p-3 text-left transition-all ${g.color}`}
                    >
                      <span className="text-2xl block mb-1">{g.icon}</span>
                      <p className="font-semibold text-white text-xs">{g.label}</p>
                      <p className="text-white/40 text-[10px] mt-0.5">{g.desc}</p>
                      <span className="inline-block mt-1.5 text-[9px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded-full">{g.badge}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Rich's Playlist CTA */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/rich')}
                  className="w-full mt-3 flex items-center gap-4 p-3.5 rounded-xl border border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/10 transition-all group text-left"
                >
                  <span className="text-2xl">🎬</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-xs">Rich's Playlist</p>
                    <p className="text-white/40 text-[10px] mt-0.5">Godfather · Queens · Nonna's kitchen · 15 min</p>
                  </div>
                  <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full border border-amber-500/30">Personalized</span>
                  <ChevronRight size={14} className="text-white/30 group-hover:text-amber-400 shrink-0 transition-colors" />
                </motion.button>
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

            {/* Neural Brain Paradigm */}
            <NeuralBrainCard learnedWords={learnedWords} totalWords={totalWords} coins={coins} />

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

            {/* VR Practice Mode — visual preview + how to interact */}
            <div className="glass rounded-2xl overflow-hidden border border-purple-500/30">

              {/* VR headset mockup visual */}
              <div className="relative h-48 bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 overflow-hidden flex items-center justify-center">
                {/* Background star-field dots */}
                {[...Array(18)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full bg-white/20"
                    style={{
                      width: i % 3 === 0 ? 3 : 2,
                      height: i % 3 === 0 ? 3 : 2,
                      left: `${(i * 37 + 11) % 95}%`,
                      top:  `${(i * 53 + 7)  % 90}%`,
                    }}
                  />
                ))}

                <svg viewBox="0 0 320 160" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    {/* Left lens clip */}
                    <clipPath id="lens-l"><ellipse cx="98" cy="80" rx="82" ry="62" /></clipPath>
                    {/* Right lens clip */}
                    <clipPath id="lens-r"><ellipse cx="222" cy="80" rx="82" ry="62" /></clipPath>
                    <radialGradient id="scene-sky" cx="50%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#3B1F7A" />
                      <stop offset="100%" stopColor="#150D3A" />
                    </radialGradient>
                  </defs>

                  {/* ── Left lens: café interior ── */}
                  <g clipPath="url(#lens-l)">
                    <rect width="320" height="160" fill="url(#scene-sky)" />
                    {/* Ceiling arch */}
                    <path d="M 16 80 Q 98 10 180 80" fill="none" stroke="#9333ea" strokeWidth="1.5" opacity="0.5" />
                    {/* Floor */}
                    <rect y="108" width="320" height="52" fill="#3B1A06" />
                    {/* Floor tiles */}
                    {[0,1,2,3].map(i => (
                      <line key={i} x1={16 + i * 42} y1="108" x2={30 + i * 42} y2="160" stroke="#5a2e0a" strokeWidth="1" opacity="0.6" />
                    ))}
                    {/* Table */}
                    <rect x="42" y="94" width="112" height="7" rx="2" fill="#7C4A1A" />
                    <rect x="88"  y="101" width="6" height="18" fill="#6A3A0A" />
                    {/* Espresso cups */}
                    <ellipse cx="62"  cy="95" rx="9" ry="4" fill="#2C1408" />
                    <ellipse cx="62"  cy="93" rx="7" ry="2.5" fill="#4A2010" />
                    <ellipse cx="115" cy="95" rx="9" ry="4" fill="#2C1408" />
                    <ellipse cx="115" cy="93" rx="7" ry="2.5" fill="#4A2010" />
                    {/* Café sign */}
                    <rect x="44" y="28" width="108" height="22" rx="5" fill="#1A0A3A" stroke="#9333ea" strokeWidth="1" opacity="0.9" />
                    <text x="98" y="43" textAnchor="middle" fill="#F0C060" fontSize="11" fontWeight="bold" fontFamily="Georgia, serif">CAFFÈ ROMA</text>
                    {/* Speech bubble from waiter */}
                    <rect x="22" y="58" width="90" height="20" rx="7" fill="white" opacity="0.92" />
                    <polygon points="45,78 52,78 48,85" fill="white" opacity="0.92" />
                    <text x="67" y="72" textAnchor="middle" fill="#1a0a2e" fontSize="8.5" fontFamily="sans-serif">Un caffè, per favore?</text>
                  </g>

                  {/* ── Right lens: vocabulary overlay ── */}
                  <g clipPath="url(#lens-r)">
                    <rect width="320" height="160" fill="url(#scene-sky)" />
                    {/* Same café but with AR labels */}
                    <rect y="108" width="320" height="52" fill="#3B1A06" />
                    <rect x="166" y="94" width="112" height="7" rx="2" fill="#7C4A1A" />
                    <rect x="212"  y="101" width="6" height="18" fill="#6A3A0A" />
                    <ellipse cx="190" cy="95" rx="9" ry="4" fill="#2C1408" />
                    <ellipse cx="190" cy="93" rx="7" ry="2.5" fill="#4A2010" />
                    {/* AR label — cup */}
                    <rect x="178" y="72" width="48" height="16" rx="4" fill="#4CC8E8" opacity="0.9" />
                    <line x1="202" y1="88" x2="192" y2="94" stroke="#4CC8E8" strokeWidth="1.5" opacity="0.8" />
                    <text x="202" y="83" textAnchor="middle" fill="white" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif">il caffè</text>
                    {/* AR label — table */}
                    <rect x="196" y="104" width="48" height="16" rx="4" fill="#4A9660" opacity="0.9" />
                    <text x="220" y="115" textAnchor="middle" fill="white" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif">il tavolo</text>
                    {/* Gaze target circle */}
                    <circle cx="222" cy="55" r="14" fill="none" stroke="#FFD700" strokeWidth="1.5" opacity="0.7" strokeDasharray="4 3" />
                    <circle cx="222" cy="55" r="3"  fill="#FFD700" opacity="0.8" />
                    <text x="222" y="40" textAnchor="middle" fill="#FFD700" fontSize="8" fontFamily="sans-serif" opacity="0.9">la finestra</text>
                  </g>

                  {/* ── VR headset frame ── */}
                  {/* Top strap */}
                  <rect x="28" y="8" width="264" height="12" rx="6" fill="#7C3AED" />
                  {/* Left lens rim */}
                  <ellipse cx="98"  cy="80" rx="82" ry="62" fill="none" stroke="#9333ea" strokeWidth="5" />
                  {/* Right lens rim */}
                  <ellipse cx="222" cy="80" rx="82" ry="62" fill="none" stroke="#9333ea" strokeWidth="5" />
                  {/* Bridge */}
                  <rect x="126" y="68" width="68" height="24" rx="6" fill="#150D3A" stroke="#7C3AED" strokeWidth="2.5" />
                  {/* Lens glare */}
                  <ellipse cx="72"  cy="50" rx="18" ry="10" fill="white" opacity="0.06" transform="rotate(-20 72 50)" />
                  <ellipse cx="196" cy="50" rx="18" ry="10" fill="white" opacity="0.06" transform="rotate(-20 196 50)" />
                </svg>

                {/* Live badge */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/50 backdrop-blur rounded-full px-3 py-1">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <span className="text-[11px] text-purple-200 font-medium tracking-wide">Gabb VR — Café Experience · Preview</span>
                </div>
              </div>

              {/* Info + how-to */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Headset size={16} className="text-purple-400" />
                  <span className="text-sm font-semibold text-white">VR Immersive Practice</span>
                  <Badge color="purple">Beta Soon</Badge>
                </div>

                <p className="text-xs text-white/55 leading-relaxed">
                  Slip on your headset and step inside a virtual Roman café, hotel lobby, or street market.
                  AI locals talk back, AR labels float over every object, and your biosensor shapes the difficulty in real time.
                </p>

                {/* How to interact guide */}
                <div className="space-y-2 pt-1">
                  <p className="text-[10px] font-semibold text-purple-300 uppercase tracking-widest">How to interact</p>
                  {[
                    { icon: '👀', step: 'Look at objects',   desc: 'Gaze at anything to see its Italian name pop up as an AR label' },
                    { icon: '🗣️', step: 'Speak naturally',   desc: 'Talk to AI baristas and shopkeepers — they understand Italian (and forgive mistakes!)' },
                    { icon: '✋', step: 'Reach & grab',      desc: 'Pick up the espresso cup, hand over euros, point at the menu' },
                    { icon: '🧠', step: 'Brain-adaptive AI', desc: 'Your live biosensor data adjusts scene difficulty so you stay in the flow zone' },
                  ].map(item => (
                    <div key={item.step} className="flex items-start gap-2.5">
                      <span className="text-base leading-none mt-0.5 shrink-0">{item.icon}</span>
                      <div>
                        <span className="text-xs font-semibold text-white">{item.step}: </span>
                        <span className="text-xs text-white/45">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <Button variant="secondary" fullWidth size="sm" onClick={() => navigate('/vr-practice')}>
                  <Headset size={14} /> Try VR Practice (2D Preview)
                </Button>
              </div>
            </div>

            {/* Neuroadaptive Waitlist CTA */}
            <DashboardWaitlistCard />

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

// ─── Neural Brain Paradigm ────────────────────────────────────────────────────

function NeuralBrainCard({ learnedWords, totalWords, coins }: { learnedWords: number; totalWords: number; coins: number }) {
  const DOT_COUNT = 40
  const activeDots = Math.round((learnedWords / Math.max(totalWords, 1)) * DOT_COUNT)
  const pct = Math.round((learnedWords / Math.max(totalWords, 1)) * 100)

  return (
    <Card>
      <div className="flex items-start gap-3 mb-4">
        <div className="relative shrink-0">
          {/* Glow rings */}
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border border-gabb-500/25"
              animate={{ scale: [1, 1.6 + i * 0.25], opacity: [0.6, 0] }}
              transition={{ duration: 2.5, delay: i * 0.5, repeat: Infinity, ease: 'easeOut' }}
            />
          ))}
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="relative w-14 h-14 rounded-full bg-gabb-500/15 border border-gabb-500/30 flex items-center justify-center"
          >
            <Brain size={26} className="text-gabb-400" />
          </motion.div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-white text-sm">Your Neural Map</h3>
          <p className="text-xs text-white/40 mb-1">{learnedWords} / {totalWords} pathways encoded · {pct}%</p>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-gabb-600 to-gabb-400"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Neural node grid */}
      <div className="grid grid-cols-10 gap-1 mb-3">
        {Array.from({ length: DOT_COUNT }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.015, duration: 0.3 }}
            className={`h-2.5 rounded-full ${
              i < activeDots
                ? 'bg-gabb-500 shadow-sm shadow-gabb-500/70'
                : 'bg-white/8'
            }`}
          />
        ))}
      </div>

      {/* GGC balance */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <span className="text-xs text-white/30">Gabb Gold Coins</span>
        <div className="flex items-center gap-1.5">
          <span className="text-lg">🪙</span>
          <span className="font-bold text-amber-400">{coins} GGC</span>
        </div>
      </div>
    </Card>
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

function DashboardWaitlistCard() {
  const [email,  setEmail]  = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('sending')
    try {
      const body = new URLSearchParams({ 'form-name': 'neuroadaptive-waitlist', 'bot-field': '', email: email.trim(), use_case: 'dashboard' })
      await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() })
    } catch { /* ok in dev */ }
    setStatus('done')
  }

  if (status === 'done') {
    return (
      <div className="glass rounded-2xl p-5 border border-[#4CC8E8]/30 bg-[#4CC8E8]/5 text-center space-y-1">
        <p className="text-2xl">🧠</p>
        <p className="text-sm font-semibold text-white">You're on the list!</p>
        <p className="text-xs text-white/40">We'll hit you when biosensor AI ships.</p>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl p-5 border border-[#4CC8E8]/20 space-y-3">
      <div className="flex items-center gap-2">
        <Brain size={16} className="text-[#4CC8E8]" />
        <span className="text-sm font-semibold text-white">Biosensor Waitlist</span>
        <Badge color="blue">Early Access</Badge>
      </div>
      <p className="text-xs text-white/40 leading-relaxed">
        Real-time EEG, HRM & GSR integration — Gabb adapts every lesson to your brain state.
        Nothing else does this. Be first.
      </p>
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="email" required placeholder="your@email.com" value={email}
          onChange={e => setEmail(e.target.value)}
          className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/25 text-xs outline-none focus:border-[#4CC8E8]/50 transition"
        />
        <button type="submit" disabled={!email.trim() || status === 'sending'}
          className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-900 transition-all disabled:opacity-50 shrink-0"
          style={{ background: 'linear-gradient(135deg, #4CC8E8, #9333ea)' }}>
          {status === 'sending' ? '...' : 'Join →'}
        </button>
      </form>
    </div>
  )
}
