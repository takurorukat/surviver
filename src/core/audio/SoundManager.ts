/**
 * ゲーム非依存の音量・ミュート preference と Web Audio 再生ヘルパー。
 * localStorage キーは呼び出し側が指定する（Survivor 既存キー互換を維持）。
 */
import Phaser from 'phaser'
import {
  BGM_FADE_DISCONNECT_BUFFER_MS,
  BGM_FADE_MS,
  type BgmLoopBounds,
  resolveBgmLoopRange,
  scheduleGainFadeIn,
  scheduleGainFadeOut,
  setGainImmediate,
} from './bgmFade'
import {
  DEFAULT_SFX_PLAYBACK_POLICY,
  SfxPolicyTracker,
  type SfxPlaybackPolicy,
} from './sfxPolicy'

export type SoundPreferencesConfig = {
  /** BGM ON/OFF を保存する localStorage キー */
  bgmEnabledKey: string
  /** 未設定時の BGM 初期値（Survivor は false） */
  defaultBgmEnabled?: boolean
  /** BGM 切替フェード（ミリ秒）。省略時は BGM_FADE_MS */
  bgmFadeMs?: number
  /** SE 同時発音・クールダウン等（省略時は制限なし） */
  sfxPolicy?: SfxPlaybackPolicy
}

type NativeBgmPlayback = {
  source: AudioBufferSourceNode
  gainNode: GainNode
  kind: string
  audioKey: string
}

type ActiveSfxPlayback = {
  source: AudioBufferSourceNode
  gainNode: GainNode
  soundKey: string
}

let sharedBgm: NativeBgmPlayback | null = null
let fadingOutBgm: NativeBgmPlayback | null = null
let bgmCommandSequence = 0
let sfxCommandSequence = 0
let activeSfxList: ActiveSfxPlayback[] = []

function asAudioBuffer(value: unknown): AudioBuffer | null {
  if (value === null || value === undefined || typeof value !== 'object') {
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

export function getAudioContextFromScene(scene: Phaser.Scene): AudioContext | null {
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

function disconnectBgmPlayback(playback: NativeBgmPlayback): void {
  try {
    playback.source.stop()
  } catch (_error) {
    // 既に停止済み
  }
  try {
    playback.source.disconnect()
    playback.gainNode.disconnect()
  } catch (_error) {
    // 既に切断済み
  }
}

export class SoundManager {
  private bgmEnabled: boolean
  private readonly bgmFadeMs: number
  private readonly sfxPolicyTracker: SfxPolicyTracker
  private pendingBgmFadeTimer: ReturnType<typeof setTimeout> | null = null

  constructor(private readonly preferences: SoundPreferencesConfig) {
    this.bgmEnabled = this.loadBgmEnabledPreference()
    this.bgmFadeMs = preferences.bgmFadeMs ?? BGM_FADE_MS
    this.sfxPolicyTracker = new SfxPolicyTracker(
      preferences.sfxPolicy ?? DEFAULT_SFX_PLAYBACK_POLICY,
    )
  }

  isBgmEnabled(): boolean {
    return this.bgmEnabled
  }

  setBgmEnabled(enabled: boolean): void {
    this.bgmEnabled = enabled
    this.saveBgmEnabledPreference(enabled)
  }

  reloadPreferences(): void {
    this.bgmEnabled = this.loadBgmEnabledPreference()
  }

  private loadBgmEnabledPreference(): boolean {
    const defaultEnabled = this.preferences.defaultBgmEnabled === true
    try {
      const rawText = localStorage.getItem(this.preferences.bgmEnabledKey)
      if (rawText !== '1') {
        if (rawText !== '0') {
          localStorage.setItem(
            this.preferences.bgmEnabledKey,
            defaultEnabled ? '1' : '0',
          )
        }
        return defaultEnabled
      }
      return true
    } catch (_error) {
      return defaultEnabled
    }
  }

  private saveBgmEnabledPreference(enabled: boolean): void {
    try {
      localStorage.setItem(this.preferences.bgmEnabledKey, enabled ? '1' : '0')
    } catch (_error) {
      // 書けなくてもゲームは続行
    }
  }

  private clearPendingBgmFadeTimer(): void {
    if (this.pendingBgmFadeTimer !== null) {
      clearTimeout(this.pendingBgmFadeTimer)
      this.pendingBgmFadeTimer = null
    }
  }

  unlockSceneAudio(scene: Phaser.Scene): void {
    try {
      scene.sound.unlock()
    } catch (_error) {
      // unlock 失敗でも続行
    }
    const audioContext = getAudioContextFromScene(scene)
    if (audioContext !== null && audioContext.state === 'suspended') {
      void audioContext.resume()
    }
  }

  whenAudioReady(scene: Phaser.Scene, onReady: () => void): void {
    this.unlockSceneAudio(scene)
    const audioContext = getAudioContextFromScene(scene)
    if (audioContext === null) {
      onReady()
      return
    }
    if (audioContext.state === 'suspended') {
      void audioContext
        .resume()
        .then(() => onReady())
        .catch(() => onReady())
      return
    }
    onReady()
  }

  stopSharedBgm(options?: {
    immediate?: boolean
    onFadeComplete?: () => void
    /** 省略時はインスタンスの bgmFadeMs（既定 100ms） */
    fadeMs?: number
  }): void {
    if (options?.onFadeComplete === undefined) {
      bgmCommandSequence = bgmCommandSequence + 1
    }
    this.clearPendingBgmFadeTimer()

    if (fadingOutBgm !== null) {
      disconnectBgmPlayback(fadingOutBgm)
      fadingOutBgm = null
    }

    const onFadeComplete = options?.onFadeComplete
    const fadeMs =
      typeof options?.fadeMs === 'number' && Number.isFinite(options.fadeMs)
        ? Math.max(0, options.fadeMs)
        : this.bgmFadeMs

    if (sharedBgm === null) {
      if (onFadeComplete !== undefined) {
        onFadeComplete()
      }
      return
    }

    const playback = sharedBgm
    sharedBgm = null

    if (options?.immediate === true || fadeMs <= 0) {
      disconnectBgmPlayback(playback)
      if (onFadeComplete !== undefined) {
        onFadeComplete()
      }
      return
    }

    const audioContext = playback.gainNode.context as AudioContext
    scheduleGainFadeOut(audioContext, playback.gainNode, fadeMs)

    const stopAtSec = audioContext.currentTime + fadeMs / 1000
    try {
      playback.source.stop(stopAtSec)
    } catch (_error) {
      disconnectBgmPlayback(playback)
      if (onFadeComplete !== undefined) {
        onFadeComplete()
      }
      return
    }

    fadingOutBgm = playback
    this.pendingBgmFadeTimer = setTimeout(() => {
      this.pendingBgmFadeTimer = null
      if (fadingOutBgm === playback) {
        fadingOutBgm = null
      }
      disconnectBgmPlayback(playback)
      if (onFadeComplete !== undefined) {
        onFadeComplete()
      }
    }, fadeMs + BGM_FADE_DISCONNECT_BUFFER_MS)
  }

  stopAllActiveSfx(): void {
    sfxCommandSequence = sfxCommandSequence + 1
    this.sfxPolicyTracker.reset()
    for (let index = 0; index < activeSfxList.length; index++) {
      const playback = activeSfxList[index]
      try {
        playback.source.stop()
      } catch (_error) {
        // 既に停止済み
      }
      try {
        playback.source.disconnect()
        playback.gainNode.disconnect()
      } catch (_error) {
        // 既に切断済み
      }
    }
    activeSfxList = []
  }

  stopAllSounds(scene: Phaser.Scene): void {
    this.stopSharedBgm()
    this.stopAllActiveSfx()
    try {
      scene.sound.stopAll()
    } catch (_error) {
      // Phaser Sound が無い／失敗しても続行
    }
  }

  isAnyBgmActive(): boolean {
    return sharedBgm !== null
  }

  isBgmKindActive(kind: string): boolean {
    return sharedBgm !== null && sharedBgm.kind === kind
  }

  getActiveBgmAudioKey(): string | null {
    if (sharedBgm === null) {
      return null
    }
    return sharedBgm.audioKey
  }

  startNativeBgm(
    scene: Phaser.Scene,
    audioKey: string,
    volume: number,
    kind: string,
    shouldLoop: boolean,
    fallbackAudioKey?: string,
    loopBounds?: BgmLoopBounds,
    forceRestart?: boolean,
  ): boolean {
    if (!scene.cache.audio.exists(audioKey)) {
      if (
        fallbackAudioKey &&
        audioKey !== fallbackAudioKey &&
        scene.cache.audio.exists(fallbackAudioKey)
      ) {
        audioKey = fallbackAudioKey
      } else {
        console.warn('BGM がキャッシュにありません:', audioKey)
        this.stopSharedBgm()
        return false
      }
    }

    if (
      forceRestart !== true &&
      sharedBgm !== null &&
      sharedBgm.kind === kind &&
      sharedBgm.audioKey === audioKey
    ) {
      this.applyGainToSharedBgm(volume)
      return true
    }

    const startToken = bgmCommandSequence

    const beginPlayback = (): void => {
      if (startToken !== bgmCommandSequence) {
        return
      }

      const audioContext = getAudioContextFromScene(scene)
      if (audioContext === null) {
        console.warn('AudioContext がありません')
        return
      }

      const audioBuffer = asAudioBuffer(scene.cache.audio.get(audioKey))
      if (audioBuffer === null) {
        console.warn('BGM の AudioBuffer が不正です:', audioKey)
        return
      }

      try {
        const targetVolume = this.bgmEnabled ? volume : 0
        const gainNode = audioContext.createGain()
        gainNode.gain.value = 0

        const source = audioContext.createBufferSource()
        source.buffer = audioBuffer
        source.loop = shouldLoop
        if (shouldLoop) {
          const loopRange = resolveBgmLoopRange(audioBuffer.duration, loopBounds)
          source.loopStart = loopRange.loopStart
          source.loopEnd = loopRange.loopEnd
        }
        source.connect(gainNode)
        gainNode.connect(audioContext.destination)
        source.start(0)

        if (targetVolume > 0) {
          scheduleGainFadeIn(audioContext, gainNode, targetVolume, this.bgmFadeMs)
        }

        sharedBgm = { source, gainNode, kind, audioKey }
      } catch (error) {
        console.warn('BGM の再生に失敗しました:', error)
        sharedBgm = null
      }
    }

    const needsFadeOut =
      sharedBgm !== null || fadingOutBgm !== null

    if (needsFadeOut) {
      this.stopSharedBgm({ onFadeComplete: beginPlayback })
      return true
    }

    beginPlayback()
    return true
  }

  applyGainToSharedBgm(volumeWhenEnabled: number): void {
    if (sharedBgm === null) {
      return
    }
    const volume = this.bgmEnabled ? volumeWhenEnabled : 0
    setGainImmediate(sharedBgm.gainNode, volume)
  }

  scheduleBgmStart(): number {
    bgmCommandSequence = bgmCommandSequence + 1
    return bgmCommandSequence
  }

  isBgmCommandCurrent(commandSeq: number): boolean {
    return commandSeq === bgmCommandSequence
  }

  playOneShot(scene: Phaser.Scene, soundKey: string, volume: number): void {
    this.unlockSceneAudio(scene)

    const audioContext = getAudioContextFromScene(scene)
    if (audioContext === null) {
      return
    }

    const audioBuffer = asAudioBuffer(scene.cache.audio.get(soundKey))
    if (audioBuffer === null || !this.sfxPolicyTracker.canPlay(soundKey)) {
      return
    }

    const commandSeq = sfxCommandSequence
    const baseVolume = Math.max(0, Math.min(1, volume))
    const playVolume = this.sfxPolicyTracker.applyVolumeJitter(baseVolume)
    const playRate = this.sfxPolicyTracker.applyRateJitter(1)
    this.sfxPolicyTracker.onPlayStarted(soundKey)

    const playNow = (): void => {
      if (commandSeq !== sfxCommandSequence) {
        this.sfxPolicyTracker.onPlayEnded(soundKey)
        return
      }

      try {
        const gainNode = audioContext.createGain()
        gainNode.gain.value = playVolume
        const source = audioContext.createBufferSource()
        source.buffer = audioBuffer
        source.playbackRate.value = playRate
        source.connect(gainNode)
        gainNode.connect(audioContext.destination)
        source.onended = () => {
          activeSfxList = activeSfxList.filter((item) => item.source !== source)
          this.sfxPolicyTracker.onPlayEnded(soundKey)
        }
        activeSfxList.push({ source, gainNode, soundKey })
        source.start(0)
      } catch (_error) {
        this.sfxPolicyTracker.onPlayEnded(soundKey)
        // 再生失敗時は無視
      }
    }

    if (audioContext.state === 'suspended') {
      void audioContext
        .resume()
        .then(() => playNow())
        .catch(() => playNow())
      return
    }

    playNow()
  }
}

let defaultSoundManager: SoundManager | null = null

export function getDefaultSoundManager(
  preferences: SoundPreferencesConfig,
): SoundManager {
  if (defaultSoundManager === null) {
    defaultSoundManager = new SoundManager(preferences)
  }
  return defaultSoundManager
}

export function isBgmEnabledViaManager(
  preferences: SoundPreferencesConfig,
): boolean {
  return getDefaultSoundManager(preferences).isBgmEnabled()
}

export type { BgmLoopBounds, SfxPlaybackPolicy }
