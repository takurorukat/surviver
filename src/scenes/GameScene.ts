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
  RICOCHET_LEVEL_START,
  XP_BONUS_LEVEL_START,
  calculateXpCoinDropCount,
  calculateClearXpBonusMultiplier,
  START_COUNTDOWN_STAGE1_OFFSET_Y,
  PLAY_AREA_ORIGIN_X,
  PLAY_AREA_ORIGIN_Y,
  PLAY_AREA_WIDTH,
  PLAY_AREA_HEIGHT,
  getXpProgressForLevel,
  getLevelFromTotalXp,
  XP_GAIN_EFFECT_DURATION_MS,
  ENEMY_WIDTH,
  COIN_MAGNET_RADIUS,
  calculateCoinMagnetRadius,
  DEFAULT_UNLOCKED_SKILL_LEVEL_CAP,
  RICOCHET_SEARCH_RADIUS,
  ENEMY_SHIELD_FRONT_DOT_THRESHOLD,
  STAGE_CLEAR_VACUUM_SETTLE_MS,
  ALL_ENEMIES_CLEAR_BONUS_XP,
  calculateBulletMaxHits,
  calculatePierceHitDamage,
  calculateBlastRadius,
  calculateBlastDamage,
  calculateAllEnemiesClearTimeBonusXp,
  CLEAR_TIME_BONUS_COIN_FALL_TILES,
  CLEAR_TIME_BONUS_COIN_SPREAD_RADIUS,
  CLEAR_TIME_BONUS_COIN_FALL_MS,
  CLEAR_GOLD_COIN_FALL_TILES,
  CLEAR_GOLD_COIN_SPREAD_RADIUS,
  CLEAR_GOLD_COIN_FALL_MS,
  FINAL_WAVE_REMAINING_SECONDS,
  getAreaStageCount,
  getStageFloorColor,
  FLOOR_DARKEN_ALPHA,
  PLAINS_FLOOR_TILESET_KEY,
  PLAINS_FLOOR_BLOCK_HEIGHT,
  PLAINS_FLOOR_BLOCK_COUNT,
  PLAINS_FLOOR_SOURCE_CROP_X,
  PLAINS_FLOOR_SOURCE_CROP_Y_OFFSET,
  PLAINS_FLOOR_SOURCE_CROP_SIZE,
  PLAINS_FLOOR_TILE_DISPLAY_SIZE,
  FLOOR_DETAIL_TILESET_KEY,
  FLOOR_DETAIL_TILE_SIZE,
  FLOOR_DETAIL_DISPLAY_SIZE,
  FOREST_DETAIL_TILES,
  FOREST_DETAIL_GRID_SIZE,
  FOREST_DETAIL_CHANCE,
  FOREST_BGM_KEY,
  VOLCANO_BGM_KEY,
  RUINS_BGM_KEY,
  isFinalStage,
  calculateStageClearGold,
  type StageAreaId,
} from '../GameConstants'
import {
  createPlayer,
  createPlayerWalkSprite,
  updatePlayerWalkSprite,
} from '../objects/Player'
import {
  createMovementKeys,
  applyPlayerMovement,
  type MovementKeys,
  type MovementState,
  type PlayAreaBounds,
} from '../systems/PlayerMovementSystem'
import { VirtualJoystick } from '../systems/VirtualJoystick'
import { stepArcadePhysicsOnce } from '../utils/arcadePhysicsHelpers'
import { HudSystem } from '../systems/HudSystem'
import { WaveSystem } from '../systems/WaveSystem'
import { updateEnemyChaseMovement } from '../systems/EnemyMovementSystem'
import { updateEnemyRangedAttacks } from '../systems/EnemyAttackSystem'
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
  clearLockedTargetIfEnemyDestroyed,
  findNearestUnhitEnemyInRange,
  type PlayerAttackState,
} from '../systems/PlayerAttackSystem'
import {
  createPlayerBulletGroup,
  advancePlayerBulletCollisionAge,
  maintainPlayerBulletVelocities,
  redirectPlayerBulletToward,
} from '../objects/PlayerBullet'
import {
  createEnemyBulletGroup,
  advanceEnemyBulletCollisionAge,
  maintainEnemyBulletVelocities,
  updateEnemyBullets,
  destroyAllEnemyBullets,
} from '../objects/EnemyBullet'
import {
  applyDamageToEnemy,
  countActiveEnemies,
  getEnemyXpDropMultiplier,
  playEnemyDefeatFadeOut,
  updateAllEnemyHpBars,
  updateAllEnemyWalkSprites,
  updateStumpMushroomSpawns,
  updateBranchBeetleSpawns,
  updateGravestoneBeetleSpawns,
  spawnForestStage5Gravestone,
} from '../objects/Enemy'
import { createCoinGroup, countActiveCoins, trySpawnCoinAt, spawnClearTimeBonusCoinRain, type CoinView } from '../objects/Coin'
import {
  createGoldCoinGroup,
  countActiveGoldCoins,
  spawnClearGoldCoinRain,
  updateAllGoldCoinsVacuumMovement,
  ensureGoldCoinAnimation,
  type GoldCoinView,
} from '../objects/GoldCoin'
import { playXpGainVisualEffect } from '../systems/XpGainEffectSystem'
import { playGoldGainVisualEffect, playGoldCoinFlyToHud } from '../systems/GoldGainEffectSystem'
import { playStartCountdown } from '../systems/StartCountdownSystem'
import {
  updateAllCoinsVacuumMovement,
  updateCoinMagnetMovement,
} from '../systems/CoinMagnetSystem'
import { GameAudioSystem } from '../systems/GameAudioSystem'
import {
  createBgmToggleButton,
  type BgmToggleButtonView,
} from '../systems/BgmToggleButtonSystem'
import { SettingsMenuSystem } from '../systems/SettingsMenuSystem'
import { ConfirmDialogSystem } from '../systems/ConfirmDialogSystem'
import {
  LevelUpChoiceSystem,
  type LevelUpChoiceId,
} from '../systems/LevelUpChoiceSystem'
import { StageResultSystem } from '../systems/StageResultSystem'
import {
  evaluateAndUnlockGameClearAchievements,
  formatUnlockNotificationLines,
  formatAreaUnlockNotificationLines,
  formatShopUnlockNotificationLines,
  isSkillUnlocked,
} from '../systems/AchievementSystem'
import {
  markAreaCleared,
  clearRunProgress,
  recordRunStart,
  recordPlayerDeath,
  recordEnemyDefeated,
  recordStageCleared,
  recordGameClear,
  addGold,
  getPurchasedMaxHp,
  getPurchasedPowerCap,
  getPurchasedSpeedCap,
  getPurchasedRangeCap,
  getPurchasedPierceCap,
  getPurchasedBlastCap,
  getPurchasedXpBonusCap,
} from '../systems/UnlockSaveSystem'
import type { CarriedProgress } from '../types/CarriedProgress'
import {
  playStageClearBanner,
  playAllEnemiesClearBanner,
  playAllEnemiesRewardBanner,
} from '../systems/StageClearBannerSystem'
import { playFinalWaveBanner } from '../systems/FinalWaveBannerSystem'
import {
  applyHitBlastAroundPoint,
  playHitBlastRing,
} from '../systems/HitBlastSystem'
import {
  playDamageNumber,
  playEnemyBlockedShield,
  playEnemyDefeatFlash,
  playHpFullText,
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
  // プレイヤーの見た目（歩行アニメ）。物理・当たり判定は player 側が持つ
  private playerWalkSprite!: Phaser.GameObjects.Sprite
  private enemyGroup!: Phaser.Physics.Arcade.Group
  private coinGroup!: Phaser.Physics.Arcade.Group
  private goldCoinGroup!: Phaser.Physics.Arcade.Group
  private playerBulletGroup!: Phaser.Physics.Arcade.Group
  private enemyBulletGroup!: Phaser.Physics.Arcade.Group

  // --- 移動・被ダメ・攻撃の内部状態 ---
  private movementKeys!: MovementKeys
  private movementState: MovementState = { isKeyboardMode: true, allowMouseFollow: false }
  private virtualJoystick!: VirtualJoystick
  // scene.restart 前に渡されたキーボードモード（resetStageState で復元）
  // 新規開始のデフォルトはキーボードモード（止まっている）。クリックでマウス追従へ
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
  private currentRicochetLevel = RICOCHET_LEVEL_START
  private currentXpBonusLevel = XP_BONUS_LEVEL_START

  // --- 所有するシステムインスタンス ---
  private hudSystem!: HudSystem
  private waveSystem!: WaveSystem
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
    this.createOuterBackground()
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
        // クリア BGM などが鳴っている場合はそのまま（切り替えない）
        if (!this.gameAudioSystem.isAnyBgmActive()) {
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
    this.createPlayAreaFrame()
    this.createFloor()
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
    this.setupCoinPickupOverlap()
    this.setupGoldCoinPickupOverlap()
    this.setupFixedCamera()
    this.setupRangeDisplay()
    this.setupAudio()
    // タイトルと同じ右下の BGM ON/OFF スイッチ
    this.bgmToggleButton = createBgmToggleButton(this, this.gameAudioSystem)
    this.levelUpChoiceSystem = new LevelUpChoiceSystem(this, () => {
      this.gameAudioSystem.playMenuMove()
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
    this.updateHudDisplay()
    this.beginStageWithCountdown()

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
    this.gameAudioSystem.stopBgm()
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

    playStartCountdown(this, GAME_WIDTH / 2, countdownCenterY, () => {
      this.isStageActive = true
      this.stageElapsedMs = 0
      this.spawnForestStage5GravestoneIfNeeded()
      this.waveSystem.startWaves()
    })
  }

  // 役割: Forest Stage5 開始直後に墓石を1体だけ出す（他の敵より先）
  private spawnForestStage5GravestoneIfNeeded(): void {
    if (this.areaId !== 'forest' || this.stageNumber !== 5) {
      return
    }
    spawnForestStage5Gravestone(this, this.enemyGroup)
  }

  // 役割: 毎フレームの司令塔。進行状態に応じて戦闘／移動／物理／HUD を回す
  // 呼び出し元: Phaser（毎フレーム）
  // 呼び出し先: update* 系, applyPlayerMovement, stepArcadePhysicsOnce,
  //             updateAllEnemyHpBars, stopAllMovingBodies など
  update(): void {
    // 設定メニュー側でBGMを切り替えた場合も、右下アイコンへすぐ反映する
    this.bgmToggleButton?.refresh()

    // ポーズ中も含めて毎フレーム、見た目スプライトを物理位置に追従させる
    if (this.playerWalkSprite !== undefined) {
      updatePlayerWalkSprite(this.playerWalkSprite, this.player, this.playerBody)
    }
    if (this.enemyGroup !== undefined) {
      updateAllEnemyWalkSprites(this.enemyGroup, this.player.x)
    }

    if (this.isAchievementsPaused) {
      this.cancelVirtualJoystickIfNeeded()
      this.updateHudDisplay()
      this.stopAllMovingBodies()
      return
    }

    if (this.confirmDialogSystem !== undefined && this.confirmDialogSystem.isOpen()) {
      this.cancelVirtualJoystickIfNeeded()
      this.updateHudDisplay()
      this.stopAllMovingBodies()
      return
    }

    if (this.settingsMenuSystem !== undefined && this.settingsMenuSystem.isMenuOpen()) {
      this.cancelVirtualJoystickIfNeeded()
      this.updateHudDisplay()
      this.stopAllMovingBodies()
      return
    }

    if (this.isPlayerDead || this.isStageSettled) {
      this.cancelVirtualJoystickIfNeeded()
      this.updateHudDisplay()
      this.stopAllMovingBodies()
      return
    }

    // クリア演出中（大きな文字 → コイン吸引）は戦闘を止める
    if (this.isStageClearBannerPlaying) {
      this.cancelVirtualJoystickIfNeeded()
      this.updateHudDisplay()
      this.stopAllMovingBodies()
      return
    }

    if (this.isClearCoinVacuum) {
      this.cancelVirtualJoystickIfNeeded()
      this.updateClearCoinVacuum()
      return
    }

    // レベルアップ選択中はゲーム進行を止める
    if (this.isLevelUpPaused) {
      this.cancelVirtualJoystickIfNeeded()
      this.updateHudDisplay()
      this.updateRangeDisplay()
      this.updateHitboxDisplay()
      this.stopAllMovingBodies()
      return
    }

    if (this.isStageActive) {
      this.updateStageTimer()
      this.updateEnemyMovement()
      // 既存の弾だけ年齢を進めてから発射する（新規弾は age=0 のまま物理へ）
      advancePlayerBulletCollisionAge(this.playerBulletGroup)
      advanceEnemyBulletCollisionAge(this.enemyBulletGroup)
      this.updatePlayerAttack()
      this.updateEnemyRangedAttack()
      this.updateStumpMushroomSpawn()
      this.updateBranchBeetleSpawn()
      this.updateGravestoneBeetleSpawn()
      updatePlayerBullets(this.playerBulletGroup)
      updateEnemyBullets(this.enemyBulletGroup)
      this.updateCoinMagnet()
      this.updateInvincibilityBlink()
      this.checkStageClearConditions()
    }

    this.updateHudDisplay()
    this.updateRangeDisplay()
    this.updateHitboxDisplay()

    // ノックバック中は通常移動で速度を上書きしない
    const isKnockbackActive = applyPlayerKnockbackIfActive(
      this.playerBody,
      this.damageState,
      this.game.loop.delta,
    )
    if (!isKnockbackActive) {
      applyPlayerMovement(
        this,
        this.player,
        this.playerBody,
        this.movementKeys,
        this.movementState,
        this.playAreaBounds,
        this.currentMoveSpeed,
        this.virtualJoystick,
      )
    }

    // 物理はここだけで1回。overlap コールバックもこの中で発火する
    stepArcadePhysicsOnce(this.arcadeWorld, this.time.now, this.game.loop.delta)

    // 物理移動後の位置に HP バーを合わせる
    updateAllEnemyHpBars(this.enemyGroup)
    updateAllEnemyWalkSprites(this.enemyGroup, this.player.x)
  }

  // 役割: シーン終了時の片付け（物理の自動更新を戻し、ウェーブタイマーを止める）
  // 呼び出し元: Phaser（シーン切替・restart 時）
  // 呼び出し先: this.physics.enableUpdate, waveSystem.stopWaves
  // 補足: ステージ遷移では BGM を止めない（共有1本を継続）。止めたいときは明示的に stopBgm
  shutdown(): void {
    this.physics.enableUpdate()
    if (this.virtualJoystick !== undefined) {
      this.virtualJoystick.destroy()
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
    this.isStageActive = false
    this.isPlayerDead = false
    this.isStageSettled = false
    this.isStageClearBannerPlaying = false
    this.isClearCoinVacuum = false
    this.waitingToShowStageClear = false
    this.clearCoinVacuumEmptySinceMs = 0
    this.hasStartedFinalWave = false
    this.tookDamageThisStage = false
    this.movementState = {
      isKeyboardMode: this.pendingKeyboardMode,
      allowMouseFollow: false,
    }
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
    this.currentHp = this.maxHp
    this.currentAttackIntervalMs = progress.currentAttackIntervalMs
    this.currentAttackRange = progress.currentAttackRange
    this.currentPierceLevel = progress.currentPierceLevel
    this.currentBlastLevel = progress.currentBlastLevel
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
      currentAttackIntervalMs: this.currentAttackIntervalMs,
      currentAttackRange: this.currentAttackRange,
      currentMoveSpeed: this.currentMoveSpeed,
      currentPierceLevel: this.currentPierceLevel,
      currentBlastLevel: this.currentBlastLevel,
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

  // 役割: 画面全体の暗い背景（プレイエリアの外側）を描く
  // 呼び出し元: create / 呼び出し先: this.add.rectangle
  private createOuterBackground(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0f172a)
  }

  // 役割: プレイエリアの枠（少し大きめの半透明四角）を描く
  // 呼び出し元: create / 呼び出し先: this.add.rectangle
  private createPlayAreaFrame(): void {
    const frameCenterX = PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH / 2
    const frameCenterY = PLAY_AREA_ORIGIN_Y + PLAY_AREA_HEIGHT / 2
    this.add.rectangle(
      frameCenterX,
      frameCenterY,
      PLAY_AREA_WIDTH + 4,
      PLAY_AREA_HEIGHT + 4,
      0x000000,
      0.35,
    )
  }

  // 役割: ステージに応じた床をプレイエリアに敷く
  // 呼び出し元: create
  // Plains / Forest はタイルシートの色（上から順）。Forest はさらに枝・葉を散らす。
  // 他エリアは従来の単色四角
  private createFloor(): void {
    if (this.areaId === 'plains') {
      this.createTiledFloor(false)
      this.createFloorDarkenOverlay()
      return
    }
    if (this.areaId === 'forest') {
      this.createTiledFloor(true)
      this.createFloorDarkenOverlay()
      return
    }

    const floorColor = getStageFloorColor(this.stageNumber, this.areaStageCount)
    const floorCenterX = PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH / 2
    const floorCenterY = PLAY_AREA_ORIGIN_Y + PLAY_AREA_HEIGHT / 2

    this.add.rectangle(
      floorCenterX,
      floorCenterY,
      PLAY_AREA_WIDTH,
      PLAY_AREA_HEIGHT,
      floorColor,
    )
    this.createFloorDarkenOverlay()
  }

  // 役割: 床の上に半透明の黒を重ねて、フィールド全体を暗めに見せる
  // 呼び出し元: createFloor
  private createFloorDarkenOverlay(): void {
    const overlay = this.add.rectangle(
      PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH / 2,
      PLAY_AREA_ORIGIN_Y + PLAY_AREA_HEIGHT / 2,
      PLAY_AREA_WIDTH,
      PLAY_AREA_HEIGHT,
      0x000000,
      FLOOR_DARKEN_ALPHA,
    )
    // 生成順で床の直後に追加しているため、キャラや弾より下に表示される
    overlay.setDepth(0)
  }

  // 役割: 床タイルを敷き詰めた1枚絵テクスチャを作って表示する
  // タイルシートは縦に5色。Stage 1 = 一番上の色、Stage 2 = 2番目... と順に使う
  // withForestDetails が true のときは枝・草・葉の装飾をランダムに散らす
  private createTiledFloor(withForestDetails: boolean): void {
    const blockIndex = Math.min(this.stageNumber - 1, PLAINS_FLOOR_BLOCK_COUNT - 1)
    const textureKey = `${this.areaId}-floor-stage-${blockIndex}`

    if (!this.textures.exists(textureKey)) {
      const canvasTexture = this.textures.createCanvas(
        textureKey,
        PLAY_AREA_WIDTH,
        PLAY_AREA_HEIGHT,
      )
      if (canvasTexture === null) {
        // 万一テクスチャが作れなければ従来の単色床にフォールバック
        const floorColor = getStageFloorColor(this.stageNumber, this.areaStageCount)
        this.add.rectangle(
          PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH / 2,
          PLAY_AREA_ORIGIN_Y + PLAY_AREA_HEIGHT / 2,
          PLAY_AREA_WIDTH,
          PLAY_AREA_HEIGHT,
          floorColor,
        )
        return
      }

      const context = canvasTexture.getContext()
      const sourceImage = this.textures
        .get(PLAINS_FLOOR_TILESET_KEY)
        .getSourceImage() as HTMLImageElement
      // ドット絵がぼやけないよう補間を切る
      context.imageSmoothingEnabled = false

      // 右側のベタ塗りタイルの、完全に不透明な内側だけを使う（黒透けを防ぐ）
      const sourceY =
        blockIndex * PLAINS_FLOOR_BLOCK_HEIGHT + PLAINS_FLOOR_SOURCE_CROP_Y_OFFSET
      // Python: for y in range(0, H, size): for x in range(0, W, size): に相当
      for (let y = 0; y < PLAY_AREA_HEIGHT; y += PLAINS_FLOOR_TILE_DISPLAY_SIZE) {
        for (let x = 0; x < PLAY_AREA_WIDTH; x += PLAINS_FLOOR_TILE_DISPLAY_SIZE) {
          context.drawImage(
            sourceImage,
            PLAINS_FLOOR_SOURCE_CROP_X,
            sourceY,
            PLAINS_FLOOR_SOURCE_CROP_SIZE,
            PLAINS_FLOOR_SOURCE_CROP_SIZE,
            x,
            y,
            PLAINS_FLOOR_TILE_DISPLAY_SIZE,
            PLAINS_FLOOR_TILE_DISPLAY_SIZE,
          )
        }
      }

      if (withForestDetails) {
        this.drawForestDetailsOnFloor(context)
      }
      canvasTexture.refresh()
    }

    const floorImage = this.add.image(PLAY_AREA_ORIGIN_X, PLAY_AREA_ORIGIN_Y, textureKey)
    floorImage.setOrigin(0, 0)
  }

  // 役割: 床テクスチャの上に、枝・小枝・草・葉の装飾をランダムに描く
  // 呼び出し元: createTiledFloor（Forest のみ）
  // 格子ごとに確率で1つ置き、位置を少しずらして自然に見せる
  private drawForestDetailsOnFloor(context: CanvasRenderingContext2D): void {
    const detailSource = this.textures
      .get(FLOOR_DETAIL_TILESET_KEY)
      .getSourceImage() as HTMLImageElement

    for (let y = 0; y < PLAY_AREA_HEIGHT; y += FOREST_DETAIL_GRID_SIZE) {
      for (let x = 0; x < PLAY_AREA_WIDTH; x += FOREST_DETAIL_GRID_SIZE) {
        if (Math.random() >= FOREST_DETAIL_CHANCE) {
          continue
        }

        const tile =
          FOREST_DETAIL_TILES[Phaser.Math.Between(0, FOREST_DETAIL_TILES.length - 1)]
        // 格子内でランダムにずらす（はみ出さない範囲）
        const maxOffset = FOREST_DETAIL_GRID_SIZE - FLOOR_DETAIL_DISPLAY_SIZE
        const offsetX = Phaser.Math.Between(0, maxOffset)
        const offsetY = Phaser.Math.Between(0, maxOffset)

        context.drawImage(
          detailSource,
          tile.column * FLOOR_DETAIL_TILE_SIZE,
          tile.row * FLOOR_DETAIL_TILE_SIZE,
          FLOOR_DETAIL_TILE_SIZE,
          FLOOR_DETAIL_TILE_SIZE,
          x + offsetX,
          y + offsetY,
          FLOOR_DETAIL_DISPLAY_SIZE,
          FLOOR_DETAIL_DISPLAY_SIZE,
        )
      }
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

  // 役割: マウスは追従、タッチは仮想ジョイスティックに切り替える
  // 呼び出し元: create
  // 呼び出し先: this.input.on（コールバック内で movementState / VirtualJoystick を操作）
  private setupMovementInput(): void {
    this.virtualJoystick = new VirtualJoystick(this)

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.canStartPointerMovement()) {
        return
      }

      // UI ボタン上のタップ／クリックでは移動を開始しない
      const hitObjects = this.input.hitTestPointer(pointer)
      if (hitObjects.length > 0) {
        return
      }

      this.movementState.isKeyboardMode = false

      if (pointer.wasTouch) {
        // タッチ: 仮想ジョイスティック（指を離した座標へ吸い寄せない）
        this.movementState.allowMouseFollow = false
        this.virtualJoystick.start(pointer)
        return
      }

      // マウス: 従来どおりポインタ追従
      this.movementState.allowMouseFollow = true
      this.virtualJoystick.cancel()
    })

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.wasTouch) {
        return
      }
      this.virtualJoystick.updatePointer(pointer)
    })

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this.virtualJoystick.stop(pointer)
    })

    this.input.on('pointerupoutside', (pointer: Phaser.Input.Pointer) => {
      this.virtualJoystick.stop(pointer)
    })
  }

  /** 戦闘中だけポインタ移動を受け付ける。 */
  private canStartPointerMovement(): boolean {
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
    return true
  }

  private cancelVirtualJoystickIfNeeded(): void {
    if (this.virtualJoystick !== undefined) {
      this.virtualJoystick.cancel()
    }
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
        this.handlePlayerEnemyBulletHit(bulletObject as Phaser.GameObjects.Triangle)
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
        this.handleBulletEnemyHit(
          bulletObject as Phaser.GameObjects.Rectangle,
          enemyObject as Phaser.GameObjects.Rectangle,
        )
      },
      (bulletObject, enemyObject) => {
        return this.canPlayerBulletHitEnemy(
          bulletObject as Phaser.GameObjects.Rectangle,
          enemyObject as Phaser.GameObjects.Rectangle,
        )
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
  }

  // 役割: 切り株が一定間隔でキノコを出す
  private updateStumpMushroomSpawn(): void {
    updateStumpMushroomSpawns(
      this,
      this.enemyGroup,
      this.stageNumber,
      this.areaStageCount,
      this.time.now,
    )
  }

  // 役割: 枝が一定間隔でカブトムシを出す
  private updateBranchBeetleSpawn(): void {
    updateBranchBeetleSpawns(
      this,
      this.enemyGroup,
      this.stageNumber,
      this.areaStageCount,
      this.time.now,
    )
  }

  // 役割: 墓石が一定間隔で切り株と枝を出す
  private updateGravestoneBeetleSpawn(): void {
    updateGravestoneBeetleSpawns(
      this,
      this.enemyGroup,
      this.stageNumber,
      this.areaStageCount,
      this.time.now,
    )
  }

  // 役割: 最寄り敵へ自動射撃を試み、撃てたら SE を鳴らす
  // 呼び出し元: update（isStageActive）
  // 呼び出し先: tryFireBulletAtNearestEnemy, gameAudioSystem.playPlayerFire
  private updatePlayerAttack(): void {
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
    )

    if (didFire) {
      this.gameAudioSystem.playPlayerFire()
    }
  }

  // 役割: overlap の processCallback。貫通上限・同一敵への二重ヒットを命中前に弾く
  // 呼び出し元: setupBulletEnemyOverlap の processCallback
  // 呼び出し先: なし（弾・敵の getData を読むだけ）
  private canPlayerBulletHitEnemy(
    bullet: Phaser.GameObjects.Rectangle,
    enemy: Phaser.GameObjects.Rectangle,
  ): boolean {
    if (!bullet.active || !enemy.active) {
      return false
    }
    if (enemy.getData('isDefeated') === true) {
      return false
    }

    const hitsLeft = bullet.getData('hitsLeft') as number
    if (typeof hitsLeft !== 'number' || hitsLeft <= 0) {
      return false
    }

    const enemyUid = enemy.getData('enemyUid') as number
    if (typeof enemyUid !== 'number') {
      return true
    }

    const hitEnemyUidsRaw = bullet.getData('hitEnemyUids')
    if (!Array.isArray(hitEnemyUidsRaw)) {
      return true
    }

    // すでに命中した敵 UID なら false（同じ敵に何度も当たらない）
    for (let index = 0; index < hitEnemyUidsRaw.length; index++) {
      if (hitEnemyUidsRaw[index] === enemyUid) {
        return false
      }
    }

    return true
  }

  // 役割: 特殊敵の防御条件を満たしているか判定する
  private canBulletDamageSpecialEnemy(
    bullet: Phaser.GameObjects.Rectangle,
    enemy: Phaser.GameObjects.Rectangle,
    bulletDamage: number,
  ): boolean {
    const enemyKind = enemy.getData('enemyKind') as string

    if (enemyKind === 'armored') {
      const minimumDamage = enemy.getData('minimumDamage') as number
      return typeof minimumDamage !== 'number' || bulletDamage >= minimumDamage
    }

    if (enemyKind !== 'shielded') {
      return true
    }

    const flightVx = bullet.getData('flightVx') as number
    const flightVy = bullet.getData('flightVy') as number
    if (typeof flightVx !== 'number' || typeof flightVy !== 'number') {
      return false
    }

    // 盾敵の正面は常にプレイヤー方向。弾の進行方向との内積で正面攻撃を判定する
    const frontX = this.player.x - enemy.x
    const frontY = this.player.y - enemy.y
    const frontLength = Math.sqrt(frontX * frontX + frontY * frontY)
    const flightLength = Math.sqrt(flightVx * flightVx + flightVy * flightVy)
    if (frontLength <= 0 || flightLength <= 0) {
      return false
    }

    const dot =
      (flightVx / flightLength) * (frontX / frontLength) +
      (flightVy / flightLength) * (frontY / frontLength)
    return dot > ENEMY_SHIELD_FRONT_DOT_THRESHOLD
  }

  // 役割: プレイヤー弾が敵に当たったときのダメージ・撃破・爆破・貫通処理
  // 呼び出し元: setupBulletEnemyOverlap の overlap コールバック（物理ステップ内）
  // 呼び出し先: applyDamageToEnemy, CombatFeedback*, applyHitBlastIfUnlocked,
  //             trySpawnCoinAt, gameAudioSystem など
  private handleBulletEnemyHit(
    bullet: Phaser.GameObjects.Rectangle,
    enemy: Phaser.GameObjects.Rectangle,
  ): void {
    if (!bullet.active || !enemy.active || this.isLevelUpPaused) {
      return
    }

    // 弾の生成フレームは無視（発射瞬間の誤ヒット・撃破音防止）
    const collisionAge = bullet.getData('collisionAge') as number
    if (typeof collisionAge !== 'number' || collisionAge < 1) {
      return
    }

    // 弾と敵が入れ替わって渡された場合に備える（damage / hp の型で確認）
    const originalDamage = bullet.getData('damage')
    const enemyHp = enemy.getData('hp')
    if (typeof originalDamage !== 'number' || typeof enemyHp !== 'number') {
      return
    }

    // すでに倒れた敵には音もダメージも出さない
    if (enemy.getData('isDefeated') === true || enemyHp <= 0) {
      return
    }

    const hitEnemyUidsRaw = bullet.getData('hitEnemyUids')
    const hitEnemyUids: number[] = Array.isArray(hitEnemyUidsRaw)
      ? (hitEnemyUidsRaw as number[])
      : []
    const effectiveDamage = calculatePierceHitDamage(
      originalDamage,
      hitEnemyUids.length,
    )

    // 装甲不足または盾の正面からの攻撃は、0ダメージで弾を消す
    if (!this.canBulletDamageSpecialEnemy(bullet, enemy, effectiveDamage)) {
      playDamageNumber(this, enemy.x, enemy.y - 8, 0)
      playEnemyBlockedShield(this, enemy)
      this.gameAudioSystem.playEnemyBlocked()
      bullet.destroy()
      return
    }

    // 命中済み UID を記録（同じ敵への再ヒット防止）
    const enemyUid = enemy.getData('enemyUid') as number
    if (typeof enemyUid === 'number') {
      hitEnemyUids.push(enemyUid)
      bullet.setData('hitEnemyUids', hitEnemyUids)
    }

    // 残り命中を1減らす。0 になったらこの敵が最後（2体目 / 3体目 …）
    let hitsLeft = bullet.getData('hitsLeft') as number
    if (typeof hitsLeft !== 'number') {
      hitsLeft = 1
    }
    hitsLeft = hitsLeft - 1
    bullet.setData('hitsLeft', hitsLeft)

    const enemyX = enemy.x
    const enemyY = enemy.y
    const isDead = applyDamageToEnemy(enemy, effectiveDamage)

    // ダメージ数字をぴょんと飛ばす（撃破時も表示）
    playDamageNumber(this, enemyX, enemyY - 8, effectiveDamage)

    if (isDead) {
      recordEnemyDefeated()
      clearLockedTargetIfEnemyDestroyed(this.attackState, enemy)
      const xpDropMultiplier = getEnemyXpDropMultiplier(enemy)
      playEnemyDefeatFlash(this, enemyX, enemyY, ENEMY_WIDTH)
      this.gameAudioSystem.playEnemyDefeat()
      playEnemyDefeatFadeOut(this, enemy, () => {
        this.spawnExperienceCoinsAt(enemyX, enemyY, xpDropMultiplier)
      })
    } else {
      // 生存中のヒットは爽快なヒット音だけ
      this.gameAudioSystem.playEnemyHit()
    }

    // 範囲爆破スキル: 命中瞬間に周囲へ円ダメージ（本体は除外）
    this.applyHitBlastIfUnlocked(enemy, enemyX, enemyY, effectiveDamage)

    // 跳弾スキル: 命中済みではない最寄り敵へ向きを変える
    if (hitsLeft > 0 && this.tryRicochetBullet(bullet, hitEnemyUids, enemyX, enemyY)) {
      return
    }

    // 命中上限に達したら弾を消す（1回目の貫通取得なら2体目で消滅）
    if (hitsLeft <= 0) {
      bullet.destroy()
      return
    }

    // 貫通後も飛行速度を維持する（overlap で速度が乱れることがあるため再設定）
    const flightVx = bullet.getData('flightVx') as number
    const flightVy = bullet.getData('flightVy') as number
    if (
      bullet.body !== null &&
      typeof flightVx === 'number' &&
      typeof flightVy === 'number'
    ) {
      const body = bullet.body as Phaser.Physics.Arcade.Body
      body.setVelocity(flightVx, flightVy)
    }
  }

  // 役割: 残り跳弾回数があれば、命中点から最寄りの未命中敵へ弾を向け直す
  private tryRicochetBullet(
    bullet: Phaser.GameObjects.Rectangle,
    hitEnemyUids: number[],
    hitX: number,
    hitY: number,
  ): boolean {
    let ricochetsLeft = bullet.getData('ricochetsLeft') as number
    if (typeof ricochetsLeft !== 'number' || ricochetsLeft <= 0) {
      return false
    }

    const nextEnemy = findNearestUnhitEnemyInRange(
      this.enemyGroup,
      hitX,
      hitY,
      RICOCHET_SEARCH_RADIUS,
      hitEnemyUids,
    )
    if (nextEnemy === null) {
      return false
    }

    const didRedirect = redirectPlayerBulletToward(
      bullet,
      nextEnemy.x,
      nextEnemy.y,
    )
    if (!didRedirect) {
      return false
    }

    ricochetsLeft = ricochetsLeft - 1
    bullet.setData('ricochetsLeft', ricochetsLeft)
    return true
  }

  // 役割: 爆破レベルがあれば、命中点の周囲の敵にダメージを与える
  // 呼び出し元: handleBulletEnemyHit
  // 呼び出し先: calculateBlast*, HitBlastSystem, 撃破演出一式
  private applyHitBlastIfUnlocked(
    hitEnemy: Phaser.GameObjects.Rectangle,
    centerX: number,
    centerY: number,
    bulletDamage: number,
  ): void {
    const blastRadius = calculateBlastRadius(this.currentBlastLevel)
    const blastDamage = calculateBlastDamage(this.currentBlastLevel, bulletDamage)
    if (blastRadius <= 0 || blastDamage <= 0) {
      return
    }

    playHitBlastRing(this, centerX, centerY, blastRadius)
    const blastResult = applyHitBlastAroundPoint(
      this.enemyGroup,
      centerX,
      centerY,
      blastRadius,
      blastDamage,
      hitEnemy,
    )
    const killedByBlast = blastResult.killedEnemies

    for (let index = 0; index < killedByBlast.length; index++) {
      const killed = killedByBlast[index]
      recordEnemyDefeated()
      clearLockedTargetIfEnemyDestroyed(this.attackState, killed.enemy)
      const xpDropMultiplier = getEnemyXpDropMultiplier(killed.enemy)
      playDamageNumber(this, killed.x, killed.y - 8, killed.damage)
      playEnemyDefeatFlash(this, killed.x, killed.y, ENEMY_WIDTH)
      this.gameAudioSystem.playEnemyDefeat()
      playEnemyDefeatFadeOut(this, killed.enemy, () => {
        this.spawnExperienceCoinsAt(killed.x, killed.y, xpDropMultiplier)
      })
    }
  }

  // 役割: XP Bonusのレベルに応じた枚数の「1 XPコイン」を敵の周囲へ落とす
  private spawnExperienceCoinsAt(
    enemyX: number,
    enemyY: number,
    xpDropMultiplier: number = 1,
  ): void {
    const safeMultiplier = Math.max(1, Math.floor(xpDropMultiplier))
    const baseCoinCount = calculateXpCoinDropCount(this.currentXpBonusLevel)
    const coinCount = baseCoinCount * safeMultiplier
    const spreadRadius = coinCount > 1 ? 8 : 0

    for (let index = 0; index < coinCount; index++) {
      const angle = (Math.PI * 2 * index) / coinCount
      const coinX = enemyX + Math.cos(angle) * spreadRadius
      const coinY = enemyY + Math.sin(angle) * spreadRadius
      trySpawnCoinAt(this, this.coinGroup, coinX, coinY)
    }
  }

  // 役割: コイン取得 → XP 加算 → バー演出 → レベルアップ判定
  // 呼び出し元: setupCoinPickupOverlap のコールバック
  // 呼び出し先: playXpGainVisualEffect, animateXpBarTo, checkAndQueueLevelUps
  private handleCoinPickup(coin: CoinView): void {
    if (!coin.active || this.isPlayerDead || this.isStageSettled) {
      return
    }
    // クリア吸引中は拾える。通常のレベルアップ UI 中だけ拾わない
    if (this.isLevelUpPaused && !this.isClearCoinVacuum) {
      return
    }

    // XP Bonusはドロップ枚数へ反映済み。コインの xpValue をそのまま加算する
    const xpValue = coin.getData('xpValue') as number
    const coinX = coin.x
    const coinY = coin.y
    coin.destroy()

    this.gameAudioSystem.playCoinPickup()

    // XP は拾った瞬間に加算（連続取得でも欠落しない）
    const safeXp = typeof xpValue === 'number' ? Math.max(0, Math.floor(xpValue)) : 1
    this.totalXp = this.totalXp + safeXp
    playXpGainVisualEffect(this, this.hudSystem, coinX, coinY, safeXp)
    this.animateXpBarTo(this.totalXp)
    this.checkAndQueueLevelUps()
  }

  // 役割: クリア用ゴールドコイン取得 → 保存 → 上部バーへキラキラ
  private handleGoldCoinPickup(coin: GoldCoinView): void {
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
    this.gameAudioSystem.playCoinPickup()
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

    if (!this.isLevelUpPaused) {
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
  private beginNextLevelUpChoice(): void {
    if (this.pendingLevelUps <= 0 || this.isPlayerDead || this.isStageSettled) {
      return
    }
    // 順番: バナー → コイン吸引 → レベルアップ → 四角 UI
    if (this.isClearCoinVacuum || this.isStageClearBannerPlaying) {
      return
    }

    this.pauseGameForLevelUp()
    // 選択中は戦闘BGMを止め、レベルアップ音だけを聞こえやすくする
    // エリア最終ステージのクリアBGMはそのまま流す
    if (!this.gameAudioSystem.isAreaClearBgmActive()) {
      this.gameAudioSystem.stopBgm()
    }
    this.gameAudioSystem.playLevelUp()
    let requiredChoice: LevelUpChoiceId | undefined
    if (this.areaId === 'volcano' && this.stageNumber === 1 && this.currentMoveLevel < 2) {
      requiredChoice = 'move'
    }
    if (this.areaId === 'volcano' && this.stageNumber === 2 && this.currentAttackDamage < 3) {
      requiredChoice = 'damage'
    }
    if (
      this.areaId === 'volcano' &&
      (this.stageNumber === 3 || this.stageNumber === 4) &&
      this.currentRicochetLevel < 1
    ) {
      requiredChoice = 'ricochet'
    }
    this.levelUpChoiceSystem.show(
      (choiceId) => {
        this.applyLevelUpChoice(choiceId)
      },
      requiredChoice,
      this.getMaxedLevelUpChoiceIds(),
    )
  }

  // 役割: レベルアップ UI 中のポーズ（time 停止＋移動体の速度ゼロ）
  // 呼び出し元: beginNextLevelUpChoice
  // 呼び出し先: stopAllMovingBodies
  private pauseGameForLevelUp(): void {
    this.isLevelUpPaused = true
    this.time.paused = true
    // 弾は消さず、flightVx/Vy を残したまま他だけ止める（再開後に同じ方向へ飛ぶ）
    this.stopAllMovingBodies()
  }

  // 役割: レベルアップ UI 終了後に時間と弾の速度を再開する
  // 呼び出し元: applyLevelUpChoice（残りレベルアップがなく、クリア待ちでもないとき）
  // 呼び出し先: maintainPlayerBulletVelocities / maintainEnemyBulletVelocities
  private resumeGameAfterLevelUp(): void {
    this.isLevelUpPaused = false
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
  private stopAllMovingBodies(): void {
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
      ricochetLevel: this.currentRicochetLevel,
      xpBonusLevel: this.currentXpBonusLevel,
    })

    // 全能力が上限のときだけ現れる代替報酬。能力値は変えず、1Gを即保存する。
    if (choiceId === 'gold') {
      const goldResult = addGold(1)
      if (goldResult.shopJustUnlocked) {
        this.pendingShopUnlockNotify = true
      }
      this.hudSystem.refreshGold()
      playGoldGainVisualEffect(
        this,
        this.hudSystem,
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
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

    // Ruins ではレベルアップによる全回復なし。
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

    if (this.pendingLevelUps > 0) {
      this.beginNextLevelUpChoice()
      return
    }

    // クリア前吸引で得た XP のレベルアップが終わったら結果 UI へ
    if (this.waitingToShowStageClear) {
      this.showStageClearResult()
      return
    }

    this.resumeGameAfterLevelUp()
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

  // 役割: 敵との体当たりダメージ・ノックバック・死亡判定
  // 呼び出し元: setupPlayerEnemyOverlap のコールバック
  // 呼び出し先: PlayerDamageSystem*, handlePlayerDeath
  private handlePlayerEnemyOverlap(enemy: Phaser.GameObjects.Rectangle): void {
    if (this.isPlayerDead || this.isLevelUpPaused) {
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
    this.gameAudioSystem.playPlayerHurt()
    playPlayerHurtFlash(this)

    if (this.currentHp <= 0) {
      this.handlePlayerDeath()
    }
  }

  // 役割: 敵弾ヒット時のダメージ・ノックバック・死亡判定（無敵中でも弾は消す）
  // 呼び出し元: setupPlayerEnemyBulletOverlap のコールバック
  // 呼び出し先: PlayerDamageSystem*, handlePlayerDeath
  private handlePlayerEnemyBulletHit(bullet: Phaser.GameObjects.Triangle): void {
    if (this.isPlayerDead || this.isLevelUpPaused) {
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
      bullet.destroy()
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
    bullet.destroy()
    this.gameAudioSystem.playPlayerHurt()
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
    destroyAllEnemyBullets(this.enemyBulletGroup)
    this.stopAllMovingBodies()

    if (this.levelUpChoiceSystem.isOpen()) {
      this.levelUpChoiceSystem.hide()
      this.isLevelUpPaused = false
    }

    this.time.paused = true
    this.gameAudioSystem.stopBgm()
    this.gameAudioSystem.playGameOver()
    recordPlayerDeath()
    this.stageResultSystem.show('defeat', this.stageNumber, () => {
      this.time.paused = false
      clearRunProgress()
      this.scene.start('TitleScene')
    })
  }

  // 役割: 時間切れ（生存）または全ウェーブ後に敵ゼロでクリア開始条件を見る
  // 呼び出し元: update（isStageActive）
  // 呼び出し先: beginStageClearSequence
  private checkStageClearConditions(): void {
    if (
      this.isStageSettled ||
      this.isPlayerDead ||
      this.isStageClearBannerPlaying ||
      this.isClearCoinVacuum ||
      this.waitingToShowStageClear ||
      this.isLevelUpPaused ||
      this.currentHp <= 0
    ) {
      return
    }

    const timeUp = this.remainingSeconds <= 0
    const allEnemiesDefeated =
      this.waveSystem.areAllSpawnsFinished() && countActiveEnemies(this.enemyGroup) === 0
    const earlyClear = !timeUp && allEnemiesDefeated

    if (!timeUp && !allEnemiesDefeated) {
      return
    }

    this.beginStageClearSequence(earlyClear)
  }

  // 役割: クリア演出の入口。順番: ①大きなクリア文字 → ②コイン吸引 → ③レベルアップ → ④結果 UI
  // 呼び出し元: checkStageClearConditions
  // 呼び出し先: playStageClearBanner → beginClearCoinVacuum, playStageClear
  private beginStageClearSequence(didClearAllEnemiesBeforeTimeUp: boolean): void {
    if (this.isStageClearBannerPlaying || this.isStageSettled) {
      return
    }

    this.isStageClearBannerPlaying = true
    this.isStageActive = false
    this.waveSystem.stopWaves()
    destroyAllEnemyBullets(this.enemyBulletGroup)
    this.stopAllMovingBodies()

    if (this.levelUpChoiceSystem.isOpen()) {
      this.levelUpChoiceSystem.hide()
      this.isLevelUpPaused = false
      this.time.paused = false
    }

    // 戦闘 BGM を止めて、バナー表示と同時にクリア音を鳴らす。
    // エリア最終: AREA CLEAR! 表示と同時に LevelUp2／途中ステージ: STAGE CLEAR! と同時に通常クリア音
    this.gameAudioSystem.stopBgm()
    const isGameClear = isFinalStage(this.stageNumber, this.areaStageCount)
    if (isGameClear) {
      this.gameAudioSystem.playAreaClear()
    } else {
      this.gameAudioSystem.playStageClear()
    }

    playStageClearBanner(this, isGameClear, () => {
      if (didClearAllEnemiesBeforeTimeUp) {
        playAllEnemiesClearBanner(this, () => {
          const clearXpMultiplier = calculateClearXpBonusMultiplier(
            this.currentXpBonusLevel,
          )
          const baseBonusXp = ALL_ENEMIES_CLEAR_BONUS_XP * clearXpMultiplier
          const timeBonusXp = calculateAllEnemiesClearTimeBonusXp(
            baseBonusXp,
            this.remainingSeconds,
          )
          const totalBonusXp = baseBonusXp + timeBonusXp
          const hasNoDamageGoldBonus = !this.tookDamageThisStage
          playAllEnemiesRewardBanner(
            this,
            this.remainingSeconds,
            totalBonusXp,
            hasNoDamageGoldBonus,
            () => {
              this.awardStageClearRewards(true, baseBonusXp, timeBonusXp)
            },
          )
        })
        return
      }

      this.awardStageClearRewards(false, 0, 0)
    })
  }

  /**
   * ステージクリア報酬を保存し、中央から各HUD表示へキラキラを飛ばす。
   * 全敵撃破時: 基本ボーナスは即時 XP、時間ボーナスはコインとして落として吸引で取得。
   */
  private awardStageClearRewards(
    didClearAllEnemiesBeforeTimeUp: boolean,
    awardedAllEnemiesXp: number,
    timeBonusXp: number,
  ): void {
    if (didClearAllEnemiesBeforeTimeUp) {
      this.totalXp = this.totalXp + awardedAllEnemiesXp
      playXpGainVisualEffect(
        this,
        this.hudSystem,
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        awardedAllEnemiesXp,
      )
      this.animateXpBarTo(this.totalXp)

      // 残り時間ボーナス分のコインを中央付近の上から落とす（吸引で床コインと同じタイミングで取得）
      if (timeBonusXp > 0) {
        const fallHeight =
          PLAINS_FLOOR_TILE_DISPLAY_SIZE * CLEAR_TIME_BONUS_COIN_FALL_TILES
        spawnClearTimeBonusCoinRain(
          this,
          this.coinGroup,
          PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH / 2,
          PLAY_AREA_ORIGIN_Y + PLAY_AREA_HEIGHT / 2,
          timeBonusXp,
          fallHeight,
          CLEAR_TIME_BONUS_COIN_SPREAD_RADIUS,
          CLEAR_TIME_BONUS_COIN_FALL_MS,
        )
      }
    }

    const finalStage = isFinalStage(this.stageNumber, this.areaStageCount)
    const noDamageAllEnemiesClear =
      didClearAllEnemiesBeforeTimeUp && !this.tookDamageThisStage
    const awardedGold = calculateStageClearGold(
      this.areaId,
      finalStage,
      noDamageAllEnemiesClear,
    )
    // ゴールドは即時加算せず、上から落として吸引時に取得する
    if (awardedGold > 0) {
      const goldFallHeight =
        PLAINS_FLOOR_TILE_DISPLAY_SIZE * CLEAR_GOLD_COIN_FALL_TILES
      spawnClearGoldCoinRain(
        this,
        this.goldCoinGroup,
        PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH / 2,
        PLAY_AREA_ORIGIN_Y + PLAY_AREA_HEIGHT / 2,
        awardedGold,
        goldFallHeight,
        CLEAR_GOLD_COIN_SPREAD_RADIUS,
        CLEAR_GOLD_COIN_FALL_MS,
      )
    }

    const rewardEffectDurationMs = Math.max(
      XP_GAIN_EFFECT_DURATION_MS,
      CLEAR_TIME_BONUS_COIN_FALL_MS + 120,
      CLEAR_GOLD_COIN_FALL_MS + 120,
    )
    this.time.delayedCall(rewardEffectDurationMs + 150, () => {
      this.isStageClearBannerPlaying = false
      this.beginClearCoinVacuum()
    })
  }

  // 役割: 落ちているコインを全画面から集める吸引フェーズを開始する
  // 呼び出し元: beginStageClearSequence のバナー完了コールバック
  // 呼び出し先: stopCombatBodiesKeepCoins / finishClearCoinVacuum（コイン0のとき）
  private beginClearCoinVacuum(): void {
    if (this.isClearCoinVacuum || this.isStageSettled) {
      return
    }

    this.isClearCoinVacuum = true
    this.isStageActive = false
    this.clearCoinVacuumEmptySinceMs = 0
    this.stopCombatBodiesKeepCoins()

    // コインもゴールドもなければ次（レベルアップ or 結果 UI）へ
    if (
      countActiveCoins(this.coinGroup) === 0 &&
      countActiveGoldCoins(this.goldCoinGroup) === 0
    ) {
      this.finishClearCoinVacuum()
    }
  }

  // 役割: クリア吸引中の毎フレーム更新（コイン・ゴールドだけ動かし、空になって少し待って終了）
  // 呼び出し元: update（isClearCoinVacuum）
  // 呼び出し先: updateAllCoinsVacuumMovement, stepArcadePhysicsOnce, finishClearCoinVacuum
  private updateClearCoinVacuum(): void {
    this.playerBody.setVelocity(0, 0)
    updateAllCoinsVacuumMovement(this.coinGroup, this.player.x, this.player.y)
    updateAllGoldCoinsVacuumMovement(
      this.goldCoinGroup,
      this.player.x,
      this.player.y,
    )
    this.updateHudDisplay()

    stepArcadePhysicsOnce(this.arcadeWorld, this.time.now, this.game.loop.delta)
    updateAllEnemyHpBars(this.enemyGroup)

    if (
      countActiveCoins(this.coinGroup) > 0 ||
      countActiveGoldCoins(this.goldCoinGroup) > 0
    ) {
      this.clearCoinVacuumEmptySinceMs = 0
      return
    }

    // XP バー演出が少し見えるよう、空になってから短く待つ
    if (this.clearCoinVacuumEmptySinceMs === 0) {
      this.clearCoinVacuumEmptySinceMs = this.time.now
      return
    }

    if (this.time.now - this.clearCoinVacuumEmptySinceMs < STAGE_CLEAR_VACUUM_SETTLE_MS) {
      return
    }

    this.finishClearCoinVacuum()
  }

  // 役割: 吸引完了後、未処理レベルアップがあれば選択 UI、なければ結果 UI へ
  // 呼び出し元: beginClearCoinVacuum / updateClearCoinVacuum
  // 呼び出し先: beginNextLevelUpChoice または showStageClearResult
  private finishClearCoinVacuum(): void {
    this.isClearCoinVacuum = false
    this.clearCoinVacuumEmptySinceMs = 0
    this.stopAllMovingBodies()
    this.waitingToShowStageClear = true

    // ②吸引完了 → ③レベルアップ → ④四角の結果 UI
    this.syncPendingLevelUpsFromTotalXp()
    if (this.pendingLevelUps > 0) {
      this.beginNextLevelUpChoice()
      return
    }

    this.showStageClearResult()
  }

  // 役割: ステージクリア／ゲームクリアの結果 UI を出し、次の遷移先を決める
  // 呼び出し元: finishClearCoinVacuum / applyLevelUpChoice
  // 呼び出し先: AchievementSystem（ゲームクリア時）, stageResultSystem.show,
  //             scene.restart（次ステージ）または TitleScene
  private showStageClearResult(): void {
    if (this.isStageSettled) {
      return
    }

    this.waitingToShowStageClear = false
    this.isStageSettled = true
    this.isStageActive = false
    this.stopAllMovingBodies()
    this.time.paused = true

    const isGameClear = isFinalStage(this.stageNumber, this.areaStageCount)

    recordStageCleared()

    // ロック解除はゲームクリア時だけ判定する（途中ステージでは解除しない）
    // ただし Shop は Stage1 クリアのゴールド取得で開くので、そのときは結果画面に出す
    let unlockLines: string[] = []
    if (this.pendingShopUnlockNotify) {
      unlockLines = formatShopUnlockNotificationLines()
      this.pendingShopUnlockNotify = false
    }
    if (isGameClear) {
      recordGameClear()
      clearRunProgress()
      // 実績解放を先に行う（後で markAreaCleared すると、旧セーブ移行が
      // 「plains クリア済み＝すでに Pierce 解放済み」と誤判定して通知が出ない）
      const newlyUnlocked = evaluateAndUnlockGameClearAchievements({
        areaId: this.areaId,
        tookDamageThisRun: this.tookDamageThisRun,
        pickedPowerThisRun: this.pickedPowerThisRun,
      })
      unlockLines = unlockLines.concat(formatUnlockNotificationLines(newlyUnlocked))
      // 初めてそのエリアをクリアしたときだけ、次エリア解放を結果画面に出す
      const isFirstTimeAreaClear = markAreaCleared(this.areaId)
      if (isFirstTimeAreaClear) {
        const areaUnlockLines = formatAreaUnlockNotificationLines(this.areaId)
        // エリア解放を先に見せて、そのあとスキル解放を続ける
        unlockLines = areaUnlockLines.concat(unlockLines)
      }
      this.hudSystem.refreshUnlockStatus()
    }

    if (isGameClear) {
      this.stageResultSystem.show(
        'gameClear',
        this.stageNumber,
        () => {
          this.time.paused = false
          this.gameAudioSystem.stopBgm()
          this.scene.start('TitleScene')
        },
        unlockLines,
      )
      return
    }

    const nextStageNumber = this.stageNumber + 1
    const carriedProgress = this.createCarriedProgress()

    this.stageResultSystem.show(
      'clear',
      this.stageNumber,
      () => {
        this.time.paused = false
        // クリア BGM を止めて、次ステージで戦闘 BGM を再開する
        this.gameAudioSystem.stopBgm()
        this.scene.restart({
          stageNumber: nextStageNumber,
          carriedProgress,
          areaId: this.areaId,
          isKeyboardMode: this.movementState.isKeyboardMode,
        })
      },
      unlockLines,
    )
  }

  // 役割: クリア吸引中はコインだけ動かすため、プレイヤー・敵・プレイヤー弾を止める
  // 呼び出し元: beginClearCoinVacuum
  // 呼び出し先: destroyAllEnemyBullets, body.setVelocity(0, 0)
  private stopCombatBodiesKeepCoins(): void {
    this.playerBody.setVelocity(0, 0)
    destroyAllEnemyBullets(this.enemyBulletGroup)

    const enemies = this.enemyGroup.getChildren()
    for (let index = 0; index < enemies.length; index++) {
      const enemy = enemies[index] as Phaser.GameObjects.Rectangle
      if (!enemy.active || enemy.body === null) {
        continue
      }
      const body = enemy.body as Phaser.Physics.Arcade.Body
      body.setVelocity(0, 0)
    }

    const bullets = this.playerBulletGroup.getChildren()
    for (let index = 0; index < bullets.length; index++) {
      const bullet = bullets[index] as Phaser.GameObjects.Rectangle
      if (!bullet.active || bullet.body === null) {
        continue
      }
      const body = bullet.body as Phaser.Physics.Arcade.Body
      body.setVelocity(0, 0)
    }
  }
}
