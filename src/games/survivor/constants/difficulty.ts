// constants/difficulty.ts
// ステージ時間・スポーン・HP/速度スケーリング

import { isFinalStage } from './areas'
import type { StageAreaId } from './areas'
import {
  ENEMY_BASE_HP,
  ENEMY_BASE_SPEED,
  ENEMY_BRANCH_SPEED_FACTOR,
  ENEMY_BURNING_TREE_SPEED_FACTOR,
  ENEMY_HP_POWER_SCALE,
  ENEMY_PACK_GAP_SECONDS,
  ENEMY_PACK_LARGE_FIRST_STAGE,
  ENEMY_PACK_SIZE_STAGE_1_2,
  ENEMY_PACK_SIZE_STAGE_3_4_MAX,
  ENEMY_PACK_SIZE_STAGE_3_4_MIN,
  ENEMY_PACK_SIZE_STAGE_5_7_MAX,
  ENEMY_PACK_SIZE_STAGE_5_7_MIN,
  ENEMY_PACK_SIZE_STAGE_8_10_MAX,
  ENEMY_PACK_SIZE_STAGE_8_10_MIN,
  ENEMY_RANGED_FIRST_STAGE,
  ENEMY_RANGED_SPAWN_CHANCE_STAGE_3_4,
  ENEMY_RANGED_SPAWN_CHANCE_STAGE_5_7,
  ENEMY_RANGED_SPEED_FACTOR,
  ENEMY_SPEED_GROWTH_PER_STAGE,
  ENEMY_STONE_GUARD_SPEED_FACTOR,
  ENEMY_EARTH_ROCK_SPEED_FACTOR,
  ENEMY_STUMP_SPEED_FACTOR,
  ENEMY_TOUGH_MELEE_MAX_HP,
  ENEMY_TOUGH_MELEE_MIN_HP,
  ENEMY_TOUGH_MELEE_SPEED_FACTOR,
  ENEMY_WIND_HIVE_BOSS_SPEED_FACTOR,
  ENEMY_EARTH_DUNGEON_BOSS_SPEED_FACTOR,
  EXPECTED_LEVEL_UPS_PER_STAGE,
  EXPECTED_POWER_GROWTH_PER_LEVEL_UP,
  FOREST_STAGE5_SPAWN_COUNT_FACTOR,
  RUINS_STAGE3_SPAWN_COUNT_FACTOR,
} from './enemies'

// --- ステージ進行・制限時間・スポーン量 ---
// WaveSystem / GameScene がステージ番号に応じて時間と敵数を決める。
// ステージ総数はエリアごと（Plains=3, Forest=5）。TOTAL_STAGES は使わない。
// 全ステージ共通の制限時間
export const STAGE_DURATION_SECONDS = 30
// スポーンは制限時間の少し前まで（クリア余裕を残す）
export const STAGE_LAST_SPAWN_SECONDS = 22
export const STAGE_SPAWN_BURST_INTERVAL_SECONDS = 5
// Forest 最終ステージ（Stage5）だけスポーン間隔を短くする（少し抑えた値）
export const FOREST_FINAL_STAGE_SPAWN_BURST_INTERVAL_SECONDS = 4.5
export const FOREST_FINAL_STAGE_PACK_GAP_SECONDS = 0.28
export const STAGE_INITIAL_ENEMY_BASE = 3
export const STAGE_RECURRING_ENEMY_BASE = 5
// ステージが進むほど出る数が増える（貫通のありがたさが出るように密度高め）
export const STAGE_INITIAL_ENEMY_GROWTH = 0.8
export const STAGE_RECURRING_ENEMY_GROWTH = 1.2

// --- Final Wave（残り時間の終盤の警告と追加スポーン）---
export const FINAL_WAVE_REMAINING_SECONDS = 10
// 追加パックの間隔（秒）。通常バースト分をもう1回分、終盤に散らす
export const FINAL_WAVE_EXTRA_PACK_GAP_SECONDS = 1.6

// --- ウェーブ（後方互換・レガシー用）---
export const WAVE_SPAWN_INTERVAL_SECONDS = 2

// --- 同時出現のソフト上限（出しすぎ防止の安全弁。厳しく絞らない）---
// 重さ対策はオブジェクトプールと HP バー軽量化で行い、ここは非常時の天井だけ。
export const MAX_ENEMIES = 64
export const MAX_ENEMIES_PER_STAGE_BONUS = 6
export const MAX_ENEMIES_HARD_CAP = 160
// 同時出現上限で空きがないとき、この待ちのあと再試行（捨てない）
export const ENEMY_SPAWN_RETRY_DELAY_MS = 750
// 弾・コインもプール再利用前提で余裕を持たせる
export const MAX_PLAYER_BULLETS = 40
export const MAX_ENEMY_BULLETS = 48
export const MAX_COINS = 160
/**
 * ステージごとのパック人数レンジ（Stage3+ は大きめ）。
 * WaveSystem が何体まとめて警告スポーンするかを決める。
 * totalStages = そのエリアの最終ステージ番号。
 */
export function getEnemyPackSizeRange(
  stageNumber: number,
  totalStages: number,
): { min: number; max: number } {
  const safeStage = Math.max(1, stageNumber)
  if (isPlainsFinalStage(safeStage, totalStages)) {
    return {
      min: PLAINS_FINAL_STAGE_PACK_SIZE_MIN,
      max: PLAINS_FINAL_STAGE_PACK_SIZE_MAX,
    }
  }
  // エリア最終ステージは最大サイズの群れ
  if (isFinalStage(safeStage, totalStages)) {
    return { min: FINAL_STAGE_PACK_SIZE_MIN, max: FINAL_STAGE_PACK_SIZE_MAX }
  }
  if (safeStage < ENEMY_PACK_LARGE_FIRST_STAGE) {
    return { min: ENEMY_PACK_SIZE_STAGE_1_2, max: ENEMY_PACK_SIZE_STAGE_1_2 }
  }
  if (safeStage <= 4) {
    return { min: ENEMY_PACK_SIZE_STAGE_3_4_MIN, max: ENEMY_PACK_SIZE_STAGE_3_4_MAX }
  }
  if (safeStage <= 7) {
    return { min: ENEMY_PACK_SIZE_STAGE_5_7_MIN, max: ENEMY_PACK_SIZE_STAGE_5_7_MAX }
  }
  return { min: ENEMY_PACK_SIZE_STAGE_8_10_MIN, max: ENEMY_PACK_SIZE_STAGE_8_10_MAX }
}

// エリア最終ステージだけ難易度を一段上げる倍率・加算
export const FINAL_STAGE_ENEMY_COUNT_BONUS = 6
export const FINAL_STAGE_HP_MULTIPLIER = 1.75
export const FINAL_STAGE_SPEED_MULTIPLIER = 1.25
export const FINAL_STAGE_RANGED_SPAWN_CHANCE = 0.85
export const FINAL_STAGE_PACK_SIZE_MIN = 8
export const FINAL_STAGE_PACK_SIZE_MAX = 9
export const FINAL_STAGE_MAX_ENEMIES_BONUS = 8
export const FINAL_WAVE_EXTRA_PACK_GAP_SECONDS_FINAL_STAGE = 1.1

// Plains Stage 2 は少し硬い泥スライム（toughMelee）専用データを使う。
// 旧名の別名（他ファイル参照があれば壊さない）
export const PLAINS_STAGE_2_MIN_ENEMY_HP = ENEMY_TOUGH_MELEE_MIN_HP
export const PLAINS_STAGE_2_MAX_ENEMY_HP = ENEMY_TOUGH_MELEE_MAX_HP
// Plains Stage 3 は最初に到達する最終面なので、通常の最終面補正を弱める
export const PLAINS_FINAL_STAGE_ENEMY_COUNT_BONUS = 2
export const PLAINS_FINAL_STAGE_HP_MULTIPLIER = 1.25
// 射撃敵は距離を取るぶん倒しにくいため、Plains最終面だけHPを少し下げる（4→3程度）。
export const PLAINS_FINAL_STAGE_RANGED_HP_MULTIPLIER = 0.75
export const PLAINS_FINAL_STAGE_SPEED_MULTIPLIER = 1.08
export const PLAINS_FINAL_STAGE_RANGED_SPAWN_CHANCE = 0.45
export const PLAINS_FINAL_STAGE_PACK_SIZE_MIN = 5
export const PLAINS_FINAL_STAGE_PACK_SIZE_MAX = 6
export const PLAINS_FINAL_STAGE_MAX_ENEMIES_BONUS = 2

export function isPlainsFinalStage(stageNumber: number, totalStages: number): boolean {
  return totalStages === 3 && stageNumber >= 3
}
// --- ウェーブ／スポーン予定の型と関数 ---
// Python: {1: {...}, 2: {...}} のような辞書に相当する設定型。
// 現行の本線は getSpawnScheduleForStage（WaveSystem）。getWaveConfigForStage はレガシー。
export type WaveConfig = {
  waveCount: number
  enemiesPerWave: number
  waveIntervalSeconds: number
}

/** 1回のスポーンバースト（開始からの遅延秒と敵数） */
export type SpawnBurst = {
  delaySeconds: number
  enemyCount: number
}

/**
 * ステージの制限時間（秒）。全ステージ共通。
 */
export function getStageDurationSeconds(_stageNumber: number): number {
  return STAGE_DURATION_SECONDS
}

/**
 * 通常バースト予定の最終時刻（秒）。
 * Earth Dungeon Stage3 はファイナルウェーブ（残り10秒＝経過20秒）より前で打ち切り、
 * その後はファイナルウェーブだけが敵を出す。
 */
export function getLastSpawnAtSeconds(
  stageNumber: number,
  areaId: StageAreaId | string = 'plains',
): number {
  if (isRuinsStage3(areaId, stageNumber)) {
    // 30 - 10 - 5 = 15 → バースト 0/5/10/15、ファイナルウェーブは経過20秒
    return Math.max(
      0,
      STAGE_DURATION_SECONDS -
        FINAL_WAVE_REMAINING_SECONDS -
        STAGE_SPAWN_BURST_INTERVAL_SECONDS,
    )
  }
  return STAGE_LAST_SPAWN_SECONDS
}

/** Forest の最終ステージ（全5種の敵を混ぜるステージ）か。 */
export function isForestFinalStage(
  areaId: StageAreaId,
  stageNumber: number,
  totalStages: number,
): boolean {
  return areaId === 'forest' && isFinalStage(stageNumber, totalStages)
}

/** Volcano の最終ステージ（Stage1〜4 の敵を混ぜるステージ）か。 */
export function isVolcanoFinalStage(
  areaId: StageAreaId,
  stageNumber: number,
  totalStages: number,
): boolean {
  return areaId === 'volcano' && isFinalStage(stageNumber, totalStages)
}

/**
 * Volcano Stage2 以降は群れではなく各地に散らして出す。
 * （跳弾 Ricochet が効きやすくなる）
 */
export function shouldScatterVolcanoEnemySpawns(
  areaId: StageAreaId,
  stageNumber: number,
): boolean {
  return areaId === 'volcano' && stageNumber >= 2
}

/**
 * Earth Dungeon（ruins）Stage3 か。
 */
export function isRuinsStage3(areaId: StageAreaId | string, stageNumber: number): boolean {
  return areaId === 'ruins' && stageNumber === 3
}

/**
 * Ruins Stage3 は固まらず各地に散らして出す。
 */
export function shouldScatterRuinsStage3EnemySpawns(
  areaId: StageAreaId,
  stageNumber: number,
): boolean {
  return isRuinsStage3(areaId, stageNumber)
}

/**
 * ファイナルウェーブ開始後に、新規スポーン（リトライ含む）を止めるステージか。
 * Earth Dungeon Stage3: ファイナルウェーブが最後の湧き。
 */
export function shouldCloseSpawnsAfterFinalWave(
  areaId: StageAreaId | string,
  stageNumber: number,
): boolean {
  return isRuinsStage3(areaId, stageNumber)
}

/**
 * 定期スポーン（バースト）の間隔（秒）。
 * Forest 最終は早め。
 */
export function getSpawnBurstIntervalSeconds(
  areaId: StageAreaId,
  stageNumber: number,
  totalStages: number,
): number {
  if (isForestFinalStage(areaId, stageNumber, totalStages)) {
    return FOREST_FINAL_STAGE_SPAWN_BURST_INTERVAL_SECONDS
  }
  return STAGE_SPAWN_BURST_INTERVAL_SECONDS
}

/**
 * 同じバースト内でパックを分ける隙間（秒）。
 */
export function getEnemyPackGapSeconds(
  areaId: StageAreaId,
  stageNumber: number,
  _totalStages: number,
): number {
  if (isVolcanoFinalStage(areaId, stageNumber, _totalStages)) {
    return 0.35
  }
  if (isForestFinalStage(areaId, stageNumber, _totalStages)) {
    return FOREST_FINAL_STAGE_PACK_GAP_SECONDS
  }
  return ENEMY_PACK_GAP_SECONDS
}

/**
 * 想定プレイヤー火力（Stage 1 = 1.0）。
 * レベルアップ成長に合わせて敵 HP を強くする基準。
 * Python: 1 + levels_per_stage * growth * (stage - 1) に相当
 */
export function calculateExpectedPlayerPower(stageNumber: number): number {
  const safeStage = Math.max(1, stageNumber)
  return (
    1 +
    EXPECTED_LEVEL_UPS_PER_STAGE * EXPECTED_POWER_GROWTH_PER_LEVEL_UP * (safeStage - 1)
  )
}

/**
 * 定期バースト1回あたりの敵数（ステージが進むほど増える）。
 * 実際の出現は WaveSystem が 3〜4 体パックに分割する。
 */
export function getRecurringEnemyCountForStage(
  stageNumber: number,
  totalStages: number,
): number {
  const safeStage = Math.max(1, stageNumber)
  let count =
    STAGE_RECURRING_ENEMY_BASE + Math.floor((safeStage - 1) * STAGE_RECURRING_ENEMY_GROWTH)
  // エリア最終ステージは追加で敵を増やす
  if (isPlainsFinalStage(safeStage, totalStages)) {
    count = count + PLAINS_FINAL_STAGE_ENEMY_COUNT_BONUS
  } else if (isFinalStage(safeStage, totalStages)) {
    count = count + FINAL_STAGE_ENEMY_COUNT_BONUS
  }
  return count
}

/**
 * ステージ開始直後の初回スポーン敵数。
 */
export function getInitialEnemyCountForStage(
  stageNumber: number,
  totalStages: number,
): number {
  const safeStage = Math.max(1, stageNumber)
  let count =
    STAGE_INITIAL_ENEMY_BASE + Math.floor((safeStage - 1) * STAGE_INITIAL_ENEMY_GROWTH)
  if (isPlainsFinalStage(safeStage, totalStages)) {
    count = count + PLAINS_FINAL_STAGE_ENEMY_COUNT_BONUS
  } else if (isFinalStage(safeStage, totalStages)) {
    count = count + FINAL_STAGE_ENEMY_COUNT_BONUS
  }
  return count
}

/**
 * Forest Stage5 だけ出現数を調整する。Stage1〜4 は通常のまま。
 */
export function applyForestStage5SpawnCountFactor(
  areaId: StageAreaId,
  stageNumber: number,
  enemyCount: number,
): number {
  if (areaId === 'forest' && stageNumber === 5) {
    return Math.max(1, Math.round(enemyCount * FOREST_STAGE5_SPAWN_COUNT_FACTOR))
  }
  return enemyCount
}

/**
 * Ruins Stage3 の出現数を Forest Stage3 より増やす。
 */
export function applyRuinsStage3SpawnCountFactor(
  areaId: StageAreaId,
  stageNumber: number,
  enemyCount: number,
): number {
  if (isRuinsStage3(areaId, stageNumber)) {
    return Math.max(1, Math.round(enemyCount * RUINS_STAGE3_SPAWN_COUNT_FACTOR))
  }
  return enemyCount
}

/**
 * 全ステージ共通: 最初に数体、以降一定間隔でバーストする予定表を返す。
 * WaveSystem がこのスケジュールに沿って警告付きスポーンを予約する。
 */
export function getSpawnScheduleForStage(
  stageNumber: number,
  totalStages: number,
  areaId: StageAreaId = 'plains',
): SpawnBurst[] | null {
  let initialCount = getInitialEnemyCountForStage(stageNumber, totalStages)
  let recurringCount = getRecurringEnemyCountForStage(stageNumber, totalStages)
  initialCount = applyForestStage5SpawnCountFactor(areaId, stageNumber, initialCount)
  recurringCount = applyForestStage5SpawnCountFactor(areaId, stageNumber, recurringCount)
  initialCount = applyRuinsStage3SpawnCountFactor(areaId, stageNumber, initialCount)
  recurringCount = applyRuinsStage3SpawnCountFactor(areaId, stageNumber, recurringCount)
  const burstIntervalSeconds = getSpawnBurstIntervalSeconds(areaId, stageNumber, totalStages)
  const lastSpawnAtSeconds = getLastSpawnAtSeconds(stageNumber, areaId)

  const schedule: SpawnBurst[] = [
    { delaySeconds: 0, enemyCount: initialCount },
  ]

  for (
    let delaySeconds = burstIntervalSeconds;
    delaySeconds <= lastSpawnAtSeconds;
    delaySeconds = delaySeconds + burstIntervalSeconds
  ) {
    schedule.push({
      delaySeconds,
      enemyCount: recurringCount,
    })
  }

  return schedule
}

/**
 * レガシー用（スポーン予定は getSpawnScheduleForStage を優先）。
 * 旧ウェーブ API 互換のため空に近い値を返す。
 */
export function getWaveConfigForStage(_stageNumber: number): WaveConfig {
  return { waveCount: 0, enemiesPerWave: 0, waveIntervalSeconds: 0 }
}

/**
 * ステージごとの同時敵数のソフト上限（暴走防止の天井付き）。
 * スポーン側がこれ以上出さないよう見る。画面スプライトの厳密上限ではない。
 */
export function getMaxEnemiesForStage(stageNumber: number, totalStages: number): number {
  const safeStage = Math.max(1, stageNumber)
  let maxCount = MAX_ENEMIES + (safeStage - 1) * MAX_ENEMIES_PER_STAGE_BONUS
  if (isPlainsFinalStage(safeStage, totalStages)) {
    maxCount =
      maxCount +
      PLAINS_FINAL_STAGE_ENEMY_COUNT_BONUS +
      PLAINS_FINAL_STAGE_MAX_ENEMIES_BONUS
  } else if (isFinalStage(safeStage, totalStages)) {
    maxCount = maxCount + FINAL_STAGE_ENEMY_COUNT_BONUS + FINAL_STAGE_MAX_ENEMIES_BONUS
  }
  return Math.min(MAX_ENEMIES_HARD_CAP, maxCount)
}

// --- 難易度計算（レベルアップ成長に合わせて HP・速度を伸ばす）---
// Enemy スポーン時に呼ばれる。

/**
 * ステージに応じた通常近接敵の HP。想定火力より控えめに伸ばし、貫通で群れ処理しやすくする。
 * Plains Stage2 の硬いスライムは calculateToughMeleeHp を使う（ここには含めない）。
 */
export function calculateEnemyHpForStage(stageNumber: number, totalStages: number): number {
  const expectedPower = calculateExpectedPlayerPower(stageNumber)
  // HP は想定火力より控えめに伸ばす（貫通で群れを処理しやすくする）
  const hpScale = 1 + (expectedPower - 1) * ENEMY_HP_POWER_SCALE
  let hp = Math.max(1, Math.round(ENEMY_BASE_HP * hpScale))
  if (isPlainsFinalStage(stageNumber, totalStages)) {
    hp = Math.max(1, Math.round(hp * PLAINS_FINAL_STAGE_HP_MULTIPLIER))
  } else if (isFinalStage(stageNumber, totalStages)) {
    hp = Math.max(1, Math.round(hp * FINAL_STAGE_HP_MULTIPLIER))
  }
  return hp
}

/**
 * 少し硬い泥スライム専用 HP（3 か 4 を同じ確率で選ぶ）。
 * Stage2 / Stage3 どちらでも同じ値。最終面の HP 倍率は受けない。
 */
export function calculateToughMeleeHp(): number {
  const hpRange = ENEMY_TOUGH_MELEE_MAX_HP - ENEMY_TOUGH_MELEE_MIN_HP + 1
  return ENEMY_TOUGH_MELEE_MIN_HP + Math.floor(Math.random() * hpRange)
}

/**
 * 少し硬い泥スライムの移動速度。
 * Stage2 / Stage3 どちらでも Stage2 相当の速度に固定する（最終面補正なし）。
 */
export function calculateToughMeleeSpeed(): number {
  // Stage2: BASE * (1 + growth * 1)
  const stage2Multiplier = 1 + ENEMY_SPEED_GROWTH_PER_STAGE
  return ENEMY_BASE_SPEED * stage2Multiplier * ENEMY_TOUGH_MELEE_SPEED_FACTOR
}

/**
 * Wind Plains Stage3 ボスの移動速度（通常スライム基準速度の 0.5 倍）。
 * Plains 最終面の速度補正は掛けない。
 */
export function calculateWindHiveBossSpeed(): number {
  return ENEMY_BASE_SPEED * ENEMY_WIND_HIVE_BOSS_SPEED_FACTOR
}

/**
 * Earth Dungeon Stage5 ボスの移動速度（通常スライム基準速度の 0.5 倍）。
 */
export function calculateEarthDungeonBossSpeed(): number {
  return ENEMY_BASE_SPEED * ENEMY_EARTH_DUNGEON_BOSS_SPEED_FACTOR
}

/**
 * Forest Stage2 切り株の移動速度（泥スライムの半分）。
 */
export function calculateStumpSpeed(): number {
  return calculateToughMeleeSpeed() * ENEMY_STUMP_SPEED_FACTOR
}

/**
 * Volcano Stage3 燃え木の移動速度（切り株と同じ）。
 */
export function calculateBurningTreeSpeed(): number {
  return calculateToughMeleeSpeed() * ENEMY_BURNING_TREE_SPEED_FACTOR
}

/**
 * Forest Stage4 枝の移動速度（緑スライムより遅め）。
 */
export function calculateBranchSpeed(stageNumber: number, totalStages: number): number {
  return calculateEnemySpeedForStage(stageNumber, totalStages) * ENEMY_BRANCH_SPEED_FACTOR
}

/**
 * Ruins Stage1 Stone Guard の移動速度（緑スライムより遅め）。
 */
export function calculateStoneGuardSpeed(stageNumber: number, totalStages: number): number {
  return calculateEnemySpeedForStage(stageNumber, totalStages) * ENEMY_STONE_GUARD_SPEED_FACTOR
}

/**
 * Ruins Stage2 岩敵の移動速度（通常敵より少し遅め）。
 */
export function calculateEarthRockSpeed(stageNumber: number, totalStages: number): number {
  return calculateEnemySpeedForStage(stageNumber, totalStages) * ENEMY_EARTH_ROCK_SPEED_FACTOR
}

/**
 * 射撃敵のHP。Plains最終面だけ、近接敵より少し柔らかくする。
 */
export function calculateRangedEnemyHpForStage(
  stageNumber: number,
  totalStages: number,
): number {
  const enemyHp = calculateEnemyHpForStage(stageNumber, totalStages)
  if (!isPlainsFinalStage(stageNumber, totalStages)) {
    return enemyHp
  }
  return Math.max(1, Math.round(enemyHp * PLAINS_FINAL_STAGE_RANGED_HP_MULTIPLIER))
}

/**
 * 近接敵の移動速度（ステージが進むと少しずつ上がる）。
 * 実際の移動は EnemyMovementSystem が setData('speed') を読んで setVelocity。
 */
export function calculateEnemySpeedForStage(
  stageNumber: number,
  totalStages: number,
): number {
  const safeStage = Math.max(1, stageNumber)
  const multiplier = 1 + ENEMY_SPEED_GROWTH_PER_STAGE * (safeStage - 1)
  let speed = ENEMY_BASE_SPEED * multiplier
  if (isPlainsFinalStage(safeStage, totalStages)) {
    speed = speed * PLAINS_FINAL_STAGE_SPEED_MULTIPLIER
  } else if (isFinalStage(safeStage, totalStages)) {
    speed = speed * FINAL_STAGE_SPEED_MULTIPLIER
  }
  return speed
}

/**
 * 射撃型の移動速度（近接速度 × ENEMY_RANGED_SPEED_FACTOR）。
 */
export function calculateRangedEnemySpeedForStage(
  stageNumber: number,
  totalStages: number,
): number {
  return calculateEnemySpeedForStage(stageNumber, totalStages) * ENEMY_RANGED_SPEED_FACTOR
}

/**
 * Stage 3+ で射撃型を混ぜるかどうか（ステージ帯で確率上昇）。
 * パック全体で一度だけ呼ばれ、群れの色／種類を揃える。
 * Plains 最終（Stage3）の蜂は WaveSystem が固定スケジュールで出すため、ここでは出さない。
 */
export function shouldSpawnRangedEnemy(stageNumber: number, totalStages: number): boolean {
  if (stageNumber < ENEMY_RANGED_FIRST_STAGE) {
    return false
  }

  // Plains Stage3 の蜂は「初回なし・以降1グループ・FINAL WAVEも1グループ」の固定枠
  if (isPlainsFinalStage(stageNumber, totalStages)) {
    return false
  }

  // エリア最終は射撃型の割合を大きく上げる
  let chance = ENEMY_RANGED_SPAWN_CHANCE_STAGE_3_4
  if (isFinalStage(stageNumber, totalStages)) {
    chance = FINAL_STAGE_RANGED_SPAWN_CHANCE
  } else if (stageNumber >= 5) {
    chance = ENEMY_RANGED_SPAWN_CHANCE_STAGE_5_7
  }

  return Math.random() < chance
}
