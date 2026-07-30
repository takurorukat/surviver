import { describe, expect, it, vi } from 'vitest'
import {
  BGM_TOGGLE_BUTTON_CENTER_X,
  BOTTOM_CORNER_BUTTON_CENTER_Y,
  BOTTOM_CORNER_BUTTON_EDGE_OFFSET,
  GAME_WIDTH,
  TITLE_SUPPORT_BUTTON_CENTER_X,
  TITLE_SUPPORT_LABEL,
} from '../GameConstants'
import {
  activateTitleSupportDeveloperLink,
  shouldCreateTitleSupportButton,
} from './SupportDeveloperButtonSystem'

describe('Title Support circle button', () => {
  it('Feature Flag OFFでは生成せず、ONでだけ生成対象にする', () => {
    expect(shouldCreateTitleSupportButton(false)).toBe(false)
    expect(shouldCreateTitleSupportButton(true)).toBe(true)
  })

  it('左下に置き、右下BGMと左右対称にする', () => {
    expect(TITLE_SUPPORT_BUTTON_CENTER_X).toBe(BOTTOM_CORNER_BUTTON_EDGE_OFFSET)
    expect(BGM_TOGGLE_BUTTON_CENTER_X).toBe(
      GAME_WIDTH - BOTTOM_CORNER_BUTTON_EDGE_OFFSET,
    )
    expect(TITLE_SUPPORT_BUTTON_CENTER_X + BGM_TOGGLE_BUTTON_CENTER_X).toBe(
      GAME_WIDTH,
    )
    expect(BOTTOM_CORNER_BUTTON_CENTER_Y).toBe(510)
  })

  it('タイトル用ラベルはSUPPORT', () => {
    expect(TITLE_SUPPORT_LABEL).toBe('SUPPORT')
  })

  it('Pointerの1操作でリンク処理を1回だけ呼ぶ', () => {
    const openLink = vi.fn(() => 'opened' as const)
    expect(activateTitleSupportDeveloperLink(openLink)).toBe('opened')
    expect(openLink).toHaveBeenCalledTimes(1)
  })

  it('EnterまたはSpaceの1操作でリンク処理を1回だけ呼ぶ', () => {
    const openLink = vi.fn(() => 'blocked' as const)
    expect(activateTitleSupportDeveloperLink(openLink)).toBe('blocked')
    expect(openLink).toHaveBeenCalledTimes(1)
  })
})
