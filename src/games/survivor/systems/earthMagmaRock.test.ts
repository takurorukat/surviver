import { describe, expect, it } from 'vitest'
import {
  ENEMY_BASE_SPEED,
  ENEMY_BULLET_DAMAGE,
  ENEMY_BULLET_SPEED,
  ENEMY_EARTH_MAGMA_ROCK_ATTACK_INTERVAL_MS,
  ENEMY_EARTH_MAGMA_ROCK_BREATH_DISPLAY_HEIGHT,
  ENEMY_EARTH_MAGMA_ROCK_BREATH_SPRITE_KEY,
  ENEMY_EARTH_MAGMA_ROCK_DISPLAY_SCALE,
  ENEMY_EARTH_MAGMA_ROCK_HEIGHT,
  ENEMY_EARTH_MAGMA_ROCK_HP,
  ENEMY_EARTH_MAGMA_ROCK_MAX_ACTIVE,
  ENEMY_EARTH_MAGMA_ROCK_PEBBLE_SPEED_FACTOR,
  ENEMY_EARTH_MAGMA_ROCK_RADIAL_COUNT,
  ENEMY_EARTH_MAGMA_ROCK_RADIUS,
  ENEMY_EARTH_MAGMA_ROCK_SIZE_SCALE,
  ENEMY_EARTH_MAGMA_ROCK_SPEED_FACTOR,
  ENEMY_EARTH_MAGMA_ROCK_STAGE4_WEIGHT,
  ENEMY_EARTH_MAGMA_ROCK_WIDTH,
  ENEMY_EARTH_MAGMA_ROCK_WINDUP_MS,
  ENEMY_EARTH_MAGMA_ROCK_XP_DROP_MULTIPLIER,
  ENEMY_EARTH_STAGE4_OTHER_WEIGHT,
  ENEMY_HEIGHT,
  ENEMY_RADIUS,
  ENEMY_WIDTH,
} from '../GameConstants'
import { calculateEarthMagmaRockSpeed } from '../constants/difficulty'
import { SURVIVOR_ASSET_MANIFEST } from '../constants/assetManifest'
import {
  pickRuinsStage4EnemyKind,
  RUINS_STAGE4_WEIGHTS,
} from '../objects/enemy/pickEnemyKind'

describe('Earth Dungeon Stage4 earthMagmaRock', () => {
  it('HP / XP / 速度が仕様どおり（判定サイズは維持）', () => {
    expect(ENEMY_EARTH_MAGMA_ROCK_HP).toBe(18)
    expect(ENEMY_EARTH_MAGMA_ROCK_XP_DROP_MULTIPLIER).toBe(4)
    expect(ENEMY_EARTH_MAGMA_ROCK_SPEED_FACTOR).toBe(0.55)
    expect(ENEMY_EARTH_MAGMA_ROCK_SIZE_SCALE).toBe(1.5)
    expect(ENEMY_EARTH_MAGMA_ROCK_WIDTH).toBe(ENEMY_WIDTH * 1.5)
    expect(ENEMY_EARTH_MAGMA_ROCK_HEIGHT).toBe(ENEMY_HEIGHT * 1.5)
    expect(ENEMY_EARTH_MAGMA_ROCK_RADIUS).toBe(ENEMY_RADIUS * 1.5)
    expect(calculateEarthMagmaRockSpeed(1, 5)).toBe(ENEMY_BASE_SPEED * 0.55)
  })

  it('表示scaleは判定scaleの1.5倍（見た目だけ拡大）', () => {
    expect(ENEMY_EARTH_MAGMA_ROCK_DISPLAY_SCALE).toBe(2.25)
    expect(ENEMY_EARTH_MAGMA_ROCK_BREATH_DISPLAY_HEIGHT).toBe(
      ENEMY_HEIGHT * ENEMY_EARTH_MAGMA_ROCK_DISPLAY_SCALE,
    )
    expect(ENEMY_EARTH_MAGMA_ROCK_BREATH_DISPLAY_HEIGHT).toBe(
      ENEMY_EARTH_MAGMA_ROCK_HEIGHT * 1.5,
    )
  })

  it('攻撃定数: 5秒周期・0.7秒予兆・6方向・小石速度80%', () => {
    expect(ENEMY_EARTH_MAGMA_ROCK_ATTACK_INTERVAL_MS).toBe(5000)
    expect(ENEMY_EARTH_MAGMA_ROCK_WINDUP_MS).toBe(700)
    expect(ENEMY_EARTH_MAGMA_ROCK_RADIAL_COUNT).toBe(6)
    expect(ENEMY_EARTH_MAGMA_ROCK_PEBBLE_SPEED_FACTOR).toBe(0.8)
    expect(ENEMY_BULLET_SPEED * ENEMY_EARTH_MAGMA_ROCK_PEBBLE_SPEED_FACTOR).toBe(224)
    expect(ENEMY_BULLET_DAMAGE).toBe(1)
  })

  it('同時出現上限は4', () => {
    expect(ENEMY_EARTH_MAGMA_ROCK_MAX_ACTIVE).toBe(4)
  })

  it('Stage4 比率はマグマ岩が20〜25%相当', () => {
    let total = 0
    let magmaWeight = 0
    for (let index = 0; index < RUINS_STAGE4_WEIGHTS.length; index++) {
      total = total + RUINS_STAGE4_WEIGHTS[index].weight
      if (RUINS_STAGE4_WEIGHTS[index].kind === 'earthMagmaRock') {
        magmaWeight = RUINS_STAGE4_WEIGHTS[index].weight
      }
    }
    expect(magmaWeight).toBe(ENEMY_EARTH_MAGMA_ROCK_STAGE4_WEIGHT)
    expect(ENEMY_EARTH_STAGE4_OTHER_WEIGHT).toBe(26)
    const ratio = magmaWeight / total
    expect(ratio).toBeGreaterThanOrEqual(0.2)
    expect(ratio).toBeLessThanOrEqual(0.25)
  })

  it('Stage4 抽選は候補4種のいずれか', () => {
    const kinds = new Set<string>()
    for (let index = 0; index < 80; index++) {
      kinds.add(pickRuinsStage4EnemyKind())
    }
    expect(kinds.has('earthMagmaRock')).toBe(true)
    expect(kinds.has('earthSlime')).toBe(true)
    expect(kinds.has('earthRock')).toBe(true)
    expect(kinds.has('earthSkeleton')).toBe(true)
    expect(kinds.has('earthDungeonBoss')).toBe(false)
  })

  it('asset manifest にマグマ岩画像がある', () => {
    const images = SURVIVOR_ASSET_MANIFEST.images ?? []
    const found = images.some((entry: { key: string }) => {
      return entry.key === ENEMY_EARTH_MAGMA_ROCK_BREATH_SPRITE_KEY
    })
    expect(found).toBe(true)
  })
})
