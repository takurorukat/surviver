import { describe, expect, it } from 'vitest'
import { decideEnemyBulletSlotAction } from './enemyBulletPoolLogic'

describe('enemy bullet pool slot decisions', () => {
  it('active上限未満でもinactive弾でGroupが満杯なら、その枠を解放する', () => {
    expect(
      decideEnemyBulletSlotAction({
        activeBulletCount: 46,
        maxActiveBullets: 48,
        groupIsFull: true,
        hasInactiveBullet: true,
      }),
    ).toBe('release-inactive')
  })

  it('active弾が上限なら新しい弾を作らない', () => {
    expect(
      decideEnemyBulletSlotAction({
        activeBulletCount: 48,
        maxActiveBullets: 48,
        groupIsFull: true,
        hasInactiveBullet: false,
      }),
    ).toBe('reject')
  })

  it('Groupに空きがあれば通常どおり作る', () => {
    expect(
      decideEnemyBulletSlotAction({
        activeBulletCount: 12,
        maxActiveBullets: 48,
        groupIsFull: false,
        hasInactiveBullet: false,
      }),
    ).toBe('create')
  })
})
