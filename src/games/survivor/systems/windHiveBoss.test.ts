import { describe, expect, it } from 'vitest'
import {
  ENEMY_BASE_SPEED,
  ENEMY_BULLET_DAMAGE,
  ENEMY_BULLET_SPEED,
  ENEMY_GRAVESTONE_HP,
  ENEMY_EARTH_DUNGEON_BOSS_HP,
  ENEMY_HEIGHT,
  ENEMY_WIDTH,
  ENEMY_WIND_HIVE_BOSS_BEE_SPAWN_INTERVAL_MS,
  ENEMY_WIND_HIVE_BOSS_BREATH_DISPLAY_HEIGHT,
  ENEMY_WIND_HIVE_BOSS_HP,
  ENEMY_WIND_HIVE_BOSS_MAX_SUMMONED_BEES,
  ENEMY_WIND_HIVE_BOSS_SIZE_SCALE,
  ENEMY_WIND_HIVE_BOSS_SPEED_FACTOR,
  ENEMY_WIND_HIVE_BOSS_XP_DROP_MULTIPLIER,
} from '../GameConstants'
import * as GameConstants from '../GameConstants'
import { calculateWindHiveBossSpeed } from '../constants/difficulty'
import {
  getStageCompletionRule,
  isActiveBossEnemy,
  shouldBeginStageClear,
} from './stageClearRules'
import {
  getWindHiveBossSpeedFromBase,
  shouldSummonWindHiveBossBee,
} from './windHiveBossLogic'
import * as WindHiveBossLogic from './windHiveBossLogic'

describe('Wind Plains Stage3 windHiveBoss', () => {
  it('HP / XP / 速度が仕様どおり（スライム基準 × 0.75）', () => {
    expect(ENEMY_WIND_HIVE_BOSS_HP).toBe(113)
    expect(ENEMY_WIND_HIVE_BOSS_XP_DROP_MULTIPLIER).toBe(10)
    expect(ENEMY_WIND_HIVE_BOSS_SPEED_FACTOR).toBe(0.75)
    expect(calculateWindHiveBossSpeed()).toBe(ENEMY_BASE_SPEED * 0.75)
    expect(getWindHiveBossSpeedFromBase()).toBe(ENEMY_BASE_SPEED * 0.75)
  })

  it('他最終ボス HP も ×1.5 強化後の値', () => {
    expect(ENEMY_GRAVESTONE_HP).toBe(270)
    expect(ENEMY_EARTH_DUNGEON_BOSS_HP).toBe(450)
  })

  it('表示サイズは従来 Runtime scale 1.5 の 1.5 倍（2.25）、縦横比維持', () => {
    expect(ENEMY_WIND_HIVE_BOSS_SIZE_SCALE).toBe(2.25)
    expect(ENEMY_WIND_HIVE_BOSS_BREATH_DISPLAY_HEIGHT).toBe(
      ENEMY_HEIGHT * ENEMY_WIND_HIVE_BOSS_SIZE_SCALE,
    )
    expect(ENEMY_WIDTH * ENEMY_WIND_HIVE_BOSS_SIZE_SCALE).toBe(
      ENEMY_WIDTH * 2.25,
    )
    expect(ENEMY_HEIGHT * ENEMY_WIND_HIVE_BOSS_SIZE_SCALE).toBe(
      ENEMY_HEIGHT * 2.25,
    )
  })

  it('風の玉専用の照準・タイマー・定数を公開しない', () => {
    expect('calculateWindHiveBossWindOrbAimDirection' in WindHiveBossLogic).toBe(false)
    expect('shouldFireWindHiveBossWindOrb' in WindHiveBossLogic).toBe(false)
    expect('advanceWindHiveBossWindOrbShotAtMs' in WindHiveBossLogic).toBe(false)
    expect('ENEMY_WIND_HIVE_BOSS_WIND_ORB_INTERVAL_MS' in GameConstants).toBe(false)
    expect('ENEMY_WIND_ORB_BULLET_SPEED' in GameConstants).toBe(false)
  })

  it('通常敵弾の速度とダメージは維持', () => {
    expect(ENEMY_BULLET_SPEED).toBe(280)
    expect(ENEMY_BULLET_DAMAGE).toBe(1)
  })

  it('Plains / Forest / Volcano 最終以外は survive-or-clear-all', () => {
    expect(getStageCompletionRule('plains', 3, 3)).toBe('defeat-boss')
    expect(getStageCompletionRule('plains', 2, 3)).toBe('survive-or-clear-all')
    expect(getStageCompletionRule('forest', 4, 5)).toBe('survive-or-clear-all')
    expect(getStageCompletionRule('volcano', 4, 5)).toBe('survive-or-clear-all')
  })

  it('ボス生存中はクリアせず、撃破後はクリアできる', () => {
    expect(
      shouldBeginStageClear({
        completionRule: 'defeat-boss',
        bossAlive: true,
        timeUp: true,
        allEnemiesDefeated: false,
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

  it('他エリアのクリアルールは従来どおり時間切れ／全撃破', () => {
    expect(
      shouldBeginStageClear({
        completionRule: 'survive-or-clear-all',
        bossAlive: false,
        timeUp: true,
        allEnemiesDefeated: false,
      }),
    ).toBe(true)
    expect(
      shouldBeginStageClear({
        completionRule: 'survive-or-clear-all',
        bossAlive: false,
        timeUp: false,
        allEnemiesDefeated: true,
      }),
    ).toBe(true)
    expect(
      shouldBeginStageClear({
        completionRule: 'survive-or-clear-all',
        bossAlive: false,
        timeUp: false,
        allEnemiesDefeated: false,
      }),
    ).toBe(false)
  })

  it('4秒前は召喚せず、4秒後かつ上限未満なら召喚する', () => {
    expect(
      shouldSummonWindHiveBossBee({
        nowMs: 3999,
        nextSummonAtMs: 4000,
        activeSummonedBeeCount: 0,
        maxSummonedBees: ENEMY_WIND_HIVE_BOSS_MAX_SUMMONED_BEES,
      }),
    ).toBe(false)
    expect(
      shouldSummonWindHiveBossBee({
        nowMs: 4000,
        nextSummonAtMs: 4000,
        activeSummonedBeeCount: 0,
        maxSummonedBees: ENEMY_WIND_HIVE_BOSS_MAX_SUMMONED_BEES,
      }),
    ).toBe(true)
  })

  it('召喚蜂が5体いるときは追加召喚しない', () => {
    expect(
      shouldSummonWindHiveBossBee({
        nowMs: 8000,
        nextSummonAtMs: 4000,
        activeSummonedBeeCount: 5,
        maxSummonedBees: ENEMY_WIND_HIVE_BOSS_MAX_SUMMONED_BEES,
      }),
    ).toBe(false)
  })

  it('召喚間隔定数は 2667ms（旧 4000÷1.5）', () => {
    expect(ENEMY_WIND_HIVE_BOSS_BEE_SPAWN_INTERVAL_MS).toBe(2667)
    expect(ENEMY_WIND_HIVE_BOSS_MAX_SUMMONED_BEES).toBe(5)
  })

  it('isActiveBossEnemy は isBoss かつ生存中だけ true', () => {
    const aliveBoss = {
      active: true,
      getData: (key: string) => {
        if (key === 'isBoss') {
          return true
        }
        if (key === 'isDefeated') {
          return false
        }
        return undefined
      },
    }
    const defeatedBoss = {
      active: true,
      getData: (key: string) => {
        if (key === 'isBoss') {
          return true
        }
        if (key === 'isDefeated') {
          return true
        }
        return undefined
      },
    }
    const normalEnemy = {
      active: true,
      getData: () => undefined,
    }
    expect(isActiveBossEnemy(aliveBoss)).toBe(true)
    expect(isActiveBossEnemy(defeatedBoss)).toBe(false)
    expect(isActiveBossEnemy(normalEnemy)).toBe(false)
  })
})
