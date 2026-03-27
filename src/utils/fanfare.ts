/**
 * Programmatic fanfare sounds using Web Audio API.
 * No external files — all generated in the browser.
 */

type FanfareType = 'ding' | 'complete' | 'perfect'

export function playFanfare(type: FanfareType = 'complete') {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()

    if (type === 'ding') {
      // Short confirmation ping
      note(ctx, 523.25, 0,    0.12, 0.2)
      note(ctx, 659.25, 0.1, 0.18, 0.2)
    } else if (type === 'complete') {
      // Ta-da! 4-note ascending fanfare
      note(ctx, 392.00, 0,    0.13)
      note(ctx, 523.25, 0.13, 0.13)
      note(ctx, 659.25, 0.26, 0.13)
      note(ctx, 783.99, 0.39, 0.55)
    } else {
      // Perfect lesson — triumphant 8-note trumpet charge
      const seq: [number, number, number][] = [
        [392.00, 0,    0.10],
        [392.00, 0.10, 0.10],
        [523.25, 0.20, 0.10],
        [392.00, 0.30, 0.10],
        [523.25, 0.40, 0.10],
        [659.25, 0.50, 0.10],
        [523.25, 0.60, 0.10],
        [659.25, 0.70, 0.10],
        [783.99, 0.80, 0.75],
      ]
      seq.forEach(([f, t, d]) => note(ctx, f, t, d))
      // Harmony layer
      note(ctx, 523.25, 0.80, 0.75, 0.12)
      note(ctx, 659.25, 0.80, 0.75, 0.08)
    }
  } catch (_) {
    // Audio context may be blocked before first user interaction — silently ignore
  }
}

function note(
  ctx: AudioContext,
  freq: number,
  startOffset: number,
  dur: number,
  vol = 0.28,
) {
  const osc  = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'triangle'
  osc.frequency.value = freq
  const t0 = ctx.currentTime + startOffset
  gain.gain.setValueAtTime(0,   t0)
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.015)
  gain.gain.setValueAtTime(vol * 0.9, t0 + dur - 0.04)
  gain.gain.linearRampToValueAtTime(0,  t0 + dur)
  osc.start(t0)
  osc.stop(t0 + dur + 0.01)
}
