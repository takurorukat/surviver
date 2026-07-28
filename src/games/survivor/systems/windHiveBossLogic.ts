/**
 * Wind Plains Stage3 ボス（windHiveBoss）の純粋ヘルパー。
 * Phaser 非依存（単体テスト用）。
 */
import {
  ENEMY_BASE_SPEED,
  ENEMY_WIND_HIVE_BOSS_SPEED_FACTOR,
  ENEMY_WIND_HIVE_BOSS_WIND_ORB_INTERVAL_MS,
} from '../constants/enemies'

/**
 * 通常スライム基準速度の 0.5 倍。
 * difficulty.calculateWindHiveBossSpeed と同じ式（テストからも使える）。
 */
export function getWindHiveBossSpeedFromBase(): number {
  return ENEMY_BASE_SPEED * ENEMY_WIND_HIVE_BOSS_SPEED_FACTOR
}

/**
 * 竜巻ボスが今フレームで蜂を召喚してよいか（時間・上限）。
 */
export function shouldSummonWindHiveBossBee(params: {
  nowMs: number
  nextSummonAtMs: number
  activeSummonedBeeCount: number
  maxSummonedBees: number
}): boolean {
  if (params.nowMs < params.nextSummonAtMs) {
    return false
  }
  if (params.activeSummonedBeeCount >= params.maxSummonedBees) {
    return false
  }
  return true
}

/**
 * 風の玉を今フレームで撃ってよいか（出現直後は nextShotAtMs まで待つ）。
 */
export function shouldFireWindHiveBossWindOrb(params: {
  nowMs: number
  nextShotAtMs: number
}): boolean {
  return params.nowMs >= params.nextShotAtMs
}

/**
 * ボス中心から Hero 中心への単位方向。距離 0 なら null（NaN 防止）。
 */
export function calculateWindHiveBossWindOrbAimDirection(
  bossX: number,
  bossY: number,
  heroX: number,
  heroY: number,
): { x: number; y: number } | null {
  const dx = heroX - bossX
  const dy = heroY - bossY
  const distance = Math.sqrt(dx * dx + dy * dy)
  if (distance === 0) {
    return null
  }
  return {
    x: dx / distance,
    y: dy / distance,
  }
}

/**
 * 次弾までの時刻（間隔は ENEMY_WIND_HIVE_BOSS_WIND_ORB_INTERVAL_MS）。
 */
export function advanceWindHiveBossWindOrbShotAtMs(nowMs: number): number {
  return nowMs + ENEMY_WIND_HIVE_BOSS_WIND_ORB_INTERVAL_MS
}
