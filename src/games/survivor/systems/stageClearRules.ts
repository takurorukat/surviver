/**
 * ステージクリア条件の純粋ヘルパー。
 * Plains Stage3 はボス撃破のみ。他は従来どおり時間切れ or 全撃破。
 */
import { isFinalStage, type StageAreaId } from '../constants/areas'

export type StageCompletionRule = 'survive-or-clear-all' | 'defeat-boss'

/**
 * エリア／ステージに応じたクリアルールを返す。
 */
export function getStageCompletionRule(
  areaId: StageAreaId | string,
  stageNumber: number,
  totalStages: number,
): StageCompletionRule {
  if (areaId === 'plains' && isFinalStage(stageNumber, totalStages)) {
    return 'defeat-boss'
  }
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
