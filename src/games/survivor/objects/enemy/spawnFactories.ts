/**
 * 敵種類ごとのスポーン factory。
 */
import Phaser from 'phaser'
import {
  ENEMY_ASH_KNIGHT_COLOR,
  ENEMY_ASH_KNIGHT_HP,
  ENEMY_BEETLE_COLOR,
  ENEMY_BEETLE_HP,
  ENEMY_EARTH_SKELETON_COLOR,
  ENEMY_EARTH_SKELETON_HP,
  ENEMY_BRANCH_COLOR,
  ENEMY_BRANCH_HP,
  ENEMY_BURNING_TREE_COLOR,
  ENEMY_BURNING_TREE_HP,
  ENEMY_CHAOS_ELEMENTAL_COLOR,
  ENEMY_CHAOS_ELEMENTAL_HP,
  ENEMY_CHAOS_ELEMENTAL_SPAWN_OFFSET_Y,
  ENEMY_GRAVESTONE_COLOR,
  ENEMY_GRAVESTONE_HP,
  ENEMY_GRAVESTONE_SPAWN_OFFSET_Y,
  ENEMY_MELEE_COLOR,
  ENEMY_MUSHROOM_COLOR,
  ENEMY_EARTH_SLIME_COLOR,
  ENEMY_EARTH_ROCK_COLOR,
  ENEMY_EARTH_ROCK_HP,
  ENEMY_EARTH_MAGMA_ROCK_COLOR,
  ENEMY_EARTH_MAGMA_ROCK_HP,
  ENEMY_RANGED_COLOR,
  ENEMY_SPIRIT_FIRE_COLOR,
  ENEMY_SPIRIT_THUNDER_COLOR,
  ENEMY_SPIRIT_THUNDER_HP,
  ENEMY_SPIRIT_THUNDER_SPEED,
  ENEMY_STONE_GUARD_COLOR,
  ENEMY_STONE_GUARD_HP,
  ENEMY_STUMP_COLOR,
  ENEMY_STUMP_HP,
  ENEMY_TOUGH_MELEE_COLOR,
  ENEMY_WIND_HIVE_BOSS_COLOR,
  ENEMY_WIND_HIVE_BOSS_HP,
  ENEMY_EARTH_DUNGEON_BOSS_COLOR,
  ENEMY_EARTH_DUNGEON_BOSS_HP,
  PLAY_AREA_HEIGHT,
  PLAY_AREA_ORIGIN_X,
  PLAY_AREA_ORIGIN_Y,
  PLAY_AREA_WIDTH,
  calculateBurningTreeSpeed,
  calculateWindHiveBossSpeed,
  calculateEarthDungeonBossSpeed,
} from '../../GameConstants'
import { spawnEnemyCommon } from './spawnEnemyCommon'

/**
 * 近接敵を1体スポーンして Group に追加する。
 * HP・speed は呼び出し側（通常はステージ計算済みの値）を渡す。
 */
export function spawnMeleeEnemy(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  spawnX: number,
  spawnY: number,
  hp: number,
  speed: number,
): Phaser.GameObjects.Rectangle {
  return spawnEnemyCommon(
    scene,
    enemyGroup,
    spawnX,
    spawnY,
    hp,
    speed,
    ENEMY_MELEE_COLOR,
    false,
    'melee',
  )
}

/**
 * 少し硬い泥スライムを1体スポーンして Group に追加する。
 * HP・speed は呼び出し側で専用計算した値を渡す。
 */
export function spawnToughMeleeEnemy(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  spawnX: number,
  spawnY: number,
  hp: number,
  speed: number,
): Phaser.GameObjects.Rectangle {
  return spawnEnemyCommon(
    scene,
    enemyGroup,
    spawnX,
    spawnY,
    hp,
    speed,
    ENEMY_TOUGH_MELEE_COLOR,
    false,
    'toughMelee',
  )
}

/**
 * Forest Stage1 のキノコを1体スポーンする。
 * HP・速度は緑スライム（melee）と同じ値を渡す。
 */
export function spawnMushroomEnemy(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  spawnX: number,
  spawnY: number,
  hp: number,
  speed: number,
): Phaser.GameObjects.Rectangle {
  return spawnEnemyCommon(
    scene,
    enemyGroup,
    spawnX,
    spawnY,
    hp,
    speed,
    ENEMY_MUSHROOM_COLOR,
    false,
    'mushroom',
  )
}

/**
 * Earth Dungeon Stage1 の土スライムを1体スポーンする。
 * HP・速度は緑スライム（melee）と同じ値を渡す。
 */
export function spawnEarthSlimeEnemy(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  spawnX: number,
  spawnY: number,
  hp: number,
  speed: number,
): Phaser.GameObjects.Rectangle {
  return spawnEnemyCommon(
    scene,
    enemyGroup,
    spawnX,
    spawnY,
    hp,
    speed,
    ENEMY_EARTH_SLIME_COLOR,
    false,
    'earthSlime',
  )
}

/**
 * Earth Dungeon Stage2 の岩敵を1体スポーンする。
 * HP 固定5。速度はやや遅めを呼び出し側で渡す。
 */
export function spawnEarthRockEnemy(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  spawnX: number,
  spawnY: number,
  speed: number,
): Phaser.GameObjects.Rectangle {
  return spawnEnemyCommon(
    scene,
    enemyGroup,
    spawnX,
    spawnY,
    ENEMY_EARTH_ROCK_HP,
    speed,
    ENEMY_EARTH_ROCK_COLOR,
    false,
    'earthRock',
  )
}

/**
 * Earth Dungeon Stage4 のマグマ岩を1体スポーンする。
 * HP 18。速度は呼び出し側でスライム×0.55。6方向小石放射。
 */
export function spawnEarthMagmaRockEnemy(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  spawnX: number,
  spawnY: number,
  speed: number,
): Phaser.GameObjects.Rectangle {
  return spawnEnemyCommon(
    scene,
    enemyGroup,
    spawnX,
    spawnY,
    ENEMY_EARTH_MAGMA_ROCK_HP,
    speed,
    ENEMY_EARTH_MAGMA_ROCK_COLOR,
    false,
    'earthMagmaRock',
  )
}

/**
 * Volcano Stage1 の火の精霊を1体スポーンする。
 * HP・速度は緑スライム（melee）と同じ値を渡す。
 */
export function spawnSpiritFireEnemy(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  spawnX: number,
  spawnY: number,
  hp: number,
  speed: number,
): Phaser.GameObjects.Rectangle {
  return spawnEnemyCommon(
    scene,
    enemyGroup,
    spawnX,
    spawnY,
    hp,
    speed,
    ENEMY_SPIRIT_FIRE_COLOR,
    false,
    'spiritFire',
  )
}

/**
 * Ruins Stage1 の Stone Guard を1体スポーンする。
 * 遅い基本追跡のみ。特殊攻撃・無敵・弾・召喚なし。
 */
export function spawnStoneGuardEnemy(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  spawnX: number,
  spawnY: number,
  speed: number,
): Phaser.GameObjects.Rectangle {
  return spawnEnemyCommon(
    scene,
    enemyGroup,
    spawnX,
    spawnY,
    ENEMY_STONE_GUARD_HP,
    speed,
    ENEMY_STONE_GUARD_COLOR,
    false,
    'stoneGuard',
  )
}

/**
 * Volcano Stage2 の雷の精霊を1体スポーンする。
 * HP は固定3。速度はプレイヤー初期速度。
 */
export function spawnSpiritThunderEnemy(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  spawnX: number,
  spawnY: number,
): Phaser.GameObjects.Rectangle {
  return spawnEnemyCommon(
    scene,
    enemyGroup,
    spawnX,
    spawnY,
    ENEMY_SPIRIT_THUNDER_HP,
    ENEMY_SPIRIT_THUNDER_SPEED,
    ENEMY_SPIRIT_THUNDER_COLOR,
    false,
    'spiritThunder',
  )
}

/**
 * Volcano Stage3 の燃え木を1体スポーンする。
 * HP は固定8。速度は切り株と同じ。3〜5秒ごとに火の精霊を出す。
 */
export function spawnBurningTreeEnemy(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  spawnX: number,
  spawnY: number,
): Phaser.GameObjects.Rectangle {
  return spawnEnemyCommon(
    scene,
    enemyGroup,
    spawnX,
    spawnY,
    ENEMY_BURNING_TREE_HP,
    calculateBurningTreeSpeed(),
    ENEMY_BURNING_TREE_COLOR,
    false,
    'burningTree',
  )
}

/**
 * Volcano Stage4 の灰騎士を1体スポーンする。
 * HP は固定6。速度は緑スライムと同じ。最初の2発はシールドで無効。
 */
export function spawnAshKnightEnemy(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  spawnX: number,
  spawnY: number,
  speed: number,
): Phaser.GameObjects.Rectangle {
  return spawnEnemyCommon(
    scene,
    enemyGroup,
    spawnX,
    spawnY,
    ENEMY_ASH_KNIGHT_HP,
    speed,
    ENEMY_ASH_KNIGHT_COLOR,
    false,
    'ashKnight',
  )
}

/**
 * Volcano Stage5 の混沌エレメンタルを1体スポーンする。
 * HP は ENEMY_CHAOS_ELEMENTAL_HP（現行 150）。速度0で動かない。
 * 2秒ごとに下位ステージの敵を出す。
 */
export function spawnChaosElementalEnemy(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  spawnX: number,
  spawnY: number,
): Phaser.GameObjects.Rectangle {
  return spawnEnemyCommon(
    scene,
    enemyGroup,
    spawnX,
    spawnY,
    ENEMY_CHAOS_ELEMENTAL_HP,
    0,
    ENEMY_CHAOS_ELEMENTAL_COLOR,
    false,
    'chaosElemental',
  )
}

/**
 * Volcano Stage5 開始時に混沌エレメンタルを1体だけ出す（プレイエリア中央やや上）。
 */
export function spawnVolcanoStage5ChaosElemental(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
): Phaser.GameObjects.Rectangle {
  const spawnX = PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH / 2
  const spawnY =
    PLAY_AREA_ORIGIN_Y + PLAY_AREA_HEIGHT / 2 + ENEMY_CHAOS_ELEMENTAL_SPAWN_OFFSET_Y
  return spawnChaosElementalEnemy(scene, enemyGroup, spawnX, spawnY)
}

/**
 * Forest Stage2 の切り株を1体スポーンする。
 * HP は固定7。速度は泥スライムの半分を渡す。
 */
export function spawnStumpEnemy(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  spawnX: number,
  spawnY: number,
  speed: number,
): Phaser.GameObjects.Rectangle {
  return spawnEnemyCommon(
    scene,
    enemyGroup,
    spawnX,
    spawnY,
    ENEMY_STUMP_HP,
    speed,
    ENEMY_STUMP_COLOR,
    false,
    'stump',
  )
}

/**
 * Forest Stage3 のカブトムシを1体スポーンする。
 * HP は固定（通常の1.5倍）。速度は緑スライムと同じ値を渡す。
 */
export function spawnBeetleEnemy(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  spawnX: number,
  spawnY: number,
  speed: number,
): Phaser.GameObjects.Rectangle {
  return spawnEnemyCommon(
    scene,
    enemyGroup,
    spawnX,
    spawnY,
    ENEMY_BEETLE_HP,
    speed,
    ENEMY_BEETLE_COLOR,
    false,
    'beetle',
  )
}

/**
 * Earth Dungeon Stage3 のスケルトンを1体スポーンする。
 * 突進はカブトムシと同じ。HP は固定10。
 */
export function spawnEarthSkeletonEnemy(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  spawnX: number,
  spawnY: number,
  speed: number,
): Phaser.GameObjects.Rectangle {
  return spawnEnemyCommon(
    scene,
    enemyGroup,
    spawnX,
    spawnY,
    ENEMY_EARTH_SKELETON_HP,
    speed,
    ENEMY_EARTH_SKELETON_COLOR,
    false,
    'earthSkeleton',
  )
}

/**
 * Forest Stage4 の枝を1体スポーンする。
 * HP は固定6。速度は緑スライムより遅い値を渡す。
 */
export function spawnBranchEnemy(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  spawnX: number,
  spawnY: number,
  speed: number,
): Phaser.GameObjects.Rectangle {
  return spawnEnemyCommon(
    scene,
    enemyGroup,
    spawnX,
    spawnY,
    ENEMY_BRANCH_HP,
    speed,
    ENEMY_BRANCH_COLOR,
    false,
    'branch',
  )
}

/**
 * Forest Stage5 の墓石を1体スポーンする。
 * HP は固定120。速度0で動かない。
 */
export function spawnGravestoneEnemy(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  spawnX: number,
  spawnY: number,
): Phaser.GameObjects.Rectangle {
  return spawnEnemyCommon(
    scene,
    enemyGroup,
    spawnX,
    spawnY,
    ENEMY_GRAVESTONE_HP,
    0,
    ENEMY_GRAVESTONE_COLOR,
    false,
    'gravestone',
  )
}

/**
 * Forest Stage5 開始時に墓石を1体だけ出す（プレイエリア中央）。
 */
export function spawnForestStage5Gravestone(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
): Phaser.GameObjects.Rectangle {
  const spawnX = PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH / 2
  const spawnY =
    PLAY_AREA_ORIGIN_Y + PLAY_AREA_HEIGHT / 2 + ENEMY_GRAVESTONE_SPAWN_OFFSET_Y
  return spawnGravestoneEnemy(scene, enemyGroup, spawnX, spawnY)
}

/**
 * Wind Plains Stage3 ボスを1体スポーンする。
 * HP は ENEMY_WIND_HIVE_BOSS_HP。速度は通常スライムの 0.5 倍。プレイヤーを追う。
 */
export function spawnWindHiveBossEnemy(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  spawnX: number,
  spawnY: number,
): Phaser.GameObjects.Rectangle {
  return spawnEnemyCommon(
    scene,
    enemyGroup,
    spawnX,
    spawnY,
    ENEMY_WIND_HIVE_BOSS_HP,
    calculateWindHiveBossSpeed(),
    ENEMY_WIND_HIVE_BOSS_COLOR,
    false,
    'windHiveBoss',
  )
}

/**
 * Earth Dungeon Stage5 ボスを1体スポーンする。
 * HP 100。速度は通常スライムの 0.5 倍。プレイヤーを追う。
 */
export function spawnEarthDungeonBossEnemy(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  spawnX: number,
  spawnY: number,
): Phaser.GameObjects.Rectangle {
  return spawnEnemyCommon(
    scene,
    enemyGroup,
    spawnX,
    spawnY,
    ENEMY_EARTH_DUNGEON_BOSS_HP,
    calculateEarthDungeonBossSpeed(),
    ENEMY_EARTH_DUNGEON_BOSS_COLOR,
    false,
    'earthDungeonBoss',
  )
}

/**
 * 射撃型敵を1体スポーンして Group に追加する。
 * 色は紫系。移動は好みの距離帯で接近／後退（EnemyMovementSystem）。
 */
export function spawnRangedEnemy(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  spawnX: number,
  spawnY: number,
  hp: number,
  speed: number,
): Phaser.GameObjects.Rectangle {
  return spawnEnemyCommon(
    scene,
    enemyGroup,
    spawnX,
    spawnY,
    hp,
    speed,
    ENEMY_RANGED_COLOR,
    true,
    'ranged',
  )
}


