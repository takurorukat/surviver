import { describe, expect, it } from 'vitest'
import {
  BGM_FADE_MS,
  resolveBgmLoopRange,
  scheduleGainFadeIn,
  scheduleGainFadeOut,
} from './bgmFade'

describe('resolveBgmLoopRange', () => {
  it('bounds 未指定ならファイル全体をループする', () => {
    const result = resolveBgmLoopRange(60)
    expect(result).toEqual({ loopStart: 0, loopEnd: 60 })
  })

  it('空オブジェクトもファイル全体をループする', () => {
    const result = resolveBgmLoopRange(60, {})
    expect(result).toEqual({ loopStart: 0, loopEnd: 60 })
  })

  it('検証済み bounds のみ適用する', () => {
    const result = resolveBgmLoopRange(60, { loopStart: 2.5, loopEnd: 58 })
    expect(result).toEqual({ loopStart: 2.5, loopEnd: 58 })
  })

  it('loopEnd だけなら先頭から指定位置までをループする', () => {
    const result = resolveBgmLoopRange(60, { loopEnd: 57.5 })
    expect(result).toEqual({ loopStart: 0, loopEnd: 57.5 })
  })

  it('loopStart だけなら指定位置から末尾までをループする', () => {
    const result = resolveBgmLoopRange(60, { loopStart: 2.5 })
    expect(result).toEqual({ loopStart: 2.5, loopEnd: 60 })
  })

  it('不正な bounds は無視して全体ループに戻す', () => {
    expect(resolveBgmLoopRange(60, { loopStart: -1, loopEnd: 10 })).toEqual({
      loopStart: 0,
      loopEnd: 60,
    })
    expect(resolveBgmLoopRange(60, { loopStart: 10, loopEnd: 10 })).toEqual({
      loopStart: 0,
      loopEnd: 60,
    })
    expect(resolveBgmLoopRange(60, { loopStart: 10, loopEnd: 70 })).toEqual({
      loopStart: 0,
      loopEnd: 60,
    })
  })
})

describe('BGM fade helpers', () => {
  it('フェード時間の既定値は 80〜150ms の範囲内', () => {
    expect(BGM_FADE_MS).toBeGreaterThanOrEqual(80)
    expect(BGM_FADE_MS).toBeLessThanOrEqual(150)
  })

  it('scheduleGainFadeOut / FadeIn が gain をスケジュールする', () => {
    const scheduled: number[] = []
    const gainParam = {
      value: 0.5,
      cancelScheduledValues: () => {
        scheduled.length = 0
      },
      setValueAtTime: (value: number, _time: number) => {
        gainParam.value = value
      },
      linearRampToValueAtTime: (value: number, _time: number) => {
        scheduled.push(value)
      },
    }
    const gainNode = { gain: gainParam } as unknown as GainNode
    const audioContext = { currentTime: 1 } as AudioContext

    scheduleGainFadeOut(audioContext, gainNode, 100)
    expect(scheduled).toEqual([0])

    scheduled.length = 0
    scheduleGainFadeIn(audioContext, gainNode, 0.45, 100)
    expect(scheduled).toEqual([0.45])
  })
})
