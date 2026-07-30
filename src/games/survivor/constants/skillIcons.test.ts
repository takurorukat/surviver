import { describe, expect, it } from 'vitest'
import {
  CORE_SKILL_ICON_ASSETS,
  CORE_SKILL_ICON_IDS,
  CORE_SKILL_ICONS,
  SKILL_ICON_BASE_SIZE,
  SKILL_ICON_DEFINITIONS,
  getSkillIconDefinition,
  getSkillIconMetrics,
  isSkillIconId,
  type SkillIconId,
} from './skillIcons'

const ALL_SKILL_ICON_IDS: SkillIconId[] = [
  'wind',
  'water',
  'fire',
  'earth',
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
    expect(Object.keys(SKILL_ICON_DEFINITIONS)).toHaveLength(15)
  })

  it('7種類の統一アイコンを同じSSoTから参照する', () => {
    expect(CORE_SKILL_ICON_IDS).toEqual([
      'wind',
      'water',
      'fire',
      'earth',
      'speed',
      'power',
      'range',
    ])
    expect(CORE_SKILL_ICONS.wind.color).toBe(0x22c55e)
    expect(CORE_SKILL_ICONS.fire.color).toBe(0xef4444)
    expect(CORE_SKILL_ICONS.water.color).toBe(0x38bdf8)
    expect(CORE_SKILL_ICONS.earth.color).toBe(0xb88952)
    expect(CORE_SKILL_ICONS.speed.color).toBe(0x67e8f9)
    expect(CORE_SKILL_ICONS.power.color).toBe(0xfbbf24)
    expect(CORE_SKILL_ICONS.range.color).toBe(0xc084fc)
    expect(SKILL_ICON_DEFINITIONS.wind.color).toBe(CORE_SKILL_ICONS.wind.color)
    expect(SKILL_ICON_DEFINITIONS.fire.color).toBe(CORE_SKILL_ICONS.fire.color)
    expect(SKILL_ICON_DEFINITIONS.damage).toBe(CORE_SKILL_ICONS.power)
    expect(SKILL_ICON_DEFINITIONS.fireRate).toBe(CORE_SKILL_ICONS.speed)
    expect(SKILL_ICON_DEFINITIONS.fireRate.assetKey).toBe('skill-icon-speed')
    expect(SKILL_ICON_DEFINITIONS.fireRate.assetPath).toBe(
      'assets/icons/skills/unified/speed.svg',
    )
    expect(SKILL_ICON_DEFINITIONS.range).toBe(CORE_SKILL_ICONS.range)

    const assetKeys = CORE_SKILL_ICON_ASSETS.map((asset) => asset.key)
    const assetPaths = CORE_SKILL_ICON_ASSETS.map((asset) => asset.path)
    expect(new Set(assetKeys).size).toBe(7)
    expect(new Set(assetPaths).size).toBe(7)
    expect(assetPaths.every((path) => path.endsWith('.svg'))).toBe(true)
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
