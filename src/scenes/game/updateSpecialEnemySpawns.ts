/**
 * 特殊敵の召喚更新とエリアボスの初回スポーン。
 * GameScene.update / beginStageWithCountdown から呼ぶ薄いまとめ役。
 */
import Phaser from 'phaser'
import {
  spawnForestStage5Gravestone,
  spawnVolcanoStage5ChaosElemental,
} from '../../objects/Enemy'
import {
  updateStumpMushroomSpawns,
  updateBurningTreeSpiritFireSpawns,
  updateBranchBeetleSpawns,
  updateGravestoneBeetleSpawns,
  updateChaosElementalSpawns,
} from '../../systems/EnemySummonSystem'

export type SpecialEnemySpawnContext = {
  scene: Phaser.Scene
  areaId: string
  stageNumber: number
  areaStageCount: number
  enemyGroup: Phaser.Physics.Arcade.Group
  nowMs: number
}

/**
 * 切り株・燃え木・枝・墓石・混沌エレメンタルなどの毎フレーム召喚更新。
 */
export function updateSpecialEnemySpawns(ctx: SpecialEnemySpawnContext): void {
  updateStumpMushroomSpawns(
    ctx.scene,
    ctx.enemyGroup,
    ctx.stageNumber,
    ctx.areaStageCount,
    ctx.nowMs,
  )
  updateBurningTreeSpiritFireSpawns(
    ctx.scene,
    ctx.enemyGroup,
    ctx.stageNumber,
    ctx.areaStageCount,
    ctx.nowMs,
  )
  updateBranchBeetleSpawns(
    ctx.scene,
    ctx.enemyGroup,
    ctx.stageNumber,
    ctx.areaStageCount,
    ctx.nowMs,
  )
  updateGravestoneBeetleSpawns(
    ctx.scene,
    ctx.enemyGroup,
    ctx.stageNumber,
    ctx.areaStageCount,
    ctx.nowMs,
  )
  updateChaosElementalSpawns(
    ctx.scene,
    ctx.enemyGroup,
    ctx.stageNumber,
    ctx.areaStageCount,
    ctx.nowMs,
  )
}

/**
 * エリアボス（Forest 墓石 / Volcano 混沌エレメンタル）を
 * Stage5 開始直後に1体だけ出す。条件外なら何もしない。
 */
export function spawnAreaBossIfNeeded(ctx: SpecialEnemySpawnContext): void {
  if (ctx.areaId === 'forest' && ctx.stageNumber === 5) {
    spawnForestStage5Gravestone(ctx.scene, ctx.enemyGroup)
    return
  }
  if (ctx.areaId === 'volcano' && ctx.stageNumber === 5) {
    spawnVolcanoStage5ChaosElemental(ctx.scene, ctx.enemyGroup)
  }
}
