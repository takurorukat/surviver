import { describe, expect, it } from 'vitest'
import {
  calculateOfflineElapsedMs,
  calculateOfflineGain,
} from './offlineProgress'

describe('calculateOfflineElapsedMs', () => {
  it('通常の経過時間', () => {
    expect(calculateOfflineElapsedMs(1000, 6000, 60_000)).toBe(5000)
  })

  it('上限による丸め', () => {
    expect(calculateOfflineElapsedMs(0, 120_000, 60_000)).toBe(60_000)
  })

  it('未来日時は 0', () => {
    expect(calculateOfflineElapsedMs(10_000, 5000, 60_000)).toBe(0)
  })

  it('同時刻は 0', () => {
    expect(calculateOfflineElapsedMs(5000, 5000, 60_000)).toBe(0)
  })

  it('不正な値は 0', () => {
    expect(calculateOfflineElapsedMs(Number.NaN, 1000, 500)).toBe(0)
    expect(calculateOfflineElapsedMs(1000, Number.NaN, 500)).toBe(0)
    expect(calculateOfflineElapsedMs(1000, 2000, Number.NaN)).toBe(0)
    expect(calculateOfflineElapsedMs(1000, 2000, -1)).toBe(0)
  })
})

describe('calculateOfflineGain', () => {
  it('秒あたりレート × 経過秒', () => {
    expect(calculateOfflineGain(10, 5000)).toBe(50)
  })

  it('小数レートも number 演算どおり', () => {
    expect(calculateOfflineGain(1.5, 2000)).toBeCloseTo(3)
  })

  it('経過 0 またはレート 0 以下は 0', () => {
    expect(calculateOfflineGain(0, 5000)).toBe(0)
    expect(calculateOfflineGain(10, 0)).toBe(0)
    expect(calculateOfflineGain(-5, 5000)).toBe(0)
  })

  it('不正な値は 0', () => {
    expect(calculateOfflineGain(Number.NaN, 1000)).toBe(0)
    expect(calculateOfflineGain(5, Number.NaN)).toBe(0)
  })
})
