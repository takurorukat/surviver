/**
 * 特殊敵の召喚更新とエリアボスの初回スポーン。
 * GameScene.update / beginStageWithCountdown から呼ぶ薄いまとめ役。
 */
import Phaser from 'phaser'
import {
  spawnForestStage5Gravestone,
  spawnVolcanoStage5ChaosElemental,
  spawnWindHiveBossEnemy,
  spawnEarthDungeonBossEnemy,
  getRandomInsideSpawnPosition,
} from '../../objects/Enemy'
import {
  updateStumpMushroomSpawns,
  updateBurningTreeSpiritFireSpawns,
  updateBranchBeetleSpawns,
  updateGravestoneBeetleSpawns,
  updateChaosElementalSpawns,
  updateWindHiveBossBeeSpawns,
  updateEarthDungeonBossMinionSpawns,
} from '../../systems/EnemySummonSystem'

export type SpecialEnemySpawnContext = {
  scene: Phaser.Scene
  areaId: string
  stageNumber: number
  areaStageCount: number
  enemyGroup: Phaser.Physics.Arcade.Group
  nowMs: number
  // Plains Stage3 ボス配置用。無い場合は中央付近へフォールバック
  getPlayerPosition?: () => { x: number; y: number }
}

/**
 * 切り株・燃え木・枝・墓石・混沌エレメンタル・竜巻ボスなどの毎フレーム召喚更新。
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
  updateWindHiveBossBeeSpawns(
    ctx.scene,
    ctx.enemyGroup,
    ctx.stageNumber,
    ctx.areaStageCount,
    ctx.nowMs,
  )
  const playerPosition =
    ctx.getPlayerPosition !== undefined
      ? ctx.getPlayerPosition()
      : { x: 0, y: 0 }
  updateEarthDungeonBossMinionSpawns(
    ctx.scene,
    ctx.enemyGroup,
    ctx.stageNumber,
    ctx.areaStageCount,
    ctx.nowMs,
    playerPosition.x,
    playerPosition.y,
  )
}

/**
 * エリアボスを Stage 開始直後に1体だけ出す。条件外なら何もしない。
 * Forest 墓石 / Volcano 混沌エレメンタル / Plains 竜巻ボス / Earth ゴーレム。
 */
export function spawnAreaBossIfNeeded(ctx: SpecialEnemySpawnContext): void {
  if (ctx.areaId === 'forest' && ctx.stageNumber === 5) {
    spawnForestStage5Gravestone(ctx.scene, ctx.enemyGroup)
    return
  }
  if (ctx.areaId === 'volcano' && ctx.stageNumber === 5) {
    spawnVolcanoStage5ChaosElemental(ctx.scene, ctx.enemyGroup)
    return
  }
  if (ctx.areaId === 'plains' && ctx.stageNumber === 3) {
    const playerPosition =
      ctx.getPlayerPosition !== undefined
        ? ctx.getPlayerPosition()
        : getRandomInsideSpawnPosition()
    const spawnPosition = getRandomInsideSpawnPosition(playerPosition)
    spawnWindHiveBossEnemy(
      ctx.scene,
      ctx.enemyGroup,
      spawnPosition.x,
      spawnPosition.y,
    )
    return
  }
  if (ctx.areaId === 'ruins' && ctx.stageNumber === 5) {
    const playerPosition =
      ctx.getPlayerPosition !== undefined
        ? ctx.getPlayerPosition()
        : getRandomInsideSpawnPosition()
    const spawnPosition = getRandomInsideSpawnPosition(playerPosition)
    spawnEarthDungeonBossEnemy(
      ctx.scene,
      ctx.enemyGroup,
      spawnPosition.x,
      spawnPosition.y,
    )
  }
}
