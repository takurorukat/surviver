import { beforeEach, describe, expect, it } from 'vitest'
import {
  ACHIEVEMENT_ID_FOREST_CLEAR,
  ACHIEVEMENT_ID_ORBITING_ORB_UNLOCK,
  ACHIEVEMENT_ID_PLAINS_CLEAR,
  ACHIEVEMENT_ID_VOLCANO_CLEAR,
  COIN_MAGNET_RADIUS_BONUS_PER_LEVEL,
  MOVE_SPEED_MULTIPLIER_STEP,
  UNLOCK_SKILL_LABEL_MAGNET,
  UNLOCK_SKILL_LABEL_MOVE,
  UNLOCK_SKILL_LABEL_ORBITING_ORB,
  UNLOCK_SKILL_LABEL_POWER,
  UNLOCK_SKILL_LABEL_RANGE,
  UNLOCK_SKILL_LABEL_SPEED,
  UNLOCK_SKILL_LABEL_XP_BONUS,
  colorNumberToCssHex,
  getSkillElementId,
  getSkillElementTagColor,
  getSkillElementTagLabel,
} from '../GameConstants'
import { buildAvailableLevelUpChoicePool } from './LevelUpChoicePool'
import { clearAllSaveData, unlockAchievement } from './UnlockSaveSystem'

describe('基本スキル表示名と属性タグ', () => {
  beforeEach(() => {
    localStorage.clear()
    clearAllSaveData()
  })

  it('効果名SSoTが新しい表示名になっている', () => {
    expect(UNLOCK_SKILL_LABEL_MOVE).toBe('Move Speed')
    expect(UNLOCK_SKILL_LABEL_MAGNET).toBe('Pickup Range')
    expect(UNLOCK_SKILL_LABEL_XP_BONUS).toBe('XP Bonus')
    expect(UNLOCK_SKILL_LABEL_SPEED).toBe('Attack Speed')
    expect(UNLOCK_SKILL_LABEL_POWER).toBe('Power')
    expect(UNLOCK_SKILL_LABEL_RANGE).toBe('Attack Range')
    expect(UNLOCK_SKILL_LABEL_ORBITING_ORB).toBe('Orbit')
  })

  it('Level Up プールのタイトルがSSoTと同じ', () => {
    unlockAchievement(ACHIEVEMENT_ID_PLAINS_CLEAR)
    unlockAchievement(ACHIEVEMENT_ID_FOREST_CLEAR)
    unlockAchievement(ACHIEVEMENT_ID_VOLCANO_CLEAR)
    const pool = buildAvailableLevelUpChoicePool()
    const byId = new Map(pool.map((choice) => [choice.id, choice]))

    expect(byId.get('move')?.title).toBe(UNLOCK_SKILL_LABEL_MOVE)
    expect(byId.get('magnet')?.title).toBe(UNLOCK_SKILL_LABEL_MAGNET)
    expect(byId.get('xpBonus')?.title).toBe(UNLOCK_SKILL_LABEL_XP_BONUS)
    expect(byId.get('damage')?.title).toBe(UNLOCK_SKILL_LABEL_POWER)
    expect(byId.get('fireRate')?.title).toBe(UNLOCK_SKILL_LABEL_SPEED)
    expect(byId.get('range')?.title).toBe(UNLOCK_SKILL_LABEL_RANGE)

    expect(byId.get('move')?.description).toBe(
      `Movement Speed +${Math.round(MOVE_SPEED_MULTIPLIER_STEP * 100)}%`,
    )
    expect(byId.get('magnet')?.description).toBe(
      `Pickup Radius +${COIN_MAGNET_RADIUS_BONUS_PER_LEVEL}px`,
    )
  })

  it('属性タグは根拠があるスキルだけ持つ', () => {
    expect(getSkillElementId('move')).toBe('wind')
    expect(getSkillElementId('magnet')).toBe('water')
    expect(getSkillElementId('xpBonus')).toBe('fire')
    expect(getSkillElementTagLabel('move')).toBe('WIND')
    expect(getSkillElementTagLabel('magnet')).toBe('WATER')
    expect(getSkillElementTagLabel('xpBonus')).toBe('FIRE')

    // Power / Attack Speed / Attack Range は風水火土の対応なし
    expect(getSkillElementId('damage')).toBe(null)
    expect(getSkillElementId('fireRate')).toBe(null)
    expect(getSkillElementId('range')).toBe(null)
    expect(getSkillElementTagLabel('damage')).toBe(null)
  })

  it('属性タグ色は CORE_SKILL_ICONS と同じSSoT', () => {
    expect(getSkillElementTagColor('move')).toBe(0x22c55e)
    expect(getSkillElementTagColor('magnet')).toBe(0x38bdf8)
    expect(getSkillElementTagColor('xpBonus')).toBe(0xef4444)
    expect(colorNumberToCssHex(0x22c55e)).toBe('#22c55e')
  })

  it('内部IDは変更していない', () => {
    expect(ACHIEVEMENT_ID_ORBITING_ORB_UNLOCK).toBe('orbiting_orb_unlock')
    const pool = buildAvailableLevelUpChoicePool()
    const ids = pool.map((choice) => choice.id)
    expect(ids.includes('damage')).toBe(true)
    expect(ids.includes('fireRate')).toBe(true)
    expect(ids.includes('move')).toBe(false)
  })
})
