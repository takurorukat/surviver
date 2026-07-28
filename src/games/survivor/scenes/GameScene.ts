import Phaser from 'phaser'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  getStageDurationSeconds,
  PLAYER_HP,
  PLAYER_SPEED,
  PLAYER_ATTACK_DAMAGE,
  PLAYER_ATTACK_INTERVAL_MS,
  PLAYER_ATTACK_RANGE,
  FIRE_RATE_LEVEL_START,
  RANGE_LEVEL_START,
  MOVE_LEVEL_START,
  MAGNET_LEVEL_START,
  PIERCE_LEVEL_START,
  BLAST_LEVEL_START,
  ORBITING_ORB_LEVEL_START,
  RICOCHET_LEVEL_START,
  XP_BONUS_LEVEL_START,
  START_COUNTDOWN_STAGE1_OFFSET_Y,
  PLAY_AREA_ORIGIN_X,
  PLAY_AREA_ORIGIN_Y,
  PLAY_AREA_WIDTH,
  PLAY_AREA_HEIGHT,
  getXpProgressForLevel,
  getLevelFromTotalXp,
  XP_GAIN_EFFECT_DURATION_MS,
  COIN_MAGNET_RADIUS,
  calculateCoinMagnetRadius,
  calculateCarriedStageStartHp,
  DEFAULT_UNLOCKED_SKILL_LEVEL_CAP,
  calculateBulletMaxHits,
  resolvePlayerBulletStyle,
  FINAL_WAVE_REMAINING_SECONDS,
  getAreaStageCount,
  AUTO_GOLD_LEVEL_UP_CHAIN_DELAY_MS,
  RUNTIME_ENABLE_GOLD_AND_SHOP,
  calculatePierceLevelFromMoveAndSpeed,
  calculateBlastLevelFromPowerAndRange,
  calculateOrbitingOrbLevelFromMoveAndPickup,
  calculateRicochetLevelFromXpBonusPickupAndSpeed,
  ACHIEVEMENT_ID_PIERCE_UNLOCK,
  ACHIEVEMENT_ID_BLAST_UNLOCK,
  ACHIEVEMENT_ID_ORBITING_ORB_UNLOCK,
  ACHIEVEMENT_ID_RICOCHET_UNLOCK,
  FOREST_BGM_KEY,
  VOLCANO_BGM_KEY,
  RUINS_BGM_KEY,
  type StageAreaId,
} from '../GameConstants'
import {
  createPlayer,
  createPlayerWalkSprite,
  updatePlayerWalkSprite,
  type PlayerWalkVisual,
} from '../objects/Player'
import {
  createMovementKeys,
  applyPlayerMovement,
  createInitialMovementState,
  createPointerFollowMarker,
  destroyPointerFollowMarker,
  beginRelativePointerFollow,
  beginAbsolutePointerFollow,
  shouldUseRelativePointerFollow,
  endRelativePointerFollow,
  updateRelativeFollowAimOnly,
  shiftRelativeFollowBaseForDisplacement,
  suspendAbsoluteFollowUntilPointerMoves,
  type MovementKeys,
  type MovementState,
  type PlayAreaBounds,
  type PointerFollowMarker,
} from '../systems/PlayerMovementSystem'
import { stepArcadePhysicsOnce } from '../utils/arcadePhysicsHelpers'
import { HudSystem } from '../systems/HudSystem'
import { WaveSystem } from '../systems/WaveSystem'
import { updateEnemyChaseMovement } from '../systems/EnemyMovementSystem'
import { updateEnemyRangedAttacks, updateEarthRockAttacks } from '../systems/EnemyAttackSystem'
import {
  createPlayerDamageState,
  canPlayerTakeDamageNow,
  applyPlayerDamage,
  startPlayerKnockbackAwayFromEnemy,
  applyPlayerKnockbackIfActive,
  updatePlayerInvincibilityBlink,
  type PlayerDamageState,
} from '../systems/PlayerDamageSystem'
import { RangeDisplaySystem } from '../systems/RangeDisplaySystem'
import { HitboxDisplaySystem } from '../systems/HitboxDisplaySystem'
import {
  createPlayerAttackState,
  tryFireBulletAtNearestEnemy,
  updatePlayerBullets,
  type PlayerAttackState,
} from '../systems/PlayerAttackSystem'
import {
  createPlayerBulletGroup,
  advancePlayerBulletCollisionAge,
  maintainPlayerBulletVelocities,
  type PlayerBulletVisual,
} from '../objects/PlayerBullet'
import {
  createEnemyBulletGroup,
  advanceEnemyBulletCollisionAge,
  maintainEnemyBulletVelocities,
  updateEnemyBullets,
  destroyAllEnemyBullets,
  recycleEnemyBullet,
  type EnemyBulletVisual,
} from '../objects/EnemyBullet'
import {
  updateAllEnemyHpBars,
  updateAllEnemyWalkSprites,
} from '../objects/Enemy'
import { createCoinGroup, type CoinView } from '../objects/Coin'
import {
  createGoldCoinGroup,
  ensureGoldCoinAnimation,
  type GoldCoinView,
} from '../objects/GoldCoin'
import { createStageBackgroundAndFloor } from './game/createStageFloor'
import {
  updateSpecialEnemySpawns,
  spawnAreaBossIfNeeded,
} from './game/updateSpecialEnemySpawns'
import {
  canPlayerBulletHitEnemy,
  handleBulletEnemyHit,
  type PlayerBulletCombatContext,
} from '../systems/PlayerBulletCombatSystem'
import {
  checkStageClearConditions,
  updateClearCoinVacuum,
  showStageClearResult,
  type StageClearFlowContext,
} from '../systems/StageClearFlowSystem'
import { playXpGainVisualEffect } from '../systems/XpGainEffectSystem'
import { playGoldGainVisualEffect, playGoldCoinFlyToHud } from '../systems/GoldGainEffectSystem'
import { playStartCountdown, playResumeCountdown } from '../systems/StartCountdownSystem'
import {
  createOrientationGuide,
  type OrientationGuideView,
} from '../systems/OrientationGuideSystem'
import {
  updateCoinMagnetMovement,
} from '../systems/CoinMagnetSystem'
import { GameAudioSystem } from '../systems/GameAudioSystem'
import { SURVIVOR_SFX_EVENT_IDS } from '../audio/sfxEvents'
import {
  createBgmToggleButton,
  type BgmToggleButtonView,
} from '../systems/BgmToggleButtonSystem'
import { SettingsMenuSystem } from '../systems/SettingsMenuSystem'
import { ConfirmDialogSystem } from '../systems/ConfirmDialogSystem'
import {
  LevelUpChoiceSystem,
  hasNoNormalLevelUpChoices,
  type LevelUpChoiceId,
} from '../systems/LevelUpChoiceSystem'
import { StageResultSystem } from '../systems/StageResultSystem'
import {
  isSkillUnlocked,
} from '../systems/AchievementSystem'
import {
  clearRunProgress,
  recordRunStart,
  recordPlayerDeath,
  addGold,
  getPurchasedMaxHp,
  getPurchasedPowerCap,
  getPurchasedSpeedCap,
  getPurchasedRangeCap,
  getPurchasedPierceCap,
  getPurchasedBlastCap,
  getPurchasedXpBonusCap,
  unlockAchievement,
} from '../systems/UnlockSaveSystem'
import type { CarriedProgress } from '../types/CarriedProgress'
import { playFinalWaveBanner } from '../systems/FinalWaveBannerSystem'
import { playPierceUnlockBanner, playPierceLevelUpBanner } from '../systems/PierceUnlockBannerSystem'
import {
  playBlastUnlockBanner,
  playBlastLevelUpBanner,
} from '../systems/BlastUnlockBannerSystem'
import {
  playRicochetUnlockBanner,
  playRicochetLevelUpBanner,
} from '../systems/RicochetUnlockBannerSystem'
import {
  playOrbitingOrbUnlockBanner,
  playOrbitingOrbLevelUpBanner,
} from '../systems/OrbitingOrbUnlockBannerSystem'
import { OrbitingOrbSystem } from '../systems/OrbitingOrbSystem'
import { SurvivorAutoplayBridge } from '../dev/SurvivorAutoplayBridge'
import {
  playHpFullText,
  playAutoGoldLevelUpText,
  playPlayerHurtFlash,
} from '../systems/CombatFeedbackSystem'

// =============================================================================
// GameScene — ゲーム本編（サバイバーの「戦場」そのもの）
//
// 【このファイルの役割】
//   ランタイム状態（HP・XP・レベル・成長・一時停止フラグなど）を唯一保持する司令塔。
//   実際の細かい処理は systems/ や objects/ に任せ、ここは「いつ何を呼ぶか」を決める。
//
// 【起動の流れ】
//   TitleScene.startGame → scene.start('GameScene', { stageNumber })
//   クリア後の次ステージ → scene.restart({ stageNumber+1, carriedProgress })
//   死亡リトライ → scene.restart({ stageNumber: 1 }) ※成長は引き継がない
//
// 【1フレームのループ（update）の大まかな順序】
//   1. 死亡／クリア確定／バナー／コイン吸引／レベルアップ中なら早期 return
//      （HUD 更新や停止処理だけ行う）
//   2. ステージ進行中なら:
//        タイマー → 敵移動 → 弾の年齢更新 → プレイヤー攻撃 → 敵の射撃
//        → 弾の寿命更新 → コイン吸引 → 無敵点滅 → クリア条件チェック
//   3. HUD / 射程円 / ヒットボックス表示を更新
//   4. ノックバック中でなければプレイヤー移動（PlayerMovementSystem）
//   5. stepArcadePhysicsOnce で物理を1回だけ進める
//      ※ overlap（当たり判定）は物理ステップ内で発火する
//   6. 敵 HP バーを物理後の位置に合わせる
//
// 【このシーンが所有・連携する主なシステム】
//   - HudSystem …………… HP / XP / タイマー / ステータス表示
//   - WaveSystem ………… 敵の出現スケジュール（通常＋ファイナルウェーブ）
//   - PlayerMovementSystem … WASD／ポインタ追従（速度は currentMoveSpeed のみ）
//   - PlayerAttackSystem … 最寄り敵への自動射撃
//   - PlayerDamageSystem … 被ダメ・無敵・ノックバック
//   - EnemyMovementSystem / EnemyAttackSystem … 敵の追従と射撃
//   - CoinMagnetSystem … 通常吸引＆クリア時の全画面吸引
//   - LevelUpChoiceSystem / StageResultSystem … UI 一時停止と結果画面
//   - GameAudioSystem … BGM / SE
//   - RangeDisplaySystem / HitboxDisplaySystem … デバッグ寄りの可視化
//
// 【当たり判定の約束】
//   プレイヤー弾↔敵、敵弾↔プレイヤー、プレイヤー↔敵、プレイヤー↔コインは
//   すべて physics.add.overlap。距離計算で判定しない。
// =============================================================================

// ステージ跨ぎで引き継ぐ成長データ（CarriedProgress.ts と同型）
// 死亡リトライ時は渡さない

// scene.start / restart で渡される引数の形
type GameSceneData = {
  stageNumber?: number
  carriedProgress?: CarriedProgress
  areaId?: StageAreaId
  // WASD モードを次ステージへ引き継ぐ
  isKeyboardMode?: boolean
}

export class GameScene extends Phaser.Scene {
  // --- ステージ・プレイヤー実体 ---
  private stageNumber = 1
  private areaId: StageAreaId = 'plains'
  // そのエリアのステージ総数（Plains=3, Forest=5）。最終難易度・クリア判定に使う
  private areaStageCount = 3
  private player!: Phaser.GameObjects.Rectangle
  private playerBody!: Phaser.Physics.Arcade.Body
  // プレイヤーの見た目（歩行＋黒枠＋呼吸）。物理・当たり判定は player 側が持つ
  private playerWalkSprite!: PlayerWalkVisual
  private enemyGroup!: Phaser.Physics.Arcade.Group
  private coinGroup!: Phaser.Physics.Arcade.Group
  private goldCoinGroup!: Phaser.Physics.Arcade.Group
  private playerBulletGroup!: Phaser.Physics.Arcade.Group
  private enemyBulletGroup!: Phaser.Physics.Arcade.Group

  // --- 移動・被ダメ・攻撃の内部状態 ---
  private movementKeys!: MovementKeys
  private movementState: MovementState = createInitialMovementState(true)
  private pointerFollowMarker: PointerFollowMarker | null = null
  private orientationGuide: OrientationGuideView | null = null
  private scaleResizeHandler: ((gameSize: Phaser.Structs.Size) => void) | null = null
  // scene.restart 前に渡されたキーボードモード（resetStageState で復元）
  // 新規開始のデフォルトはキーボードモード（止まっている）。クリック／タップでポインタ追従へ
  private pendingKeyboardMode = true
  private damageState: PlayerDamageState = createPlayerDamageState()
  private attackState: PlayerAttackState = createPlayerAttackState()

  // --- 成長パラメータ（アイテムで変える速度は currentMoveSpeed だけ） ---
  private currentMoveSpeed = PLAYER_SPEED
  private currentAttackDamage = PLAYER_ATTACK_DAMAGE
  private currentFireRateLevel = FIRE_RATE_LEVEL_START
  private currentRangeLevel = RANGE_LEVEL_START
  private currentMoveLevel = MOVE_LEVEL_START
  private currentMagnetLevel = MAGNET_LEVEL_START
  private currentMagnetRadius = COIN_MAGNET_RADIUS
  private currentAttackIntervalMs = PLAYER_ATTACK_INTERVAL_MS
  private currentAttackRange = PLAYER_ATTACK_RANGE
  private currentPierceLevel = PIERCE_LEVEL_START
  private currentBlastLevel = BLAST_LEVEL_START
  private currentOrbitingOrbLevel = ORBITING_ORB_LEVEL_START
  private currentRicochetLevel = RICOCHET_LEVEL_START
  private currentXpBonusLevel = XP_BONUS_LEVEL_START

  // --- 所有するシステムインスタンス ---
  private hudSystem!: HudSystem
  private waveSystem!: WaveSystem
  private orbitingOrbSystem!: OrbitingOrbSystem
  /** 開発専用 E2E Bot（?e2e=1 のときだけ生成） */
  private autoplayBridge: SurvivorAutoplayBridge | null = null
  private rangeDisplaySystem!: RangeDisplaySystem
  private hitboxDisplaySystem!: HitboxDisplaySystem
  private gameAudioSystem!: GameAudioSystem
  private bgmToggleButton: BgmToggleButtonView | null = null
  private settingsMenuSystem!: SettingsMenuSystem
  private confirmDialogSystem!: ConfirmDialogSystem
  private levelUpChoiceSystem!: LevelUpChoiceSystem
  private stageResultSystem!: StageResultSystem
  // 設定メニューを開く前に time.paused だったか（閉じたときの復元用）
  private wasTimePausedBeforeSettings = false
  // 実績パネルを開く前の停止状態（閉じたときに誤って再開しないため）
  private wasTimePausedBeforeAchievements = false
  private isAchievementsPaused = false

  // --- タイマー・HP・XP ---
  private stageElapsedMs = 0
  private remainingSeconds = getStageDurationSeconds(1)
  private currentHp = PLAYER_HP
  private maxHp = PLAYER_HP
  private currentLevel = 1
  private totalXp = 0
  // XP バー表示用の補間値（実際の totalXp とは別にトゥイーンで追従）
  private displayedTotalXp = 0
  private xpBarTween: Phaser.Tweens.Tween | null = null
  // まだ選択 UI を出していないレベルアップ残回数
  private pendingLevelUps = 0

  // --- 一時停止・クリア演出フラグ ---
  private isLevelUpPaused = false
  // レベルアップ選択後の再開カウントダウン中（プレイヤー・敵とも動かない）
  private isResumeCountdownActive = false
  // ステージ開始の 3・2・1・START 中（狙い点だけ操作可）
  private isStartCountdownActive = false
  private isStageActive = false
  private isPlayerDead = false
  private isStageSettled = false
  private isStageClearBannerPlaying = false
  private isClearCoinVacuum = false
  private waitingToShowStageClear = false
  private clearCoinVacuumEmptySinceMs = 0
  private hasStartedFinalWave = false

  // --- 実績判定用（1ラン通しの記録） ---
  private tookDamageThisRun = false
  // ゴールド2倍判定用。各ステージ開始時にリセットする
  private tookDamageThisStage = false
  private pickedPowerThisRun = false
  private pickedPierceThisRun = false
  private pickedBlastThisRun = false
  // このステージの報酬で Shop が初めて開いた（結果画面に出す）
  private pendingShopUnlockNotify = false
  private pierceAvailableAtRunStart = false
  private blastAvailableAtRunStart = false
  private carriedProgress: CarriedProgress | null = null

  // プレイ可能な四角形エリア（移動・物理ワールド境界と一致）
  private playAreaBounds: PlayAreaBounds = {
    left: PLAY_AREA_ORIGIN_X,
    top: PLAY_AREA_ORIGIN_Y,
    width: PLAY_AREA_WIDTH,
    height: PLAY_AREA_HEIGHT,
  }

  // 役割: シーン名を 'GameScene' として登録する
  // 呼び出し元: Phaser / 呼び出し先: Phaser.Scene のコンストラクタ
  constructor() {
    super({ key: 'GameScene' })
  }

  // 役割: Arcade 物理ワールドを型付きで取り出す（stepArcadePhysicsOnce 用）
  // 呼び出し元: update / updateClearCoinVacuum
  // 呼び出し先: this.physics.world
  private get arcadeWorld(): Phaser.Physics.Arcade.World {
    return this.physics.world as Phaser.Physics.Arcade.World
  }

  // 役割: scene.start / restart の引数を受け取り、ステージ番号と引き継ぎ成長を覚える
  // 呼び出し元: Phaser（create より前に1回）
  // 呼び出し先: なし（フィールドへ代入のみ）
  init(data: GameSceneData): void {
    if (data.stageNumber !== undefined) {
      this.stageNumber = data.stageNumber
    } else {
      this.stageNumber = 1
    }

    if (data.carriedProgress !== undefined) {
      this.carriedProgress = data.carriedProgress
    } else {
      this.carriedProgress = null
    }

    if (data.areaId !== undefined) {
      this.areaId = data.areaId
    } else {
      this.areaId = 'plains'
    }
    this.areaStageCount = getAreaStageCount(this.areaId)

    // 次ステージ引き継ぎ以外は、最初はキーボードモード（止まっている）
    if (data.isKeyboardMode === false) {
      this.pendingKeyboardMode = false
    } else {
      this.pendingKeyboardMode = true
    }
  }

  // 役割: ステージ開始時にワールド・グループ・入力・overlap・システムをすべて組み立てる
  // 呼び出し元: Phaser（シーン開始時）
  // 呼び出し先: resetStageState, create* / setup*, beginStageWithCountdown など多数
  create(): void {
    this.resetStageState()
    this.gameAudioSystem = new GameAudioSystem(this)
    this.confirmDialogSystem = new ConfirmDialogSystem(this)
    this.settingsMenuSystem = new SettingsMenuSystem(this, {
      mode: 'game',
      audioSystem: this.gameAudioSystem,
      onGiveUp: () => {
        this.openGiveUpConfirmDialog()
      },
      onOpen: () => {
        this.wasTimePausedBeforeSettings = this.time.paused
        this.time.paused = true
        if (this.playerBody !== undefined) {
          this.playerBody.setVelocity(0, 0)
        }
        // レベルアップ中に設定を開いたら、SPACE がレベルアップ決定にならないよう止める
        if (this.levelUpChoiceSystem !== undefined && this.levelUpChoiceSystem.isOpen()) {
          this.levelUpChoiceSystem.setKeyboardEnabled(false)
        }
      },
      onClose: () => {
        // 確認ダイアログ表示中はポーズを維持する
        if (this.confirmDialogSystem.isOpen()) {
          this.time.paused = true
          return
        }
        if (
          !this.wasTimePausedBeforeSettings &&
          !this.isLevelUpPaused &&
          !this.isResumeCountdownActive &&
          !this.isStageSettled &&
          !this.isPlayerDead
        ) {
          this.time.paused = false
        }
        // 設定を閉じたら、レベルアップ選択のキー入力を戻す
        if (this.levelUpChoiceSystem !== undefined && this.levelUpChoiceSystem.isOpen()) {
          this.levelUpChoiceSystem.setKeyboardEnabled(true)
        }
        // 設定を閉じたあと BGM が完全に止まっていたら再開する。
        // クリア BGM などが鳴っている場合／再開カウントダウン中はそのまま
        if (
          !this.isResumeCountdownActive &&
          !this.isLevelUpPaused &&
          !this.gameAudioSystem.isAnyBgmActive()
        ) {
          this.startAreaBattleBgm()
        }
      },
      onCancelled: () => {
        this.gameAudioSystem.playMenuCancel()
      },
      onSelectionChanged: () => {
        this.gameAudioSystem.playMenuMove()
      },
    })
    this.hudSystem = new HudSystem(
      this,
      () => {
        this.settingsMenuSystem.toggle()
      },
      () => {
        this.pauseGameForAchievements()
        if (this.levelUpChoiceSystem !== undefined && this.levelUpChoiceSystem.isOpen()) {
          this.levelUpChoiceSystem.setKeyboardEnabled(false)
        }
      },
      () => {
        this.resumeGameAfterAchievements()
        if (this.levelUpChoiceSystem !== undefined && this.levelUpChoiceSystem.isOpen()) {
          this.levelUpChoiceSystem.setKeyboardEnabled(true)
        }
      },
    )
    this.hudSystem.create()
    this.setupSettingsHotkey()
    createStageBackgroundAndFloor(this, this.areaId, this.stageNumber, this.areaStageCount)
    this.setupPhysicsWorld()
    this.createEnemyGroup()
    this.createCoinGroup()
    this.createGoldCoinGroup()
    this.createPlayerBulletGroup()
    this.createEnemyBulletGroup()
    this.createPlayerAndKeys()
    this.setupMovementInput()
    this.setupPlayerEnemyOverlap()
    this.setupPlayerEnemyBulletOverlap()
    this.setupBulletEnemyOverlap()
    this.setupPlayerBulletEnemyBulletOverlap()
    this.setupCoinPickupOverlap()
    this.setupGoldCoinPickupOverlap()
    this.setupFixedCamera()
    this.setupScaleResize()
    this.orientationGuide = createOrientationGuide(this)
    this.setupRangeDisplay()
    this.setupAudio()
    // タイトルと同じ右下の BGM ON/OFF スイッチ
    // レベルアップ選択中はトグルしない（クリックで戦闘 BGM が始まらないようにする）
    this.bgmToggleButton = createBgmToggleButton(
      this,
      this.gameAudioSystem,
      undefined,
      () => {
        if (this.isLevelUpPaused) {
          return false
        }
        if (
          this.levelUpChoiceSystem !== undefined &&
          this.levelUpChoiceSystem.isOpen()
        ) {
          return false
        }
        return true
      },
    )
    this.levelUpChoiceSystem = new LevelUpChoiceSystem(this, () => {
      this.gameAudioSystem.playMenuMove()
    }, () => {
      this.gameAudioSystem.playEvent(
        SURVIVOR_SFX_EVENT_IDS.PROGRESSION_LEVEL_UP_CHOICE_CONFIRM,
      )
    })
    this.stageResultSystem = new StageResultSystem(this)
    // 自動物理更新を止め、update 内で stepArcadePhysicsOnce を自分で呼ぶ
    this.physics.disableUpdate()
    this.waveSystem = new WaveSystem(
      this,
      this.enemyGroup,
      this.stageNumber,
      this.areaStageCount,
      this.areaId,
      () => ({ x: this.player.x, y: this.player.y }),
    )
    this.orbitingOrbSystem = new OrbitingOrbSystem(this)
    this.orbitingOrbSystem.setupOverlap(this.enemyGroup)
    this.orbitingOrbSystem.setupEnemyBulletOverlap(this.enemyBulletGroup)
    this.orbitingOrbSystem.setAudioHooks({
      playObtain: () => {
        this.gameAudioSystem.playOrbitingOrbObtain()
      },
      playHit: () => {
        this.gameAudioSystem.playOrbitingOrbHit()
      },
      playShatter: () => {
        this.gameAudioSystem.playOrbitingOrbShatter()
      },
    })
    this.orbitingOrbSystem.resetHitHistory()
    this.orbitingOrbSystem.syncLevel(this.currentOrbitingOrbLevel)
    this.orbitingOrbSystem.setAttackDamage(this.currentAttackDamage)
    this.updateHudDisplay()
    this.beginStageWithCountdown()

    // 開発専用: ?e2e=1 のときだけ自動プレイ Bridge を接続する
    this.autoplayBridge = SurvivorAutoplayBridge.createIfEnabled({
      getSceneKey: () => this.scene.key,
      isSceneActive: () => this.isStageActive,
      getElapsedMs: () => this.stageElapsedMs,
      getPlayerHp: () => this.currentHp,
      getPlayerLevel: () => this.currentLevel,
      getPlayerX: () => this.player.x,
      getPlayerY: () => this.player.y,
      getPlayAreaLeft: () => this.playAreaBounds.left,
      getPlayAreaTop: () => this.playAreaBounds.top,
      getPlayAreaWidth: () => this.playAreaBounds.width,
      getPlayAreaHeight: () => this.playAreaBounds.height,
      getEnemyChildren: () => this.enemyGroup.getChildren(),
      isLevelUpOpen: () =>
        this.levelUpChoiceSystem !== undefined && this.levelUpChoiceSystem.isOpen(),
      isGameOver: () => this.isPlayerDead,
      confirmLevelUpFirstChoice: () => {
        if (this.levelUpChoiceSystem === undefined) {
          return false
        }
        return this.levelUpChoiceSystem.confirmFirstChoice()
      },
    })

    // Stage 1 の新規開始だけトライ回数に数える（次ステージ引き継ぎは数えない）
    if (this.stageNumber === 1 && this.carriedProgress === null) {
      recordRunStart()
    }
  }

  // 役割: バトル中は ESC で設定を開閉（歯車クリックと同じ）
  // keydown-ESC を使い、メニュー側とキーを共有して取りこぼさない
  private setupSettingsHotkey(): void {
    if (this.input.keyboard === null) {
      return
    }

    this.input.keyboard.on('keydown-ESC', () => {
      this.handleSettingsHotkey()
    })
  }

  private handleSettingsHotkey(): void {
    if (this.confirmDialogSystem !== undefined && this.confirmDialogSystem.isOpen()) {
      return
    }
    if (this.isStageSettled || this.isPlayerDead) {
      return
    }
    if (this.settingsMenuSystem === undefined) {
      return
    }
    // すでに開いているときは SettingsMenuSystem の ESC で閉じる
    if (this.settingsMenuSystem.isMenuOpen()) {
      return
    }

    this.settingsMenuSystem.toggle()
  }

  // 役割: Give Up の確認ダイアログ（初期選択 NO）
  private openGiveUpConfirmDialog(): void {
    this.time.paused = true
    this.confirmDialogSystem.show({
      title: 'Return to Title?',
      message: 'Leave this run and return to the title?\nCurrent stage progress will be lost.',
      yesLabel: 'Yes return to title',
      onYes: () => {
        this.giveUpToTitle()
      },
      onNo: () => {
        if (
          !this.wasTimePausedBeforeSettings &&
          !this.isLevelUpPaused &&
          !this.isResumeCountdownActive &&
          !this.isStageSettled &&
          !this.isPlayerDead
        ) {
          this.time.paused = false
        }
      },
    })
  }

  // 役割: 設定メニューから諦めてタイトルへ戻る
  private giveUpToTitle(): void {
    this.time.paused = false
    this.isStageActive = false
    this.waveSystem.stopWaves()
    this.gameAudioSystem.stopAllSounds()
    clearRunProgress()
    this.scene.start('TitleScene')
  }

  // 役割: カウントダウン演出のあと、ウェーブ開始してステージを「進行中」にする
  // 呼び出し元: create
  // 呼び出し先: playStartCountdown → コールバックで waveSystem.startWaves
  private beginStageWithCountdown(): void {
    let countdownCenterY = GAME_HEIGHT / 2
    if (this.stageNumber === 1) {
      // 上に余白を取るため、数字を下へずらす
      countdownCenterY = countdownCenterY + START_COUNTDOWN_STAGE1_OFFSET_Y
    }

    this.isStartCountdownActive = true
    playStartCountdown(this, GAME_WIDTH / 2, countdownCenterY, () => {
      this.isStartCountdownActive = false
      this.isStageActive = true
      this.stageElapsedMs = 0
      spawnAreaBossIfNeeded({
        scene: this,
        areaId: this.areaId,
        stageNumber: this.stageNumber,
        areaStageCount: this.areaStageCount,
        enemyGroup: this.enemyGroup,
        nowMs: this.time.now,
        getPlayerPosition: () => {
          return { x: this.player.x, y: this.player.y }
        },
      })
      this.waveSystem.startWaves()
    })
  }

  // 役割: 毎フレームの司令塔。進行状態に応じて戦闘／移動／物理／HUD を回す
  // 呼び出し元: Phaser（毎フレーム）
  // 呼び出し先: update* 系, applyPlayerMovement, stepArcadePhysicsOnce,
  //             updateAllEnemyHpBars, stopAllMovingBodies など
  update(): void {
    // 設定メニュー側でBGMを切り替えた場合も、右下アイコンへすぐ反映する
    this.bgmToggleButton?.refresh()

    // 開発専用 E2E: 毎フレーム状態更新とレベルアップ自動選択
    if (this.autoplayBridge !== null) {
      this.autoplayBridge.onFrame()
    }

    // ポーズ中も含めて毎フレーム、見た目スプライトを物理位置に追従させる
    if (this.playerWalkSprite !== undefined) {
      updatePlayerWalkSprite(this.playerWalkSprite, this.player, this.playerBody)
    }
    if (this.enemyGroup !== undefined) {
      updateAllEnemyWalkSprites(this.enemyGroup, this.player.x)
    }

    if (this.isAchievementsPaused) {
      this.updateHudDisplay()
      this.stopAllMovingBodies()
      return
    }

    if (this.confirmDialogSystem !== undefined && this.confirmDialogSystem.isOpen()) {
      this.updateHudDisplay()
      this.stopAllMovingBodies()
      return
    }

    if (this.settingsMenuSystem !== undefined && this.settingsMenuSystem.isMenuOpen()) {
      this.updateHudDisplay()
      this.stopAllMovingBodies()
      return
    }

    if (this.isPlayerDead) {
      this.updateHudDisplay()
      this.stopAllMovingBodies()
      return
    }

    if (this.isStageSettled) {
      this.updateHudDisplay()
      // クリア結果表示中もマウス追従モードは消さない（次ステージへ引き継ぐ）
      this.stopAllMovingBodies({ keepRelativeFollow: true })
      return
    }

    // クリア演出中（大きな文字 → コイン吸引）は戦闘を止める
    if (this.isStageClearBannerPlaying) {
      this.updateHudDisplay()
      this.stopAllMovingBodies({ keepRelativeFollow: true })
      return
    }

    if (this.isClearCoinVacuum) {
      updateClearCoinVacuum(this.buildStageClearFlowContext())
      return
    }

    // レベルアップ選択中は完全停止。カウントダウン中は移動だけ止め、狙い点は操作可
    if (this.isLevelUpPaused) {
      this.updateHudDisplay()
      this.updateRangeDisplay()
      this.updateHitboxDisplay()
      // マウス追従は維持（キーボードを押すまで続く）。速度だけ止める
      this.stopAllMovingBodies({ keepRelativeFollow: true })
      return
    }
    if (this.isResumeCountdownActive || this.isStartCountdownActive) {
      this.updateHudDisplay()
      this.updateRangeDisplay()
      this.updateHitboxDisplay()
      // 相対追従の目標点だけ更新（キャラ・敵は動かさない）
      this.stopAllMovingBodies({ keepRelativeFollow: true })
      updateRelativeFollowAimOnly(
        this,
        this.movementState,
        this.playAreaBounds,
        this.pointerFollowMarker,
      )
      return
    }

    if (this.isStageActive) {
      this.updateStageTimer()
      this.updateEnemyMovement()
      // 既存の弾だけ年齢を進めてから発射する（新規弾は age=0 のまま物理へ）
      advancePlayerBulletCollisionAge(this.playerBulletGroup)
      advanceEnemyBulletCollisionAge(this.enemyBulletGroup)
      this.updateOrbitingOrbs()
      this.updatePlayerAttack()
      this.updateEnemyRangedAttack()
      updateSpecialEnemySpawns({
        scene: this,
        areaId: this.areaId,
        stageNumber: this.stageNumber,
        areaStageCount: this.areaStageCount,
        enemyGroup: this.enemyGroup,
        nowMs: this.time.now,
      })
      updatePlayerBullets(this.playerBulletGroup)
      updateEnemyBullets(this.enemyBulletGroup)
      this.updateCoinMagnet()
      this.updateInvincibilityBlink()
      checkStageClearConditions(this.buildStageClearFlowContext())
    }

    this.updateHudDisplay()
    this.updateRangeDisplay()
    this.updateHitboxDisplay()

    // ノックバック中は通常移動で速度を上書きしない
    const playerXBeforePhysics = this.player.x
    const playerYBeforePhysics = this.player.y
    const isKnockbackActive = applyPlayerKnockbackIfActive(
      this.playerBody,
      this.damageState,
      this.game.loop.delta,
    )
    if (!isKnockbackActive) {
      if (this.autoplayBridge !== null) {
        const moveVector = this.autoplayBridge.getMoveVector(this.time.now)
        this.playerBody.setVelocity(
          moveVector.x * this.currentMoveSpeed,
          moveVector.y * this.currentMoveSpeed,
        )
      } else {
        applyPlayerMovement(
          this,
          this.player,
          this.playerBody,
          this.movementKeys,
          this.movementState,
          this.playAreaBounds,
          this.currentMoveSpeed,
          this.game.loop.delta / 1000,
          this.pointerFollowMarker,
        )
      }
    }

    // 物理はここだけで1回。overlap コールバックもこの中で発火する
    stepArcadePhysicsOnce(this.arcadeWorld, this.time.now, this.game.loop.delta)

    // ノックバックで強制移動した分、相対追従の基準もずらす
    // （押したときの位置へ引き戻されないようにする）
    if (isKnockbackActive) {
      shiftRelativeFollowBaseForDisplacement(
        this.movementState,
        this.player.x - playerXBeforePhysics,
        this.player.y - playerYBeforePhysics,
      )
    }

    // 物理移動後の位置に HP バーを合わせる
    updateAllEnemyHpBars(this.enemyGroup)
    updateAllEnemyWalkSprites(this.enemyGroup, this.player.x)
  }

  // 役割: シーン終了時の片付け（物理の自動更新を戻し、ウェーブタイマーを止める）
  // 呼び出し元: Phaser（シーン切替・restart 時）
  // 呼び出し先: this.physics.enableUpdate, waveSystem.stopWaves
  // 補足: ステージ遷移では BGM を止めない（共有1本を継続）。止めたいときは明示的に stopBgm
  shutdown(): void {
    if (this.autoplayBridge !== null) {
      this.autoplayBridge.destroy()
      this.autoplayBridge = null
    }
    if (this.orbitingOrbSystem !== undefined) {
      this.orbitingOrbSystem.destroy()
    }
    this.physics.enableUpdate()
    destroyPointerFollowMarker(this.pointerFollowMarker)
    this.pointerFollowMarker = null
    if (this.orientationGuide !== null) {
      this.orientationGuide.destroy()
      this.orientationGuide = null
    }
    if (this.scaleResizeHandler !== null) {
      this.scale.off('resize', this.scaleResizeHandler)
      this.scaleResizeHandler = null
    }
    if (this.waveSystem !== undefined) {
      this.waveSystem.stopWaves()
    }
  }

  // 役割: ステージ開始時にフラグ・HP・攻撃状態などを初期化し、成長は引き継ぎ or リセット
  // 呼び出し元: create
  // 呼び出し先: applyCarriedProgress または resetPlayerProgress
  private resetStageState(): void {
    this.remainingSeconds = getStageDurationSeconds(this.stageNumber)
    this.stageElapsedMs = 0
    const purchasedMaxHp = getPurchasedMaxHp()
    this.currentHp = purchasedMaxHp
    this.maxHp = purchasedMaxHp
    this.xpBarTween = null
    this.pendingLevelUps = 0
    this.isLevelUpPaused = false
    this.isResumeCountdownActive = false
    this.isStartCountdownActive = false
    this.isStageActive = false
    this.isPlayerDead = false
    this.isStageSettled = false
    this.isStageClearBannerPlaying = false
    this.isClearCoinVacuum = false
    this.waitingToShowStageClear = false
    this.clearCoinVacuumEmptySinceMs = 0
    this.hasStartedFinalWave = false
    this.tookDamageThisStage = false
    this.movementState = createInitialMovementState(this.pendingKeyboardMode)
    this.damageState = createPlayerDamageState()
    this.attackState = createPlayerAttackState()

    // 次ステージへ進んだときだけ成長を引き継ぐ。死亡リトライや新規開始は初期値
    if (this.carriedProgress !== null) {
      this.applyCarriedProgress(this.carriedProgress)
      this.carriedProgress = null
      return
    }

    this.resetPlayerProgress()
    this.tookDamageThisRun = false
    this.pickedPowerThisRun = false
    this.pickedPierceThisRun = false
    this.pickedBlastThisRun = false
    // ラン開始時点の解放状態を記録
    this.pierceAvailableAtRunStart = isSkillUnlocked('pierce')
    this.blastAvailableAtRunStart = isSkillUnlocked('blast')
  }

  // 役割: レベル・XP・攻撃／移動パラメータをゲーム開始時の初期値に戻す
  // 呼び出し元: resetStageState（引き継ぎなしのとき）
  // 呼び出し先: なし
  private resetPlayerProgress(): void {
    this.currentLevel = 1
    this.totalXp = 0
    this.displayedTotalXp = 0
    this.currentMoveSpeed = PLAYER_SPEED
    this.currentAttackDamage = PLAYER_ATTACK_DAMAGE
    this.currentFireRateLevel = FIRE_RATE_LEVEL_START
    this.currentRangeLevel = RANGE_LEVEL_START
    this.currentMoveLevel = MOVE_LEVEL_START
    this.currentMagnetLevel = MAGNET_LEVEL_START
    this.currentMagnetRadius = calculateCoinMagnetRadius(MAGNET_LEVEL_START)
    this.currentAttackIntervalMs = PLAYER_ATTACK_INTERVAL_MS
    this.currentAttackRange = PLAYER_ATTACK_RANGE
    this.currentPierceLevel = PIERCE_LEVEL_START
    this.currentBlastLevel = BLAST_LEVEL_START
    this.currentOrbitingOrbLevel = ORBITING_ORB_LEVEL_START
    this.currentRicochetLevel = RICOCHET_LEVEL_START
    this.currentXpBonusLevel = XP_BONUS_LEVEL_START
  }

  // 役割: 前ステージから渡された成長データをフィールドへ書き戻す
  // 呼び出し元: resetStageState
  // 呼び出し先: なし
  private applyCarriedProgress(progress: CarriedProgress): void {
    this.currentLevel = progress.currentLevel
    this.totalXp = progress.totalXp
    this.displayedTotalXp = progress.totalXp
    this.currentMoveSpeed = progress.currentMoveSpeed
    this.currentAttackDamage = progress.currentAttackDamage
    this.currentFireRateLevel = progress.currentFireRateLevel
    this.currentRangeLevel = progress.currentRangeLevel
    this.currentMoveLevel = progress.currentMoveLevel
    this.currentMagnetLevel = progress.currentMagnetLevel
    this.currentMagnetRadius = progress.currentMagnetRadius
    this.maxHp = progress.maxHp
    this.currentHp = calculateCarriedStageStartHp(
      this.areaId,
      progress.currentHp,
      this.maxHp,
    )
    this.currentAttackIntervalMs = progress.currentAttackIntervalMs
    this.currentAttackRange = progress.currentAttackRange
    this.currentPierceLevel = progress.currentPierceLevel
    this.currentBlastLevel = progress.currentBlastLevel
    this.currentOrbitingOrbLevel = progress.currentOrbitingOrbLevel
    this.currentRicochetLevel = progress.currentRicochetLevel
    this.currentXpBonusLevel = progress.currentXpBonusLevel
    this.tookDamageThisRun = progress.tookDamageThisRun
    this.pickedPowerThisRun = progress.pickedPowerThisRun
    this.pickedPierceThisRun = progress.pickedPierceThisRun
    this.pickedBlastThisRun = progress.pickedBlastThisRun
    this.pierceAvailableAtRunStart = progress.pierceAvailableAtRunStart
    this.blastAvailableAtRunStart = progress.blastAvailableAtRunStart
  }

  // 役割: 次ステージ restart 用に、今の成長状態をスナップショットする
  // 呼び出し元: showStageClearResult（クリア後の「次へ」コールバック）
  // 呼び出し先: なし（オブジェクトを返すだけ）
  private createCarriedProgress(): CarriedProgress {
    return {
      currentLevel: this.currentLevel,
      totalXp: this.totalXp,
      currentAttackDamage: this.currentAttackDamage,
      currentFireRateLevel: this.currentFireRateLevel,
      currentRangeLevel: this.currentRangeLevel,
      currentMoveLevel: this.currentMoveLevel,
      currentMagnetLevel: this.currentMagnetLevel,
      currentMagnetRadius: this.currentMagnetRadius,
      maxHp: this.maxHp,
      currentHp: this.currentHp,
      currentAttackIntervalMs: this.currentAttackIntervalMs,
      currentAttackRange: this.currentAttackRange,
      currentMoveSpeed: this.currentMoveSpeed,
      currentPierceLevel: this.currentPierceLevel,
      currentBlastLevel: this.currentBlastLevel,
      currentOrbitingOrbLevel: this.currentOrbitingOrbLevel,
      currentRicochetLevel: this.currentRicochetLevel,
      currentXpBonusLevel: this.currentXpBonusLevel,
      tookDamageThisRun: this.tookDamageThisRun,
      pickedPowerThisRun: this.pickedPowerThisRun,
      pickedPierceThisRun: this.pickedPierceThisRun,
      pickedBlastThisRun: this.pickedBlastThisRun,
      pierceAvailableAtRunStart: this.pierceAvailableAtRunStart,
      blastAvailableAtRunStart: this.blastAvailableAtRunStart,
    }
  }

  // 役割: Arcade 物理のワールド境界をプレイエリアに合わせる
  // 呼び出し元: create / 呼び出し先: this.physics.world.setBounds
  private setupPhysicsWorld(): void {
    this.physics.world.setBounds(
      PLAY_AREA_ORIGIN_X,
      PLAY_AREA_ORIGIN_Y,
      PLAY_AREA_WIDTH,
      PLAY_AREA_HEIGHT,
    )
  }

  // 役割: 敵用の物理グループを空で作る（WaveSystem がここに敵を追加する）
  // 呼び出し元: create / 呼び出し先: this.physics.add.group
  private createEnemyGroup(): void {
    this.enemyGroup = this.physics.add.group()
  }

  // 役割: コイン用グループを作る（Coin.ts 側で magnetSpeed=0 などを初期化）
  // 呼び出し元: create / 呼び出し先: createCoinGroup
  private createCoinGroup(): void {
    this.coinGroup = createCoinGroup(this)
  }

  // 呼び出し元: create / 呼び出し先: createGoldCoinGroup
  private createGoldCoinGroup(): void {
    this.goldCoinGroup = createGoldCoinGroup(this)
    ensureGoldCoinAnimation(this)
  }

  // 役割: プレイヤー弾グループを作る
  // 呼び出し元: create / 呼び出し先: createPlayerBulletGroup
  private createPlayerBulletGroup(): void {
    this.playerBulletGroup = createPlayerBulletGroup(this)
  }

  // 役割: 敵弾グループを作る
  // 呼び出し元: create / 呼び出し先: createEnemyBulletGroup
  private createEnemyBulletGroup(): void {
    this.enemyBulletGroup = createEnemyBulletGroup(this)
  }

  // 役割: プレイヤー矩形・物理ボディ・移動キー入力を用意する
  // 呼び出し元: create
  // 呼び出し先: createPlayer, createMovementKeys
  private createPlayerAndKeys(): void {
    this.player = createPlayer(this)
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body
    // 見た目は歩行スプライトに任せ、物理用の四角は非表示にする
    this.player.setVisible(false)
    this.playerWalkSprite = createPlayerWalkSprite(this, this.player)
    this.movementKeys = createMovementKeys(this)
  }

  // 役割: マウス／タッチ押し込み中の相対追従を開始・終了する
  // 呼び出し元: create
  // 呼び出し先: beginRelativePointerFollow / endRelativePointerFollow
  private setupMovementInput(): void {
    this.pointerFollowMarker = createPointerFollowMarker(this)

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.canStartPointerMovement()) {
        return
      }

      // UI ボタン上のタップ／クリックでは移動を開始しない
      const hitObjects = this.input.hitTestPointer(pointer)
      if (hitObjects.length > 0) {
        return
      }

      if (shouldUseRelativePointerFollow(pointer)) {
        // タッチ: 押した位置起点の相対追従
        beginRelativePointerFollow(
          this.movementState,
          pointer,
          this.player.x,
          this.player.y,
        )
        return
      }

      // PCマウス: クリック後はカーソル位置へ追従
      beginAbsolutePointerFollow(this.movementState)
    })

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this.tryEndRelativePointerFollow(pointer)
    })
    this.input.on('pointerupoutside', (pointer: Phaser.Input.Pointer) => {
      this.tryEndRelativePointerFollow(pointer)
    })
  }

  // 役割: 追従を開始したポインタが離されたときだけ相対追従を終了する
  private tryEndRelativePointerFollow(pointer: Phaser.Input.Pointer): void {
    if (!this.movementState.isRelativeFollowActive) {
      return
    }
    if (pointer.id !== this.movementState.relativePointerId) {
      return
    }
    endRelativePointerFollow(this.movementState, this.pointerFollowMarker)
  }

  /** 戦闘中、またはカウントダウン中だけポインタ移動（狙い）を受け付ける。 */
  private canStartPointerMovement(): boolean {
    // レベルアップ選択中は狙いも受け付けない
    if (this.isLevelUpPaused) {
      return false
    }
    if (this.isAchievementsPaused) {
      return false
    }
    if (this.isPlayerDead || this.isStageSettled) {
      return false
    }
    if (this.isStageClearBannerPlaying || this.isClearCoinVacuum) {
      return false
    }
    if (this.settingsMenuSystem !== undefined && this.settingsMenuSystem.isMenuOpen()) {
      return false
    }
    if (this.confirmDialogSystem !== undefined && this.confirmDialogSystem.isOpen()) {
      return false
    }
    // 通常戦闘中、または 3・2・1 / ready・GO! 中
    if (
      this.isStageActive ||
      this.isResumeCountdownActive ||
      this.isStartCountdownActive
    ) {
      return true
    }
    return false
  }


  // 役割: プレイヤーと敵の接触 overlap を登録する（体当たりダメージ）
  // 呼び出し元: create
  // 呼び出し先: this.physics.add.overlap → handlePlayerEnemyOverlap
  private setupPlayerEnemyOverlap(): void {
    this.physics.add.overlap(
      this.player,
      this.enemyGroup,
      (_playerObject, enemyObject) => {
        this.handlePlayerEnemyOverlap(enemyObject as Phaser.GameObjects.Rectangle)
      },
      undefined,
      this,
    )
  }

  // 役割: プレイヤーと敵弾の overlap を登録する
  // 呼び出し元: create
  // 呼び出し先: this.physics.add.overlap → handlePlayerEnemyBulletHit
  private setupPlayerEnemyBulletOverlap(): void {
    this.physics.add.overlap(
      this.player,
      this.enemyBulletGroup,
      (_playerObject, bulletObject) => {
        this.handlePlayerEnemyBulletHit(bulletObject as EnemyBulletVisual)
      },
      undefined,
      this,
    )
  }

  // 役割: プレイヤー弾と敵の overlap を登録する（processCallback で貫通ルールを先に弾く）
  // 呼び出し元: create
  // 呼び出し先: canPlayerBulletHitEnemy（判定）, handleBulletEnemyHit（命中処理）
  private setupBulletEnemyOverlap(): void {
    this.physics.add.overlap(
      this.playerBulletGroup,
      this.enemyGroup,
      (bulletObject, enemyObject) => {
        handleBulletEnemyHit(
          this.buildPlayerBulletCombatContext(),
          bulletObject as PlayerBulletVisual,
          enemyObject as Phaser.GameObjects.Rectangle,
        )
      },
      (bulletObject, enemyObject) => {
        return canPlayerBulletHitEnemy(
          bulletObject as PlayerBulletVisual,
          enemyObject as Phaser.GameObjects.Rectangle,
        )
      },
      this,
    )
  }

  // 役割: プレイヤー弾と破壊可能な敵弾（小石など）の overlap
  private setupPlayerBulletEnemyBulletOverlap(): void {
    this.physics.add.overlap(
      this.playerBulletGroup,
      this.enemyBulletGroup,
      (_playerBulletObject, enemyBulletObject) => {
        recycleEnemyBullet(enemyBulletObject as EnemyBulletVisual)
      },
      (_playerBulletObject, enemyBulletObject) => {
        const enemyBullet = enemyBulletObject as EnemyBulletVisual
        return enemyBullet.getData('destroyableByPlayer') === true
      },
      this,
    )
  }

  // 役割: プレイヤーとコインの overlap を登録する（XP 取得）
  // 呼び出し元: create
  // 呼び出し先: this.physics.add.overlap → handleCoinPickup
  private setupCoinPickupOverlap(): void {
    this.physics.add.overlap(
      this.player,
      this.coinGroup,
      (_playerObject, coinObject) => {
        this.handleCoinPickup(coinObject as CoinView)
      },
      undefined,
      this,
    )
  }

  // 役割: プレイヤーとクリア用ゴールドコインの overlap を登録する
  private setupGoldCoinPickupOverlap(): void {
    this.physics.add.overlap(
      this.player,
      this.goldCoinGroup,
      (_playerObject, coinObject) => {
        this.handleGoldCoinPickup(coinObject as GoldCoinView)
      },
      undefined,
      this,
    )
  }

  // 役割: カメラを画面全体に固定（スクロールしないトップダウン）
  // 呼び出し元: create / 呼び出し先: this.cameras.main
  private setupFixedCamera(): void {
    this.cameras.main.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT)
    this.cameras.main.setScroll(0, 0)
  }

  // 役割: 画面サイズ変更（向き変更・フルスクリーン）時にカメラ表示領域を合わせる
  // 呼び出し元: create
  private setupScaleResize(): void {
    const onResize = (gameSize: Phaser.Structs.Size): void => {
      this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height)
    }
    this.scaleResizeHandler = onResize
    this.scale.on('resize', onResize)
    onResize(this.scale.gameSize)
  }

  // 役割: 射程円・ヒットボックス表示システムを生成する
  // 呼び出し元: create
  // 呼び出し先: RangeDisplaySystem / HitboxDisplaySystem のコンストラクタ
  private setupRangeDisplay(): void {
    this.rangeDisplaySystem = new RangeDisplaySystem(this)
    this.hitboxDisplaySystem = new HitboxDisplaySystem(this)
  }

  // 役割: BGM/SE システムを用意し、音声アンロック後に戦闘 BGM を開始する
  // 呼び出し元: create
  // 呼び出し先: GameAudioSystem, this.input.once（未アンロック時）
  private startAreaBattleBgm(): void {
    if (this.areaId === 'forest') {
      this.gameAudioSystem.startBgm(FOREST_BGM_KEY)
      return
    }
    if (this.areaId === 'volcano') {
      this.gameAudioSystem.startBgm(VOLCANO_BGM_KEY)
      return
    }
    if (this.areaId === 'ruins') {
      this.gameAudioSystem.startBgm(RUINS_BGM_KEY)
      return
    }
    this.gameAudioSystem.startBgm()
  }

  private setupAudio(): void {
    // 「何も BGM が鳴っていないときだけ」戦闘 BGM を開始する保険。
    // クリア BGM が鳴っている最中（クリア後のレベルアップ中など）に
    // クリックやキー入力で発火しても、BGM を切り替えないようにする。
    const startBattleBgmIfSilent = (): void => {
      this.gameAudioSystem.unlock()
      this.gameAudioSystem.prepare()
      // ゲームオーバー・ステージ決着後は、クリックしても BGM を再開しない
      if (this.isPlayerDead || this.isStageSettled) {
        return
      }
      // レベルアップ選択中は、選択肢以外（暗い背景など）をクリックしても
      // 戦闘 BGM を始めない。選択後の再開カウントダウンで流す
      if (this.isLevelUpPaused) {
        return
      }
      if (
        this.levelUpChoiceSystem !== undefined &&
        this.levelUpChoiceSystem.isOpen()
      ) {
        return
      }
      if (this.gameAudioSystem.isAnyBgmActive()) {
        return
      }
      this.startAreaBattleBgm()
    }

    // ステージ開始時はクリア BGM から戦闘 BGM へ確実に切り替える
    this.gameAudioSystem.unlock()
    this.gameAudioSystem.prepare()
    this.startAreaBattleBgm()

    // resume が遅れたときの保険
    window.setTimeout(() => {
      startBattleBgmIfSilent()
    }, 200)

    // 音声がまだロックされていた場合だけ、最初の操作で開始する
    this.input.once('pointerdown', startBattleBgmIfSilent)
    const keyboard = this.input.keyboard
    if (keyboard !== null) {
      keyboard.once('keydown', startBattleBgmIfSilent)
    }
  }

  // 役割: ステージ経過時間と残り秒を更新し、ファイナルウェーブ突入を試みる
  // 呼び出し元: update（isStageActive のとき）
  // 呼び出し先: tryStartFinalWave
  // 補足: レベルアップ中は update がここまで来ないので、再開時の時間飛び越えを防げる
  private updateStageTimer(): void {
    // レベルアップ中は呼ばれないので、ここでだけ経過を足す（再開時の飛び越え防止）
    this.stageElapsedMs = this.stageElapsedMs + this.game.loop.delta
    const stageDurationSeconds = getStageDurationSeconds(this.stageNumber)
    const elapsedSeconds = this.stageElapsedMs / 1000
    this.remainingSeconds = Math.max(0, stageDurationSeconds - elapsedSeconds)
    this.tryStartFinalWave()
  }

  // 役割: 残り FINAL_WAVE_REMAINING_SECONDS 秒でバナー＋追加スポーン（終盤 ≈2倍）
  // 呼び出し元: updateStageTimer
  // 呼び出し先: playFinalWaveBanner, waveSystem.startFinalWaveExtraSpawns
  private tryStartFinalWave(): void {
    if (this.hasStartedFinalWave) {
      return
    }
    if (this.remainingSeconds > FINAL_WAVE_REMAINING_SECONDS) {
      return
    }
    if (!this.isStageActive || this.isPlayerDead || this.isStageSettled) {
      return
    }

    this.hasStartedFinalWave = true
    playFinalWaveBanner(this)
    this.waveSystem.startFinalWaveExtraSpawns()
  }

  // 役割: HP・レベル・タイマー・ステータス・XP バーを HUD に反映する
  // 呼び出し元: update / create / 各種ポーズ分岐 / クリア吸引中など
  // 呼び出し先: hudSystem の各 update*, refreshPlayerStatsHud
  private updateHudDisplay(): void {
    this.hudSystem.updateHpBar(this.currentHp, this.maxHp)
    this.hudSystem.updateStatusLine(this.currentLevel, this.stageNumber)
    this.hudSystem.updateTimer(this.remainingSeconds)
    this.refreshPlayerStatsHud()

    // XP バーがトゥイーン中なら、animateXpBarTo 側が描画を担当する
    if (this.xpBarTween === null) {
      const xpProgress = getXpProgressForLevel(this.displayedTotalXp, this.currentLevel)
      this.hudSystem.updateXpBar(xpProgress.currentInLevel, xpProgress.neededForNext)
    }
  }

  // 役割: 右上などのプレイヤー能力値表示を最新の成長値で更新する
  // 呼び出し元: updateHudDisplay / applyLevelUpChoice
  // 呼び出し先: hudSystem.updatePlayerStats
  private refreshPlayerStatsHud(): void {
    this.hudSystem.updatePlayerStats({
      power: this.currentAttackDamage,
      speed: this.currentFireRateLevel,
      range: this.currentRangeLevel,
      move: this.currentMoveLevel,
      magnet: this.currentMagnetLevel,
      hp: this.maxHp,
      penetrate: this.currentPierceLevel,
      blast: this.currentBlastLevel,
      orbitingOrb: this.currentOrbitingOrbLevel,
      ricochet: this.currentRicochetLevel,
      xpBonus: this.currentXpBonusLevel,
    })
  }

  // 役割: 攻撃射程とコイン吸引半径の円をプレイヤー位置に描く
  // 呼び出し元: update / 呼び出し先: rangeDisplaySystem.drawRangeCircles
  private updateRangeDisplay(): void {
    this.rangeDisplaySystem.drawRangeCircles(
      this.player.x,
      this.player.y,
      this.currentAttackRange,
      this.currentMagnetRadius,
    )
  }

  // 役割: プレイヤーと敵のヒットボックス可視化を更新する
  // 呼び出し元: update / 呼び出し先: hitboxDisplaySystem.drawHitboxes
  private updateHitboxDisplay(): void {
    this.hitboxDisplaySystem.drawHitboxes(this.player.x, this.player.y, this.enemyGroup)
  }

  // 役割: 通常プレイ中のコイン吸引（半径内のコインを body.setVelocity で寄せる）
  // 呼び出し元: update（isStageActive）
  // 呼び出し先: CoinMagnetSystem.updateCoinMagnetMovement
  private updateCoinMagnet(): void {
    updateCoinMagnetMovement(
      this.coinGroup,
      this.player.x,
      this.player.y,
      this.currentMagnetRadius,
      this.game.loop.delta / 1000,
    )
  }

  // 役割: 全敵の追従／距離帯移動を1フレーム分更新する
  // 呼び出し元: update（isStageActive）
  // 呼び出し先: EnemyMovementSystem.updateEnemyChaseMovement
  private updateEnemyMovement(): void {
    updateEnemyChaseMovement(
      this.enemyGroup,
      this.player.x,
      this.player.y,
      this.currentAttackRange,
    )
  }

  // 役割: 射撃型敵の弾発射タイミングを更新する
  // 呼び出し元: update（isStageActive）
  // 呼び出し先: EnemyAttackSystem.updateEnemyRangedAttacks
  private updateEnemyRangedAttack(): void {
    updateEnemyRangedAttacks(
      this,
      this.enemyGroup,
      this.enemyBulletGroup,
      this.player.x,
      this.player.y,
      this.currentAttackRange,
      this.time.now,
    )
    updateEarthRockAttacks(
      this,
      this.enemyGroup,
      this.enemyBulletGroup,
      this.player.x,
      this.player.y,
      this.time.now,
    )
  }

  // 役割: 最寄り敵へ自動射撃を試み、撃てたら SE を鳴らす
  // 呼び出し元: update（isStageActive）
  // 呼び出し先: tryFireBulletAtNearestEnemy, gameAudioSystem.playPlayerFire
  private updateOrbitingOrbs(): void {
    this.orbitingOrbSystem.setCombatContext(this.buildPlayerBulletCombatContext())
    this.orbitingOrbSystem.setAttackDamage(this.currentAttackDamage)
    this.orbitingOrbSystem.update(
      this.player.x,
      this.player.y,
      this.game.loop.delta / 1000,
      this.enemyGroup,
      this.time.now,
    )
  }

  private updatePlayerAttack(): void {
    const bulletStyle = resolvePlayerBulletStyle(
      this.currentMoveLevel,
      this.currentMagnetLevel,
      this.currentXpBonusLevel,
      this.areaId,
    )
    const didFire = tryFireBulletAtNearestEnemy(
      this,
      this.playerBulletGroup,
      this.enemyGroup,
      this.player.x,
      this.player.y,
      this.attackState,
      this.currentAttackIntervalMs,
      this.currentAttackRange,
      this.currentAttackDamage,
      calculateBulletMaxHits(this.currentPierceLevel),
      this.currentRicochetLevel,
      this.time.now,
      bulletStyle,
    )

    if (didFire) {
      // Power 通常弾: skill.power.cast。属性弾は playPlayerFire 内で従来キー再生。
      // Pierce/Ricochet が powerOrb 発射を共有する間は同一 Event を維持する。
      this.gameAudioSystem.playPlayerFire(bulletStyle)
    }
  }

  // 役割: コイン取得 → XP 加算 → バー演出 → レベルアップ判定
  // 呼び出し元: setupCoinPickupOverlap のコールバック
  // 呼び出し先: playXpGainVisualEffect, animateXpBarTo, checkAndQueueLevelUps
  private handleCoinPickup(coin: CoinView): void {
    if (!coin.active || this.isPlayerDead || this.isStageSettled) {
      return
    }
    // クリア吸引中は拾える。通常のレベルアップ UI／再開カウントダウン中は拾わない
    if ((this.isLevelUpPaused || this.isResumeCountdownActive) && !this.isClearCoinVacuum) {
      return
    }

    // XP Bonusはドロップ枚数へ反映済み。コインの xpValue をそのまま加算する
    const xpValue = coin.getData('xpValue') as number
    const coinX = coin.x
    const coinY = coin.y
    coin.destroy()

    this.gameAudioSystem.playEvent(SURVIVOR_SFX_EVENT_IDS.PICKUP_XP_COLLECT)

    // XP は拾った瞬間に加算（連続取得でも欠落しない）
    const safeXp = typeof xpValue === 'number' ? Math.max(0, Math.floor(xpValue)) : 1
    this.totalXp = this.totalXp + safeXp
    playXpGainVisualEffect(this, this.hudSystem, coinX, coinY, safeXp)
    this.animateXpBarTo(this.totalXp)
    this.checkAndQueueLevelUps()
  }

  // 役割: クリア用ゴールドコイン取得 → 保存 → 上部バーへキラキラ
  private handleGoldCoinPickup(coin: GoldCoinView): void {
    // Gold／Shop Runtime Disable: 拾っても加算しない
    if (!RUNTIME_ENABLE_GOLD_AND_SHOP) {
      if (coin.active) {
        coin.destroy()
      }
      return
    }
    if (!coin.active || this.isPlayerDead || this.isStageSettled) {
      return
    }
    // クリア吸引中だけ拾う（落下中に誤取得しない）
    if (!this.isClearCoinVacuum) {
      return
    }

    const goldValue = coin.getData('goldValue') as number
    const coinX = coin.x
    const coinY = coin.y
    coin.destroy()

    const safeGold = typeof goldValue === 'number' ? Math.max(1, Math.floor(goldValue)) : 1
    const goldResult = addGold(safeGold)
    if (goldResult.shopJustUnlocked) {
      this.pendingShopUnlockNotify = true
    }
    this.hudSystem.refreshGold()
    this.gameAudioSystem.playEvent(SURVIVOR_SFX_EVENT_IDS.PICKUP_GOLD_COLLECT)
    // XP のキラキラではなく、ゴールドコインが上部バーの所持金へ飛ぶ
    playGoldCoinFlyToHud(this, this.hudSystem, coinX, coinY)
  }

  // 役割: totalXp から未処理レベルアップを数え、必要なら選択 UI を開く
  // 呼び出し元: handleCoinPickup
  // 呼び出し先: syncPendingLevelUpsFromTotalXp, beginNextLevelUpChoice
  private checkAndQueueLevelUps(): void {
    this.syncPendingLevelUpsFromTotalXp()

    // クリア吸引中は UI を出さず、吸引後にまとめて処理する
    if (this.isClearCoinVacuum || this.waitingToShowStageClear) {
      return
    }

    if (!this.isLevelUpPaused && !this.isResumeCountdownActive) {
      this.beginNextLevelUpChoice()
    }
  }

  // 役割: totalXp から、まだ選んでいないレベルアップ回数を揃える
  // 呼び出し元: checkAndQueueLevelUps / finishClearCoinVacuum
  // 呼び出し先: getLevelFromTotalXp
  private syncPendingLevelUpsFromTotalXp(): void {
    const reachedLevel = getLevelFromTotalXp(this.totalXp)
    const newlyGainedLevels = reachedLevel - this.currentLevel - this.pendingLevelUps
    if (newlyGainedLevels <= 0) {
      return
    }
    this.pendingLevelUps = this.pendingLevelUps + newlyGainedLevels
  }

  /** 現在値が上限に達した候補を返す。ショップ購入分は即座に次のランへ反映される。 */
  private getMaxedLevelUpChoiceIds(): LevelUpChoiceId[] {
    const maxed: LevelUpChoiceId[] = []

    if (this.currentAttackDamage >= getPurchasedPowerCap()) {
      maxed.push('damage')
    }
    if (this.currentFireRateLevel >= getPurchasedSpeedCap()) {
      maxed.push('fireRate')
    }
    if (this.currentRangeLevel >= getPurchasedRangeCap()) {
      maxed.push('range')
    }
    if (this.currentMoveLevel >= DEFAULT_UNLOCKED_SKILL_LEVEL_CAP) {
      maxed.push('move')
    }
    if (this.currentMagnetLevel >= DEFAULT_UNLOCKED_SKILL_LEVEL_CAP) {
      maxed.push('magnet')
    }
    if (this.currentPierceLevel >= getPurchasedPierceCap()) {
      maxed.push('pierce')
    }
    if (this.currentBlastLevel >= getPurchasedBlastCap()) {
      maxed.push('blast')
    }
    if (this.currentRicochetLevel >= DEFAULT_UNLOCKED_SKILL_LEVEL_CAP) {
      maxed.push('ricochet')
    }
    if (this.currentXpBonusLevel >= getPurchasedXpBonusCap()) {
      maxed.push('xpBonus')
    }
    return maxed
  }

  // 役割: 次のレベルアップ選択 UI を開き、ゲームを一時停止する
  // 呼び出し元: checkAndQueueLevelUps / applyLevelUpChoice / finishClearCoinVacuum
  // 呼び出し先: pauseGameForLevelUp, levelUpChoiceSystem.show → applyLevelUpChoice
  //             または applyAutoExhaustedLevelUp（能力上限で通常候補が無いとき）
  private beginNextLevelUpChoice(): void {
    if (this.pendingLevelUps <= 0 || this.isPlayerDead || this.isStageSettled) {
      return
    }
    // 順番: バナー → コイン吸引 → レベルアップ → 四角 UI
    if (this.isClearCoinVacuum || this.isStageClearBannerPlaying) {
      return
    }

    const maxedChoiceIds = this.getMaxedLevelUpChoiceIds()
    // 通常強化が残っていない → 画面を止めず自動解決（Gold 休止中は報酬なし）
    if (hasNoNormalLevelUpChoices(maxedChoiceIds)) {
      this.applyAutoExhaustedLevelUp()
      return
    }

    this.pauseGameForLevelUp()
    // 選択中は戦闘BGMを止め、レベルアップ音だけを聞こえやすくする
    // エリア最終ステージのクリアBGMはそのまま流す
    if (!this.gameAudioSystem.isAreaClearBgmActive()) {
      this.gameAudioSystem.stopBgm()
    }
    this.gameAudioSystem.playEvent(SURVIVOR_SFX_EVENT_IDS.PROGRESSION_LEVEL_UP_OPEN)
    let requiredChoice: LevelUpChoiceId | undefined
    if (this.areaId === 'volcano' && this.stageNumber === 1 && this.currentMoveLevel < 2) {
      requiredChoice = 'move'
    }
    if (this.areaId === 'volcano' && this.stageNumber === 2 && this.currentAttackDamage < 3) {
      requiredChoice = 'damage'
    }
    this.levelUpChoiceSystem.show(
      (choiceId) => {
        this.applyLevelUpChoice(choiceId)
      },
      requiredChoice,
      maxedChoiceIds,
      {
        attackDamage: this.currentAttackDamage,
        fireRateLevel: this.currentFireRateLevel,
        rangeLevel: this.currentRangeLevel,
        moveLevel: this.currentMoveLevel,
        magnetLevel: this.currentMagnetLevel,
        pierceLevel: this.currentPierceLevel,
        blastLevel: this.currentBlastLevel,
        orbitingOrbLevel: this.currentOrbitingOrbLevel,
        ricochetLevel: this.currentRicochetLevel,
        xpBonusLevel: this.currentXpBonusLevel,
      },
    )
  }

  // 役割: 能力が全部上限のとき、選択 UI なしでレベルだけ進めてプレイ継続
  // Gold 有効時のみ +1G。無効時は報酬なし（空 UI／無限ループを避ける）
  // 呼び出し元: beginNextLevelUpChoice
  private applyAutoExhaustedLevelUp(): void {
    if (RUNTIME_ENABLE_GOLD_AND_SHOP) {
      const goldResult = addGold(1)
      if (goldResult.shopJustUnlocked) {
        this.pendingShopUnlockNotify = true
      }
    }

    this.currentLevel = this.currentLevel + 1
    this.pendingLevelUps = this.pendingLevelUps - 1

    // 通常レベルアップと同じく HP 全回復（Dungeon は除く）
    if (this.areaId !== 'ruins') {
      this.currentHp = this.maxHp
      playHpFullText(this, this.player.x, this.player.y)
    }
    this.hudSystem.updateHpBar(this.currentHp, this.maxHp)

    const xpProgress = getXpProgressForLevel(this.displayedTotalXp, this.currentLevel)
    this.hudSystem.updateXpBar(xpProgress.currentInLevel, xpProgress.neededForNext)
    this.hudSystem.updateStatusLine(this.currentLevel, this.stageNumber)
    this.refreshPlayerStatsHud()
    this.hudSystem.refreshGold()

    // 止めずに「LEVEL UP」。Gold 有効時のみコイン音と +GOLD 演出
    this.gameAudioSystem.playLevelUp()
    playAutoGoldLevelUpText(this, this.player.x, this.player.y)
    if (RUNTIME_ENABLE_GOLD_AND_SHOP) {
      this.gameAudioSystem.playCoinPickup()
      playGoldGainVisualEffect(
        this,
        this.hudSystem,
        this.player.x,
        this.player.y - 10,
        1,
      )
    }

    if (this.pendingLevelUps > 0) {
      // 連続時は少し間を空けて、演出が重なりすぎないようにする
      this.time.delayedCall(AUTO_GOLD_LEVEL_UP_CHAIN_DELAY_MS, () => {
        if (this.isPlayerDead || this.isStageSettled) {
          return
        }
        this.beginNextLevelUpChoice()
      })
      return
    }

    if (this.waitingToShowStageClear) {
      showStageClearResult(this.buildStageClearFlowContext())
    }
    // 通常プレイ中はポーズも再開カウントダウンもしない
  }

  // 役割: レベルアップ UI 中のポーズ（time 停止＋移動体の速度ゼロ）
  // 呼び出し元: beginNextLevelUpChoice
  // 呼び出し先: stopAllMovingBodies
  private pauseGameForLevelUp(): void {
    this.isLevelUpPaused = true
    this.time.paused = true
    // 弾は消さず、flightVx/Vy を残したまま他だけ止める（再開後に同じ方向へ飛ぶ）
    // マウス追従も消さない（選択後もキーボードなしなら追従継続）
    this.stopAllMovingBodies({ keepRelativeFollow: true })
  }

  // 役割: レベルアップ UI 終了後、ready・GO! のあと戦闘を再開する
  // 呼び出し元: applyLevelUpChoice（残りレベルアップがなく、クリア待ちでもないとき）
  // 呼び出し先: playResumeCountdown → resumeGameAfterLevelUp
  private beginResumeCountdownAfterLevelUp(): void {
    // 選択 UI は閉じ済み。カウントダウン中も移動・攻撃・被ダメを止める
    this.isLevelUpPaused = false
    this.isResumeCountdownActive = true
    this.time.paused = true
    // 狙い点は ready/GO! 中に操作できるので、ここでは消さない
    this.stopAllMovingBodies({ keepRelativeFollow: true })

    playResumeCountdown(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, () => {
      this.isResumeCountdownActive = false
      this.resumeGameAfterLevelUp()
    })
  }

  // 役割: レベルアップ UI 終了後に時間と弾の速度を再開する
  // 呼び出し元: beginResumeCountdownAfterLevelUp の完了コールバック
  // 呼び出し先: maintainPlayerBulletVelocities / maintainEnemyBulletVelocities
  private resumeGameAfterLevelUp(): void {
    this.isLevelUpPaused = false
    this.isResumeCountdownActive = false
    this.time.paused = false
    // 通常戦闘中のレベルアップが終わったら、そのエリアのBGMを再開する
    this.startAreaBattleBgm()
    // 保存してあった飛行速度を載せ直す
    maintainPlayerBulletVelocities(this.playerBulletGroup)
    maintainEnemyBulletVelocities(this.enemyBulletGroup)
  }

  // 実績・アンロック状況を読んでいる間は、タイマーと物理更新を止める
  private pauseGameForAchievements(): void {
    this.wasTimePausedBeforeAchievements = this.time.paused
    this.isAchievementsPaused = true
    this.time.paused = true
    if (this.playerBody !== undefined) {
      this.stopAllMovingBodies()
    }
  }

  // 実績を開く前に進行中だった場合だけ、安全に戦闘を再開する
  private resumeGameAfterAchievements(): void {
    this.isAchievementsPaused = false

    const shouldRemainPaused =
      this.wasTimePausedBeforeAchievements ||
      this.isLevelUpPaused ||
      this.isResumeCountdownActive ||
      this.isStageSettled ||
      this.isPlayerDead ||
      this.confirmDialogSystem.isOpen() ||
      this.settingsMenuSystem.isMenuOpen()

    if (shouldRemainPaused) {
      this.time.paused = true
      return
    }

    this.time.paused = false
    maintainPlayerBulletVelocities(this.playerBulletGroup)
    maintainEnemyBulletVelocities(this.enemyBulletGroup)
  }

  // 役割: プレイヤー・敵・コインの速度を 0 にする（弾は復元用データがあるので触らない）
  // 呼び出し元: update のポーズ分岐, pauseGameForLevelUp, 死亡／クリア処理など
  // 呼び出し先: body.setVelocity(0, 0)
  // keepRelativeFollow=true のときはポインタ追従（相対／絶対マウス）を消さない
  // （レベルアップ選択中・ready/GO! カウントダウン用）
  private stopAllMovingBodies(options?: { keepRelativeFollow?: boolean }): void {
    const keepRelativeFollow =
      options !== undefined && options.keepRelativeFollow === true
    if (!keepRelativeFollow) {
      endRelativePointerFollow(this.movementState, this.pointerFollowMarker)
    }
    this.playerBody.setVelocity(0, 0)

    const enemies = this.enemyGroup.getChildren()
    for (let index = 0; index < enemies.length; index++) {
      const enemy = enemies[index] as Phaser.GameObjects.Rectangle
      if (!enemy.active || enemy.body === null) {
        continue
      }
      const body = enemy.body as Phaser.Physics.Arcade.Body
      body.setVelocity(0, 0)
    }

    const coins = this.coinGroup.getChildren()
    for (let index = 0; index < coins.length; index++) {
      const coin = coins[index] as CoinView
      if (!coin.active || coin.body === null) {
        continue
      }
      const body = coin.body as Phaser.Physics.Arcade.Body
      body.setVelocity(0, 0)
    }

    // 弾はここで velocity を 0 にしない。
    // レベルアップ休止中は flightVx/Vy で再開後に復元する。
  }

  // 役割: 選択した強化をステータスへ反映し、HP 全快・HUD 更新・次の選択 or 再開
  // 呼び出し元: levelUpChoiceSystem.show のコールバック
  // 呼び出し先: levelUpChoiceSystem.applyChoice, beginNextLevelUpChoice /
  //             showStageClearResult / resumeGameAfterLevelUp
  private applyLevelUpChoice(choiceId: LevelUpChoiceId): void {
    const nextStats = this.levelUpChoiceSystem.applyChoice(choiceId, {
      attackDamage: this.currentAttackDamage,
      fireRateLevel: this.currentFireRateLevel,
      rangeLevel: this.currentRangeLevel,
      attackIntervalMs: this.currentAttackIntervalMs,
      attackRange: this.currentAttackRange,
      moveLevel: this.currentMoveLevel,
      moveSpeed: this.currentMoveSpeed,
      magnetLevel: this.currentMagnetLevel,
      magnetRadius: this.currentMagnetRadius,
      maxHp: this.maxHp,
      pierceLevel: this.currentPierceLevel,
      blastLevel: this.currentBlastLevel,
      orbitingOrbLevel: this.currentOrbitingOrbLevel,
      ricochetLevel: this.currentRicochetLevel,
      xpBonusLevel: this.currentXpBonusLevel,
    })

    // 全能力が上限のときだけ現れる代替報酬。能力値は変えず、1Gを即保存する。
    // Gold 休止中は何も加算しない（選択 UI 自体も通常は出さない）。
    if (choiceId === 'gold' && RUNTIME_ENABLE_GOLD_AND_SHOP) {
      const goldResult = addGold(1)
      if (goldResult.shopJustUnlocked) {
        this.pendingShopUnlockNotify = true
      }
      this.hudSystem.refreshGold()
      playGoldGainVisualEffect(
        this,
        this.hudSystem,
        this.player.x,
        this.player.y - 10,
        1,
      )
      this.gameAudioSystem.playCoinPickup()
    }

    this.currentAttackDamage = nextStats.attackDamage
    this.currentFireRateLevel = nextStats.fireRateLevel
    this.currentRangeLevel = nextStats.rangeLevel
    this.currentAttackIntervalMs = nextStats.attackIntervalMs
    this.currentAttackRange = nextStats.attackRange
    this.currentMoveLevel = nextStats.moveLevel
    this.currentMoveSpeed = nextStats.moveSpeed
    this.currentMagnetLevel = nextStats.magnetLevel
    this.currentMagnetRadius = nextStats.magnetRadius
    const previousMaxHp = this.maxHp
    this.maxHp = nextStats.maxHp
    this.currentPierceLevel = nextStats.pierceLevel
    this.currentBlastLevel = nextStats.blastLevel
    this.currentOrbitingOrbLevel = nextStats.orbitingOrbLevel
    this.currentRicochetLevel = nextStats.ricochetLevel
    this.currentXpBonusLevel = nextStats.xpBonusLevel

    if (choiceId === 'damage') {
      this.pickedPowerThisRun = true
    }
    if (choiceId === 'pierce') {
      this.pickedPierceThisRun = true
    }
    if (choiceId === 'blast') {
      this.pickedBlastThisRun = true
    }

    this.currentLevel = this.currentLevel + 1
    this.pendingLevelUps = this.pendingLevelUps - 1

    // Dungeon ではレベルアップによる全回復なし。
    // HP を選んだ場合だけ、増えた最大HPぶん現在HPも増やす。
    if (this.areaId === 'ruins') {
      const gainedMaxHp = this.maxHp - previousMaxHp
      if (gainedMaxHp > 0) {
        this.currentHp = Math.min(this.maxHp, this.currentHp + gainedMaxHp)
      }
    } else {
      this.currentHp = this.maxHp
      playHpFullText(this, this.player.x, this.player.y)
    }
    this.hudSystem.updateHpBar(this.currentHp, this.maxHp)

    // XP バー表示を新しいレベルの進捗に合わせる
    const xpProgress = getXpProgressForLevel(this.displayedTotalXp, this.currentLevel)
    this.hudSystem.updateXpBar(xpProgress.currentInLevel, xpProgress.neededForNext)
    this.hudSystem.updateStatusLine(this.currentLevel, this.stageNumber)
    this.refreshPlayerStatsHud()
    if (choiceId !== 'gold') {
      this.hudSystem.playStatUpgradePulse(this.mapChoiceIdToStatKey(choiceId))
    }

    // Move/Speed→Pierce、Power/Range→Blast、Move/Pickup→Orb、XP/Pickup/Speed→Ricochet
    const pierceSyncResult = this.syncPierceLevelFromMoveAndSpeed()
    const blastSyncResult = this.syncBlastLevelFromPowerAndRange()
    const orbitingOrbSyncResult = this.syncOrbitingOrbLevelFromMoveAndPickup()
    const ricochetSyncResult = this.syncRicochetLevelFromXpBonusPickupAndSpeed()
    this.orbitingOrbSystem.setAttackDamage(this.currentAttackDamage)

    const afterBanners = () => {
      this.continueAfterLevelUpChoiceResolved()
    }

    // 初回は大きな OBTAINED、レベル上昇は控えめな Lv.N
    // 表示順: Pierce → Blast → Orbiting Orb → Ricochet
    const runRicochetBannerIfNeeded = (thenFn: () => void) => {
      if (ricochetSyncResult === 'firstUnlock') {
        playRicochetUnlockBanner(this, thenFn, this.currentRicochetLevel)
        return
      }
      if (ricochetSyncResult === 'upgraded') {
        playRicochetLevelUpBanner(this, this.currentRicochetLevel, thenFn)
        return
      }
      thenFn()
    }

    const runOrbitingOrbBannerIfNeeded = (thenFn: () => void) => {
      if (orbitingOrbSyncResult === 'firstUnlock') {
        playOrbitingOrbUnlockBanner(this, () => {
          runRicochetBannerIfNeeded(thenFn)
        }, this.currentOrbitingOrbLevel)
        return
      }
      if (orbitingOrbSyncResult === 'upgraded') {
        playOrbitingOrbLevelUpBanner(this, this.currentOrbitingOrbLevel, () => {
          runRicochetBannerIfNeeded(thenFn)
        })
        return
      }
      runRicochetBannerIfNeeded(thenFn)
    }

    const runBlastBannerIfNeeded = (thenFn: () => void) => {
      if (blastSyncResult === 'firstUnlock') {
        playBlastUnlockBanner(this, () => {
          runOrbitingOrbBannerIfNeeded(thenFn)
        }, this.currentBlastLevel)
        return
      }
      if (blastSyncResult === 'upgraded') {
        playBlastLevelUpBanner(this, this.currentBlastLevel, () => {
          runOrbitingOrbBannerIfNeeded(thenFn)
        })
        return
      }
      runOrbitingOrbBannerIfNeeded(thenFn)
    }

    if (pierceSyncResult === 'firstUnlock') {
      playPierceUnlockBanner(this, () => {
        runBlastBannerIfNeeded(afterBanners)
      })
      return
    }
    if (pierceSyncResult === 'upgraded') {
      playPierceLevelUpBanner(this, this.currentPierceLevel, () => {
        runBlastBannerIfNeeded(afterBanners)
      })
      return
    }

    runBlastBannerIfNeeded(afterBanners)
  }

  /**
   * Move と Speed から Pierce を同期する。
   * 両方とも Lv2 以上のとき: Pierce = 低い方 − 1
   * 例: 2&2→Pierce1 / 3&3→Pierce2 / 2&5→Pierce1
   * 戻り値: firstUnlock=初めて付与 / upgraded=レベル上昇 / none=変化なし
   */
  private syncPierceLevelFromMoveAndSpeed(): 'firstUnlock' | 'upgraded' | 'none' {
    const targetPierce = calculatePierceLevelFromMoveAndSpeed(
      this.currentMoveLevel,
      this.currentFireRateLevel,
    )
    if (targetPierce <= PIERCE_LEVEL_START) {
      return 'none'
    }

    if (this.currentPierceLevel >= targetPierce) {
      return 'none'
    }

    const wasLocked = this.currentPierceLevel <= PIERCE_LEVEL_START
    this.currentPierceLevel = targetPierce
    this.pickedPierceThisRun = true
    unlockAchievement(ACHIEVEMENT_ID_PIERCE_UNLOCK)
    this.refreshPlayerStatsHud()
    this.hudSystem.playStatUpgradePulse('penetrate')
    this.gameAudioSystem.playLevelUp()

    if (wasLocked) {
      return 'firstUnlock'
    }
    return 'upgraded'
  }

  /**
   * Power と Range から Blast を同期する。
   * 両方とも Lv2 以上のとき: Blast = 低い方 − 1
   * 例: Power2&Range2→Blast1 / Power3&Range3→Blast2
   * 初回解放だけ大きなバナー。同じランのレベル上昇や2周目以降は控えめな Lv 表示。
   */
  private syncBlastLevelFromPowerAndRange(): 'firstUnlock' | 'upgraded' | 'none' {
    const targetBlast = calculateBlastLevelFromPowerAndRange(
      this.currentAttackDamage,
      this.currentRangeLevel,
    )
    if (targetBlast <= BLAST_LEVEL_START) {
      return 'none'
    }

    if (this.currentBlastLevel >= targetBlast) {
      return 'none'
    }

    const wasLocked = this.currentBlastLevel <= BLAST_LEVEL_START
    this.currentBlastLevel = targetBlast
    this.pickedBlastThisRun = true
    unlockAchievement(ACHIEVEMENT_ID_BLAST_UNLOCK)
    this.refreshPlayerStatsHud()
    this.hudSystem.playStatUpgradePulse('blast')

    if (wasLocked) {
      this.gameAudioSystem.playLevelUp()
      return 'firstUnlock'
    }
    return 'upgraded'
  }

  /**
   * Move と Pickup から Orbiting Orb を同期する。
   * 両方とも Lv2 以上のとき: Orbiting Orb = 低い方 − 1
   */
  private syncOrbitingOrbLevelFromMoveAndPickup(): 'firstUnlock' | 'upgraded' | 'none' {
    const targetOrbitingOrb = calculateOrbitingOrbLevelFromMoveAndPickup(
      this.currentMoveLevel,
      this.currentMagnetLevel,
    )
    if (targetOrbitingOrb <= ORBITING_ORB_LEVEL_START) {
      return 'none'
    }

    if (this.currentOrbitingOrbLevel >= targetOrbitingOrb) {
      return 'none'
    }

    const wasLocked = this.currentOrbitingOrbLevel <= ORBITING_ORB_LEVEL_START
    this.currentOrbitingOrbLevel = targetOrbitingOrb
    unlockAchievement(ACHIEVEMENT_ID_ORBITING_ORB_UNLOCK)
    this.orbitingOrbSystem.syncLevel(this.currentOrbitingOrbLevel)
    this.refreshPlayerStatsHud()
    this.hudSystem.playStatUpgradePulse('orbitingOrb')
    this.gameAudioSystem.playOrbitingOrbObtain()

    if (wasLocked) {
      this.gameAudioSystem.playLevelUp()
      return 'firstUnlock'
    }
    return 'upgraded'
  }

  /**
   * XP Bonus・Pickup・Speed から Ricochet を同期する。
   * Ricochet = min(Pickup-1, Speed-1, XP Bonus)
   */
  private syncRicochetLevelFromXpBonusPickupAndSpeed(): 'firstUnlock' | 'upgraded' | 'none' {
    const targetRicochet = calculateRicochetLevelFromXpBonusPickupAndSpeed(
      this.currentXpBonusLevel,
      this.currentMagnetLevel,
      this.currentFireRateLevel,
    )
    if (targetRicochet <= RICOCHET_LEVEL_START) {
      return 'none'
    }

    if (this.currentRicochetLevel >= targetRicochet) {
      return 'none'
    }

    const wasLocked = this.currentRicochetLevel <= RICOCHET_LEVEL_START
    this.currentRicochetLevel = targetRicochet
    unlockAchievement(ACHIEVEMENT_ID_RICOCHET_UNLOCK)
    this.refreshPlayerStatsHud()
    this.hudSystem.playStatUpgradePulse('ricochet')

    if (wasLocked) {
      this.gameAudioSystem.playLevelUp()
      return 'firstUnlock'
    }
    return 'upgraded'
  }

  // 役割: レベルアップ1回分のあと、次の選択／クリア結果／再開カウントダウンへ進む
  private continueAfterLevelUpChoiceResolved(): void {
    if (this.pendingLevelUps > 0) {
      this.beginNextLevelUpChoice()
      return
    }

    // クリア前吸引で得た XP のレベルアップが終わったら結果 UI へ
    if (this.waitingToShowStageClear) {
      showStageClearResult(this.buildStageClearFlowContext())
      return
    }

    this.beginResumeCountdownAfterLevelUp()
  }

  // 役割: レベルアップ選択肢 ID を HUD ステータス表示のキーに変換する
  // 呼び出し元: applyLevelUpChoice
  // 呼び出し先: なし
  private mapChoiceIdToStatKey(
    choiceId: LevelUpChoiceId,
  ):
    | 'power'
    | 'speed'
    | 'range'
    | 'move'
    | 'magnet'
    | 'penetrate'
    | 'blast'
    | 'orbitingOrb'
    | 'ricochet'
    | 'xpBonus' {
    if (choiceId === 'damage') {
      return 'power'
    }
    if (choiceId === 'fireRate') {
      return 'speed'
    }
    if (choiceId === 'range') {
      return 'range'
    }
    if (choiceId === 'move') {
      return 'move'
    }
    if (choiceId === 'magnet') {
      return 'magnet'
    }
    if (choiceId === 'pierce') {
      return 'penetrate'
    }
    if (choiceId === 'blast') {
      return 'blast'
    }
    if (choiceId === 'xpBonus') {
      return 'xpBonus'
    }
    return 'ricochet'
  }

  // 役割: XP バーの表示値をトゥイーンで targetTotalXp まで滑らかに追従させる
  // 呼び出し元: handleCoinPickup
  // 呼び出し先: this.tweens.addCounter, hudSystem.updateXpBar
  private animateXpBarTo(targetTotalXp: number): void {
    if (this.xpBarTween !== null) {
      this.xpBarTween.stop()
    }

    const fromTotalXp = this.displayedTotalXp
    this.xpBarTween = this.tweens.addCounter({
      from: fromTotalXp,
      to: targetTotalXp,
      duration: XP_GAIN_EFFECT_DURATION_MS,
      ease: 'Quad.InOut',
      onUpdate: (tween) => {
        this.displayedTotalXp = Math.floor(tween.getValue() ?? fromTotalXp)
        const xpProgress = getXpProgressForLevel(this.displayedTotalXp, this.currentLevel)
        this.hudSystem.updateXpBar(xpProgress.currentInLevel, xpProgress.neededForNext)
      },
      onComplete: () => {
        this.displayedTotalXp = targetTotalXp
        this.xpBarTween = null
      },
    })
  }

  // 役割: 被ダメ後の無敵時間中にプレイヤーを点滅させる
  // 呼び出し元: update（isStageActive）
  // 呼び出し先: updatePlayerInvincibilityBlink
  private updateInvincibilityBlink(): void {
    updatePlayerInvincibilityBlink(this.player, this.damageState, this.time.now)
  }

  /**
   * 戦闘中だけ被ダメを受け付ける。
   * ステージクリア演出・コイン吸引中などは接触してもダメージにしない。
   */
  private canPlayerReceiveCombatDamage(): boolean {
    if (this.isPlayerDead) {
      return false
    }
    // 開発専用 E2E（?e2e=1）: 60秒間の継続動作確認のため被ダメを無効化。
    // 通常プレイでは autoplayBridge が null のためここは通らない。
    if (this.autoplayBridge !== null) {
      return false
    }
    if (this.isLevelUpPaused || this.isResumeCountdownActive || this.isStartCountdownActive) {
      return false
    }
    if (this.isStageClearBannerPlaying || this.isClearCoinVacuum) {
      return false
    }
    if (this.waitingToShowStageClear || this.isStageSettled) {
      return false
    }
    // クリア開始と同じフレームで物理が走ってもダメージにしない
    if (!this.isStageActive) {
      return false
    }
    return true
  }

  // 役割: ノックバック開始時、マウス絶対追従が古い位置へ引き戻さないよう一時停止する
  private suspendMouseFollowAfterKnockback(): void {
    const pointer = this.input.activePointer
    suspendAbsoluteFollowUntilPointerMoves(
      this.movementState,
      pointer.worldX,
      pointer.worldY,
    )
  }

  // 役割: 敵との体当たりダメージ・ノックバック・死亡判定
  // 呼び出し元: setupPlayerEnemyOverlap のコールバック
  // 呼び出し先: PlayerDamageSystem*, handlePlayerDeath
  private handlePlayerEnemyOverlap(enemy: Phaser.GameObjects.Rectangle): void {
    if (!this.canPlayerReceiveCombatDamage()) {
      return
    }

    const nowMs = this.time.now
    if (!canPlayerTakeDamageNow(this.damageState, nowMs)) {
      return
    }

    this.currentHp = applyPlayerDamage(this.currentHp, this.damageState, nowMs)
    this.tookDamageThisRun = true
    this.tookDamageThisStage = true
    startPlayerKnockbackAwayFromEnemy(
      this.player,
      enemy,
      this.playerBody,
      this.damageState,
    )
    this.suspendMouseFollowAfterKnockback()
    this.gameAudioSystem.playEvent(SURVIVOR_SFX_EVENT_IDS.PLAYER_DAMAGE_CONTACT)
    playPlayerHurtFlash(this)

    if (this.currentHp <= 0) {
      this.handlePlayerDeath()
    }
  }

  // 役割: 敵弾ヒット時のダメージ・ノックバック・死亡判定（無敵中でも弾は消す）
  // 呼び出し元: setupPlayerEnemyBulletOverlap のコールバック
  // 呼び出し先: PlayerDamageSystem*, handlePlayerDeath
  private handlePlayerEnemyBulletHit(bullet: EnemyBulletVisual): void {
    if (!this.canPlayerReceiveCombatDamage()) {
      if (bullet.active) {
        recycleEnemyBullet(bullet)
      }
      return
    }
    if (!bullet.active) {
      return
    }

    const collisionAge = bullet.getData('collisionAge') as number
    if (typeof collisionAge !== 'number' || collisionAge < 1) {
      return
    }

    const nowMs = this.time.now
    if (!canPlayerTakeDamageNow(this.damageState, nowMs)) {
      // 無敵中でも弾は消す（弾幕が残らないように）
      recycleEnemyBullet(bullet)
      return
    }

    const bulletDamage = bullet.getData('damage') as number
    let damageAmount = 1
    if (typeof bulletDamage === 'number') {
      damageAmount = bulletDamage
    }

    this.currentHp = applyPlayerDamage(
      this.currentHp,
      this.damageState,
      nowMs,
      damageAmount,
    )
    this.tookDamageThisRun = true
    this.tookDamageThisStage = true
    startPlayerKnockbackAwayFromEnemy(
      this.player,
      bullet,
      this.playerBody,
      this.damageState,
    )
    this.suspendMouseFollowAfterKnockback()
    recycleEnemyBullet(bullet)
    this.gameAudioSystem.playEvent(SURVIVOR_SFX_EVENT_IDS.PLAYER_DAMAGE_PROJECTILE)
    playPlayerHurtFlash(this)

    if (this.currentHp <= 0) {
      this.handlePlayerDeath()
    }
  }

  // 役割: 死亡時の確定処理と敗北 UI。タイトルへ戻る
  // 呼び出し元: handlePlayerEnemyOverlap / handlePlayerEnemyBulletHit
  // 呼び出し先: waveSystem.stopWaves, stageResultSystem.show, TitleScene
  private handlePlayerDeath(): void {
    if (this.isStageSettled) {
      return
    }

    this.isPlayerDead = true
    this.isStageSettled = true
    this.isStageActive = false
    this.waveSystem.stopWaves()
    this.orbitingOrbSystem.destroy()
    destroyAllEnemyBullets(this.enemyBulletGroup)
    this.stopAllMovingBodies()

    if (this.levelUpChoiceSystem.isOpen()) {
      this.levelUpChoiceSystem.hide()
      this.isLevelUpPaused = false
    }
    this.isResumeCountdownActive = false
    this.isStartCountdownActive = false

    this.time.paused = true
    this.gameAudioSystem.stopBgm()
    this.gameAudioSystem.playGameOver()
    recordPlayerDeath()
    this.stageResultSystem.show('defeat', this.stageNumber, () => {
      this.time.paused = false
      clearRunProgress()
      // タイトル create 前にゲームオーバー音などを止める
      this.gameAudioSystem.stopAllSounds()
      this.scene.start('TitleScene')
    })
  }

  // 役割: プレイヤー弾命中処理へ渡す文脈を組み立てる
  private buildPlayerBulletCombatContext(): PlayerBulletCombatContext {
    return {
      scene: this,
      playerX: this.player.x,
      playerY: this.player.y,
      enemyGroup: this.enemyGroup,
      coinGroup: this.coinGroup,
      attackState: this.attackState,
      currentBlastLevel: this.currentBlastLevel,
      currentXpBonusLevel: this.currentXpBonusLevel,
      isLevelUpPaused: this.isLevelUpPaused,
      isResumeCountdownActive: this.isResumeCountdownActive,
      playEnemyBlocked: () => {
        this.gameAudioSystem.playEnemyBlocked()
      },
      playBulletHit: (bulletStyle) => {
        this.gameAudioSystem.playBulletHit(bulletStyle)
      },
      playEnemyDefeat: () => {
        this.gameAudioSystem.playEvent(SURVIVOR_SFX_EVENT_IDS.ENEMY_DEFEAT)
      },
    }
  }

  // 役割: ステージクリア演出へ渡す文脈を組み立てる
  private buildStageClearFlowContext(): StageClearFlowContext {
    return {
      scene: this,
      stageNumber: this.stageNumber,
      areaId: this.areaId,
      areaStageCount: this.areaStageCount,
      remainingSeconds: this.remainingSeconds,
      currentHp: this.currentHp,
      tookDamageThisStage: this.tookDamageThisStage,
      tookDamageThisRun: this.tookDamageThisRun,
      pickedPowerThisRun: this.pickedPowerThisRun,
      currentXpBonusLevel: this.currentXpBonusLevel,
      getIsStageSettled: () => this.isStageSettled,
      setIsStageSettled: (value) => {
        this.isStageSettled = value
      },
      getIsPlayerDead: () => this.isPlayerDead,
      getIsStageClearBannerPlaying: () => this.isStageClearBannerPlaying,
      setIsStageClearBannerPlaying: (value) => {
        this.isStageClearBannerPlaying = value
      },
      getIsClearCoinVacuum: () => this.isClearCoinVacuum,
      setIsClearCoinVacuum: (value) => {
        this.isClearCoinVacuum = value
      },
      getWaitingToShowStageClear: () => this.waitingToShowStageClear,
      setWaitingToShowStageClear: (value) => {
        this.waitingToShowStageClear = value
      },
      getIsLevelUpPaused: () => this.isLevelUpPaused,
      setIsLevelUpPaused: (value) => {
        this.isLevelUpPaused = value
      },
      getIsResumeCountdownActive: () => this.isResumeCountdownActive,
      setIsResumeCountdownActive: (value) => {
        this.isResumeCountdownActive = value
      },
      setIsStartCountdownActive: (value) => {
        this.isStartCountdownActive = value
      },
      setIsStageActive: (value) => {
        this.isStageActive = value
      },
      getClearCoinVacuumEmptySinceMs: () => this.clearCoinVacuumEmptySinceMs,
      setClearCoinVacuumEmptySinceMs: (value) => {
        this.clearCoinVacuumEmptySinceMs = value
      },
      getTotalXp: () => this.totalXp,
      setTotalXp: (value) => {
        this.totalXp = value
      },
      getPendingLevelUps: () => this.pendingLevelUps,
      getPendingShopUnlockNotify: () => this.pendingShopUnlockNotify,
      setPendingShopUnlockNotify: (value) => {
        this.pendingShopUnlockNotify = value
      },
      enemyGroup: this.enemyGroup,
      coinGroup: this.coinGroup,
      goldCoinGroup: this.goldCoinGroup,
      playerBulletGroup: this.playerBulletGroup,
      enemyBulletGroup: this.enemyBulletGroup,
      player: this.player,
      playerBody: this.playerBody,
      arcadeWorld: this.arcadeWorld,
      frameDelta: this.game.loop.delta,
      nowMs: this.time.now,
      waveSystem: this.waveSystem,
      hudSystem: this.hudSystem,
      stageResultSystem: this.stageResultSystem,
      gameAudioSystem: this.gameAudioSystem,
      levelUpChoiceSystem: this.levelUpChoiceSystem,
      stopAllMovingBodies: (options) => {
        this.stopAllMovingBodies(options)
      },
      animateXpBarTo: (totalXp) => {
        this.animateXpBarTo(totalXp)
      },
      updateHudDisplay: () => {
        this.updateHudDisplay()
      },
      beginNextLevelUpChoice: () => {
        this.beginNextLevelUpChoice()
      },
      syncPendingLevelUpsFromTotalXp: () => {
        this.syncPendingLevelUpsFromTotalXp()
      },
      createCarriedProgress: () => this.createCarriedProgress(),
      getIsKeyboardMode: () => this.movementState.isKeyboardMode,
    }
  }
}
