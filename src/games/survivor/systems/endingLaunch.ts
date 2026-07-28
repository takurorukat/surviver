/**
 * Area Clear 結果の Continue 後に Ending へ進むべきか。
 * （プレイヤー死亡・Stage 間クリアでは呼ばれない想定）
 */
import { isFourAreaCompletion } from './fourAreaCompletion'

export function shouldStartEndingAfterAreaClear(
  clearedAreaIds: string[],
): boolean {
  return isFourAreaCompletion(clearedAreaIds)
}
