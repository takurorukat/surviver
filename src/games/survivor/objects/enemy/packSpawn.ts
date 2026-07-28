/**
 * 警告付きパックスポーン・出現位置・種類抽選。
 */
import Phaser from 'phaser'
import {
  ENEMY_ARMORED_COLOR,
  ENEMY_ASH_KNIGHT_BREATH_DISPLAY_HEIGHT,
  ENEMY_ASH_KNIGHT_BREATH_SPRITE_KEY,
  ENEMY_ASH_KNIGHT_COLOR,
  ENEMY_BEETLE_BREATH_DISPLAY_HEIGHT,
  ENEMY_BEETLE_BREATH_SPRITE_KEY,
  ENEMY_BEETLE_COLOR,
  ENEMY_BEE_BREATH_DISPLAY_HEIGHT,
  ENEMY_BEE_BREATH_SPRITE_KEY,
  ENEMY_BRANCH_BREATH_DISPLAY_HEIGHT,
  ENEMY_BRANCH_BREATH_SPRITE_KEY,
  ENEMY_BRANCH_COLOR,
  ENEMY_BREATHING_SPRITES_ENABLED,
  ENEMY_BURNING_TREE_BREATH_DISPLAY_HEIGHT,
  ENEMY_BURNING_TREE_BREATH_SPRITE_KEY,
  ENEMY_BURNING_TREE_COLOR,
  ENEMY_CHAOS_ELEMENTAL_BREATH_DISPLAY_HEIGHT,
  ENEMY_CHAOS_ELEMENTAL_BREATH_SPRITE_KEY,
  ENEMY_CHAOS_ELEMENTAL_COLOR,
  ENEMY_CHARGER_COLOR,
  ENEMY_HEIGHT,
  ENEMY_MUSHROOM_BREATH_DISPLAY_HEIGHT,
  ENEMY_MUSHROOM_BREATH_SPRITE_KEY,
  ENEMY_MUSHROOM_COLOR,
  ENEMY_EARTH_SLIME_BREATH_DISPLAY_HEIGHT,
  ENEMY_EARTH_SLIME_BREATH_SPRITE_KEY,
  ENEMY_EARTH_SLIME_COLOR,
  ENEMY_EARTH_ROCK_BREATH_DISPLAY_HEIGHT,
  ENEMY_EARTH_ROCK_BREATH_SPRITE_KEY,
  ENEMY_EARTH_ROCK_COLOR,
  ENEMY_EARTH_MAGMA_ROCK_BREATH_DISPLAY_HEIGHT,
  ENEMY_EARTH_MAGMA_ROCK_BREATH_SPRITE_KEY,
  ENEMY_EARTH_MAGMA_ROCK_COLOR,
  ENEMY_EARTH_MAGMA_ROCK_MAX_ACTIVE,
  ENEMY_EARTH_SKELETON_BREATH_DISPLAY_HEIGHT,
  ENEMY_EARTH_SKELETON_BREATH_SPRITE_KEY,
  ENEMY_EARTH_SKELETON_COLOR,
  ENEMY_PACK_SPACING,
  ENEMY_RANGED_COLOR,
  ENEMY_RUNNER_COLOR,
  ENEMY_RUNNER_HP,
  ENEMY_RUNNER_MIN_SPEED,
  ENEMY_RUNNER_SPEED_MULTIPLIER,
  ENEMY_SHIELDED_COLOR,
  ENEMY_SLIME_BREATH_DISPLAY_HEIGHT,
  ENEMY_SLIME_BREATH_SPRITE_KEY,
  ENEMY_SLIME_DISPLAY_SIZE,
  ENEMY_SLIME_MUD_BREATH_DISPLAY_HEIGHT,
  ENEMY_SLIME_MUD_BREATH_SPRITE_KEY,
  ENEMY_SLIME_WALK_FRAME_SIZE,
  ENEMY_SLIME_WALK_SPRITE_KEY,
  ENEMY_SNAKE_DISPLAY_SIZE,
  ENEMY_SNAKE_WALK_FRAME_SIZE,
  ENEMY_SNAKE_WALK_SPRITE_KEY,
  ENEMY_SPAWN_AREA_MARGIN,
  ENEMY_SPAWN_MIN_DISTANCE_BETWEEN,
  ENEMY_SPAWN_MIN_DISTANCE_FROM_PLAYER,
  ENEMY_SPAWN_WARNING_BLINK_INTERVAL_MS,
  ENEMY_SPAWN_WARNING_COLOR,
  ENEMY_SPAWN_WARNING_SECONDS,
  ENEMY_SPIRIT_FIRE_BREATH_DISPLAY_HEIGHT,
  ENEMY_SPIRIT_FIRE_BREATH_SPRITE_KEY,
  ENEMY_SPIRIT_FIRE_COLOR,
  ENEMY_SPIRIT_THUNDER_BREATH_DISPLAY_HEIGHT,
  ENEMY_SPIRIT_THUNDER_BREATH_SPRITE_KEY,
  ENEMY_SPIRIT_THUNDER_COLOR,
  ENEMY_STONE_GUARD_COLOR,
  ENEMY_STUMP_BREATH_DISPLAY_HEIGHT,
  ENEMY_STUMP_BREATH_SPRITE_KEY,
  ENEMY_STUMP_COLOR,
  ENEMY_TOUGH_MELEE_COLOR,
  ENEMY_WALK_SPRITES_ENABLED,
  ENEMY_WIDTH,
  PLAY_AREA_HEIGHT,
  PLAY_AREA_ORIGIN_X,
  PLAY_AREA_ORIGIN_Y,
  PLAY_AREA_WIDTH,
  calculateBranchSpeed,
  calculateEnemyHpForStage,
  calculateEnemySpeedForStage,
  calculateRangedEnemyHpForStage,
  calculateRangedEnemySpeedForStage,
  calculateStumpSpeed,
  calculateStoneGuardSpeed,
  calculateEarthRockSpeed,
  calculateEarthMagmaRockSpeed,
  calculateToughMeleeHp,
  calculateToughMeleeSpeed,
  isForestFinalStage,
  isVolcanoFinalStage,
  shouldScatterRuinsStage3EnemySpawns,
  shouldScatterVolcanoEnemySpawns,
  shouldSpawnRangedEnemy,
  type StageAreaId,
} from '../../GameConstants'
import { type EnemyKind, type SpawnPosition, type SpawnWarningTimers } from './types'
import { spawnEnemyCommon } from './spawnEnemyCommon'
import {
  pickEnemyKindForArea,
  pickForestStage5EnemyKind,
  pickVolcanoStage5EnemyKind,
  pickRuinsStage4EnemyKind,
  pickRuinsStage4EnemyKindWithoutMagmaRock,
} from './pickEnemyKind'
import {
  spawnMeleeEnemy,
  spawnToughMeleeEnemy,
  spawnMushroomEnemy,
  spawnEarthSlimeEnemy,
  spawnEarthRockEnemy,
  spawnEarthMagmaRockEnemy,
  spawnSpiritFireEnemy,
  spawnSpiritThunderEnemy,
  spawnBurningTreeEnemy,
  spawnAshKnightEnemy,
  spawnChaosElementalEnemy,
  spawnStumpEnemy,
  spawnBeetleEnemy,
  spawnEarthSkeletonEnemy,
  spawnBranchEnemy,
  spawnStoneGuardEnemy,
  spawnRangedEnemy,
} from './spawnFactories'

export { pickEnemyKindForArea, pickVolcanoStage5EnemyKind } from './pickEnemyKind'

function buildPackEnemyKinds(
  areaId: StageAreaId,
  stageNumber: number,
  totalStages: number,
  spawnAsRanged: boolean,
  packSize: number,
  enemyGroup: Phaser.Physics.Arcade.Group,
): EnemyKind[] {
  const kinds: EnemyKind[] = []
  if (isForestFinalStage(areaId, stageNumber, totalStages)) {
    for (let index = 0; index < packSize; index++) {
      kinds.push(pickForestStage5EnemyKind())
    }
    return kinds
  }
  if (isVolcanoFinalStage(areaId, stageNumber, totalStages)) {
    for (let index = 0; index < packSize; index++) {
      kinds.push(pickVolcanoStage5EnemyKind())
    }
    return kinds
  }

  // Ruins Stage4: 個体ごとに抽選。マグマ岩は同時4体まで
  if (areaId === 'ruins' && stageNumber === 4) {
    let magmaCount = countActiveEnemyKind(enemyGroup, 'earthMagmaRock')
    for (let index = 0; index < packSize; index++) {
      let kind = pickRuinsStage4EnemyKind()
      if (
        kind === 'earthMagmaRock' &&
        magmaCount >= ENEMY_EARTH_MAGMA_ROCK_MAX_ACTIVE
      ) {
        kind = pickRuinsStage4EnemyKindWithoutMagmaRock()
      }
      if (kind === 'earthMagmaRock') {
        magmaCount = magmaCount + 1
      }
      kinds.push(kind)
    }
    return kinds
  }

  const enemyKind = pickEnemyKindForArea(areaId, stageNumber, spawnAsRanged)
  for (let index = 0; index < packSize; index++) {
    kinds.push(enemyKind)
  }
  return kinds
}

function countActiveEnemyKind(
  enemyGroup: Phaser.Physics.Arcade.Group,
  enemyKind: EnemyKind,
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
    if (enemy.getData('enemyKind') === enemyKind) {
      count = count + 1
    }
  }
  return count
}

/**
 * プレイエリアの内側からランダムに出現位置を決める。
 * 端ギリギリを避け、ENEMY_SPAWN_AREA_MARGIN だけ内側に絞る。
 *
 * avoidPosition を渡すと、そこから ENEMY_SPAWN_MIN_DISTANCE_FROM_PLAYER 以内には
 * 出さない（プレイヤーの至近距離に沸いて回避不能になるのを防ぐ）。
 * 何度か振り直しても遠い位置が見つからないときは、最後の候補をそのまま返す。
 */
export function getRandomInsideSpawnPosition(
  avoidPosition?: SpawnPosition,
): SpawnPosition {
  const left = PLAY_AREA_ORIGIN_X + ENEMY_SPAWN_AREA_MARGIN
  const right = PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH - ENEMY_SPAWN_AREA_MARGIN
  const top = PLAY_AREA_ORIGIN_Y + ENEMY_SPAWN_AREA_MARGIN
  const bottom = PLAY_AREA_ORIGIN_Y + PLAY_AREA_HEIGHT - ENEMY_SPAWN_AREA_MARGIN

  const maxAttempts = 12
  let candidate: SpawnPosition = {
    x: Phaser.Math.Between(left, right),
    y: Phaser.Math.Between(top, bottom),
  }

  if (avoidPosition === undefined) {
    return candidate
  }

  // Python: 遠い位置が出るまで最大 maxAttempts 回だけ振り直す
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const distance = Phaser.Math.Distance.Between(
      candidate.x,
      candidate.y,
      avoidPosition.x,
      avoidPosition.y,
    )
    if (distance >= ENEMY_SPAWN_MIN_DISTANCE_FROM_PLAYER) {
      return candidate
    }
    candidate = {
      x: Phaser.Math.Between(left, right),
      y: Phaser.Math.Between(top, bottom),
    }
  }

  return candidate
}

/**
 * 散らしスポーン用: プレイヤーと既存スポーン地点から一定距離以上離れた位置を返す。
 * 何度か振り直しても条件を満たせないときは、最後の候補をそのまま返す。
 */
function getRandomScatteredSpawnPosition(
  avoidPlayer?: SpawnPosition,
  existingPositions: SpawnPosition[] = [],
): SpawnPosition {
  const left = PLAY_AREA_ORIGIN_X + ENEMY_SPAWN_AREA_MARGIN
  const right = PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH - ENEMY_SPAWN_AREA_MARGIN
  const top = PLAY_AREA_ORIGIN_Y + ENEMY_SPAWN_AREA_MARGIN
  const bottom = PLAY_AREA_ORIGIN_Y + PLAY_AREA_HEIGHT - ENEMY_SPAWN_AREA_MARGIN

  const maxAttempts = 24
  let candidate: SpawnPosition = {
    x: Phaser.Math.Between(left, right),
    y: Phaser.Math.Between(top, bottom),
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let farEnoughFromPlayer = true
    if (avoidPlayer !== undefined) {
      const distanceFromPlayer = Phaser.Math.Distance.Between(
        candidate.x,
        candidate.y,
        avoidPlayer.x,
        avoidPlayer.y,
      )
      if (distanceFromPlayer < ENEMY_SPAWN_MIN_DISTANCE_FROM_PLAYER) {
        farEnoughFromPlayer = false
      }
    }

    let farEnoughFromOthers = true
    for (let index = 0; index < existingPositions.length; index++) {
      const existing = existingPositions[index]
      const distanceFromExisting = Phaser.Math.Distance.Between(
        candidate.x,
        candidate.y,
        existing.x,
        existing.y,
      )
      if (distanceFromExisting < ENEMY_SPAWN_MIN_DISTANCE_BETWEEN) {
        farEnoughFromOthers = false
        break
      }
    }

    if (farEnoughFromPlayer && farEnoughFromOthers) {
      return candidate
    }

    candidate = {
      x: Phaser.Math.Between(left, right),
      y: Phaser.Math.Between(top, bottom),
    }
  }

  return candidate
}

/**
 * 中心の周りに packSize 体分の座標を作る（円状に少しずらす）。
 * 貫通弾の価値が出るよう、群れとしてまとめて出すための配置。
 */
function buildPackPositionsAroundCenter(
  centerX: number,
  centerY: number,
  packSize: number,
): SpawnPosition[] {
  const positions: SpawnPosition[] = []
  const safePackSize = Math.max(1, packSize)

  if (safePackSize === 1) {
    positions.push({ x: centerX, y: centerY })
    return positions
  }

  const left = PLAY_AREA_ORIGIN_X + ENEMY_SPAWN_AREA_MARGIN
  const right = PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH - ENEMY_SPAWN_AREA_MARGIN
  const top = PLAY_AREA_ORIGIN_Y + ENEMY_SPAWN_AREA_MARGIN
  const bottom = PLAY_AREA_ORIGIN_Y + PLAY_AREA_HEIGHT - ENEMY_SPAWN_AREA_MARGIN

  for (let index = 0; index < safePackSize; index++) {
    const angle = (Math.PI * 2 * index) / safePackSize
    let spawnX = centerX + Math.cos(angle) * ENEMY_PACK_SPACING
    let spawnY = centerY + Math.sin(angle) * ENEMY_PACK_SPACING

    // マージン外に出ないようクランプ
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

    positions.push({ x: spawnX, y: spawnY })
  }

  return positions
}

/**
 * ステージ番号から HP・速度・近接/射撃を決めて1体出す内部ヘルパー。
 */
function spawnOneEnemyAtPosition(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  stageNumber: number,
  totalStages: number,
  spawnX: number,
  spawnY: number,
  enemyKind: EnemyKind,
): void {
  const enemyHp = calculateEnemyHpForStage(stageNumber, totalStages)

  if (enemyKind === 'ranged') {
    const rangedEnemyHp = calculateRangedEnemyHpForStage(stageNumber, totalStages)
    spawnRangedEnemy(
      scene,
      enemyGroup,
      spawnX,
      spawnY,
      rangedEnemyHp,
      calculateRangedEnemySpeedForStage(stageNumber, totalStages),
    )
    return
  }

  if (enemyKind === 'toughMelee') {
    spawnToughMeleeEnemy(
      scene,
      enemyGroup,
      spawnX,
      spawnY,
      calculateToughMeleeHp(),
      calculateToughMeleeSpeed(),
    )
    return
  }

  // キノコは緑スライムと同じ HP・速度
  if (enemyKind === 'mushroom') {
    spawnMushroomEnemy(
      scene,
      enemyGroup,
      spawnX,
      spawnY,
      enemyHp,
      calculateEnemySpeedForStage(stageNumber, totalStages),
    )
    return
  }

  // 土スライムは緑スライムと同じ HP・速度
  if (enemyKind === 'earthSlime') {
    spawnEarthSlimeEnemy(
      scene,
      enemyGroup,
      spawnX,
      spawnY,
      enemyHp,
      calculateEnemySpeedForStage(stageNumber, totalStages),
    )
    return
  }

  // 岩敵は固定 HP5・やや遅い追跡速度
  if (enemyKind === 'earthRock') {
    spawnEarthRockEnemy(
      scene,
      enemyGroup,
      spawnX,
      spawnY,
      calculateEarthRockSpeed(stageNumber, totalStages),
    )
    return
  }

  // マグマ岩は固定 HP18・スライム×0.55・6方向放射
  if (enemyKind === 'earthMagmaRock') {
    spawnEarthMagmaRockEnemy(
      scene,
      enemyGroup,
      spawnX,
      spawnY,
      calculateEarthMagmaRockSpeed(stageNumber, totalStages),
    )
    return
  }

  // 火の精霊は緑スライムと同じ HP・速度
  if (enemyKind === 'spiritFire') {
    spawnSpiritFireEnemy(
      scene,
      enemyGroup,
      spawnX,
      spawnY,
      enemyHp,
      calculateEnemySpeedForStage(stageNumber, totalStages),
    )
    return
  }

  // Stone Guard は固定 HP・遅い追跡速度
  if (enemyKind === 'stoneGuard') {
    spawnStoneGuardEnemy(
      scene,
      enemyGroup,
      spawnX,
      spawnY,
      calculateStoneGuardSpeed(stageNumber, totalStages),
    )
    return
  }

  // 雷の精霊は HP 固定3・速度はプレイヤー初期速度
  if (enemyKind === 'spiritThunder') {
    spawnSpiritThunderEnemy(scene, enemyGroup, spawnX, spawnY)
    return
  }

  // 燃え木は HP 固定8・速度は切り株と同じ
  if (enemyKind === 'burningTree') {
    spawnBurningTreeEnemy(scene, enemyGroup, spawnX, spawnY)
    return
  }

  // 灰騎士は HP 固定6・速度は緑スライムと同じ
  if (enemyKind === 'ashKnight') {
    spawnAshKnightEnemy(
      scene,
      enemyGroup,
      spawnX,
      spawnY,
      calculateEnemySpeedForStage(stageNumber, totalStages),
    )
    return
  }

  // 混沌エレメンタルは開始時専用（ウェーブからは出さない）
  if (enemyKind === 'chaosElemental') {
    spawnChaosElementalEnemy(scene, enemyGroup, spawnX, spawnY)
    return
  }

  // 切り株は HP 固定7・速度は泥スライムの半分
  if (enemyKind === 'stump') {
    spawnStumpEnemy(
      scene,
      enemyGroup,
      spawnX,
      spawnY,
      calculateStumpSpeed(),
    )
    return
  }

  // カブトムシは HP 固定・速度は緑スライムと同じ
  if (enemyKind === 'beetle') {
    spawnBeetleEnemy(
      scene,
      enemyGroup,
      spawnX,
      spawnY,
      calculateEnemySpeedForStage(stageNumber, totalStages),
    )
    return
  }

  // Earth Dungeon Stage3 スケルトンは HP 固定10・突進はカブトムシと同じ
  if (enemyKind === 'earthSkeleton') {
    spawnEarthSkeletonEnemy(
      scene,
      enemyGroup,
      spawnX,
      spawnY,
      calculateEnemySpeedForStage(stageNumber, totalStages),
    )
    return
  }

  // 枝は HP 固定6・速度は緑スライムより遅い
  if (enemyKind === 'branch') {
    spawnBranchEnemy(
      scene,
      enemyGroup,
      spawnX,
      spawnY,
      calculateBranchSpeed(stageNumber, totalStages),
    )
    return
  }

  if (enemyKind !== 'melee') {
    let color = ENEMY_RUNNER_COLOR
    let specialSpeed = calculateEnemySpeedForStage(stageNumber, totalStages)
    let specialHp = enemyHp

    if (enemyKind === 'runner') {
      specialSpeed = Math.max(
        ENEMY_RUNNER_MIN_SPEED,
        specialSpeed * ENEMY_RUNNER_SPEED_MULTIPLIER,
      )
      // ステージ5の高HP補正を受けず、初期の通常弾2発で倒せる
      specialHp = ENEMY_RUNNER_HP
    } else if (enemyKind === 'charger') {
      color = ENEMY_CHARGER_COLOR
    } else if (enemyKind === 'armored') {
      color = ENEMY_ARMORED_COLOR
      specialHp = Math.max(1, Math.round(enemyHp * 1.25))
    } else if (enemyKind === 'shielded') {
      color = ENEMY_SHIELDED_COLOR
    }

    spawnEnemyCommon(
      scene,
      enemyGroup,
      spawnX,
      spawnY,
      specialHp,
      specialSpeed,
      color,
      false,
      enemyKind,
    )
    return
  }

  spawnMeleeEnemy(
    scene,
    enemyGroup,
    spawnX,
    spawnY,
    enemyHp,
    calculateEnemySpeedForStage(stageNumber, totalStages),
  )
}

/**
 * 近い位置に複数体を同時警告→同時出現させる（貫通のありがたさ用）。
 *
 * 流れ:
 * 1. ランダム中心 + 円状オフセットで位置リスト作成
 * 2. パック全体で近接か射撃かを一度だけ決定（shouldSpawnRangedEnemy）
 * 3. 半透明マーカーを点滅表示
 * 4. ENEMY_SPAWN_WARNING_SECONDS 後にマーカー破棄→実体スポーン
 *
 * @param onSpawnFinished 実体出現直後のコールバック（WaveSystem の進行管理用）
 * @returns キャンセル用のタイマー参照
 */
export function startEnemyPackSpawnWithWarning(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  stageNumber: number,
  totalStages: number,
  packSize: number,
  onSpawnFinished?: () => void,
  areaId: StageAreaId = 'plains',
  playerPosition?: SpawnPosition,
  // WaveSystem がスケジュール時に決めた種類。省略時はここで再抽選する
  forcedSpawnAsRanged?: boolean,
): SpawnWarningTimers {
  const center = getRandomInsideSpawnPosition(playerPosition)
  let positions = buildPackPositionsAroundCenter(center.x, center.y, packSize)
  // Volcano Stage2 以降は固まりではなく、画面内のランダム位置へ散らして出す
  // （跳弾が生きる。Stage1 は従来どおり群れ）
  if (shouldScatterVolcanoEnemySpawns(areaId, stageNumber)) {
    positions = []
    for (let index = 0; index < packSize; index++) {
      positions.push(getRandomInsideSpawnPosition(playerPosition))
    }
  }
  // Ruins Stage3 は固まりを避け、スポーン同士も一定距離以上離す
  if (shouldScatterRuinsStage3EnemySpawns(areaId, stageNumber)) {
    positions = []
    for (let index = 0; index < packSize; index++) {
      positions.push(getRandomScatteredSpawnPosition(playerPosition, positions))
    }
  }
  // パック全体で近接か射撃かを一度だけ決める（先に決まっていればそれを使う）
  let spawnAsRanged = shouldSpawnRangedEnemy(stageNumber, totalStages)
  if (forcedSpawnAsRanged !== undefined) {
    spawnAsRanged = forcedSpawnAsRanged
  }
  const packEnemyKinds = buildPackEnemyKinds(
    areaId,
    stageNumber,
    totalStages,
    spawnAsRanged,
    positions.length,
    enemyGroup,
  )
  const isForestMixedStage = isForestFinalStage(areaId, stageNumber, totalStages)
  const representativeKind = packEnemyKinds[0]

  function getWarningColorForKind(enemyKind: EnemyKind): number {
    if (enemyKind === 'ranged') {
      return ENEMY_RANGED_COLOR
    }
    if (enemyKind === 'toughMelee') {
      return ENEMY_TOUGH_MELEE_COLOR
    }
    if (enemyKind === 'mushroom') {
      return ENEMY_MUSHROOM_COLOR
    }
    if (enemyKind === 'earthSlime') {
      return ENEMY_EARTH_SLIME_COLOR
    }
    if (enemyKind === 'earthRock') {
      return ENEMY_EARTH_ROCK_COLOR
    }
    if (enemyKind === 'earthMagmaRock') {
      return ENEMY_EARTH_MAGMA_ROCK_COLOR
    }
    if (enemyKind === 'earthSkeleton') {
      return ENEMY_EARTH_SKELETON_COLOR
    }
    if (enemyKind === 'spiritFire') {
      return ENEMY_SPIRIT_FIRE_COLOR
    }
    if (enemyKind === 'spiritThunder') {
      return ENEMY_SPIRIT_THUNDER_COLOR
    }
    if (enemyKind === 'burningTree') {
      return ENEMY_BURNING_TREE_COLOR
    }
    if (enemyKind === 'ashKnight') {
      return ENEMY_ASH_KNIGHT_COLOR
    }
    if (enemyKind === 'chaosElemental') {
      return ENEMY_CHAOS_ELEMENTAL_COLOR
    }
    if (enemyKind === 'stump') {
      return ENEMY_STUMP_COLOR
    }
    if (enemyKind === 'beetle') {
      return ENEMY_BEETLE_COLOR
    }
    if (enemyKind === 'branch') {
      return ENEMY_BRANCH_COLOR
    }
    if (enemyKind === 'stoneGuard') {
      return ENEMY_STONE_GUARD_COLOR
    }
    if (enemyKind === 'runner') {
      return ENEMY_RUNNER_COLOR
    }
    if (enemyKind === 'charger') {
      return ENEMY_CHARGER_COLOR
    }
    if (enemyKind === 'armored') {
      return ENEMY_ARMORED_COLOR
    }
    if (enemyKind === 'shielded') {
      return ENEMY_SHIELDED_COLOR
    }
    return ENEMY_SPAWN_WARNING_COLOR
  }

  function usesCharacterWarningMarker(enemyKind: EnemyKind): boolean {
    if (ENEMY_BREATHING_SPRITES_ENABLED) {
      return (
        enemyKind === 'melee' ||
        enemyKind === 'toughMelee' ||
        enemyKind === 'mushroom' ||
        enemyKind === 'earthSlime' ||
        enemyKind === 'earthRock' ||
        enemyKind === 'earthMagmaRock' ||
        enemyKind === 'earthSkeleton' ||
        enemyKind === 'spiritFire' ||
        enemyKind === 'spiritThunder' ||
        enemyKind === 'burningTree' ||
        enemyKind === 'ashKnight' ||
        enemyKind === 'chaosElemental' ||
        enemyKind === 'stump' ||
        enemyKind === 'beetle' ||
        enemyKind === 'branch' ||
        enemyKind === 'ranged'
      )
    }
    if (ENEMY_WALK_SPRITES_ENABLED) {
      return (
        enemyKind === 'melee' ||
        enemyKind === 'toughMelee' ||
        enemyKind === 'mushroom' ||
        enemyKind === 'earthSlime' ||
        enemyKind === 'earthRock' ||
        enemyKind === 'earthMagmaRock' ||
        enemyKind === 'earthSkeleton' ||
        enemyKind === 'spiritFire' ||
        enemyKind === 'spiritThunder' ||
        enemyKind === 'burningTree' ||
        enemyKind === 'ashKnight' ||
        enemyKind === 'chaosElemental' ||
        enemyKind === 'stump' ||
        enemyKind === 'beetle' ||
        enemyKind === 'branch' ||
        enemyKind === 'ranged'
      )
    }
    return false
  }

  const useCharacterWarningMarker =
    isForestMixedStage ||
    usesCharacterWarningMarker(representativeKind)
  const warningDurationMs = ENEMY_SPAWN_WARNING_SECONDS * 1000
  // 3回の出現 = フェードイン+アウトを3セット（1セット = duration×2）
  const characterFadeDurationMs = warningDurationMs / 6

  const warningMarkers: Phaser.GameObjects.GameObject[] = []
  for (let index = 0; index < positions.length; index++) {
    const enemyKind = packEnemyKinds[index]
    if (useCharacterWarningMarker) {
      let spriteKey = ENEMY_SLIME_WALK_SPRITE_KEY
      let displayHeight = ENEMY_SLIME_DISPLAY_SIZE
      let useBreathImage = false

      if (enemyKind === 'ranged' && ENEMY_BREATHING_SPRITES_ENABLED) {
        spriteKey = ENEMY_BEE_BREATH_SPRITE_KEY
        displayHeight = ENEMY_BEE_BREATH_DISPLAY_HEIGHT
        useBreathImage = true
      } else if (enemyKind === 'ranged') {
        spriteKey = ENEMY_SNAKE_WALK_SPRITE_KEY
        displayHeight = ENEMY_SNAKE_DISPLAY_SIZE
      } else if (enemyKind === 'toughMelee' && ENEMY_BREATHING_SPRITES_ENABLED) {
        spriteKey = ENEMY_SLIME_MUD_BREATH_SPRITE_KEY
        displayHeight = ENEMY_SLIME_MUD_BREATH_DISPLAY_HEIGHT
        useBreathImage = true
      } else if (enemyKind === 'mushroom' && ENEMY_BREATHING_SPRITES_ENABLED) {
        spriteKey = ENEMY_MUSHROOM_BREATH_SPRITE_KEY
        displayHeight = ENEMY_MUSHROOM_BREATH_DISPLAY_HEIGHT
        useBreathImage = true
      } else if (enemyKind === 'earthSlime' && ENEMY_BREATHING_SPRITES_ENABLED) {
        spriteKey = ENEMY_EARTH_SLIME_BREATH_SPRITE_KEY
        displayHeight = ENEMY_EARTH_SLIME_BREATH_DISPLAY_HEIGHT
        useBreathImage = true
      } else if (enemyKind === 'earthRock' && ENEMY_BREATHING_SPRITES_ENABLED) {
        spriteKey = ENEMY_EARTH_ROCK_BREATH_SPRITE_KEY
        displayHeight = ENEMY_EARTH_ROCK_BREATH_DISPLAY_HEIGHT
        useBreathImage = true
      } else if (enemyKind === 'earthMagmaRock' && ENEMY_BREATHING_SPRITES_ENABLED) {
        spriteKey = ENEMY_EARTH_MAGMA_ROCK_BREATH_SPRITE_KEY
        displayHeight = ENEMY_EARTH_MAGMA_ROCK_BREATH_DISPLAY_HEIGHT
        useBreathImage = true
      } else if (enemyKind === 'earthSkeleton' && ENEMY_BREATHING_SPRITES_ENABLED) {
        spriteKey = ENEMY_EARTH_SKELETON_BREATH_SPRITE_KEY
        displayHeight = ENEMY_EARTH_SKELETON_BREATH_DISPLAY_HEIGHT
        useBreathImage = true
      } else if (enemyKind === 'spiritFire' && ENEMY_BREATHING_SPRITES_ENABLED) {
        spriteKey = ENEMY_SPIRIT_FIRE_BREATH_SPRITE_KEY
        displayHeight = ENEMY_SPIRIT_FIRE_BREATH_DISPLAY_HEIGHT
        useBreathImage = true
      } else if (enemyKind === 'spiritThunder' && ENEMY_BREATHING_SPRITES_ENABLED) {
        spriteKey = ENEMY_SPIRIT_THUNDER_BREATH_SPRITE_KEY
        displayHeight = ENEMY_SPIRIT_THUNDER_BREATH_DISPLAY_HEIGHT
        useBreathImage = true
      } else if (enemyKind === 'burningTree' && ENEMY_BREATHING_SPRITES_ENABLED) {
        spriteKey = ENEMY_BURNING_TREE_BREATH_SPRITE_KEY
        displayHeight = ENEMY_BURNING_TREE_BREATH_DISPLAY_HEIGHT
        useBreathImage = true
      } else if (enemyKind === 'ashKnight' && ENEMY_BREATHING_SPRITES_ENABLED) {
        spriteKey = ENEMY_ASH_KNIGHT_BREATH_SPRITE_KEY
        displayHeight = ENEMY_ASH_KNIGHT_BREATH_DISPLAY_HEIGHT
        useBreathImage = true
      } else if (enemyKind === 'chaosElemental' && ENEMY_BREATHING_SPRITES_ENABLED) {
        spriteKey = ENEMY_CHAOS_ELEMENTAL_BREATH_SPRITE_KEY
        displayHeight = ENEMY_CHAOS_ELEMENTAL_BREATH_DISPLAY_HEIGHT
        useBreathImage = true
      } else if (enemyKind === 'stump' && ENEMY_BREATHING_SPRITES_ENABLED) {
        spriteKey = ENEMY_STUMP_BREATH_SPRITE_KEY
        displayHeight = ENEMY_STUMP_BREATH_DISPLAY_HEIGHT
        useBreathImage = true
      } else if (enemyKind === 'beetle' && ENEMY_BREATHING_SPRITES_ENABLED) {
        spriteKey = ENEMY_BEETLE_BREATH_SPRITE_KEY
        displayHeight = ENEMY_BEETLE_BREATH_DISPLAY_HEIGHT
        useBreathImage = true
      } else if (enemyKind === 'branch' && ENEMY_BREATHING_SPRITES_ENABLED) {
        spriteKey = ENEMY_BRANCH_BREATH_SPRITE_KEY
        displayHeight = ENEMY_BRANCH_BREATH_DISPLAY_HEIGHT
        useBreathImage = true
      } else if (ENEMY_BREATHING_SPRITES_ENABLED) {
        spriteKey = ENEMY_SLIME_BREATH_SPRITE_KEY
        displayHeight = ENEMY_SLIME_BREATH_DISPLAY_HEIGHT
        useBreathImage = true
      }

      const marker = scene.add.image(positions[index].x, positions[index].y, spriteKey)
      if (useBreathImage) {
        // 静止PNGは高さ基準で拡縮する
        const source = scene.textures.get(spriteKey).getSourceImage() as
          | HTMLImageElement
          | HTMLCanvasElement
        marker.setScale(displayHeight / source.height)
      } else {
        const frameSize =
          enemyKind === 'ranged' ? ENEMY_SNAKE_WALK_FRAME_SIZE : ENEMY_SLIME_WALK_FRAME_SIZE
        marker.setScale(displayHeight / frameSize)
      }
      marker.setDepth(7)
      marker.setAlpha(0)
      scene.tweens.add({
        targets: marker,
        alpha: 0.9,
        duration: characterFadeDurationMs,
        yoyo: true,
        repeat: 2,
        ease: 'Quad.InOut',
      })
      warningMarkers.push(marker)
      continue
    }

    const warningColor = getWarningColorForKind(enemyKind)
    const marker = scene.add.rectangle(
      positions[index].x,
      positions[index].y,
      ENEMY_WIDTH,
      ENEMY_HEIGHT,
      warningColor,
      0.6,
    )
    marker.setDepth(7)
    warningMarkers.push(marker)
  }

  const blinkTimer = scene.time.addEvent({
    delay: ENEMY_SPAWN_WARNING_BLINK_INTERVAL_MS,
    loop: true,
    callback: () => {
      // キャラクター予告は Tween 側で表現するため、ここでは何もしない
      if (useCharacterWarningMarker) {
        return
      }
      for (let index = 0; index < warningMarkers.length; index++) {
        const marker = warningMarkers[index] as Phaser.GameObjects.Rectangle
        if (marker.active) {
          marker.setVisible(!marker.visible)
        }
      }
    },
  })

  const spawnTimer = scene.time.delayedCall(warningDurationMs, () => {
    blinkTimer.destroy()

    for (let index = 0; index < warningMarkers.length; index++) {
      scene.tweens.killTweensOf(warningMarkers[index])
      warningMarkers[index].destroy()
    }

    for (let index = 0; index < positions.length; index++) {
      spawnOneEnemyAtPosition(
        scene,
        enemyGroup,
        stageNumber,
        totalStages,
        positions[index].x,
        positions[index].y,
        packEnemyKinds[index],
      )
    }

    if (onSpawnFinished !== undefined) {
      onSpawnFinished()
    }
  })

  return { blinkTimer, spawnTimer }
}

/**
 * 1体出現の警告付きスポーン（単体が必要なときの互換ラッパー）。
 * 中身は packSize=1 の startEnemyPackSpawnWithWarning。
 */
export function startEnemySpawnWithWarning(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  stageNumber: number,
  totalStages: number,
  onSpawnFinished?: () => void,
): SpawnWarningTimers {
  return startEnemyPackSpawnWithWarning(
    scene,
    enemyGroup,
    stageNumber,
    totalStages,
    1,
    onSpawnFinished,
  )
}

/**
 * 後方互換: 近接用の名前でも同じスポーン処理を呼ぶ。
 * （昔は近接専用だった呼び出し名を残している）
 */
export function startMeleeEnemySpawnWithWarning(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  stageNumber: number,
  totalStages: number,
  onSpawnFinished?: () => void,
): SpawnWarningTimers {
  return startEnemySpawnWithWarning(
    scene,
    enemyGroup,
    stageNumber,
    totalStages,
    onSpawnFinished,
  )
}

