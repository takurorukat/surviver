import { describe, expect, it } from 'vitest'
import {
  SETTINGS_CREDITS_BODY,
  calculateCreditsBodyMaxScroll,
  calculateCreditsPanelHeight,
  CREDITS_PANEL_MAX_HEIGHT,
  CREDITS_PANEL_MARGIN_Y,
  GAME_HEIGHT,
} from '../GameConstants'

describe('Credits attribution (UI short form)', () => {
  it('必要帰属（作者・配布元・ライセンス）が本文にある', () => {
    expect(SETTINGS_CREDITS_BODY).toContain('MUSIC')
    expect(SETTINGS_CREDITS_BODY).toContain('Icons by Lorc')
    expect(SETTINGS_CREDITS_BODY).toContain('Game-icons.net')
    expect(SETTINGS_CREDITS_BODY).toContain('CC BY 3.0')
    expect(SETTINGS_CREDITS_BODY).toContain('obscure music')
    expect(SETTINGS_CREDITS_BODY).toContain('OpenGameArt')
    expect(SETTINGS_CREDITS_BODY).toContain('CC0')
    expect(SETTINGS_CREDITS_BODY).toContain('SKILL ICONS')
  })

  it('長いURL・SHA・Downloaded date を UI 本文に含めない', () => {
    expect(SETTINGS_CREDITS_BODY.includes('https://')).toBe(false)
    expect(SETTINGS_CREDITS_BODY.toLowerCase().includes('sha-256')).toBe(false)
    expect(SETTINGS_CREDITS_BODY.toLowerCase().includes('downloaded')).toBe(false)
    expect(SETTINGS_CREDITS_BODY.includes('opengameart.org/content')).toBe(false)
    expect(SETTINGS_CREDITS_BODY.includes('Pack of loopable game music')).toBe(
      false,
    )
  })

  it('パネル高さは画面内に収まり、本文スクロール上限を計算できる', () => {
    expect(calculateCreditsPanelHeight(GAME_HEIGHT)).toBe(CREDITS_PANEL_MAX_HEIGHT)
    expect(calculateCreditsPanelHeight(400)).toBe(400 - CREDITS_PANEL_MARGIN_Y * 2)
    expect(calculateCreditsBodyMaxScroll(120, 200)).toBe(0)
    expect(calculateCreditsBodyMaxScroll(250, 200)).toBe(50)
  })
})
