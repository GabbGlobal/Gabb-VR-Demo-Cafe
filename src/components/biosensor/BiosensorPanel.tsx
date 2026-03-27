import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bluetooth, BluetoothConnected, BluetoothOff, Brain, Heart, Zap, ChevronDown } from 'lucide-react'
import { useBiosensor } from '../../hooks/useBiosensor'
import { useBiosensorStore } from '../../store/biosensorStore'
import { cognitiveStateBg, cognitiveStateLabel, cognitiveStateColor } from '../../utils/neuroadaptive'
import { Button } from '../ui/Button'
import type { BiosensorType } from '../../types'

const SENSOR_INFO: Record<BiosensorType, { label: string; icon: typeof Heart; description: string; metric: string }> = {
  hrm: {
    label: 'Heart Rate Monitor',
    icon: Heart,
    description: 'Any BLE heart rate monitor (Polar, Garmin, Wahoo, Apple Watch)',
    metric: 'HR + HRV',
  },
  muse: {
    label: 'Muse EEG Headband',
    icon: Brain,
    description: 'Muse S or Muse 2 — tracks alpha, beta, theta brain waves',
    metric: 'Focus waves',
  },
  emotiv: {
    label: 'Emotiv Headset',
    icon: Brain,
    description: 'Emotiv EPOC/Insight — cognitive workload & engagement',
    metric: 'Workload',
  },
  shimmer: {
    label: 'Shimmer GSR Sensor',
    icon: Zap,
    description: 'Shimmer3 GSR+ — galvanic skin response / arousal',
    metric: 'Arousal (GSR)',
  },
}

export default function BiosensorPanel() {
  const [open, setOpen] = useState(false)
  const [connecting, setConnecting] = useState<BiosensorType | null>(null)
  const { connectDevice, isSupported } = useBiosensor()
  const devices = useBiosensorStore(s => s.devices)
  const adaptiveState = useBiosensorStore(s => s.adaptiveState)
  const latestReading = useBiosensorStore(s => s.latestReading)

  const connectedCount = devices.filter(d => d.status === 'connected').length

  async function handleConnect(type: BiosensorType) {
    setConnecting(type)
    try {
      await connectDevice(type)
    } catch (err: any) {
      alert(err.message ?? 'Could not connect. Make sure the sensor is powered on and in range.')
    } finally {
      setConnecting(null)
    }
  }

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${connectedCount > 0 ? 'bg-emerald-500/20' : 'bg-white/10'}`}>
            {connectedCount > 0 ? <BluetoothConnected size={16} className="text-emerald-400" /> : <Bluetooth size={16} className="text-white/50" />}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">
              {connectedCount > 0 ? `${connectedCount} Sensor${connectedCount > 1 ? 's' : ''} Connected` : 'Connect Biosensors'}
            </p>
            {connectedCount > 0 && (
              <p className={`text-xs ${cognitiveStateColor(adaptiveState.cognitiveState)}`}>
                {cognitiveStateLabel(adaptiveState.cognitiveState)}
              </p>
            )}
            {connectedCount === 0 && (
              <p className="text-xs text-white/40">Neuroadaptive lessons require a sensor</p>
            )}
          </div>
        </div>
        <ChevronDown size={16} className={`text-white/50 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-4">
              {/* Live readings */}
              {connectedCount > 0 && latestReading && (
                <div className={`flex flex-wrap gap-3 p-3 rounded-xl border ${cognitiveStateBg(adaptiveState.cognitiveState)}`}>
                  {latestReading.heartRate && (
                    <Metric icon="❤️" label="HR" value={`${latestReading.heartRate} bpm`} />
                  )}
                  {latestReading.hrv && (
                    <Metric icon="📊" label="HRV" value={`${Math.round(latestReading.hrv)} ms`} />
                  )}
                  {latestReading.eegBeta !== undefined && (
                    <Metric icon="🧠" label="Focus" value={`${Math.round(adaptiveState.focusScore * 100)}%`} />
                  )}
                  {latestReading.gsr !== undefined && (
                    <Metric icon="⚡" label="Arousal" value={`${Math.round(adaptiveState.engagementScore * 100)}%`} />
                  )}
                </div>
              )}

              {/* Device list */}
              {!isSupported && (
                <p className="text-xs text-amber-400 p-3 bg-amber-500/10 rounded-xl">
                  Web Bluetooth requires Chrome or Edge on desktop. Safari and Firefox are not supported.
                </p>
              )}

              {(Object.entries(SENSOR_INFO) as [BiosensorType, typeof SENSOR_INFO[BiosensorType]][]).map(([type, info]) => {
                const device = devices.find(d => d.type === type)
                const Icon = info.icon
                const isConnected = device?.status === 'connected'
                const isConnecting = connecting === type || device?.status === 'connecting'

                return (
                  <div key={type} className="flex items-center justify-between gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon size={16} className={isConnected ? 'text-emerald-400' : 'text-white/40'} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{info.label}</p>
                        <p className="text-xs text-white/40 truncate">{isConnected ? `Connected · ${info.metric}` : info.description}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={isConnected ? 'secondary' : 'primary'}
                      disabled={!isSupported || isConnecting}
                      loading={isConnecting}
                      onClick={() => handleConnect(type)}
                      className="shrink-0"
                    >
                      {isConnected ? 'Connected' : 'Connect'}
                    </Button>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Metric({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span>{icon}</span>
      <span className="text-white/50">{label}:</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}
