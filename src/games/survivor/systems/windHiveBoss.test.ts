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
  ENEMY_WIND_HIVE_BOSS_WIND_ORB_INTERVAL_MS,
  ENEMY_WIND_HIVE_BOSS_XP_DROP_MULTIPLIER,
  ENEMY_WIND_ORB_BULLET_SIZE,
} from '../GameConstants'
import { calculateWindHiveBossSpeed } from '../constants/difficulty'
import {
  getStageCompletionRule,
  isActiveBossEnemy,
  shouldBeginStageClear,
} from './stageClearRules'
import {
  advanceWindHiveBossWindOrbShotAtMs,
  calculateWindHiveBossWindOrbAimDirection,
  getWindHiveBossSpeedFromBase,
  shouldFireWindHiveBossWindOrb,
  shouldSummonWindHiveBossBee,
} from './windHiveBossLogic'

describe('Wind Plains Stage3 windHiveBoss', () => {
  it('HP は従来 25 の 3 倍、XP / 速度は従来どおり', () => {
    expect(ENEMY_WIND_HIVE_BOSS_HP).toBe(75)
    expect(ENEMY_WIND_HIVE_BOSS_XP_DROP_MULTIPLIER).toBe(10)
    expect(ENEMY_WIND_HIVE_BOSS_SPEED_FACTOR).toBe(0.5)
    expect(calculateWindHiveBossSpeed()).toBe(ENEMY_BASE_SPEED * 0.5)
    expect(getWindHiveBossSpeedFromBase()).toBe(ENEMY_BASE_SPEED * 0.5)
  })

  it('他ボス HP は変更なし', () => {
    expect(ENEMY_GRAVESTONE_HP).toBe(180)
    expect(ENEMY_EARTH_DUNGEON_BOSS_HP).toBe(100)
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

  it('風の玉間隔・弾性能は標準敵弾相当', () => {
    expect(ENEMY_WIND_HIVE_BOSS_WIND_ORB_INTERVAL_MS).toBe(2000)
    expect(ENEMY_BULLET_SPEED).toBe(280)
    expect(ENEMY_BULLET_DAMAGE).toBe(1)
    expect(ENEMY_WIND_ORB_BULLET_SIZE).toBeGreaterThan(0)
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

  it('召喚間隔定数は 4000ms', () => {
    expect(ENEMY_WIND_HIVE_BOSS_BEE_SPAWN_INTERVAL_MS).toBe(4000)
    expect(ENEMY_WIND_HIVE_BOSS_MAX_SUMMONED_BEES).toBe(5)
  })

  it('出現直後は風の玉を撃たず、2秒後に初弾・4秒で2発目の時刻になる', () => {
    const spawnAtMs = 1000
    const firstShotAtMs = spawnAtMs + ENEMY_WIND_HIVE_BOSS_WIND_ORB_INTERVAL_MS
    expect(
      shouldFireWindHiveBossWindOrb({
        nowMs: spawnAtMs,
        nextShotAtMs: firstShotAtMs,
      }),
    ).toBe(false)
    expect(
      shouldFireWindHiveBossWindOrb({
        nowMs: firstShotAtMs - 1,
        nextShotAtMs: firstShotAtMs,
      }),
    ).toBe(false)
    expect(
      shouldFireWindHiveBossWindOrb({
        nowMs: firstShotAtMs,
        nextShotAtMs: firstShotAtMs,
      }),
    ).toBe(true)

    const secondShotAtMs = advanceWindHiveBossWindOrbShotAtMs(firstShotAtMs)
    expect(secondShotAtMs).toBe(firstShotAtMs + 2000)
    expect(
      shouldFireWindHiveBossWindOrb({
        nowMs: secondShotAtMs - 1,
        nextShotAtMs: secondShotAtMs,
      }),
    ).toBe(false)
    expect(
      shouldFireWindHiveBossWindOrb({
        nowMs: secondShotAtMs,
        nextShotAtMs: secondShotAtMs,
      }),
    ).toBe(true)
  })

  it('同じ nextShotAtMs では二重判定でもクールダウン更新は1回分', () => {
    const nextShotAtMs = 2000
    expect(
      shouldFireWindHiveBossWindOrb({ nowMs: 2000, nextShotAtMs }),
    ).toBe(true)
    const advancedOnce = advanceWindHiveBossWindOrbShotAtMs(2000)
    expect(advancedOnce).toBe(4000)
    // 更新後は同じ nowMs では撃てない
    expect(
      shouldFireWindHiveBossWindOrb({
        nowMs: 2000,
        nextShotAtMs: advancedOnce,
      }),
    ).toBe(false)
  })

  it('Hero 方向の単位ベクトルになり、距離0は null（NaN なし）', () => {
    const right = calculateWindHiveBossWindOrbAimDirection(0, 0, 10, 0)
    expect(right).toEqual({ x: 1, y: 0 })
    const upLeft = calculateWindHiveBossWindOrbAimDirection(5, 5, 2, 1)
    expect(upLeft).not.toBeNull()
    if (upLeft !== null) {
      const length = Math.sqrt(upLeft.x * upLeft.x + upLeft.y * upLeft.y)
      expect(length).toBeCloseTo(1, 6)
      expect(upLeft.x).toBeLessThan(0)
      expect(upLeft.y).toBeLessThan(0)
    }
    expect(calculateWindHiveBossWindOrbAimDirection(3, 4, 3, 4)).toBeNull()
  })

  it('発射時点の Hero 位置を狙い、次弾は新しい位置を狙う（ホーミングしない計算）', () => {
    const first = calculateWindHiveBossWindOrbAimDirection(0, 0, 10, 0)
    const second = calculateWindHiveBossWindOrbAimDirection(0, 0, 0, 10)
    expect(first).toEqual({ x: 1, y: 0 })
    expect(second).toEqual({ x: 0, y: 1 })
    // 既に決めた第1弾の方向は第2弾計算で変わらない（直進＝発射時固定）
    expect(first).toEqual({ x: 1, y: 0 })
  })

  it('飛行速度は標準敵弾速度 × 単位方向', () => {
    const aim = calculateWindHiveBossWindOrbAimDirection(0, 0, 3, 4)
    expect(aim).not.toBeNull()
    if (aim !== null) {
      expect(aim.x * ENEMY_BULLET_SPEED).toBeCloseTo(0.6 * ENEMY_BULLET_SPEED, 6)
      expect(aim.y * ENEMY_BULLET_SPEED).toBeCloseTo(0.8 * ENEMY_BULLET_SPEED, 6)
    }
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
