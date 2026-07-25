/** BGM 切替・停止時のフェード時間（ミリ秒）。80〜150ms の中央付近。 */
export const BGM_FADE_MS = 100

/** フェード完了後に AudioNode を切断するまでの余裕（ミリ秒）。 */
export const BGM_FADE_DISCONNECT_BUFFER_MS = 30

export type BgmLoopBounds = {
  /** 検証済みループ開始位置（秒）。未確定なら指定しない。 */
  loopStart?: number
  /** 検証済みループ終了位置（秒）。未確定なら指定しない。 */
  loopEnd?: number
}

/**
 * AudioBufferSourceNode に適用するループ区間を返す。
 * bounds が未設定・不正ならファイル全体をループする。
 */
export function resolveBgmLoopRange(
  durationSec: number,
  bounds?: BgmLoopBounds,
): { loopStart: number; loopEnd: number } {
  const fullRange = { loopStart: 0, loopEnd: durationSec }

  if (bounds === undefined) {
    return fullRange
  }

  const start = bounds.loopStart
  const end = bounds.loopEnd

  if (typeof start !== 'number' || typeof end !== 'number') {
    return fullRange
  }
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return fullRange
  }
  if (start < 0 || end <= start || end > durationSec) {
    return fullRange
  }

  return { loopStart: start, loopEnd: end }
}

/** GainNode を現在値から 0 へ線形フェードアウトする。 */
export function scheduleGainFadeOut(
  audioContext: AudioContext,
  gainNode: GainNode,
  fadeMs: number,
): void {
  const now = audioContext.currentTime
  const fadeSec = fadeMs / 1000
  const gainParam = gainNode.gain

  gainParam.cancelScheduledValues(now)
  gainParam.setValueAtTime(gainParam.value, now)
  gainParam.linearRampToValueAtTime(0, now + fadeSec)
}

/** GainNode を 0 から目標音量へ線形フェードインする。 */
export function scheduleGainFadeIn(
  audioContext: AudioContext,
  gainNode: GainNode,
  targetVolume: number,
  fadeMs: number,
): void {
  const now = audioContext.currentTime
  const fadeSec = fadeMs / 1000
  const gainParam = gainNode.gain
  const clampedVolume = Math.max(0, Math.min(1, targetVolume))

  gainParam.cancelScheduledValues(now)
  gainParam.setValueAtTime(0, now)
  gainParam.linearRampToValueAtTime(clampedVolume, now + fadeSec)
}

/** 即時に目標音量をセット（フェードなし）。 */
export function setGainImmediate(gainNode: GainNode, volume: number): void {
  const clampedVolume = Math.max(0, Math.min(1, volume))
  gainNode.gain.cancelScheduledValues(0)
  gainNode.gain.value = clampedVolume
}
