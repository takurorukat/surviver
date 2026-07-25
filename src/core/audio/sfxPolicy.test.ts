import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_SFX_PLAYBACK_POLICY, SfxPolicyTracker } from './sfxPolicy'

describe('SfxPolicyTracker', () => {
  it('既定ポリシーではクールダウンも同時発音上限も効かない', () => {
    const tracker = new SfxPolicyTracker(DEFAULT_SFX_PLAYBACK_POLICY)
    expect(tracker.canPlay('coin', 1000)).toBe(true)
    tracker.onPlayStarted('coin', 1000)
    expect(tracker.canPlay('coin', 1005)).toBe(true)
    expect(tracker.applyVolumeJitter(0.35)).toBe(0.35)
    expect(tracker.applyRateJitter(1)).toBe(1)
  })

  it('クールダウン中は再生を抑止する', () => {
    const tracker = new SfxPolicyTracker({
      ...DEFAULT_SFX_PLAYBACK_POLICY,
      cooldownMs: 50,
    })
    tracker.onPlayStarted('hit', 1000)
    expect(tracker.canPlay('hit', 1020)).toBe(false)
    expect(tracker.canPlay('hit', 1060)).toBe(true)
  })

  it('同時発音上限を超えたら抑止する', () => {
    const tracker = new SfxPolicyTracker({
      ...DEFAULT_SFX_PLAYBACK_POLICY,
      maxConcurrent: 2,
    })
    tracker.onPlayStarted('shot')
    tracker.onPlayStarted('shot')
    expect(tracker.canPlay('shot')).toBe(false)
    tracker.onPlayEnded('shot')
    expect(tracker.canPlay('shot')).toBe(true)
  })

  it('ジッターは指定幅の範囲内', () => {
    const tracker = new SfxPolicyTracker({
      ...DEFAULT_SFX_PLAYBACK_POLICY,
      volumeJitter: 0.1,
      rateJitter: 0.1,
    })
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(1)
    expect(tracker.applyVolumeJitter(0.5)).toBeCloseTo(0.55)
    expect(tracker.applyRateJitter(1)).toBeCloseTo(1.1)
    randomSpy.mockRestore()
  })
})
