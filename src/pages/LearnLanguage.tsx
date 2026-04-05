/**
 * /learn/:slug — individual course landing page.
 * Public, no login required.
 * Each language gets its own SEO-friendly landing page.
 * Link these directly from gabbglobal.com, LinkedIn, social media.
 *
 * Examples:
 *   https://gabbitalian.netlify.app/learn/italian
 *   https://gabbitalian.netlify.app/learn/spanish
 *   https://gabbitalian.netlify.app/learn/french
 */
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Check, Mic, Brain, Globe, Zap, Star, ArrowLeft } from 'lucide-react'
import GabbLogo from '../components/ui/GabbLogo'
import { CATALOG } from '../data/catalog'

const WHAT_YOU_GET = [
  { icon: Brain, title: 'Neuroadaptive Pacing', desc: 'Lessons automatically slow down when you\'re tired, speed up when you\'re sharp. No other app does this.' },
  { icon: Mic,   title: 'Live Pronunciation Scoring', desc: 'Speak a word and see instant phoneme-level feedback. The AI hears the difference between "ciao" and "chao."' },
  { icon: Globe, title: 'Trip-Ready Vocabulary', desc: 'Not generic word lists. Vocabulary curated for your trip, your interests, your life — travel, food, romance, work.' },
  { icon: Zap,   title: 'AI Conversation Partner', desc: 'Gabby, your AI tutor, responds in real time. Practice full conversations before you land.' },
]

const REVIEWS = [
  { name: 'Sarah M.', flag: '🇺🇸', text: 'I ordered my first meal in Italian without looking at a translation app. Three months of Gabb did that.', stars: 5 },
  { name: 'David K.', flag: '🇨🇦', text: 'The neuroadaptive pacing is real. It noticed I was tired on a Tuesday night and gave me easier reviews. Wild.', stars: 5 },
  { name: 'Priya L.', flag: '🇬🇧', text: 'I\'ve tried Duolingo, Rosetta Stone, Babbel. Gabb is the only one that made me feel like I was actually learning a language.', stars: 5 },
]

export default function LearnLanguagePage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const lang = CATALOG.find(l => l.slug === slug)

  if (!lang) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/50 text-xl mb-4">Language not found.</p>
          <button onClick={() => navigate('/courses')}
            className="text-gabb-400 hover:text-gabb-300 underline">Browse all languages</button>
        </div>
      </div>
    )
  }

  const isActive = lang.active

  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gabb-500/6 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/courses')}
              className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft size={18} />
            </button>
            <GabbLogo size={30} showWordmark />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/subscribe')}
              className="text-sm text-white/50 hover:text-white transition-colors hidden sm:block">Pricing</button>
            <button
              onClick={() => navigate(isActive ? '/onboarding/welcome' : '/courses')}
              className="px-4 py-2 rounded-xl bg-gabb-500 hover:bg-gabb-400 text-white text-sm font-semibold transition-colors">
              {isActive ? 'Start Free' : 'Get Notified'}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4">

        {/* Hero */}
        <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          className="pt-16 pb-12 text-center">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ fontSize: '96px' }}
            className="mb-6 block">
            {lang.flag}
          </motion.div>

          {!isActive && (
            <div className="inline-flex items-center gap-2 text-sm text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-4">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Coming Soon — Join the waitlist
            </div>
          )}

          <h1 className="font-display text-5xl md:text-7xl font-extrabold text-white mb-4">
            Learn {lang.name}
          </h1>
          <p className="text-2xl text-white/50 mb-2 font-light">{lang.nativeName}</p>
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8 leading-relaxed">
            {lang.tagline}
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-10 text-sm text-white/40">
            <span>🌍 {lang.speakers} speakers</span>
            <span>·</span>
            <span>💰 ${lang.priceMonthly}/month</span>
            <span>·</span>
            <span>📈 {lang.difficulty.replace('-', ' ')}</span>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/onboarding/welcome')}
              className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-gabb-500 hover:bg-gabb-400 text-white font-bold text-lg transition-all shadow-lg shadow-gabb-500/20">
              {isActive ? `Start Learning ${lang.name} Free` : 'Join the Waitlist'}
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            {isActive && (
              <button onClick={() => navigate('/subscribe')}
                className="px-8 py-4 rounded-2xl bg-white/5 border border-white/15 text-white/70 hover:text-white hover:bg-white/10 font-medium text-lg transition-all">
                See Pricing
              </button>
            )}
          </div>
          <p className="mt-4 text-sm text-white/30">No credit card required · Cancel anytime</p>
        </motion.section>

        {/* About this language */}
        <section className="py-12 border-t border-white/10">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="font-display text-3xl font-bold text-white mb-4">Why {lang.name}?</h2>
              <p className="text-white/60 text-lg leading-relaxed mb-6">{lang.description}</p>
              <ul className="space-y-3">
                {lang.highlights.map(h => (
                  <li key={h} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-gabb-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={12} className="text-gabb-400" />
                    </div>
                    <span className="text-white/70">{h}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Visual placeholder — Gabb scene preview */}
            <div className="glass border border-white/10 rounded-3xl p-8 text-center">
              <div style={{ fontSize: '72px' }} className="mb-4">{lang.flag}</div>
              <div className="space-y-3">
                {[
                  { label: 'Vocabulary words', value: '1,000+', color: 'text-gabb-400' },
                  { label: 'Lesson topics', value: '10 categories', color: 'text-purple-400' },
                  { label: 'Avg trip-ready time', value: '6 weeks', color: 'text-amber-400' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between py-2 border-b border-white/8 last:border-0">
                    <span className="text-white/50 text-sm">{s.label}</span>
                    <span className={`font-bold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* What you get */}
        {isActive && (
          <section className="py-12 border-t border-white/10">
            <h2 className="font-display text-3xl font-bold text-white text-center mb-10">
              What makes Gabb different
            </h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {WHAT_YOU_GET.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="glass border border-white/10 rounded-2xl p-6">
                  <div className="w-10 h-10 rounded-xl bg-gabb-500/15 flex items-center justify-center mb-4">
                    <Icon size={20} className="text-gabb-400" />
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        {isActive && (
          <section className="py-12 border-t border-white/10">
            <h2 className="font-display text-3xl font-bold text-white text-center mb-8">
              What learners say
            </h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {REVIEWS.map(r => (
                <div key={r.name} className="glass border border-white/10 rounded-2xl p-5">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: r.stars }).map((_, i) => (
                      <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed mb-4">"{r.text}"</p>
                  <div className="flex items-center gap-2">
                    <span>{r.flag}</span>
                    <span className="text-white/40 text-sm font-medium">{r.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="py-16 text-center border-t border-white/10">
          <h2 className="font-display text-4xl font-bold text-white mb-4">
            Ready to speak {lang.name}?
          </h2>
          <p className="text-white/50 text-lg mb-8">
            {isActive
              ? 'Your first lesson is free. No credit card, no commitment.'
              : 'Be first to know when we launch.'}
          </p>
          <button
            onClick={() => navigate('/onboarding/welcome')}
            className="px-10 py-5 rounded-2xl bg-gabb-500 hover:bg-gabb-400 text-white font-bold text-xl transition-all shadow-xl shadow-gabb-500/20">
            {isActive ? `Start ${lang.name} Today — Free` : 'Join the Waitlist'}
          </button>
        </section>
      </div>
    </div>
  )
}
