import { describe, expect, it } from 'vitest'
import {
  ENEMY_BASE_SPEED,
  ENEMY_BULLET_DAMAGE,
  ENEMY_BULLET_SPEED,
  ENEMY_EARTH_DUNGEON_BOSS_BREATH_SPRITE_KEY,
  ENEMY_EARTH_DUNGEON_BOSS_HP,
  ENEMY_EARTH_DUNGEON_BOSS_MAX_SUMMONED_ENEMIES,
  ENEMY_EARTH_DUNGEON_BOSS_ROCK_ATTACK_INTERVAL_MS,
  ENEMY_EARTH_DUNGEON_BOSS_ROCK_BURST_COUNT,
  ENEMY_EARTH_DUNGEON_BOSS_ROCK_BURST_SPACING_MS,
  ENEMY_EARTH_DUNGEON_BOSS_ROCK_PROJECTILE_SPEED,
  ENEMY_EARTH_DUNGEON_BOSS_SPEED_FACTOR,
  ENEMY_EARTH_DUNGEON_BOSS_SUMMON_INTERVAL_MS,
  ENEMY_EARTH_DUNGEON_BOSS_XP_DROP_MULTIPLIER,
} from '../GameConstants'
import { calculateEarthDungeonBossSpeed } from '../constants/difficulty'
import { SURVIVOR_ASSET_MANIFEST } from '../constants/assetManifest'
import {
  EARTH_DUNGEON_SUMMONABLE_ENEMY_KINDS,
} from '../objects/enemy/pickEnemyKind'
import {
  getStageCompletionRule,
  isActiveBossEnemy,
  shouldBeginStageClear,
} from './stageClearRules'
import {
  advanceEarthDungeonBossRockBurstAfterShot,
  getEarthDungeonBossSpeedFromBase,
  isSpawnDirectlyAbovePlayer,
  shouldFireEarthDungeonBossRockShot,
  shouldStartEarthDungeonBossRockBurst,
  shouldSummonEarthDungeonBossMinion,
} from './earthDungeonBossLogic'

describe('Earth Dungeon Stage5 earthDungeonBoss', () => {
  it('HP / XP / 速度が仕様どおり（スライム基準 × 0.75）', () => {
    expect(ENEMY_EARTH_DUNGEON_BOSS_HP).toBe(450)
    expect(ENEMY_EARTH_DUNGEON_BOSS_XP_DROP_MULTIPLIER).toBe(20)
    expect(ENEMY_EARTH_DUNGEON_BOSS_SPEED_FACTOR).toBe(0.75)
    expect(calculateEarthDungeonBossSpeed()).toBe(ENEMY_BASE_SPEED * 0.75)
    expect(getEarthDungeonBossSpeedFromBase()).toBe(ENEMY_BASE_SPEED * 0.75)
  })

  it('asset manifest にボス画像キーがある', () => {
    const images = SURVIVOR_ASSET_MANIFEST.images ?? []
    const found = images.some((entry: { key: string }) => {
      return entry.key === ENEMY_EARTH_DUNGEON_BOSS_BREATH_SPRITE_KEY
    })
    expect(found).toBe(true)
  })

  it('Ruins Stage5 と他エリア最終は defeat-boss', () => {
    expect(getStageCompletionRule('ruins', 5, 5)).toBe('defeat-boss')
    expect(getStageCompletionRule('ruins', 4, 5)).toBe('survive-or-clear-all')
    expect(getStageCompletionRule('plains', 3, 3)).toBe('defeat-boss')
    expect(getStageCompletionRule('forest', 5, 5)).toBe('defeat-boss')
    expect(getStageCompletionRule('volcano', 5, 5)).toBe('defeat-boss')
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

  it('プレイヤー死亡相当（クリア判定を呼ばない）ではクリアにしない前提を保つ', () => {
    // defeat-boss は bossAlive のみ見る。死亡時は StageClearFlow が呼ばれない設計。
    expect(
      shouldBeginStageClear({
        completionRule: 'defeat-boss',
        bossAlive: true,
        timeUp: false,
        allEnemiesDefeated: false,
      }),
    ).toBe(false)
  })

  it('1秒前は召喚せず、1秒後かつ上限未満なら召喚する', () => {
    expect(
      shouldSummonEarthDungeonBossMinion({
        nowMs: 999,
        nextSummonAtMs: 1000,
        activeSummonedCount: 0,
        maxSummoned: ENEMY_EARTH_DUNGEON_BOSS_MAX_SUMMONED_ENEMIES,
      }),
    ).toBe(false)
    expect(
      shouldSummonEarthDungeonBossMinion({
        nowMs: 1000,
        nextSummonAtMs: 1000,
        activeSummonedCount: 0,
        maxSummoned: ENEMY_EARTH_DUNGEON_BOSS_MAX_SUMMONED_ENEMIES,
      }),
    ).toBe(true)
  })

  it('召喚敵が8体いるときは追加召喚しない', () => {
    expect(
      shouldSummonEarthDungeonBossMinion({
        nowMs: 5000,
        nextSummonAtMs: 1000,
        activeSummonedCount: 8,
        maxSummoned: ENEMY_EARTH_DUNGEON_BOSS_MAX_SUMMONED_ENEMIES,
      }),
    ).toBe(false)
  })

  it('召喚候補は Earth 通常敵のみ（ボス自身を含まない）', () => {
    expect(EARTH_DUNGEON_SUMMONABLE_ENEMY_KINDS).toEqual([
      'earthSlime',
      'earthRock',
      'earthSkeleton',
      'earthMagmaRock',
    ])
    expect(EARTH_DUNGEON_SUMMONABLE_ENEMY_KINDS.includes('earthDungeonBoss')).toBe(
      false,
    )
  })

  it('召喚・小石攻撃の定数（×1.5 強化後）', () => {
    expect(ENEMY_EARTH_DUNGEON_BOSS_SUMMON_INTERVAL_MS).toBe(667)
    expect(ENEMY_EARTH_DUNGEON_BOSS_MAX_SUMMONED_ENEMIES).toBe(8)
    expect(ENEMY_EARTH_DUNGEON_BOSS_ROCK_ATTACK_INTERVAL_MS).toBe(3333)
    expect(ENEMY_EARTH_DUNGEON_BOSS_ROCK_BURST_COUNT).toBe(5)
    expect(ENEMY_EARTH_DUNGEON_BOSS_ROCK_BURST_SPACING_MS).toBe(133)
  })

  it('5秒前は小石連射を開始せず、5秒後に開始する', () => {
    expect(
      shouldStartEarthDungeonBossRockBurst({
        nowMs: 4999,
        nextBurstAtMs: 5000,
        shotsRemaining: 0,
      }),
    ).toBe(false)
    expect(
      shouldStartEarthDungeonBossRockBurst({
        nowMs: 5000,
        nextBurstAtMs: 5000,
        shotsRemaining: 0,
      }),
    ).toBe(true)
  })

  it('連射中は新規バーストを開始しない', () => {
    expect(
      shouldStartEarthDungeonBossRockBurst({
        nowMs: 10000,
        nextBurstAtMs: 5000,
        shotsRemaining: 3,
      }),
    ).toBe(false)
  })

  it('連射間隔で次弾を撃ち、残りを減らす', () => {
    expect(
      shouldFireEarthDungeonBossRockShot({
        nowMs: 5199,
        nextShotAtMs: 5200,
        shotsRemaining: 4,
      }),
    ).toBe(false)
    expect(
      shouldFireEarthDungeonBossRockShot({
        nowMs: 5200,
        nextShotAtMs: 5200,
        shotsRemaining: 4,
      }),
    ).toBe(true)

    const mid = advanceEarthDungeonBossRockBurstAfterShot({
      nowMs: 5200,
      shotsRemainingBeforeShot: 4,
      spacingMs: ENEMY_EARTH_DUNGEON_BOSS_ROCK_BURST_SPACING_MS,
    })
    expect(mid.shotsRemaining).toBe(3)
    expect(mid.nextShotAtMs).toBe(
      5200 + ENEMY_EARTH_DUNGEON_BOSS_ROCK_BURST_SPACING_MS,
    )

    const last = advanceEarthDungeonBossRockBurstAfterShot({
      nowMs: 5800,
      shotsRemainingBeforeShot: 1,
      spacingMs: ENEMY_EARTH_DUNGEON_BOSS_ROCK_BURST_SPACING_MS,
    })
    expect(last.shotsRemaining).toBe(0)
    expect(last.nextShotAtMs).toBe(0)
  })

  it('既存小石弾の速度・ダメージ定数を再利用し、ボス弾だけ速い', () => {
    expect(ENEMY_BULLET_SPEED).toBe(280)
    expect(ENEMY_BULLET_DAMAGE).toBe(1)
    expect(ENEMY_EARTH_DUNGEON_BOSS_ROCK_PROJECTILE_SPEED).toBe(420)
  })

  it('プレイヤー真上の召喚位置を検出する', () => {
    expect(
      isSpawnDirectlyAbovePlayer({
        spawnX: 100,
        spawnY: 50,
        playerX: 100,
        playerY: 200,
        horizontalTolerance: 20,
      }),
    ).toBe(true)
    expect(
      isSpawnDirectlyAbovePlayer({
        spawnX: 100,
        spawnY: 250,
        playerX: 100,
        playerY: 200,
        horizontalTolerance: 20,
      }),
    ).toBe(false)
    expect(
      isSpawnDirectlyAbovePlayer({
        spawnX: 150,
        spawnY: 50,
        playerX: 100,
        playerY: 200,
        horizontalTolerance: 20,
      }),
    ).toBe(false)
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
    expect(isActiveBossEnemy(aliveBoss)).toBe(true)
  })
})
