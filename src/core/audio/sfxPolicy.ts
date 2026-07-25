/**
 * SE 同時発音・クールダウン・ランダム化の将来用ポリシー。
 * 既定値は現行挙動と同じ（制限なし・ジッターなし）。
 */

export type SfxPlaybackPolicy = {
  /** 同一 SE の最大同時発音数。0 = 無制限。 */
  maxConcurrent: number
  /** 連続再生の最小間隔（ミリ秒）。0 = 制限なし。 */
  cooldownMs: number
  /** 音量のランダム幅（0〜1）。例: 0.05 → ±5% */
  volumeJitter: number
  /** 再生レートのランダム幅（0〜1）。例: 0.02 → ±2% */
  rateJitter: number
}

export const DEFAULT_SFX_PLAYBACK_POLICY: SfxPlaybackPolicy = {
  maxConcurrent: 0,
  cooldownMs: 0,
  volumeJitter: 0,
  rateJitter: 0,
}

type SfxPolicyState = {
  activeCount: number
  lastPlayedAtMs: number
}

export class SfxPolicyTracker {
  private readonly stateByKey = new Map<string, SfxPolicyState>()
  private readonly policy: SfxPlaybackPolicy

  constructor(policy: SfxPlaybackPolicy = DEFAULT_SFX_PLAYBACK_POLICY) {
    this.policy = policy
  }

  /** 再生してよいか（クールダウン・同時発音上限）。 */
  canPlay(soundKey: string, nowMs: number = Date.now()): boolean {
    const state = this.getOrCreateState(soundKey)

    if (this.policy.cooldownMs > 0) {
      const elapsed = nowMs - state.lastPlayedAtMs
      if (state.lastPlayedAtMs > 0 && elapsed < this.policy.cooldownMs) {
        return false
      }
    }

    if (this.policy.maxConcurrent > 0) {
      if (state.activeCount >= this.policy.maxConcurrent) {
        return false
      }
    }

    return true
  }

  /** 再生開始を記録する。 */
  onPlayStarted(soundKey: string, nowMs: number = Date.now()): void {
    const state = this.getOrCreateState(soundKey)
    state.activeCount = state.activeCount + 1
    state.lastPlayedAtMs = nowMs
  }

  /** 再生終了を記録する。 */
  onPlayEnded(soundKey: string): void {
    const state = this.stateByKey.get(soundKey)
    if (state === undefined) {
      return
    }
    state.activeCount = Math.max(0, state.activeCount - 1)
  }

  /** ベース音量にジッターを加える。jitter=0 ならそのまま。 */
  applyVolumeJitter(baseVolume: number): number {
    return applyJitter(baseVolume, this.policy.volumeJitter, 0, 1)
  }

  /** ベース再生レートにジッターを加える。jitter=0 なら 1.0。 */
  applyRateJitter(baseRate: number = 1): number {
    return applyJitter(baseRate, this.policy.rateJitter, 0.25, 4)
  }

  reset(): void {
    this.stateByKey.clear()
  }

  private getOrCreateState(soundKey: string): SfxPolicyState {
    let state = this.stateByKey.get(soundKey)
    if (state === undefined) {
      state = { activeCount: 0, lastPlayedAtMs: 0 }
      this.stateByKey.set(soundKey, state)
    }
    return state
  }
}

function applyJitter(
  baseValue: number,
  jitterFraction: number,
  minValue: number,
  maxValue: number,
): number {
  if (jitterFraction <= 0) {
    return baseValue
  }
  const spread = baseValue * jitterFraction
  const randomOffset = (Math.random() * 2 - 1) * spread
  const result = baseValue + randomOffset
  return Math.max(minValue, Math.min(maxValue, result))
}
