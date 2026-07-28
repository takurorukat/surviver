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
  ENEMY_WIND_HIVE_BOSS_BEE_SPAWN_INTERVAL_MS,
  ENEMY_WIND_HIVE_BOSS_BEE_SPAWN_OFFSET_MAX,
  ENEMY_WIND_HIVE_BOSS_BEE_SPAWN_OFFSET_MIN,
  ENEMY_WIND_HIVE_BOSS_MAX_SUMMONED_BEES,
  ENEMY_EARTH_DUNGEON_BOSS_MAX_SUMMONED_ENEMIES,
  ENEMY_EARTH_DUNGEON_BOSS_SUMMON_INTERVAL_MS,
  ENEMY_EARTH_DUNGEON_BOSS_SUMMON_OFFSET_MAX,
  ENEMY_EARTH_DUNGEON_BOSS_SUMMON_OFFSET_MIN,
  ENEMY_WIDTH,
  PLAY_AREA_HEIGHT,
  PLAY_AREA_ORIGIN_X,
  PLAY_AREA_ORIGIN_Y,
  PLAY_AREA_WIDTH,
  calculateBranchSpeed,
  calculateEarthRockSpeed,
  calculateEnemyHpForStage,
  calculateEnemySpeedForStage,
  calculateRangedEnemyHpForStage,
  calculateRangedEnemySpeedForStage,
  calculateStumpSpeed,
  getMaxEnemiesForStage,
} from '../GameConstants'
import { type EnemyKind, type SpawnPosition } from '../objects/enemy/types'
import { pickBurningTreeSpawnIntervalMs } from '../objects/enemy/spawnEnemyCommon'
import { pickVolcanoStage5EnemyKind } from '../objects/enemy/packSpawn'
import { pickEarthDungeonSummonEnemyKind } from '../objects/enemy/pickEnemyKind'
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
  spawnRangedEnemy,
  spawnEarthSlimeEnemy,
  spawnEarthRockEnemy,
  spawnEarthSkeletonEnemy,
} from '../objects/enemy/spawnFactories'
import { shouldSummonWindHiveBossBee } from './windHiveBossLogic'
import {
  isSpawnDirectlyAbovePlayer,
  shouldSummonEarthDungeonBossMinion,
} from './earthDungeonBossLogic'

export { shouldSummonWindHiveBossBee } from './windHiveBossLogic'
export { shouldSummonEarthDungeonBossMinion } from './earthDungeonBossLogic'

/**
 * 敵撃破時の経験値コイン倍率（通常は1。カブトムシ／枝／火山ステージ3以上は2）。
 * 0 は「ドロップなし」（ボス召喚蜂など）。未設定や不正値は 1。
 */
export function getEnemyXpDropMultiplier(enemy: Phaser.GameObjects.Rectangle): number {
  const value = enemy.getData('xpDropMultiplier') as number
  if (typeof value === 'number' && value >= 0) {
    return value
  }
  return 1
}

/**
 * ボスが召喚した蜂（summonedByBoss）の生存数を数える。
 * Wave の通常蜂は含めない。
 */
export function countBossSummonedBees(
  enemyGroup: Phaser.Physics.Arcade.Group,
): number {
  const children = enemyGroup.getChildren()
  let count = 0
  for (let index = 0; index < children.length; index++) {
    const enemy = children[index] as Phaser.GameObjects.Rectangle
    if (!enemy.active) {
      continue
    }
    if (enemy.getData('isDefeated') === true) {
      continue
    }
    if (enemy.getData('summonedByBoss') === true) {
      count = count + 1
    }
  }
  return count
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

/**
 * Wind Plains Stage3 ボスが 4 秒ごとに蜂を1体召喚する。
 * ボス召喚蜂が 5 体いるときはスキップ。Wave 蜂は上限に含めない。
 */
export function updateWindHiveBossBeeSpawns(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  stageNumber: number,
  totalStages: number,
  nowMs: number,
  playerX: number = 0,
  playerY: number = 0,
): void {
  const children = enemyGroup.getChildren()

  for (let index = 0; index < children.length; index++) {
    const boss = children[index] as Phaser.GameObjects.Rectangle
    if (!boss.active) {
      continue
    }
    if (boss.getData('isDefeated') === true) {
      continue
    }
    if (boss.getData('enemyKind') !== 'windHiveBoss') {
      continue
    }

    let nextSummonAtMs = boss.getData('nextBeeSummonAtMs') as number
    if (typeof nextSummonAtMs !== 'number') {
      nextSummonAtMs = nowMs + ENEMY_WIND_HIVE_BOSS_BEE_SPAWN_INTERVAL_MS
      boss.setData('nextBeeSummonAtMs', nextSummonAtMs)
    }

    const summonedBeeCount = countBossSummonedBees(enemyGroup)
    if (
      !shouldSummonWindHiveBossBee({
        nowMs,
        nextSummonAtMs,
        activeSummonedBeeCount: summonedBeeCount,
        maxSummonedBees: ENEMY_WIND_HIVE_BOSS_MAX_SUMMONED_BEES,
      })
    ) {
      // 上限到達時もタイマーは進め、次の間隔まで待つ
      if (
        nowMs >= nextSummonAtMs &&
        summonedBeeCount >= ENEMY_WIND_HIVE_BOSS_MAX_SUMMONED_BEES
      ) {
        boss.setData(
          'nextBeeSummonAtMs',
          nowMs + ENEMY_WIND_HIVE_BOSS_BEE_SPAWN_INTERVAL_MS,
        )
      }
      continue
    }

    const spawnPosition = getWindHiveBossBeeSpawnPosition(
      boss.x,
      boss.y,
      playerX,
      playerY,
    )
    const bee = spawnRangedEnemy(
      scene,
      enemyGroup,
      spawnPosition.x,
      spawnPosition.y,
      calculateRangedEnemyHpForStage(stageNumber, totalStages),
      calculateRangedEnemySpeedForStage(stageNumber, totalStages),
    )
    // ボス召喚蜂だけを識別（Wave 蜂と区別）
    bee.setData('summonedByBoss', true)
    bee.setData('xpDropMultiplier', 0)

    boss.setData(
      'nextBeeSummonAtMs',
      nowMs + ENEMY_WIND_HIVE_BOSS_BEE_SPAWN_INTERVAL_MS,
    )
  }
}

/**
 * Earth Dungeon Stage5 ボスが 1 秒ごとに Earth 通常敵を1体召喚する。
 * ボス召喚敵が 8 体いるときはスキップ。Wave 敵は上限に含めない。
 */
export function updateEarthDungeonBossMinionSpawns(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  _stageNumber: number,
  totalStages: number,
  nowMs: number,
  playerX: number,
  playerY: number,
): void {
  const children = enemyGroup.getChildren()

  for (let index = 0; index < children.length; index++) {
    const boss = children[index] as Phaser.GameObjects.Rectangle
    if (!boss.active) {
      continue
    }
    if (boss.getData('isDefeated') === true) {
      continue
    }
    if (boss.getData('enemyKind') !== 'earthDungeonBoss') {
      continue
    }

    let nextSummonAtMs = boss.getData('nextEarthSummonAtMs') as number
    if (typeof nextSummonAtMs !== 'number') {
      nextSummonAtMs = nowMs + ENEMY_EARTH_DUNGEON_BOSS_SUMMON_INTERVAL_MS
      boss.setData('nextEarthSummonAtMs', nextSummonAtMs)
    }

    const summonedCount = countBossSummonedBees(enemyGroup)
    if (
      !shouldSummonEarthDungeonBossMinion({
        nowMs,
        nextSummonAtMs,
        activeSummonedCount: summonedCount,
        maxSummoned: ENEMY_EARTH_DUNGEON_BOSS_MAX_SUMMONED_ENEMIES,
      })
    ) {
      // 上限到達時もタイマーは進め、次の間隔まで待つ（一斉 catch-up しない）
      if (
        nowMs >= nextSummonAtMs &&
        summonedCount >= ENEMY_EARTH_DUNGEON_BOSS_MAX_SUMMONED_ENEMIES
      ) {
        boss.setData(
          'nextEarthSummonAtMs',
          nowMs + ENEMY_EARTH_DUNGEON_BOSS_SUMMON_INTERVAL_MS,
        )
      }
      continue
    }

    const spawnPosition = getEarthDungeonBossMinionSpawnPosition(
      boss.x,
      boss.y,
      playerX,
      playerY,
    )
    const enemyKind = pickEarthDungeonSummonEnemyKind()
    const summoned = spawnEarthDungeonSummonedEnemy(
      scene,
      enemyGroup,
      spawnPosition.x,
      spawnPosition.y,
      enemyKind,
      totalStages,
    )
    summoned.setData('summonedByBoss', true)
    summoned.setData('xpDropMultiplier', 0)

    boss.setData(
      'nextEarthSummonAtMs',
      nowMs + ENEMY_EARTH_DUNGEON_BOSS_SUMMON_INTERVAL_MS,
    )
  }
}

/** Stage1〜3 の Earth 通常敵をランダムで1体出す（各ステージ本来のステータス）。 */
function spawnEarthDungeonSummonedEnemy(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  spawnX: number,
  spawnY: number,
  enemyKind: EnemyKind,
  totalStages: number,
): Phaser.GameObjects.Rectangle {
  if (enemyKind === 'earthRock') {
    return spawnEarthRockEnemy(
      scene,
      enemyGroup,
      spawnX,
      spawnY,
      calculateEarthRockSpeed(2, totalStages),
    )
  }

  if (enemyKind === 'earthSkeleton') {
    return spawnEarthSkeletonEnemy(
      scene,
      enemyGroup,
      spawnX,
      spawnY,
      calculateEnemySpeedForStage(3, totalStages),
    )
  }

  return spawnEarthSlimeEnemy(
    scene,
    enemyGroup,
    spawnX,
    spawnY,
    calculateEnemyHpForStage(1, totalStages),
    calculateEnemySpeedForStage(1, totalStages),
  )
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

  return clampSpawnToPlayArea(spawnX, spawnY)
}

/** 竜巻ボスの周囲に蜂を出す座標（半径 32〜64、プレイエリア内）。 */
function getWindHiveBossBeeSpawnPosition(
  bossX: number,
  bossY: number,
  playerX: number,
  playerY: number,
): SpawnPosition {
  const horizontalTolerance = ENEMY_WIDTH * 1.5
  let chosen: SpawnPosition = { x: bossX, y: bossY }

  for (let attempt = 0; attempt < 8; attempt++) {
    const angle = Math.random() * Math.PI * 2
    const distance =
      ENEMY_WIND_HIVE_BOSS_BEE_SPAWN_OFFSET_MIN +
      Math.random() *
        (ENEMY_WIND_HIVE_BOSS_BEE_SPAWN_OFFSET_MAX -
          ENEMY_WIND_HIVE_BOSS_BEE_SPAWN_OFFSET_MIN)
    const candidate = clampSpawnToPlayArea(
      bossX + Math.cos(angle) * distance,
      bossY + Math.sin(angle) * distance,
    )
    chosen = candidate
    if (
      !isSpawnDirectlyAbovePlayer({
        spawnX: candidate.x,
        spawnY: candidate.y,
        playerX,
        playerY,
        horizontalTolerance,
      })
    ) {
      return candidate
    }
  }

  return chosen
}

/**
 * Earth ボス周囲に召喚敵を出す座標（半径 48〜96）。
 * プレイヤー真上は避け、数回だけ角度をやり直す。
 */
function getEarthDungeonBossMinionSpawnPosition(
  bossX: number,
  bossY: number,
  playerX: number,
  playerY: number,
): SpawnPosition {
  const horizontalTolerance = ENEMY_WIDTH * 1.5
  let chosen: SpawnPosition = { x: bossX, y: bossY }

  for (let attempt = 0; attempt < 8; attempt++) {
    const angle = Math.random() * Math.PI * 2
    const distance =
      ENEMY_EARTH_DUNGEON_BOSS_SUMMON_OFFSET_MIN +
      Math.random() *
        (ENEMY_EARTH_DUNGEON_BOSS_SUMMON_OFFSET_MAX -
          ENEMY_EARTH_DUNGEON_BOSS_SUMMON_OFFSET_MIN)
    const candidate = clampSpawnToPlayArea(
      bossX + Math.cos(angle) * distance,
      bossY + Math.sin(angle) * distance,
    )
    chosen = candidate
    if (
      !isSpawnDirectlyAbovePlayer({
        spawnX: candidate.x,
        spawnY: candidate.y,
        playerX,
        playerY,
        horizontalTolerance,
      })
    ) {
      return candidate
    }
  }

  return chosen
}

function clampSpawnToPlayArea(spawnX: number, spawnY: number): SpawnPosition {
  let x = spawnX
  let y = spawnY
  const left = PLAY_AREA_ORIGIN_X + ENEMY_SPAWN_AREA_MARGIN
  const right = PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH - ENEMY_SPAWN_AREA_MARGIN
  const top = PLAY_AREA_ORIGIN_Y + ENEMY_SPAWN_AREA_MARGIN
  const bottom = PLAY_AREA_ORIGIN_Y + PLAY_AREA_HEIGHT - ENEMY_SPAWN_AREA_MARGIN

  if (x < left) {
    x = left
  }
  if (x > right) {
    x = right
  }
  if (y < top) {
    y = top
  }
  if (y > bottom) {
    y = bottom
  }

  return { x, y }
}

