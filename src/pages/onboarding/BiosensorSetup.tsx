import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, Heart, Zap, ChevronRight, SkipForward } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { StepDots, useOnboardingState } from './Welcome'
import { useBiosensor } from '../../hooks/useBiosensor'
import { useBiosensorStore } from '../../store/biosensorStore'
import { useUserStore } from '../../store/userStore'
import type { BiosensorType, UserProfile, LanguageCode, VocabCategory, Gender, Orientation } from '../../types'

const SENSORS: { type: BiosensorType; icon: typeof Heart; label: string; tagline: string; badge: string }[] = [
  { type: 'hrm',     icon: Heart,  label: 'Heart Rate Monitor', tagline: 'Adapts via HRV stress detection', badge: 'Most Compatible' },
  { type: 'muse',    icon: Brain,  label: 'Muse EEG Headband',  tagline: 'Adapts via brainwave focus tracking', badge: 'Best Results' },
  { type: 'shimmer', icon: Zap,    label: 'Shimmer GSR Sensor', tagline: 'Adapts via arousal & engagement', badge: 'Advanced' },
]

export default function BiosensorSetupPage() {
  const navigate = useNavigate()
  const { load } = useOnboardingState()
  const { connectDevice, isSupported } = useBiosensor()
  const devices = useBiosensorStore(s => s.devices)
  const { setProfile } = useUserStore()

  async function handleConnect(type: BiosensorType) {
    try {
      await connectDevice(type)
    } catch (err: any) {
      alert(err.message ?? 'Connection failed. Make sure the device is on and nearby.')
    }
  }

  function finishOnboarding() {
    const data = load()
    const languages = (data.languages ?? ['it']) as LanguageCode[]
    const profile: UserProfile = {
      id: crypto.randomUUID(),
      name: data.name ?? 'Learner',
      email: data.email ?? '',
      gender: (data.gender ?? 'prefer-not') as Gender,
      orientation: (data.orientation ?? 'prefer-not') as Orientation,
      interests: (data.interests ?? ['essentials']) as VocabCategory[],
      selectedLanguages: languages,
      activeLanguage: languages[0],
      subscription: 'free',
      createdAt: new Date().toISOString(),
    }
    setProfile(profile)
    navigate('/dashboard')
  }

  const connectedCount = devices.filter(d => d.status === 'connected').length

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-gabb-500/8 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gabb-500/20 items-center justify-center mb-4">
            <Brain size={28} className="text-gabb-400" />
          </div>
          <h2 className="font-display text-3xl font-bold text-white">Connect a Biosensor</h2>
          <p className="text-white/50 mt-2">
            For neuroadaptive lessons. Completely optional — you can skip and connect later.
          </p>
        </div>

        <StepDots current={4} total={5} />

        {!isSupported && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-400">
            ⚠️ Web Bluetooth requires Chrome or Edge (desktop). Your browser doesn't support it. You can still use the app without a sensor.
          </motion.div>
        )}

        <div className="space-y-3 mt-6">
          {SENSORS.map((sensor, i) => {
            const Icon = sensor.icon
            const device = devices.find(d => d.type === sensor.type)
            const isConnected = device?.status === 'connected'
            const isConnecting = device?.status === 'connecting'

            return (
              <motion.div
                key={sensor.type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`glass rounded-xl p-4 flex items-center justify-between gap-3 ${isConnected ? 'border-emerald-500/40 bg-emerald-500/5' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isConnected ? 'bg-emerald-500/20' : 'bg-white/10'}`}>
                    <Icon size={20} className={isConnected ? 'text-emerald-400' : 'text-white/50'} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{sensor.label}</p>
                      <span className="text-[10px] bg-gabb-500/20 text-gabb-300 px-1.5 py-0.5 rounded-full">{sensor.badge}</span>
                    </div>
                    <p className="text-xs text-white/40">{isConnected ? '✓ Connected' : sensor.tagline}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={isConnected ? 'secondary' : 'primary'}
                  disabled={!isSupported || isConnecting}
                  loading={isConnecting}
                  onClick={() => !isConnected && handleConnect(sensor.type)}
                >
                  {isConnected ? 'Done' : 'Connect'}
                </Button>
              </motion.div>
            )
          })}
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="ghost" size="lg" onClick={() => navigate('/onboarding/personalize')} className="gap-1">
            Back
          </Button>
          <Button variant="gradient" fullWidth size="lg" onClick={finishOnboarding}>
            {connectedCount > 0 ? (
              <><Brain size={18} /> Start Learning</>
            ) : (
              <><SkipForward size={18} /> Skip & Start</>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
