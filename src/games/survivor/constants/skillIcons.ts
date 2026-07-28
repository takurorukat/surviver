/**
 * Survivor のスキルアイコン原本。
 *
 * 全UIはこの画像／記号・色と基準寸法を倍率だけ変えて使用する。
 */
export type SkillIconId =
  | 'wind'
  | 'water'
  | 'fire'
  | 'earth'
  | 'damage'
  | 'fireRate'
  | 'range'
  | 'move'
  | 'magnet'
  | 'hp'
  | 'pierce'
  | 'blast'
  | 'orbitingOrb'
  | 'ricochet'
  | 'xpBonus'

export type SkillIconDefinition = {
  symbol: string
  color: number
  assetKey?: string
  assetPath?: string
}

export type CoreSkillIconId =
  | 'wind'
  | 'water'
  | 'fire'
  | 'earth'
  | 'speed'
  | 'power'
  | 'range'

export const CORE_SKILL_ICON_IDS: CoreSkillIconId[] = [
  'wind',
  'water',
  'fire',
  'earth',
  'speed',
  'power',
  'range',
]

export const CORE_SKILL_ICONS: Record<CoreSkillIconId, SkillIconDefinition> = {
  wind: {
    symbol: '〰',
    color: 0x2dd4bf,
    assetKey: 'skill-icon-wind',
    assetPath: 'assets/icons/skills/unified/wind.svg',
  },
  water: {
    symbol: '●',
    color: 0x38bdf8,
    assetKey: 'skill-icon-water',
    assetPath: 'assets/icons/skills/unified/water.svg',
  },
  fire: {
    symbol: '▲',
    color: 0xf97316,
    assetKey: 'skill-icon-fire',
    assetPath: 'assets/icons/skills/unified/fire.svg',
  },
  earth: {
    symbol: '◆',
    color: 0xb88952,
    assetKey: 'skill-icon-earth',
    assetPath: 'assets/icons/skills/unified/earth.svg',
  },
  speed: {
    symbol: '⚡',
    color: 0x67e8f9,
    assetKey: 'skill-icon-speed',
    assetPath: 'assets/icons/skills/unified/speed.svg',
  },
  power: {
    symbol: '⚔',
    color: 0xfbbf24,
    assetKey: 'skill-icon-power',
    assetPath: 'assets/icons/skills/unified/power.svg',
  },
  range: {
    symbol: '◎',
    color: 0xc084fc,
    assetKey: 'skill-icon-range',
    assetPath: 'assets/icons/skills/unified/range.svg',
  },
}

export const CORE_SKILL_ICON_ASSETS = CORE_SKILL_ICON_IDS.map((id) => {
  const definition = CORE_SKILL_ICONS[id]
  return {
    key: definition.assetKey as string,
    path: definition.assetPath as string,
  }
})

export const SKILL_ICON_DEFINITIONS: Record<SkillIconId, SkillIconDefinition> = {
  wind: CORE_SKILL_ICONS.wind,
  water: CORE_SKILL_ICONS.water,
  fire: CORE_SKILL_ICONS.fire,
  earth: CORE_SKILL_ICONS.earth,
  damage: CORE_SKILL_ICONS.power,
  fireRate: CORE_SKILL_ICONS.speed,
  range: CORE_SKILL_ICONS.range,
  move: { symbol: '〰', color: 0x5eead4 },
  magnet: { symbol: '≋', color: 0x38bdf8 },
  hp: { symbol: '♥', color: 0xfb7185 },
  pierce: { symbol: '➤', color: 0x67e8f9 },
  blast: { symbol: '✸', color: 0xfbbf24 },
  // 氷属性が分かる水色（ワールド Orb・バナーと揃える）
  orbitingOrb: { symbol: '◉', color: 0x38bdf8 },
  ricochet: { symbol: '↯', color: 0xc084fc },
  xpBonus: { symbol: '❖', color: 0xf97316 },
}

export const SKILL_ICON_BASE_SIZE = 16
export const SKILL_ICON_BORDER_RATIO = 0.125
export const SKILL_ICON_SYMBOL_RATIO = 1.125
export const SKILL_ICON_GAP_RATIO = 0.3125
export const SKILL_ICON_SYMBOL_OFFSET_X_RATIO = 0
export const SKILL_ICON_SYMBOL_OFFSET_Y_RATIO = 0

export type SkillIconMetrics = {
  size: number
  border: number
  outerSize: number
  symbolFontSize: number
  gap: number
  symbolOffsetX: number
  symbolOffsetY: number
}

export function getSkillIconMetrics(scale: number): SkillIconMetrics {
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1
  const size = SKILL_ICON_BASE_SIZE * safeScale
  const border = Math.max(1, Math.round(size * SKILL_ICON_BORDER_RATIO))
  return {
    size,
    border,
    outerSize: size + border * 2,
    symbolFontSize: Math.round(size * SKILL_ICON_SYMBOL_RATIO),
    gap: Math.round(size * SKILL_ICON_GAP_RATIO),
    symbolOffsetX: size * SKILL_ICON_SYMBOL_OFFSET_X_RATIO,
    symbolOffsetY: size * SKILL_ICON_SYMBOL_OFFSET_Y_RATIO,
  }
}

export function getSkillIconDefinition(id: SkillIconId): SkillIconDefinition {
  return SKILL_ICON_DEFINITIONS[id]
}

/** 文字列がスキルアイコンIDなら true。 */
export function isSkillIconId(id: string): id is SkillIconId {
  return Object.prototype.hasOwnProperty.call(SKILL_ICON_DEFINITIONS, id)
}

// 既存import経路を保つ互換エイリアス。値の原本は上の定義だけ。
export const UNLOCK_ICON_POWER_COLOR = SKILL_ICON_DEFINITIONS.damage.color
export const UNLOCK_ICON_SPEED_COLOR = SKILL_ICON_DEFINITIONS.fireRate.color
export const UNLOCK_ICON_RANGE_COLOR = SKILL_ICON_DEFINITIONS.range.color
export const UNLOCK_ICON_MOVE_COLOR = SKILL_ICON_DEFINITIONS.move.color
export const UNLOCK_ICON_MAGNET_COLOR = SKILL_ICON_DEFINITIONS.magnet.color
export const UNLOCK_ICON_HP_COLOR = SKILL_ICON_DEFINITIONS.hp.color
export const UNLOCK_ICON_PIERCE_COLOR = SKILL_ICON_DEFINITIONS.pierce.color
export const UNLOCK_ICON_BLAST_COLOR = SKILL_ICON_DEFINITIONS.blast.color
export const UNLOCK_ICON_ORBITING_ORB_COLOR = SKILL_ICON_DEFINITIONS.orbitingOrb.color
export const UNLOCK_ICON_RICOCHET_COLOR = SKILL_ICON_DEFINITIONS.ricochet.color
export const UNLOCK_ICON_XP_BONUS_COLOR = SKILL_ICON_DEFINITIONS.xpBonus.color
export const UNLOCK_ICON_POWER_LETTER = SKILL_ICON_DEFINITIONS.damage.symbol
export const UNLOCK_ICON_SPEED_LETTER = SKILL_ICON_DEFINITIONS.fireRate.symbol
export const UNLOCK_ICON_RANGE_LETTER = SKILL_ICON_DEFINITIONS.range.symbol
export const UNLOCK_ICON_MOVE_LETTER = SKILL_ICON_DEFINITIONS.move.symbol
export const UNLOCK_ICON_MAGNET_LETTER = SKILL_ICON_DEFINITIONS.magnet.symbol
export const UNLOCK_ICON_HP_LETTER = SKILL_ICON_DEFINITIONS.hp.symbol
export const UNLOCK_ICON_PIERCE_LETTER = SKILL_ICON_DEFINITIONS.pierce.symbol
export const UNLOCK_ICON_BLAST_LETTER = SKILL_ICON_DEFINITIONS.blast.symbol
export const UNLOCK_ICON_ORBITING_ORB_LETTER = SKILL_ICON_DEFINITIONS.orbitingOrb.symbol
export const UNLOCK_ICON_RICOCHET_LETTER = SKILL_ICON_DEFINITIONS.ricochet.symbol
export const UNLOCK_ICON_XP_BONUS_LETTER = SKILL_ICON_DEFINITIONS.xpBonus.symbol
