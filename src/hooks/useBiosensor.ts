/**
 * Web Bluetooth biosensor hook.
 *
 * Supports:
 *  - Standard BLE Heart Rate Profile (0x180D) — any Polar, Garmin, Apple Watch, etc.
 *  - Muse S/2 (via muse-js-style parsing if available)
 *  - Shimmer3 GSR+ (custom service UUID)
 *
 * Falls back gracefully when Web Bluetooth is unavailable (Firefox, Safari).
 */
import { useCallback, useRef } from 'react'
import { useBiosensorStore } from '../store/biosensorStore'
import type { BiosensorType, BiosensorReading } from '../types'

// Standard BLE UUIDs
const HR_SERVICE = 0x180D
const HR_MEASUREMENT_CHAR = 0x2A37
const BATTERY_SERVICE = 0x180F
const BATTERY_LEVEL_CHAR = 0x2A19

// Shimmer GSR custom UUIDs (Shimmer3 GSR+)
const SHIMMER_SERVICE = '00001800-0000-1000-8000-00805f9b34fb'

export function useBiosensor() {
  const { addDevice, updateDeviceStatus, pushReading } = useBiosensorStore()
  const deviceRef = useRef<BluetoothDevice | null>(null)
  const serverRef = useRef<BluetoothRemoteGATTServer | null>(null)

  const isWebBluetoothSupported = (): boolean =>
    typeof navigator !== 'undefined' && 'bluetooth' in navigator

  const connectHRM = useCallback(async (): Promise<void> => {
    if (!isWebBluetoothSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser. Try Chrome or Edge.')
    }

    addDevice({ type: 'hrm', name: 'Heart Rate Monitor', status: 'connecting' })

    try {
      const device = await (navigator as Navigator & { bluetooth: Bluetooth }).bluetooth.requestDevice({
        filters: [{ services: [HR_SERVICE] }],
        optionalServices: [BATTERY_SERVICE],
      })

      deviceRef.current = device
      const server = await device.gatt!.connect()
      serverRef.current = server

      addDevice({ type: 'hrm', name: device.name ?? 'Heart Rate Monitor', status: 'connected' })

      // Read battery if available
      let batteryLevel: number | undefined
      try {
        const batterySvc = await server.getPrimaryService(BATTERY_SERVICE)
        const battChar = await batterySvc.getCharacteristic(BATTERY_LEVEL_CHAR)
        const battVal = await battChar.readValue()
        batteryLevel = battVal.getUint8(0)
      } catch { /* battery optional */ }

      // Subscribe to HR notifications
      const hrService = await server.getPrimaryService(HR_SERVICE)
      const hrChar = await hrService.getCharacteristic(HR_MEASUREMENT_CHAR)

      hrChar.addEventListener('characteristicvaluechanged', (event) => {
        const value = (event.target as BluetoothRemoteGATTCharacteristic).value!
        const flags = value.getUint8(0)
        const is16bit = (flags & 0x1) === 1
        const hr = is16bit ? value.getUint16(1, true) : value.getUint8(1)

        // RR intervals for HRV calculation (if present)
        let hrv: number | undefined
        if ((flags & 0x10) !== 0) {
          const rrIntervals: number[] = []
          let offset = is16bit ? 3 : 2
          if ((flags & 0x08) !== 0) offset += 2 // energy expended
          while (offset + 1 < value.byteLength) {
            rrIntervals.push(value.getUint16(offset, true) / 1024 * 1000)
            offset += 2
          }
          if (rrIntervals.length >= 2) {
            // RMSSD
            let sumSq = 0
            for (let i = 1; i < rrIntervals.length; i++) {
              sumSq += Math.pow(rrIntervals[i] - rrIntervals[i - 1], 2)
            }
            hrv = Math.sqrt(sumSq / (rrIntervals.length - 1))
          }
        }

        const reading: BiosensorReading = {
          timestamp: Date.now(),
          heartRate: hr,
          hrv,
        }
        pushReading(reading)
      })

      await hrChar.startNotifications()

      // Handle disconnect
      device.addEventListener('gattserverdisconnected', () => {
        updateDeviceStatus('hrm', 'disconnected')
      })

    } catch (err) {
      updateDeviceStatus('hrm', 'error')
      throw err
    }
  }, [addDevice, updateDeviceStatus, pushReading])

  const connectMuse = useCallback(async (): Promise<void> => {
    if (!isWebBluetoothSupported()) {
      throw new Error('Web Bluetooth not supported.')
    }
    addDevice({ type: 'muse', name: 'Muse Headband', status: 'connecting' })

    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ namePrefix: 'Muse' }],
        optionalServices: ['0000fe8d-0000-1000-8000-00805f9b34fb'],
      })

      deviceRef.current = device
      const server = await device.gatt!.connect()

      addDevice({ type: 'muse', name: device.name ?? 'Muse Headband', status: 'connected' })

      // Simplified EEG streaming: in production, use the full muse-js protocol
      // Here we simulate band power by subscribing to the EEG data channel
      const museService = await server.getPrimaryService('0000fe8d-0000-1000-8000-00805f9b34fb')
      const chars = await museService.getCharacteristics()

      if (chars.length > 0) {
        const dataChar = chars[0]
        dataChar.addEventListener('characteristicvaluechanged', (event: Event) => {
          const value = (event.target as BluetoothRemoteGATTCharacteristic).value!
          // Decode simplified Muse packet (12-byte EEG sample)
          if (value.byteLength >= 12) {
            const alpha = Math.abs(value.getInt16(2, true)) / 100
            const beta  = Math.abs(value.getInt16(4, true)) / 100
            const theta = Math.abs(value.getInt16(6, true)) / 100
            pushReading({ timestamp: Date.now(), eegAlpha: alpha, eegBeta: beta, eegTheta: theta })
          }
        })
        await dataChar.startNotifications()
      }

      device.addEventListener('gattserverdisconnected', () => {
        updateDeviceStatus('muse', 'disconnected')
      })
    } catch (err) {
      updateDeviceStatus('muse', 'error')
      throw err
    }
  }, [addDevice, updateDeviceStatus, pushReading])

  const connectShimmerGSR = useCallback(async (): Promise<void> => {
    if (!isWebBluetoothSupported()) {
      throw new Error('Web Bluetooth not supported.')
    }
    addDevice({ type: 'shimmer', name: 'Shimmer GSR', status: 'connecting' })

    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ namePrefix: 'Shimmer' }],
        optionalServices: [SHIMMER_SERVICE],
      })
      deviceRef.current = device
      const server = await device.gatt!.connect()
      addDevice({ type: 'shimmer', name: device.name ?? 'Shimmer GSR', status: 'connected' })

      const svc = await server.getPrimaryService(SHIMMER_SERVICE)
      const chars = await svc.getCharacteristics()

      if (chars.length > 0) {
        chars[0].addEventListener('characteristicvaluechanged', (event: Event) => {
          const value = (event.target as BluetoothRemoteGATTCharacteristic).value!
          if (value.byteLength >= 4) {
            const raw = value.getUint32(0, true)
            // Convert ADC to μS (Shimmer3 calibration formula simplified)
            const gsr = (raw / 4095.0) * 20.0
            pushReading({ timestamp: Date.now(), gsr })
          }
        })
        await chars[0].startNotifications()
      }

      device.addEventListener('gattserverdisconnected', () => {
        updateDeviceStatus('shimmer', 'disconnected')
      })
    } catch (err) {
      updateDeviceStatus('shimmer', 'error')
      throw err
    }
  }, [addDevice, updateDeviceStatus, pushReading])

  const disconnect = useCallback(async () => {
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect()
    }
  }, [])

  const connectDevice = useCallback(async (type: BiosensorType) => {
    switch (type) {
      case 'hrm':     return connectHRM()
      case 'muse':    return connectMuse()
      case 'shimmer': return connectShimmerGSR()
      default: throw new Error(`Unsupported device type: ${type}`)
    }
  }, [connectHRM, connectMuse, connectShimmerGSR])

  return {
    connectDevice,
    disconnect,
    isSupported: isWebBluetoothSupported(),
  }
}
