import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, RotateCcw, Trophy } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useUserStore } from '../../store/userStore'
import { playFanfare } from '../../utils/fanfare'
import { getPersonalizedVocab } from '../../data/vocabulary'
import type { VocabCategory } from '../../types'

const PAIR_COUNT = 6

interface Tile { id: string; text: string; type: 'italian' | 'english'; wordId: string; matched: boolean }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildTiles(profile: NonNullable<ReturnType<typeof useUserStore.getState>['profile']>): Tile[] {
  const words = getPersonalizedVocab(
    profile.activeLanguage,
    profile.interests as VocabCategory[],
    [],
  )
  const picked = shuffle(words).slice(0, PAIR_COUNT)
  const italian: Tile[] = picked.map(w => ({ id: `it-${w.id}`, text: w.native, type: 'italian', wordId: w.id, matched: false }))
  const english: Tile[] = picked.map(w => ({ id: `en-${w.id}`, text: w.translation, type: 'english', wordId: w.id, matched: false }))
  return [...shuffle(italian), ...shuffle(english)]
}

export default function WordMatchPage() {
  const navigate = useNavigate()
  const profile = useUserStore(s => s.profile)
  const { addXp, addCoins, markWordLearned } = useUserStore()

  const [tiles, setTiles] = useState<Tile[]>([])
  const [selected, setSelected] = useState<Tile | null>(null)
  const [wrong, setWrong] = useState<[string, string] | null>(null)
  const [score, setScore] = useState(0)
  const [errors, setErrors] = useState(0)
  const [done, setDone] = useState(false)
  const [roundCoins] = useState(0)

  const init = useCallback(() => {
    if (!profile) return
    setTiles(buildTiles(profile))
    setSelected(null)
    setWrong(null)
    setScore(0)
    setErrors(0)
    setDone(false)
  }, [profile])

  useEffect(() => { init() }, [init])

  function pick(tile: Tile) {
    if (tile.matched || wrong) return
    if (!selected) {
      setSelected(tile)
      return
    }
    if (selected.id === tile.id) { setSelected(null); return }

    // Check match
    if (selected.wordId === tile.wordId && selected.type !== tile.type) {
      // Correct match!
      setTiles(prev => prev.map(t =>
        t.wordId === tile.wordId ? { ...t, matched: true } : t,
      ))
      setScore(s => {
        const next = s + 1
        if (next === PAIR_COUNT) {
          playFanfare(errors === 0 ? 'perfect' : 'complete')
          addXp(profile!.activeLanguage, 30)
          addCoins(errors === 0 ? 25 : 10)
          markWordLearned(profile!.activeLanguage, tile.wordId)
          setTimeout(() => setDone(true), 500)
        }
        return next
      })
      if (profile) markWordLearned(profile.activeLanguage, tile.wordId)
      setSelected(null)
    } else {
      // Wrong!
      setErrors(e => e + 1)
      setWrong([selected.id, tile.id])
      setTimeout(() => { setWrong(null); setSelected(null) }, 700)
    }
  }

  if (!profile) return null

  const matched = tiles.filter(t => t.matched).length / 2
  const italian = tiles.filter(t => t.type === 'italian')
  const english = tiles.filter(t => t.type === 'english')

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 max-w-2xl mx-auto w-full">
        <button onClick={() => navigate('/dashboard')} className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
          <X size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-display font-bold text-white text-lg">Word Match</h1>
          <p className="text-xs text-white/40">Tap an Italian word, then its English match</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-emerald-400 font-bold">{matched}/{PAIR_COUNT}</span>
          {errors > 0 && <span className="text-red-400 font-bold">×{errors}</span>}
        </div>
      </div>

      {/* Game area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <AnimatePresence>
          {done ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-3xl p-8 max-w-sm w-full text-center"
            >
              <div className="text-5xl mb-4">{errors === 0 ? '🏆' : '🎉'}</div>
              <h2 className="font-display text-2xl font-bold text-white mb-1">
                {errors === 0 ? 'Perfect Match!' : 'Round Complete!'}
              </h2>
              <p className="text-white/50 text-sm mb-6">{errors} mistakes · {PAIR_COUNT} pairs matched</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-xl font-bold text-gabb-400">+30 XP</p>
                  <p className="text-xs text-white/40">Experience</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                  <p className="text-xl font-bold text-amber-400">+{errors === 0 ? 25 : 10} 🪙</p>
                  <p className="text-xs text-amber-400/60">GGC</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" fullWidth onClick={() => navigate('/dashboard')}>Dashboard</Button>
                <Button variant="gradient" fullWidth onClick={init}>Play Again</Button>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                {/* Italian column */}
                <div className="space-y-2">
                  <p className="text-xs text-center text-white/40 uppercase tracking-wider mb-3">🇮🇹 Italian</p>
                  {italian.map(tile => (
                    <TileButton
                      key={tile.id}
                      tile={tile}
                      isSelected={selected?.id === tile.id}
                      isWrong={wrong?.includes(tile.id) ?? false}
                      onPick={pick}
                    />
                  ))}
                </div>
                {/* English column */}
                <div className="space-y-2">
                  <p className="text-xs text-center text-white/40 uppercase tracking-wider mb-3">🇬🇧 English</p>
                  {english.map(tile => (
                    <TileButton
                      key={tile.id}
                      tile={tile}
                      isSelected={selected?.id === tile.id}
                      isWrong={wrong?.includes(tile.id) ?? false}
                      onPick={pick}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function TileButton({ tile, isSelected, isWrong, onPick }: { tile: Tile; isSelected: boolean; isWrong: boolean; onPick: (t: Tile) => void }) {
  if (tile.matched) {
    return (
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.05, 1] }}
        className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-center"
      >
        <span className="text-sm text-emerald-300 font-medium">{tile.text} ✓</span>
      </motion.div>
    )
  }
  return (
    <motion.button
      animate={isWrong ? { x: [-6, 6, -6, 6, 0] } : {}}
      transition={{ duration: 0.3 }}
      onClick={() => onPick(tile)}
      className={`w-full p-3 rounded-xl border text-sm font-medium transition-all text-center ${
        isSelected
          ? 'bg-[#4CC8E8]/20 border-[#4CC8E8]/60 text-white shadow-lg shadow-[#4CC8E8]/10'
          : isWrong
          ? 'bg-red-500/20 border-red-500/40 text-red-300'
          : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20'
      }`}
    >
      {tile.text}
    </motion.button>
  )
}
