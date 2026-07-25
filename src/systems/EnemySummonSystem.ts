/**
 * 切り株・燃え木・枝・墓石・カオスエレメンタルなどの召喚更新。
 */
import Phaser from 'phaser'
import {
  ENEMY_BRANCH_BEETLE_SPAWN_INTERVAL_MS,
  ENEMY_BRANCH_BEETLE_SPAWN_OFFSET,
  ENEMY_BURNING_TREE_SPAWN_OFFSET,
  ENEMY_CHAOS_ELEMENTAL_SPAWN_INTERVAL_MS,
  ENEMY_CHAOS_ELEMENTAL_SPAWN_OFFSET,
  ENEMY_GRAVESTONE_SPAWN_INTERVAL_MS,
  ENEMY_GRAVESTONE_SPAWN_OFFSET,
  ENEMY_SPAWN_AREA_MARGIN,
  ENEMY_STUMP_MUSHROOM_SPAWN_INTERVAL_MS,
  ENEMY_STUMP_MUSHROOM_SPAWN_OFFSET,
  PLAY_AREA_HEIGHT,
  PLAY_AREA_ORIGIN_X,
  PLAY_AREA_ORIGIN_Y,
  PLAY_AREA_WIDTH,
  calculateBranchSpeed,
  calculateEnemyHpForStage,
  calculateEnemySpeedForStage,
  calculateStumpSpeed,
  getMaxEnemiesForStage,
} from '../GameConstants'
import { type SpawnPosition } from '../objects/enemy/types'
import { pickBurningTreeSpawnIntervalMs } from '../objects/enemy/spawnEnemyCommon'
import { pickVolcanoStage5EnemyKind } from '../objects/enemy/packSpawn'
import { countActiveEnemies } from '../objects/enemy/combat'
import {
  spawnMushroomEnemy,
  spawnSpiritFireEnemy,
  spawnSpiritThunderEnemy,
  spawnBurningTreeEnemy,
  spawnAshKnightEnemy,
  spawnBeetleEnemy,
  spawnStumpEnemy,
  spawnBranchEnemy,
} from '../objects/enemy/spawnFactories'

/**
 * 敵撃破時の経験値コイン倍率（通常は1。カブトムシ／枝／火山ステージ3以上は2）。
 */
export function getEnemyXpDropMultiplier(enemy: Phaser.GameObjects.Rectangle): number {
  const value = enemy.getData('xpDropMultiplier') as number
  if (typeof value === 'number' && value > 0) {
    return value
  }
  return 1
}

/**
 * 範囲爆破ダメージの倍率（通常は1。枝は2）。
 */
export function getEnemyBlastDamageMultiplier(enemy: Phaser.GameObjects.Rectangle): number {
  const value = enemy.getData('blastDamageMultiplier') as number
  if (typeof value === 'number' && value > 0) {
    return value
  }
  return 1
}

/**
 * 切り株が一定間隔でキノコを1体出す。
 * 敵数上限いっぱいのときはスキップし、次の間隔まで待つ。
 */
export function updateStumpMushroomSpawns(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  stageNumber: number,
  totalStages: number,
  nowMs: number,
): void {
  const maxEnemies = getMaxEnemiesForStage(stageNumber, totalStages)
  const children = enemyGroup.getChildren()

  for (let index = 0; index < children.length; index++) {
    const stump = children[index] as Phaser.GameObjects.Rectangle
    if (!stump.active) {
      continue
    }
    if (stump.getData('isDefeated') === true) {
      continue
    }
    if (stump.getData('enemyKind') !== 'stump') {
      continue
    }

    let nextSpawnAtMs = stump.getData('nextMushroomSpawnAtMs') as number
    if (typeof nextSpawnAtMs !== 'number') {
      nextSpawnAtMs = nowMs + ENEMY_STUMP_MUSHROOM_SPAWN_INTERVAL_MS
      stump.setData('nextMushroomSpawnAtMs', nextSpawnAtMs)
    }

    if (nowMs < nextSpawnAtMs) {
      continue
    }

    // 上限いっぱいなら今回は出さず、次の間隔へ送る
    if (countActiveEnemies(enemyGroup) >= maxEnemies) {
      stump.setData(
        'nextMushroomSpawnAtMs',
        nowMs + ENEMY_STUMP_MUSHROOM_SPAWN_INTERVAL_MS,
      )
      continue
    }

    const spawnPosition = getStumpMushroomSpawnPosition(stump.x, stump.y)
    spawnMushroomEnemy(
      scene,
      enemyGroup,
      spawnPosition.x,
      spawnPosition.y,
      calculateEnemyHpForStage(stageNumber, totalStages),
      calculateEnemySpeedForStage(stageNumber, totalStages),
    )
    stump.setData(
      'nextMushroomSpawnAtMs',
      nowMs + ENEMY_STUMP_MUSHROOM_SPAWN_INTERVAL_MS,
    )
  }
}


export function updateBurningTreeSpiritFireSpawns(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  stageNumber: number,
  totalStages: number,
  nowMs: number,
): void {
  const maxEnemies = getMaxEnemiesForStage(stageNumber, totalStages)
  const children = enemyGroup.getChildren()
  // Stage1 相当のステータスで火の精霊を出す
  const spiritHp = calculateEnemyHpForStage(1, totalStages)
  const spiritSpeed = calculateEnemySpeedForStage(1, totalStages)

  for (let index = 0; index < children.length; index++) {
    const burningTree = children[index] as Phaser.GameObjects.Rectangle
    if (!burningTree.active) {
      continue
    }
    if (burningTree.getData('isDefeated') === true) {
      continue
    }
    if (burningTree.getData('enemyKind') !== 'burningTree') {
      continue
    }

    let nextSpawnAtMs = burningTree.getData('nextSpiritFireSpawnAtMs') as number
    if (typeof nextSpawnAtMs !== 'number') {
      nextSpawnAtMs = nowMs + pickBurningTreeSpawnIntervalMs()
      burningTree.setData('nextSpiritFireSpawnAtMs', nextSpawnAtMs)
    }

    if (nowMs < nextSpawnAtMs) {
      continue
    }

    if (countActiveEnemies(enemyGroup) >= maxEnemies) {
      burningTree.setData(
        'nextSpiritFireSpawnAtMs',
        nowMs + pickBurningTreeSpawnIntervalMs(),
      )
      continue
    }

    const spawnPosition = getBurningTreeSpiritFireSpawnPosition(
      burningTree.x,
      burningTree.y,
    )
    spawnSpiritFireEnemy(
      scene,
      enemyGroup,
      spawnPosition.x,
      spawnPosition.y,
      spiritHp,
      spiritSpeed,
    )
    burningTree.setData(
      'nextSpiritFireSpawnAtMs',
      nowMs + pickBurningTreeSpawnIntervalMs(),
    )
  }
}

/**
 * 枝が一定間隔でカブトムシを1体出す。
 * 敵数上限いっぱいのときはスキップし、次の間隔まで待つ。
 */
export function updateBranchBeetleSpawns(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  stageNumber: number,
  totalStages: number,
  nowMs: number,
): void {
  const maxEnemies = getMaxEnemiesForStage(stageNumber, totalStages)
  const children = enemyGroup.getChildren()

  for (let index = 0; index < children.length; index++) {
    const branch = children[index] as Phaser.GameObjects.Rectangle
    if (!branch.active) {
      continue
    }
    if (branch.getData('isDefeated') === true) {
      continue
    }
    if (branch.getData('enemyKind') !== 'branch') {
      continue
    }

    let nextSpawnAtMs = branch.getData('nextBranchBeetleSpawnAtMs') as number
    if (typeof nextSpawnAtMs !== 'number') {
      nextSpawnAtMs = nowMs + ENEMY_BRANCH_BEETLE_SPAWN_INTERVAL_MS
      branch.setData('nextBranchBeetleSpawnAtMs', nextSpawnAtMs)
    }

    if (nowMs < nextSpawnAtMs) {
      continue
    }

    if (countActiveEnemies(enemyGroup) >= maxEnemies) {
      branch.setData(
        'nextBranchBeetleSpawnAtMs',
        nowMs + ENEMY_BRANCH_BEETLE_SPAWN_INTERVAL_MS,
      )
      continue
    }

    const spawnPosition = getBranchBeetleSpawnPosition(branch.x, branch.y)
    spawnBeetleEnemy(
      scene,
      enemyGroup,
      spawnPosition.x,
      spawnPosition.y,
      calculateEnemySpeedForStage(stageNumber, totalStages),
    )
    branch.setData(
      'nextBranchBeetleSpawnAtMs',
      nowMs + ENEMY_BRANCH_BEETLE_SPAWN_INTERVAL_MS,
    )
  }
}

/**
 * 墓石が一定間隔で切り株と枝を1体ずつ出す。
 * 敵数上限いっぱいのときはスキップし、次の間隔まで待つ。
 */
export function updateGravestoneBeetleSpawns(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  stageNumber: number,
  totalStages: number,
  nowMs: number,
): void {
  const maxEnemies = getMaxEnemiesForStage(stageNumber, totalStages)
  const children = enemyGroup.getChildren()

  for (let index = 0; index < children.length; index++) {
    const gravestone = children[index] as Phaser.GameObjects.Rectangle
    if (!gravestone.active) {
      continue
    }
    if (gravestone.getData('isDefeated') === true) {
      continue
    }
    if (gravestone.getData('enemyKind') !== 'gravestone') {
      continue
    }

    let nextSpawnAtMs = gravestone.getData('nextGravestoneSpawnAtMs') as number
    if (typeof nextSpawnAtMs !== 'number') {
      nextSpawnAtMs = nowMs + ENEMY_GRAVESTONE_SPAWN_INTERVAL_MS
      gravestone.setData('nextGravestoneSpawnAtMs', nextSpawnAtMs)
    }

    if (nowMs < nextSpawnAtMs) {
      continue
    }

    if (countActiveEnemies(enemyGroup) >= maxEnemies) {
      gravestone.setData(
        'nextGravestoneSpawnAtMs',
        nowMs + ENEMY_GRAVESTONE_SPAWN_INTERVAL_MS,
      )
      continue
    }

    const stumpPosition = getGravestoneSpawnPosition(gravestone.x, gravestone.y)
    spawnStumpEnemy(
      scene,
      enemyGroup,
      stumpPosition.x,
      stumpPosition.y,
      calculateStumpSpeed(),
    )

    if (countActiveEnemies(enemyGroup) < maxEnemies) {
      const branchPosition = getGravestoneSpawnPosition(gravestone.x, gravestone.y)
      spawnBranchEnemy(
        scene,
        enemyGroup,
        branchPosition.x,
        branchPosition.y,
        calculateBranchSpeed(stageNumber, totalStages),
      )
    }

    gravestone.setData(
      'nextGravestoneSpawnAtMs',
      nowMs + ENEMY_GRAVESTONE_SPAWN_INTERVAL_MS,
    )
  }
}

/**
 * 混沌エレメンタルが 2 秒ごとに Stage1〜4 の敵をランダムで1体出す。
 * 敵数上限いっぱいのときはスキップし、次の間隔まで待つ。
 */
export function updateChaosElementalSpawns(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  stageNumber: number,
  totalStages: number,
  nowMs: number,
): void {
  const maxEnemies = getMaxEnemiesForStage(stageNumber, totalStages)
  const children = enemyGroup.getChildren()

  for (let index = 0; index < children.length; index++) {
    const chaosElemental = children[index] as Phaser.GameObjects.Rectangle
    if (!chaosElemental.active) {
      continue
    }
    if (chaosElemental.getData('isDefeated') === true) {
      continue
    }
    if (chaosElemental.getData('enemyKind') !== 'chaosElemental') {
      continue
    }

    let nextSpawnAtMs = chaosElemental.getData('nextChaosElementalSpawnAtMs') as number
    if (typeof nextSpawnAtMs !== 'number') {
      nextSpawnAtMs = nowMs + ENEMY_CHAOS_ELEMENTAL_SPAWN_INTERVAL_MS
      chaosElemental.setData('nextChaosElementalSpawnAtMs', nextSpawnAtMs)
    }

    if (nowMs < nextSpawnAtMs) {
      continue
    }

    if (countActiveEnemies(enemyGroup) >= maxEnemies) {
      chaosElemental.setData(
        'nextChaosElementalSpawnAtMs',
        nowMs + ENEMY_CHAOS_ELEMENTAL_SPAWN_INTERVAL_MS,
      )
      continue
    }

    const spawnPosition = getChaosElementalSpawnPosition(
      chaosElemental.x,
      chaosElemental.y,
    )
    spawnVolcanoPreviousStageEnemy(
      scene,
      enemyGroup,
      spawnPosition.x,
      spawnPosition.y,
      totalStages,
    )
    chaosElemental.setData(
      'nextChaosElementalSpawnAtMs',
      nowMs + ENEMY_CHAOS_ELEMENTAL_SPAWN_INTERVAL_MS,
    )
  }
}

/** Stage1〜4 の火山敵をランダムで1体出す（各ステージ本来のステータス）。 */
function spawnVolcanoPreviousStageEnemy(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  spawnX: number,
  spawnY: number,
  totalStages: number,
): void {
  const enemyKind = pickVolcanoStage5EnemyKind()

  if (enemyKind === 'spiritFire') {
    spawnSpiritFireEnemy(
      scene,
      enemyGroup,
      spawnX,
      spawnY,
      calculateEnemyHpForStage(1, totalStages),
      calculateEnemySpeedForStage(1, totalStages),
    )
    return
  }

  if (enemyKind === 'spiritThunder') {
    spawnSpiritThunderEnemy(scene, enemyGroup, spawnX, spawnY)
    return
  }

  if (enemyKind === 'burningTree') {
    spawnBurningTreeEnemy(scene, enemyGroup, spawnX, spawnY)
    return
  }

  spawnAshKnightEnemy(
    scene,
    enemyGroup,
    spawnX,
    spawnY,
    calculateEnemySpeedForStage(1, totalStages),
  )
}

/** 燃え木の周囲に火の精霊を出す座標（プレイエリア内に収める）。 */
function getBurningTreeSpiritFireSpawnPosition(
  treeX: number,
  treeY: number,
): SpawnPosition {
  const angle = Math.random() * Math.PI * 2
  let spawnX = treeX + Math.cos(angle) * ENEMY_BURNING_TREE_SPAWN_OFFSET
  let spawnY = treeY + Math.sin(angle) * ENEMY_BURNING_TREE_SPAWN_OFFSET

  const left = PLAY_AREA_ORIGIN_X + ENEMY_SPAWN_AREA_MARGIN
  const right = PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH - ENEMY_SPAWN_AREA_MARGIN
  const top = PLAY_AREA_ORIGIN_Y + ENEMY_SPAWN_AREA_MARGIN
  const bottom = PLAY_AREA_ORIGIN_Y + PLAY_AREA_HEIGHT - ENEMY_SPAWN_AREA_MARGIN

  if (spawnX < left) {
    spawnX = left
  }
  if (spawnX > right) {
    spawnX = right
  }
  if (spawnY < top) {
    spawnY = top
  }
  if (spawnY > bottom) {
    spawnY = bottom
  }

  return { x: spawnX, y: spawnY }
}

/** 枝の周囲にカブトムシを出す座標（プレイエリア内に収める）。 */
function getBranchBeetleSpawnPosition(
  branchX: number,
  branchY: number,
): SpawnPosition {
  const angle = Math.random() * Math.PI * 2
  let spawnX = branchX + Math.cos(angle) * ENEMY_BRANCH_BEETLE_SPAWN_OFFSET
  let spawnY = branchY + Math.sin(angle) * ENEMY_BRANCH_BEETLE_SPAWN_OFFSET

  const left = PLAY_AREA_ORIGIN_X + ENEMY_SPAWN_AREA_MARGIN
  const right = PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH - ENEMY_SPAWN_AREA_MARGIN
  const top = PLAY_AREA_ORIGIN_Y + ENEMY_SPAWN_AREA_MARGIN
  const bottom = PLAY_AREA_ORIGIN_Y + PLAY_AREA_HEIGHT - ENEMY_SPAWN_AREA_MARGIN

  if (spawnX < left) {
    spawnX = left
  }
  if (spawnX > right) {
    spawnX = right
  }
  if (spawnY < top) {
    spawnY = top
  }
  if (spawnY > bottom) {
    spawnY = bottom
  }

  return { x: spawnX, y: spawnY }
}

/** 墓石の周囲に敵を出す座標（プレイエリア内に収める）。 */
function getGravestoneSpawnPosition(
  gravestoneX: number,
  gravestoneY: number,
): SpawnPosition {
  const angle = Math.random() * Math.PI * 2
  let spawnX = gravestoneX + Math.cos(angle) * ENEMY_GRAVESTONE_SPAWN_OFFSET
  let spawnY = gravestoneY + Math.sin(angle) * ENEMY_GRAVESTONE_SPAWN_OFFSET

  const left = PLAY_AREA_ORIGIN_X + ENEMY_SPAWN_AREA_MARGIN
  const right = PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH - ENEMY_SPAWN_AREA_MARGIN
  const top = PLAY_AREA_ORIGIN_Y + ENEMY_SPAWN_AREA_MARGIN
  const bottom = PLAY_AREA_ORIGIN_Y + PLAY_AREA_HEIGHT - ENEMY_SPAWN_AREA_MARGIN

  if (spawnX < left) {
    spawnX = left
  }
  if (spawnX > right) {
    spawnX = right
  }
  if (spawnY < top) {
    spawnY = top
  }
  if (spawnY > bottom) {
    spawnY = bottom
  }

  return { x: spawnX, y: spawnY }
}

/** 混沌エレメンタルの周囲に敵を出す座標（プレイエリア内に収める）。 */
function getChaosElementalSpawnPosition(
  elementalX: number,
  elementalY: number,
): SpawnPosition {
  const angle = Math.random() * Math.PI * 2
  let spawnX = elementalX + Math.cos(angle) * ENEMY_CHAOS_ELEMENTAL_SPAWN_OFFSET
  let spawnY = elementalY + Math.sin(angle) * ENEMY_CHAOS_ELEMENTAL_SPAWN_OFFSET

  const left = PLAY_AREA_ORIGIN_X + ENEMY_SPAWN_AREA_MARGIN
  const right = PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH - ENEMY_SPAWN_AREA_MARGIN
  const top = PLAY_AREA_ORIGIN_Y + ENEMY_SPAWN_AREA_MARGIN
  const bottom = PLAY_AREA_ORIGIN_Y + PLAY_AREA_HEIGHT - ENEMY_SPAWN_AREA_MARGIN

  if (spawnX < left) {
    spawnX = left
  }
  if (spawnX > right) {
    spawnX = right
  }
  if (spawnY < top) {
    spawnY = top
  }
  if (spawnY > bottom) {
    spawnY = bottom
  }

  return { x: spawnX, y: spawnY }
}

/** 切り株の周囲にキノコを出す座標（プレイエリア内に収める）。 */
function getStumpMushroomSpawnPosition(
  stumpX: number,
  stumpY: number,
): SpawnPosition {
  const angle = Math.random() * Math.PI * 2
  let spawnX = stumpX + Math.cos(angle) * ENEMY_STUMP_MUSHROOM_SPAWN_OFFSET
  let spawnY = stumpY + Math.sin(angle) * ENEMY_STUMP_MUSHROOM_SPAWN_OFFSET

  const left = PLAY_AREA_ORIGIN_X + ENEMY_SPAWN_AREA_MARGIN
  const right = PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH - ENEMY_SPAWN_AREA_MARGIN
  const top = PLAY_AREA_ORIGIN_Y + ENEMY_SPAWN_AREA_MARGIN
  const bottom = PLAY_AREA_ORIGIN_Y + PLAY_AREA_HEIGHT - ENEMY_SPAWN_AREA_MARGIN

  if (spawnX < left) {
    spawnX = left
  }
  if (spawnX > right) {
    spawnX = right
  }
  if (spawnY < top) {
    spawnY = top
  }
  if (spawnY > bottom) {
    spawnY = bottom
  }

  return { x: spawnX, y: spawnY }
}

