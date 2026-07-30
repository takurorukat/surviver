import { ENDING_VICTORY_THANK_YOU_OFFSET_Y } from '../constants/ending'
import type { EndingScreenId } from './endingSequence'

export function shouldShowEndingVictoryThankYou(screen: EndingScreenId): boolean {
  return screen === 'victory'
}

export function calculateEndingVictoryThankYouY(
  imageY: number,
  imageDisplayHeight: number,
): number {
  const imageBottomY = imageY + imageDisplayHeight / 2
  return imageBottomY + ENDING_VICTORY_THANK_YOU_OFFSET_Y
}

export function collectEndingVisualTargets<T>(
  image: T | null,
  hintText: T | null,
  thankYouText: T | null,
): T[] {
  const targets: T[] = []
  if (image !== null) {
    targets.push(image)
  }
  if (thankYouText !== null) {
    targets.push(thankYouText)
  }
  if (hintText !== null) {
    targets.push(hintText)
  }
  return targets
}
