/**
 * 敵のスポーン・ダメージ・撃破演出・HP バー。
 *
 * 呼び出し元のイメージ:
 * - WaveSystem / GameScene: startEnemyPackSpawnWithWarning などで出現予約
 * - 弾の overlap（PlayerBulletCollision など）: applyDamageToEnemy
 * - 撃破後: playEnemyDefeatFadeOut → コインドロップなどは呼び出し側
 * - 毎フレーム: updateAllEnemyHpBars（位置追従）
 *
 * 移動そのものは EnemyMovementSystem が、敵データの speed を使って
 * body.setVelocity で行う（このファイルでは速度値を setData に載せるだけ）。
 */
import Phaser from 'phaser'
import {
  ENEMY_WIDTH,
  ENEMY_HEIGHT,
  ENEMY_RADIUS,
  ENEMY_MELEE_COLOR,
  ENEMY_TOUGH_MELEE_COLOR,
  ENEMY_MUSHROOM_COLOR,
  ENEMY_MUSHROOM_WIDTH,
  ENEMY_MUSHROOM_HEIGHT,
  ENEMY_MUSHROOM_RADIUS,
  ENEMY_SPIRIT_FIRE_COLOR,
  ENEMY_SPIRIT_FIRE_WIDTH,
  ENEMY_SPIRIT_FIRE_HEIGHT,
  ENEMY_SPIRIT_FIRE_RADIUS,
  ENEMY_SPIRIT_THUNDER_COLOR,
  ENEMY_SPIRIT_THUNDER_HP,
  ENEMY_SPIRIT_THUNDER_SPEED,
  ENEMY_SPIRIT_THUNDER_WIDTH,
  ENEMY_SPIRIT_THUNDER_HEIGHT,
  ENEMY_SPIRIT_THUNDER_RADIUS,
  ENEMY_BURNING_TREE_COLOR,
  ENEMY_BURNING_TREE_HP,
  ENEMY_BURNING_TREE_WIDTH,
  ENEMY_BURNING_TREE_HEIGHT,
  ENEMY_BURNING_TREE_RADIUS,
  ENEMY_BURNING_TREE_SPAWN_INTERVAL_MIN_MS,
  ENEMY_BURNING_TREE_SPAWN_INTERVAL_MAX_MS,
  ENEMY_BURNING_TREE_SPAWN_OFFSET,
  ENEMY_BURNING_TREE_XP_DROP_MULTIPLIER,
  ENEMY_ASH_KNIGHT_COLOR,
  ENEMY_ASH_KNIGHT_HP,
  ENEMY_ASH_KNIGHT_WIDTH,
  ENEMY_ASH_KNIGHT_HEIGHT,
  ENEMY_ASH_KNIGHT_RADIUS,
  ENEMY_ASH_KNIGHT_BLOCK_HIT_COUNT,
  ENEMY_ASH_KNIGHT_XP_DROP_MULTIPLIER,
  ENEMY_CHAOS_ELEMENTAL_COLOR,
  ENEMY_CHAOS_ELEMENTAL_HP,
  ENEMY_CHAOS_ELEMENTAL_WIDTH,
  ENEMY_CHAOS_ELEMENTAL_HEIGHT,
  ENEMY_CHAOS_ELEMENTAL_RADIUS,
  ENEMY_CHAOS_ELEMENTAL_SPAWN_INTERVAL_MS,
  ENEMY_CHAOS_ELEMENTAL_SPAWN_OFFSET,
  ENEMY_CHAOS_ELEMENTAL_SPAWN_OFFSET_Y,
  ENEMY_CHAOS_ELEMENTAL_XP_DROP_MULTIPLIER,
  ENEMY_STUMP_COLOR,
  ENEMY_STUMP_HP,
  ENEMY_STUMP_WIDTH,
  ENEMY_STUMP_HEIGHT,
  ENEMY_STUMP_RADIUS,
  ENEMY_BEETLE_COLOR,
  ENEMY_BEETLE_HP,
  ENEMY_BEETLE_XP_DROP_MULTIPLIER,
  ENEMY_BEETLE_WIDTH,
  ENEMY_BEETLE_HEIGHT,
  ENEMY_BEETLE_RADIUS,
  ENEMY_BRANCH_COLOR,
  ENEMY_BRANCH_HP,
  ENEMY_BRANCH_XP_DROP_MULTIPLIER,
  ENEMY_BRANCH_BLAST_DAMAGE_MULTIPLIER,
  ENEMY_BRANCH_BEETLE_SPAWN_INTERVAL_MS,
  ENEMY_BRANCH_BEETLE_SPAWN_OFFSET,
  ENEMY_BRANCH_WIDTH,
  ENEMY_BRANCH_HEIGHT,
  ENEMY_BRANCH_RADIUS,
  ENEMY_BRANCH_BREATH_SPRITE_KEY,
  ENEMY_BRANCH_BREATH_DISPLAY_HEIGHT,
  ENEMY_BRANCH_BREATH_OUTLINE_SCALE,
  ENEMY_BRANCH_BREATH_SCALE_Y_MAX,
  ENEMY_BRANCH_BREATH_SCALE_Y_MIN,
  ENEMY_BRANCH_BREATH_DURATION_MS,
  ENEMY_GRAVESTONE_COLOR,
  ENEMY_GRAVESTONE_HP,
  ENEMY_GRAVESTONE_XP_DROP_MULTIPLIER,
  ENEMY_GRAVESTONE_BREATH_SPRITE_KEY,
  ENEMY_GRAVESTONE_BREATH_DISPLAY_HEIGHT,
  ENEMY_GRAVESTONE_BREATH_OUTLINE_SCALE,
  ENEMY_GRAVESTONE_BREATH_SCALE_Y_MAX,
  ENEMY_GRAVESTONE_BREATH_SCALE_Y_MIN,
  ENEMY_GRAVESTONE_BREATH_DURATION_MS,
  ENEMY_GRAVESTONE_SPAWN_INTERVAL_MS,
  ENEMY_GRAVESTONE_SPAWN_OFFSET,
  ENEMY_GRAVESTONE_SPAWN_OFFSET_Y,
  ENEMY_WALK_SPRITES_ENABLED,
  ENEMY_BREATHING_SPRITES_ENABLED,
  ENEMY_SLIME_BREATH_SPRITE_KEY,
  ENEMY_SLIME_BREATH_DISPLAY_HEIGHT,
  ENEMY_SLIME_BREATH_OUTLINE_SCALE,
  ENEMY_SLIME_BREATH_SCALE_Y_MAX,
  ENEMY_SLIME_BREATH_SCALE_Y_MIN,
  ENEMY_SLIME_BREATH_DURATION_MS,
  ENEMY_SLIME_MUD_BREATH_SPRITE_KEY,
  ENEMY_SLIME_MUD_BREATH_DISPLAY_HEIGHT,
  ENEMY_SLIME_MUD_BREATH_OUTLINE_SCALE,
  ENEMY_SLIME_MUD_BREATH_SCALE_Y_MAX,
  ENEMY_SLIME_MUD_BREATH_SCALE_Y_MIN,
  ENEMY_SLIME_MUD_BREATH_DURATION_MS,
  ENEMY_MUSHROOM_BREATH_SPRITE_KEY,
  ENEMY_MUSHROOM_BREATH_DISPLAY_HEIGHT,
  ENEMY_MUSHROOM_BREATH_OUTLINE_SCALE,
  ENEMY_MUSHROOM_BREATH_SCALE_Y_MAX,
  ENEMY_MUSHROOM_BREATH_SCALE_Y_MIN,
  ENEMY_MUSHROOM_BREATH_DURATION_MS,
  ENEMY_SPIRIT_FIRE_BREATH_SPRITE_KEY,
  ENEMY_SPIRIT_FIRE_BREATH_DISPLAY_HEIGHT,
  ENEMY_SPIRIT_FIRE_BREATH_OUTLINE_SCALE,
  ENEMY_SPIRIT_FIRE_BREATH_SCALE_Y_MAX,
  ENEMY_SPIRIT_FIRE_BREATH_SCALE_Y_MIN,
  ENEMY_SPIRIT_FIRE_BREATH_DURATION_MS,
  ENEMY_SPIRIT_THUNDER_BREATH_SPRITE_KEY,
  ENEMY_SPIRIT_THUNDER_BREATH_DISPLAY_HEIGHT,
  ENEMY_SPIRIT_THUNDER_BREATH_OUTLINE_SCALE,
  ENEMY_SPIRIT_THUNDER_BREATH_SCALE_Y_MAX,
  ENEMY_SPIRIT_THUNDER_BREATH_SCALE_Y_MIN,
  ENEMY_SPIRIT_THUNDER_BREATH_DURATION_MS,
  ENEMY_BURNING_TREE_BREATH_SPRITE_KEY,
  ENEMY_BURNING_TREE_BREATH_DISPLAY_HEIGHT,
  ENEMY_BURNING_TREE_BREATH_OUTLINE_SCALE,
  ENEMY_BURNING_TREE_BREATH_SCALE_Y_MAX,
  ENEMY_BURNING_TREE_BREATH_SCALE_Y_MIN,
  ENEMY_BURNING_TREE_BREATH_DURATION_MS,
  ENEMY_ASH_KNIGHT_BREATH_SPRITE_KEY,
  ENEMY_ASH_KNIGHT_BREATH_DISPLAY_HEIGHT,
  ENEMY_ASH_KNIGHT_BREATH_OUTLINE_SCALE,
  ENEMY_ASH_KNIGHT_BREATH_SCALE_Y_MAX,
  ENEMY_ASH_KNIGHT_BREATH_SCALE_Y_MIN,
  ENEMY_ASH_KNIGHT_BREATH_DURATION_MS,
  ENEMY_CHAOS_ELEMENTAL_BREATH_SPRITE_KEY,
  ENEMY_CHAOS_ELEMENTAL_BREATH_DISPLAY_HEIGHT,
  ENEMY_CHAOS_ELEMENTAL_BREATH_OUTLINE_SCALE,
  ENEMY_CHAOS_ELEMENTAL_BREATH_SCALE_Y_MAX,
  ENEMY_CHAOS_ELEMENTAL_BREATH_SCALE_Y_MIN,
  ENEMY_CHAOS_ELEMENTAL_BREATH_DURATION_MS,
  ENEMY_STUMP_BREATH_SPRITE_KEY,
  ENEMY_STUMP_BREATH_DISPLAY_HEIGHT,
  ENEMY_STUMP_BREATH_OUTLINE_SCALE,
  ENEMY_STUMP_BREATH_SCALE_Y_MAX,
  ENEMY_STUMP_BREATH_SCALE_Y_MIN,
  ENEMY_STUMP_BREATH_DURATION_MS,
  ENEMY_BEETLE_BREATH_SPRITE_KEY,
  ENEMY_BEETLE_BREATH_DISPLAY_HEIGHT,
  ENEMY_BEETLE_BREATH_OUTLINE_SCALE,
  ENEMY_BEETLE_BREATH_SCALE_Y_MAX,
  ENEMY_BEETLE_BREATH_SCALE_Y_MIN,
  ENEMY_BEETLE_BREATH_DURATION_MS,
  ENEMY_STUMP_MUSHROOM_SPAWN_INTERVAL_MS,
  ENEMY_STUMP_MUSHROOM_SPAWN_OFFSET,
  ENEMY_BEE_BREATH_SPRITE_KEY,
  ENEMY_BEE_BREATH_DISPLAY_HEIGHT,
  ENEMY_BEE_BREATH_OUTLINE_SCALE,
  ENEMY_BEE_BREATH_SCALE_Y_MAX,
  ENEMY_BEE_BREATH_SCALE_Y_MIN,
  ENEMY_BEE_BREATH_DURATION_MS,
  ENEMY_SLIME_WALK_SPRITE_KEY,
  ENEMY_SLIME_WALK_FRAME_SIZE,
  ENEMY_SLIME_WALK_FRAME_RATE,
  ENEMY_SLIME_DISPLAY_SIZE,
  ENEMY_RANGED_COLOR,
  ENEMY_SNAKE_WALK_SPRITE_KEY,
  ENEMY_SNAKE_WALK_FRAME_SIZE,
  ENEMY_SNAKE_WALK_FRAME_RATE,
  ENEMY_SNAKE_DISPLAY_SIZE,
  ENEMY_CHARGER_WALK_SPRITE_KEY,
  ENEMY_CHARGER_WALK_FRAME_SIZE,
  ENEMY_CHARGER_WALK_FRAME_RATE,
  ENEMY_CHARGER_DISPLAY_SIZE,
  ENEMY_ARMORED_WALK_SPRITE_KEY,
  ENEMY_ARMORED_WALK_FRAME_SIZE,
  ENEMY_ARMORED_WALK_FRAME_RATE,
  ENEMY_ARMORED_DISPLAY_SIZE,
  ENEMY_RUNNER_COLOR,
  ENEMY_CHARGER_COLOR,
  ENEMY_ARMORED_COLOR,
  ENEMY_SHIELDED_COLOR,
  ENEMY_SPECIAL_STROKE_COLOR,
  ENEMY_SPECIAL_STROKE_WIDTH,
  ENEMY_ARMORED_MIN_DAMAGE,
  ENEMY_RUNNER_HP,
  ENEMY_RUNNER_MIN_SPEED,
  ENEMY_RUNNER_SPEED_MULTIPLIER,
  ENEMY_RANGED_ATTACK_INTERVAL_MS,
  ENEMY_SPAWN_AREA_MARGIN,
  ENEMY_SPAWN_MIN_DISTANCE_FROM_PLAYER,
  ENEMY_SPAWN_WARNING_SECONDS,
  ENEMY_SPAWN_WARNING_BLINK_INTERVAL_MS,
  ENEMY_SPAWN_WARNING_COLOR,
  ENEMY_PACK_SPACING,
  ENEMY_DEFEAT_FADE_DURATION_MS,
  ENEMY_DEFEAT_SCALE_TO,
  ENEMY_HP_BAR_WIDTH,
  ENEMY_HP_BAR_HEIGHT,
  ENEMY_HP_BAR_OFFSET_Y,
  ENEMY_HP_BAR_BORDER_COLOR,
  ENEMY_HP_BAR_EMPTY_COLOR,
  ENEMY_HP_BAR_FILL_COLOR,
  ENEMY_HP_BAR_DEPTH,
  PLAY_AREA_ORIGIN_X,
  PLAY_AREA_ORIGIN_Y,
  PLAY_AREA_WIDTH,
  PLAY_AREA_HEIGHT,
  calculateEnemyHpForStage,
  calculateToughMeleeHp,
  calculateRangedEnemyHpForStage,
  calculateEnemySpeedForStage,
  calculateToughMeleeSpeed,
  calculateStumpSpeed,
  calculateBurningTreeSpeed,
  calculateBranchSpeed,
  calculateRangedEnemySpeedForStage,
  getMaxEnemiesForStage,
  shouldSpawnRangedEnemy,
  isForestFinalStage,
  isVolcanoFinalStage,
  shouldScatterVolcanoEnemySpawns,
  type StageAreaId,
} from '../GameConstants'
import { setupCircleHitbox } from '../utils/setupCircleHitbox'
import { configureArcadeBodyForConstantSpeed } from '../utils/arcadePhysicsHelpers'
import { applyDevEntityDepth } from '../utils/applyDevEntityDepth'
import { BreathingSprite } from './BreathingSprite'

/** スポーン座標（警告マーカーと実体の両方で使う） */
export type SpawnPosition = {
  x: number
  y: number
}

export type EnemyKind =
  | 'melee'
  | 'toughMelee'
  | 'mushroom'
  | 'spiritFire'
  | 'spiritThunder'
  | 'burningTree'
  | 'ashKnight'
  | 'chaosElemental'
  | 'stump'
  | 'beetle'
  | 'branch'
  | 'gravestone'
  | 'ranged'
  | 'runner'
  | 'charger'
  | 'armored'
  | 'shielded'

/**
 * 警告点滅と本番スポーンのタイマー一式。
 * ステージ切替などでキャンセルするときに destroy する。
 */
export type SpawnWarningTimers = {
  blinkTimer: Phaser.Time.TimerEvent
  spawnTimer: Phaser.Time.TimerEvent
}

// setData に頼らず、敵オブジェクト直結で HP バーを覚える
// Rectangle 3枚の Container（毎フレーム Graphics.clear しない＝敵が多いほど効く）
type EnemyHpBarView = {
  container: Phaser.GameObjects.Container
  fill: Phaser.GameObjects.Rectangle
  innerWidth: number
}
const enemyHpBarMap = new WeakMap<Phaser.GameObjects.Rectangle, EnemyHpBarView>()
// 近接敵の物理用 Rectangle と、見た目用 Sprite の対応
const enemyWalkSpriteMap = new WeakMap<
  Phaser.GameObjects.Rectangle,
  Phaser.GameObjects.Sprite
>()
// 呼吸アニメ方式の見た目（静止PNG＋黒枠）
const enemyBreathingSpriteMap = new WeakMap<
  Phaser.GameObjects.Rectangle,
  BreathingSprite
>()
// 貫通判定用の一意 ID（同じ敵に弾が二度当たらないようにする）
let nextEnemyUid = 1

type EnemyWalkDirection = 'down' | 'up' | 'left' | 'right'

const ENEMY_WALK_COLUMN_BY_DIRECTION: Record<EnemyWalkDirection, number> = {
  down: 0,
  up: 1,
  left: 2,
  right: 3,
}

function getSlimeWalkAnimationKey(direction: EnemyWalkDirection): string {
  return `enemy-slime-walk-${direction}`
}

/** スライムの4方向アニメーションを一度だけ登録する。 */
function ensureSlimeWalkAnimations(scene: Phaser.Scene): void {
  const directions: EnemyWalkDirection[] = ['down', 'up', 'left', 'right']

  for (let index = 0; index < directions.length; index++) {
    const direction = directions[index]
    const animationKey = getSlimeWalkAnimationKey(direction)
    if (scene.anims.exists(animationKey)) {
      continue
    }

    const column = ENEMY_WALK_COLUMN_BY_DIRECTION[direction]
    scene.anims.create({
      key: animationKey,
      frames: scene.anims.generateFrameNumbers(ENEMY_SLIME_WALK_SPRITE_KEY, {
        frames: [column, column + 4, column + 8, column + 12],
      }),
      frameRate: ENEMY_SLIME_WALK_FRAME_RATE,
      repeat: -1,
    })
  }
}

function getSnakeWalkAnimationKey(direction: EnemyWalkDirection): string {
  return `enemy-snake-walk-${direction}`
}

/** ヘビの4方向アニメーションを一度だけ登録する。 */
function ensureSnakeWalkAnimations(scene: Phaser.Scene): void {
  const directions: EnemyWalkDirection[] = ['down', 'up', 'left', 'right']

  for (let index = 0; index < directions.length; index++) {
    const direction = directions[index]
    const animationKey = getSnakeWalkAnimationKey(direction)
    if (scene.anims.exists(animationKey)) {
      continue
    }

    const column = ENEMY_WALK_COLUMN_BY_DIRECTION[direction]
    scene.anims.create({
      key: animationKey,
      frames: scene.anims.generateFrameNumbers(ENEMY_SNAKE_WALK_SPRITE_KEY, {
        frames: [column, column + 4, column + 8, column + 12],
      }),
      frameRate: ENEMY_SNAKE_WALK_FRAME_RATE,
      repeat: -1,
    })
  }
}

function getChargerWalkAnimationKey(direction: EnemyWalkDirection): string {
  return `enemy-charger-walk-${direction}`
}

/** 突進敵の4方向アニメーションを一度だけ登録する。 */
function ensureChargerWalkAnimations(scene: Phaser.Scene): void {
  const directions: EnemyWalkDirection[] = ['down', 'up', 'left', 'right']

  for (let index = 0; index < directions.length; index++) {
    const direction = directions[index]
    const animationKey = getChargerWalkAnimationKey(direction)
    if (scene.anims.exists(animationKey)) {
      continue
    }

    const column = ENEMY_WALK_COLUMN_BY_DIRECTION[direction]
    scene.anims.create({
      key: animationKey,
      frames: scene.anims.generateFrameNumbers(ENEMY_CHARGER_WALK_SPRITE_KEY, {
        frames: [column, column + 4, column + 8, column + 12],
      }),
      frameRate: ENEMY_CHARGER_WALK_FRAME_RATE,
      repeat: -1,
    })
  }
}

function getArmoredWalkAnimationKey(direction: EnemyWalkDirection): string {
  return `enemy-armored-walk-${direction}`
}

/** 防御力がある装甲敵の4方向アニメーションを一度だけ登録する。 */
function ensureArmoredWalkAnimations(scene: Phaser.Scene): void {
  const directions: EnemyWalkDirection[] = ['down', 'up', 'left', 'right']

  for (let index = 0; index < directions.length; index++) {
    const direction = directions[index]
    const animationKey = getArmoredWalkAnimationKey(direction)
    if (scene.anims.exists(animationKey)) {
      continue
    }

    const column = ENEMY_WALK_COLUMN_BY_DIRECTION[direction]
    scene.anims.create({
      key: animationKey,
      frames: scene.anims.generateFrameNumbers(ENEMY_ARMORED_WALK_SPRITE_KEY, {
        frames: [column, column + 4, column + 8, column + 12],
      }),
      frameRate: ENEMY_ARMORED_WALK_FRAME_RATE,
      repeat: -1,
    })
  }
}

/** 近接／射撃敵に、静止PNG＋呼吸アニメの見た目を付ける。
 * 左右向きはデフォルトで蜂と同じ（左向きPNG・移動方向／停止時はプレイヤー）。
 * 新規敵もこの関数経由なら同じ向き処理になる。
 */
function attachBreathingEnemySprite(
  scene: Phaser.Scene,
  enemy: Phaser.GameObjects.Rectangle,
  textureKey: string,
  displayHeight: number,
  outlineScale: number,
  breathScaleYMax: number,
  breathScaleYMin: number,
  breathDurationMs: number,
  flipWithHorizontalMove: boolean = true,
  facesLeftByDefault: boolean = true,
): void {
  const breathing = new BreathingSprite(scene, enemy.x, enemy.y, {
    textureKey,
    displayHeight,
    outlineScale,
    breathScaleYMax,
    breathScaleYMin,
    breathDurationMs,
    flipWithHorizontalMove,
    facesLeftByDefault,
  })
  breathing.followEnemyCenter(enemy.x, enemy.y, enemy.height)
  breathing.setDepth(enemy.depth)
  enemyBreathingSpriteMap.set(enemy, breathing)

  // 物理と当たり判定は Rectangle に残し、見た目だけ差し替える
  enemy.setVisible(false)
  enemy.once('destroy', () => {
    enemyBreathingSpriteMap.delete(enemy)
    breathing.destroy()
  })
}

/** 近接敵（緑スライム）の呼吸スプライト。 */
function attachSlimeBreathingSprite(
  scene: Phaser.Scene,
  enemy: Phaser.GameObjects.Rectangle,
): void {
  attachBreathingEnemySprite(
    scene,
    enemy,
    ENEMY_SLIME_BREATH_SPRITE_KEY,
    ENEMY_SLIME_BREATH_DISPLAY_HEIGHT,
    ENEMY_SLIME_BREATH_OUTLINE_SCALE,
    ENEMY_SLIME_BREATH_SCALE_Y_MAX,
    ENEMY_SLIME_BREATH_SCALE_Y_MIN,
    ENEMY_SLIME_BREATH_DURATION_MS,
  )
}

/** 射撃敵（蜂）の呼吸スプライト。 */
function attachBeeBreathingSprite(
  scene: Phaser.Scene,
  enemy: Phaser.GameObjects.Rectangle,
): void {
  attachBreathingEnemySprite(
    scene,
    enemy,
    ENEMY_BEE_BREATH_SPRITE_KEY,
    ENEMY_BEE_BREATH_DISPLAY_HEIGHT,
    ENEMY_BEE_BREATH_OUTLINE_SCALE,
    ENEMY_BEE_BREATH_SCALE_Y_MAX,
    ENEMY_BEE_BREATH_SCALE_Y_MIN,
    ENEMY_BEE_BREATH_DURATION_MS,
  )
}

/** Plains Stage2 の少し硬い泥スライムの呼吸スプライト。 */
function attachMudSlimeBreathingSprite(
  scene: Phaser.Scene,
  enemy: Phaser.GameObjects.Rectangle,
): void {
  attachBreathingEnemySprite(
    scene,
    enemy,
    ENEMY_SLIME_MUD_BREATH_SPRITE_KEY,
    ENEMY_SLIME_MUD_BREATH_DISPLAY_HEIGHT,
    ENEMY_SLIME_MUD_BREATH_OUTLINE_SCALE,
    ENEMY_SLIME_MUD_BREATH_SCALE_Y_MAX,
    ENEMY_SLIME_MUD_BREATH_SCALE_Y_MIN,
    ENEMY_SLIME_MUD_BREATH_DURATION_MS,
  )
}

/** Forest Stage1 のキノコ（緑スライムと同じ呼吸・向き）。
 * 元画像は左向き。移動中は進行方向、停止中はプレイヤーを向く。
 */
function attachMushroomBreathingSprite(
  scene: Phaser.Scene,
  enemy: Phaser.GameObjects.Rectangle,
): void {
  attachBreathingEnemySprite(
    scene,
    enemy,
    ENEMY_MUSHROOM_BREATH_SPRITE_KEY,
    ENEMY_MUSHROOM_BREATH_DISPLAY_HEIGHT,
    ENEMY_MUSHROOM_BREATH_OUTLINE_SCALE,
    ENEMY_MUSHROOM_BREATH_SCALE_Y_MAX,
    ENEMY_MUSHROOM_BREATH_SCALE_Y_MIN,
    ENEMY_MUSHROOM_BREATH_DURATION_MS,
    true, // flipWithHorizontalMove: 進行方向を向く
    true, // facesLeftByDefault: 元画像は左向き
  )
}

/** Volcano Stage1 の火の精霊（緑スライムと同じ呼吸・向き）。 */
function attachSpiritFireBreathingSprite(
  scene: Phaser.Scene,
  enemy: Phaser.GameObjects.Rectangle,
): void {
  attachBreathingEnemySprite(
    scene,
    enemy,
    ENEMY_SPIRIT_FIRE_BREATH_SPRITE_KEY,
    ENEMY_SPIRIT_FIRE_BREATH_DISPLAY_HEIGHT,
    ENEMY_SPIRIT_FIRE_BREATH_OUTLINE_SCALE,
    ENEMY_SPIRIT_FIRE_BREATH_SCALE_Y_MAX,
    ENEMY_SPIRIT_FIRE_BREATH_SCALE_Y_MIN,
    ENEMY_SPIRIT_FIRE_BREATH_DURATION_MS,
    true, // flipWithHorizontalMove: 進行方向を向く
    true, // facesLeftByDefault: 元画像は左向き扱い
  )
}

/** Volcano Stage2 の雷の精霊（左向き・進行方向を向く）。 */
function attachSpiritThunderBreathingSprite(
  scene: Phaser.Scene,
  enemy: Phaser.GameObjects.Rectangle,
): void {
  attachBreathingEnemySprite(
    scene,
    enemy,
    ENEMY_SPIRIT_THUNDER_BREATH_SPRITE_KEY,
    ENEMY_SPIRIT_THUNDER_BREATH_DISPLAY_HEIGHT,
    ENEMY_SPIRIT_THUNDER_BREATH_OUTLINE_SCALE,
    ENEMY_SPIRIT_THUNDER_BREATH_SCALE_Y_MAX,
    ENEMY_SPIRIT_THUNDER_BREATH_SCALE_Y_MIN,
    ENEMY_SPIRIT_THUNDER_BREATH_DURATION_MS,
    true, // flipWithHorizontalMove: 進行方向を向く
    true, // facesLeftByDefault: 元画像は左向き
  )
}

/** Volcano Stage3 の燃え木（左向き・進行方向を向く）。 */
function attachBurningTreeBreathingSprite(
  scene: Phaser.Scene,
  enemy: Phaser.GameObjects.Rectangle,
): void {
  attachBreathingEnemySprite(
    scene,
    enemy,
    ENEMY_BURNING_TREE_BREATH_SPRITE_KEY,
    ENEMY_BURNING_TREE_BREATH_DISPLAY_HEIGHT,
    ENEMY_BURNING_TREE_BREATH_OUTLINE_SCALE,
    ENEMY_BURNING_TREE_BREATH_SCALE_Y_MAX,
    ENEMY_BURNING_TREE_BREATH_SCALE_Y_MIN,
    ENEMY_BURNING_TREE_BREATH_DURATION_MS,
    true,
    true,
  )
}

/** Volcano Stage4 の灰騎士（左向き・進行方向を向く）。 */
function attachAshKnightBreathingSprite(
  scene: Phaser.Scene,
  enemy: Phaser.GameObjects.Rectangle,
): void {
  attachBreathingEnemySprite(
    scene,
    enemy,
    ENEMY_ASH_KNIGHT_BREATH_SPRITE_KEY,
    ENEMY_ASH_KNIGHT_BREATH_DISPLAY_HEIGHT,
    ENEMY_ASH_KNIGHT_BREATH_OUTLINE_SCALE,
    ENEMY_ASH_KNIGHT_BREATH_SCALE_Y_MAX,
    ENEMY_ASH_KNIGHT_BREATH_SCALE_Y_MIN,
    ENEMY_ASH_KNIGHT_BREATH_DURATION_MS,
    true,
    true,
  )
}

/** Volcano Stage5 の混沌エレメンタル（正面固定・動かない）。 */
function attachChaosElementalBreathingSprite(
  scene: Phaser.Scene,
  enemy: Phaser.GameObjects.Rectangle,
): void {
  attachBreathingEnemySprite(
    scene,
    enemy,
    ENEMY_CHAOS_ELEMENTAL_BREATH_SPRITE_KEY,
    ENEMY_CHAOS_ELEMENTAL_BREATH_DISPLAY_HEIGHT,
    ENEMY_CHAOS_ELEMENTAL_BREATH_OUTLINE_SCALE,
    ENEMY_CHAOS_ELEMENTAL_BREATH_SCALE_Y_MAX,
    ENEMY_CHAOS_ELEMENTAL_BREATH_SCALE_Y_MIN,
    ENEMY_CHAOS_ELEMENTAL_BREATH_DURATION_MS,
    false,
    true,
  )
}

/** Forest Stage2 の切り株（左向き・進行方向を向く）。 */
function attachStumpBreathingSprite(
  scene: Phaser.Scene,
  enemy: Phaser.GameObjects.Rectangle,
): void {
  attachBreathingEnemySprite(
    scene,
    enemy,
    ENEMY_STUMP_BREATH_SPRITE_KEY,
    ENEMY_STUMP_BREATH_DISPLAY_HEIGHT,
    ENEMY_STUMP_BREATH_OUTLINE_SCALE,
    ENEMY_STUMP_BREATH_SCALE_Y_MAX,
    ENEMY_STUMP_BREATH_SCALE_Y_MIN,
    ENEMY_STUMP_BREATH_DURATION_MS,
    true,
    true,
  )
}

/** Forest Stage3 のカブトムシ（左向き・進行方向を向く）。 */
function attachBeetleBreathingSprite(
  scene: Phaser.Scene,
  enemy: Phaser.GameObjects.Rectangle,
): void {
  attachBreathingEnemySprite(
    scene,
    enemy,
    ENEMY_BEETLE_BREATH_SPRITE_KEY,
    ENEMY_BEETLE_BREATH_DISPLAY_HEIGHT,
    ENEMY_BEETLE_BREATH_OUTLINE_SCALE,
    ENEMY_BEETLE_BREATH_SCALE_Y_MAX,
    ENEMY_BEETLE_BREATH_SCALE_Y_MIN,
    ENEMY_BEETLE_BREATH_DURATION_MS,
    true,
    true,
  )
}

/** Forest Stage4 の枝（左向き・進行方向を向く）。 */
function attachBranchBreathingSprite(
  scene: Phaser.Scene,
  enemy: Phaser.GameObjects.Rectangle,
): void {
  attachBreathingEnemySprite(
    scene,
    enemy,
    ENEMY_BRANCH_BREATH_SPRITE_KEY,
    ENEMY_BRANCH_BREATH_DISPLAY_HEIGHT,
    ENEMY_BRANCH_BREATH_OUTLINE_SCALE,
    ENEMY_BRANCH_BREATH_SCALE_Y_MAX,
    ENEMY_BRANCH_BREATH_SCALE_Y_MIN,
    ENEMY_BRANCH_BREATH_DURATION_MS,
    true,
    true,
  )
}

/** Forest Stage5 の墓石（正面固定・動かない）。 */
function attachGravestoneBreathingSprite(
  scene: Phaser.Scene,
  enemy: Phaser.GameObjects.Rectangle,
): void {
  attachBreathingEnemySprite(
    scene,
    enemy,
    ENEMY_GRAVESTONE_BREATH_SPRITE_KEY,
    ENEMY_GRAVESTONE_BREATH_DISPLAY_HEIGHT,
    ENEMY_GRAVESTONE_BREATH_OUTLINE_SCALE,
    ENEMY_GRAVESTONE_BREATH_SCALE_Y_MAX,
    ENEMY_GRAVESTONE_BREATH_SCALE_Y_MIN,
    ENEMY_GRAVESTONE_BREATH_DURATION_MS,
    false,
    true,
  )
}

/** 近接敵に、物理本体へ追従するスライムの見た目を付ける。 */
function attachSlimeWalkSprite(
  scene: Phaser.Scene,
  enemy: Phaser.GameObjects.Rectangle,
): void {
  ensureSlimeWalkAnimations(scene)

  const sprite = scene.add.sprite(enemy.x, enemy.y, ENEMY_SLIME_WALK_SPRITE_KEY, 0)
  // コマ内の余白ぶんを補うため、当たり判定より少し大きく表示する
  sprite.setScale(ENEMY_SLIME_DISPLAY_SIZE / ENEMY_SLIME_WALK_FRAME_SIZE)
  sprite.setDepth(enemy.depth)
  sprite.setData('walkDirection', 'down')
  sprite.setData('walkAnimationPrefix', 'enemy-slime-walk')
  enemyWalkSpriteMap.set(enemy, sprite)

  attachWalkSpriteLifecycle(enemy, sprite)
}

/** 射撃敵に、物理本体へ追従するヘビの見た目を付ける。 */
function attachSnakeWalkSprite(
  scene: Phaser.Scene,
  enemy: Phaser.GameObjects.Rectangle,
): void {
  ensureSnakeWalkAnimations(scene)

  const sprite = scene.add.sprite(enemy.x, enemy.y, ENEMY_SNAKE_WALK_SPRITE_KEY, 0)
  sprite.setScale(ENEMY_SNAKE_DISPLAY_SIZE / ENEMY_SNAKE_WALK_FRAME_SIZE)
  sprite.setDepth(enemy.depth)
  sprite.setData('walkDirection', 'down')
  sprite.setData('walkAnimationPrefix', 'enemy-snake-walk')
  enemyWalkSpriteMap.set(enemy, sprite)

  attachWalkSpriteLifecycle(enemy, sprite)
}

/** 突進敵に、物理本体へ追従する見た目を付ける。 */
function attachChargerWalkSprite(
  scene: Phaser.Scene,
  enemy: Phaser.GameObjects.Rectangle,
): void {
  ensureChargerWalkAnimations(scene)

  const sprite = scene.add.sprite(enemy.x, enemy.y, ENEMY_CHARGER_WALK_SPRITE_KEY, 0)
  sprite.setScale(ENEMY_CHARGER_DISPLAY_SIZE / ENEMY_CHARGER_WALK_FRAME_SIZE)
  sprite.setDepth(enemy.depth)
  sprite.setData('walkDirection', 'down')
  sprite.setData('walkAnimationPrefix', 'enemy-charger-walk')
  enemyWalkSpriteMap.set(enemy, sprite)

  attachWalkSpriteLifecycle(enemy, sprite)
}

/** 防御力がある装甲敵に、物理本体へ追従する見た目を付ける。 */
function attachArmoredWalkSprite(
  scene: Phaser.Scene,
  enemy: Phaser.GameObjects.Rectangle,
): void {
  ensureArmoredWalkAnimations(scene)

  const sprite = scene.add.sprite(enemy.x, enemy.y, ENEMY_ARMORED_WALK_SPRITE_KEY, 0)
  sprite.setScale(ENEMY_ARMORED_DISPLAY_SIZE / ENEMY_ARMORED_WALK_FRAME_SIZE)
  sprite.setDepth(enemy.depth)
  sprite.setData('walkDirection', 'down')
  sprite.setData('walkAnimationPrefix', 'enemy-armored-walk')
  enemyWalkSpriteMap.set(enemy, sprite)

  attachWalkSpriteLifecycle(enemy, sprite)
}

/** 物理用 Rectangle の非表示化と、破棄時のスプライト片付けを共通化する。 */
function attachWalkSpriteLifecycle(
  enemy: Phaser.GameObjects.Rectangle,
  sprite: Phaser.GameObjects.Sprite,
): void {
  // 物理と当たり判定は Rectangle に残し、見た目だけスプライトへ置き換える
  enemy.setVisible(false)
  enemy.once('destroy', () => {
    enemyWalkSpriteMap.delete(enemy)
    if (sprite.active) {
      sprite.destroy()
    }
  })
}

/**
 * 近接・射撃共通の生成処理（色と isRanged フラグだけ違う）。
 * 公開 API は spawnMeleeEnemy / spawnRangedEnemy。
 */
function spawnEnemyCommon(
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
  }

  const enemy = scene.add.rectangle(spawnX, spawnY, hitboxWidth, hitboxHeight, color)
  if (
    enemyKind !== 'melee' &&
    enemyKind !== 'toughMelee' &&
    enemyKind !== 'mushroom' &&
    enemyKind !== 'spiritFire' &&
    enemyKind !== 'spiritThunder' &&
    enemyKind !== 'burningTree' &&
    enemyKind !== 'ashKnight' &&
    enemyKind !== 'chaosElemental' &&
    enemyKind !== 'stump' &&
    enemyKind !== 'beetle' &&
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
  if (enemyKind === 'beetle' || enemyKind === 'spiritThunder') {
    // カブトムシと同じ: 溜め → 一直線突進（雷の精霊も同じ動き）
    enemy.setData('beetleWindupEndsAtMs', 0)
    enemy.setData('beetleChargeEndsAtMs', 0)
    enemy.setData('beetleNextChargeAtMs', 0)
    enemy.setData('beetleChargeDirectionX', 0)
    enemy.setData('beetleChargeDirectionY', 0)
  }
  enemy.setData('isDefeated', false)
  enemy.setData('enemyUid', nextEnemyUid)
  nextEnemyUid = nextEnemyUid + 1
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
      enemyKind === 'spiritFire' ||
      enemyKind === 'spiritThunder' ||
      enemyKind === 'burningTree' ||
      enemyKind === 'ashKnight' ||
      enemyKind === 'chaosElemental' ||
      enemyKind === 'stump' ||
      enemyKind === 'beetle' ||
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
 * HP は固定50。速度0で動かない。2秒ごとに下位ステージの敵を出す。
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

/** Volcano のステージ役割に合わせて特殊敵の種類を決める。 */
const FOREST_STAGE5_ENEMY_KINDS: EnemyKind[] = ['mushroom', 'stump', 'beetle', 'branch']
// Volcano Stage1〜4 で登場した敵（混沌エレメンタルが出すのも同じ）
const VOLCANO_STAGE5_ENEMY_KINDS: EnemyKind[] = [
  'spiritFire',
  'spiritThunder',
  'burningTree',
  'ashKnight',
]

function pickForestStage5EnemyKind(): EnemyKind {
  const index = Phaser.Math.Between(0, FOREST_STAGE5_ENEMY_KINDS.length - 1)
  return FOREST_STAGE5_ENEMY_KINDS[index]
}

function pickVolcanoStage5EnemyKind(): EnemyKind {
  const index = Phaser.Math.Between(0, VOLCANO_STAGE5_ENEMY_KINDS.length - 1)
  return VOLCANO_STAGE5_ENEMY_KINDS[index]
}

function buildPackEnemyKinds(
  areaId: StageAreaId,
  stageNumber: number,
  totalStages: number,
  spawnAsRanged: boolean,
  packSize: number,
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

  const enemyKind = pickEnemyKindForArea(areaId, stageNumber, spawnAsRanged)
  for (let index = 0; index < packSize; index++) {
    kinds.push(enemyKind)
  }
  return kinds
}

function pickEnemyKindForArea(
  areaId: StageAreaId,
  stageNumber: number,
  spawnAsRanged: boolean,
): EnemyKind {
  // Plains Stage 2 は少し硬い泥スライムだけを出す（射撃は Stage3 から）
  if (areaId === 'plains' && stageNumber === 2) {
    return 'toughMelee'
  }

  // Forest Stage 1 はキノコだけ（緑スライムと同じステータス・動き）
  if (areaId === 'forest' && stageNumber === 1) {
    return 'mushroom'
  }

  // Forest Stage 2 は切り株だけ（HP7・速度半分・キノコを出す・出現は2体固定）
  if (areaId === 'forest' && stageNumber === 2) {
    return 'stump'
  }

  // Forest Stage 3 はカブトムシだけ（HP5・緑スライム相当速度・経験値2倍）
  if (areaId === 'forest' && stageNumber === 3) {
    return 'beetle'
  }

  // Forest Stage 4 は枝だけ（HP6・緑スライムより遅い・範囲爆破で2倍ダメージ）
  if (areaId === 'forest' && stageNumber === 4) {
    return 'branch'
  }

  // Forest Stage 5（最終）は Stage1〜4 で登場した敵をランダムに混ぜる
  if (areaId === 'forest' && stageNumber === 5) {
    return pickForestStage5EnemyKind()
  }

  // Plains Stage3+ の近接は Stage2 と同じ硬い泥スライム（射撃は蜂）
  // Stage1 は通常の緑スライム（下の共通分岐へ落とす）
  if (areaId === 'plains' && stageNumber >= 3) {
    return spawnAsRanged ? 'ranged' : 'toughMelee'
  }

  if (areaId !== 'volcano') {
    return spawnAsRanged ? 'ranged' : 'melee'
  }

  // Volcano Stage 1 は火の精霊だけ（緑スライムと同じステータス・動き）
  if (stageNumber === 1) {
    return 'spiritFire'
  }

  // Volcano Stage 2 は雷の精霊だけ（HP3・プレイヤー初期速度）
  if (stageNumber === 2) {
    return 'spiritThunder'
  }

  // Volcano Stage 3 は燃え木だけ（HP8・火の精霊をスポーン）
  if (stageNumber === 3) {
    return 'burningTree'
  }

  // Volcano Stage 4 は灰騎士だけ（HP6・最初の2発はシールド）
  if (stageNumber === 4) {
    return 'ashKnight'
  }

  // Volcano Stage 5（最終）は Stage1〜4 で登場した敵をランダムに混ぜる
  if (stageNumber === 5) {
    return pickVolcanoStage5EnemyKind()
  }

  // 半分は通常敵を残し、必要スキルを取った後も攻撃の手応えを保つ
  if (stageNumber < 5 && Math.random() < 0.4) {
    return 'melee'
  }

  const mixedKinds: EnemyKind[] = [
    'runner',
    'charger',
    'armored',
    'shielded',
    'ranged',
  ]
  return mixedKinds[Phaser.Math.Between(0, mixedKinds.length - 1)]
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

/** 燃え木が次に火の精霊を出すまでの待ち時間（3〜5秒のランダム）。 */
function pickBurningTreeSpawnIntervalMs(): number {
  return Phaser.Math.Between(
    ENEMY_BURNING_TREE_SPAWN_INTERVAL_MIN_MS,
    ENEMY_BURNING_TREE_SPAWN_INTERVAL_MAX_MS,
  )
}

/**
 * 燃え木が 3〜5 秒ごとに火の精霊（Volcano Stage1 の敵）を1体出す。
 * 敵数上限いっぱいのときはスキップし、次の間隔まで待つ。
 */
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

/**
 * 敵グループの生存数を数える（撃破演出中 isDefeated は含めない）。
 * ウェーブ進行やクリア判定で「まだ倒していない敵がいるか」を見る。
 */
export function countActiveEnemies(enemyGroup: Phaser.Physics.Arcade.Group): number {
  const children = enemyGroup.getChildren()
  let activeCount = 0

  for (let index = 0; index < children.length; index++) {
    const enemy = children[index] as Phaser.GameObjects.Rectangle
    if (!enemy.active) {
      continue
    }
    if (enemy.getData('isDefeated') === true) {
      continue
    }
    activeCount = activeCount + 1
  }

  return activeCount
}

/**
 * 敵にダメージを与える。今回のダメージで倒れたら true を返す（まだ destroy しない）。
 *
 * 倒れた場合:
 * - isDefeated=true、HP バー破棄、Body 無効化
 * - 呼び出し側が playEnemyDefeatFadeOut などで見た目を消す
 *
 * @returns true = このヒットで撃破になった / false = 生存 or 無効対象
 */
export function applyDamageToEnemy(
  enemy: Phaser.GameObjects.Rectangle,
  damage: number,
): boolean {
  if (!enemy.active) {
    return false
  }

  if (enemy.getData('isDefeated') === true) {
    return false
  }

  const currentHp = enemy.getData('hp') as number
  if (typeof currentHp !== 'number') {
    return false
  }

  // すでに倒れている敵には何もしない
  if (currentHp <= 0) {
    return false
  }

  const newHp = currentHp - damage
  enemy.setData('hp', newHp)

  // HP が今回 0 以下になったときだけ撃破扱い
  if (newHp <= 0) {
    enemy.setData('isDefeated', true)
    enemy.setData('hp', 0)
    destroyEnemyHpBar(enemy)

    // 当たり判定と移動を止める（見た目は tween で消す）
    if (enemy.body !== null) {
      const body = enemy.body as Phaser.Physics.Arcade.Body
      body.enable = false
      body.setVelocity(0, 0)
    }

    return true
  }

  redrawEnemyHpBar(enemy)
  return false
}

/**
 * 撃破演出: Phaser tween で素早くフェードアウトしてから destroy。
 * 白い四角フラッシュは出さない（スプライト／矩形そのものを消す）。
 * onComplete でコイン生成など後処理を渡す想定。
 */
export function playEnemyDefeatFadeOut(
  scene: Phaser.Scene,
  enemy: Phaser.GameObjects.Rectangle,
  onComplete: () => void,
): void {
  const walkSprite = enemyWalkSpriteMap.get(enemy)
  const breathingSprite = enemyBreathingSpriteMap.get(enemy)

  function finishDefeat(): void {
    if (enemy.active) {
      enemy.destroy()
    }
    onComplete()
  }

  // 呼吸スプライト: 伸び縮みを止めてから、本体と枠を同時に透明へ
  if (breathingSprite !== undefined) {
    breathingSprite.stopBreathing()
    const tweenTargets = breathingSprite.getTweenTargets()
    // 白い塗りつぶしは使わず、絵のまま消す
    breathingSprite.body.clearTint()
    breathingSprite.outline.clearTint()
    scene.tweens.killTweensOf(tweenTargets)
    scene.tweens.add({
      targets: tweenTargets,
      alpha: 0,
      duration: ENEMY_DEFEAT_FADE_DURATION_MS,
      ease: 'Cubic.Out',
      onComplete: finishDefeat,
    })
    return
  }

  // 歩行シート: 少し拡大しながら透明へ
  if (walkSprite !== undefined) {
    walkSprite.clearTint()
    scene.tweens.killTweensOf(walkSprite)
    scene.tweens.add({
      targets: walkSprite,
      alpha: 0,
      scaleX: walkSprite.scaleX * ENEMY_DEFEAT_SCALE_TO,
      scaleY: walkSprite.scaleY * ENEMY_DEFEAT_SCALE_TO,
      duration: ENEMY_DEFEAT_FADE_DURATION_MS,
      ease: 'Cubic.Out',
      onComplete: finishDefeat,
    })
    return
  }

  // 見た目が矩形だけの敵（フォールバック）
  scene.tweens.killTweensOf(enemy)
  scene.tweens.add({
    targets: enemy,
    alpha: 0,
    scaleX: ENEMY_DEFEAT_SCALE_TO,
    scaleY: ENEMY_DEFEAT_SCALE_TO,
    duration: ENEMY_DEFEAT_FADE_DURATION_MS,
    ease: 'Cubic.Out',
    onComplete: finishDefeat,
  })
}

/**
 * 全敵の見た目を物理本体へ追従させる。
 * - 呼吸方式: 足元位置だけ追従（伸び縮みは tween が担当）
 * - 歩行シート方式: 速度に合う方向アニメも更新
 * playerX は蜂など、停止中にプレイヤーを向く敵向け。
 */
export function updateAllEnemyWalkSprites(
  enemyGroup: Phaser.Physics.Arcade.Group,
  playerX: number = 0,
): void {
  const children = enemyGroup.getChildren()

  for (let index = 0; index < children.length; index++) {
    const enemy = children[index] as Phaser.GameObjects.Rectangle

    const breathing = enemyBreathingSpriteMap.get(enemy)
    if (breathing !== undefined) {
      breathing.followEnemyCenter(enemy.x, enemy.y, enemy.height)
      if (enemy.active && enemy.getData('isDefeated') !== true && enemy.body !== null) {
        const body = enemy.body as Phaser.Physics.Arcade.Body
        breathing.updateFacing(body.velocity.x, enemy.x, playerX)
      }
      continue
    }

    const sprite = enemyWalkSpriteMap.get(enemy)
    if (sprite === undefined || !sprite.active) {
      continue
    }

    sprite.setPosition(enemy.x, enemy.y)
    if (!enemy.active || enemy.getData('isDefeated') === true) {
      sprite.anims.stop()
      continue
    }

    const body = enemy.body as Phaser.Physics.Arcade.Body
    const velocityX = body.velocity.x
    const velocityY = body.velocity.y
    const isMoving = Math.abs(velocityX) > 1 || Math.abs(velocityY) > 1

    if (!isMoving) {
      const lastDirection = sprite.getData('walkDirection') as EnemyWalkDirection
      sprite.anims.stop()
      sprite.setFrame(ENEMY_WALK_COLUMN_BY_DIRECTION[lastDirection])
      continue
    }

    let direction: EnemyWalkDirection
    if (Math.abs(velocityX) >= Math.abs(velocityY)) {
      direction = velocityX >= 0 ? 'right' : 'left'
    } else {
      direction = velocityY >= 0 ? 'down' : 'up'
    }

    sprite.setData('walkDirection', direction)
    const animationPrefix = sprite.getData('walkAnimationPrefix') as string
    sprite.anims.play(`${animationPrefix}-${direction}`, true)
  }
}

/**
 * 敵の下に細い HP バーを付ける。
 * Graphics ではなく Rectangle 3枚の Container（Phaser 標準）。
 * 毎フレームは位置だけ動かし、幅の再計算はダメージ時だけ。
 */
function attachEnemyHpBar(
  scene: Phaser.Scene,
  enemy: Phaser.GameObjects.Rectangle,
): void {
  const innerWidth = ENEMY_HP_BAR_WIDTH - 2
  const innerHeight = Math.max(1, ENEMY_HP_BAR_HEIGHT - 2)

  const border = scene.add.rectangle(
    0,
    0,
    ENEMY_HP_BAR_WIDTH,
    ENEMY_HP_BAR_HEIGHT,
    ENEMY_HP_BAR_BORDER_COLOR,
  )
  border.setOrigin(0.5, 0)

  const empty = scene.add.rectangle(0, 1, innerWidth, innerHeight, ENEMY_HP_BAR_EMPTY_COLOR)
  empty.setOrigin(0.5, 0)

  // 左端基準。幅を変えても左がずれない
  const fill = scene.add.rectangle(
    -innerWidth / 2,
    1,
    innerWidth,
    innerHeight,
    ENEMY_HP_BAR_FILL_COLOR,
  )
  fill.setOrigin(0, 0)

  const container = scene.add.container(enemy.x, enemy.y)
  container.setDepth(ENEMY_HP_BAR_DEPTH)
  container.add([border, empty, fill])

  const hpBar: EnemyHpBarView = {
    container,
    fill,
    innerWidth,
  }
  enemyHpBarMap.set(enemy, hpBar)

  enemy.once('destroy', () => {
    destroyEnemyHpBar(enemy)
  })

  redrawEnemyHpBar(enemy)
  syncEnemyHpBarPosition(enemy, hpBar)
}

/**
 * 敵グループ全体の HP バー位置だけ更新する（毎フレーム）。
 * 描き直し（clear）はしない。
 */
export function updateAllEnemyHpBars(enemyGroup: Phaser.Physics.Arcade.Group): void {
  const children = enemyGroup.getChildren()

  for (let index = 0; index < children.length; index++) {
    const enemy = children[index] as Phaser.GameObjects.Rectangle
    if (!enemy.active) {
      continue
    }
    if (enemy.getData('isDefeated') === true) {
      continue
    }
    const hpBar = enemyHpBarMap.get(enemy)
    if (hpBar === undefined) {
      continue
    }
    syncEnemyHpBarPosition(enemy, hpBar)
  }
}

/** HP バー Container を敵の足元へ合わせる。 */
function syncEnemyHpBarPosition(
  enemy: Phaser.GameObjects.Rectangle,
  hpBar: EnemyHpBarView,
): void {
  const barTop = enemy.y + enemy.height / 2 + ENEMY_HP_BAR_OFFSET_Y
  hpBar.container.setPosition(enemy.x, barTop)
}

/**
 * 現在の HP / maxHp に合わせて緑ゲージの幅だけ更新する。
 * ダメージ時・出現時に呼ぶ（毎フレームは呼ばない）。
 */
function redrawEnemyHpBar(enemy: Phaser.GameObjects.Rectangle): void {
  const hpBar = enemyHpBarMap.get(enemy)
  if (hpBar === undefined || !hpBar.container.active) {
    return
  }

  const currentHp = enemy.getData('hp') as number
  const maxHp = enemy.getData('maxHp') as number
  if (typeof currentHp !== 'number' || typeof maxHp !== 'number' || maxHp <= 0) {
    return
  }

  const ratio = Phaser.Math.Clamp(currentHp / maxHp, 0, 1)
  hpBar.fill.width = hpBar.innerWidth * ratio
  hpBar.fill.setVisible(ratio > 0)
}

/** WeakMap から外し、Container（中の Rectangle 含む）を destroy する */
function destroyEnemyHpBar(enemy: Phaser.GameObjects.Rectangle): void {
  const hpBar = enemyHpBarMap.get(enemy)
  if (hpBar === undefined) {
    return
  }

  enemyHpBarMap.delete(enemy)
  if (hpBar.container.active) {
    // true = 子の Rectangle も一緒に破棄
    hpBar.container.destroy(true)
  }
}
