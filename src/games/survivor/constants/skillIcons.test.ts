import { describe, expect, it } from 'vitest'
import {
  SKILL_ICON_BASE_SIZE,
  SKILL_ICON_DEFINITIONS,
  getSkillIconDefinition,
  getSkillIconMetrics,
  isSkillIconId,
  type SkillIconId,
} from './skillIcons'

const ALL_SKILL_ICON_IDS: SkillIconId[] = [
  'damage',
  'fireRate',
  'range',
  'move',
  'magnet',
  'hp',
  'pierce',
  'blast',
  'orbitingOrb',
  'ricochet',
  'xpBonus',
]

describe('skill icon definitions', () => {
  it('全スキルの記号と色を一元定義している', () => {
    expect(SKILL_ICON_DEFINITIONS.pierce).toEqual({
      symbol: '➤',
      color: 0x67e8f9,
    })
    expect(SKILL_ICON_DEFINITIONS.orbitingOrb).toEqual({
      symbol: '◉',
      color: 0x38bdf8,
    })
    expect(SKILL_ICON_DEFINITIONS.blast.symbol).toBe('✸')
    expect(SKILL_ICON_DEFINITIONS.ricochet.symbol).toBe('↯')
    expect(SKILL_ICON_DEFINITIONS.xpBonus.symbol).toBe('❖')
    expect(Object.keys(SKILL_ICON_DEFINITIONS)).toHaveLength(11)
  })

  it('既知の skillId は isSkillIconId / getSkillIconDefinition で扱える', () => {
    for (let index = 0; index < ALL_SKILL_ICON_IDS.length; index++) {
      const skillId = ALL_SKILL_ICON_IDS[index]
      expect(isSkillIconId(skillId)).toBe(true)
      const definition = getSkillIconDefinition(skillId)
      expect(definition.symbol.length).toBeGreaterThan(0)
      expect(Number.isFinite(definition.color)).toBe(true)
    }
    // 不明 ID は従来どおり false（フォールバック用）
    expect(isSkillIconId('unknownSkill')).toBe(false)
  })

  it('倍率を変えても枠とシンボルの相対比率を維持する', () => {
    const tree = getSkillIconMetrics(1)
    const levelUp = getSkillIconMetrics(1.5)
    const banner = getSkillIconMetrics(4.5)

    expect(tree.size).toBe(SKILL_ICON_BASE_SIZE)
    expect(levelUp.size / tree.size).toBe(1.5)
    expect(banner.size / tree.size).toBe(4.5)
    expect(levelUp.symbolFontSize / tree.symbolFontSize).toBe(1.5)
    expect(banner.symbolFontSize / tree.symbolFontSize).toBe(4.5)
  })
})
