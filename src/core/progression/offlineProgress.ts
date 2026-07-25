/**
 * クリッカー等向けのオフライン進行計算（純粋関数）。
 * UI / Phaser / localStorage に依存しない。
 */

/**
 * 最終保存時刻から現在までの経過ミリ秒。
 * - 未来時刻・NaN・負の差分は 0
 * - maxOfflineMs で上限をかける（maxOfflineMs 自体が不正なら 0）
 */
export function calculateOfflineElapsedMs(
  lastSavedAtMs: number,
  nowMs: number,
  maxOfflineMs: number,
): number {
  if (
    !Number.isFinite(lastSavedAtMs) ||
    !Number.isFinite(nowMs) ||
    !Number.isFinite(maxOfflineMs)
  ) {
    return 0
  }
  if (maxOfflineMs < 0) {
    return 0
  }

  const elapsed = nowMs - lastSavedAtMs
  if (elapsed <= 0) {
    return 0
  }

  return Math.min(elapsed, maxOfflineMs)
}

/**
 * 秒あたり ratePerSecond の収益を、経過ミリ秒分だけ加算する。
 * - rate / elapsed が 0 以下、または非有限なら 0
 */
export function calculateOfflineGain(
  ratePerSecond: number,
  elapsedMs: number,
): number {
  if (!Number.isFinite(ratePerSecond) || !Number.isFinite(elapsedMs)) {
    return 0
  }
  if (ratePerSecond <= 0 || elapsedMs <= 0) {
    return 0
  }
  return (ratePerSecond * elapsedMs) / 1000
}
