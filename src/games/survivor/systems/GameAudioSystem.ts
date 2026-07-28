// ============================================================
// Survivor ゲーム音声（効果音 + BGM）
// 汎用再生は core/audio/SoundManager、キー対応は survivor/audio 配下。
// ============================================================

import Phaser from 'phaser'
import {
  getDefaultSoundManager,
  isBgmEnabledViaManager,
  type SoundPreferencesConfig,
} from '../../../core/audio/SoundManager'
import {
  SFX_KEY_ENEMY_DEFEAT,
  SFX_KEY_ENEMY_HIT,
  SFX_KEY_ENEMY_BLOCKED,
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
  SFX_KEY_ORBITING_ORB_OBTAIN,
  SFX_KEY_ORBITING_ORB_HIT,
  SFX_KEY_ORBITING_ORB_SHATTER,
  ORBITING_ORB_HIT_SFX_COOLDOWN_MS,
  ORBITING_ORB_SHATTER_SFX_COOLDOWN_MS,
  PLAYER_FIRE_POWER_SFX_COOLDOWN_MS,
  ENEMY_DEFEAT_SFX_COOLDOWN_MS,
  COIN_PICKUP_SFX_COOLDOWN_MS,
  SFX_KEY_PLAYER_FIRE_POWER,
} from '../GameConstants'
import type { PlayerBulletStyle } from '../objects/PlayerBullet'
import {
  getSurvivorFireSfxKey,
  getSurvivorHitSfxKey,
} from '../audio/survivorBulletSfx'
import {
  resolveSurvivorSfxEventKey,
  SURVIVOR_SFX_EVENT_IDS,
  type SurvivorSfxEventId,
} from '../audio/sfxEvents'
import { getSurvivorBgmLoopBounds } from '../constants/bgmLoop'
import { SfxCooldownGate } from '../audio/SfxCooldownGate'

/** 開発時のみ Event→キー解決を確認する（通常再生の大量ログは出さない） */
const DEBUG_SFX_EVENTS = false

const SURVIVOR_SOUND_PREFERENCES: SoundPreferencesConfig = {
  bgmEnabledKey: BGM_ENABLED_STORAGE_KEY,
  defaultBgmEnabled: false,
}

let preferredBattleBgmKey = BGM_KEY

/** 設定の BGM ON/OFF（どこからでも参照可） */
export function isBgmEnabled(): boolean {
  return isBgmEnabledViaManager(SURVIVOR_SOUND_PREFERENCES)
}

export class GameAudioSystem {
  private scene: Phaser.Scene
  private readonly soundManager = getDefaultSoundManager(SURVIVOR_SOUND_PREFERENCES)
  private readonly sfxCooldownGate = new SfxCooldownGate()

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.soundManager.reloadPreferences()
  }

  unlock(): void {
    this.soundManager.unlockSceneAudio(this.scene)
  }

  /** 互換用。旧合成 SFX 準備の名残（現在は unlock のみ） */
  prepare(): void {
    this.unlock()
  }

  isBattleBgmActive(): boolean {
    return this.soundManager.isBgmKindActive('battle')
  }

  isAreaClearBgmActive(): boolean {
    return this.soundManager.isBgmKindActive('clear')
  }

  isAnyBgmActive(): boolean {
    return this.soundManager.isAnyBgmActive()
  }

  startBgm(audioKey: string = BGM_KEY): void {
    preferredBattleBgmKey = audioKey
    const commandSeq = this.soundManager.scheduleBgmStart()
    this.soundManager.whenAudioReady(this.scene, () => {
      if (!this.soundManager.isBgmCommandCurrent(commandSeq)) {
        return
      }
      const activeKey = this.soundManager.getActiveBgmAudioKey()
      if (
        this.soundManager.isBgmKindActive('battle') &&
        activeKey === audioKey
      ) {
        this.soundManager.applyGainToSharedBgm(BGM_VOLUME)
        return
      }
      this.soundManager.startNativeBgm(
        this.scene,
        audioKey,
        BGM_VOLUME,
        'battle',
        true,
        BGM_KEY,
        getSurvivorBgmLoopBounds(audioKey),
      )
    })
  }

  startTitleBgm(): void {
    const commandSeq = this.soundManager.scheduleBgmStart()
    this.soundManager.whenAudioReady(this.scene, () => {
      if (!this.soundManager.isBgmCommandCurrent(commandSeq)) {
        return
      }
      if (this.soundManager.isBgmKindActive('title')) {
        this.soundManager.applyGainToSharedBgm(TITLE_BGM_VOLUME)
        return
      }
      this.soundManager.startNativeBgm(
        this.scene,
        TITLE_BGM_KEY,
        TITLE_BGM_VOLUME,
        'title',
        true,
        undefined,
        getSurvivorBgmLoopBounds(TITLE_BGM_KEY),
      )
    })
  }

  startAreaClearBgm(): void {
    const commandSeq = this.soundManager.scheduleBgmStart()
    this.soundManager.whenAudioReady(this.scene, () => {
      if (!this.soundManager.isBgmCommandCurrent(commandSeq)) {
        return
      }
      const activeKey = this.soundManager.getActiveBgmAudioKey()
      if (
        this.soundManager.isBgmKindActive('clear') &&
        activeKey === AREA_CLEAR_BGM_KEY
      ) {
        this.soundManager.applyGainToSharedBgm(BGM_VOLUME)
        return
      }
      this.soundManager.startNativeBgm(
        this.scene,
        AREA_CLEAR_BGM_KEY,
        BGM_VOLUME,
        'clear',
        false,
      )
    })
  }

  forceRestartBattleBgm(): void {
    const commandSeq = this.soundManager.scheduleBgmStart()
    this.soundManager.whenAudioReady(this.scene, () => {
      if (!this.soundManager.isBgmCommandCurrent(commandSeq)) {
        return
      }
      this.soundManager.startNativeBgm(
        this.scene,
        preferredBattleBgmKey,
        BGM_VOLUME,
        'battle',
        true,
        BGM_KEY,
        getSurvivorBgmLoopBounds(preferredBattleBgmKey),
        true,
      )
    })
  }

  getBgmEnabled(): boolean {
    return this.soundManager.isBgmEnabled()
  }

  setBgmEnabled(enabled: boolean): void {
    this.soundManager.setBgmEnabled(enabled)

    if (this.soundManager.isAnyBgmActive()) {
      if (this.soundManager.isBgmKindActive('title')) {
        this.soundManager.applyGainToSharedBgm(TITLE_BGM_VOLUME)
      } else {
        this.soundManager.applyGainToSharedBgm(BGM_VOLUME)
      }
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

  stopBgm(): void {
    this.soundManager.stopSharedBgm()
  }

  stopAllSounds(): void {
    this.soundManager.stopAllSounds(this.scene)
  }

  playPlayerFire(bulletStyle: PlayerBulletStyle = 'powerOrb'): void {
    // Power 通常弾は skill.power.cast（playEvent）へ寄せる。属性弾は従来どおりキー再生。
    // Pierce / Ricochet が同じ powerOrb 発射経路を共有する間は cast も共有する。
    if (bulletStyle === 'powerOrb') {
      this.playEvent(SURVIVOR_SFX_EVENT_IDS.SKILL_POWER_CAST)
      return
    }
    const soundKey = getSurvivorFireSfxKey(bulletStyle)
    this.playSound(soundKey)
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

  playSfxByKey(soundKey: string, volume: number): void {
    this.playSound(soundKey, volume)
  }

  playBulletHit(bulletStyle: PlayerBulletStyle): void {
    // Power 通常弾命中は skill.power.impact。Pierce/Ricochet 後続も同じ経路の間は共有。
    // 将来: skill.pierce.impact / skill.ricochet.impact へ分離可能。
    if (bulletStyle === 'powerOrb') {
      this.playEvent(SURVIVOR_SFX_EVENT_IDS.SKILL_POWER_IMPACT)
      return
    }
    this.playSound(getSurvivorHitSfxKey(bulletStyle))
  }

  /** @deprecated playBulletHit('powerOrb') を使う */
  playEnergyOrbHit(_volumeScale: number = 1): void {
    this.playBulletHit('powerOrb')
  }

  /** @deprecated playBulletHit('waterOrb') を使う */
  playWaterOrbHit(_volumeScale: number = 1): void {
    this.playBulletHit('waterOrb')
  }

  playEnemyBlocked(): void {
    this.playSound(SFX_KEY_ENEMY_BLOCKED)
  }

  /**
   * 意味的 Event ID から既存 Runtime SFX キーへ解決して再生する。
   * クールダウン／音量ゆらぎは解決後のキーに対する共通方針で適用する（Event 専用 switch を増やさない）。
   */
  playEvent(eventId: SurvivorSfxEventId): void {
    const soundKey = resolveSurvivorSfxEventKey(eventId)
    if (DEBUG_SFX_EVENTS) {
      console.log(`[SFX Event] ${eventId} -> ${soundKey}`)
    }
    this.playResolvedRuntimeSfx(soundKey)
  }

  /**
   * Runtime SFX キーを再生する。高頻度キーは既存どおりゲート／ゆらぎを掛ける。
   * Python: key ごとの再生ポリシー dict を引いて適用するイメージ
   */
  private playResolvedRuntimeSfx(soundKey: string): void {
    if (soundKey === SFX_KEY_PLAYER_FIRE_POWER) {
      if (
        !this.sfxCooldownGate.shouldPlay(
          soundKey,
          PLAYER_FIRE_POWER_SFX_COOLDOWN_MS,
        )
      ) {
        return
      }
      const volumeScale = 0.94 + Math.random() * 0.1
      this.playSound(soundKey, SFX_VOLUME * volumeScale)
      return
    }

    if (soundKey === SFX_KEY_COIN_PICKUP) {
      if (
        !this.sfxCooldownGate.shouldPlay(
          SFX_KEY_COIN_PICKUP,
          COIN_PICKUP_SFX_COOLDOWN_MS,
        )
      ) {
        return
      }
      this.playSound(soundKey)
      return
    }

    if (soundKey === SFX_KEY_ENEMY_DEFEAT) {
      if (
        !this.sfxCooldownGate.shouldPlay(
          SFX_KEY_ENEMY_DEFEAT,
          ENEMY_DEFEAT_SFX_COOLDOWN_MS,
        )
      ) {
        return
      }
      const volumeScale = 0.92 + Math.random() * 0.12
      this.playSound(soundKey, SFX_VOLUME * volumeScale)
      return
    }

    this.playSound(soundKey)
  }

  playEnemyDefeat(): void {
    this.playResolvedRuntimeSfx(SFX_KEY_ENEMY_DEFEAT)
  }

  playCoinPickup(): void {
    this.playResolvedRuntimeSfx(SFX_KEY_COIN_PICKUP)
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

  /** Orbiting Orb 取得・展開（氷魔法が広がる音）。 */
  playOrbitingOrbObtain(): void {
    this.playSound(SFX_KEY_ORBITING_ORB_OBTAIN)
  }

  /** Orbiting Orb が敵に当たったとき（短い氷片）。高頻度はクールダウンで抑える。 */
  playOrbitingOrbHit(): void {
    if (
      !this.sfxCooldownGate.shouldPlay(
        SFX_KEY_ORBITING_ORB_HIT,
        ORBITING_ORB_HIT_SFX_COOLDOWN_MS,
      )
    ) {
      return
    }
    this.playSound(SFX_KEY_ORBITING_ORB_HIT)
  }

  /** Orbiting Orb が敵弾を消したとき（冷気でシュッ）。 */
  playOrbitingOrbShatter(): void {
    if (
      !this.sfxCooldownGate.shouldPlay(
        SFX_KEY_ORBITING_ORB_SHATTER,
        ORBITING_ORB_SHATTER_SFX_COOLDOWN_MS,
      )
    ) {
      return
    }
    this.playSound(SFX_KEY_ORBITING_ORB_SHATTER)
  }

  private playSound(soundKey: string, volumeOverride?: number): void {
    const playVolume =
      typeof volumeOverride === 'number'
        ? Math.max(0, Math.min(1, volumeOverride))
        : SFX_VOLUME
    this.soundManager.playOneShot(this.scene, soundKey, playVolume)
  }
}
