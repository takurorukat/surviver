/**
 * Ruins Stage1 の敵選択と、他エリアの既存選択が変わっていないことの確認。
 */
import { describe, expect, it } from 'vitest'
import { pickEnemyKindForArea } from './pickEnemyKind'

describe('pickEnemyKindForArea', () => {
  it('Ruins Stage 1 は Stone Guard だけを選ぶ', () => {
    expect(pickEnemyKindForArea('ruins', 1, false)).toBe('stoneGuard')
    expect(pickEnemyKindForArea('ruins', 1, true)).toBe('stoneGuard')
  })

  it('他エリア Stage 1 の敵選択は従来どおり', () => {
    expect(pickEnemyKindForArea('plains', 1, false)).toBe('melee')
    expect(pickEnemyKindForArea('forest', 1, false)).toBe('mushroom')
    expect(pickEnemyKindForArea('volcano', 1, false)).toBe('spiritFire')
  })

  it('Plains / Forest の既存ステージ選択は変わらない', () => {
    expect(pickEnemyKindForArea('plains', 2, false)).toBe('toughMelee')
    expect(pickEnemyKindForArea('plains', 3, false)).toBe('toughMelee')
    expect(pickEnemyKindForArea('plains', 3, true)).toBe('ranged')
    expect(pickEnemyKindForArea('forest', 2, false)).toBe('stump')
    expect(pickEnemyKindForArea('forest', 3, false)).toBe('beetle')
    expect(pickEnemyKindForArea('forest', 4, false)).toBe('branch')
  })

  it('Volcano Stage 2〜4 の敵選択は変わらない', () => {
    expect(pickEnemyKindForArea('volcano', 2, false)).toBe('spiritThunder')
    expect(pickEnemyKindForArea('volcano', 3, false)).toBe('burningTree')
    expect(pickEnemyKindForArea('volcano', 4, false)).toBe('ashKnight')
  })
})
