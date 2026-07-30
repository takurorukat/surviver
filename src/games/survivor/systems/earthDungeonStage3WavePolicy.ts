/**
 * Earth Dungeon Stage3 のファイナルウェーブ終了方針（純粋関数）。
 * WaveSystem が参照する。Phaser に依存しない。
 */
import {
  FINAL_WAVE_EXTRA_PACK_GAP_SECONDS,
  FINAL_WAVE_EXTRA_PACK_GAP_SECONDS_FINAL_STAGE,
} from '../GameConstants'

/**
 * ファイナルウェーブ追加パックの間隔。
 * 非最終ステージは共通値、エリア最終ステージは短縮値。
 * Earth Stage3 も他の非最終ステージと同じ共通間隔を使う。
 */
export function getFinalWaveExtraPackGapSecondsForStage(
  areaId: string,
  stageNumber: number,
  isAreaFinalStage: boolean,
): number {
  void areaId
  void stageNumber
  if (isAreaFinalStage) {
    return FINAL_WAVE_EXTRA_PACK_GAP_SECONDS_FINAL_STAGE
  }
  return FINAL_WAVE_EXTRA_PACK_GAP_SECONDS
}

/**
 * 新規スポーン予約を受け付けるか。
 * クローズ後は「すでに数えたパックのリトライ」だけ許可する。
 * （前回修正の失敗点: クローズ後にリトライも拒否してパックを捨てていた）
 */
export function shouldAcceptScheduledSpawnAttempt(
  closedForNewSpawns: boolean,
  isRetry: boolean,
): boolean {
  if (!closedForNewSpawns) {
    return true
  }
  return isRetry
}

/**
 * 有限ウェーブ型 Stage の早期クリア条件。
 * スポーン完了かつ生存敵0。死亡・二重開始は不可。
 */
export function shouldClearFiniteWaveStage(params: {
  allSpawnsFinished: boolean
  aliveEnemyCount: number
  playerDead: boolean
  stageClearAlreadyStarted: boolean
  remainingSeconds: number
}): boolean {
  if (params.playerDead || params.stageClearAlreadyStarted) {
    return false
  }
  if (!params.allSpawnsFinished) {
    return false
  }
  if (params.aliveEnemyCount > 0) {
    return false
  }
  // 残り時間があってもクリアしてよい（タイマー待ち不要）
  return true
}

/**
 * 予約スポーンが残っている／未完了ウェーブがあるとき、敵が一時0でもクリアしない。
 */
export function shouldHoldClearWhileSpawnsPending(params: {
  remainingScheduledSpawns: number
  pendingWarningSpawns: number
  aliveEnemyCount: number
}): boolean {
  if (params.remainingScheduledSpawns > 0 || params.pendingWarningSpawns > 0) {
    return true
  }
  return false
}
