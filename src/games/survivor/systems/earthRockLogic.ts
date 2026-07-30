/**
 * Earth Dungeon Stage2 岩敵（earthRock）の純粋ヘルパー。
 * Phaser 非依存（単体テスト用）。
 */
import {
  ENEMY_EARTH_ROCK_ATTACK_WINDUP_MS,
  ENEMY_EARTH_ROCK_PEBBLE_INTERVAL_MS,
} from '../constants/enemies'

/**
 * 次回発射の windupMs 前から予備動作を始めてよいか。
 * すでに予備動作中なら二重開始しない。
 */
export function shouldStartEarthRockAttackWindup(params: {
  nowMs: number
  nextShotAtMs: number
  isWindingUp: boolean
  windupMs?: number
}): boolean {
  if (params.isWindingUp) {
    return false
  }
  const windupMs = params.windupMs ?? ENEMY_EARTH_ROCK_ATTACK_WINDUP_MS
  return params.nowMs >= params.nextShotAtMs - windupMs
}

/**
 * 予備動作が終わり、弾を撃ってよいか。
 */
export function shouldFireEarthRockAfterWindup(params: {
  nowMs: number
  windupEndsAtMs: number
  isWindingUp: boolean
}): boolean {
  if (!params.isWindingUp) {
    return false
  }
  return params.nowMs >= params.windupEndsAtMs
}

/** 発射後の次弾時刻（間隔は ENEMY_EARTH_ROCK_PEBBLE_INTERVAL_MS）。 */
export function advanceEarthRockNextShotAtMs(
  nowMs: number,
  intervalMs: number = ENEMY_EARTH_ROCK_PEBBLE_INTERVAL_MS,
): number {
  return nowMs + intervalMs
}
