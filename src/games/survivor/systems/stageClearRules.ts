/**
 * ステージクリア条件の純粋ヘルパー。
 * Version 1 の4エリア最終ステージはすべて defeat-boss（finalBossConfig SSoT）。
 * それ以外は従来どおり時間切れ or 全撃破。
 */
import { isFinalStage } from '../constants/areas'
import {
  getAreaFinalBossConfig,
  type FinalStageCompletionRule,
} from '../constants/finalBossConfig'

export type StageCompletionRule = 'survive-or-clear-all' | 'defeat-boss'

/**
 * エリア／ステージに応じたクリアルールを返す。
 * 最終ステージかつ finalBossConfig がある場合はその completionRule を使う。
 */
export function getStageCompletionRule(
  areaId: string,
  stageNumber: number,
  totalStages: number,
): StageCompletionRule {
  if (!isFinalStage(stageNumber, totalStages)) {
    return 'survive-or-clear-all'
  }

  const finalBoss = getAreaFinalBossConfig(areaId)
  if (finalBoss === null) {
    return 'survive-or-clear-all'
  }

  return mapFinalRuleToStageRule(finalBoss.completionRule)
}

function mapFinalRuleToStageRule(
  rule: FinalStageCompletionRule,
): StageCompletionRule {
  if (rule === 'defeat-boss') {
    return 'defeat-boss'
  }
  // Version 1 では survive / clear-wave は未使用。将来用にフォールバック。
  return 'survive-or-clear-all'
}

/**
 * クリア演出を始めてよいか。
 * defeat-boss: ボスが生存していなければクリア（タイマーや他敵は見ない）。
 * survive-or-clear-all: 時間切れ、または全ウェーブ終了かつ敵ゼロ。
 */
export function shouldBeginStageClear(params: {
  completionRule: StageCompletionRule
  bossAlive: boolean
  timeUp: boolean
  allEnemiesDefeated: boolean
}): boolean {
  if (params.completionRule === 'defeat-boss') {
    return !params.bossAlive
  }
  return params.timeUp || params.allEnemiesDefeated
}

/**
 * 敵グループに生存中のボス（isBoss）がいるか。
 * Phaser Group を渡さず、呼び出し側で判定結果を渡す場合もある。
 */
export function isActiveBossEnemy(enemy: {
  active: boolean
  getData: (key: string) => unknown
}): boolean {
  if (!enemy.active) {
    return false
  }
  if (enemy.getData('isDefeated') === true) {
    return false
  }
  return enemy.getData('isBoss') === true
}
