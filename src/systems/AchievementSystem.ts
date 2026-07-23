// ============================================================
// AchievementSystem.ts
// ------------------------------------------------------------
// 実績（アチーブメント）と、それに紐づくスキル解放の判定。
//
// 役割:
//   - 貫通弾 / 範囲爆破が解放済みかを返す
//   - ゲームクリア時に条件を見て新規実績を解放する
//   - 結果画面用の短い文言を作る
//
// 呼び出し元:
//   - GameScene.ts … ゲームクリア時に evaluateAndUnlockGameClearAchievements
//   - LevelUpChoiceSystem.ts … 選択肢に出す前に isSkillUnlocked
//   - HudSystem.ts … 右カラムの LOCKED / 解放表示に getUnlockStatusRows
//
// 関連ファイル:
//   - UnlockSaveSystem.ts … localStorage への読み書き
//   - GameConstants.ts … 実績 ID・タイトル・条件文の定数
// ============================================================

import {
  ACHIEVEMENT_ID_PLAINS_CLEAR,
  ACHIEVEMENT_ID_FOREST_CLEAR,
  ACHIEVEMENT_ID_VOLCANO_CLEAR,
  ACHIEVEMENT_ID_VOLCANO_UNTOUCHED,
  ACHIEVEMENT_ID_PIERCE_UNLOCK,
  ACHIEVEMENT_ID_BLAST_UNLOCK,
  ACHIEVEMENT_ID_RICOCHET_UNLOCK,
  ACHIEVEMENT_TITLE_UNTOUCHED,
  ACHIEVEMENT_TITLE_PURE_POWER,
  ACHIEVEMENT_TITLE_FOREST_CLEAR,
  ACHIEVEMENT_TITLE_MOVE,
  ACHIEVEMENT_TITLE_MAGNET,
  ACHIEVEMENT_TITLE_RICOCHET,
  ACHIEVEMENT_TITLE_XP_BONUS,
  ACHIEVEMENT_TITLE_VOLCANO_UNTOUCHED,
  ACHIEVEMENT_CONDITION_PLAINS_CLEAR,
  ACHIEVEMENT_CONDITION_FOREST_CLEAR,
  ACHIEVEMENT_CONDITION_VOLCANO_CLEAR,
  ACHIEVEMENT_CONDITION_VOLCANO_UNTOUCHED,
  ACHIEVEMENT_CONDITION_PIERCE,
  ACHIEVEMENT_CONDITION_BLAST,
  ACHIEVEMENT_CONDITION_RICOCHET,
  UNLOCK_SKILL_LABEL_POWER,
  UNLOCK_SKILL_LABEL_SPEED,
  UNLOCK_SKILL_LABEL_RANGE,
  UNLOCK_SKILL_LABEL_PIERCE,
  UNLOCK_SKILL_LABEL_BLAST,
  UNLOCK_SKILL_LABEL_RICOCHET,
  UNLOCK_SKILL_LABEL_MOVE,
  UNLOCK_SKILL_LABEL_MAGNET,
  UNLOCK_SKILL_LABEL_FOREST_REWARDS,
  UNLOCK_SKILL_LABEL_XP_BONUS,
  UNLOCK_SKILL_DESC_POWER,
  UNLOCK_SKILL_DESC_SPEED,
  UNLOCK_SKILL_DESC_RANGE,
  UNLOCK_SKILL_DESC_MOVE,
  UNLOCK_SKILL_DESC_MAGNET,
  UNLOCK_SKILL_DESC_XP_BONUS,
  UNLOCK_SKILL_DESC_PIERCE,
  UNLOCK_SKILL_DESC_BLAST,
  UNLOCK_SKILL_DESC_RICOCHET,
  AREA_UNLOCK_NOTIFICATION_REASON,
  SKILL_UNLOCK_NOTIFICATION_REASON,
  SHOP_UNLOCK_NOTIFICATION_LABEL,
  SHOP_UNLOCK_NOTIFICATION_REASON,
  getAreasUnlockedByClearing,
} from '../GameConstants'
import { hasUnlockedAchievement, unlockAchievement } from './UnlockSaveSystem'

// 実績の定義一覧（進捗カウント・一覧表示で共通）
// skillId があるものは、実績画面でバトル画面と同じスキルアイコンを添える
export type AchievementDef = {
  id: string
  title: string
  condition: string
  rewardLabel: string
  skillId?: UnlockableSkillId
}

export const ALL_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: ACHIEVEMENT_ID_PLAINS_CLEAR,
    title: ACHIEVEMENT_TITLE_MOVE,
    condition: ACHIEVEMENT_CONDITION_PLAINS_CLEAR,
    rewardLabel: UNLOCK_SKILL_LABEL_MOVE,
    skillId: 'move',
  },
  {
    id: ACHIEVEMENT_ID_BLAST_UNLOCK,
    title: ACHIEVEMENT_TITLE_PURE_POWER,
    condition: ACHIEVEMENT_CONDITION_BLAST,
    rewardLabel: UNLOCK_SKILL_LABEL_BLAST,
    skillId: 'blast',
  },
  {
    id: ACHIEVEMENT_ID_FOREST_CLEAR,
    title: ACHIEVEMENT_TITLE_MAGNET,
    condition: ACHIEVEMENT_CONDITION_FOREST_CLEAR,
    rewardLabel: UNLOCK_SKILL_LABEL_MAGNET,
    skillId: 'magnet',
  },
  {
    id: ACHIEVEMENT_ID_PIERCE_UNLOCK,
    title: ACHIEVEMENT_TITLE_UNTOUCHED,
    condition: ACHIEVEMENT_CONDITION_PIERCE,
    rewardLabel: UNLOCK_SKILL_LABEL_PIERCE,
    skillId: 'pierce',
  },
  {
    id: ACHIEVEMENT_ID_VOLCANO_CLEAR,
    title: ACHIEVEMENT_TITLE_XP_BONUS,
    condition: ACHIEVEMENT_CONDITION_VOLCANO_CLEAR,
    rewardLabel: UNLOCK_SKILL_LABEL_XP_BONUS,
    skillId: 'xpBonus',
  },
  {
    id: ACHIEVEMENT_ID_RICOCHET_UNLOCK,
    title: ACHIEVEMENT_TITLE_RICOCHET,
    condition: ACHIEVEMENT_CONDITION_RICOCHET,
    rewardLabel: UNLOCK_SKILL_LABEL_RICOCHET,
    skillId: 'ricochet',
  },
  {
    id: ACHIEVEMENT_ID_VOLCANO_UNTOUCHED,
    title: ACHIEVEMENT_TITLE_VOLCANO_UNTOUCHED,
    condition: ACHIEVEMENT_CONDITION_VOLCANO_UNTOUCHED,
    rewardLabel: ACHIEVEMENT_TITLE_VOLCANO_UNTOUCHED,
  },
]

export type AchievementProgress = {
  unlockedCount: number
  totalCount: number
}

/** 実績の達成数 / 総数を返す */
export function getAchievementProgress(): AchievementProgress {
  let unlockedCount = 0
  for (let index = 0; index < ALL_ACHIEVEMENTS.length; index++) {
    if (hasUnlockedAchievement(ALL_ACHIEVEMENTS[index].id)) {
      unlockedCount = unlockedCount + 1
    }
  }
  return {
    unlockedCount,
    totalCount: ALL_ACHIEVEMENTS.length,
  }
}

// 実績で解放できるスキル ID（レベルアップ選択肢・HUD と共通）
export type UnlockableSkillId =
  | 'move'
  | 'magnet'
  | 'pierce'
  | 'blast'
  | 'ricochet'
  | 'xpBonus'

// 最初から使える基本スキル（シール対象にもなる）
export type StartingSkillId = 'damage' | 'fireRate' | 'range'

// HUD の SKILLS 一覧に出す全スキル
export type SkillHudId = StartingSkillId | UnlockableSkillId

// ゲームクリア時に見るラン全体のフラグ
// GameScene がプレイ中に記録し、クリア時に渡す
export type GameClearAchievementFlags = {
  areaId: string
  tookDamageThisRun: boolean
  // Power（ダメージ）を1度でも上げたか
  pickedPowerThisRun: boolean
}

// 今回のクリアで「新規に」解放された実績1件分
// StageResultSystem の unlockLines 作成に使う
export type NewlyUnlockedAchievement = {
  achievementId: string
  achievementTitle: string
  unlockedSkillLabel: string
}

// HUD 右カラム用: スキル1行分の表示データ
export type UnlockStatusRow = {
  skillId: SkillHudId
  skillLabel: string
  skillDescription: string
  isUnlocked: boolean
  unlockCondition: string
}

/**
 * スキルが実績で解放済みか調べる。
 * Python: skill_id in unlocked_skills のような判定。
 * LevelUpChoiceSystem / HudSystem から呼ばれる。
 * 基本スキル（Power / Speed / Range）は常に true。
 */
export function isSkillUnlocked(skillId: SkillHudId): boolean {
  if (skillId === 'damage' || skillId === 'fireRate' || skillId === 'range') {
    return true
  }
  // Move は Plains クリアで解放する
  if (skillId === 'move') {
    return hasUnlockedAchievement(ACHIEVEMENT_ID_PLAINS_CLEAR)
  }
  // Pickup は Forest クリアで解放する
  if (skillId === 'magnet') {
    return hasUnlockedAchievement(ACHIEVEMENT_ID_FOREST_CLEAR)
  }
  if (skillId === 'ricochet') {
    return hasUnlockedAchievement(ACHIEVEMENT_ID_RICOCHET_UNLOCK)
  }
  if (skillId === 'pierce') {
    return hasUnlockedAchievement(ACHIEVEMENT_ID_PIERCE_UNLOCK)
  }
  if (skillId === 'blast') {
    return hasUnlockedAchievement(ACHIEVEMENT_ID_BLAST_UNLOCK)
  }
  if (skillId === 'xpBonus') {
    return hasUnlockedAchievement(ACHIEVEMENT_ID_VOLCANO_CLEAR)
  }
  return false
}

/**
 * HUD 用: ロック／解放／シール状態を見る一覧を返す。
 * 先頭に最初から使える Power / Speed / Range を置く。
 */
export function getUnlockStatusRows(): UnlockStatusRow[] {
  return [
    {
      skillId: 'damage',
      skillLabel: UNLOCK_SKILL_LABEL_POWER,
      skillDescription: UNLOCK_SKILL_DESC_POWER,
      isUnlocked: true,
      unlockCondition: '',
    },
    {
      skillId: 'fireRate',
      skillLabel: UNLOCK_SKILL_LABEL_SPEED,
      skillDescription: UNLOCK_SKILL_DESC_SPEED,
      isUnlocked: true,
      unlockCondition: '',
    },
    {
      skillId: 'range',
      skillLabel: UNLOCK_SKILL_LABEL_RANGE,
      skillDescription: UNLOCK_SKILL_DESC_RANGE,
      isUnlocked: true,
      unlockCondition: '',
    },
    {
      skillId: 'move',
      skillLabel: UNLOCK_SKILL_LABEL_MOVE,
      skillDescription: UNLOCK_SKILL_DESC_MOVE,
      isUnlocked: isSkillUnlocked('move'),
      unlockCondition: ACHIEVEMENT_CONDITION_PLAINS_CLEAR,
    },
    {
      skillId: 'magnet',
      skillLabel: UNLOCK_SKILL_LABEL_MAGNET,
      skillDescription: UNLOCK_SKILL_DESC_MAGNET,
      isUnlocked: isSkillUnlocked('magnet'),
      unlockCondition: ACHIEVEMENT_CONDITION_FOREST_CLEAR,
    },
    {
      skillId: 'xpBonus',
      skillLabel: UNLOCK_SKILL_LABEL_XP_BONUS,
      skillDescription: UNLOCK_SKILL_DESC_XP_BONUS,
      isUnlocked: isSkillUnlocked('xpBonus'),
      unlockCondition: ACHIEVEMENT_CONDITION_VOLCANO_CLEAR,
    },
    {
      skillId: 'pierce',
      skillLabel: UNLOCK_SKILL_LABEL_PIERCE,
      skillDescription: UNLOCK_SKILL_DESC_PIERCE,
      isUnlocked: isSkillUnlocked('pierce'),
      unlockCondition: ACHIEVEMENT_CONDITION_PIERCE,
    },
    {
      skillId: 'blast',
      skillLabel: UNLOCK_SKILL_LABEL_BLAST,
      skillDescription: UNLOCK_SKILL_DESC_BLAST,
      isUnlocked: isSkillUnlocked('blast'),
      unlockCondition: ACHIEVEMENT_CONDITION_BLAST,
    },
    {
      skillId: 'ricochet',
      skillLabel: UNLOCK_SKILL_LABEL_RICOCHET,
      skillDescription: UNLOCK_SKILL_DESC_RICOCHET,
      isUnlocked: isSkillUnlocked('ricochet'),
      unlockCondition: ACHIEVEMENT_CONDITION_RICOCHET,
    },
  ]
}

/**
 * ゲームクリア時だけ条件を見て、新規実績があれば解放する。
 * 戻り値は「今回初めて解放されたもの」だけ（既解放は含めない）。
 * 呼び出し元: GameScene のゲームクリア処理。
 */
export function evaluateAndUnlockGameClearAchievements(
  flags: GameClearAchievementFlags,
): NewlyUnlockedAchievement[] {
  const newlyUnlocked: NewlyUnlockedAchievement[] = []

  // Plains をクリア → Move
  if (flags.areaId === 'plains') {
    const didUnlock = unlockAchievement(ACHIEVEMENT_ID_PLAINS_CLEAR)
    if (didUnlock) {
      newlyUnlocked.push({
        achievementId: ACHIEVEMENT_ID_PLAINS_CLEAR,
        achievementTitle: ACHIEVEMENT_TITLE_MOVE,
        // Move 解放 + Power/Speed 上限 3→5（バランス確認用）
        unlockedSkillLabel: 'Move · Power/Speed Cap 5',
      })
    }
  }

  // Forest をゲームクリア → Pickup
  if (flags.areaId === 'forest') {
    const didUnlock = unlockAchievement(ACHIEVEMENT_ID_FOREST_CLEAR)
    if (didUnlock) {
      newlyUnlocked.push({
        achievementId: ACHIEVEMENT_ID_FOREST_CLEAR,
        achievementTitle: ACHIEVEMENT_TITLE_FOREST_CLEAR,
        unlockedSkillLabel: UNLOCK_SKILL_LABEL_FOREST_REWARDS,
      })
    }
  }

  // Volcano をゲームクリア → XP Bonus
  if (flags.areaId === 'volcano') {
    const didUnlock = unlockAchievement(ACHIEVEMENT_ID_VOLCANO_CLEAR)
    if (didUnlock) {
      newlyUnlocked.push({
        achievementId: ACHIEVEMENT_ID_VOLCANO_CLEAR,
        achievementTitle: ACHIEVEMENT_TITLE_XP_BONUS,
        unlockedSkillLabel: UNLOCK_SKILL_LABEL_XP_BONUS,
      })
    }
  }

  // Volcano をノーダメージでゲームクリア（スキル解放なし・実績のみ）
  if (flags.areaId === 'volcano' && !flags.tookDamageThisRun) {
    const didUnlock = unlockAchievement(ACHIEVEMENT_ID_VOLCANO_UNTOUCHED)
    if (didUnlock) {
      newlyUnlocked.push({
        achievementId: ACHIEVEMENT_ID_VOLCANO_UNTOUCHED,
        achievementTitle: ACHIEVEMENT_TITLE_VOLCANO_UNTOUCHED,
        unlockedSkillLabel: ACHIEVEMENT_TITLE_VOLCANO_UNTOUCHED,
      })
    }
  }

  return newlyUnlocked
}

/**
 * 結果画面用の短い文言を作る。
 * 例: ["UNLOCKED: Pierce", "(New Skill)"]
 * ※ 括弧内は実績名にしない（Unlock Pierce だと上と重複するため）
 */
export function formatUnlockNotificationLines(
  newlyUnlocked: NewlyUnlockedAchievement[],
): string[] {
  const lines: string[] = []
  for (let index = 0; index < newlyUnlocked.length; index++) {
    const item = newlyUnlocked[index]
    lines.push(`UNLOCKED: ${item.unlockedSkillLabel}`)
    lines.push(`(${SKILL_UNLOCK_NOTIFICATION_REASON})`)
  }
  return lines
}

/**
 * エリアを初めてクリアしたときに、次エリア解放の文言を作る。
 * 例: Plains 初クリア → ["UNLOCKED: Forest", "(New Area)"]
 * 2回目以降のクリアでは空（呼び出し側で markAreaCleared が false のとき呼ばない）。
 */
export function formatAreaUnlockNotificationLines(clearedAreaId: string): string[] {
  const unlockedAreas = getAreasUnlockedByClearing(clearedAreaId)
  const lines: string[] = []
  for (let index = 0; index < unlockedAreas.length; index++) {
    lines.push(`UNLOCKED: ${unlockedAreas[index].name}`)
    lines.push(`(${AREA_UNLOCK_NOTIFICATION_REASON})`)
  }
  return lines
}

/**
 * 初めてゴールドを得て Shop が開いたときの文言。
 * 例: ["UNLOCKED: Shop", "(Earn Gold)"]
 */
export function formatShopUnlockNotificationLines(): string[] {
  return [
    `UNLOCKED: ${SHOP_UNLOCK_NOTIFICATION_LABEL}`,
    `(${SHOP_UNLOCK_NOTIFICATION_REASON})`,
  ]
}
