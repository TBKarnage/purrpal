import type { GrowthStage } from '../types/game'

const PENTATONIC_HZ = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51]

class CozySoundEngine {
  private ctx: AudioContext | null = null
  private enabled = true
  private unlockAttached = false

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  isEnabled(): boolean {
    return this.enabled
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!AudioCtor) return null
      try {
        this.ctx = new AudioCtor()
      } catch {
        return null
      }
    }
    return this.ctx
  }

  unlock(): void {
    const ctx = this.getContext()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {
        // Ignore autoplay policy rejections before gesture
      })
    }
  }

  attachFirstTapUnlock(): () => void {
    if (typeof window === 'undefined' || this.unlockAttached) {
      return () => {}
    }
    this.unlockAttached = true
    const onGesture = () => {
      this.unlock()
    }
    window.addEventListener('pointerdown', onGesture, { passive: true })
    window.addEventListener('touchstart', onGesture, { passive: true })
    return () => {
      window.removeEventListener('pointerdown', onGesture)
      window.removeEventListener('touchstart', onGesture)
      this.unlockAttached = false
    }
  }

  private withReadyContext(fn: (ctx: AudioContext, now: number) => void): void {
    if (!this.enabled) return
    const ctx = this.getContext()
    if (!ctx) return
    try {
      if (ctx.state === 'suspended') {
        void ctx.resume()
      }
      fn(ctx, ctx.currentTime)
    } catch {
      // Never throw audio errors during gameplay
    }
  }

  playButton(): void {
    this.withReadyContext((ctx, now) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(520, now)
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.06)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(0.08, now + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.09)
    })
  }

  playMeow(stage: GrowthStage = 'kitten'): void {
    const pitchMap: Record<GrowthStage, [number, number, number]> = {
      kitten: [860, 1180, 740],
      junior: [660, 900, 560],
      teen: [520, 700, 430],
      adult: [410, 540, 340],
    }
    const [fStart, fPeak, fEnd] = pitchMap[stage]

    this.withReadyContext((ctx, now) => {
      const osc = ctx.createOscillator()
      const filter = ctx.createBiquadFilter()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(fStart, now)
      osc.frequency.exponentialRampToValueAtTime(fPeak, now + 0.09)
      osc.frequency.exponentialRampToValueAtTime(fEnd, now + 0.34)

      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(fPeak * 1.4, now)
      filter.Q.setValueAtTime(1.8, now)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(0.16, now + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.38)
    })
  }

  playPurr(): void {
    this.withReadyContext((ctx, now) => {
      const osc = ctx.createOscillator()
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(52, now)

      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(170, now)

      lfo.type = 'sine'
      lfo.frequency.setValueAtTime(24, now)
      lfoGain.gain.setValueAtTime(0.045, now)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(0.085, now + 0.08)
      gain.gain.setValueAtTime(0.085, now + 0.38)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.56)

      lfo.connect(lfoGain)
      lfoGain.connect(gain.gain)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      lfo.start(now)
      osc.stop(now + 0.58)
      lfo.stop(now + 0.58)
    })
  }

  playCrunch(): void {
    this.withReadyContext((ctx, now) => {
      const bufferSize = Math.floor(ctx.sampleRate * 0.075)
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i += 1) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35))
      }

      [0, 0.14, 0.28].forEach((offset) => {
        const src = ctx.createBufferSource()
        src.buffer = buffer
        const filter = ctx.createBiquadFilter()
        filter.type = 'bandpass'
        filter.frequency.setValueAtTime(1400 + offset * 900, now + offset)
        filter.Q.setValueAtTime(1.4, now + offset)

        const gain = ctx.createGain()
        gain.gain.setValueAtTime(0.14, now + offset)
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.075)

        src.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)
        src.start(now + offset)
      })
    })
  }

  playSweep(): void {
    this.withReadyContext((ctx, now) => {
      const notes = [587.33, 783.99, 1046.5]
      notes.forEach((hz, idx) => {
        const t = now + idx * 0.055
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(hz, t)
        gain.gain.setValueAtTime(0.001, t)
        gain.gain.linearRampToValueAtTime(0.11, t + 0.015)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(t)
        osc.stop(t + 0.18)
      })
    })
  }

  playBrush(): void {
    this.withReadyContext((ctx, now) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(740, now)
      osc.frequency.exponentialRampToValueAtTime(1120, now + 0.14)
      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(0.09, now + 0.025)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.19)
    })
  }

  playPop(comboIndex = 0): void {
    const baseHz = PENTATONIC_HZ[Math.abs(comboIndex) % PENTATONIC_HZ.length]
    this.withReadyContext((ctx, now) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(baseHz * 0.72, now)
      osc.frequency.exponentialRampToValueAtTime(baseHz * 1.45, now + 0.065)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(0.16, now + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.12)
    })
  }

  playCatch(): void {
    this.withReadyContext((ctx, now) => {
      const freqs = [659.25, 987.77]
      freqs.forEach((hz, i) => {
        const t = now + i * 0.06
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(hz, t)
        gain.gain.setValueAtTime(0.001, t)
        gain.gain.linearRampToValueAtTime(0.12, t + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(t)
        osc.stop(t + 0.15)
      })
    })
  }

  playGiggle(): void {
    this.withReadyContext((ctx, now) => {
      const notes = [620, 760, 660, 820]
      notes.forEach((hz, i) => {
        const t = now + i * 0.065
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(hz, t)
        gain.gain.setValueAtTime(0.001, t)
        gain.gain.linearRampToValueAtTime(0.1, t + 0.012)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(t)
        osc.stop(t + 0.08)
      })
    })
  }

  playHeadShake(): void {
    this.withReadyContext((ctx, now) => {
      const notes = [440, 360]
      notes.forEach((hz, i) => {
        const t = now + i * 0.14
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(hz, t)
        osc.frequency.exponentialRampToValueAtTime(hz * 0.88, t + 0.11)
        gain.gain.setValueAtTime(0.001, t)
        gain.gain.linearRampToValueAtTime(0.11, t + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(t)
        osc.stop(t + 0.13)
      })
    })
  }

  playLevelUp(): void {
    this.withReadyContext((ctx, now) => {
      const arpeggio = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.51]
      arpeggio.forEach((hz, idx) => {
        const t = now + idx * 0.085
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(hz, t)

        gain.gain.setValueAtTime(0.001, t)
        gain.gain.linearRampToValueAtTime(0.14, t + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.34)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(t)
        osc.stop(t + 0.36)
      })
    })
  }
}

export const soundEngine = new CozySoundEngine()
