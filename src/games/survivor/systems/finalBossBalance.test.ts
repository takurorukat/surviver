import { describe, expect, it } from 'vitest'
import {
  ENEMY_BASE_SPEED,
  ENEMY_BULLET_SPEED,
  ENEMY_CHAOS_ELEMENTAL_HP,
  ENEMY_CHAOS_ELEMENTAL_SPAWN_INTERVAL_MS,
  ENEMY_EARTH_DUNGEON_BOSS_HP,
  ENEMY_EARTH_DUNGEON_BOSS_MAX_SUMMONED_ENEMIES,
  ENEMY_EARTH_DUNGEON_BOSS_ROCK_ATTACK_INTERVAL_MS,
  ENEMY_EARTH_DUNGEON_BOSS_ROCK_BURST_COUNT,
  ENEMY_EARTH_DUNGEON_BOSS_ROCK_BURST_SPACING_MS,
  ENEMY_EARTH_DUNGEON_BOSS_ROCK_PROJECTILE_SPEED,
  ENEMY_EARTH_DUNGEON_BOSS_SPEED_FACTOR,
  ENEMY_EARTH_DUNGEON_BOSS_SUMMON_INTERVAL_MS,
  ENEMY_EARTH_MAGMA_ROCK_PEBBLE_SPEED_FACTOR,
  ENEMY_FINAL_BOSS_PROJECTILE_SPEED,
  ENEMY_GRAVESTONE_HP,
  ENEMY_GRAVESTONE_SPAWN_INTERVAL_MS,
  ENEMY_WIND_HIVE_BOSS_BEE_SPAWN_INTERVAL_MS,
  ENEMY_WIND_HIVE_BOSS_HP,
  ENEMY_WIND_HIVE_BOSS_MAX_SUMMONED_BEES,
  ENEMY_WIND_HIVE_BOSS_SPEED_FACTOR,
} from '../GameConstants'
import {
  calculateEarthDungeonBossSpeed,
  calculateWindHiveBossSpeed,
} from '../constants/difficulty'
import { getFinalBossEnemyIdForStage } from '../constants/finalBossConfig'
import { getStageCompletionRule } from './stageClearRules'

describe('Four area final bosses ×1.5 balance', () => {
  it('4体のボス HP が期待値', () => {
    expect(ENEMY_WIND_HIVE_BOSS_HP).toBe(113)
    expect(ENEMY_GRAVESTONE_HP).toBe(270)
    expect(ENEMY_CHAOS_ELEMENTAL_HP).toBe(225)
    expect(ENEMY_EARTH_DUNGEON_BOSS_HP).toBe(450)
  })

  it('移動ボスの速度は従来の 1.5 倍', () => {
    expect(ENEMY_WIND_HIVE_BOSS_SPEED_FACTOR).toBe(0.75)
    expect(ENEMY_EARTH_DUNGEON_BOSS_SPEED_FACTOR).toBe(0.75)
    expect(calculateWindHiveBossSpeed()).toBe(ENEMY_BASE_SPEED * 0.75)
    expect(calculateEarthDungeonBossSpeed()).toBe(ENEMY_BASE_SPEED * 0.75)
  })

  it('有効な召喚・攻撃間隔は従来 ÷1.5（四捨五入）', () => {
    expect(ENEMY_WIND_HIVE_BOSS_BEE_SPAWN_INTERVAL_MS).toBe(2667)
    expect(ENEMY_GRAVESTONE_SPAWN_INTERVAL_MS).toBe(2667)
    expect(ENEMY_CHAOS_ELEMENTAL_SPAWN_INTERVAL_MS).toBe(1333)
    expect(ENEMY_EARTH_DUNGEON_BOSS_SUMMON_INTERVAL_MS).toBe(667)
    expect(ENEMY_EARTH_DUNGEON_BOSS_ROCK_ATTACK_INTERVAL_MS).toBe(3333)
    expect(ENEMY_EARTH_DUNGEON_BOSS_ROCK_BURST_SPACING_MS).toBe(133)
  })

  it('Earth Dungeon ボス弾は 420、標準敵弾は 280 のまま', () => {
    expect(ENEMY_BULLET_SPEED).toBe(280)
    expect(ENEMY_FINAL_BOSS_PROJECTILE_SPEED).toBe(420)
    expect(ENEMY_EARTH_DUNGEON_BOSS_ROCK_PROJECTILE_SPEED).toBe(420)
    expect(ENEMY_BULLET_SPEED * ENEMY_EARTH_MAGMA_ROCK_PEBBLE_SPEED_FACTOR).toBe(
      224,
    )
  })

  it('最大召喚数と連射発数は変更なし', () => {
    expect(ENEMY_WIND_HIVE_BOSS_MAX_SUMMONED_BEES).toBe(5)
    expect(ENEMY_EARTH_DUNGEON_BOSS_MAX_SUMMONED_ENEMIES).toBe(8)
    expect(ENEMY_EARTH_DUNGEON_BOSS_ROCK_BURST_COUNT).toBe(5)
  })

  it('4エリア最終ボス ID と defeat-boss ルールは維持', () => {
    expect(getFinalBossEnemyIdForStage('plains', 3, 3)).toBe('windHiveBoss')
    expect(getFinalBossEnemyIdForStage('forest', 5, 5)).toBe('gravestone')
    expect(getFinalBossEnemyIdForStage('volcano', 5, 5)).toBe('chaosElemental')
    expect(getFinalBossEnemyIdForStage('ruins', 5, 5)).toBe('earthDungeonBoss')
    expect(getStageCompletionRule('plains', 3, 3)).toBe('defeat-boss')
    expect(getStageCompletionRule('forest', 5, 5)).toBe('defeat-boss')
    expect(getStageCompletionRule('volcano', 5, 5)).toBe('defeat-boss')
    expect(getStageCompletionRule('ruins', 5, 5)).toBe('defeat-boss')
  })
})
