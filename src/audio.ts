// Retro Audio Synthesizer using Web Audio API

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

/**
 * Synthesizes a retro mechanical ticking sound
 */
export function playTick() {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    // Create oscillator and gain node
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    // Quick pitch decay for a woodblock / mechanical tick sound
    osc.frequency.setValueAtTime(150, now)
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.04)

    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.05)
  } catch (error) {
    console.warn('Failed to play tick sound:', error)
  }
}

/**
 * Synthesizes a retro 8-bit style success chime
 */
export function playSuccessChime() {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    // Notes of a happy retro arpeggio: C5 (523.25 Hz), E5 (659.25 Hz), G5 (783.99 Hz), C6 (1046.50 Hz)
    const notes = [523.25, 659.25, 783.99, 1046.50]
    const noteDuration = 0.12
    const gap = 0.02

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      // Square wave for the 8-bit retro vibe, or triangle for a softer sound
      osc.type = 'square'
      osc.frequency.setValueAtTime(freq, now + index * (noteDuration + gap))

      const noteStart = now + index * (noteDuration + gap)
      const noteEnd = noteStart + noteDuration

      // Volume envelope to avoid pops
      gain.gain.setValueAtTime(0, noteStart)
      gain.gain.linearRampToValueAtTime(0.08, noteStart + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, noteEnd)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(noteStart)
      osc.stop(noteEnd + 0.05)
    })
  } catch (error) {
    console.warn('Failed to play success chime:', error)
  }
}
