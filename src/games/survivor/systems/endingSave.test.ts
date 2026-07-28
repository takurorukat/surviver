import { beforeEach, describe, expect, it } from 'vitest'
import { UNLOCK_SAVE_STORAGE_KEY } from '../GameConstants'
import {
  clearAllSaveData,
  getClearedAreaIds,
  hasSeenEnding,
  loadGameSaveData,
  markAreaCleared,
  markEndingSeen,
} from './UnlockSaveSystem'
import { isFourAreaCompletion } from './fourAreaCompletion'

describe('endingSeen 保存', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('初期値は false', () => {
    const data = loadGameSaveData()
    expect(data.endingSeen).toBe(false)
    expect(hasSeenEnding()).toBe(false)
  })

  it('古いセーブに endingSeen がなくてもロード可能', () => {
    localStorage.setItem(
      UNLOCK_SAVE_STORAGE_KEY,
      JSON.stringify({
        unlockedAchievementIds: [],
        clearedAreaIds: ['plains', 'forest', 'volcano', 'ruins'],
        gold: 1,
      }),
    )
    const data = loadGameSaveData()
    expect(data.endingSeen).toBe(false)
    expect(data.clearedAreaIds).toEqual([
      'plains',
      'forest',
      'volcano',
      'ruins',
    ])
    expect(data.version).toBe(8)
  })

  it('Ending 終了時に true（clearedAreaIds は壊さない）', () => {
    markAreaCleared('plains')
    markAreaCleared('forest')
    markAreaCleared('volcano')
    markAreaCleared('ruins')
    markEndingSeen()
    const data = loadGameSaveData()
    expect(data.endingSeen).toBe(true)
    expect(hasSeenEnding()).toBe(true)
    expect(isFourAreaCompletion(getClearedAreaIds())).toBe(true)
    expect(data.clearedAreaIds).toEqual([
      'plains',
      'forest',
      'volcano',
      'ruins',
    ])
  })

  it('clearAllSaveData で endingSeen も戻る', () => {
    markEndingSeen()
    clearAllSaveData()
    expect(hasSeenEnding()).toBe(false)
  })
})
