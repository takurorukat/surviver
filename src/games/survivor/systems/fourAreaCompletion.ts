/**
 * 4エリア（plains / forest / volcano / ruins）全クリア判定。
 * 最終ステージ（castle / dungeon 等）は要求しない。
 */
import { FOUR_AREA_COMPLETION_IDS } from '../GameConstants'

/**
 * clearedAreaIds に Version 1 の4エリアがすべて含まれるか。
 * 順番・重複・未知 ID の有無には依存しない。
 */
export function isFourAreaCompletion(clearedAreaIds: string[]): boolean {
  const seen = new Set<string>()
  for (let index = 0; index < clearedAreaIds.length; index++) {
    seen.add(clearedAreaIds[index])
  }

  for (let index = 0; index < FOUR_AREA_COMPLETION_IDS.length; index++) {
    if (!seen.has(FOUR_AREA_COMPLETION_IDS[index])) {
      return false
    }
  }
  return true
}
