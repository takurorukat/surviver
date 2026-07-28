/**
 * Survivor のスキルアイコン原本。
 *
 * 全UIはこの記号・色と基準寸法を倍率だけ変えて使用する。
 */
export type SkillIconId =
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
}

export const SKILL_ICON_DEFINITIONS: Record<SkillIconId, SkillIconDefinition> = {
  damage: { symbol: '⚔', color: 0xef4444 },
  fireRate: { symbol: '⚡', color: 0xf97316 },
  range: { symbol: '◎', color: 0x3b82f6 },
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
