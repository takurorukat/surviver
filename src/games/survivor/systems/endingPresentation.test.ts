import { describe, expect, it } from 'vitest'
import {
  ENDING_VICTORY_THANK_YOU_FONT_SIZE_PX,
  ENDING_VICTORY_THANK_YOU_TEXT,
  FONT_FAMILY_HEADING,
  GAME_HEIGHT,
} from '../GameConstants'
import {
  calculateEndingVictoryThankYouY,
  collectEndingVisualTargets,
  shouldShowEndingVictoryThankYou,
} from './endingPresentation'

describe('Ending Victory thank-you presentation', () => {
  it('正確な文言と既存ピクセル見出しフォントを使う', () => {
    expect(ENDING_VICTORY_THANK_YOU_TEXT).toBe('Thank you for playing!')
    expect(ENDING_VICTORY_THANK_YOU_FONT_SIZE_PX).toBe(18)
    expect(FONT_FAMILY_HEADING).toBe('"Press Start 2P", monospace')
  })

  it('Victory画面だけで表示する', () => {
    expect(shouldShowEndingVictoryThankYou('victory')).toBe(true)
    expect(shouldShowEndingVictoryThankYou('finalAscent')).toBe(false)
  })

  it('画像の実表示下端から22px下、Continue hintより上に配置する', () => {
    const imageY = 270
    const imageDisplayHeight = 317
    const imageBottomY = imageY + imageDisplayHeight / 2
    const thankYouY = calculateEndingVictoryThankYouY(imageY, imageDisplayHeight)

    expect(thankYouY).toBe(imageBottomY + 22)
    expect(thankYouY).toBeGreaterThan(imageBottomY)
    expect(thankYouY).toBeLessThan(GAME_HEIGHT - 18)
  })

  it('Victoryのfade対象へ画像・Thank-you・Continue hintを同時に含める', () => {
    const image = { id: 'image' }
    const thankYou = { id: 'thank-you' }
    const hint = { id: 'hint' }

    expect(collectEndingVisualTargets(image, hint, thankYou)).toEqual([
      image,
      thankYou,
      hint,
    ])
  })

  it('Final AscentではThank-youなしのfade対象になる', () => {
    const image = { id: 'image' }
    const hint = { id: 'hint' }

    expect(collectEndingVisualTargets(image, hint, null)).toEqual([image, hint])
  })
})
