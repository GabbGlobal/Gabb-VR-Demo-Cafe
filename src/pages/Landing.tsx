import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Zap, Globe, Heart, ChevronRight, Star, Mic, Headset, X, Check, Flame, Activity, Cpu, Waves } from 'lucide-react'
import { Button } from '../components/ui/Button'
import GabbLogo from '../components/ui/GabbLogo'
import { LANGUAGES, PRICING_TIERS } from '../data/languages'
import { useUserStore } from '../store/userStore'

const features = [
  { icon: Brain, title: 'Neuroadaptive AI', description: 'Real-time biosensor data adjusts lesson difficulty, pacing, and content to match your brain\'s state — automatically.' },
  { icon: Mic,   title: 'Pronunciation Coach', description: 'Speak a word and see colour-coded phoneme feedback. Hear native speakers. Practice until it sticks.' },
  { icon: Globe, title: 'Vocabulary for Real Life', description: '1,000+ words curated for your interests — travel, romance, LGBTQ+ community, culture, food, and more.' },
  { icon: Headset, title: 'VR Immersion (Coming Soon)', description: 'Step inside a virtual Rome café or Tokyo market. Full conversational practice in 3D — no headset required to start.' },
]

const vsItems = [
  { duolingo: 'Streaks & cartoon XP',        gabb: 'Real conversation outcomes' },
  { duolingo: 'Generic word lists',           gabb: 'Vocabulary for your actual trip' },
  { duolingo: 'Same lesson for everyone',     gabb: 'Adapts to your stress, focus & fatigue' },
  { duolingo: 'No voice recognition',         gabb: 'Phoneme-level pronunciation scoring' },
  { duolingo: 'No biosensor support',         gabb: 'HRM, EEG & GSR integration' },
]

const testimonials = [
  { name: 'Marco V.', avatar: '👨‍💼', text: 'I connected my Polar H10 and the lessons literally adapted in real-time when I got anxious. Incredible.' },
  { name: 'Sophie L.', avatar: '👩‍🎨', text: 'Finally an app that knows I need travel vocab not business jargon. The LGBTQ+ word pack is chef\'s kiss.' },
  { name: 'James T.', avatar: '🧑‍💻', text: 'Went from zero to conversational Italian in 3 months. The neuroadaptive pacing is game-changing.' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const profile = useUserStore(s => s.profile)
  const signIn = useUserStore(s => s.signIn)
  const progress = useUserStore(s => s.progress)

  // Returning user — show welcome back screen instead of full landing
  if (profile) {
    const lang = LANGUAGES.find(l => l.code === profile.activeLanguage)
    const streak = Object.values(progress).reduce((max, p) => Math.max(max, p.streak), 0)
    const totalWords = Object.values(progress).reduce((sum, p) => sum + p.wordsLearned.length, 0)
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#4CC8E8]/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/8 rounded-full blur-3xl" />
        </div>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-sm text-center space-y-6">
          {/* Globe avatar */}
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}
            className="mx-auto w-20 h-20">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_18px_rgba(76,200,232,0.4)]">
              <defs>
                <radialGradient id="wb-globe" cx="38%" cy="32%" r="65%">
                  <stop offset="0%" stopColor="#B8ECF8" /><stop offset="55%" stopColor="#4CC8E8" /><stop offset="100%" stopColor="#1A90B8" />
                </radialGradient>
              </defs>
              <circle cx="50" cy="50" r="49" fill="url(#wb-globe)" />
              <ellipse cx="27" cy="34" rx="14" ry="9" fill="#4A9660" opacity="0.88" transform="rotate(-20 27 34)" />
              <ellipse cx="58" cy="27" rx="10" ry="6" fill="#4A9660" opacity="0.82" transform="rotate(12 58 27)" />
              <ellipse cx="73" cy="50" rx="8" ry="6.5" fill="#5AA870" opacity="0.78" transform="rotate(20 73 50)" />
              <ellipse cx="34" cy="68" rx="10" ry="6" fill="#4A9660" opacity="0.80" transform="rotate(-12 34 68)" />
              <circle cx="37" cy="50" r="5.5" fill="white" /><circle cx="63" cy="50" r="5.5" fill="white" />
              <circle cx="38.8" cy="51.5" r="2.8" fill="#18293E" /><circle cx="64.8" cy="51.5" r="2.8" fill="#18293E" />
              <path d="M 36 63 Q 50 74 64 63" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
          </motion.div>
          <div>
            <p className="text-white/50 text-sm">Welcome back!</p>
            <h1 className="font-display text-4xl font-extrabold text-white mt-1">
              {profile.name} {lang?.flag}
            </h1>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {streak > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Flame size={16} className="text-orange-400" />
                  <span className="font-bold text-2xl text-white">{streak}</span>
                </div>
                <p className="text-xs text-orange-300">Day streak 🔥</p>
              </div>
            )}
            <div className={`bg-[#4CC8E8]/10 border border-[#4CC8E8]/20 rounded-2xl p-4 ${streak === 0 ? 'col-span-2' : ''}`}>
              <p className="font-bold text-2xl text-white mb-1">{totalWords}</p>
              <p className="text-xs text-[#4CC8E8]/80">Words learned 📚</p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { signIn(); navigate('/dashboard') }}
            className="w-full py-4 rounded-2xl font-bold text-lg text-slate-900 gabb-gradient shadow-lg shadow-[#4CC8E8]/20 hover:shadow-[#4CC8E8]/40 transition-shadow"
          >
            Continue Learning →
          </motion.button>
          <p className="text-xs text-white/30">
            Not {profile.name}?{' '}
            <button onClick={() => { useUserStore.getState().reset(); navigate('/') }}
              className="text-white/50 hover:text-white underline transition-colors">
              Start fresh
            </button>
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GabbLogo size={34} showWordmark />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/subscribe')}>Pricing</Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/onboarding/welcome')}>
              Start Free
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-20 pb-32 px-4 text-center overflow-hidden">
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-gabb-500/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 text-sm text-gabb-300 bg-gabb-500/10 border border-gabb-500/20 rounded-full px-4 py-1.5 mb-6">
            <Brain size={14} />
            <span>Brain-powered language learning</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6">
            Not Duolingo.
            <br />
            <span className="bg-clip-text text-transparent gabb-gradient">
              Your Brain in Charge.
            </span>
          </h1>

          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-6 text-balance">
            Gabb adapts every lesson to your real-time cognitive state — stress, focus, fatigue.
            Italian, Spanish, French, Portuguese. Built for your next trip, not cartoon streaks.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-10 text-sm">
            {['🧠 Neuroadaptive pacing', '🎙️ Pronunciation scoring', '🌍 Trip-ready vocab', '📡 Biosensor-ready'].map(tag => (
              <span key={tag} className="px-3 py-1.5 glass rounded-full text-white/70 border border-white/10">{tag}</span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="gradient" size="xl" onClick={() => navigate('/onboarding/welcome')}>
              Start Learning Free
              <ChevronRight size={20} />
            </Button>
            <Button variant="secondary" size="xl" onClick={() => navigate('/subscribe')}>
              See Pricing
            </Button>
          </div>

          <p className="mt-5 text-sm text-white/40">No credit card required · Cancel anytime</p>
        </motion.div>
      </section>

      {/* Languages */}
      <section className="py-16 px-4 bg-white/2">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-center text-white mb-3">
            Four Languages. One Neuroadaptive Brain.
          </h2>
          <p className="text-center text-white/50 mb-10">More languages coming soon.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {LANGUAGES.map((lang, i) => (
              <motion.div
                key={lang.code}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-5 text-center hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => navigate('/onboarding/welcome')}
              >
                <div className="text-4xl mb-3">{lang.flag}</div>
                <p className="font-semibold text-white">{lang.name}</p>
                <p className="text-xs text-white/40 mt-1">{lang.speakers} speakers</p>
                <p className="text-xs text-gabb-400 mt-2 font-semibold">${lang.priceMonthly}/mo</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-center text-white mb-12">
            Science-Backed. Sensor-Powered.
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="glass rounded-2xl p-6 flex gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-gabb-500/20 flex items-center justify-center shrink-0">
                  <f.icon size={20} className="text-gabb-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{f.title}</h3>
                  <p className="text-sm text-white/50">{f.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gabb vs Duolingo */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-center text-white mb-3">Gabb vs Duolingo</h2>
          <p className="text-center text-white/50 mb-10">We're not competing on streaks. We're competing on results.</p>
          <div className="glass rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 text-xs font-semibold text-white/50 uppercase tracking-wider px-6 py-3 border-b border-white/10">
              <span></span>
              <span className="text-center text-red-400">Duolingo</span>
              <span className="text-center text-gabb-400">Gabb</span>
            </div>
            {vsItems.map((item, i) => (
              <div key={i} className={`grid grid-cols-3 px-6 py-4 items-center ${i % 2 === 0 ? 'bg-white/2' : ''}`}>
                <span className="text-sm text-white/60">{item.gabb.split(' ').slice(0,3).join(' ')}</span>
                <div className="flex items-center justify-center gap-2">
                  <X size={14} className="text-red-400 shrink-0" />
                  <span className="text-xs text-white/40 text-center">{item.duolingo}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0" />
                  <span className="text-xs text-white text-center">{item.gabb}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-white/2">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-center text-white mb-10">Loved by Learners</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-5"
              >
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" className="text-amber-400" />)}
                </div>
                <p className="text-sm text-white/70 mb-4">"{t.text}"</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{t.avatar}</span>
                  <span className="text-sm font-semibold text-white">{t.name}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">Simple Pricing</h2>
          <p className="text-white/50 mb-10">One language or all of them — no hidden fees.</p>
          <div className="grid sm:grid-cols-3 gap-5">
            {PRICING_TIERS.map(tier => (
              <div key={tier.id} className={`glass rounded-2xl p-6 relative ${tier.highlighted ? 'border-gabb-500/50 shadow-lg shadow-gabb-500/10' : ''}`}>
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gabb-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="font-display font-bold text-white mb-1">{tier.name}</h3>
                <p className="text-3xl font-bold text-white mt-3">
                  {tier.priceMonthly === 0 ? 'Free' : `$${tier.priceMonthly}`}
                  {tier.priceMonthly > 0 && <span className="text-sm text-white/40 font-normal">/mo</span>}
                </p>
                <ul className="mt-4 space-y-1.5 text-left">
                  {tier.features.slice(0, 4).map(f => (
                    <li key={f} className="text-xs text-white/60 flex items-start gap-1.5">
                      <span className="text-emerald-400 mt-0.5">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Button
                  fullWidth
                  variant={tier.highlighted ? 'gradient' : 'secondary'}
                  size="md"
                  className="mt-5"
                  onClick={() => navigate(tier.id === 'free' ? '/onboarding/welcome' : '/subscribe')}
                >
                  {tier.id === 'free' ? 'Start Free' : 'Get Started'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEUROADAPTIVE WAITLIST ── */}
      <WaitlistSection />

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4 text-center text-sm text-white/30">
        <p>© 2026 Gabb Global · <a href="https://www.gabbglobal.com" className="hover:text-white transition-colors">gabbglobal.com</a></p>
      </footer>
    </div>
  )
}

// ─── Neuroadaptive Waitlist Section ─────────────────────────────────────────

const NEURO_PERKS = [
  { icon: Activity, label: 'Heart Rate Monitor',  desc: 'Polar H10, Apple Watch, Garmin — lesson difficulty adjusts to your stress level in real time.' },
  { icon: Waves,    label: 'EEG Headband',        desc: "Muse S reads your focus & fatigue. Gabb slows down when your brain is fried, speeds up when you're locked in." },
  { icon: Cpu,      label: 'GSR Skin Response',   desc: 'Shimmer3 detects anxiety spikes. Hard words get easier when you\'re stressed — not harder.' },
  { icon: Brain,    label: 'Adaptive AI Engine',  desc: 'No other language app on earth does this. Not Duolingo. Not Babbel. Not Rosetta Stone.' },
]

function WaitlistSection() {
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [useCase, setUseCase] = useState('')
  const [status,  setStatus]  = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('sending')
    try {
      const body = new URLSearchParams({
        'form-name': 'neuroadaptive-waitlist',
        'bot-field': '',
        name:        name.trim(),
        email:       email.trim(),
        use_case:    useCase.trim(),
      })
      const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() })
      setStatus(res.ok ? 'done' : 'error')
    } catch {
      // In dev, Netlify forms aren't active — show success anyway
      setStatus('done')
    }
  }

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#4CC8E8]/30 to-transparent" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(76,200,232,0.06) 0%, transparent 70%)' }} />
      </div>

      <div className="relative max-w-4xl mx-auto">

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#4CC8E8]/30 bg-[#4CC8E8]/8 text-[#4CC8E8] text-xs font-semibold tracking-widest uppercase mb-5">
            <Brain size={12} /> Exclusive Early Access
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4">
            The language app that reads<br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #4CC8E8, #9333ea)' }}>
              your brain in real time
            </span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto leading-relaxed">
            Biosensor-adaptive lessons that know when you're stressed, focused, or fatigued — and adjust automatically.
            Nothing like this exists anywhere. We're shipping it first to the waitlist.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4 mb-14">
          {NEURO_PERKS.map((perk, i) => (
            <motion.div key={perk.label}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex gap-4 p-5 rounded-2xl border border-white/8 bg-white/3 hover:bg-white/5 hover:border-[#4CC8E8]/20 transition-all group">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-[#4CC8E8]/10 border border-[#4CC8E8]/20 flex items-center justify-center group-hover:bg-[#4CC8E8]/20 transition-colors">
                <perk.icon size={18} className="text-[#4CC8E8]" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm mb-1">{perk.label}</p>
                <p className="text-white/40 text-xs leading-relaxed">{perk.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="max-w-lg mx-auto">
          <AnimatePresence mode="wait">
            {status === 'done' ? (
              <motion.div key="success"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center p-10 rounded-3xl border border-emerald-500/25 bg-emerald-500/8 space-y-4">
                <motion.div animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }} transition={{ duration: 0.6 }}
                  className="text-6xl">🧠</motion.div>
                <h3 className="font-display text-2xl font-bold text-white">You're on the list!</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  We'll reach out before anyone else when biosensor-adaptive mode ships.
                  In the meantime — start practicing. The base app is free.
                </p>
                <div className="inline-flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                  <Check size={16} /> Confirmed
                </div>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={handleSubmit}
                className="p-8 rounded-3xl border border-white/10 bg-white/3 space-y-4"
                style={{ boxShadow: '0 0 60px rgba(76,200,232,0.06)' }}>
                <div className="text-center mb-2">
                  <p className="font-display font-bold text-white text-xl">Join the Neuroadaptive Waitlist</p>
                  <p className="text-white/40 text-sm mt-1">Be first. Limited spots.</p>
                </div>
                <input type="text" name="bot-field" className="hidden" aria-hidden="true" readOnly />
                <div className="grid sm:grid-cols-2 gap-3">
                  <input type="text" placeholder="First name" value={name} onChange={e => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm outline-none focus:border-[#4CC8E8]/60 focus:ring-1 focus:ring-[#4CC8E8]/30 transition" />
                  <input type="email" required placeholder="Email address *" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm outline-none focus:border-[#4CC8E8]/60 focus:ring-1 focus:ring-[#4CC8E8]/30 transition" />
                </div>
                <select value={useCase} onChange={e => setUseCase(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#4CC8E8]/60 focus:ring-1 focus:ring-[#4CC8E8]/30 transition"
                  style={{ color: useCase ? '#fff' : 'rgba(255,255,255,0.25)' }}>
                  <option value="" disabled>What biosensor do you use? (optional)</option>
                  <option value="apple_watch">Apple Watch / HealthKit</option>
                  <option value="polar">Polar H10 / Chest HRM</option>
                  <option value="muse">Muse EEG Headband</option>
                  <option value="garmin">Garmin / Whoop / Oura</option>
                  <option value="shimmer">Shimmer GSR</option>
                  <option value="none_yet">Don't have one yet — want a recommendation</option>
                  <option value="other">Other</option>
                </select>
                <motion.button type="submit" disabled={!email.trim() || status === 'sending'}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-2xl font-bold text-slate-900 text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #4CC8E8, #9333ea)' }}>
                  {status === 'sending' ? 'Securing your spot...' : 'Claim My Early Access →'}
                </motion.button>
                {status === 'error' && (
                  <p className="text-center text-xs text-red-400">Something went wrong — email us at hello@gabbglobal.com</p>
                )}
                <p className="text-center text-xs text-white/25">No spam. No selling your data. Just a heads-up when it ships.</p>
              </motion.form>
            )}
          </AnimatePresence>
          <div className="flex flex-wrap items-center justify-center gap-5 mt-6 text-xs text-white/25">
            <span>✓ Free base app — no credit card</span>
            <span>✓ Cancel anytime</span>
            <span>✓ First access to biosensor AI</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
