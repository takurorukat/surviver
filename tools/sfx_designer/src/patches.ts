/**
 * Tone.Offline 内で各 SE をスケジュールするパッチ集。
 * プリセットの設計値を読み、音色差で属性を聞き分ける。
 */

import type { SfxPreset } from '../presets.ts'

// Tone は generate 側で動的 import したものを渡す
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToneNs = any

export function schedulePreset(Tone: ToneNs, preset: SfxPreset): number {
  switch (preset.patch) {
    case 'power_fire':
      return schedulePower(Tone, preset, 'fire')
    case 'power_hit':
      return schedulePower(Tone, preset, 'hit')
    case 'wind_fire':
      return scheduleWind(Tone, preset, 'fire')
    case 'wind_hit':
      return scheduleWind(Tone, preset, 'hit')
    case 'water_fire':
      return scheduleWater(Tone, preset, 'fire')
    case 'water_hit':
      return scheduleWater(Tone, preset, 'hit')
    case 'fire_fire':
      return scheduleFireElement(Tone, preset, 'fire')
    case 'fire_hit':
      return scheduleFireElement(Tone, preset, 'hit')
    case 'earth_fire':
      return scheduleEarth(Tone, preset, 'fire')
    case 'earth_hit':
      return scheduleEarth(Tone, preset, 'hit')
    case 'enemy_defeat':
      return scheduleEnemyDefeat(Tone, preset)
    case 'enemy_hit':
      return scheduleEnemyHit(Tone, preset)
    case 'enemy_blocked':
      return scheduleEnemyBlocked(Tone, preset)
    case 'coin_pickup':
      return scheduleCoinPickup(Tone, preset)
    case 'player_hurt':
      return schedulePlayerHurt(Tone, preset)
    case 'menu_move':
      return scheduleMenuMove(Tone, preset)
    case 'menu_cancel':
      return scheduleMenuCancel(Tone, preset)
    case 'shop_purchase':
      return scheduleShopPurchase(Tone, preset)
    case 'level_up':
      return scheduleLevelUp(Tone, preset)
    case 'stage_clear':
      return scheduleStageClear(Tone, preset)
    case 'area_clear':
      return scheduleAreaClear(Tone, preset)
    case 'game_over':
      return scheduleGameOver(Tone, preset)
    default:
      throw new Error(`未知の patch: ${preset.patch}`)
  }
}

function schedulePower(Tone: ToneNs, p: SfxPreset, kind: 'fire' | 'hit'): number {
  const filter = new Tone.Filter({
    type: 'lowpass',
    frequency: p.filterHz,
    Q: p.filterQ,
  }).toDestination()

  // FM 風: キャリア + 短いモジュレータ
  const car = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: {
      attack: p.attack,
      decay: kind === 'fire' ? 0.07 : 0.05,
      sustain: 0,
      release: p.release,
    },
  }).connect(new Tone.Gain(p.gain).connect(filter))

  const mod = new Tone.Oscillator({ type: 'sine', frequency: p.pitchHz * 1.5 })
  const modGain = new Tone.Gain(p.pitchHz * 0.35)
  mod.connect(modGain)
  modGain.connect(car.frequency)
  mod.start(0)
  mod.stop(kind === 'fire' ? 0.08 : 0.055)

  const air = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: {
      attack: 0.004,
      decay: kind === 'fire' ? 0.035 : 0.02,
      sustain: 0,
      release: 0.01,
    },
  }).connect(
    new Tone.Filter({ type: 'bandpass', frequency: 2400, Q: 1.2 }).connect(
      new Tone.Gain(p.noiseAmount).connect(filter),
    ),
  )

  const t0 = 0
  const noteLen = kind === 'fire' ? 0.08 : 0.055
  car.triggerAttackRelease(p.pitchHz, noteLen, t0, 0.55)
  car.frequency.setValueAtTime(p.pitchHz, t0)
  car.frequency.exponentialRampToValueAtTime(
    p.pitchHz * 0.58,
    t0 + (kind === 'fire' ? 0.07 : 0.05),
  )
  air.triggerAttackRelease(kind === 'fire' ? 0.04 : 0.025, t0, 0.35)
  return p.durationTarget
}

function scheduleWind(Tone: ToneNs, p: SfxPreset, kind: 'fire' | 'hit'): number {
  const dest = new Tone.Gain(1).toDestination()
  const band = new Tone.Filter({
    type: 'bandpass',
    frequency: p.filterHz,
    Q: p.filterQ,
  }).connect(dest)

  const hp = new Tone.Filter({ type: 'highpass', frequency: 900, Q: 0.7 }).connect(band)

  const whoosh = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: {
      attack: p.attack,
      decay: kind === 'fire' ? 0.075 : 0.045,
      sustain: 0,
      release: p.release,
    },
  }).connect(new Tone.Gain(p.gain * p.noiseAmount).connect(hp))

  band.frequency.setValueAtTime(kind === 'fire' ? 1800 : 2600, 0)
  band.frequency.exponentialRampToValueAtTime(
    kind === 'fire' ? 4200 : 5000,
    kind === 'fire' ? 0.03 : 0.012,
  )
  band.frequency.exponentialRampToValueAtTime(900, kind === 'fire' ? 0.09 : 0.055)

  const thin = new Tone.Oscillator({ type: 'sine', frequency: p.pitchHz }).connect(
    new Tone.Gain(0.04).connect(dest),
  )
  thin.start(0)
  thin.frequency.exponentialRampToValueAtTime(700, kind === 'fire' ? 0.06 : 0.04)
  thin.stop(kind === 'fire' ? 0.07 : 0.045)

  whoosh.triggerAttackRelease(kind === 'fire' ? 0.085 : 0.07, 0, 0.75)
  return kind === 'fire' ? p.durationTarget : Math.max(p.durationTarget, 0.065)
}

function scheduleWater(Tone: ToneNs, p: SfxPreset, kind: 'fire' | 'hit'): number {
  const dest = new Tone.Gain(1).toDestination()
  const dripFilter = new Tone.Filter({
    type: 'lowpass',
    frequency: p.filterHz,
    Q: p.filterQ,
  }).connect(dest)

  const dropA = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: {
      attack: p.attack,
      decay: kind === 'fire' ? 0.07 : 0.05,
      sustain: 0,
      release: p.release,
    },
  }).connect(new Tone.Gain(p.gain * p.resonance).connect(dripFilter))

  const dropB = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: {
      attack: kind === 'hit' ? 0.002 : 0.008,
      decay: kind === 'fire' ? 0.06 : 0.045,
      sustain: 0,
      release: p.release,
    },
  }).connect(new Tone.Gain(p.gain * 0.7 * p.resonance).connect(dripFilter))

  const soft = new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: {
      attack: kind === 'hit' ? 0.001 : 0.01,
      decay: kind === 'fire' ? 0.04 : 0.03,
      sustain: 0,
      release: 0.01,
    },
  }).connect(
    new Tone.Filter({ type: 'lowpass', frequency: 1400, Q: 0.5 }).connect(
      new Tone.Gain(p.noiseAmount).connect(dest),
    ),
  )

  const t0 = 0
  dropA.triggerAttackRelease(p.pitchHz, kind === 'fire' ? 0.08 : 0.055, t0, kind === 'hit' ? 0.7 : 0.55)
  dropA.frequency.setValueAtTime(p.pitchHz, t0)
  dropA.frequency.exponentialRampToValueAtTime(p.pitchHz * 0.82, t0 + (kind === 'fire' ? 0.07 : 0.05))

  const t1 = kind === 'hit' ? 0.006 : 0.012
  const pitchB = p.pitchHz * 1.17
  dropB.triggerAttackRelease(pitchB, kind === 'fire' ? 0.07 : 0.05, t1, kind === 'hit' ? 0.55 : 0.4)
  dropB.frequency.setValueAtTime(pitchB, t1)
  dropB.frequency.exponentialRampToValueAtTime(pitchB * 0.81, t1 + (kind === 'fire' ? 0.06 : 0.045))

  soft.triggerAttackRelease(kind === 'fire' ? 0.05 : 0.035, t0, 0.4)
  return p.durationTarget
}

function scheduleFireElement(Tone: ToneNs, p: SfxPreset, kind: 'fire' | 'hit'): number {
  const dest = new Tone.Gain(1).toDestination()
  const bodyFilter = new Tone.Filter({
    type: 'bandpass',
    frequency: p.filterHz,
    Q: p.filterQ,
  }).connect(dest)

  const lfo = new Tone.LFO({
    frequency: kind === 'fire' ? 18 : 28,
    min: 650,
    max: kind === 'fire' ? 1400 : 1800,
    type: 'sine',
  }).start(0)
  lfo.connect(bodyFilter.frequency)

  let bodyOut: unknown = new Tone.Gain(0.55 * p.gain).connect(bodyFilter)
  if (p.distortion > 0) {
    const dist = new Tone.Distortion(p.distortion)
    dist.connect(bodyOut as object)
    bodyOut = dist
  }

  const roar = new Tone.NoiseSynth({
    noise: { type: 'brown' },
    envelope: {
      attack: p.attack,
      decay: kind === 'fire' ? 0.08 : 0.05,
      sustain: 0,
      release: p.release,
    },
  }).connect(bodyOut)

  const mid = new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: {
      attack: kind === 'fire' ? 0.008 : 0.001,
      decay: kind === 'fire' ? 0.06 : 0.04,
      sustain: 0,
      release: 0.015,
    },
  }).connect(
    new Tone.Filter({ type: 'bandpass', frequency: 1200, Q: 1.1 }).connect(
      new Tone.Gain(0.35 * p.noiseAmount).connect(dest),
    ),
  )

  const crackleTimes =
    kind === 'hit' ? [0.0, 0.015, 0.03, 0.045, 0.055] : [0.01, 0.025, 0.038, 0.052]
  for (const ct of crackleTimes) {
    const spark = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.014, sustain: 0, release: 0.006 },
    }).connect(
      new Tone.Filter({ type: 'highpass', frequency: 1800, Q: 0.7 }).connect(
        new Tone.Gain((kind === 'hit' ? 0.22 : 0.14) * p.variation).connect(dest),
      ),
    )
    spark.triggerAttackRelease(0.018, ct, 0.5)
  }

  const hint = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 0.05, sustain: 0, release: 0.015 },
  }).connect(new Tone.Gain(0.12).connect(dest))
  hint.triggerAttackRelease(p.pitchHz, kind === 'hit' ? 0.07 : 0.05, 0, 0.35)
  hint.frequency.exponentialRampToValueAtTime(p.pitchHz * 0.68, kind === 'hit' ? 0.07 : 0.05)

  roar.triggerAttackRelease(kind === 'fire' ? 0.09 : 0.08, 0, 0.7)
  mid.triggerAttackRelease(kind === 'fire' ? 0.08 : 0.07, 0, 0.55)
  return kind === 'fire' ? Math.max(p.durationTarget, 0.085) : Math.max(p.durationTarget, 0.075)
}

function scheduleEarth(Tone: ToneNs, p: SfxPreset, kind: 'fire' | 'hit'): number {
  const dest = new Tone.Gain(1).toDestination()
  const grainFilter = new Tone.Filter({
    type: 'bandpass',
    frequency: p.filterHz,
    Q: p.filterQ,
  }).connect(dest)

  const grains = new Tone.NoiseSynth({
    noise: { type: 'brown' },
    envelope: {
      attack: p.attack,
      decay: kind === 'fire' ? 0.09 : 0.085,
      sustain: 0,
      release: 0.03,
    },
  }).connect(new Tone.Gain(p.gain * p.noiseAmount).connect(grainFilter))

  const trem = new Tone.Tremolo({
    frequency: kind === 'fire' ? 55 : 70,
    depth: 0.7,
    type: 'square',
    spread: 0,
  })
    .connect(new Tone.Gain(0.45).connect(dest))
    .start(0)

  const grainLayer = new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: {
      attack: kind === 'hit' ? 0.001 : 0.008,
      decay: kind === 'fire' ? 0.085 : 0.08,
      sustain: 0,
      release: 0.025,
    },
  }).connect(
    new Tone.Filter({ type: 'bandpass', frequency: 1100, Q: 1.4 }).connect(trem),
  )

  const stone = new Tone.MembraneSynth({
    pitchDecay: 0.025,
    octaves: 1.2,
    oscillator: { type: 'sine' },
    envelope: {
      attack: kind === 'hit' ? 0.001 : 0.005,
      decay: kind === 'fire' ? 0.08 : 0.1,
      sustain: 0,
      release: 0.03,
    },
  }).connect(new Tone.Gain((kind === 'hit' ? 0.35 : 0.22) * p.resonance).connect(dest))

  grains.triggerAttackRelease(kind === 'fire' ? 0.1 : 0.095, 0, 0.65)
  grainLayer.triggerAttackRelease(kind === 'fire' ? 0.095 : 0.09, 0, 0.5)
  stone.triggerAttackRelease(
    p.pitchHz,
    kind === 'fire' ? 0.09 : 0.11,
    0,
    kind === 'hit' ? 0.55 : 0.4,
  )
  return kind === 'fire' ? Math.max(p.durationTarget, 0.09) : Math.max(p.durationTarget, 0.1)
}

function scheduleEnemyDefeat(Tone: ToneNs, p: SfxPreset): number {
  const dest = new Tone.Gain(1).toDestination()
  const lp = new Tone.Filter({ type: 'lowpass', frequency: p.filterHz, Q: p.filterQ }).connect(dest)

  const puff = new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: p.attack, decay: 0.07, sustain: 0, release: p.release },
  }).connect(new Tone.Gain(p.gain * p.noiseAmount).connect(lp))

  const blip = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.002, decay: 0.06, sustain: 0, release: 0.02 },
  }).connect(new Tone.Gain(p.gain * 0.7).connect(lp))

  puff.triggerAttackRelease(0.08, 0, 0.7)
  blip.triggerAttackRelease(p.pitchHz, 0.07, 0, 0.5)
  blip.frequency.setValueAtTime(p.pitchHz, 0)
  blip.frequency.exponentialRampToValueAtTime(p.pitchHz * 0.55, 0.07)
  return p.durationTarget
}

function scheduleEnemyHit(Tone: ToneNs, p: SfxPreset): number {
  const dest = new Tone.Gain(1).toDestination()
  const bp = new Tone.Filter({ type: 'bandpass', frequency: p.filterHz, Q: p.filterQ }).connect(dest)

  const tick = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: p.attack, decay: 0.035, sustain: 0, release: p.release },
  }).connect(new Tone.Gain(p.gain * p.noiseAmount).connect(bp))

  const thump = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.015 },
  }).connect(new Tone.Gain(p.gain * 0.55).connect(dest))

  tick.triggerAttackRelease(0.04, 0, 0.8)
  thump.triggerAttackRelease(p.pitchHz, 0.045, 0, 0.45)
  return p.durationTarget
}

function scheduleEnemyBlocked(Tone: ToneNs, p: SfxPreset): number {
  const dest = new Tone.Gain(1).toDestination()
  const bp = new Tone.Filter({ type: 'bandpass', frequency: p.filterHz, Q: p.filterQ }).connect(dest)

  const clack = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: p.attack, decay: 0.075, sustain: 0, release: 0.04 },
  }).connect(new Tone.Gain(p.gain * p.noiseAmount).connect(bp))

  const hard = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.035 },
  }).connect(
    new Tone.Filter({ type: 'lowpass', frequency: 2800, Q: 0.8 }).connect(
      new Tone.Gain(p.gain * 0.35 * p.resonance).connect(dest),
    ),
  )

  clack.triggerAttackRelease(0.095, 0, 0.75)
  hard.triggerAttackRelease(p.pitchHz, 0.09, 0, 0.4)
  hard.frequency.exponentialRampToValueAtTime(p.pitchHz * 0.7, 0.085)
  return Math.max(p.durationTarget, 0.09)
}

function scheduleCoinPickup(Tone: ToneNs, p: SfxPreset): number {
  const dest = new Tone.Gain(1).toDestination()
  const lp = new Tone.Filter({ type: 'lowpass', frequency: p.filterHz, Q: p.filterQ }).connect(dest)

  const a = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: p.attack, decay: 0.05, sustain: 0, release: p.release },
  }).connect(new Tone.Gain(p.gain * p.resonance).connect(lp))

  const b = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.002, decay: 0.055, sustain: 0, release: p.release },
  }).connect(new Tone.Gain(p.gain * 0.55).connect(lp))

  a.triggerAttackRelease(p.pitchHz, 0.05, 0, 0.55)
  b.triggerAttackRelease(p.pitchHz * 1.25, 0.06, 0.03, 0.45)
  return p.durationTarget
}

function schedulePlayerHurt(Tone: ToneNs, p: SfxPreset): number {
  const dest = new Tone.Gain(1).toDestination()
  const lp = new Tone.Filter({ type: 'lowpass', frequency: p.filterHz, Q: p.filterQ }).connect(dest)

  const body = new Tone.Synth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: p.attack, decay: 0.1, sustain: 0, release: p.release },
  }).connect(
    new Tone.Filter({ type: 'lowpass', frequency: 900, Q: 0.6 }).connect(
      new Tone.Gain(p.gain * 0.45).connect(lp),
    ),
  )

  const grit = new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.002, decay: 0.09, sustain: 0, release: 0.03 },
  }).connect(new Tone.Gain(p.gain * p.noiseAmount).connect(lp))

  body.triggerAttackRelease(p.pitchHz, 0.12, 0, 0.55)
  body.frequency.setValueAtTime(p.pitchHz * 1.4, 0)
  body.frequency.exponentialRampToValueAtTime(p.pitchHz * 0.7, 0.12)
  grit.triggerAttackRelease(0.1, 0, 0.5)
  return p.durationTarget
}

function scheduleMenuMove(Tone: ToneNs, p: SfxPreset): number {
  const click = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: p.attack, decay: 0.035, sustain: 0, release: p.release },
  }).connect(
    new Tone.Filter({ type: 'highpass', frequency: 800, Q: 0.5 })
      .connect(new Tone.Filter({ type: 'lowpass', frequency: p.filterHz, Q: p.filterQ }))
      .connect(new Tone.Gain(p.gain).toDestination()),
  )
  click.triggerAttackRelease(p.pitchHz, 0.04, 0, 0.4)
  return p.durationTarget
}

function scheduleMenuCancel(Tone: ToneNs, p: SfxPreset): number {
  const dest = new Tone.Gain(p.gain).toDestination()
  const s = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: p.attack, decay: 0.07, sustain: 0, release: p.release },
  }).connect(new Tone.Filter({ type: 'lowpass', frequency: p.filterHz, Q: p.filterQ }).connect(dest))
  s.triggerAttackRelease(p.pitchHz, 0.08, 0, 0.5)
  s.frequency.exponentialRampToValueAtTime(p.pitchHz * 0.65, 0.08)
  return p.durationTarget
}

function scheduleShopPurchase(Tone: ToneNs, p: SfxPreset): number {
  const dest = new Tone.Gain(p.gain).toDestination()
  const lp = new Tone.Filter({ type: 'lowpass', frequency: p.filterHz, Q: p.filterQ }).connect(dest)
  const a = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: p.attack, decay: 0.08, sustain: 0, release: 0.04 },
  }).connect(lp)
  const b = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.004, decay: 0.1, sustain: 0, release: 0.05 },
  }).connect(lp)
  a.triggerAttackRelease(p.pitchHz, 0.09, 0, 0.5)
  b.triggerAttackRelease(p.pitchHz * 1.25, 0.12, 0.08, 0.45)
  return p.durationTarget
}

function scheduleLevelUp(Tone: ToneNs, p: SfxPreset): number {
  // C4 E4 G4 → 明るい上昇
  const notes = [523.25, 659.25, 783.99]
  const dest = new Tone.Gain(p.gain).toDestination()
  const lp = new Tone.Filter({ type: 'lowpass', frequency: p.filterHz, Q: p.filterQ }).connect(dest)
  notes.forEach((hz, i) => {
    const s = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: p.attack, decay: 0.18, sustain: 0.05, release: p.release },
    }).connect(lp)
    s.triggerAttackRelease(hz, 0.22, i * 0.12, 0.55)
  })
  return p.durationTarget
}

function scheduleStageClear(Tone: ToneNs, p: SfxPreset): number {
  // G3 → B3 → D4 → G4
  const notes = [196.0, 246.94, 293.66, 392.0]
  const times = [0, 0.18, 0.36, 0.55]
  const dest = new Tone.Gain(p.gain).toDestination()
  const lp = new Tone.Filter({ type: 'lowpass', frequency: p.filterHz, Q: p.filterQ }).connect(dest)
  notes.forEach((hz, i) => {
    const s = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: p.attack, decay: 0.28, sustain: 0.08, release: p.release },
    }).connect(lp)
    s.triggerAttackRelease(hz, 0.35, times[i], 0.5)
  })
  return p.durationTarget
}

function scheduleAreaClear(Tone: ToneNs, p: SfxPreset): number {
  // Stage Clear + 追加の和音
  const notes = [196.0, 246.94, 293.66, 392.0, 493.88]
  const times = [0, 0.2, 0.4, 0.62, 0.9]
  const dest = new Tone.Gain(p.gain).toDestination()
  const lp = new Tone.Filter({ type: 'lowpass', frequency: p.filterHz, Q: p.filterQ }).connect(dest)
  notes.forEach((hz, i) => {
    const s = new Tone.Synth({
      oscillator: { type: i === notes.length - 1 ? 'sine' : 'triangle' },
      envelope: { attack: p.attack, decay: 0.35, sustain: 0.1, release: p.release },
    }).connect(lp)
    s.triggerAttackRelease(hz, 0.45, times[i], 0.52)
  })
  // 薄い和音レイヤ
  const chord = [392.0, 493.88, 587.33]
  chord.forEach((hz) => {
    const s = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.05, decay: 0.5, sustain: 0.05, release: 0.2 },
    }).connect(new Tone.Gain(0.22).connect(lp))
    s.triggerAttackRelease(hz, 0.7, 0.95, 0.35)
  })
  return p.durationTarget
}

function scheduleGameOver(Tone: ToneNs, p: SfxPreset): number {
  // E3 → C3 → A2（穏やかな下降）
  const notes = [164.81, 130.81, 110.0]
  const times = [0, 0.28, 0.55]
  const dest = new Tone.Gain(p.gain).toDestination()
  const lp = new Tone.Filter({ type: 'lowpass', frequency: p.filterHz, Q: p.filterQ }).connect(dest)
  notes.forEach((hz, i) => {
    const s = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: p.attack, decay: 0.35, sustain: 0.05, release: p.release },
    }).connect(lp)
    s.triggerAttackRelease(hz, 0.4, times[i], 0.45)
  })
  return p.durationTarget
}
