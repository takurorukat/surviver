/**
 * 高頻度SEだけをキー単位で間引く、Sceneローカルの最小再生間隔管理。
 * Timerを作らず、ゲームのポーズに影響されない単調増加時計を使う。
 */
export class SfxCooldownGate {
  private readonly lastPlayedAtMsByKey = new Map<string, number>()

  constructor(
    private readonly nowMs: () => number = () => performance.now(),
  ) {}

  shouldPlay(soundKey: string, cooldownMs: number): boolean {
    const nowMs = this.nowMs()
    const lastPlayedAtMs = this.lastPlayedAtMsByKey.get(soundKey)
    if (
      lastPlayedAtMs !== undefined &&
      nowMs - lastPlayedAtMs < cooldownMs
    ) {
      return false
    }
    this.lastPlayedAtMsByKey.set(soundKey, nowMs)
    return true
  }
}
