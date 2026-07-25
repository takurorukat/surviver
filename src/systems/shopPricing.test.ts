import { beforeEach, describe, expect, it } from 'vitest'
import { UNLOCK_SAVE_STORAGE_KEY } from '../GameConstants'
import {
  clearAllSaveData,
  getShopUpgradePrice,
  purchaseShopUpgrade,
  addGold,
} from './UnlockSaveSystem'

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
      sealSlots: 0,
    },
    sealedSkillIds: [],
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
    JSON.stringify({ ...base, ...partial }),
  )
}

describe('getShopUpgradePrice / purchaseShopUpgrade', () => {
  beforeEach(() => {
    clearAllSaveData()
  })

  it('Max HP は 1 → 10 → 20 → 30 → 40 → 40', () => {
    writeSave({
      shopUpgrades: {
        maxHp: 0,
        powerCap: 0,
        speedCap: 0,
        rangeCap: 0,
        pierceCap: 0,
        blastCap: 0,
        xpBonusCap: 0,
        sealSlots: 0,
      },
    })
    expect(getShopUpgradePrice('maxHp')).toBe(1)

    writeSave({
      shopUpgrades: {
        maxHp: 1,
        powerCap: 0,
        speedCap: 0,
        rangeCap: 0,
        pierceCap: 0,
        blastCap: 0,
        xpBonusCap: 0,
        sealSlots: 0,
      },
    })
    expect(getShopUpgradePrice('maxHp')).toBe(10)

    writeSave({
      shopUpgrades: {
        maxHp: 4,
        powerCap: 0,
        speedCap: 0,
        rangeCap: 0,
        pierceCap: 0,
        blastCap: 0,
        xpBonusCap: 0,
        sealSlots: 0,
      },
    })
    expect(getShopUpgradePrice('maxHp')).toBe(40)

    writeSave({
      shopUpgrades: {
        maxHp: 8,
        powerCap: 0,
        speedCap: 0,
        rangeCap: 0,
        pierceCap: 0,
        blastCap: 0,
        xpBonusCap: 0,
        sealSlots: 0,
      },
    })
    expect(getShopUpgradePrice('maxHp')).toBe(40)
  })

  it('スキル上限（Power Cap など）は 1 → 5 → 10 → 20 → 30 → 40 → 40', () => {
    writeSave({
      shopUpgrades: {
        maxHp: 0,
        powerCap: 0,
        speedCap: 0,
        rangeCap: 0,
        pierceCap: 0,
        blastCap: 0,
        xpBonusCap: 0,
        sealSlots: 0,
      },
    })
    expect(getShopUpgradePrice('powerCap')).toBe(1)
    expect(getShopUpgradePrice('speedCap')).toBe(1)
    expect(getShopUpgradePrice('rangeCap')).toBe(1)
    expect(getShopUpgradePrice('xpBonusCap')).toBe(1)
    expect(getShopUpgradePrice('pierceCap')).toBe(1)

    writeSave({
      shopUpgrades: {
        maxHp: 0,
        powerCap: 1,
        speedCap: 2,
        rangeCap: 5,
        pierceCap: 6,
        blastCap: 0,
        xpBonusCap: 3,
        sealSlots: 0,
      },
    })
    expect(getShopUpgradePrice('powerCap')).toBe(5)
    expect(getShopUpgradePrice('speedCap')).toBe(10)
    expect(getShopUpgradePrice('xpBonusCap')).toBe(20)
    expect(getShopUpgradePrice('rangeCap')).toBe(40)
    expect(getShopUpgradePrice('pierceCap')).toBe(40)
  })

  it('封印枠は 10 → 20 → 30', () => {
    writeSave({
      shopUpgrades: {
        maxHp: 0,
        powerCap: 0,
        speedCap: 0,
        rangeCap: 0,
        pierceCap: 0,
        blastCap: 0,
        xpBonusCap: 0,
        sealSlots: 0,
      },
    })
    expect(getShopUpgradePrice('sealSlots')).toBe(10)

    writeSave({
      shopUpgrades: {
        maxHp: 0,
        powerCap: 0,
        speedCap: 0,
        rangeCap: 0,
        pierceCap: 0,
        blastCap: 0,
        xpBonusCap: 0,
        sealSlots: 2,
      },
    })
    expect(getShopUpgradePrice('sealSlots')).toBe(30)
  })

  it('ゴールド不足なら購入できず、足りれば減算して購入回数が増える', () => {
    clearAllSaveData()
    addGold(1)
    const failed = purchaseShopUpgrade('maxHp')
    expect(failed.purchased).toBe(true)
    expect(failed.remainingGold).toBe(0)
    expect(getShopUpgradePrice('maxHp')).toBe(10)

    const tooPoor = purchaseShopUpgrade('maxHp')
    expect(tooPoor.purchased).toBe(false)
    expect(tooPoor.remainingGold).toBe(0)
  })
})
