import { describe, expect, it } from 'vitest'
import {
  calculateCarriedStageStartHp,
  getRecommendedMaxHpForRuins,
} from './combat'

describe('RuinsのHP進行', () => {
  it('推奨Max HPはStage 1〜5で4 / 4 / 5 / 5 / 6', () => {
    expect([1, 2, 3, 4, 5].map(getRecommendedMaxHpForRuins)).toEqual([
      4,
      4,
      5,
      5,
      6,
    ])
  })

  it('通常エリアは次ステージ開始時に全快する', () => {
    expect(calculateCarriedStageStartHp('plains', 1, 5)).toBe(5)
  })

  it('Ruinsは次ステージへ残HPを引き継ぐ', () => {
    expect(calculateCarriedStageStartHp('ruins', 2, 5)).toBe(2)
    expect(calculateCarriedStageStartHp('ruins', 9, 5)).toBe(5)
  })
})
