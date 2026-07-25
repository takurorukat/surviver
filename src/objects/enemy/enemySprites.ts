/**
 * 敵の歩行スプライト・呼吸スプライトの取り付け。
 */
import Phaser from 'phaser'
import {
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
  ENEMY_BRANCH_BREATH_SPRITE_KEY,
  ENEMY_BRANCH_BREATH_DISPLAY_HEIGHT,
  ENEMY_BRANCH_BREATH_OUTLINE_SCALE,
  ENEMY_BRANCH_BREATH_SCALE_Y_MAX,
  ENEMY_BRANCH_BREATH_SCALE_Y_MIN,
  ENEMY_BRANCH_BREATH_DURATION_MS,
  ENEMY_GRAVESTONE_BREATH_SPRITE_KEY,
  ENEMY_GRAVESTONE_BREATH_DISPLAY_HEIGHT,
  ENEMY_GRAVESTONE_BREATH_OUTLINE_SCALE,
  ENEMY_GRAVESTONE_BREATH_SCALE_Y_MAX,
  ENEMY_GRAVESTONE_BREATH_SCALE_Y_MIN,
  ENEMY_GRAVESTONE_BREATH_DURATION_MS,
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
} from '../../GameConstants'
import { BreathingSprite } from '../BreathingSprite'
import { enemyBreathingSpriteMap, enemyWalkSpriteMap } from './enemyInternal'

export type EnemyWalkDirection = 'down' | 'up' | 'left' | 'right'

export const ENEMY_WALK_COLUMN_BY_DIRECTION: Record<EnemyWalkDirection, number> = {
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
export function attachSlimeBreathingSprite(
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
export function attachBeeBreathingSprite(
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
export function attachMudSlimeBreathingSprite(
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
export function attachMushroomBreathingSprite(
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
export function attachSpiritFireBreathingSprite(
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
export function attachSpiritThunderBreathingSprite(
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
export function attachBurningTreeBreathingSprite(
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
export function attachAshKnightBreathingSprite(
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
export function attachChaosElementalBreathingSprite(
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
export function attachStumpBreathingSprite(
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
export function attachBeetleBreathingSprite(
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
export function attachBranchBreathingSprite(
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
export function attachGravestoneBreathingSprite(
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
export function attachSlimeWalkSprite(
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
export function attachSnakeWalkSprite(
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
export function attachChargerWalkSprite(
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
export function attachArmoredWalkSprite(
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

