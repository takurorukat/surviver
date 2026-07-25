/**
 * 属性SEの Tone.js パッチ定義。
 * すべて Tone.Offline コールバック内で new すること。
 */

/** @typedef {import('tone')} ToneNs */

/**
 * @param {ToneNs} Tone
 * @param {'fire' | 'hit'} kind
 */
export function schedulePower(Tone, kind) {
  // クリーンな魔法弾: 明瞭なピッチ下降 + 薄い空気ノイズ
  const filter = new Tone.Filter({
    type: 'lowpass',
    frequency: kind === 'fire' ? 3200 : 4200,
    Q: 0.7,
  }).toDestination()

  const synth = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: {
      attack: kind === 'fire' ? 0.004 : 0.001,
      decay: kind === 'fire' ? 0.07 : 0.05,
      sustain: 0,
      release: 0.02,
    },
  }).connect(filter)

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
      new Tone.Gain(kind === 'fire' ? 0.08 : 0.14).connect(filter),
    ),
  )

  const t0 = 0
  synth.triggerAttackRelease(kind === 'fire' ? 'A5' : 'G5', kind === 'fire' ? 0.08 : 0.055, t0, 0.55)
  // わずかに下降する感じを周波数エンベロープで
  synth.frequency.setValueAtTime(kind === 'fire' ? 880 : 784, t0)
  synth.frequency.exponentialRampToValueAtTime(kind === 'fire' ? 520 : 420, t0 + (kind === 'fire' ? 0.07 : 0.05))
  air.triggerAttackRelease(kind === 'fire' ? 0.04 : 0.025, t0, 0.35)

  return kind === 'fire' ? 0.09 : 0.07
}

/**
 * @param {ToneNs} Tone
 * @param {'fire' | 'hit'} kind
 */
export function scheduleWind(Tone, kind) {
  // 帯域を絞った空気ノイズ主体（音程は弱め）
  const dest = new Tone.Gain(1).toDestination()
  const band = new Tone.Filter({
    type: 'bandpass',
    frequency: kind === 'fire' ? 2800 : 3400,
    Q: kind === 'fire' ? 1.4 : 2.2,
  }).connect(dest)

  const whoosh = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: {
      attack: kind === 'fire' ? 0.01 : 0.001,
      decay: kind === 'fire' ? 0.075 : 0.045,
      sustain: 0,
      release: 0.015,
    },
  }).connect(band)

  // フィルタを開いて閉じる＝切って抜ける
  band.frequency.setValueAtTime(kind === 'fire' ? 1800 : 2600, 0)
  band.frequency.exponentialRampToValueAtTime(kind === 'fire' ? 4200 : 5000, kind === 'fire' ? 0.03 : 0.012)
  band.frequency.exponentialRampToValueAtTime(900, kind === 'fire' ? 0.09 : 0.055)

  // ごく薄いトーン（主体にならない）
  const thin = new Tone.Oscillator({
    type: 'sine',
    frequency: 1500,
  }).connect(new Tone.Gain(0.04).connect(dest))
  thin.start(0)
  thin.frequency.exponentialRampToValueAtTime(700, kind === 'fire' ? 0.06 : 0.04)
  thin.stop(kind === 'fire' ? 0.07 : 0.045)

  whoosh.triggerAttackRelease(kind === 'fire' ? 0.085 : 0.055, 0, 0.85)
  return kind === 'fire' ? 0.1 : 0.07
}

/**
 * @param {ToneNs} Tone
 * @param {'fire' | 'hit'} kind
 */
export function scheduleWater(Tone, kind) {
  // 水滴の共鳴（近い2音）+ 柔らかいノイズ。ベル連打にはしない
  const dest = new Tone.Gain(1).toDestination()
  const dripFilter = new Tone.Filter({
    type: 'lowpass',
    frequency: 2200,
    Q: 0.8,
  }).connect(dest)

  const dropA = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: {
      attack: kind === 'hit' ? 0.001 : 0.006,
      decay: kind === 'fire' ? 0.07 : 0.05,
      sustain: 0,
      release: 0.02,
    },
  }).connect(dripFilter)

  const dropB = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: {
      attack: kind === 'hit' ? 0.002 : 0.008,
      decay: kind === 'fire' ? 0.06 : 0.045,
      sustain: 0,
      release: 0.02,
    },
  }).connect(new Tone.Gain(0.7).connect(dripFilter))

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
      new Tone.Gain(kind === 'hit' ? 0.12 : 0.07).connect(dest),
    ),
  )

  const t0 = 0
  dropA.triggerAttackRelease(920, kind === 'fire' ? 0.08 : 0.055, t0, kind === 'hit' ? 0.7 : 0.55)
  dropA.frequency.setValueAtTime(920, t0)
  dropA.frequency.exponentialRampToValueAtTime(760, t0 + (kind === 'fire' ? 0.07 : 0.05))

  const t1 = kind === 'hit' ? 0.006 : 0.012
  dropB.triggerAttackRelease(1080, kind === 'fire' ? 0.07 : 0.05, t1, kind === 'hit' ? 0.55 : 0.4)
  dropB.frequency.setValueAtTime(1080, t1)
  dropB.frequency.exponentialRampToValueAtTime(880, t1 + (kind === 'fire' ? 0.06 : 0.045))

  soft.triggerAttackRelease(kind === 'fire' ? 0.05 : 0.035, t0, 0.4)
  return kind === 'fire' ? 0.1 : 0.075
}

/**
 * @param {ToneNs} Tone
 * @param {'fire' | 'hit'} kind
 */
export function scheduleFire(Tone, kind) {
  // 揺らぐノイズ + 火の粉（短いノイズ粒）
  const dest = new Tone.Gain(1).toDestination()
  const bodyFilter = new Tone.Filter({
    type: 'bandpass',
    frequency: 900,
    Q: 0.9,
  }).connect(dest)

  // LFO でフィルタを揺らす
  const lfo = new Tone.LFO({
    frequency: kind === 'fire' ? 18 : 28,
    min: 650,
    max: kind === 'fire' ? 1400 : 1800,
    type: 'sine',
  }).start(0)
  lfo.connect(bodyFilter.frequency)

  const roar = new Tone.NoiseSynth({
    noise: { type: 'brown' },
    envelope: {
      attack: kind === 'fire' ? 0.01 : 0.002,
      decay: kind === 'fire' ? 0.08 : 0.05,
      sustain: 0,
      release: 0.02,
    },
  }).connect(new Tone.Gain(0.55).connect(bodyFilter))

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
      new Tone.Gain(0.35).connect(dest),
    ),
  )

  // 火の粉: ごく短いノイズを数回
  const crackleTimes = kind === 'hit' ? [0.0, 0.012, 0.024, 0.035] : [0.01, 0.025, 0.038]
  for (const ct of crackleTimes) {
    const spark = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.012, sustain: 0, release: 0.005 },
    }).connect(
      new Tone.Filter({ type: 'highpass', frequency: 1800, Q: 0.7 }).connect(
        new Tone.Gain(kind === 'hit' ? 0.22 : 0.14).connect(dest),
      ),
    )
    spark.triggerAttackRelease(0.015, ct, 0.5)
  }

  // 補助の短いピッチ（主体にしない）
  const hint = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 0.04, sustain: 0, release: 0.01 },
  }).connect(new Tone.Gain(0.12).connect(dest))
  hint.triggerAttackRelease(kind === 'fire' ? 520 : 460, 0.05, 0, 0.35)
  hint.frequency.exponentialRampToValueAtTime(kind === 'fire' ? 360 : 300, 0.05)

  roar.triggerAttackRelease(kind === 'fire' ? 0.085 : 0.055, 0, 0.7)
  mid.triggerAttackRelease(kind === 'fire' ? 0.07 : 0.045, 0, 0.55)
  return kind === 'fire' ? 0.1 : 0.075
}

/**
 * @param {ToneNs} Tone
 * @param {'fire' | 'hit'} kind
 */
export function scheduleEarth(Tone, kind) {
  // 粒状の砂・小石 + 短い共鳴（重低音にしない）
  const dest = new Tone.Gain(1).toDestination()
  const grainFilter = new Tone.Filter({
    type: 'bandpass',
    frequency: kind === 'fire' ? 780 : 700,
    Q: 1.0,
  }).connect(dest)

  const grains = new Tone.NoiseSynth({
    noise: { type: 'brown' },
    envelope: {
      attack: kind === 'hit' ? 0.001 : 0.006,
      decay: kind === 'fire' ? 0.075 : 0.06,
      sustain: 0,
      release: 0.02,
    },
  }).connect(grainFilter)

  // 粒感: 振幅を速いトレモロで刻む
  const trem = new Tone.Tremolo({
    frequency: kind === 'fire' ? 55 : 70,
    depth: 0.7,
    type: 'square',
    spread: 0,
  }).connect(new Tone.Gain(0.45).connect(dest)).start(0)

  const grainLayer = new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: {
      attack: kind === 'hit' ? 0.001 : 0.008,
      decay: kind === 'fire' ? 0.07 : 0.055,
      sustain: 0,
      release: 0.015,
    },
  }).connect(
    new Tone.Filter({ type: 'bandpass', frequency: 1100, Q: 1.4 }).connect(trem),
  )

  const stone = new Tone.MembraneSynth({
    pitchDecay: 0.02,
    octaves: 1.2,
    oscillator: { type: 'sine' },
    envelope: {
      attack: kind === 'hit' ? 0.001 : 0.005,
      decay: kind === 'fire' ? 0.06 : 0.07,
      sustain: 0,
      release: 0.02,
    },
  }).connect(new Tone.Gain(kind === 'hit' ? 0.35 : 0.22).connect(dest))

  grains.triggerAttackRelease(kind === 'fire' ? 0.08 : 0.06, 0, 0.65)
  grainLayer.triggerAttackRelease(kind === 'fire' ? 0.075 : 0.055, 0, 0.5)
  // MembraneSynth のノートは中域寄り（低すぎない）
  stone.triggerAttackRelease(kind === 'fire' ? 'G4' : 'E4', kind === 'fire' ? 0.07 : 0.08, 0, kind === 'hit' ? 0.55 : 0.4)

  return kind === 'fire' ? 0.1 : 0.085
}

export const ELEMENT_SCHEDULES = {
  power: schedulePower,
  wind: scheduleWind,
  water: scheduleWater,
  fire: scheduleFire,
  earth: scheduleEarth,
}

export const ELEMENT_BLURBS = {
  power:
    'クリーンな triangle Synth の下降 + 薄い bandpass 空気ノイズ（人工的で整った基準音）',
  wind:
    'bandpass Noise を開閉して「切って抜ける」空気感。音程はごく薄い補助のみ',
  water:
    '近い周波数の2つの短い sine 共鳴 + pink の柔らかいノイズ（水滴／液体感、ベル回避）',
  fire:
    'brown/pink ノイズを LFO で揺らし、短い white 粒で火の粉。ピッチは補助',
  earth:
    'brown/pink を bandpass + 速い Tremolo で粒状化し、MembraneSynth で短い石の共鳴',
}
