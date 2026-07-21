// ============================================================
// WaveSystem.ts
// ------------------------------------------------------------
// ステージの時間軸に沿って敵をパック単位でスポーンする。
//
// 役割:
//   - GameConstants のスケジュールから遅延タイマーを組む
//   - 警告表示つきパック出現（Enemy.ts）を呼ぶ
//   - 同時出現上限を超えないよう制御（空きがなければ遅延して再試行）
//   - 終盤 FINAL WAVE 用の追加スポーンを 1 回だけ足せる
//
// 呼び出し元:
//   - GameScene.ts … startWaves / stopWaves / areAllSpawnsFinished /
//                     startFinalWaveExtraSpawns
//
// 関連ファイル:
//   - objects/Enemy.ts … startEnemyPackSpawnWithWarning / countActiveEnemies
//   - FinalWaveBannerSystem.ts … バナー表示は別。追加敵はこのシステムの担当
//   - GameConstants.ts … スケジュール・パックサイズ・最終ウェーブ間隔
// ============================================================

import Phaser from 'phaser'
import {
  WAVE_SPAWN_INTERVAL_SECONDS,
  getWaveConfigForStage,
  getSpawnScheduleForStage,
  getLastSpawnAtSeconds,
  getMaxEnemiesForStage,
  getRecurringEnemyCountForStage,
  getEnemyPackSizeRange,
  getEnemyPackGapSeconds,
  ENEMY_RANGED_PACK_SIZE,
  ENEMY_STUMP_PACK_SIZE,
  PLAINS_STAGE3_BEE_GROUPS_PER_SPAWN,
  PLAINS_STAGE3_BEE_GROUPS_ON_FINAL_WAVE,
  FINAL_WAVE_EXTRA_PACK_GAP_SECONDS,
  FINAL_WAVE_EXTRA_PACK_GAP_SECONDS_FINAL_STAGE,
  ENEMY_SPAWN_RETRY_DELAY_MS,
  isFinalStage,
  isPlainsFinalStage,
  shouldSpawnRangedEnemy,
  type StageAreaId,
} from '../GameConstants'
import {
  startEnemyPackSpawnWithWarning,
  countActiveEnemies,
} from '../objects/Enemy'

// ウェーブに沿って敵を時間差で出す
// Python: WaveScheduler クラスに相当
export class WaveSystem {
  private scene: Phaser.Scene
  private enemyGroup: Phaser.Physics.Arcade.Group
  private stageNumber: number
  // そのエリアのステージ総数（最終ステージ判定用）
  private totalStages: number
  private areaId: StageAreaId
  // スポーン時にプレイヤーの現在位置を取得するための関数（至近距離の湧き防止用）
  private getPlayerPosition?: () => { x: number; y: number }
  // delayedCall などで作ったタイマー。stopWaves でまとめて破棄する
  private spawnTimers: Phaser.Time.TimerEvent[] = []
  // まだ発火していない予定スポーン数（体数）
  private remainingScheduledSpawns = 0
  // 警告表示中で、まだ敵本体が出ていない数（体数）
  private pendingWarningSpawns = 0
  // FINAL WAVE 追加スポーンを二重に始めないためのフラグ
  private hasStartedFinalWave = false

  /**
   * ウェーブシステムを作る。
   * GameScene.create で new WaveSystem(this, enemyGroup, stageNumber, totalStages)。
   */
  constructor(
    scene: Phaser.Scene,
    enemyGroup: Phaser.Physics.Arcade.Group,
    stageNumber: number,
    totalStages: number,
    areaId: StageAreaId,
    getPlayerPosition?: () => { x: number; y: number },
  ) {
    this.scene = scene
    this.enemyGroup = enemyGroup
    this.stageNumber = stageNumber
    this.totalStages = totalStages
    this.areaId = areaId
    this.getPlayerPosition = getPlayerPosition
  }

  /**
   * ステージ用のスポーン予定を開始する。
   * 新形式（バーストスケジュール）があればそれを使い、なければ旧ウェーブ形式。
   */
  startWaves(): void {
    this.remainingScheduledSpawns = 0
    this.pendingWarningSpawns = 0
    this.hasStartedFinalWave = false

    const burstSchedule = getSpawnScheduleForStage(
      this.stageNumber,
      this.totalStages,
      this.areaId,
    )
    if (burstSchedule !== null) {
      this.startBurstSchedule(burstSchedule)
      return
    }

    this.startLegacyWaveSchedule()
  }

  /** 予定中のタイマーをすべて破棄し、カウンタをリセットする。 */
  stopWaves(): void {
    for (let index = 0; index < this.spawnTimers.length; index++) {
      this.spawnTimers[index].destroy()
    }
    this.spawnTimers = []
    this.remainingScheduledSpawns = 0
    this.pendingWarningSpawns = 0
  }

  /**
   * 予定スポーンと警告中スポーンがすべて終わったか。
   * GameScene が「敵がもう増えない」判定に使う。
   */
  areAllSpawnsFinished(): boolean {
    return this.remainingScheduledSpawns <= 0 && this.pendingWarningSpawns <= 0
  }

  /**
   * ラスト数秒: 通常の終盤バースト相当をもう1回分、パックで追加する（≈2倍）。
   * FinalWaveBannerSystem のバナーとセットで GameScene から呼ばれる。
   */
  startFinalWaveExtraSpawns(): void {
    if (this.hasStartedFinalWave) {
      return
    }
    this.hasStartedFinalWave = true

    const extraEnemyCount = getRecurringEnemyCountForStage(
      this.stageNumber,
      this.totalStages,
    )
    // ignoreLastSpawnLimit=true: 終盤制限を超えても追加してよい
    let packGapSeconds = FINAL_WAVE_EXTRA_PACK_GAP_SECONDS
    if (isFinalStage(this.stageNumber, this.totalStages)) {
      packGapSeconds = FINAL_WAVE_EXTRA_PACK_GAP_SECONDS_FINAL_STAGE
    }
    this.scheduleEnemyCountAsPacks(extraEnemyCount, 0, packGapSeconds, true)

    // Plains Stage3: FINAL WAVE でも蜂は1グループだけ追加する
    if (this.isPlainsBeeFixedStage()) {
      this.schedulePlainsBeeGroups(0, PLAINS_STAGE3_BEE_GROUPS_ON_FINAL_WAVE)
    }
  }

  /** Plains Stage3: 蜂を固定スケジュールで出すステージか。 */
  private isPlainsBeeFixedStage(): boolean {
    return isPlainsFinalStage(this.stageNumber, this.totalStages)
  }

  /**
   * Plains Stage3 の蜂グループを、指定ディレイから1グループずつ予約する。
   * 1グループ = ENEMY_RANGED_PACK_SIZE 体。
   */
  private schedulePlainsBeeGroups(baseDelaySeconds: number, groupCount: number): void {
    const safeGroupCount = Math.max(0, Math.floor(groupCount))
    for (let groupIndex = 0; groupIndex < safeGroupCount; groupIndex++) {
      this.schedulePackSpawnAttempt(
        baseDelaySeconds * 1000,
        ENEMY_RANGED_PACK_SIZE,
        true,
      )
    }
  }

  /** バースト配列の各要素をパック分割してスケジュールする。 */
  private startBurstSchedule(schedule: { delaySeconds: number; enemyCount: number }[]): void {
    for (let burstIndex = 0; burstIndex < schedule.length; burstIndex++) {
      this.scheduleBurstAsPacks(schedule[burstIndex])
    }

    // Plains Stage3: 初回（delay 0）は蜂なし。以降の各バーストで1グループずつ
    if (this.isPlainsBeeFixedStage()) {
      for (let burstIndex = 0; burstIndex < schedule.length; burstIndex++) {
        const burst = schedule[burstIndex]
        if (burst.delaySeconds <= 0) {
          continue
        }
        this.schedulePlainsBeeGroups(
          burst.delaySeconds,
          PLAINS_STAGE3_BEE_GROUPS_PER_SPAWN,
        )
      }
    }
  }

  /**
   * パックサイズをステージに合わせて決め、人数をパックに分割する。
   * 残りが少ないときは残り全員を 1 パックにする。
   * Plains Stage3 の蜂は一度に ENEMY_RANGED_PACK_SIZE（2）体だけ。
   */
  private pickPackSize(remainingCount: number, spawnAsRanged: boolean): number {
    // Volcano最終は群れを作らず、1体ずつ散発的に出す
    if (this.areaId === 'volcano' && this.stageNumber === 5) {
      return 1
    }

    // Forest Stage2 の切り株は2体固定
    if (this.areaId === 'forest' && this.stageNumber === 2) {
      if (remainingCount < ENEMY_STUMP_PACK_SIZE) {
        return remainingCount
      }
      return ENEMY_STUMP_PACK_SIZE
    }

    // Plains Stage3 の蜂は2体固定（泥スライムの大群とは別）
    if (spawnAsRanged && this.areaId === 'plains' && this.stageNumber >= 3) {
      if (remainingCount < ENEMY_RANGED_PACK_SIZE) {
        return remainingCount
      }
      return ENEMY_RANGED_PACK_SIZE
    }

    const packRange = getEnemyPackSizeRange(this.stageNumber, this.totalStages)
    let packSize = Phaser.Math.Between(packRange.min, packRange.max)
    if (packSize > remainingCount) {
      packSize = remainingCount
    }
    // 残りが最大パック以下なら、ちまちま分けず一括で出す
    if (remainingCount <= packRange.max) {
      packSize = remainingCount
    }
    return packSize
  }

  /**
   * enemyCount 体をパックに分け、baseDelay から packGap 刻みでスケジュールする。
   * packGapSeconds が null のときはエリア別の既定隙間を使う。
   * ignoreLastSpawnLimit=false のとき、最終スポーン時刻を超えるパックは切る。
   */
  private scheduleEnemyCountAsPacks(
    enemyCount: number,
    baseDelaySeconds: number,
    packGapSeconds: number | null,
    ignoreLastSpawnLimit: boolean,
  ): void {
    const lastSpawnAtSeconds = getLastSpawnAtSeconds(this.stageNumber)
    let remainingCount = enemyCount
    let packIndex = 0
    let effectivePackGapSeconds = packGapSeconds
    if (effectivePackGapSeconds === null) {
      effectivePackGapSeconds = getEnemyPackGapSeconds(
        this.areaId,
        this.stageNumber,
        this.totalStages,
      )
    }

    while (remainingCount > 0) {
      // パックごとに近接／射撃を先に決め、蜂なら人数を2に抑える
      const spawnAsRanged = shouldSpawnRangedEnemy(this.stageNumber, this.totalStages)
      const packSize = this.pickPackSize(remainingCount, spawnAsRanged)
      const delaySeconds = baseDelaySeconds + packIndex * effectivePackGapSeconds

      if (!ignoreLastSpawnLimit && delaySeconds > lastSpawnAtSeconds) {
        break
      }

      this.schedulePackSpawnAttempt(delaySeconds * 1000, packSize, spawnAsRanged)
      remainingCount = remainingCount - packSize
      packIndex = packIndex + 1
    }
  }

  // バースト人数をパックに分け、同じタイミング・近い位置で出す
  private scheduleBurstAsPacks(burst: { delaySeconds: number; enemyCount: number }): void {
    this.scheduleEnemyCountAsPacks(
      burst.enemyCount,
      burst.delaySeconds,
      null,
      false,
    )
  }

  /**
   * 旧形式: waveCount × enemiesPerWave を一定間隔で 1 体ずつスケジュールする。
   * 新しいステージはバーストスケジュール側を使う。
   */
  private startLegacyWaveSchedule(): void {
    const waveConfig = getWaveConfigForStage(this.stageNumber)
    const waveActiveEndMs = getLastSpawnAtSeconds(this.stageNumber) * 1000
    const spawnIntervalMs = WAVE_SPAWN_INTERVAL_SECONDS * 1000

    for (let waveIndex = 0; waveIndex < waveConfig.waveCount; waveIndex++) {
      const waveStartDelayMs = waveIndex * waveConfig.waveIntervalSeconds * 1000

      if (waveStartDelayMs >= waveActiveEndMs) {
        continue
      }

      for (let enemyIndex = 0; enemyIndex < waveConfig.enemiesPerWave; enemyIndex++) {
        const spawnDelayMs = waveStartDelayMs + enemyIndex * spawnIntervalMs

        if (spawnDelayMs >= waveActiveEndMs) {
          continue
        }

        this.schedulePackSpawnAttempt(spawnDelayMs, 1)
      }
    }
  }

  /**
   * delay 後にパック出現を試みるタイマーを 1 本登録する。
   * 発火前は remainingScheduledSpawns、発火後は警告中カウントへ移る。
   * spawnAsRanged を渡すと、スケジュール時に決めた種類をそのまま使う。
   */
  private schedulePackSpawnAttempt(
    spawnDelayMs: number,
    packSize: number,
    spawnAsRanged?: boolean,
  ): void {
    this.remainingScheduledSpawns = this.remainingScheduledSpawns + packSize

    const timer = this.scene.time.delayedCall(spawnDelayMs, () => {
      this.remainingScheduledSpawns = Math.max(0, this.remainingScheduledSpawns - packSize)
      this.tryStartEnemyPackSpawnWithWarning(packSize, spawnAsRanged)
    })
    this.spawnTimers.push(timer)
  }

  /**
   * 同時出現上限を見て、空きがある分だけ警告つきスポーンを開始する。
   * 空きが足りない分は捨てず、少し待ってから再試行する（敵が出ない／早期クリア防止）。
   */
  private tryStartEnemyPackSpawnWithWarning(
    requestedPackSize: number,
    spawnAsRanged?: boolean,
  ): void {
    const activeEnemyCount = countActiveEnemies(this.enemyGroup)
    const maxEnemies = getMaxEnemiesForStage(this.stageNumber, this.totalStages)
    // 警告中（まだ本体が出ていない）枠も予約済みとして空枠から引く
    const freeSlots = maxEnemies - activeEnemyCount - this.pendingWarningSpawns
    if (freeSlots <= 0) {
      // 満杯なので、空きができるまで同じパックを遅延再試行
      this.schedulePackSpawnAttempt(
        ENEMY_SPAWN_RETRY_DELAY_MS,
        requestedPackSize,
        spawnAsRanged,
      )
      return
    }

    let packSize = requestedPackSize
    let deferredCount = 0
    if (packSize > freeSlots) {
      deferredCount = packSize - freeSlots
      packSize = freeSlots
    }

    this.pendingWarningSpawns = this.pendingWarningSpawns + packSize

    const playerPosition =
      this.getPlayerPosition !== undefined ? this.getPlayerPosition() : undefined

    const warningTimers = startEnemyPackSpawnWithWarning(
      this.scene,
      this.enemyGroup,
      this.stageNumber,
      this.totalStages,
      packSize,
      () => {
        // 警告終了＝敵本体が出た（またはキャンセル）ので pending を減らす
        this.pendingWarningSpawns = Math.max(0, this.pendingWarningSpawns - packSize)
      },
      this.areaId,
      playerPosition,
      spawnAsRanged,
    )
    // 警告の点滅・本体出現タイマーも stopWaves で止められるように保持
    this.spawnTimers.push(warningTimers.blinkTimer)
    this.spawnTimers.push(warningTimers.spawnTimer)

    // 入りきらなかった分はあとで出す（XP やクリア判定が欠けるのを防ぐ）
    if (deferredCount > 0) {
      this.schedulePackSpawnAttempt(
        ENEMY_SPAWN_RETRY_DELAY_MS,
        deferredCount,
        spawnAsRanged,
      )
    }
  }
}
