/**
 * エリア1回分の結果データ（Version 1）。
 * Best Time / 履歴保存は含まない。メモリ上の確定値のみ。
 */
import type { StageAreaId } from '../constants/areas'

export type RunResultType = 'clear' | 'defeat'

/** エリア終了時に1回だけ確定する結果 */
export type RunResult = {
  areaId: StageAreaId
  resultType: RunResultType
  elapsedTimeMs: number
  playerLevel: number
  enemiesDefeated: number
  bossDefeated: boolean
}

/**
 * 結果確定前のエリア進行。
 * Stage 間では elapsed / kills を維持し、新エリア・Retry・Title 開始でリセットする。
 */
export type RunProgress = {
  areaId: StageAreaId | null
  elapsedTimeMs: number
  enemiesDefeated: number
  /** 最終ボス（finalBossConfig）をこのランで撃破したか */
  finalBossDefeated: boolean
  finalized: boolean
}
