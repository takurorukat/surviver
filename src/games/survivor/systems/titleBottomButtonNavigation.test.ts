import { describe, expect, it } from 'vitest'
import {
  getTitleSupportSelectionIndex,
  listTitleBottomButtonIds,
  moveTitleBottomButtonSelection,
} from './titleBottomButtonNavigation'

describe('Title bottom button navigation', () => {
  it('Support OFFでは既存のBGMだけになり、BGMのindexを変えない', () => {
    expect(
      listTitleBottomButtonIds({
        supportEnabled: false,
        debugEnabled: false,
      }),
    ).toEqual(['bgm'])

    const existingBgmIndex = 8
    expect(getTitleSupportSelectionIndex(existingBgmIndex, false)).toBe(9)
    expect(existingBgmIndex).toBe(8)
  })

  it('Support ONでは左Supportと右BGMの間を左右移動できる', () => {
    const availability = {
      supportEnabled: true,
      debugEnabled: false,
    }
    expect(listTitleBottomButtonIds(availability)).toEqual(['support', 'bgm'])
    expect(moveTitleBottomButtonSelection('support', 1, availability)).toBe('bgm')
    expect(moveTitleBottomButtonSelection('bgm', -1, availability)).toBe('support')
  })

  it('Debugが有効な場合も画面上の左から右の順を維持する', () => {
    const availability = {
      supportEnabled: true,
      debugEnabled: true,
    }
    expect(listTitleBottomButtonIds(availability)).toEqual([
      'support',
      'debug',
      'bgm',
    ])
    expect(moveTitleBottomButtonSelection('support', 1, availability)).toBe('debug')
    expect(moveTitleBottomButtonSelection('debug', 1, availability)).toBe('bgm')
  })
})
