import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, Zap, Globe, Heart, ChevronRight, Star } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { LANGUAGES, PRICING_TIERS } from '../data/languages'

const features = [
  { icon: Brain, title: 'Neuroadaptive AI', description: 'Real-time biosensor data adjusts lesson difficulty, pacing, and content to match your brain\'s state.' },
  { icon: Heart, title: 'Biosensor Integration', description: 'Connect heart rate monitors, EEG headbands, and GSR sensors via Web Bluetooth for live cognitive feedback.' },
  { icon: Globe, title: 'Personalised Vocabulary', description: '1,000+ words curated for your interests — travel, romance, LGBTQ+ community, culture, food, and more.' },
  { icon: Zap, title: 'Flow State Learning', description: 'When you\'re in the zone, we push harder. When you\'re stressed, we ease off. Science-backed pacing.' },
]

const testimonials = [
  { name: 'Marco V.', avatar: '👨‍💼', text: 'I connected my Polar H10 and the lessons literally adapted in real-time when I got anxious. Incredible.' },
  { name: 'Sophie L.', avatar: '👩‍🎨', text: 'Finally an app that knows I need travel vocab not business jargon. The LGBTQ+ word pack is chef\'s kiss.' },
  { name: 'James T.', avatar: '🧑‍💻', text: 'Went from zero to conversational Italian in 3 months. The neuroadaptive pacing is game-changing.' },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl gabb-gradient flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="font-display font-bold text-white">Gabb Languages</span>
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
            Learn Languages
            <br />
            <span className="bg-clip-text text-transparent gabb-gradient">
              at Brain Speed
            </span>
          </h1>

          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10 text-balance">
            The only language app that connects to your biosensors and adapts every lesson
            to your real-time cognitive state. Like Duolingo, but your brain is in charge.
          </p>

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

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4 text-center text-sm text-white/30">
        <p>© 2026 Gabb Global · <a href="https://www.gabbglobal.com" className="hover:text-white transition-colors">gabbglobal.com</a></p>
      </footer>
    </div>
  )
}
