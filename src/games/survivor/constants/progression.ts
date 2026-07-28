// constants/progression.ts
// XP・ショップ価格・スキル上限・実績ラベル

// 全商品とも初回は1G。購入するたびに 1G ずつ価格が上がる（1, 2, 3...）。
export const SHOP_BASE_PRICE = 1
export const SHOP_PRICE_INCREASE = 1
// Max HP は 1G → 10G → 20G → 30G → 40G（以降も 40G）
export const MAX_HP_SHOP_PRICES = [1, 10, 20, 30, 40] as const
// Power / Speed / Range / XP Bonus / Pierce Cap は 1G → 5G → 10G → 20G → 30G → 40G（以降も 40G）
export const SKILL_CAP_SHOP_PRICES = [1, 5, 10, 20, 30, 40] as const
// 封印枠は 10G → 20G → 30G → 40G... と購入ごとに10Gずつ上がる
export const SEAL_SLOT_BASE_PRICE = 10
export const SEAL_SLOT_PRICE_INCREASE = 10
// 次レベルに必要な XP: 4, 7, 11, 16, 22...
// 必要量の増加幅を 3, 4, 5, 6... と1ずつ増やす
export const XP_FIRST_LEVEL_UP_COST = 4
export const XP_FIRST_COST_INCREASE = 3
// 1回のレベルアップに必要なXPは、最終的に50で固定する
export const XP_MAX_LEVEL_UP_COST = 50

// --- 実績・スキル解放（localStorage）---
// ノーダメージ／エリアクリアなどで貫通・爆破などを解放。Unlock / Achievement 系が参照。
export const UNLOCK_SAVE_STORAGE_KEY = 'survivor-stage-unlocks'
export const ACHIEVEMENT_ID_UNTOUCHED = 'untouched'
export const ACHIEVEMENT_ID_PURE_POWER = 'pure_power'
export const ACHIEVEMENT_ID_PLAINS_CLEAR = 'plains_clear'
export const ACHIEVEMENT_ID_FOREST_CLEAR = 'forest_clear'
export const ACHIEVEMENT_ID_FOREST_UNTOUCHED = 'forest_untouched'
export const ACHIEVEMENT_ID_VOLCANO_CLEAR = 'volcano_clear'
export const ACHIEVEMENT_ID_VOLCANO_UNTOUCHED = 'volcano_untouched'
export const ACHIEVEMENT_ID_PIERCE_UNLOCK = 'pierce_unlock'
export const ACHIEVEMENT_ID_BLAST_UNLOCK = 'blast_unlock'
export const ACHIEVEMENT_ID_RICOCHET_UNLOCK = 'ricochet_unlock'
export const ACHIEVEMENT_ID_ORBITING_ORB_UNLOCK = 'orbiting_orb_unlock'
// 実績画面のスキル名（Unlock は付けない）
export const ACHIEVEMENT_TITLE_UNTOUCHED = 'Pierce'
export const ACHIEVEMENT_TITLE_PURE_POWER = 'Blast'
export const ACHIEVEMENT_TITLE_FOREST_CLEAR = 'Volcano'
export const ACHIEVEMENT_TITLE_MOVE = 'Move'
export const ACHIEVEMENT_TITLE_MAGNET = 'Pickup'
export const ACHIEVEMENT_TITLE_RICOCHET = 'Ricochet'
export const ACHIEVEMENT_TITLE_ORBITING_ORB = 'Orbiting Orb'
export const ACHIEVEMENT_TITLE_XP_BONUS = 'XP Bonus'
export const ACHIEVEMENT_CONDITION_UNTOUCHED = 'Clear Windy Plains with no damage'
export const ACHIEVEMENT_CONDITION_PURE_POWER =
  'Clear Windy Plains without upgrading Power'
export const ACHIEVEMENT_CONDITION_PLAINS_CLEAR = 'Clear Windy Plains'
export const ACHIEVEMENT_CONDITION_FOREST_CLEAR = 'Clear Water Forest'
export const ACHIEVEMENT_CONDITION_FOREST_UNTOUCHED = 'Clear Water Forest with no damage'
export const ACHIEVEMENT_CONDITION_VOLCANO_CLEAR = 'Clear Fire Volcano'
export const ACHIEVEMENT_CONDITION_VOLCANO_UNTOUCHED = 'Clear Fire Volcano with no damage'
export const ACHIEVEMENT_CONDITION_PIERCE =
  'Raise Move and Speed (Pierce = lower level - 1)'
export const ACHIEVEMENT_CONDITION_BLAST =
  'Raise Power and Range (Blast = lower level - 1)'
export const ACHIEVEMENT_CONDITION_RICOCHET =
  'Raise XP Bonus, Pickup and Speed (Ricochet = min of Pickup-1, Speed-1, XP Bonus)'
export const ACHIEVEMENT_CONDITION_ORBITING_ORB =
  'Raise Move and Pickup (Orbiting Orb = lower level - 1)'
export const ACHIEVEMENT_TITLE_VOLCANO_UNTOUCHED = 'Volcano Untouched'
export const UNLOCK_SKILL_LABEL_POWER = 'Power'
export const UNLOCK_SKILL_LABEL_SPEED = 'Speed'
export const UNLOCK_SKILL_LABEL_RANGE = 'Range'
export const UNLOCK_SKILL_LABEL_PIERCE = 'Pierce'
export const UNLOCK_SKILL_LABEL_BLAST = 'Blast'
export const UNLOCK_SKILL_LABEL_RICOCHET = 'Ricochet'
export const UNLOCK_SKILL_LABEL_ORBITING_ORB = 'Orbiting Orb'
export const UNLOCK_SKILL_LABEL_MOVE = 'Move'
// Vampire Survivors ではステータス名 Magnet / アイテム Attractorb。
// 説明文は "Pickup range" なので、表示名は分かりやすい Pickup にする
export const UNLOCK_SKILL_LABEL_MAGNET = 'Pickup'
export const UNLOCK_SKILL_LABEL_HP = 'HP'
export const UNLOCK_SKILL_LABEL_FOREST_REWARDS = 'Pickup'
export const UNLOCK_SKILL_LABEL_XP_BONUS = 'XP Bonus'
// スキルアイコン・実績画面用の短い効果説明（+1 や level-up は書かない）
export const UNLOCK_SKILL_DESC_POWER = 'Increases bullet damage'
export const UNLOCK_SKILL_DESC_SPEED = 'Increases fire speed'
export const UNLOCK_SKILL_DESC_RANGE = 'Increases fire range'
export const UNLOCK_SKILL_DESC_MOVE = 'Increases move speed'
export const UNLOCK_SKILL_DESC_MAGNET = 'Increases coin pickup range'
export const UNLOCK_SKILL_DESC_HP = 'Increases max HP'
export const UNLOCK_SKILL_DESC_XP_BONUS = 'Increases XP from coins'
export const UNLOCK_SKILL_DESC_PIERCE =
  'Move + Speed → Pierce (Pierce = lower level - 1)'
export const UNLOCK_SKILL_DESC_BLAST =
  'Power + Range → Blast (Blast = lower level - 1)'
export const UNLOCK_SKILL_DESC_RICOCHET =
  'XP Bonus + Pickup + Speed → Ricochet'
export const UNLOCK_SKILL_DESC_ORBITING_ORB =
  'Move + Pickup → Orbiting Orb (Orbiting Orb = lower level - 1)'
export const UNLOCK_CONDITION_TBD = 'Unlock condition: TBD'

// --- 経験値（累計 XP からレベル内の進捗を計算）---
// Lv2=4, Lv3=11, Lv4=22, Lv5=38... （必要量 4,7,11,16...、最大50の累計）

/**
 * 指定レベルに到達するまでに必要な累計 XP（閾値）。
 * level 1 → 0、level 2 → 4、など。
 */
export function getCumulativeXpForLevel(level: number): number {
  if (level <= 1) {
    return 0
  }

  const stepCount = level - 1
  let cumulativeXp = 0
  let nextLevelCost = XP_FIRST_LEVEL_UP_COST
  let costIncrease = XP_FIRST_COST_INCREASE

  for (let step = 0; step < stepCount; step++) {
    cumulativeXp = cumulativeXp + nextLevelCost
    // 上限到達後は、以降のレベルアップも毎回50 XPで固定する
    nextLevelCost = Math.min(
      nextLevelCost + costIncrease,
      XP_MAX_LEVEL_UP_COST,
    )
    costIncrease = costIncrease + 1
  }

  return cumulativeXp
}

/**
 * 現在レベル内での XP 進捗（バー表示用）。
 * currentInLevel = 今のレベル内で溜まった量 / neededForNext = 次レベルまでの必要量。
 */
export function getXpProgressForLevel(
  totalXp: number,
  currentLevel: number,
): { currentInLevel: number; neededForNext: number } {
  const currentThreshold = getCumulativeXpForLevel(currentLevel)
  const nextThreshold = getCumulativeXpForLevel(currentLevel + 1)
  return {
    currentInLevel: totalXp - currentThreshold,
    neededForNext: nextThreshold - currentThreshold,
  }
}

/**
 * 累計 XP から到達しているレベルを求める。
 * Python: while total_xp >= threshold(level+1): level += 1 に相当
 */
export function getLevelFromTotalXp(totalXp: number): number {
  let level = 1
  while (totalXp >= getCumulativeXpForLevel(level + 1)) {
    level = level + 1
  }
  return level
}
