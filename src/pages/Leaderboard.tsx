import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Flame, Globe, Users, Zap } from 'lucide-react'
import Header from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { useUserStore } from '../store/userStore'
import { LANGUAGES } from '../data/languages'

type BoardScope = 'global' | 'friends' | 'weekly'

// Mock leaderboard data — replace with Supabase query when backend is live
const MOCK_PLAYERS = [
  { rank: 1,  name: 'Sofia R.',    avatar: '👩‍🎨', xp: 4820, streak: 42, lang: '🇮🇹', badge: 'Legend' },
  { rank: 2,  name: 'James T.',    avatar: '🧑‍💻', xp: 4210, streak: 31, lang: '🇪🇸', badge: 'Master' },
  { rank: 3,  name: 'Léa M.',      avatar: '👩‍🔬', xp: 3990, streak: 28, lang: '🇫🇷', badge: 'Master' },
  { rank: 4,  name: 'Marco V.',    avatar: '👨‍💼', xp: 3540, streak: 19, lang: '🇮🇹', badge: 'Expert' },
  { rank: 5,  name: 'Ana P.',      avatar: '👩‍🎤', xp: 3100, streak: 15, lang: '🇧🇷', badge: 'Expert' },
  { rank: 6,  name: 'You',         avatar: '⭐',  xp: 0,    streak: 0,  lang: '🇮🇹', badge: 'Rising', isMe: true },
  { rank: 7,  name: 'Kenji N.',    avatar: '🧑‍🎓', xp: 1800, streak: 9,  lang: '🇫🇷', badge: 'Learner' },
  { rank: 8,  name: 'Rachel B.',   avatar: '👩‍💻', xp: 1420, streak: 7,  lang: '🇪🇸', badge: 'Learner' },
  { rank: 9,  name: 'Dario C.',    avatar: '🧔',  xp: 980,  streak: 5,  lang: '🇮🇹', badge: 'Learner' },
  { rank: 10, name: 'Priya S.',    avatar: '👩',  xp: 740,  streak: 4,  lang: '🇧🇷', badge: 'Starter' },
]

const BADGE_COLOR: Record<string, 'purple' | 'amber' | 'blue' | 'green' | 'gray'> = {
  Legend:  'purple',
  Master:  'amber',
  Expert:  'blue',
  Rising:  'green',
  Learner: 'gray',
  Starter: 'gray',
}

const RANK_STYLE = [
  'text-amber-400 font-black text-xl',   // 1
  'text-slate-300 font-black text-xl',   // 2
  'text-amber-600 font-black text-xl',   // 3
]

export default function LeaderboardPage() {
  const [scope, setScope] = useState<BoardScope>('global')
  const profile = useUserStore(s => s.profile)
  const progress = useUserStore(s => s.progress)
  const activeLang = profile?.activeLanguage ?? 'it'
  const myXp = progress[activeLang]?.xp ?? 0
  const myStreak = progress[activeLang]?.streak ?? 0

  // Inject real player stats
  const players = MOCK_PLAYERS.map(p =>
    p.isMe ? { ...p, xp: myXp, streak: myStreak, name: profile?.name ?? 'You' } : p,
  ).sort((a, b) => b.xp - a.xp).map((p, i) => ({ ...p, rank: i + 1 }))

  const myEntry = players.find(p => p.isMe)

  const tabs: { id: BoardScope; label: string; icon: typeof Globe }[] = [
    { id: 'global',  label: 'Global',  icon: Globe },
    { id: 'weekly',  label: 'This Week', icon: Zap },
    { id: 'friends', label: 'Friends', icon: Users },
  ]

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Trophy size={20} className="text-amber-400" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Leaderboard</h1>
              <p className="text-sm text-white/40">Compete with learners worldwide</p>
            </div>
          </div>
        </motion.div>

        {/* Top 3 podium */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="flex items-end justify-center gap-3 mb-8">
            {[players[1], players[0], players[2]].map((p, i) => {
              const heights = ['h-20', 'h-28', 'h-16']
              const medals = ['🥈', '🥇', '🥉']
              const labels = ['2nd', '1st', '3rd']
              return (
                <div key={p.rank} className="flex flex-col items-center gap-2 flex-1">
                  <span className="text-2xl">{p.avatar}</span>
                  <p className="text-xs font-semibold text-white text-center truncate w-full px-1">{p.name}</p>
                  <p className="text-xs text-white/40">{p.xp.toLocaleString()} XP</p>
                  <div className={`w-full ${heights[i]} rounded-t-xl flex items-center justify-center glass border-t border-white/20 ${i === 1 ? 'bg-amber-500/10 border-amber-500/30' : ''}`}>
                    <span className="text-3xl">{medals[i]}</span>
                  </div>
                  <span className="text-xs text-white/50 font-semibold">{labels[i]}</span>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Scope tabs */}
        <div className="flex gap-2 mb-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setScope(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                scope === tab.id ? 'bg-gabb-500 text-white' : 'glass text-white/50 hover:text-white'
              }`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {/* My rank banner */}
        {myEntry && (
          <div className="glass rounded-xl p-3 mb-4 border border-gabb-500/30 bg-gabb-500/5 flex items-center justify-between">
            <span className="text-sm text-white/60">Your rank</span>
            <div className="flex items-center gap-3">
              <span className="font-bold text-gabb-300">#{myEntry.rank}</span>
              <span className="text-sm text-white/60">{myEntry.xp.toLocaleString()} XP</span>
              {myEntry.xp === 0 && <span className="text-xs text-white/40">Complete a lesson to appear!</span>}
            </div>
          </div>
        )}

        {/* Full list */}
        <Card padding="none">
          {players.map((p, i) => (
            <motion.div
              key={p.rank}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`flex items-center gap-4 px-5 py-4 ${i < players.length - 1 ? 'border-b border-white/5' : ''} ${p.isMe ? 'bg-gabb-500/5' : ''}`}
            >
              {/* Rank */}
              <div className="w-7 text-center shrink-0">
                {p.rank <= 3
                  ? <span className={RANK_STYLE[p.rank - 1]}>{['🥇','🥈','🥉'][p.rank - 1]}</span>
                  : <span className="text-sm text-white/40 font-semibold">#{p.rank}</span>
                }
              </div>

              {/* Avatar + name */}
              <span className="text-xl shrink-0">{p.avatar}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-semibold text-sm truncate ${p.isMe ? 'text-gabb-300' : 'text-white'}`}>{p.name}</p>
                  {p.isMe && <Badge color="blue" size="sm">You</Badge>}
                  <Badge color={BADGE_COLOR[p.badge] ?? 'gray'} size="sm">{p.badge}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-white/40">{p.lang}</span>
                  {p.streak > 0 && (
                    <span className="flex items-center gap-1 text-xs text-amber-400">
                      <Flame size={10} /> {p.streak}d
                    </span>
                  )}
                </div>
              </div>

              {/* XP */}
              <div className="text-right shrink-0">
                <p className="font-bold text-sm text-white">{p.xp.toLocaleString()}</p>
                <p className="text-xs text-white/30">XP</p>
              </div>
            </motion.div>
          ))}
        </Card>

        <p className="text-center text-xs text-white/20 mt-4">
          Leaderboard resets every Monday · Friends mode coming soon
        </p>
      </main>
    </div>
  )
}
