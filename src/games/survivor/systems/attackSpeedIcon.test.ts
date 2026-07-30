import { describe, expect, it } from 'vitest'
import {
  CORE_SKILL_ICONS,
  SKILL_ICON_DEFINITIONS,
  UNLOCK_SKILL_LABEL_SPEED,
} from '../GameConstants'

describe('Attack Speed Fairy wand icon wiring', () => {
  it('fireRate は skill-icon-speed / Attack Speed / シアン色を維持する', () => {
    expect(SKILL_ICON_DEFINITIONS.fireRate.assetKey).toBe('skill-icon-speed')
    expect(SKILL_ICON_DEFINITIONS.fireRate.assetPath).toBe(
      'assets/icons/skills/unified/speed.svg',
    )
    expect(SKILL_ICON_DEFINITIONS.fireRate).toBe(CORE_SKILL_ICONS.speed)
    expect(CORE_SKILL_ICONS.speed.color).toBe(0x67e8f9)
    expect(UNLOCK_SKILL_LABEL_SPEED).toBe('Attack Speed')
    // ロード失敗時のみ使う fallback。通常表示では SVG を優先する
    expect(CORE_SKILL_ICONS.speed.symbol).toBe('⚡')
  })
})
