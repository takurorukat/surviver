import { describe, expect, it } from 'vitest'
import {
  ENEMY_CHAOS_ELEMENTAL_BREATH_SPRITE_KEY,
  ENEMY_CHAOS_ELEMENTAL_HP,
  ENEMY_CHAOS_ELEMENTAL_XP_DROP_MULTIPLIER,
  ENEMY_EARTH_DUNGEON_BOSS_BREATH_SPRITE_KEY,
  ENEMY_GRAVESTONE_BREATH_SPRITE_KEY,
  ENEMY_GRAVESTONE_HP,
  ENEMY_GRAVESTONE_XP_DROP_MULTIPLIER,
  ENEMY_WIND_HIVE_BOSS_BREATH_SPRITE_KEY,
} from '../GameConstants'
import { SURVIVOR_ASSET_MANIFEST } from '../constants/assetManifest'
import {
  getAreaFinalBossConfig,
  getFinalBossEnemyIdForStage,
  getFinalStageNumberForArea,
  shouldSpawnAreaFinalBoss,
  VERSION1_AREA_FINAL_BOSSES,
} from '../constants/finalBossConfig'
import { pickEnemyKindForArea } from '../objects/enemy/pickEnemyKind'
import {
  getStageCompletionRule,
  shouldBeginStageClear,
} from './stageClearRules'

describe('Four Area Final Boss SSoT', () => {
  it('Version1 の4エリアすべてに最終ボス定義がある', () => {
    expect(VERSION1_AREA_FINAL_BOSSES.map((entry) => entry.areaId)).toEqual([
      'plains',
      'forest',
      'volcano',
      'ruins',
    ])
    for (let index = 0; index < VERSION1_AREA_FINAL_BOSSES.length; index++) {
      expect(VERSION1_AREA_FINAL_BOSSES[index].completionRule).toBe('defeat-boss')
    }
  })

  it('最終ステージ番号とボス ID がエリアと一致する', () => {
    expect(getFinalStageNumberForArea('plains')).toBe(3)
    expect(getFinalBossEnemyIdForStage('plains', 3, 3)).toBe('windHiveBoss')
    expect(getFinalBossEnemyIdForStage('forest', 5, 5)).toBe('gravestone')
    expect(getFinalBossEnemyIdForStage('volcano', 5, 5)).toBe('chaosElemental')
    expect(getFinalBossEnemyIdForStage('ruins', 5, 5)).toBe('earthDungeonBoss')
  })

  it('最終以外のステージではボスを出さない', () => {
    expect(shouldSpawnAreaFinalBoss('plains', 2, 3)).toBe(false)
    expect(getFinalBossEnemyIdForStage('forest', 4, 5)).toBe(null)
    expect(getFinalBossEnemyIdForStage('volcano', 1, 5)).toBe(null)
    expect(getFinalBossEnemyIdForStage('ruins', 3, 5)).toBe(null)
  })

  it('4エリア最終はすべて defeat-boss', () => {
    expect(getStageCompletionRule('plains', 3, 3)).toBe('defeat-boss')
    expect(getStageCompletionRule('forest', 5, 5)).toBe('defeat-boss')
    expect(getStageCompletionRule('volcano', 5, 5)).toBe('defeat-boss')
    expect(getStageCompletionRule('ruins', 5, 5)).toBe('defeat-boss')
  })

  it('非最終ステージは survive-or-clear-all のまま', () => {
    expect(getStageCompletionRule('plains', 2, 3)).toBe('survive-or-clear-all')
    expect(getStageCompletionRule('forest', 4, 5)).toBe('survive-or-clear-all')
    expect(getStageCompletionRule('volcano', 3, 5)).toBe('survive-or-clear-all')
    expect(getStageCompletionRule('ruins', 1, 5)).toBe('survive-or-clear-all')
  })

  it('comingSoon エリアに最終ボス定義はない', () => {
    expect(getAreaFinalBossConfig('castle')).toBe(null)
    expect(getAreaFinalBossConfig('dungeon')).toBe(null)
    expect(getStageCompletionRule('castle', 5, 5)).toBe('survive-or-clear-all')
  })

  it('ボス生存中はクリアせず、撃破後はクリアできる', () => {
    expect(
      shouldBeginStageClear({
        completionRule: 'defeat-boss',
        bossAlive: true,
        timeUp: true,
        allEnemiesDefeated: true,
      }),
    ).toBe(false)
    expect(
      shouldBeginStageClear({
        completionRule: 'defeat-boss',
        bossAlive: false,
        timeUp: false,
        allEnemiesDefeated: false,
      }),
    ).toBe(true)
  })

  it('通常 Wave の敵抽選に最終ボス ID が混入しない', () => {
    const samples: string[] = []
    for (let index = 0; index < 40; index++) {
      samples.push(pickEnemyKindForArea('plains', 3, true))
      samples.push(pickEnemyKindForArea('plains', 3, false))
      samples.push(pickEnemyKindForArea('forest', 5, false))
      samples.push(pickEnemyKindForArea('volcano', 5, false))
      samples.push(pickEnemyKindForArea('ruins', 5, false))
    }
    expect(samples.includes('windHiveBoss')).toBe(false)
    expect(samples.includes('gravestone')).toBe(false)
    expect(samples.includes('chaosElemental')).toBe(false)
    expect(samples.includes('earthDungeonBoss')).toBe(false)
  })

  it('Forest / Volcano ボスの既存 HP・XP を維持する', () => {
    expect(ENEMY_GRAVESTONE_HP).toBe(180)
    expect(ENEMY_GRAVESTONE_XP_DROP_MULTIPLIER).toBe(10)
    expect(ENEMY_CHAOS_ELEMENTAL_HP).toBe(150)
    expect(ENEMY_CHAOS_ELEMENTAL_XP_DROP_MULTIPLIER).toBe(2)
  })

  it('4ボス画像が asset manifest にある', () => {
    const images = SURVIVOR_ASSET_MANIFEST.images ?? []
    const keys = images.map((entry: { key: string }) => entry.key)
    expect(keys.includes(ENEMY_WIND_HIVE_BOSS_BREATH_SPRITE_KEY)).toBe(true)
    expect(keys.includes(ENEMY_GRAVESTONE_BREATH_SPRITE_KEY)).toBe(true)
    expect(keys.includes(ENEMY_CHAOS_ELEMENTAL_BREATH_SPRITE_KEY)).toBe(true)
    expect(keys.includes(ENEMY_EARTH_DUNGEON_BOSS_BREATH_SPRITE_KEY)).toBe(true)
  })
})
