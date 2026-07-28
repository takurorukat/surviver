/**
 * 近接・射撃共通の敵生成処理。
 */
import Phaser from 'phaser'
import {
  ENEMY_ARMORED_MIN_DAMAGE,
  ENEMY_ASH_KNIGHT_BLOCK_HIT_COUNT,
  ENEMY_EARTH_ROCK_BLOCK_HIT_COUNT,
  ENEMY_EARTH_ROCK_HEIGHT,
  ENEMY_EARTH_ROCK_PEBBLE_INTERVAL_MS,
  ENEMY_EARTH_ROCK_RADIUS,
  ENEMY_EARTH_ROCK_WIDTH,
  ENEMY_ASH_KNIGHT_HEIGHT,
  ENEMY_ASH_KNIGHT_RADIUS,
  ENEMY_ASH_KNIGHT_WIDTH,
  ENEMY_ASH_KNIGHT_XP_DROP_MULTIPLIER,
  ENEMY_BEETLE_HEIGHT,
  ENEMY_BEETLE_RADIUS,
  ENEMY_BEETLE_WIDTH,
  ENEMY_BEETLE_XP_DROP_MULTIPLIER,
  ENEMY_EARTH_SKELETON_HEIGHT,
  ENEMY_EARTH_SKELETON_RADIUS,
  ENEMY_EARTH_SKELETON_WIDTH,
  ENEMY_EARTH_SKELETON_XP_DROP_MULTIPLIER,
  ENEMY_BRANCH_BEETLE_SPAWN_INTERVAL_MS,
  ENEMY_BRANCH_BLAST_DAMAGE_MULTIPLIER,
  ENEMY_BRANCH_HEIGHT,
  ENEMY_BRANCH_RADIUS,
  ENEMY_BRANCH_WIDTH,
  ENEMY_BRANCH_XP_DROP_MULTIPLIER,
  ENEMY_BREATHING_SPRITES_ENABLED,
  ENEMY_BURNING_TREE_HEIGHT,
  ENEMY_BURNING_TREE_RADIUS,
  ENEMY_BURNING_TREE_SPAWN_INTERVAL_MAX_MS,
  ENEMY_BURNING_TREE_SPAWN_INTERVAL_MIN_MS,
  ENEMY_BURNING_TREE_WIDTH,
  ENEMY_BURNING_TREE_XP_DROP_MULTIPLIER,
  ENEMY_CHAOS_ELEMENTAL_HEIGHT,
  ENEMY_CHAOS_ELEMENTAL_RADIUS,
  ENEMY_CHAOS_ELEMENTAL_SPAWN_INTERVAL_MS,
  ENEMY_CHAOS_ELEMENTAL_WIDTH,
  ENEMY_CHAOS_ELEMENTAL_XP_DROP_MULTIPLIER,
  ENEMY_GRAVESTONE_SPAWN_INTERVAL_MS,
  ENEMY_GRAVESTONE_XP_DROP_MULTIPLIER,
  ENEMY_HEIGHT,
  ENEMY_MUSHROOM_HEIGHT,
  ENEMY_MUSHROOM_RADIUS,
  ENEMY_MUSHROOM_WIDTH,
  ENEMY_EARTH_SLIME_HEIGHT,
  ENEMY_EARTH_SLIME_RADIUS,
  ENEMY_EARTH_SLIME_WIDTH,
  ENEMY_RADIUS,
  ENEMY_RANGED_ATTACK_INTERVAL_MS,
  ENEMY_SPECIAL_STROKE_COLOR,
  ENEMY_SPECIAL_STROKE_WIDTH,
  ENEMY_SPIRIT_FIRE_HEIGHT,
  ENEMY_SPIRIT_FIRE_RADIUS,
  ENEMY_SPIRIT_FIRE_WIDTH,
  ENEMY_SPIRIT_THUNDER_HEIGHT,
  ENEMY_SPIRIT_THUNDER_RADIUS,
  ENEMY_SPIRIT_THUNDER_WIDTH,
  ENEMY_STUMP_HEIGHT,
  ENEMY_STUMP_MUSHROOM_SPAWN_INTERVAL_MS,
  ENEMY_STUMP_RADIUS,
  ENEMY_STUMP_WIDTH,
  ENEMY_WALK_SPRITES_ENABLED,
  ENEMY_WIDTH,
} from '../../GameConstants'
import { setupCircleHitbox } from '../../utils/setupCircleHitbox'
import { configureArcadeBodyForConstantSpeed } from '../../utils/arcadePhysicsHelpers'
import { applyDevEntityDepth } from '../../utils/applyDevEntityDepth'
import { type EnemyKind } from './types'
import { allocateNextEnemyUid } from './enemyInternal'
import { attachEnemyHpBar } from './enemyHpBar'
import {
  attachSlimeBreathingSprite,
  attachBeeBreathingSprite,
  attachMudSlimeBreathingSprite,
  attachMushroomBreathingSprite,
  attachEarthSlimeBreathingSprite,
  attachEarthRockBreathingSprite,
  attachSpiritFireBreathingSprite,
  attachSpiritThunderBreathingSprite,
  attachBurningTreeBreathingSprite,
  attachAshKnightBreathingSprite,
  attachChaosElementalBreathingSprite,
  attachStumpBreathingSprite,
  attachBeetleBreathingSprite,
  attachEarthSkeletonBreathingSprite,
  attachBranchBreathingSprite,
  attachGravestoneBreathingSprite,
  attachSlimeWalkSprite,
  attachSnakeWalkSprite,
  attachChargerWalkSprite,
  attachArmoredWalkSprite,
} from './enemySprites'

export function pickBurningTreeSpawnIntervalMs(): number {
  return Phaser.Math.Between(
    ENEMY_BURNING_TREE_SPAWN_INTERVAL_MIN_MS,
    ENEMY_BURNING_TREE_SPAWN_INTERVAL_MAX_MS,
  )
}

/**
 * 燃え木が 3〜5 秒ごとに火の精霊（Volcano Stage1 の敵）を1体出す。
 * 敵数上限いっぱいのときはスキップし、次の間隔まで待つ。

/**
 * 近接・射撃共通の生成処理（色と isRanged フラグだけ違う）。
 * 公開 API は spawnMeleeEnemy / spawnRangedEnemy。
 */
export function spawnEnemyCommon(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  spawnX: number,
  spawnY: number,
  hp: number,
  speed: number,
  color: number,
  isRanged: boolean,
  enemyKind: EnemyKind,
): Phaser.GameObjects.Rectangle {
  let hitboxWidth = ENEMY_WIDTH
  let hitboxHeight = ENEMY_HEIGHT
  let hitboxRadius = ENEMY_RADIUS
  if (enemyKind === 'mushroom') {
    hitboxWidth = ENEMY_MUSHROOM_WIDTH
    hitboxHeight = ENEMY_MUSHROOM_HEIGHT
    hitboxRadius = ENEMY_MUSHROOM_RADIUS
  } else if (enemyKind === 'earthSlime') {
    hitboxWidth = ENEMY_EARTH_SLIME_WIDTH
    hitboxHeight = ENEMY_EARTH_SLIME_HEIGHT
    hitboxRadius = ENEMY_EARTH_SLIME_RADIUS
  } else if (enemyKind === 'spiritFire') {
    hitboxWidth = ENEMY_SPIRIT_FIRE_WIDTH
    hitboxHeight = ENEMY_SPIRIT_FIRE_HEIGHT
    hitboxRadius = ENEMY_SPIRIT_FIRE_RADIUS
  } else if (enemyKind === 'spiritThunder') {
    hitboxWidth = ENEMY_SPIRIT_THUNDER_WIDTH
    hitboxHeight = ENEMY_SPIRIT_THUNDER_HEIGHT
    hitboxRadius = ENEMY_SPIRIT_THUNDER_RADIUS
  } else if (enemyKind === 'stump') {
    hitboxWidth = ENEMY_STUMP_WIDTH
    hitboxHeight = ENEMY_STUMP_HEIGHT
    hitboxRadius = ENEMY_STUMP_RADIUS
  } else if (enemyKind === 'burningTree') {
    hitboxWidth = ENEMY_BURNING_TREE_WIDTH
    hitboxHeight = ENEMY_BURNING_TREE_HEIGHT
    hitboxRadius = ENEMY_BURNING_TREE_RADIUS
  } else if (enemyKind === 'ashKnight') {
    hitboxWidth = ENEMY_ASH_KNIGHT_WIDTH
    hitboxHeight = ENEMY_ASH_KNIGHT_HEIGHT
    hitboxRadius = ENEMY_ASH_KNIGHT_RADIUS
  } else if (enemyKind === 'earthRock') {
    hitboxWidth = ENEMY_EARTH_ROCK_WIDTH
    hitboxHeight = ENEMY_EARTH_ROCK_HEIGHT
    hitboxRadius = ENEMY_EARTH_ROCK_RADIUS
  } else if (enemyKind === 'chaosElemental') {
    hitboxWidth = ENEMY_CHAOS_ELEMENTAL_WIDTH
    hitboxHeight = ENEMY_CHAOS_ELEMENTAL_HEIGHT
    hitboxRadius = ENEMY_CHAOS_ELEMENTAL_RADIUS
  } else if (enemyKind === 'branch') {
    hitboxWidth = ENEMY_BRANCH_WIDTH
    hitboxHeight = ENEMY_BRANCH_HEIGHT
    hitboxRadius = ENEMY_BRANCH_RADIUS
  } else if (enemyKind === 'beetle') {
    hitboxWidth = ENEMY_BEETLE_WIDTH
    hitboxHeight = ENEMY_BEETLE_HEIGHT
    hitboxRadius = ENEMY_BEETLE_RADIUS
  } else if (enemyKind === 'earthSkeleton') {
    hitboxWidth = ENEMY_EARTH_SKELETON_WIDTH
    hitboxHeight = ENEMY_EARTH_SKELETON_HEIGHT
    hitboxRadius = ENEMY_EARTH_SKELETON_RADIUS
  }

  const enemy = scene.add.rectangle(spawnX, spawnY, hitboxWidth, hitboxHeight, color)
  if (
    enemyKind !== 'melee' &&
    enemyKind !== 'toughMelee' &&
    enemyKind !== 'mushroom' &&
    enemyKind !== 'earthSlime' &&
    enemyKind !== 'earthRock' &&
    enemyKind !== 'spiritFire' &&
    enemyKind !== 'spiritThunder' &&
    enemyKind !== 'burningTree' &&
    enemyKind !== 'ashKnight' &&
    enemyKind !== 'chaosElemental' &&
    enemyKind !== 'stump' &&
    enemyKind !== 'beetle' &&
    enemyKind !== 'earthSkeleton' &&
    enemyKind !== 'branch' &&
    enemyKind !== 'gravestone' &&
    enemyKind !== 'ranged'
  ) {
    enemy.setStrokeStyle(ENEMY_SPECIAL_STROKE_WIDTH, ENEMY_SPECIAL_STROKE_COLOR)
  }

  scene.physics.add.existing(enemy)
  // 注意: Group.add はボディ設定をグループ初期値で上書きするため、
  // 必ず「グループに追加してから」ボディを設定する
  // （以前は追加が後だったので collideWorldBounds が毎回無効に戻っていた）
  enemyGroup.add(enemy)

  const body = enemy.body as Phaser.Physics.Arcade.Body
  // 全種類の敵に共通の「画面外に出ない」上位ルール。
  // 個別の移動ロジック（追尾・突進・後退など）がどんな速度を設定しても、
  // 物理エンジンがワールド境界（= プレイエリア）で必ず止める。
  body.setCollideWorldBounds(true)
  body.setImmovable(true)
  body.moves = true
  body.setVelocity(0, 0)
  setupCircleHitbox(body, hitboxRadius, hitboxWidth, hitboxHeight)
  configureArcadeBodyForConstantSpeed(body, speed)

  const safeHp = Math.max(1, Math.round(hp))
  // 以降の System が読むランタイム状態（Phaser の setData = オブジェクト付属の辞書）
  enemy.setData('hp', safeHp)
  enemy.setData('maxHp', safeHp)
  enemy.setData('speed', speed)
  enemy.setData('normalSpeed', speed)
  enemy.setData('isMelee', !isRanged)
  enemy.setData('isRanged', isRanged)
  enemy.setData('enemyKind', enemyKind)
  if (enemyKind === 'beetle') {
    enemy.setData('xpDropMultiplier', ENEMY_BEETLE_XP_DROP_MULTIPLIER)
  } else if (enemyKind === 'earthSkeleton') {
    enemy.setData('xpDropMultiplier', ENEMY_EARTH_SKELETON_XP_DROP_MULTIPLIER)
  } else if (enemyKind === 'branch') {
    enemy.setData('xpDropMultiplier', ENEMY_BRANCH_XP_DROP_MULTIPLIER)
  } else if (enemyKind === 'gravestone') {
    enemy.setData('xpDropMultiplier', ENEMY_GRAVESTONE_XP_DROP_MULTIPLIER)
  } else if (enemyKind === 'burningTree') {
    enemy.setData('xpDropMultiplier', ENEMY_BURNING_TREE_XP_DROP_MULTIPLIER)
  } else if (enemyKind === 'ashKnight') {
    enemy.setData('xpDropMultiplier', ENEMY_ASH_KNIGHT_XP_DROP_MULTIPLIER)
  } else if (enemyKind === 'chaosElemental') {
    enemy.setData('xpDropMultiplier', ENEMY_CHAOS_ELEMENTAL_XP_DROP_MULTIPLIER)
  } else {
    enemy.setData('xpDropMultiplier', 1)
  }
  if (enemyKind === 'branch') {
    enemy.setData('blastDamageMultiplier', ENEMY_BRANCH_BLAST_DAMAGE_MULTIPLIER)
  } else {
    enemy.setData('blastDamageMultiplier', 1)
  }
  enemy.setData('minimumDamage', enemyKind === 'armored' ? ENEMY_ARMORED_MIN_DAMAGE : 0)
  if (enemyKind === 'charger') {
    enemy.setData('isCharging', false)
    enemy.setData('chargeEndsAtMs', 0)
    enemy.setData('nextChargeAtMs', 0)
    enemy.setData('chargeDirectionX', 0)
    enemy.setData('chargeDirectionY', 0)
  }
  if (enemyKind === 'beetle' || enemyKind === 'spiritThunder' || enemyKind === 'earthSkeleton') {
    // カブトムシと同じ: 溜め → 一直線突進（雷の精霊・スケルトンも同じ動き）
    enemy.setData('beetleWindupEndsAtMs', 0)
    enemy.setData('beetleChargeEndsAtMs', 0)
    enemy.setData('beetleNextChargeAtMs', 0)
    enemy.setData('beetleChargeDirectionX', 0)
    enemy.setData('beetleChargeDirectionY', 0)
  }
  enemy.setData('isDefeated', false)
  enemy.setData('enemyUid', allocateNextEnemyUid())
  if (isRanged) {
    // 出現直後はすぐ撃たず、1間隔待つ（EnemyAttackSystem が nextShotAtMs を見る）
    enemy.setData('nextShotAtMs', scene.time.now + ENEMY_RANGED_ATTACK_INTERVAL_MS)
  }
  if (enemyKind === 'stump') {
    // 出現直後はすぐ出さず、3秒後からキノコを出す
    enemy.setData(
      'nextMushroomSpawnAtMs',
      scene.time.now + ENEMY_STUMP_MUSHROOM_SPAWN_INTERVAL_MS,
    )
  }
  if (enemyKind === 'burningTree') {
    // 出現直後はすぐ出さず、3〜5秒後から火の精霊を出す
    enemy.setData(
      'nextSpiritFireSpawnAtMs',
      scene.time.now + pickBurningTreeSpawnIntervalMs(),
    )
  }
  if (enemyKind === 'ashKnight') {
    // 最初の2発はシールドで無効
    enemy.setData('remainingBlockHits', ENEMY_ASH_KNIGHT_BLOCK_HIT_COUNT)
  }
  if (enemyKind === 'earthRock') {
    // 最初の1発はシールドで無効
    enemy.setData('remainingBlockHits', ENEMY_EARTH_ROCK_BLOCK_HIT_COUNT)
    enemy.setData(
      'nextPebbleShotAtMs',
      scene.time.now + ENEMY_EARTH_ROCK_PEBBLE_INTERVAL_MS,
    )
  }
  if (enemyKind === 'chaosElemental') {
    enemy.setData('isStationary', true)
    // 出現直後はすぐ出さず、2秒後から下位ステージの敵を出す
    enemy.setData(
      'nextChaosElementalSpawnAtMs',
      scene.time.now + ENEMY_CHAOS_ELEMENTAL_SPAWN_INTERVAL_MS,
    )
  }
  if (enemyKind === 'branch') {
    // 出現直後はすぐ出さず、1秒後からカブトムシを出す
    enemy.setData(
      'nextBranchBeetleSpawnAtMs',
      scene.time.now + ENEMY_BRANCH_BEETLE_SPAWN_INTERVAL_MS,
    )
  }
  if (enemyKind === 'gravestone') {
    enemy.setData('isStationary', true)
    // 出現直後はすぐ出さず、3秒後から切り株と枝を出す
    enemy.setData(
      'nextGravestoneSpawnAtMs',
      scene.time.now + ENEMY_GRAVESTONE_SPAWN_INTERVAL_MS,
    )
  }
  enemy.setDepth(8)
  applyDevEntityDepth(enemy)

  body.updateFromGameObject()
  attachEnemyHpBar(scene, enemy)
  // 呼吸アニメ方式（新）→ 歩行シート方式（旧）の順で試す
  if (ENEMY_BREATHING_SPRITES_ENABLED && enemyKind === 'melee') {
    attachSlimeBreathingSprite(scene, enemy)
  } else if (ENEMY_BREATHING_SPRITES_ENABLED && enemyKind === 'toughMelee') {
    attachMudSlimeBreathingSprite(scene, enemy)
  } else if (ENEMY_BREATHING_SPRITES_ENABLED && enemyKind === 'mushroom') {
    attachMushroomBreathingSprite(scene, enemy)
  } else if (ENEMY_BREATHING_SPRITES_ENABLED && enemyKind === 'earthSlime') {
    attachEarthSlimeBreathingSprite(scene, enemy)
  } else if (ENEMY_BREATHING_SPRITES_ENABLED && enemyKind === 'earthRock') {
    attachEarthRockBreathingSprite(scene, enemy)
  } else if (ENEMY_BREATHING_SPRITES_ENABLED && enemyKind === 'spiritFire') {
    attachSpiritFireBreathingSprite(scene, enemy)
  } else if (ENEMY_BREATHING_SPRITES_ENABLED && enemyKind === 'spiritThunder') {
    attachSpiritThunderBreathingSprite(scene, enemy)
  } else if (ENEMY_BREATHING_SPRITES_ENABLED && enemyKind === 'burningTree') {
    attachBurningTreeBreathingSprite(scene, enemy)
  } else if (ENEMY_BREATHING_SPRITES_ENABLED && enemyKind === 'ashKnight') {
    attachAshKnightBreathingSprite(scene, enemy)
  } else if (ENEMY_BREATHING_SPRITES_ENABLED && enemyKind === 'chaosElemental') {
    attachChaosElementalBreathingSprite(scene, enemy)
  } else if (ENEMY_BREATHING_SPRITES_ENABLED && enemyKind === 'stump') {
    attachStumpBreathingSprite(scene, enemy)
  } else if (ENEMY_BREATHING_SPRITES_ENABLED && enemyKind === 'beetle') {
    attachBeetleBreathingSprite(scene, enemy)
  } else if (ENEMY_BREATHING_SPRITES_ENABLED && enemyKind === 'earthSkeleton') {
    attachEarthSkeletonBreathingSprite(scene, enemy)
  } else if (ENEMY_BREATHING_SPRITES_ENABLED && enemyKind === 'branch') {
    attachBranchBreathingSprite(scene, enemy)
  } else if (ENEMY_BREATHING_SPRITES_ENABLED && enemyKind === 'gravestone') {
    attachGravestoneBreathingSprite(scene, enemy)
  } else if (ENEMY_BREATHING_SPRITES_ENABLED && enemyKind === 'ranged') {
    attachBeeBreathingSprite(scene, enemy)
  } else if (ENEMY_WALK_SPRITES_ENABLED) {
    if (
      enemyKind === 'melee' ||
      enemyKind === 'toughMelee' ||
      enemyKind === 'mushroom' ||
      enemyKind === 'earthSlime' ||
      enemyKind === 'earthRock' ||
      enemyKind === 'spiritFire' ||
      enemyKind === 'spiritThunder' ||
      enemyKind === 'burningTree' ||
      enemyKind === 'ashKnight' ||
      enemyKind === 'chaosElemental' ||
      enemyKind === 'stump' ||
      enemyKind === 'beetle' ||
      enemyKind === 'earthSkeleton' ||
      enemyKind === 'branch'
    ) {
      attachSlimeWalkSprite(scene, enemy)
    } else if (enemyKind === 'ranged') {
      attachSnakeWalkSprite(scene, enemy)
    } else if (enemyKind === 'charger') {
      attachChargerWalkSprite(scene, enemy)
    } else if (enemyKind === 'armored') {
      attachArmoredWalkSprite(scene, enemy)
    }
  }

  return enemy
}

