import { describe, expect, it } from 'vitest'
import { SfxCooldownGate } from './SfxCooldownGate'

describe('SfxCooldownGate', () => {
  it('同一SEをクールダウン中は抑制し、経過後は再許可する', () => {
    let nowMs = 1000
    const gate = new SfxCooldownGate(() => nowMs)

    expect(gate.shouldPlay('coin', 60)).toBe(true)
    nowMs = 1059
    expect(gate.shouldPlay('coin', 60)).toBe(false)
    nowMs = 1060
    expect(gate.shouldPlay('coin', 60)).toBe(true)
  })

  it('別種類のSEは互いに妨害しない', () => {
    const gate = new SfxCooldownGate(() => 1000)

    expect(gate.shouldPlay('power-fire', 55)).toBe(true)
    expect(gate.shouldPlay('enemy-defeat', 60)).toBe(true)
    expect(gate.shouldPlay('menu-move', 60)).toBe(true)
  })

  it('Scene再作成相当の新インスタンスへ状態を残さない', () => {
    const firstSceneGate = new SfxCooldownGate(() => 1000)
    expect(firstSceneGate.shouldPlay('coin', 60)).toBe(true)
    expect(firstSceneGate.shouldPlay('coin', 60)).toBe(false)

    const recreatedSceneGate = new SfxCooldownGate(() => 1000)
    expect(recreatedSceneGate.shouldPlay('coin', 60)).toBe(true)
  })
})
