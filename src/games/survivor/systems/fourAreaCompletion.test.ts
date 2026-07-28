import { describe, expect, it } from 'vitest'
import { FOUR_AREA_COMPLETION_IDS } from '../GameConstants'
import { isFourAreaCompletion } from './fourAreaCompletion'

describe('isFourAreaCompletion', () => {
  it('4エリアすべてクリアで true', () => {
    expect(
      isFourAreaCompletion(['plains', 'forest', 'volcano', 'ruins']),
    ).toBe(true)
  })

  it('3エリア以下で false', () => {
    expect(isFourAreaCompletion(['plains', 'forest', 'volcano'])).toBe(false)
    expect(isFourAreaCompletion([])).toBe(false)
  })

  it('順不同でも true', () => {
    expect(
      isFourAreaCompletion(['ruins', 'plains', 'volcano', 'forest']),
    ).toBe(true)
  })

  it('重複 ID があっても正しく判定', () => {
    expect(
      isFourAreaCompletion([
        'plains',
        'plains',
        'forest',
        'volcano',
        'ruins',
        'ruins',
      ]),
    ).toBe(true)
    expect(isFourAreaCompletion(['plains', 'plains', 'forest'])).toBe(false)
  })

  it('未知 ID があっても4対象が揃えば true', () => {
    expect(
      isFourAreaCompletion([
        'plains',
        'forest',
        'volcano',
        'ruins',
        'castle',
        'future-boss',
      ]),
    ).toBe(true)
  })

  it('final stage ID などを要求しない', () => {
    expect(FOUR_AREA_COMPLETION_IDS).toEqual([
      'plains',
      'forest',
      'volcano',
      'ruins',
    ])
    expect(FOUR_AREA_COMPLETION_IDS.includes('castle' as never)).toBe(false)
    expect(FOUR_AREA_COMPLETION_IDS.includes('dungeon' as never)).toBe(false)
  })
})

describe('Ending 導線の判定条件（純粋）', () => {
  it('4つ目のエリアクリアで Ending 対象になる', () => {
    const before = ['plains', 'forest', 'volcano']
    expect(isFourAreaCompletion(before)).toBe(false)
    const after = [...before, 'ruins']
    expect(isFourAreaCompletion(after)).toBe(true)
  })

  it('既に4エリアクリア済みでも再表示可能（判定は true）', () => {
    expect(
      isFourAreaCompletion(['plains', 'forest', 'volcano', 'ruins']),
    ).toBe(true)
  })

  it('Stage 間クリアだけでは Ending 対象にならない', () => {
    // Area Clear 前（最終ステージ以外）の進行は clearedAreaIds に載らない想定
    expect(isFourAreaCompletion(['plains', 'forest'])).toBe(false)
  })
})
