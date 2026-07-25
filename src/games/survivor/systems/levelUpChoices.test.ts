import { beforeEach, describe, expect, it } from 'vitest'
import { UNLOCK_SAVE_STORAGE_KEY } from '../GameConstants'
import { clearAllSaveData, setSkillSealed } from './UnlockSaveSystem'
import { hasNoNormalLevelUpChoices } from './LevelUpChoicePool'

function writeSave(partial: Record<string, unknown>): void {
  const base = {
    version: 7,
    unlockedAchievementIds: [],
    clearedAreaIds: [],
    gold: 0,
    shopUnlocked: true,
    shopUnlockTipSeen: true,
    shopUpgrades: {
      maxHp: 0,
      powerCap: 0,
      speedCap: 0,
      rangeCap: 0,
      pierceCap: 0,
      blastCap: 0,
      xpBonusCap: 0,
      sealSlots: 3,
    },
    sealedSkillIds: [] as string[],
    run: null,
    lifetimeStats: {
      runStarts: 0,
      deaths: 0,
      enemiesDefeated: 0,
      stagesCleared: 0,
      gameClears: 0,
    },
  }
  localStorage.setItem(
    UNLOCK_SAVE_STORAGE_KEY,
    JSON.stringify({ ...base, ...partial, shopUpgrades: {
      ...base.shopUpgrades,
      ...(partial.shopUpgrades as Record<string, number> | undefined),
    }}),
  )
}

describe('レベルアップ候補の除外・封印・上限', () => {
  beforeEach(() => {
    clearAllSaveData()
  })

  it('初期状態では通常候補が残っている（Power / Speed / Range）', () => {
    expect(hasNoNormalLevelUpChoices([])).toBe(false)
  })

  it('初期解放のみのスキルを上限扱いにすると候補がなくなる', () => {
    // 未解放の move / magnet / xpBonus はプールに入らない
    expect(
      hasNoNormalLevelUpChoices(['damage', 'fireRate', 'range']),
    ).toBe(true)
  })

  it('一部だけ上限でも他が残れば候補あり', () => {
    expect(hasNoNormalLevelUpChoices(['damage'])).toBe(false)
  })

  it('封印したスキルは候補から除外される', () => {
    writeSave({
      shopUpgrades: { sealSlots: 3 },
      sealedSkillIds: [],
    })
    expect(setSkillSealed('damage', true)).toBe(true)
    expect(setSkillSealed('fireRate', true)).toBe(true)
    expect(setSkillSealed('range', true)).toBe(true)
    expect(hasNoNormalLevelUpChoices([])).toBe(true)
  })

  it('封印枠が足りないと追加封印できない', () => {
    writeSave({
      shopUpgrades: { sealSlots: 1 },
      sealedSkillIds: [],
    })
    expect(setSkillSealed('damage', true)).toBe(true)
    expect(setSkillSealed('fireRate', true)).toBe(false)
  })

  it('解放済みスキルがあっても上限＋封印で候補が空になる', () => {
    writeSave({
      unlockedAchievementIds: ['plains_clear', 'forest_clear', 'volcano_clear'],
      shopUpgrades: { sealSlots: 1 },
      sealedSkillIds: ['xpBonus'],
    })
    // move / magnet / xpBonus が解放されても、上限と封印で全部外す
    expect(
      hasNoNormalLevelUpChoices([
        'damage',
        'fireRate',
        'range',
        'move',
        'magnet',
      ]),
    ).toBe(true)
  })
})
