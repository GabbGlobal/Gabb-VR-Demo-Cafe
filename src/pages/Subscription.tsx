import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Zap, Globe, Brain, ArrowLeft, CreditCard, AlertCircle } from 'lucide-react'
import { Button } from '../components/ui/Button'
import GabbLogo from '../components/ui/GabbLogo'
import { PRICING_TIERS, LANGUAGES } from '../data/languages'
import { useUserStore } from '../store/userStore'
import { getEmail, openSignup, currentUser } from '../lib/identity'
import type { SubscriptionPlan } from '../types'

const PERKS = [
  { icon: Brain, text: 'Neuroadaptive lessons powered by biosensor data' },
  { icon: Globe, text: '1,000+ words per language across all interest categories' },
  { icon: Zap,   text: 'Unlimited lessons, pronunciation coach, offline mode' },
]

export default function SubscriptionPage() {
  const navigate = useNavigate()
  const profile = useUserStore(s => s.profile)
  const setSubscription = useUserStore(s => s.setSubscription)
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [selected, setSelected] = useState<SubscriptionPlan>('allaccess')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function getPrice(tier: typeof PRICING_TIERS[0]) {
    if (tier.priceMonthly === 0) return 'Free'
    if (billing === 'annual') {
      const monthly = (tier.priceAnnual / 12).toFixed(2)
      return `$${monthly}/mo`
    }
    return `$${tier.priceMonthly}/mo`
  }

  function getBillingNote(tier: typeof PRICING_TIERS[0]) {
    if (tier.priceMonthly === 0) return null
    if (billing === 'annual') return `Billed $${tier.priceAnnual}/year · Save ${Math.round((1 - tier.priceAnnual / (tier.priceMonthly * 12)) * 100)}%`
    return '7-day free trial · Cancel anytime'
  }

  async function handleSubscribe() {
    if (selected === 'free') {
      // Free plan — no payment needed
      if (profile) setSubscription('free')
      navigate(profile ? '/dashboard' : '/onboarding/welcome')
      return
    }

    setLoading(true)
    setError(null)

    // Require login before payment
    if (!currentUser()) {
      openSignup()
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selected,
          email: getEmail(),
          annual: billing === 'annual',
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Could not start checkout')
      }

      const { url } = await res.json()

      if (url) {
        // Redirect to Stripe hosted checkout
        window.location.href = url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (err: any) {
      // Stripe not configured yet — activate locally and show setup note
      if (profile) setSubscription(selected)
      setError('Stripe not connected yet — plan activated locally. See setup instructions below.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gabb-500/8 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-4 py-4 max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <GabbLogo size={30} showWordmark />
        <div className="w-16" />
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-white mb-3">
            Unlock Neuroadaptive
            <br />
            <span className="bg-clip-text text-transparent gabb-gradient">Language Learning</span>
          </h1>
          <p className="text-white/50 max-w-xl mx-auto">
            The only app that reads your brain and adapts every lesson in real time.
          </p>

          {/* Perks */}
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            {PERKS.map(p => (
              <div key={p.text} className="flex items-center gap-2 text-sm text-white/60">
                <p.icon size={14} className="text-gabb-400 shrink-0" />
                {p.text}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-8">
          <div className="glass rounded-xl p-1 flex gap-1">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${billing === 'monthly' ? 'bg-gabb-500 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${billing === 'annual' ? 'bg-gabb-500 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
            >
              Annual
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">Save 33%</span>
            </button>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid sm:grid-cols-3 gap-5 mb-8">
          {PRICING_TIERS.map((tier, i) => {
            const isSelected = selected === tier.id
            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setSelected(tier.id)}
                className={`relative glass rounded-2xl p-6 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-gabb-500/60 bg-gabb-500/10 shadow-lg shadow-gabb-500/10'
                    : 'hover:bg-white/8'
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gabb-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    Most Popular
                  </div>
                )}

                {/* Selection indicator */}
                <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-gabb-500 border-gabb-500' : 'border-white/20'}`}>
                  {isSelected && <Check size={11} strokeWidth={3} className="text-white" />}
                </div>

                <h3 className="font-display font-bold text-white text-lg">{tier.name}</h3>

                <p className="mt-3 text-3xl font-bold text-white">
                  {getPrice(tier)}
                </p>
                {getBillingNote(tier) && (
                  <p className="text-xs text-white/40 mt-1">{getBillingNote(tier)}</p>
                )}

                <ul className="mt-5 space-y-2">
                  {tier.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                      <Check size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </div>

        {/* Languages included */}
        <div className="glass rounded-2xl p-5 mb-8">
          <p className="text-sm font-semibold text-white/60 mb-3">Languages available:</p>
          <div className="flex flex-wrap gap-3">
            {LANGUAGES.map(lang => (
              <div key={lang.code} className="flex items-center gap-2 text-sm text-white/70">
                <span className="text-xl">{lang.flag}</span>
                <span>{lang.name}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 text-sm text-white/30">
              <span>+ more coming soon</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-md mx-auto text-center">
          {error && (
            <div className="mb-4 flex items-start gap-2 text-sm text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-left">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <Button
            variant="gradient"
            size="xl"
            fullWidth
            loading={loading}
            onClick={handleSubscribe}
          >
            <CreditCard size={20} />
            {selected === 'free'
              ? 'Start Free'
              : `Subscribe — ${getPrice(PRICING_TIERS.find(t => t.id === selected)!)}`}
          </Button>
          <p className="text-xs text-white/30 mt-3">
            Stripe-secured · 7-day free trial · Cancel anytime
          </p>

          {/* Trust badges */}
          <div className="flex justify-center gap-4 mt-4 text-xs text-white/20">
            <span>🔒 SSL Encrypted</span>
            <span>✓ No hidden fees</span>
            <span>✓ Instant access</span>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 max-w-2xl mx-auto">
          <h2 className="font-display font-bold text-xl text-white text-center mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Do I need a biosensor to use the app?',
                a: 'No! The app works great without one using AI-based performance tracking. A biosensor unlocks the full neuroadaptive experience.',
              },
              {
                q: 'Which biosensors are supported?',
                a: 'Any BLE heart rate monitor (Polar, Garmin, Apple Watch via apps), Muse S/2 EEG headband, and Shimmer3 GSR sensor. Requires Chrome or Edge browser.',
              },
              {
                q: 'Can I switch languages anytime?',
                a: 'Yes. With an All Languages plan, you can switch freely. One Language plan allows you to change your selected language once per billing period.',
              },
              {
                q: 'Is my biometric data private?',
                a: 'Absolutely. All sensor data is processed locally in your browser. It never leaves your device or gets stored on our servers.',
              },
            ].map(faq => (
              <div key={faq.q} className="glass rounded-xl p-4">
                <p className="font-semibold text-sm text-white mb-1">{faq.q}</p>
                <p className="text-sm text-white/50">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="border-t border-white/10 py-6 px-4 text-center text-xs text-white/20 mt-12">
        © 2026 Gabb Global · <a href="https://www.gabbglobal.com" className="hover:text-white/50">gabbglobal.com</a>
      </footer>
    </div>
  )
}
