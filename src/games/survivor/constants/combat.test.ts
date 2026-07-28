import { describe, expect, it } from 'vitest'
import {
  calculateCarriedStageStartHp,
  getRecommendedMaxHpForRuins,
  resolvePlayerBulletStyle,
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

describe('弾の属性スタイル', () => {
  it('初期は全エリアで無属性パワー弾', () => {
    expect(resolvePlayerBulletStyle(1, 1, 0, 'plains')).toBe('powerOrb')
    expect(resolvePlayerBulletStyle(1, 1, 0, 'forest')).toBe('powerOrb')
    expect(resolvePlayerBulletStyle(1, 1, 0, 'volcano')).toBe('powerOrb')
    expect(resolvePlayerBulletStyle(1, 1, 0, 'ruins')).toBe('powerOrb')
  })

  it('Move / Pickup / XP Bonus で他エリアと同じ優先順位になる', () => {
    expect(resolvePlayerBulletStyle(2, 1, 0, 'ruins')).toBe('windVortex')
    expect(resolvePlayerBulletStyle(2, 2, 0, 'ruins')).toBe('waterOrb')
    expect(resolvePlayerBulletStyle(2, 2, 1, 'ruins')).toBe('fireOrb')
    expect(resolvePlayerBulletStyle(1, 1, 1, 'ruins')).toBe('fireOrb')
  })
})
