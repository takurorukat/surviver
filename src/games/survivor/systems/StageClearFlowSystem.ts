/**
 * ステージクリア演出一式:
 * 条件判定 → バナー → 報酬 → コイン吸引 → 結果 UI。
 * GameScene からコンテキスト経由で呼ぶ。
 */
import Phaser from 'phaser'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PLAY_AREA_ORIGIN_X,
  PLAY_AREA_ORIGIN_Y,
  PLAY_AREA_WIDTH,
  PLAY_AREA_HEIGHT,
  XP_GAIN_EFFECT_DURATION_MS,
  STAGE_CLEAR_VACUUM_SETTLE_MS,
  ALL_ENEMIES_CLEAR_BONUS_XP,
  calculateClearXpBonusMultiplier,
  calculateAllEnemiesClearTimeBonusXp,
  CLEAR_TIME_BONUS_COIN_FALL_TILES,
  CLEAR_TIME_BONUS_COIN_SPREAD_RADIUS,
  CLEAR_TIME_BONUS_COIN_FALL_MS,
  CLEAR_GOLD_COIN_FALL_TILES,
  CLEAR_GOLD_COIN_SPREAD_RADIUS,
  CLEAR_GOLD_COIN_FALL_MS,
  PLAINS_FLOOR_TILE_DISPLAY_SIZE,
  TITLE_SHOW_SHOP_AND_SEAL,
  RUNTIME_ENABLE_GOLD_AND_SHOP,
  isFinalStage,
  calculateStageClearGold,
  type StageAreaId,
} from '../GameConstants'
import { countActiveEnemies, updateAllEnemyHpBars } from '../objects/Enemy'
import { countActiveCoins, spawnClearTimeBonusCoinRain } from '../objects/Coin'
import {
  countActiveGoldCoins,
  spawnClearGoldCoinRain,
  updateAllGoldCoinsVacuumMovement,
} from '../objects/GoldCoin'
import { destroyAllEnemyBullets } from '../objects/EnemyBullet'
import type { PlayerBulletVisual } from '../objects/PlayerBullet'
import { updateAllCoinsVacuumMovement } from './CoinMagnetSystem'
import { playXpGainVisualEffect } from './XpGainEffectSystem'
import {
  playStageClearBanner,
  playAllEnemiesClearBanner,
  playAllEnemiesRewardBanner,
} from './StageClearBannerSystem'
import {
  evaluateAndUnlockGameClearAchievements,
  formatUnlockNotificationLines,
  formatAreaUnlockNotificationLines,
  formatAreaClearMaxHpBonusLines,
  formatShopUnlockNotificationLines,
} from './AchievementSystem'
import {
  markAreaCleared,
  clearRunProgress,
  recordStageCleared,
  recordGameClear,
} from './UnlockSaveSystem'
import type { CarriedProgress } from '../types/CarriedProgress'
import type { WaveSystem } from './WaveSystem'
import type { HudSystem } from './HudSystem'
import type { StageResultSystem } from './StageResultSystem'
import type { GameAudioSystem } from './GameAudioSystem'
import type { LevelUpChoiceSystem } from './LevelUpChoiceSystem'
import { stepArcadePhysicsOnce } from '../utils/arcadePhysicsHelpers'

/** クリア演出が GameScene 側へ戻すためのコールバック一式 */
export type StageClearFlowContext = {
  scene: Phaser.Scene
  stageNumber: number
  areaId: StageAreaId
  areaStageCount: number
  remainingSeconds: number
  currentHp: number
  tookDamageThisStage: boolean
  tookDamageThisRun: boolean
  pickedPowerThisRun: boolean
  currentXpBonusLevel: number

  // --- フラグの読み書き（GameScene の private フィールドを閉じる） ---
  getIsStageSettled: () => boolean
  setIsStageSettled: (value: boolean) => void
  getIsPlayerDead: () => boolean
  getIsStageClearBannerPlaying: () => boolean
  setIsStageClearBannerPlaying: (value: boolean) => void
  getIsClearCoinVacuum: () => boolean
  setIsClearCoinVacuum: (value: boolean) => void
  getWaitingToShowStageClear: () => boolean
  setWaitingToShowStageClear: (value: boolean) => void
  getIsLevelUpPaused: () => boolean
  setIsLevelUpPaused: (value: boolean) => void
  getIsResumeCountdownActive: () => boolean
  setIsResumeCountdownActive: (value: boolean) => void
  setIsStartCountdownActive: (value: boolean) => void
  setIsStageActive: (value: boolean) => void
  getClearCoinVacuumEmptySinceMs: () => number
  setClearCoinVacuumEmptySinceMs: (value: number) => void
  getTotalXp: () => number
  setTotalXp: (value: number) => void
  getPendingLevelUps: () => number
  getPendingShopUnlockNotify: () => boolean
  setPendingShopUnlockNotify: (value: boolean) => void

  // --- グループ・システム ---
  enemyGroup: Phaser.Physics.Arcade.Group
  coinGroup: Phaser.Physics.Arcade.Group
  goldCoinGroup: Phaser.Physics.Arcade.Group
  playerBulletGroup: Phaser.Physics.Arcade.Group
  enemyBulletGroup: Phaser.Physics.Arcade.Group
  player: Phaser.GameObjects.Rectangle
  playerBody: Phaser.Physics.Arcade.Body
  arcadeWorld: Phaser.Physics.Arcade.World
  frameDelta: number
  nowMs: number
  waveSystem: WaveSystem
  hudSystem: HudSystem
  stageResultSystem: StageResultSystem
  gameAudioSystem: GameAudioSystem
  levelUpChoiceSystem: LevelUpChoiceSystem

  // --- GameScene 側の処理 ---
  stopAllMovingBodies: (options?: { keepRelativeFollow?: boolean }) => void
  animateXpBarTo: (totalXp: number) => void
  updateHudDisplay: () => void
  beginNextLevelUpChoice: () => void
  syncPendingLevelUpsFromTotalXp: () => void
  createCarriedProgress: () => CarriedProgress
  getIsKeyboardMode: () => boolean
}

/**
 * 時間切れ（生存）または全ウェーブ後に敵ゼロでクリア開始条件を見る。
 */
export function checkStageClearConditions(ctx: StageClearFlowContext): void {
  if (
    ctx.getIsStageSettled() ||
    ctx.getIsPlayerDead() ||
    ctx.getIsStageClearBannerPlaying() ||
    ctx.getIsClearCoinVacuum() ||
    ctx.getWaitingToShowStageClear() ||
    ctx.getIsLevelUpPaused() ||
    ctx.getIsResumeCountdownActive() ||
    ctx.currentHp <= 0
  ) {
    return
  }

  const timeUp = ctx.remainingSeconds <= 0
  const allEnemiesDefeated =
    ctx.waveSystem.areAllSpawnsFinished() && countActiveEnemies(ctx.enemyGroup) === 0
  const earlyClear = !timeUp && allEnemiesDefeated

  if (!timeUp && !allEnemiesDefeated) {
    return
  }

  beginStageClearSequence(ctx, earlyClear)
}

/**
 * クリア演出の入口。順番: ①大きなクリア文字 → ②コイン吸引 → ③レベルアップ → ④結果 UI
 */
export function beginStageClearSequence(
  ctx: StageClearFlowContext,
  didClearAllEnemiesBeforeTimeUp: boolean,
): void {
  if (ctx.getIsStageClearBannerPlaying() || ctx.getIsStageSettled()) {
    return
  }

  ctx.setIsStageClearBannerPlaying(true)
  ctx.setIsStageActive(false)
  ctx.waveSystem.stopWaves()
  destroyAllEnemyBullets(ctx.enemyBulletGroup)
  // マウス追従モードは消さない（次ステージへ isKeyboardMode を正しく渡すため）
  ctx.stopAllMovingBodies({ keepRelativeFollow: true })

  if (ctx.levelUpChoiceSystem.isOpen()) {
    ctx.levelUpChoiceSystem.hide()
    ctx.setIsLevelUpPaused(false)
    ctx.scene.time.paused = false
  }
  ctx.setIsResumeCountdownActive(false)
  ctx.setIsStartCountdownActive(false)

  // 戦闘 BGM を止めて、バナー表示と同時にクリア音を鳴らす。
  // エリア最終: AREA CLEAR! 表示と同時に LevelUp2／途中ステージ: STAGE CLEAR! と同時に通常クリア音
  ctx.gameAudioSystem.stopBgm()
  const isGameClear = isFinalStage(ctx.stageNumber, ctx.areaStageCount)
  if (isGameClear) {
    ctx.gameAudioSystem.playAreaClear()
  } else {
    ctx.gameAudioSystem.playStageClear()
  }

  playStageClearBanner(ctx.scene, isGameClear, () => {
    if (didClearAllEnemiesBeforeTimeUp) {
      playAllEnemiesClearBanner(ctx.scene, () => {
        const clearXpMultiplier = calculateClearXpBonusMultiplier(
          ctx.currentXpBonusLevel,
        )
        const baseBonusXp = ALL_ENEMIES_CLEAR_BONUS_XP * clearXpMultiplier
        const timeBonusXp = calculateAllEnemiesClearTimeBonusXp(
          baseBonusXp,
          ctx.remainingSeconds,
        )
        const totalBonusXp = baseBonusXp + timeBonusXp
        // Gold 休止中は NO DAMAGE · GOLD ×2 行も出さない（XP 行は維持）
        const hasNoDamageGoldBonus =
          RUNTIME_ENABLE_GOLD_AND_SHOP && !ctx.tookDamageThisStage
        playAllEnemiesRewardBanner(
          ctx.scene,
          ctx.remainingSeconds,
          totalBonusXp,
          hasNoDamageGoldBonus,
          () => {
            awardStageClearRewards(ctx, true, baseBonusXp, timeBonusXp)
          },
        )
      })
      return
    }

    awardStageClearRewards(ctx, false, 0, 0)
  })
}

/**
 * ステージクリア報酬を保存し、中央から各HUD表示へキラキラを飛ばす。
 * 全敵撃破時: 基本ボーナスは即時 XP、時間ボーナスはコインとして落として吸引で取得。
 */
export function awardStageClearRewards(
  ctx: StageClearFlowContext,
  didClearAllEnemiesBeforeTimeUp: boolean,
  awardedAllEnemiesXp: number,
  timeBonusXp: number,
): void {
  if (didClearAllEnemiesBeforeTimeUp) {
    ctx.setTotalXp(ctx.getTotalXp() + awardedAllEnemiesXp)
    playXpGainVisualEffect(
      ctx.scene,
      ctx.hudSystem,
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      awardedAllEnemiesXp,
    )
    ctx.animateXpBarTo(ctx.getTotalXp())

    // 残り時間ボーナス分のコインを中央付近の上から落とす（吸引で床コインと同じタイミングで取得）
    if (timeBonusXp > 0) {
      const fallHeight =
        PLAINS_FLOOR_TILE_DISPLAY_SIZE * CLEAR_TIME_BONUS_COIN_FALL_TILES
      spawnClearTimeBonusCoinRain(
        ctx.scene,
        ctx.coinGroup,
        PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH / 2,
        PLAY_AREA_ORIGIN_Y + PLAY_AREA_HEIGHT / 2,
        timeBonusXp,
        fallHeight,
        CLEAR_TIME_BONUS_COIN_SPREAD_RADIUS,
        CLEAR_TIME_BONUS_COIN_FALL_MS,
      )
    }
  }

  // Gold／Shop Runtime Disable: クリア Gold 雨は落とさない（XP コインは上で維持）
  if (RUNTIME_ENABLE_GOLD_AND_SHOP) {
    const finalStage = isFinalStage(ctx.stageNumber, ctx.areaStageCount)
    const noDamageAllEnemiesClear =
      didClearAllEnemiesBeforeTimeUp && !ctx.tookDamageThisStage
    const awardedGold = calculateStageClearGold(
      ctx.areaId,
      finalStage,
      noDamageAllEnemiesClear,
    )
    // ゴールドは即時加算せず、上から落として吸引時に取得する
    if (awardedGold > 0) {
      const goldFallHeight =
        PLAINS_FLOOR_TILE_DISPLAY_SIZE * CLEAR_GOLD_COIN_FALL_TILES
      spawnClearGoldCoinRain(
        ctx.scene,
        ctx.goldCoinGroup,
        PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH / 2,
        PLAY_AREA_ORIGIN_Y + PLAY_AREA_HEIGHT / 2,
        awardedGold,
        goldFallHeight,
        CLEAR_GOLD_COIN_SPREAD_RADIUS,
        CLEAR_GOLD_COIN_FALL_MS,
      )
    }
  }

  const rewardEffectDurationMs = Math.max(
    XP_GAIN_EFFECT_DURATION_MS,
    CLEAR_TIME_BONUS_COIN_FALL_MS + 120,
    CLEAR_GOLD_COIN_FALL_MS + 120,
  )
  ctx.scene.time.delayedCall(rewardEffectDurationMs + 150, () => {
    ctx.setIsStageClearBannerPlaying(false)
    beginClearCoinVacuum(ctx)
  })
}

/**
 * 落ちているコインを全画面から集める吸引フェーズを開始する。
 */
export function beginClearCoinVacuum(ctx: StageClearFlowContext): void {
  if (ctx.getIsClearCoinVacuum() || ctx.getIsStageSettled()) {
    return
  }

  ctx.setIsClearCoinVacuum(true)
  ctx.setIsStageActive(false)
  ctx.setClearCoinVacuumEmptySinceMs(0)
  stopCombatBodiesKeepCoins(ctx)

  // コインもゴールドもなければ次（レベルアップ or 結果 UI）へ
  if (
    countActiveCoins(ctx.coinGroup) === 0 &&
    countActiveGoldCoins(ctx.goldCoinGroup) === 0
  ) {
    finishClearCoinVacuum(ctx)
  }
}

/**
 * クリア吸引中の毎フレーム更新（コイン・ゴールドだけ動かし、空になって少し待って終了）。
 */
export function updateClearCoinVacuum(ctx: StageClearFlowContext): void {
  ctx.playerBody.setVelocity(0, 0)
  updateAllCoinsVacuumMovement(ctx.coinGroup, ctx.player.x, ctx.player.y)
  updateAllGoldCoinsVacuumMovement(
    ctx.goldCoinGroup,
    ctx.player.x,
    ctx.player.y,
  )
  ctx.updateHudDisplay()

  stepArcadePhysicsOnce(ctx.arcadeWorld, ctx.nowMs, ctx.frameDelta)
  updateAllEnemyHpBars(ctx.enemyGroup)

  if (
    countActiveCoins(ctx.coinGroup) > 0 ||
    countActiveGoldCoins(ctx.goldCoinGroup) > 0
  ) {
    ctx.setClearCoinVacuumEmptySinceMs(0)
    return
  }

  // XP バー演出が少し見えるよう、空になってから短く待つ
  if (ctx.getClearCoinVacuumEmptySinceMs() === 0) {
    ctx.setClearCoinVacuumEmptySinceMs(ctx.nowMs)
    return
  }

  if (ctx.nowMs - ctx.getClearCoinVacuumEmptySinceMs() < STAGE_CLEAR_VACUUM_SETTLE_MS) {
    return
  }

  finishClearCoinVacuum(ctx)
}

/**
 * 吸引完了後、未処理レベルアップがあれば選択 UI、なければ結果 UI へ。
 */
export function finishClearCoinVacuum(ctx: StageClearFlowContext): void {
  ctx.setIsClearCoinVacuum(false)
  ctx.setClearCoinVacuumEmptySinceMs(0)
  ctx.stopAllMovingBodies({ keepRelativeFollow: true })
  ctx.setWaitingToShowStageClear(true)

  // ②吸引完了 → ③レベルアップ → ④四角の結果 UI
  ctx.syncPendingLevelUpsFromTotalXp()
  if (ctx.getPendingLevelUps() > 0) {
    ctx.beginNextLevelUpChoice()
    return
  }

  showStageClearResult(ctx)
}

/**
 * ステージクリア／ゲームクリアの結果 UI を出し、次の遷移先を決める。
 */
export function showStageClearResult(ctx: StageClearFlowContext): void {
  if (ctx.getIsStageSettled()) {
    return
  }

  ctx.setWaitingToShowStageClear(false)
  ctx.setIsStageSettled(true)
  ctx.setIsStageActive(false)
  ctx.stopAllMovingBodies({ keepRelativeFollow: true })
  ctx.scene.time.paused = true

  const isGameClear = isFinalStage(ctx.stageNumber, ctx.areaStageCount)

  recordStageCleared()

  // ロック解除はゲームクリア時だけ判定する（途中ステージでは解除しない）
  // ただし Shop は Stage1 クリアのゴールド取得で開くので、そのときは結果画面に出す
  // （タイトルに Shop を出していないあいだは Shop 解放案内も出さない）
  let unlockLines: string[] = []
  if (
    RUNTIME_ENABLE_GOLD_AND_SHOP &&
    TITLE_SHOW_SHOP_AND_SEAL &&
    ctx.getPendingShopUnlockNotify()
  ) {
    unlockLines = formatShopUnlockNotificationLines()
    ctx.setPendingShopUnlockNotify(false)
  } else if (ctx.getPendingShopUnlockNotify()) {
    ctx.setPendingShopUnlockNotify(false)
  }
  if (isGameClear) {
    recordGameClear()
    clearRunProgress()
    // 実績解放を先に行う（後で markAreaCleared すると、旧セーブ移行が
    // 「エリアクリア済み＝すでに実績解放済み」と誤判定して通知が出ない）
    const newlyUnlocked = evaluateAndUnlockGameClearAchievements({
      areaId: ctx.areaId,
      tookDamageThisRun: ctx.tookDamageThisRun,
      pickedPowerThisRun: ctx.pickedPowerThisRun,
    })
    unlockLines = unlockLines.concat(formatUnlockNotificationLines(newlyUnlocked))
    // 初めてそのエリアをクリアしたときだけ、次エリア解放を結果画面に出す
    const isFirstTimeAreaClear = markAreaCleared(ctx.areaId)
    if (isFirstTimeAreaClear) {
      const areaUnlockLines = formatAreaUnlockNotificationLines(ctx.areaId)
      const maxHpBonusLines = formatAreaClearMaxHpBonusLines(ctx.areaId)
      // エリア解放 → Max HP ボーナス → スキル解放の順で見せる
      unlockLines = areaUnlockLines.concat(maxHpBonusLines).concat(unlockLines)
    }
    ctx.hudSystem.refreshUnlockStatus()
  }

  if (isGameClear) {
    ctx.stageResultSystem.show(
      'gameClear',
      ctx.stageNumber,
      () => {
        ctx.scene.time.paused = false
        ctx.gameAudioSystem.stopAllSounds()
        ctx.scene.scene.start('TitleScene')
      },
      unlockLines,
    )
    return
  }

  const nextStageNumber = ctx.stageNumber + 1
  const carriedProgress = ctx.createCarriedProgress()
  const areaId = ctx.areaId
  const isKeyboardMode = ctx.getIsKeyboardMode()

  ctx.stageResultSystem.show(
    'clear',
    ctx.stageNumber,
    () => {
      ctx.scene.time.paused = false
      // クリア BGM を止めて、次ステージで戦闘 BGM を再開する
      ctx.gameAudioSystem.stopBgm()
      ctx.scene.scene.restart({
        stageNumber: nextStageNumber,
        carriedProgress,
        areaId,
        isKeyboardMode,
      })
    },
    unlockLines,
  )
}

/**
 * クリア吸引中はコインだけ動かすため、プレイヤー・敵・プレイヤー弾を止める。
 */
export function stopCombatBodiesKeepCoins(ctx: StageClearFlowContext): void {
  ctx.playerBody.setVelocity(0, 0)
  destroyAllEnemyBullets(ctx.enemyBulletGroup)

  const enemies = ctx.enemyGroup.getChildren()
  for (let index = 0; index < enemies.length; index++) {
    const enemy = enemies[index] as Phaser.GameObjects.Rectangle
    if (!enemy.active || enemy.body === null) {
      continue
    }
    const body = enemy.body as Phaser.Physics.Arcade.Body
    body.setVelocity(0, 0)
  }

  const bullets = ctx.playerBulletGroup.getChildren()
  for (let index = 0; index < bullets.length; index++) {
    const bullet = bullets[index] as PlayerBulletVisual
    if (!bullet.active || bullet.body === null) {
      continue
    }
    const body = bullet.body as Phaser.Physics.Arcade.Body
    body.setVelocity(0, 0)
  }
}
