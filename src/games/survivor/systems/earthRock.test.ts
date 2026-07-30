import { describe, expect, it } from 'vitest'
import {
  ENEMY_EARTH_DUNGEON_BOSS_HP,
  ENEMY_EARTH_DUNGEON_BOSS_ROCK_ATTACK_INTERVAL_MS,
  ENEMY_EARTH_DUNGEON_BOSS_SUMMON_INTERVAL_MS,
  ENEMY_EARTH_MAGMA_ROCK_ATTACK_INTERVAL_MS,
  ENEMY_EARTH_MAGMA_ROCK_HP,
  ENEMY_EARTH_ROCK_ATTACK_RECOVER_MS,
  ENEMY_EARTH_ROCK_ATTACK_SHRINK_MS,
  ENEMY_EARTH_ROCK_ATTACK_SHRINK_SCALE,
  ENEMY_EARTH_ROCK_ATTACK_SWELL_MS,
  ENEMY_EARTH_ROCK_ATTACK_SWELL_SCALE,
  ENEMY_EARTH_ROCK_ATTACK_WINDUP_MS,
  ENEMY_EARTH_ROCK_HEIGHT,
  ENEMY_EARTH_ROCK_HP,
  ENEMY_EARTH_ROCK_PEBBLE_INTERVAL_MS,
  ENEMY_EARTH_ROCK_RADIUS,
  ENEMY_EARTH_ROCK_WIDTH,
  ENEMY_GRAVESTONE_HP,
  ENEMY_WIND_HIVE_BOSS_HP,
  ENEMY_CHAOS_ELEMENTAL_HP,
} from '../GameConstants'
import {
  advanceEarthRockNextShotAtMs,
  shouldFireEarthRockAfterWindup,
  shouldStartEarthRockAttackWindup,
} from './earthRockLogic'

describe('Earth Dungeon Stage2 earthRock', () => {
  it('射撃間隔は 3333ms、HP／判定サイズは維持', () => {
    expect(ENEMY_EARTH_ROCK_PEBBLE_INTERVAL_MS).toBe(3333)
    expect(ENEMY_EARTH_ROCK_HP).toBe(5)
    expect(ENEMY_EARTH_ROCK_WIDTH).toBeGreaterThan(0)
    expect(ENEMY_EARTH_ROCK_HEIGHT).toBe(ENEMY_EARTH_ROCK_WIDTH)
    expect(ENEMY_EARTH_ROCK_RADIUS).toBeGreaterThan(0)
  })

  it('予備動作定数: 450ms（縮小180＋膨張270）、scale 0.82→1.18、復帰100ms', () => {
    expect(ENEMY_EARTH_ROCK_ATTACK_WINDUP_MS).toBe(450)
    expect(ENEMY_EARTH_ROCK_ATTACK_SHRINK_MS).toBe(180)
    expect(ENEMY_EARTH_ROCK_ATTACK_SWELL_MS).toBe(270)
    expect(
      ENEMY_EARTH_ROCK_ATTACK_SHRINK_MS + ENEMY_EARTH_ROCK_ATTACK_SWELL_MS,
    ).toBe(ENEMY_EARTH_ROCK_ATTACK_WINDUP_MS)
    expect(ENEMY_EARTH_ROCK_ATTACK_SHRINK_SCALE).toBe(0.82)
    expect(ENEMY_EARTH_ROCK_ATTACK_SWELL_SCALE).toBe(1.18)
    expect(ENEMY_EARTH_ROCK_ATTACK_RECOVER_MS).toBe(100)
  })

  it('予備動作開始前には発射しない', () => {
    const nextShotAtMs = 3333
    expect(
      shouldFireEarthRockAfterWindup({
        nowMs: nextShotAtMs - ENEMY_EARTH_ROCK_ATTACK_WINDUP_MS - 1,
        windupEndsAtMs: nextShotAtMs,
        isWindingUp: false,
      }),
    ).toBe(false)
    expect(
      shouldStartEarthRockAttackWindup({
        nowMs: nextShotAtMs - ENEMY_EARTH_ROCK_ATTACK_WINDUP_MS - 1,
        nextShotAtMs,
        isWindingUp: false,
      }),
    ).toBe(false)
  })

  it('発射450ms前から予備動作を開始し、膨らみ切るまで撃たない', () => {
    const nextShotAtMs = 3333
    const windupStart = nextShotAtMs - ENEMY_EARTH_ROCK_ATTACK_WINDUP_MS

    expect(
      shouldStartEarthRockAttackWindup({
        nowMs: windupStart,
        nextShotAtMs,
        isWindingUp: false,
      }),
    ).toBe(true)

    expect(
      shouldFireEarthRockAfterWindup({
        nowMs: windupStart + ENEMY_EARTH_ROCK_ATTACK_SHRINK_MS,
        windupEndsAtMs: nextShotAtMs,
        isWindingUp: true,
      }),
    ).toBe(false)

    expect(
      shouldFireEarthRockAfterWindup({
        nowMs: nextShotAtMs - 1,
        windupEndsAtMs: nextShotAtMs,
        isWindingUp: true,
      }),
    ).toBe(false)

    expect(
      shouldFireEarthRockAfterWindup({
        nowMs: nextShotAtMs,
        windupEndsAtMs: nextShotAtMs,
        isWindingUp: true,
      }),
    ).toBe(true)
  })

  it('予備動作中は重複開始しない', () => {
    expect(
      shouldStartEarthRockAttackWindup({
        nowMs: 4000,
        nextShotAtMs: 3333,
        isWindingUp: true,
      }),
    ).toBe(false)
  })

  it('1回の予備動作で1発相当: 発射後は次間隔まで再発射しない', () => {
    const fireAt = 3333
    const nextShot = advanceEarthRockNextShotAtMs(fireAt)
    expect(nextShot).toBe(fireAt + ENEMY_EARTH_ROCK_PEBBLE_INTERVAL_MS)

    expect(
      shouldFireEarthRockAfterWindup({
        nowMs: fireAt,
        windupEndsAtMs: fireAt,
        isWindingUp: false,
      }),
    ).toBe(false)

    expect(
      shouldStartEarthRockAttackWindup({
        nowMs: fireAt,
        nextShotAtMs: nextShot,
        isWindingUp: false,
      }),
    ).toBe(false)

    expect(
      shouldStartEarthRockAttackWindup({
        nowMs: nextShot - ENEMY_EARTH_ROCK_ATTACK_WINDUP_MS,
        nextShotAtMs: nextShot,
        isWindingUp: false,
      }),
    ).toBe(true)
  })

  it('発射間隔は実際の発射同士で 3333ms', () => {
    const firstFire = 1000
    const secondFire = advanceEarthRockNextShotAtMs(firstFire)
    const thirdFire = advanceEarthRockNextShotAtMs(secondFire)
    expect(secondFire - firstFire).toBe(3333)
    expect(thirdFire - secondFire).toBe(3333)
  })

  it('死亡・非active相当（isWindingUp=falseへ戻した後）は発射しない', () => {
    expect(
      shouldFireEarthRockAfterWindup({
        nowMs: 9999,
        windupEndsAtMs: 1000,
        isWindingUp: false,
      }),
    ).toBe(false)
  })

  it('Pause復帰で複数発 catch-up しない（同じ windup は1回だけ発射条件）', () => {
    // 大きく時刻が進んでも、1つの windupEndsAtMs に対する発射判定は真偽のみ
    expect(
      shouldFireEarthRockAfterWindup({
        nowMs: 20000,
        windupEndsAtMs: 3333,
        isWindingUp: true,
      }),
    ).toBe(true)
    // 発射後に isWindingUp=false へ戻す前提では再発射しない
    expect(
      shouldFireEarthRockAfterWindup({
        nowMs: 20000,
        windupEndsAtMs: 3333,
        isWindingUp: false,
      }),
    ).toBe(false)
  })

  it('Stage4／5 の今回変更と他ボスは期待どおり', () => {
    expect(ENEMY_EARTH_MAGMA_ROCK_HP).toBe(72)
    expect(ENEMY_EARTH_MAGMA_ROCK_ATTACK_INTERVAL_MS).toBe(2500)
    expect(ENEMY_EARTH_DUNGEON_BOSS_HP).toBe(450)
    expect(ENEMY_EARTH_DUNGEON_BOSS_ROCK_ATTACK_INTERVAL_MS).toBe(3333)
    expect(ENEMY_EARTH_DUNGEON_BOSS_SUMMON_INTERVAL_MS).toBe(667)
    expect(ENEMY_WIND_HIVE_BOSS_HP).toBe(113)
    expect(ENEMY_GRAVESTONE_HP).toBe(270)
    expect(ENEMY_CHAOS_ELEMENTAL_HP).toBe(225)
  })
})
