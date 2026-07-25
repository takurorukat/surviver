// ============================================================
// LevelUpChoicePool.ts
// ------------------------------------------------------------
// レベルアップ候補プールの組み立て（UI / Phaser 非依存）。
// 封印・上限・未解放スキルを除外する。
// ============================================================

import { DAMAGE_BONUS_PER_LEVEL_UP } from '../GameConstants'
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

const LEVEL_UP_CHOICE_POOL: LevelUpChoice[] = [
  {
    id: 'damage',
    title: 'Power',
    description: `Fire Damage +${DAMAGE_BONUS_PER_LEVEL_UP}`,
  },
  {
    id: 'fireRate',
    title: 'Speed',
    description: 'Fire Speed +1',
  },
  {
    id: 'range',
    title: 'Range',
    description: 'Fire Range +1',
  },
  {
    id: 'move',
    title: 'Move',
    description: 'Move speed +1',
  },
  {
    id: 'magnet',
    title: 'Pickup',
    description: 'Coin pickup range +1',
  },
  // Pierce / Blast / Ricochet はレベルアップ選択肢に出さない（他スキルの組み合わせで同期）
  {
    id: 'xpBonus',
    title: 'XP Bonus',
    description: 'Raise XP drop multiplier',
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
 * Pierce / Blast / Ricochet はプール外（他スキル同期のみ）。
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
