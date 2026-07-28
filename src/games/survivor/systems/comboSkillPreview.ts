/**
 * 複合スキル予告（Phaser 非依存）。
 * レベルアップカードの「この選択で付く複合」表示とテストから共有する。
 */
import {
  BLAST_LEVEL_START,
  BLAST_UNLOCK_BANNER_SUBTITLE,
  DAMAGE_BONUS_PER_LEVEL_UP,
  ORBITING_ORB_LEVEL_START,
  ORBITING_ORB_UNLOCK_BANNER_SUBTITLE,
  PIERCE_UNLOCK_BANNER_SUBTITLE,
  RICOCHET_LEVEL_START,
  RICOCHET_UNLOCK_BANNER_SUBTITLE,
  UNLOCK_SKILL_LABEL_BLAST,
  UNLOCK_SKILL_LABEL_ORBITING_ORB,
  UNLOCK_SKILL_LABEL_PIERCE,
  UNLOCK_SKILL_LABEL_RICOCHET,
  calculateBlastLevelFromPowerAndRange,
  calculateOrbitingOrbLevelFromMoveAndPickup,
  calculatePierceLevelFromMoveAndSpeed,
  calculateRicochetLevelFromXpBonusPickupAndSpeed,
  type SkillIconId,
} from '../GameConstants'
import type { LevelUpChoiceId } from './LevelUpChoicePool'

export type LevelUpComboPreviewStats = {
  attackDamage: number
  fireRateLevel: number
  rangeLevel: number
  moveLevel: number
  magnetLevel: number
  pierceLevel: number
  blastLevel: number
  orbitingOrbLevel: number
  ricochetLevel: number
  xpBonusLevel: number
}

export type ComboBonusPreview = {
  skillId: SkillIconId
  skillName: string
  description: string
}

function previewBaseLevelsAfterChoice(
  choiceId: LevelUpChoiceId,
  stats: LevelUpComboPreviewStats,
): {
  power: number
  speed: number
  range: number
  move: number
  magnet: number
  xpBonus: number
} {
  let power = stats.attackDamage
  let speed = stats.fireRateLevel
  let range = stats.rangeLevel
  let move = stats.moveLevel
  let magnet = stats.magnetLevel
  let xpBonus = stats.xpBonusLevel

  if (choiceId === 'damage') {
    power = power + DAMAGE_BONUS_PER_LEVEL_UP
  }
  if (choiceId === 'fireRate') {
    speed = speed + 1
  }
  if (choiceId === 'range') {
    range = range + 1
  }
  if (choiceId === 'move') {
    move = move + 1
  }
  if (choiceId === 'magnet') {
    magnet = magnet + 1
  }
  if (choiceId === 'xpBonus') {
    xpBonus = xpBonus + 1
  }

  return { power, speed, range, move, magnet, xpBonus }
}

/**
 * 選択肢を取ると複合スキルが付く／上がるときの予告一覧。
 */
export function getComboBonusPreviewsForChoice(
  choiceId: LevelUpChoiceId,
  stats: LevelUpComboPreviewStats,
): ComboBonusPreview[] {
  if (
    choiceId !== 'damage' &&
    choiceId !== 'fireRate' &&
    choiceId !== 'range' &&
    choiceId !== 'move' &&
    choiceId !== 'magnet' &&
    choiceId !== 'xpBonus'
  ) {
    return []
  }

  const next = previewBaseLevelsAfterChoice(choiceId, stats)
  const previews: ComboBonusPreview[] = []

  if (choiceId === 'move' || choiceId === 'fireRate') {
    const pierceTarget = calculatePierceLevelFromMoveAndSpeed(next.move, next.speed)
    if (pierceTarget > stats.pierceLevel) {
      previews.push({
        skillId: 'pierce',
        skillName: UNLOCK_SKILL_LABEL_PIERCE,
        description: PIERCE_UNLOCK_BANNER_SUBTITLE,
      })
    }
  }

  if (choiceId === 'damage' || choiceId === 'range') {
    const blastTarget = calculateBlastLevelFromPowerAndRange(next.power, next.range)
    if (blastTarget > stats.blastLevel && blastTarget > BLAST_LEVEL_START) {
      previews.push({
        skillId: 'blast',
        skillName: UNLOCK_SKILL_LABEL_BLAST,
        description: BLAST_UNLOCK_BANNER_SUBTITLE,
      })
    }
  }

  if (choiceId === 'move' || choiceId === 'magnet') {
    const orbitingOrbTarget = calculateOrbitingOrbLevelFromMoveAndPickup(
      next.move,
      next.magnet,
    )
    if (
      orbitingOrbTarget > stats.orbitingOrbLevel &&
      orbitingOrbTarget > ORBITING_ORB_LEVEL_START
    ) {
      previews.push({
        skillId: 'orbitingOrb',
        skillName: UNLOCK_SKILL_LABEL_ORBITING_ORB,
        description: ORBITING_ORB_UNLOCK_BANNER_SUBTITLE,
      })
    }
  }

  if (choiceId === 'xpBonus' || choiceId === 'magnet' || choiceId === 'fireRate') {
    const ricochetTarget = calculateRicochetLevelFromXpBonusPickupAndSpeed(
      next.xpBonus,
      next.magnet,
      next.speed,
    )
    if (ricochetTarget > stats.ricochetLevel && ricochetTarget > RICOCHET_LEVEL_START) {
      previews.push({
        skillId: 'ricochet',
        skillName: UNLOCK_SKILL_LABEL_RICOCHET,
        description: RICOCHET_UNLOCK_BANNER_SUBTITLE,
      })
    }
  }

  return previews
}
