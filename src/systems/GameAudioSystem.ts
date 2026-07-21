// ============================================================
// ゲーム音声（効果音の合成 + BGM のループ再生）
// ------------------------------------------------------------
// SFX / BGM とも Web Audio の AudioBufferSource で destination へ直接出力する。
// Phaser の sound.locked に依存すると無音になることがあるため、locked チェックはしない。
// ============================================================

import Phaser from 'phaser'
import {
  SFX_KEY_ENEMY_DEFEAT,
  SFX_KEY_ENEMY_HIT,
  SFX_KEY_ENEMY_BLOCKED,
  SFX_KEY_PLAYER_FIRE,
  SFX_KEY_GAME_OVER,
  SFX_KEY_COIN_PICKUP,
  SFX_KEY_PLAYER_HURT,
  SFX_KEY_LEVEL_UP,
  SFX_KEY_STAGE_CLEAR,
  SFX_KEY_AREA_CLEAR,
  SFX_KEY_MENU_MOVE,
  SFX_KEY_SHOP_PURCHASE,
  SFX_KEY_MENU_CANCEL,
  SFX_VOLUME,
  BGM_KEY,
  BGM_VOLUME,
  TITLE_BGM_KEY,
  TITLE_BGM_VOLUME,
  AREA_CLEAR_BGM_KEY,
  BGM_ENABLED_STORAGE_KEY,
} from '../GameConstants'

type ToneConfig = {
  key: string
  frequency: number
  durationSeconds: number
  volume: number
  risingPitch?: boolean
  noiseAmount?: number
}

type NativePlayback = {
  source: AudioBufferSourceNode
  gainNode: GainNode
  kind: 'battle' | 'title' | 'clear'
  audioKey: string
}

let sharedBgm: NativePlayback | null = null
let bgmEnabledPreference = loadBgmEnabledPreference()
let preferredBattleBgmKey = BGM_KEY
// BGM 命令の通し番号。stop 後に届く古い「再生予約」を無効化する
// （再生開始は AudioContext の resume 待ちで非同期になるため、
//   stopBgm → シーン遷移 のあとに古い予約が発火して鳴り続けるバグがあった）
let bgmCommandSequence = 0

function loadBgmEnabledPreference(): boolean {
  try {
    const rawText = localStorage.getItem(BGM_ENABLED_STORAGE_KEY)
    // 未設定・不正値はすべて OFF（初回は必ずオフ）
    if (rawText !== '1') {
      if (rawText !== '0') {
        localStorage.setItem(BGM_ENABLED_STORAGE_KEY, '0')
      }
      return false
    }
    return true
  } catch (_error) {
    return false
  }
}

function saveBgmEnabledPreference(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem(BGM_ENABLED_STORAGE_KEY, '1')
    } else {
      localStorage.setItem(BGM_ENABLED_STORAGE_KEY, '0')
    }
  } catch (_error) {
    // 書けなくてもゲームは続行
  }
}

function getVolumeForBgmKind(kind: 'battle' | 'title' | 'clear'): number {
  if (kind === 'title') {
    return TITLE_BGM_VOLUME
  }
  return BGM_VOLUME
}

/** 設定の BGM ON/OFF（どこからでも参照可） */
export function isBgmEnabled(): boolean {
  return bgmEnabledPreference
}

const TONE_CONFIGS: ToneConfig[] = [
  {
    key: SFX_KEY_ENEMY_HIT,
    frequency: 420,
    durationSeconds: 0.07,
    volume: 0.28,
    noiseAmount: 0.45,
  },
  {
    key: SFX_KEY_ENEMY_DEFEAT,
    frequency: 160,
    durationSeconds: 0.16,
    volume: 0.34,
    noiseAmount: 0.85,
  },
  { key: SFX_KEY_COIN_PICKUP, frequency: 880, durationSeconds: 0.08, volume: 0.2 },
  { key: SFX_KEY_PLAYER_HURT, frequency: 140, durationSeconds: 0.15, volume: 0.3 },
]

function createToneBuffer(
  audioContext: AudioContext,
  frequency: number,
  durationSeconds: number,
  volume: number,
  risingPitch: boolean,
  noiseAmount: number,
): AudioBuffer {
  const sampleRate = audioContext.sampleRate
  const sampleCount = Math.floor(sampleRate * durationSeconds)
  const buffer = audioContext.createBuffer(1, sampleCount, sampleRate)
  const channelData = buffer.getChannelData(0)

  for (let index = 0; index < sampleCount; index++) {
    const timeSeconds = index / sampleRate
    const progress = index / sampleCount
    const envelope = Math.pow(1 - progress, 1.6)

    let actualFrequency = frequency
    if (risingPitch) {
      actualFrequency = frequency * (1 + timeSeconds * 1.5)
    }

    const tone = Math.sin(2 * Math.PI * actualFrequency * timeSeconds)
    const noise = Math.random() * 2 - 1
    const mixed = tone * (1 - noiseAmount) + noise * noiseAmount
    channelData[index] = mixed * envelope * volume
  }

  return buffer
}

function getAudioContext(scene: Phaser.Scene): AudioContext | null {
  try {
    const soundManager = scene.sound as Phaser.Sound.WebAudioSoundManager
    if (soundManager.context === undefined) {
      return null
    }
    return soundManager.context
  } catch (_error) {
    return null
  }
}

// AudioBuffer かどうか（instanceof は iframe 等で外れることがあるので使わない）
function asAudioBuffer(value: unknown): AudioBuffer | null {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value !== 'object') {
    return null
  }
  const maybeBuffer = value as { duration?: unknown; getChannelData?: unknown }
  if (typeof maybeBuffer.duration !== 'number') {
    return null
  }
  if (typeof maybeBuffer.getChannelData !== 'function') {
    return null
  }
  return value as AudioBuffer
}

function stopSharedBgm(): void {
  if (sharedBgm === null) {
    return
  }

  try {
    sharedBgm.source.stop()
  } catch (_error) {
    // 既に停止済み
  }

  try {
    sharedBgm.source.disconnect()
    sharedBgm.gainNode.disconnect()
  } catch (_error) {
    // 既に切断済み
  }

  sharedBgm = null
}

export class GameAudioSystem {
  private scene: Phaser.Scene
  private isPrepared = false

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    // タイトル再入場時なども、保存値を読み直す（未設定なら OFF）
    bgmEnabledPreference = loadBgmEnabledPreference()
  }

  /**
   * SFX 用バッファを用意する。
   * locked 中でも AudioContext さえあれば作れる（以前は locked でスキップして無音になっていた）。
   */
  prepare(): void {
    if (this.isPrepared) {
      return
    }

    const audioContext = getAudioContext(this.scene)
    if (audioContext === null) {
      return
    }

    for (let index = 0; index < TONE_CONFIGS.length; index++) {
      const toneConfig = TONE_CONFIGS[index]
      const noiseAmount = toneConfig.noiseAmount ?? 0
      const buffer = createToneBuffer(
        audioContext,
        toneConfig.frequency,
        toneConfig.durationSeconds,
        toneConfig.volume,
        toneConfig.risingPitch === true,
        noiseAmount,
      )
      // 同じキーが既にあっても上書きして最新のバッファを使う
      if (this.scene.cache.audio.exists(toneConfig.key)) {
        this.scene.cache.audio.remove(toneConfig.key)
      }
      this.scene.cache.audio.add(toneConfig.key, buffer)
    }

    this.isPrepared = true
  }

  unlock(): void {
    try {
      this.scene.sound.unlock()
    } catch (_error) {
      // unlock 失敗でも続行
    }
    this.resumeAudioContext()
  }

  private resumeAudioContext(): void {
    const audioContext = getAudioContext(this.scene)
    if (audioContext === null) {
      return
    }
    if (audioContext.state === 'suspended') {
      void audioContext.resume()
    }
  }

  /** resume 完了を待ってから再生する（無音防止） */
  private whenAudioReady(onReady: () => void): void {
    this.unlock()
    this.prepare()

    const audioContext = getAudioContext(this.scene)
    if (audioContext === null) {
      onReady()
      return
    }

    if (audioContext.state === 'suspended') {
      void audioContext
        .resume()
        .then(() => {
          onReady()
        })
        .catch(() => {
          onReady()
        })
      return
    }

    onReady()
  }

  isBattleBgmActive(): boolean {
    return sharedBgm !== null && sharedBgm.kind === 'battle'
  }

  isAreaClearBgmActive(): boolean {
    return sharedBgm !== null && sharedBgm.kind === 'clear'
  }

  /** 戦闘・クリアを問わず、何らかの BGM が鳴っているか */
  isAnyBgmActive(): boolean {
    return sharedBgm !== null
  }

  startBgm(audioKey: string = BGM_KEY): void {
    preferredBattleBgmKey = audioKey
    bgmCommandSequence = bgmCommandSequence + 1
    const commandSeq = bgmCommandSequence
    this.whenAudioReady(() => {
      // このあとに stop や別の再生命令が出ていたら、この予約は破棄する
      if (commandSeq !== bgmCommandSequence) {
        return
      }
      if (
        sharedBgm !== null &&
        sharedBgm.kind === 'battle' &&
        sharedBgm.audioKey === audioKey
      ) {
        this.applyBgmGainToCurrentPlayback()
        return
      }
      this.startNativeBgm(audioKey, BGM_VOLUME, 'battle', true)
    })
  }

  startTitleBgm(): void {
    bgmCommandSequence = bgmCommandSequence + 1
    const commandSeq = bgmCommandSequence
    this.whenAudioReady(() => {
      if (commandSeq !== bgmCommandSequence) {
        return
      }
      if (sharedBgm !== null && sharedBgm.kind === 'title') {
        this.applyBgmGainToCurrentPlayback()
        return
      }
      this.startNativeBgm(TITLE_BGM_KEY, TITLE_BGM_VOLUME, 'title', true)
    })
  }

  /**
   * エリアクリア用ジングル（LevelUp2）。ループしない短い曲。
   * 通常は playAreaClear() を使い、BGM スロットが必要なときだけこちら。
   */
  startAreaClearBgm(): void {
    bgmCommandSequence = bgmCommandSequence + 1
    const commandSeq = bgmCommandSequence
    this.whenAudioReady(() => {
      if (commandSeq !== bgmCommandSequence) {
        return
      }
      if (
        sharedBgm !== null &&
        sharedBgm.kind === 'clear' &&
        sharedBgm.audioKey === AREA_CLEAR_BGM_KEY
      ) {
        this.applyBgmGainToCurrentPlayback()
        return
      }
      // LevelUp2 は約2秒のジングルなのでループしない
      this.startNativeBgm(AREA_CLEAR_BGM_KEY, BGM_VOLUME, 'clear', false)
    })
  }

  forceRestartBattleBgm(): void {
    bgmCommandSequence = bgmCommandSequence + 1
    const commandSeq = bgmCommandSequence
    stopSharedBgm()
    this.whenAudioReady(() => {
      if (commandSeq !== bgmCommandSequence) {
        return
      }
      this.startNativeBgm(preferredBattleBgmKey, BGM_VOLUME, 'battle', true)
    })
  }

  getBgmEnabled(): boolean {
    return bgmEnabledPreference
  }

  setBgmEnabled(enabled: boolean): void {
    bgmEnabledPreference = enabled
    saveBgmEnabledPreference(enabled)

    if (sharedBgm !== null) {
      this.applyBgmGainToCurrentPlayback()
      return
    }

    if (enabled && this.scene.scene.key === 'TitleScene') {
      this.startTitleBgm()
      return
    }
    if (enabled) {
      this.forceRestartBattleBgm()
    }
  }

  private applyBgmGainToCurrentPlayback(): void {
    if (sharedBgm === null) {
      return
    }
    if (bgmEnabledPreference) {
      sharedBgm.gainNode.gain.value = getVolumeForBgmKind(sharedBgm.kind)
    } else {
      sharedBgm.gainNode.gain.value = 0
    }
  }

  stopBgm(): void {
    // 進行中の再生予約もすべて無効化してから止める
    bgmCommandSequence = bgmCommandSequence + 1
    stopSharedBgm()
  }

  private startNativeBgm(
    audioKey: string,
    volume: number,
    kind: 'battle' | 'title' | 'clear',
    shouldLoop: boolean,
  ): void {
    if (!this.scene.cache.audio.exists(audioKey)) {
      console.warn('BGM がキャッシュにありません:', audioKey)
      // エリア専用曲が無いときは、共通の戦闘BGMで代用する
      if (kind === 'battle' && audioKey !== BGM_KEY && this.scene.cache.audio.exists(BGM_KEY)) {
        audioKey = BGM_KEY
      } else {
        // 代用も無い場合でも、前の曲（タイトル曲など）は必ず止める
        stopSharedBgm()
        return
      }
    }

    if (
      sharedBgm !== null &&
      sharedBgm.kind === kind &&
      sharedBgm.audioKey === audioKey
    ) {
      this.applyBgmGainToCurrentPlayback()
      return
    }

    stopSharedBgm()

    const audioContext = getAudioContext(this.scene)
    if (audioContext === null) {
      console.warn('AudioContext がありません')
      return
    }

    const audioBuffer = asAudioBuffer(this.scene.cache.audio.get(audioKey))
    if (audioBuffer === null) {
      console.warn('BGM の AudioBuffer が不正です:', audioKey)
      return
    }

    try {
      const gainNode = audioContext.createGain()
      if (bgmEnabledPreference) {
        gainNode.gain.value = volume
      } else {
        gainNode.gain.value = 0
      }

      const source = audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.loop = shouldLoop
      if (shouldLoop) {
        source.loopStart = 0
        source.loopEnd = audioBuffer.duration
      }
      source.connect(gainNode)
      gainNode.connect(audioContext.destination)
      source.start(0)
      sharedBgm = { source, gainNode, kind, audioKey }
    } catch (error) {
      console.warn('BGM の再生に失敗しました:', error)
      sharedBgm = null
    }
  }

  playPlayerFire(): void {
    this.playSound(SFX_KEY_PLAYER_FIRE)
  }

  playGameOver(): void {
    this.playSound(SFX_KEY_GAME_OVER)
  }

  playStageClear(): void {
    this.playSound(SFX_KEY_STAGE_CLEAR)
  }

  playAreaClear(): void {
    this.playSound(SFX_KEY_AREA_CLEAR)
  }

  playEnemyHit(): void {
    this.playSound(SFX_KEY_ENEMY_HIT)
  }

  playEnemyBlocked(): void {
    this.playSound(SFX_KEY_ENEMY_BLOCKED)
  }

  playEnemyDefeat(): void {
    this.playSound(SFX_KEY_ENEMY_DEFEAT)
  }

  playCoinPickup(): void {
    this.playSound(SFX_KEY_COIN_PICKUP)
  }

  playPlayerHurt(): void {
    this.playSound(SFX_KEY_PLAYER_HURT)
  }

  playLevelUp(): void {
    this.playSound(SFX_KEY_LEVEL_UP)
  }

  playMenuMove(): void {
    this.playSound(SFX_KEY_MENU_MOVE)
  }

  playShopPurchase(): void {
    this.playSound(SFX_KEY_SHOP_PURCHASE)
  }

  playMenuCancel(): void {
    this.playSound(SFX_KEY_MENU_CANCEL)
  }

  /**
   * 効果音を Web Audio で直接鳴らす。
   * Phaser sound.play 経由だと locked / suspended で無音になりやすい。
   */
  private playSound(soundKey: string): void {
    this.unlock()
    this.prepare()

    if (!this.isPrepared) {
      return
    }

    const audioContext = getAudioContext(this.scene)
    if (audioContext === null) {
      return
    }

    const playNow = (): void => {
      const audioBuffer = asAudioBuffer(this.scene.cache.audio.get(soundKey))
      if (audioBuffer === null) {
        return
      }

      try {
        const gainNode = audioContext.createGain()
        gainNode.gain.value = SFX_VOLUME
        const source = audioContext.createBufferSource()
        source.buffer = audioBuffer
        source.connect(gainNode)
        gainNode.connect(audioContext.destination)
        source.start(0)
      } catch (_error) {
        // 再生失敗時は無視（ゲームは続行）
      }
    }

    if (audioContext.state === 'suspended') {
      void audioContext
        .resume()
        .then(() => {
          playNow()
        })
        .catch(() => {
          playNow()
        })
      return
    }

    playNow()
  }
}
