/**
 * 特殊敵の召喚更新とエリア最終ボスの初回スポーン。
 * GameScene.update / beginStageWithCountdown から呼ぶ薄いまとめ役。
 * 最終ボスの Stage／ID は finalBossConfig SSoT を参照する。
 */
import Phaser from 'phaser'
import { getFinalBossEnemyIdForStage } from '../../constants/finalBossConfig'
import {
  spawnGravestoneEnemy,
  spawnChaosElementalEnemy,
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
  // ボス配置用。無い場合は中央付近へフォールバック
  getPlayerPosition?: () => { x: number; y: number }
}

/**
 * 切り株・燃え木・枝・墓石・混沌エレメンタル・各最終ボスなどの毎フレーム召喚更新。
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

  const playerPosition =
    ctx.getPlayerPosition !== undefined
      ? ctx.getPlayerPosition()
      : { x: 0, y: 0 }

  updateWindHiveBossBeeSpawns(
    ctx.scene,
    ctx.enemyGroup,
    ctx.stageNumber,
    ctx.areaStageCount,
    ctx.nowMs,
    playerPosition.x,
    playerPosition.y,
  )
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
 * エリア最終ボスを Stage 開始直後に1体だけ出す。条件外なら何もしない。
 * 出現判定は finalBossConfig（エリア最終ステージ＋ボス ID）に従う。
 */
export function spawnAreaBossIfNeeded(ctx: SpecialEnemySpawnContext): void {
  const bossEnemyId = getFinalBossEnemyIdForStage(
    ctx.areaId,
    ctx.stageNumber,
    ctx.areaStageCount,
  )
  if (bossEnemyId === null) {
    return
  }

  const playerPosition =
    ctx.getPlayerPosition !== undefined
      ? ctx.getPlayerPosition()
      : getRandomInsideSpawnPosition()
  const spawnPosition = getRandomInsideSpawnPosition(playerPosition)

  if (bossEnemyId === 'gravestone') {
    spawnGravestoneEnemy(
      ctx.scene,
      ctx.enemyGroup,
      spawnPosition.x,
      spawnPosition.y,
    )
    return
  }
  if (bossEnemyId === 'chaosElemental') {
    spawnChaosElementalEnemy(
      ctx.scene,
      ctx.enemyGroup,
      spawnPosition.x,
      spawnPosition.y,
    )
    return
  }
  if (bossEnemyId === 'windHiveBoss') {
    spawnWindHiveBossEnemy(
      ctx.scene,
      ctx.enemyGroup,
      spawnPosition.x,
      spawnPosition.y,
    )
    return
  }
  if (bossEnemyId === 'earthDungeonBoss') {
    spawnEarthDungeonBossEnemy(
      ctx.scene,
      ctx.enemyGroup,
      spawnPosition.x,
      spawnPosition.y,
    )
  }
}
