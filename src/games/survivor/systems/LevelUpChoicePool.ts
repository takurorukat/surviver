// ============================================================
// LevelUpChoicePool.ts
// ------------------------------------------------------------
// レベルアップ候補プールの組み立て（UI / Phaser 非依存）。
// 封印・上限・未解放スキルを除外する。
// ============================================================

import {
  COIN_MAGNET_RADIUS_BONUS_PER_LEVEL,
  DAMAGE_BONUS_PER_LEVEL_UP,
  MOVE_SPEED_MULTIPLIER_STEP,
  UNLOCK_SKILL_LABEL_MAGNET,
  UNLOCK_SKILL_LABEL_MOVE,
  UNLOCK_SKILL_LABEL_POWER,
  UNLOCK_SKILL_LABEL_RANGE,
  UNLOCK_SKILL_LABEL_SPEED,
  UNLOCK_SKILL_LABEL_XP_BONUS,
} from '../GameConstants'
import { isSkillUnlocked } from './AchievementSystem'
import { getSealedSkillIds } from './UnlockSaveSystem'

export type LevelUpChoiceId =
  | 'damage'
  | 'fireRate'
  | 'range'
  | 'move'
  | 'magnet'
  | 'pierce'
  | 'blast'
  | 'ricochet'
  | 'xpBonus'
  | 'gold'

export type LevelUpChoice = {
  id: LevelUpChoiceId
  title: string
  description: string
}

const MOVE_SPEED_BONUS_PERCENT = Math.round(MOVE_SPEED_MULTIPLIER_STEP * 100)

const LEVEL_UP_CHOICE_POOL: LevelUpChoice[] = [
  {
    id: 'damage',
    title: UNLOCK_SKILL_LABEL_POWER,
    description: `Damage +${DAMAGE_BONUS_PER_LEVEL_UP}`,
  },
  {
    id: 'fireRate',
    title: UNLOCK_SKILL_LABEL_SPEED,
    description: 'Attack Speed +1',
  },
  {
    id: 'range',
    title: UNLOCK_SKILL_LABEL_RANGE,
    description: 'Attack Range +1',
  },
  {
    id: 'move',
    title: UNLOCK_SKILL_LABEL_MOVE,
    description: `Movement Speed +${MOVE_SPEED_BONUS_PERCENT}%`,
  },
  {
    id: 'magnet',
    title: UNLOCK_SKILL_LABEL_MAGNET,
    description: `Pickup Radius +${COIN_MAGNET_RADIUS_BONUS_PER_LEVEL}px`,
  },
  // Pierce / Blast / Orbiting Orb / Ricochet はレベルアップ選択肢に出さない（他スキルの組み合わせで同期）
  {
    id: 'xpBonus',
    title: UNLOCK_SKILL_LABEL_XP_BONUS,
    description: 'Experience Gain up',
  },
]

/** 上限などで通常候補が1つも残らない場合だけ使う。通常プールには入れない。 */
export const GOLD_FALLBACK_CHOICE: LevelUpChoice = {
  id: 'gold',
  title: 'Gold',
  description: 'Gain 1 Gold',
}

/**
 * 解放済みスキルだけ候補に入れる。
 * Pierce / Blast / Orbiting Orb / Ricochet はプール外（他スキル同期のみ）。
 */
export function buildAvailableLevelUpChoicePool(
  maxedChoiceIds: LevelUpChoiceId[] = [],
): LevelUpChoice[] {
  const available: LevelUpChoice[] = []
  const sealedSkillIds = getSealedSkillIds()

  for (let index = 0; index < LEVEL_UP_CHOICE_POOL.length; index++) {
    const choice = LEVEL_UP_CHOICE_POOL[index]
    if (sealedSkillIds.includes(choice.id)) {
      continue
    }
    if (maxedChoiceIds.includes(choice.id)) {
      continue
    }
    if (choice.id === 'move' && !isSkillUnlocked('move')) {
      continue
    }
    if (choice.id === 'magnet' && !isSkillUnlocked('magnet')) {
      continue
    }
    if (choice.id === 'xpBonus' && !isSkillUnlocked('xpBonus')) {
      continue
    }
    available.push(choice)
  }

  return available
}

/**
 * 通常の強化候補が1つも残っていないか（このときだけゴールド自動付与）。
 * Python: len(build_available(...)) == 0 に相当
 */
export function hasNoNormalLevelUpChoices(
  maxedChoiceIds: LevelUpChoiceId[] = [],
): boolean {
  return buildAvailableLevelUpChoicePool(maxedChoiceIds).length === 0
}
