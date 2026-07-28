/**
 * Ruins Stage1 の敵選択と、他エリアの既存選択が変わっていないことの確認。
 * Volcano は見た目実装済みの敵だけが候補に入り、未実装見た目の敵は選ばれない。
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getVolcanoSpawnWeightTable,
  pickEnemyKindForArea,
  pickVolcanoStage5EnemyKind,
  pickWeightedEnemyKind,
  VOLCANO_SPAWN_EXCLUDED_UNFINISHED_VISUAL_KINDS,
} from './pickEnemyKind'
import type { EnemyKind } from './types'

afterEach(() => {
  vi.restoreAllMocks()
})

function listKindsFromTable(stageNumber: number): EnemyKind[] {
  const table = getVolcanoSpawnWeightTable(stageNumber)
  const kinds: EnemyKind[] = []
  for (let index = 0; index < table.length; index++) {
    kinds.push(table[index].kind)
  }
  return kinds
}

describe('pickEnemyKindForArea', () => {
  it('Ruins Stage 1 は土スライムだけを選ぶ', () => {
    expect(pickEnemyKindForArea('ruins', 1, false)).toBe('earthSlime')
    expect(pickEnemyKindForArea('ruins', 1, true)).toBe('earthSlime')
  })

  it('Ruins Stage 2 は岩敵だけを選ぶ', () => {
    expect(pickEnemyKindForArea('ruins', 2, false)).toBe('earthRock')
    expect(pickEnemyKindForArea('ruins', 2, true)).toBe('earthRock')
  })

  it('Ruins Stage 3 はスケルトンだけを選ぶ', () => {
    expect(pickEnemyKindForArea('ruins', 3, false)).toBe('earthSkeleton')
    expect(pickEnemyKindForArea('ruins', 3, true)).toBe('earthSkeleton')
  })

  it('Ruins Stage 4 はマグマ岩または Stage1〜3 通常敵を選ぶ', () => {
    const kinds = new Set<string>()
    for (let index = 0; index < 60; index++) {
      kinds.add(pickEnemyKindForArea('ruins', 4, false))
    }
    expect(kinds.has('earthMagmaRock') || kinds.has('earthSlime')).toBe(true)
    expect(kinds.has('earthDungeonBoss')).toBe(false)
    expect(kinds.has('melee')).toBe(false)
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

  it('Volcano Stage 1〜5 の候補は空にならず、見た目未実装敵を含まない', () => {
    for (let stageNumber = 1; stageNumber <= 5; stageNumber++) {
      const kinds = listKindsFromTable(stageNumber)
      expect(kinds.length).toBeGreaterThan(0)
      for (let index = 0; index < kinds.length; index++) {
        expect(VOLCANO_SPAWN_EXCLUDED_UNFINISHED_VISUAL_KINDS).not.toContain(
          kinds[index],
        )
      }
    }
  })

  it('Volcano Stage 2 は spiritThunder / spiritFire の重み付き（armored なし）', () => {
    expect(listKindsFromTable(2)).toEqual(['spiritThunder', 'spiritFire'])

    vi.spyOn(Math, 'random').mockReturnValue(0.0)
    expect(pickEnemyKindForArea('volcano', 2, false)).toBe('spiritThunder')

    // 合計 85。60/85 未満は spiritThunder、それ以上は spiritFire
    vi.spyOn(Math, 'random').mockReturnValue(60 / 85 - 0.001)
    expect(pickEnemyKindForArea('volcano', 2, false)).toBe('spiritThunder')

    vi.spyOn(Math, 'random').mockReturnValue(60 / 85)
    expect(pickEnemyKindForArea('volcano', 2, false)).toBe('spiritFire')

    vi.spyOn(Math, 'random').mockReturnValue(0.999)
    expect(pickEnemyKindForArea('volcano', 2, false)).toBe('spiritFire')
  })

  it('Volcano Stage 3 は burningTree / spiritThunder / ranged の重み付き', () => {
    expect(listKindsFromTable(3)).toEqual([
      'burningTree',
      'spiritThunder',
      'ranged',
    ])

    vi.spyOn(Math, 'random').mockReturnValue(0.0)
    expect(pickEnemyKindForArea('volcano', 3, false)).toBe('burningTree')

    vi.spyOn(Math, 'random').mockReturnValue(0.55)
    expect(pickEnemyKindForArea('volcano', 3, false)).toBe('spiritThunder')

    vi.spyOn(Math, 'random').mockReturnValue(0.8)
    expect(pickEnemyKindForArea('volcano', 3, false)).toBe('ranged')
  })

  it('Volcano Stage 4 は ashKnight / spiritThunder の重み付き（shielded なし）', () => {
    expect(listKindsFromTable(4)).toEqual(['ashKnight', 'spiritThunder'])

    vi.spyOn(Math, 'random').mockReturnValue(0.0)
    expect(pickEnemyKindForArea('volcano', 4, false)).toBe('ashKnight')

    // 合計 80。55/80 未満は ashKnight
    vi.spyOn(Math, 'random').mockReturnValue(55 / 80 - 0.001)
    expect(pickEnemyKindForArea('volcano', 4, false)).toBe('ashKnight')

    vi.spyOn(Math, 'random').mockReturnValue(55 / 80)
    expect(pickEnemyKindForArea('volcano', 4, false)).toBe('spiritThunder')
  })

  it('Volcano Stage 5 は実装済み4種＋ranged（runner/charger なし）', () => {
    expect(listKindsFromTable(5)).toEqual([
      'spiritFire',
      'spiritThunder',
      'burningTree',
      'ashKnight',
      'ranged',
    ])

    // 合計重み 800。0〜174 が spiritFire
    vi.spyOn(Math, 'random').mockReturnValue(0.0)
    expect(pickVolcanoStage5EnemyKind()).toBe('spiritFire')

    // 700/800 = 0.875 から ranged
    vi.spyOn(Math, 'random').mockReturnValue(0.875)
    expect(pickVolcanoStage5EnemyKind()).toBe('ranged')

    vi.spyOn(Math, 'random').mockReturnValue(0.875)
    expect(pickEnemyKindForArea('volcano', 5, false)).toBe('ranged')
  })

  it('Volcano の抽選結果は常に有効な候補 ID', () => {
    const rolls = [0.0, 0.1, 0.25, 0.5, 0.75, 0.99]
    for (let stageNumber = 1; stageNumber <= 5; stageNumber++) {
      const allowed = listKindsFromTable(stageNumber)
      for (let rollIndex = 0; rollIndex < rolls.length; rollIndex++) {
        vi.spyOn(Math, 'random').mockReturnValue(rolls[rollIndex])
        const kind = pickEnemyKindForArea('volcano', stageNumber, false)
        expect(allowed).toContain(kind)
      }
    }
  })
})

describe('pickWeightedEnemyKind', () => {
  it('重み0より大きいエントリだけを選ぶ', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    expect(
      pickWeightedEnemyKind([
        { kind: 'melee', weight: 1 },
        { kind: 'ranged', weight: 1 },
      ]),
    ).toBe('ranged')
  })
})

describe('Volcano 除外敵のコード残置', () => {
  it('除外リストは armored / charger / runner / shielded', () => {
    expect(VOLCANO_SPAWN_EXCLUDED_UNFINISHED_VISUAL_KINDS).toEqual([
      'armored',
      'charger',
      'runner',
      'shielded',
    ])
  })
})
