import { beforeEach, describe, expect, it } from 'vitest'
import { STAGE_AREAS, getAreaById, UNLOCK_SAVE_STORAGE_KEY } from '../GameConstants'
import {
  clearAllSaveData,
  hasClearedArea,
  isAreaPlayable,
  isAreaRevealed,
  isAreaSelectableOnTitle,
  markAreaCleared,
} from './UnlockSaveSystem'

describe('エリア解放条件', () => {
  beforeEach(() => {
    clearAllSaveData()
  })

  it('Plains は最初からプレイ可能', () => {
    const plains = getAreaById('plains')
    expect(plains).not.toBeNull()
    expect(isAreaPlayable(plains!)).toBe(true)
    expect(isAreaSelectableOnTitle(plains!)).toBe(true)
  })

  it('Forest は Plains クリア後にプレイ可能', () => {
    const forest = getAreaById('forest')!
    expect(isAreaPlayable(forest)).toBe(false)
    markAreaCleared('plains')
    expect(hasClearedArea('plains')).toBe(true)
    expect(isAreaPlayable(forest)).toBe(true)
  })

  it('Volcano は Forest 開放まで ?（選択不可）、Forest クリアでプレイ可能', () => {
    const volcano = getAreaById('volcano')!
    expect(isAreaRevealed(volcano)).toBe(false)
    expect(isAreaSelectableOnTitle(volcano)).toBe(false)

    markAreaCleared('plains')
    expect(isAreaRevealed(volcano)).toBe(true)
    expect(isAreaPlayable(volcano)).toBe(false)

    markAreaCleared('forest')
    expect(isAreaPlayable(volcano)).toBe(true)
  })

  it('解放チェーン: plains → forest → volcano → ruins', () => {
    const chain = ['plains', 'forest', 'volcano', 'ruins'] as const
    for (let index = 0; index < chain.length; index++) {
      const area = getAreaById(chain[index])!
      if (index === 0) {
        expect(isAreaPlayable(area)).toBe(true)
      } else {
        expect(isAreaPlayable(area)).toBe(false)
        markAreaCleared(chain[index - 1])
        expect(isAreaPlayable(area)).toBe(true)
      }
    }
  })

  it('Castle / Abyss は Coming Soon のため条件を満たしてもプレイ不可', () => {
    markAreaCleared('plains')
    markAreaCleared('forest')
    markAreaCleared('volcano')
    markAreaCleared('ruins')
    markAreaCleared('castle')
    expect(isAreaPlayable(getAreaById('castle')!)).toBe(false)
    expect(isAreaPlayable(getAreaById('dungeon')!)).toBe(false)
    expect(getAreaById('castle')!.comingSoon).toBe(true)
    expect(getAreaById('dungeon')!.comingSoon).toBe(true)
  })

  it('comingSoon のエリアは条件を満たしてもプレイ不可', () => {
    const fakeComingSoon = {
      ...STAGE_AREAS[0],
      id: 'plains' as const,
      comingSoon: true,
    }
    expect(isAreaPlayable(fakeComingSoon)).toBe(false)
  })

  it('直接セーブを書いてクリア済み判定できる', () => {
    localStorage.setItem(
      UNLOCK_SAVE_STORAGE_KEY,
      JSON.stringify({
        unlockedAchievementIds: [],
        clearedAreaIds: ['plains', 'forest'],
        gold: 0,
      }),
    )
    expect(hasClearedArea('forest')).toBe(true)
    expect(isAreaPlayable(getAreaById('volcano')!)).toBe(true)
  })
})
