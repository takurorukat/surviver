import { describe, expect, it } from 'vitest'
import { calculateStageClearGold, isFinalStage } from './areas'

describe('calculateStageClearGold', () => {
  it('エリアが進むほど基礎ゴールドが増える', () => {
    expect(calculateStageClearGold('plains', false, false)).toBe(1)
    expect(calculateStageClearGold('forest', false, false)).toBe(2)
    expect(calculateStageClearGold('volcano', false, false)).toBe(3)
    expect(calculateStageClearGold('ruins', false, false)).toBe(4)
    expect(calculateStageClearGold('castle', false, false)).toBe(5)
    expect(calculateStageClearGold('dungeon', false, false)).toBe(6)
  })

  it('最終ステージは基礎額の2倍', () => {
    expect(calculateStageClearGold('plains', true, false)).toBe(2)
    expect(calculateStageClearGold('forest', true, false)).toBe(4)
  })

  it('ノーダメージかつ全敵撃破クリアはさらに2倍', () => {
    // StageClearFlowSystem: didClearAllEnemiesBeforeTimeUp && !tookDamageThisStage
    expect(calculateStageClearGold('plains', false, true)).toBe(2)
    expect(calculateStageClearGold('plains', true, true)).toBe(4)
    expect(calculateStageClearGold('volcano', true, true)).toBe(12)
  })
})

describe('isFinalStage', () => {
  it('ステージ番号が総数以上なら最終ステージ', () => {
    expect(isFinalStage(3, 3)).toBe(true)
    expect(isFinalStage(2, 3)).toBe(false)
    expect(isFinalStage(5, 5)).toBe(true)
  })
})
