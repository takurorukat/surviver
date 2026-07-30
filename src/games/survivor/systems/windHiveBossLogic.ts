/**
 * Wind Plains Stage3 ボス（windHiveBoss）の純粋ヘルパー。
 * Phaser 非依存（単体テスト用）。
 */
import {
  ENEMY_BASE_SPEED,
  ENEMY_WIND_HIVE_BOSS_SPEED_FACTOR,
} from '../constants/enemies'

/**
 * 通常スライム基準速度の 0.75 倍。
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
