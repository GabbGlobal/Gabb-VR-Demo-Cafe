import { create } from 'zustand'
import type { BiosensorDevice, BiosensorReading, BiosensorStatus, BiosensorType } from '../types'
import { computeAdaptiveState } from '../utils/neuroadaptive'
import type { AdaptiveState } from '../types'

interface BiosensorState {
  devices: BiosensorDevice[]
  latestReading: BiosensorReading | null
  adaptiveState: AdaptiveState
  recentAccuracy: number
  recentResponseTimeMs: number

  // actions
  addDevice: (device: BiosensorDevice) => void
  updateDeviceStatus: (type: BiosensorType, status: BiosensorStatus) => void
  pushReading: (reading: BiosensorReading) => void
  updatePerformance: (correct: boolean, responseTimeMs: number) => void
  disconnectAll: () => void
}

const defaultAdaptive: AdaptiveState = {
  cognitiveState: 'baseline',
  focusScore: 0.5,
  stressScore: 0.3,
  engagementScore: 0.5,
  recommendedDifficulty: 2,
  recommendedPace: 'normal',
  suggestBreak: false,
  lastUpdated: Date.now(),
}

export const useBiosensorStore = create<BiosensorState>((set, get) => ({
  devices: [],
  latestReading: null,
  adaptiveState: defaultAdaptive,
  recentAccuracy: 0.75,
  recentResponseTimeMs: 4000,

  addDevice: (device) =>
    set((s) => ({
      devices: [...s.devices.filter(d => d.type !== device.type), device],
    })),

  updateDeviceStatus: (type, status) =>
    set((s) => ({
      devices: s.devices.map(d => d.type === type ? { ...d, status } : d),
    })),

  pushReading: (reading) => {
    set({ latestReading: reading })
    const { recentAccuracy, recentResponseTimeMs } = get()
    const adaptive = computeAdaptiveState({ reading, recentAccuracy, recentResponseTimeMs })
    set({ adaptiveState: adaptive })
  },

  updatePerformance: (correct, responseTimeMs) => {
    set((s) => {
      const recentAccuracy = s.recentAccuracy * 0.9 + (correct ? 1 : 0) * 0.1
      const recentResponseTimeMs = s.recentResponseTimeMs * 0.85 + responseTimeMs * 0.15
      const adaptive = computeAdaptiveState({
        reading: s.latestReading,
        recentAccuracy,
        recentResponseTimeMs,
      })
      return { recentAccuracy, recentResponseTimeMs, adaptiveState: adaptive }
    })
  },

  disconnectAll: () =>
    set((s) => ({
      devices: s.devices.map(d => ({ ...d, status: 'disconnected' as BiosensorStatus })),
    })),
}))
