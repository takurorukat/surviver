/**
 * Earth Dungeon Stage5 ボス（earthDungeonBoss）の純粋ヘルパー。
 * Phaser 非依存（単体テスト用）。
 */
import {
  ENEMY_BASE_SPEED,
  ENEMY_EARTH_DUNGEON_BOSS_SPEED_FACTOR,
} from '../constants/enemies'

export function getEarthDungeonBossSpeedFromBase(): number {
  return ENEMY_BASE_SPEED * ENEMY_EARTH_DUNGEON_BOSS_SPEED_FACTOR
}

/**
 * 敵召喚してよいか（時間・上限）。
 */
export function shouldSummonEarthDungeonBossMinion(params: {
  nowMs: number
  nextSummonAtMs: number
  activeSummonedCount: number
  maxSummoned: number
}): boolean {
  if (params.nowMs < params.nextSummonAtMs) {
    return false
  }
  if (params.activeSummonedCount >= params.maxSummoned) {
    return false
  }
  return true
}

/**
 * 小石バーストを開始してよいか（待機中かつ周期到達）。
 */
export function shouldStartEarthDungeonBossRockBurst(params: {
  nowMs: number
  nextBurstAtMs: number
  shotsRemaining: number
}): boolean {
  if (params.shotsRemaining > 0) {
    return false
  }
  return params.nowMs >= params.nextBurstAtMs
}

/**
 * バースト中の次弾を撃ってよいか。
 */
export function shouldFireEarthDungeonBossRockShot(params: {
  nowMs: number
  nextShotAtMs: number
  shotsRemaining: number
}): boolean {
  if (params.shotsRemaining <= 0) {
    return false
  }
  return params.nowMs >= params.nextShotAtMs
}

/**
 * 1発撃ったあとの残り弾数と次弾タイマー。
 * 次バースト開始は start 時に別途設定（周期を連射時間に引きずられない）。
 * 1フレーム1発（呼び出し側）。一斉 catch-up しない。
 */
export function advanceEarthDungeonBossRockBurstAfterShot(params: {
  nowMs: number
  shotsRemainingBeforeShot: number
  spacingMs: number
}): {
  shotsRemaining: number
  nextShotAtMs: number
} {
  const remaining = Math.max(0, params.shotsRemainingBeforeShot - 1)
  if (remaining > 0) {
    return {
      shotsRemaining: remaining,
      nextShotAtMs: params.nowMs + params.spacingMs,
    }
  }
  return {
    shotsRemaining: 0,
    nextShotAtMs: 0,
  }
}

/**
 * 召喚位置がプレイヤーの真上付近か（上＝画面座標で y が小さい側）。
 */
export function isSpawnDirectlyAbovePlayer(params: {
  spawnX: number
  spawnY: number
  playerX: number
  playerY: number
  horizontalTolerance: number
}): boolean {
  const dx = Math.abs(params.spawnX - params.playerX)
  if (dx > params.horizontalTolerance) {
    return false
  }
  return params.spawnY < params.playerY
}
