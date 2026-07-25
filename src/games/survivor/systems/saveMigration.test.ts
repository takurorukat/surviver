import { beforeEach, describe, expect, it } from 'vitest'
import {
  ACHIEVEMENT_ID_BLAST_UNLOCK,
  ACHIEVEMENT_ID_FOREST_UNTOUCHED,
  ACHIEVEMENT_ID_PIERCE_UNLOCK,
  ACHIEVEMENT_ID_PLAINS_CLEAR,
  ACHIEVEMENT_ID_PURE_POWER,
  ACHIEVEMENT_ID_RICOCHET_UNLOCK,
  ACHIEVEMENT_ID_UNTOUCHED,
  ACHIEVEMENT_ID_VOLCANO_CLEAR,
  ACHIEVEMENT_ID_VOLCANO_UNTOUCHED,
  UNLOCK_SAVE_STORAGE_KEY,
} from '../GameConstants'
import { clearAllSaveData, loadGameSaveData } from './UnlockSaveSystem'

describe('loadGameSaveData（移行・破損復元）', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('セーブが無いときは空データ', () => {
    const data = loadGameSaveData()
    expect(data.version).toBe(7)
    expect(data.gold).toBe(0)
    expect(data.clearedAreaIds).toEqual([])
    expect(data.shopUnlocked).toBe(false)
    expect(data.sealedSkillIds).toEqual([])
  })

  it('JSON が壊れているときは空データへ復元する', () => {
    localStorage.setItem(UNLOCK_SAVE_STORAGE_KEY, '{not-json')
    const data = loadGameSaveData()
    expect(data.gold).toBe(0)
    expect(data.clearedAreaIds).toEqual([])
    expect(data.version).toBe(7)
  })

  it('オブジェクトでない JSON も空データへ復元する', () => {
    localStorage.setItem(UNLOCK_SAVE_STORAGE_KEY, '"hello"')
    const data = loadGameSaveData()
    expect(data.gold).toBe(0)
  })

  it('Plains クリア済みの旧セーブへ plains_clear 実績を付ける', () => {
    localStorage.setItem(
      UNLOCK_SAVE_STORAGE_KEY,
      JSON.stringify({
        unlockedAchievementIds: [],
        clearedAreaIds: ['plains'],
        gold: 3,
      }),
    )
    const data = loadGameSaveData()
    expect(data.unlockedAchievementIds).toContain(ACHIEVEMENT_ID_PLAINS_CLEAR)
    expect(data.shopUnlocked).toBe(true)
    expect(data.version).toBe(7)
  })

  it('旧実績 ID を現行 ID へ移行する', () => {
    localStorage.setItem(
      UNLOCK_SAVE_STORAGE_KEY,
      JSON.stringify({
        unlockedAchievementIds: [
          ACHIEVEMENT_ID_UNTOUCHED,
          ACHIEVEMENT_ID_PURE_POWER,
          ACHIEVEMENT_ID_VOLCANO_UNTOUCHED,
          'forest_clear',
        ],
        clearedAreaIds: ['volcano'],
        gold: 0,
      }),
    )
    const data = loadGameSaveData()
    expect(data.unlockedAchievementIds).toContain(ACHIEVEMENT_ID_PLAINS_CLEAR)
    expect(data.unlockedAchievementIds).toContain(ACHIEVEMENT_ID_FOREST_UNTOUCHED)
    expect(data.unlockedAchievementIds).toContain(ACHIEVEMENT_ID_BLAST_UNLOCK)
    expect(data.unlockedAchievementIds).toContain(ACHIEVEMENT_ID_PIERCE_UNLOCK)
    expect(data.unlockedAchievementIds).toContain(ACHIEVEMENT_ID_RICOCHET_UNLOCK)
    expect(data.unlockedAchievementIds).toContain(ACHIEVEMENT_ID_VOLCANO_CLEAR)
  })

  it('旧 Bomb / ricochet の封印は読み込み時に除外する', () => {
    localStorage.setItem(
      UNLOCK_SAVE_STORAGE_KEY,
      JSON.stringify({
        unlockedAchievementIds: [],
        clearedAreaIds: [],
        gold: 0,
        shopUnlocked: true,
        shopUpgrades: { sealSlots: 2 },
        sealedSkillIds: ['groundBomb', 'ricochet', 'damage'],
      }),
    )
    const data = loadGameSaveData()
    expect(data.sealedSkillIds).toEqual(['damage'])
  })

  it('旧 run フィールドは捨てて null にする', () => {
    localStorage.setItem(
      UNLOCK_SAVE_STORAGE_KEY,
      JSON.stringify({
        unlockedAchievementIds: [],
        clearedAreaIds: [],
        gold: 1,
        run: { stageNumber: 2 },
      }),
    )
    const data = loadGameSaveData()
    expect(data.run).toBeNull()
  })

  it('clearAllSaveData 後は空に戻る', () => {
    localStorage.setItem(
      UNLOCK_SAVE_STORAGE_KEY,
      JSON.stringify({ gold: 99, clearedAreaIds: ['plains'] }),
    )
    clearAllSaveData()
    const data = loadGameSaveData()
    expect(data.gold).toBe(0)
    expect(data.clearedAreaIds).toEqual([])
  })
})
