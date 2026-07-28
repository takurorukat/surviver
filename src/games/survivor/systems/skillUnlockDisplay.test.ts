/**
 * スキル解放表示の回帰テスト。
 * HUD と Level Up が同じ isSkillUnlocked を使い、
 * 保存済み解放を「鍵あり／今ラン Lv0」と混同しないことを確認する。
 */
import { beforeEach, describe, expect, it } from 'vitest'
import {
  ACHIEVEMENT_CONDITION_BLAST,
  ACHIEVEMENT_CONDITION_FOREST_CLEAR,
  ACHIEVEMENT_CONDITION_ORBITING_ORB,
  ACHIEVEMENT_CONDITION_PIERCE,
  ACHIEVEMENT_CONDITION_PLAINS_CLEAR,
  ACHIEVEMENT_CONDITION_RICOCHET,
  ACHIEVEMENT_CONDITION_VOLCANO_CLEAR,
  ACHIEVEMENT_ID_BLAST_UNLOCK,
  ACHIEVEMENT_ID_FOREST_CLEAR,
  ACHIEVEMENT_ID_ORBITING_ORB_UNLOCK,
  ACHIEVEMENT_ID_PIERCE_UNLOCK,
  ACHIEVEMENT_ID_PLAINS_CLEAR,
  ACHIEVEMENT_ID_RICOCHET_UNLOCK,
  ACHIEVEMENT_ID_VOLCANO_CLEAR,
  UNLOCK_SAVE_STORAGE_KEY,
} from '../GameConstants'
import {
  ALL_ACHIEVEMENTS,
  getUnlockAchievementIdForSkill,
  getUnlockStatusRows,
  isSkillUnlocked,
  shouldShowSkillLockOnHud,
  type UnlockableSkillId,
} from './AchievementSystem'
import { buildAvailableLevelUpChoicePool } from './LevelUpChoicePool'
import {
  clearAllSaveData,
  loadGameSaveData,
  unlockAchievement,
} from './UnlockSaveSystem'

const UNLOCKABLE_SKILLS: UnlockableSkillId[] = [
  'move',
  'magnet',
  'xpBonus',
  'pierce',
  'blast',
  'orbitingOrb',
  'ricochet',
]

const EXPECTED_UNLOCK_IDS: Record<UnlockableSkillId, string> = {
  move: ACHIEVEMENT_ID_PLAINS_CLEAR,
  magnet: ACHIEVEMENT_ID_FOREST_CLEAR,
  xpBonus: ACHIEVEMENT_ID_VOLCANO_CLEAR,
  pierce: ACHIEVEMENT_ID_PIERCE_UNLOCK,
  blast: ACHIEVEMENT_ID_BLAST_UNLOCK,
  orbitingOrb: ACHIEVEMENT_ID_ORBITING_ORB_UNLOCK,
  ricochet: ACHIEVEMENT_ID_RICOCHET_UNLOCK,
}

function writeEmptySaveWithUnlocks(unlockedIds: string[]): void {
  localStorage.setItem(
    UNLOCK_SAVE_STORAGE_KEY,
    JSON.stringify({
      version: 8,
      gold: 0,
      clearedAreaIds: [],
      unlockedAchievementIds: unlockedIds,
      shopUnlocked: false,
      shopUnlockTipSeen: false,
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
      endingSeen: false,
    }),
  )
}

describe('skill unlock ID mapping（SSoT）', () => {
  it('7スキルすべてが正しい Unlock ID へ対応する', () => {
    for (let index = 0; index < UNLOCKABLE_SKILLS.length; index++) {
      const skillId = UNLOCKABLE_SKILLS[index]
      expect(getUnlockAchievementIdForSkill(skillId)).toBe(
        EXPECTED_UNLOCK_IDS[skillId],
      )
    }
  })

  it('ALL_ACHIEVEMENTS の skillId と getUnlockAchievementIdForSkill が一致', () => {
    for (let index = 0; index < ALL_ACHIEVEMENTS.length; index++) {
      const def = ALL_ACHIEVEMENTS[index]
      if (def.skillId === undefined) {
        continue
      }
      expect(getUnlockAchievementIdForSkill(def.skillId)).toBe(def.id)
    }
  })

  it('未知スキル ID では例外にならず null／false', () => {
    expect(getUnlockAchievementIdForSkill('unknown' as UnlockableSkillId)).toBe(
      null,
    )
    expect(isSkillUnlocked('unknown' as UnlockableSkillId)).toBe(false)
  })
})

describe('displaysSavedSkillUnlocksAsUnlocked', () => {
  beforeEach(() => {
    localStorage.clear()
    clearAllSaveData()
  })

  it('未解放なら locked、保存済み解放なら unlocked（合成スキルも含む）', () => {
    for (let index = 0; index < UNLOCKABLE_SKILLS.length; index++) {
      const skillId = UNLOCKABLE_SKILLS[index]
      expect(isSkillUnlocked(skillId)).toBe(false)
      expect(shouldShowSkillLockOnHud(skillId)).toBe(true)
    }

    writeEmptySaveWithUnlocks(Object.values(EXPECTED_UNLOCK_IDS))
    for (let index = 0; index < UNLOCKABLE_SKILLS.length; index++) {
      const skillId = UNLOCKABLE_SKILLS[index]
      expect(isSkillUnlocked(skillId)).toBe(true)
      expect(shouldShowSkillLockOnHud(skillId)).toBe(false)
    }
  })

  it('getUnlockStatusRows の isUnlocked が isSkillUnlocked と一致', () => {
    unlockAchievement(ACHIEVEMENT_ID_PIERCE_UNLOCK)
    unlockAchievement(ACHIEVEMENT_ID_PLAINS_CLEAR)
    const rows = getUnlockStatusRows()
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index]
      expect(row.isUnlocked).toBe(isSkillUnlocked(row.skillId))
    }
  })

  it('未解放条件文が SSoT 定数と一致', () => {
    const rows = getUnlockStatusRows()
    const byId = new Map(rows.map((row) => [row.skillId, row]))
    expect(byId.get('move')?.unlockCondition).toBe(ACHIEVEMENT_CONDITION_PLAINS_CLEAR)
    expect(byId.get('magnet')?.unlockCondition).toBe(
      ACHIEVEMENT_CONDITION_FOREST_CLEAR,
    )
    expect(byId.get('xpBonus')?.unlockCondition).toBe(
      ACHIEVEMENT_CONDITION_VOLCANO_CLEAR,
    )
    expect(byId.get('pierce')?.unlockCondition).toBe(ACHIEVEMENT_CONDITION_PIERCE)
    expect(byId.get('blast')?.unlockCondition).toBe(ACHIEVEMENT_CONDITION_BLAST)
    expect(byId.get('ricochet')?.unlockCondition).toBe(
      ACHIEVEMENT_CONDITION_RICOCHET,
    )
    expect(byId.get('orbitingOrb')?.unlockCondition).toBe(
      ACHIEVEMENT_CONDITION_ORBITING_ORB,
    )
  })
})

describe('keepsHudAndLevelUpUnlockStateInSync', () => {
  beforeEach(() => {
    localStorage.clear()
    clearAllSaveData()
  })

  it('HUD が locked なら Level Up 候補に Move／Pickup／XP Bonus が出ない', () => {
    const pool = buildAvailableLevelUpChoicePool()
    const ids = pool.map((choice) => choice.id)
    expect(ids.includes('move')).toBe(false)
    expect(ids.includes('magnet')).toBe(false)
    expect(ids.includes('xpBonus')).toBe(false)
    expect(shouldShowSkillLockOnHud('move')).toBe(true)
  })

  it('HUD が unlocked なら Level Up 候補に出られる', () => {
    unlockAchievement(ACHIEVEMENT_ID_PLAINS_CLEAR)
    unlockAchievement(ACHIEVEMENT_ID_FOREST_CLEAR)
    unlockAchievement(ACHIEVEMENT_ID_VOLCANO_CLEAR)
    expect(shouldShowSkillLockOnHud('move')).toBe(false)
    expect(shouldShowSkillLockOnHud('magnet')).toBe(false)
    expect(shouldShowSkillLockOnHud('xpBonus')).toBe(false)
    const pool = buildAvailableLevelUpChoicePool()
    const ids = pool.map((choice) => choice.id)
    expect(ids.includes('move')).toBe(true)
    expect(ids.includes('magnet')).toBe(true)
    expect(ids.includes('xpBonus')).toBe(true)
  })
})

describe('removesLockOverlayWhenSkillUnlocks / refresh after save', () => {
  beforeEach(() => {
    localStorage.clear()
    clearAllSaveData()
  })

  it('解放前は鍵あり、unlockAchievement 後は鍵なし（同じ判定）', () => {
    expect(shouldShowSkillLockOnHud('blast')).toBe(true)
    const first = unlockAchievement(ACHIEVEMENT_ID_BLAST_UNLOCK)
    expect(first).toBe(true)
    expect(shouldShowSkillLockOnHud('blast')).toBe(false)
    // 重複解放は false（二重処理しない）
    expect(unlockAchievement(ACHIEVEMENT_ID_BLAST_UNLOCK)).toBe(false)
    expect(isSkillUnlocked('blast')).toBe(true)
  })

  it('古い Save 相当の再読込でも unlocked 表示', () => {
    writeEmptySaveWithUnlocks([
      ACHIEVEMENT_ID_ORBITING_ORB_UNLOCK,
      ACHIEVEMENT_ID_RICOCHET_UNLOCK,
    ])
    const data = loadGameSaveData()
    expect(data.unlockedAchievementIds).toContain(ACHIEVEMENT_ID_ORBITING_ORB_UNLOCK)
    expect(isSkillUnlocked('orbitingOrb')).toBe(true)
    expect(isSkillUnlocked('ricochet')).toBe(true)
    expect(shouldShowSkillLockOnHud('orbitingOrb')).toBe(false)
    // 今ラン Lv0 でも鍵は出さない（旧 HUD のバグ回帰）
    expect(shouldShowSkillLockOnHud('ricochet')).toBe(false)
  })
})
