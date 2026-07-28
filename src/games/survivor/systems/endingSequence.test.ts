import { describe, expect, it } from 'vitest'
import {
  advanceEndingOnInput,
  createEndingSequenceState,
  unlockEndingInput,
} from './endingSequence'
import {
  ENDING_FINAL_ASCENT_KEY,
  ENDING_VICTORY_KEY,
} from '../GameConstants'

describe('endingSequence', () => {
  it('Victory から始まり入力ロック中', () => {
    const state = createEndingSequenceState()
    expect(state.screen).toBe('victory')
    expect(state.inputLocked).toBe(true)
    expect(state.finished).toBe(false)
  })

  it('ロック中は入力で進まない（1入力で2段階進まない）', () => {
    let state = createEndingSequenceState()
    state = advanceEndingOnInput(state)
    expect(state.screen).toBe('victory')
    state = advanceEndingOnInput(state)
    expect(state.screen).toBe('victory')
  })

  it('1枚目から2枚目へ進む', () => {
    let state = createEndingSequenceState()
    state = unlockEndingInput(state)
    state = advanceEndingOnInput(state)
    expect(state.screen).toBe('finalAscent')
    expect(state.inputLocked).toBe(true)
    expect(state.finished).toBe(false)
  })

  it('2枚目から Title へ戻る（finished）', () => {
    let state = createEndingSequenceState()
    state = unlockEndingInput(state)
    state = advanceEndingOnInput(state)
    state = unlockEndingInput(state)
    state = advanceEndingOnInput(state)
    expect(state.finished).toBe(true)
  })

  it('連打してもロック解除前は1画面だけ', () => {
    let state = createEndingSequenceState()
    state = unlockEndingInput(state)
    state = advanceEndingOnInput(state)
    state = advanceEndingOnInput(state)
    state = advanceEndingOnInput(state)
    expect(state.screen).toBe('finalAscent')
    expect(state.finished).toBe(false)
  })

  it('Victory / Final Ascent の asset key が存在する', () => {
    expect(ENDING_VICTORY_KEY).toBe('ending-victory')
    expect(ENDING_FINAL_ASCENT_KEY).toBe('ending-final-ascent')
  })
})
