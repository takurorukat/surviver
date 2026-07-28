/**
 * Version 1 の4エリア最終ボスとクリア条件の SSoT。
 * Stage 番号・ボス ID・completionRule をここに集約し、
 * GameScene / Wave / Clear へ重複ハードコードしない。
 */
import {
  getAreaStageCount,
  isFinalStage,
  type StageAreaId,
} from './areas'

/** 最終ステージ用の明示クリアルール（仕様の推奨型）。 */
export type FinalStageCompletionRule = 'defeat-boss' | 'survive' | 'clear-wave'

export type AreaFinalBossConfig = {
  areaId: StageAreaId
  /** enemyKind 文字列（objects/enemy/types の EnemyKind と一致） */
  finalBossEnemyId: string
  completionRule: FinalStageCompletionRule
}

/**
 * Version 1 で遊べる4エリアの最終ボス定義。
 * finalStage は各エリアの stageCount（getFinalStageNumberForArea）を使う。
 */
export const VERSION1_AREA_FINAL_BOSSES: readonly AreaFinalBossConfig[] = [
  {
    areaId: 'plains',
    finalBossEnemyId: 'windHiveBoss',
    completionRule: 'defeat-boss',
  },
  {
    areaId: 'forest',
    finalBossEnemyId: 'gravestone',
    completionRule: 'defeat-boss',
  },
  {
    areaId: 'volcano',
    finalBossEnemyId: 'chaosElemental',
    completionRule: 'defeat-boss',
  },
  {
    areaId: 'ruins',
    finalBossEnemyId: 'earthDungeonBoss',
    completionRule: 'defeat-boss',
  },
] as const

/**
 * エリアの最終ステージ番号（= stageCount）。不明なら 0。
 */
export function getFinalStageNumberForArea(areaId: string): number {
  return getAreaStageCount(areaId)
}

/**
 * エリアの最終ボス設定。未定義エリアは null。
 */
export function getAreaFinalBossConfig(areaId: string): AreaFinalBossConfig | null {
  for (let index = 0; index < VERSION1_AREA_FINAL_BOSSES.length; index++) {
    const entry = VERSION1_AREA_FINAL_BOSSES[index]
    if (entry.areaId === areaId) {
      return entry
    }
  }
  return null
}

/**
 * いまのステージが「最終ボスを出す」条件か。
 */
export function shouldSpawnAreaFinalBoss(
  areaId: string,
  stageNumber: number,
  totalStages: number,
): boolean {
  if (!isFinalStage(stageNumber, totalStages)) {
    return false
  }
  return getAreaFinalBossConfig(areaId) !== null
}

/**
 * 最終ステージで出現させるボス enemyKind。条件外は null。
 */
export function getFinalBossEnemyIdForStage(
  areaId: string,
  stageNumber: number,
  totalStages: number,
): string | null {
  if (!shouldSpawnAreaFinalBoss(areaId, stageNumber, totalStages)) {
    return null
  }
  const config = getAreaFinalBossConfig(areaId)
  if (config === null) {
    return null
  }
  return config.finalBossEnemyId
}
