/**
 * /courses — Mango Languages-style catalog page.
 * All languages in a grid, filterable by region.
 * Active languages link straight to /learn/:slug
 * Coming-soon languages show a "Notify me" waitlist button.
 * This page is PUBLIC — no login required.
 * Link this URL from gabbglobal.com.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronRight, Bell, Zap, Globe, Brain } from 'lucide-react'
import GabbLogo from '../components/ui/GabbLogo'
import { CATALOG, REGIONS } from '../data/catalog'
import type { Region } from '../data/catalog'

const DIFFICULTY_COLOR = {
  'beginner-friendly': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'Beginner friendly' },
  'moderate':          { bg: 'bg-yellow-500/10',  text: 'text-yellow-400',  border: 'border-yellow-500/20',  label: 'Moderate' },
  'challenging':       { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/20',     label: 'Challenging' },
}

export default function CoursesPage() {
  const navigate = useNavigate()
  const [region, setRegion] = useState<Region>('All')
  const [query, setQuery] = useState('')
  const [notifyEmail, setNotifyEmail] = useState<Record<string, string>>({})
  const [notified, setNotified] = useState<Record<string, boolean>>({})

  const filtered = CATALOG.filter(lang => {
    const matchRegion = region === 'All' || lang.region === region
    const matchQuery = !query || lang.name.toLowerCase().includes(query.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(query.toLowerCase())
    return matchRegion && matchQuery
  })

  const active = filtered.filter(l => l.active)
  const coming = filtered.filter(l => !l.active)

  function handleNotify(slug: string) {
    const email = notifyEmail[slug]
    if (!email || !email.includes('@')) return
    setNotified(n => ({ ...n, [slug]: true }))
    // In production: POST to Netlify form or API
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'form-name': 'language-notify', email, language: slug }).toString(),
    }).catch(() => {})
  }

  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gabb-500/6 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="shrink-0">
            <GabbLogo size={34} showWordmark />
          </button>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/subscribe')}
              className="text-sm text-white/50 hover:text-white transition-colors">Pricing</button>
            <button onClick={() => navigate('/onboarding/welcome')}
              className="px-4 py-2 rounded-xl bg-gabb-500 hover:bg-gabb-400 text-white text-sm font-semibold transition-colors">
              Start Free
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-sm text-gabb-300 bg-gabb-500/10 border border-gabb-500/20 rounded-full px-4 py-1.5 mb-4">
            <Globe size={14} />
            <span>{CATALOG.filter(l => l.active).length} languages available · {CATALOG.filter(l => !l.active).length} coming soon</span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold text-white mb-4">
            Choose Your Language
          </h1>
          <p className="text-xl text-white/50 max-w-2xl mx-auto">
            Neuroadaptive, brain-powered language learning. Real conversations, not cartoon streaks.
          </p>
        </motion.div>

        {/* Trust bar */}
        <div className="grid grid-cols-3 gap-4 mb-10 max-w-2xl mx-auto">
          {[
            { icon: Brain, text: 'Adapts to your brain state' },
            { icon: Zap,   text: 'Pronunciation scored live' },
            { icon: Globe, text: '$9.99/mo · Cancel anytime' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm text-white/40 justify-center">
              <Icon size={14} className="text-gabb-400 shrink-0" />
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search languages…"
              className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-gabb-500/50 transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {REGIONS.map(r => (
              <button key={r} onClick={() => setRegion(r)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  region === r
                    ? 'bg-gabb-500 text-white'
                    : 'bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10'
                }`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Active languages */}
        {active.length > 0 && (
          <div className="mb-12">
            <h2 className="font-display font-bold text-xl text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              Available Now
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {active.map((lang, i) => {
                const diff = DIFFICULTY_COLOR[lang.difficulty]
                return (
                  <motion.div
                    key={lang.slug}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group relative glass border border-white/10 hover:border-gabb-500/30 rounded-2xl p-5 transition-all hover:bg-white/5 cursor-pointer"
                    onClick={() => navigate(`/learn/${lang.slug}`)}
                  >
                    {/* Flag + name */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span style={{ fontSize: '40px' }}>{lang.flag}</span>
                        <div>
                          <h3 className="font-display font-bold text-lg text-white">{lang.name}</h3>
                          <p className="text-white/40 text-sm">{lang.nativeName} · {lang.speakers} speakers</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-white/20 group-hover:text-gabb-400 transition-colors mt-1 shrink-0" />
                    </div>

                    {/* Tagline */}
                    <p className="text-white/60 text-sm mb-3 leading-relaxed">{lang.tagline}</p>

                    {/* Highlights */}
                    <ul className="space-y-1 mb-4">
                      {lang.highlights.map(h => (
                        <li key={h} className="flex items-center gap-2 text-xs text-white/40">
                          <span className="w-1 h-1 rounded-full bg-gabb-400 shrink-0" />
                          {h}
                        </li>
                      ))}
                    </ul>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/8">
                      <span className={`text-xs px-2 py-1 rounded-full border ${diff.bg} ${diff.text} ${diff.border}`}>
                        {diff.label}
                      </span>
                      <span className="text-gabb-400 font-bold text-sm">${lang.priceMonthly}/mo</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* Coming soon languages */}
        {coming.length > 0 && (
          <div>
            <h2 className="font-display font-bold text-xl text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" />
              Coming Soon
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {coming.map((lang, i) => {
                  const diff = DIFFICULTY_COLOR[lang.difficulty]
                  const isNotified = notified[lang.slug]
                  return (
                    <motion.div
                      key={lang.slug}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="glass border border-white/8 rounded-2xl p-5 opacity-80"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span style={{ fontSize: '40px' }}>{lang.flag}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-display font-bold text-lg text-white">{lang.name}</h3>
                              <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">
                                SOON
                              </span>
                            </div>
                            <p className="text-white/40 text-sm">{lang.nativeName} · {lang.speakers} speakers</p>
                          </div>
                        </div>
                      </div>

                      <p className="text-white/50 text-sm mb-3">{lang.tagline}</p>

                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-xs px-2 py-1 rounded-full border ${diff.bg} ${diff.text} ${diff.border}`}>
                          {diff.label}
                        </span>
                      </div>

                      {/* Notify me */}
                      {isNotified ? (
                        <div className="flex items-center gap-2 text-sm text-emerald-400 py-2">
                          <Bell size={14} />
                          We'll notify you when {lang.name} launches!
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            value={notifyEmail[lang.slug] ?? ''}
                            onChange={e => setNotifyEmail(n => ({ ...n, [lang.slug]: e.target.value }))}
                            placeholder="your@email.com"
                            className="flex-1 min-w-0 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/25 focus:outline-none focus:border-gabb-500/40"
                          />
                          <button onClick={() => handleNotify(lang.slug)}
                            className="px-3 py-2 bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg text-sm font-medium hover:bg-amber-500/30 transition-colors shrink-0">
                            <Bell size={14} />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="border-t border-white/10 mt-16 py-12 text-center">
        <h2 className="font-display text-2xl font-bold text-white mb-2">Ready to start?</h2>
        <p className="text-white/50 mb-6">First lesson is free. No credit card required.</p>
        <button onClick={() => navigate('/onboarding/welcome')}
          className="px-8 py-4 rounded-2xl bg-gabb-500 hover:bg-gabb-400 text-white font-bold text-lg transition-colors">
          Begin Your Language Journey
        </button>
      </div>
    </div>
  )
}
