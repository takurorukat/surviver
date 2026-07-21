/**
 * プレイヤー本体の生成（見た目 + Arcade 物理ボディ）。
 *
 * 役割の分担:
 * - このファイル: 矩形スプライトと円形ヒットボックスを作り、初期位置・物理設定を整える
 * - 実際の移動: PlayerMovementSystem が毎フレーム body.setVelocity で行う
 *   （速度は GameScene.currentMoveSpeed。ここでは PLAYER_SPEED を上限としてボディに渡す）
 * - 被ダメ・ノックバック・攻撃などは GameScene / 各 System 側
 *
 * Python で言うと「プレイヤーオブジェクトのファクトリ関数」に近い。
 */
import Phaser from 'phaser'
import {
  PLAY_AREA_ORIGIN_X,
  PLAY_AREA_ORIGIN_Y,
  PLAY_AREA_WIDTH,
  PLAY_AREA_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_RADIUS,
  PLAYER_COLOR,
  PLAYER_SPEED,
  PLAYER_WALK_SPRITE_KEY,
  PLAYER_WALK_FRAME_SIZE,
  PLAYER_WALK_FRAME_RATE,
  PLAYER_WALK_DISPLAY_SIZE,
} from '../GameConstants'
import { setupCircleHitbox } from '../utils/setupCircleHitbox'
import { configureArcadeBodyForConstantSpeed } from '../utils/arcadePhysicsHelpers'
import { applyDevEntityDepth } from '../utils/applyDevEntityDepth'

/**
 * プレイエリア中央にプレイヤーを1体生成して返す。
 *
 * 手順の流れ:
 * 1. 見た目は青い Rectangle（座標直接移動はしない）
 * 2. physics.add.existing で Arcade Body を付ける
 * 3. 円形ヒットボックス・一定速度用の物理設定を適用
 * 4. 描画順（depth）を設定し、開発用フラグがあれば前面判定用に下げる
 *
 * @returns 物理ボディ付きの Rectangle（以後は GameScene が保持して動かす）
 */
export function createPlayer(scene: Phaser.Scene): Phaser.GameObjects.Rectangle {
  // プレイエリアの幾何中心（HUD 下の正方形エリア内）
  const startX = PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH / 2
  const startY = PLAY_AREA_ORIGIN_Y + PLAY_AREA_HEIGHT / 2

  const player = scene.add.rectangle(
    startX,
    startY,
    PLAYER_WIDTH,
    PLAYER_HEIGHT,
    PLAYER_COLOR,
  )

  scene.physics.add.existing(player)
  const body = player.body as Phaser.Physics.Arcade.Body
  // ワールド端で止める（プレイエリア外へ出ない）
  body.setCollideWorldBounds(true)
  // 敵との押し合いで動かされない（ダメージは overlap 側で処理）
  body.setImmovable(true)
  // velocity で動かす前提。moves=false だと setVelocity が効かない
  body.moves = true
  body.setVelocity(0, 0)
  // 見た目は四角、当たりは円（PLAYER_RADIUS）
  setupCircleHitbox(body, PLAYER_RADIUS, PLAYER_WIDTH, PLAYER_HEIGHT)
  // ドラッグ等を切って、一定速度移動がぶれないようにする
  configureArcadeBodyForConstantSpeed(body, PLAYER_SPEED)
  // GameObject の座標・サイズを Body に反映
  body.updateFromGameObject()
  player.setDepth(10)
  // DEV_INVERT_LAYER_ORDER が true のとき、ヒットボックス表示の下に回す
  applyDevEntityDepth(player)

  return player
}

// 歩行アニメの向き（スプライトシートの列に対応）
type WalkDirection = 'down' | 'up' | 'left' | 'right'

// シートは4×4で、列 = 向き。フレーム番号は行方向に 0,1,2,3 / 4,5,6,7 ... と並ぶので、
// ある向きのアニメは「列番号, 列番号+4, 列番号+8, 列番号+12」の4コマになる。
const WALK_COLUMN_BY_DIRECTION: Record<WalkDirection, number> = {
  down: 0,
  up: 1,
  left: 2,
  right: 3,
}

function getWalkAnimationKey(direction: WalkDirection): string {
  return `player-walk-${direction}`
}

/** 4方向ぶんの歩行アニメーションを一度だけ登録する。 */
function ensureWalkAnimations(scene: Phaser.Scene): void {
  const directions: WalkDirection[] = ['down', 'up', 'left', 'right']
  for (let index = 0; index < directions.length; index++) {
    const direction = directions[index]
    const animationKey = getWalkAnimationKey(direction)
    if (scene.anims.exists(animationKey)) {
      continue
    }
    const column = WALK_COLUMN_BY_DIRECTION[direction]
    scene.anims.create({
      key: animationKey,
      frames: scene.anims.generateFrameNumbers(PLAYER_WALK_SPRITE_KEY, {
        frames: [column, column + 4, column + 8, column + 12],
      }),
      frameRate: PLAYER_WALK_FRAME_RATE,
      repeat: -1,
    })
  }
}

/**
 * プレイヤーの見た目用スプライトを作る（物理は今まで通り Rectangle 側）。
 * 毎フレーム updatePlayerWalkSprite で位置と向きを追従させる。
 */
export function createPlayerWalkSprite(
  scene: Phaser.Scene,
  player: Phaser.GameObjects.Rectangle,
): Phaser.GameObjects.Sprite {
  ensureWalkAnimations(scene)

  const sprite = scene.add.sprite(player.x, player.y, PLAYER_WALK_SPRITE_KEY, 0)
  // コマ内の余白ぶんを補うため、当たり判定より少し大きく表示する
  sprite.setScale(PLAYER_WALK_DISPLAY_SIZE / PLAYER_WALK_FRAME_SIZE)
  sprite.setDepth(player.depth)
  sprite.setData('walkDirection', 'down')
  return sprite
}

/**
 * プレイヤーの速度に合わせて、スプライトの位置・向き・再生状態を更新する。
 * GameScene.update から毎フレーム呼ぶ。
 * 止まっているときはアニメを止めて、最後に向いていた方向の立ち絵にする。
 */
export function updatePlayerWalkSprite(
  sprite: Phaser.GameObjects.Sprite,
  player: Phaser.GameObjects.Rectangle,
  body: Phaser.Physics.Arcade.Body,
): void {
  sprite.setPosition(player.x, player.y)
  // 無敵中の点滅（Rectangle の alpha 変化）をそのまま反映する
  sprite.setAlpha(player.alpha)

  const velocityX = body.velocity.x
  const velocityY = body.velocity.y
  const isMoving = Math.abs(velocityX) > 1 || Math.abs(velocityY) > 1

  if (!isMoving) {
    const lastDirection = sprite.getData('walkDirection') as WalkDirection
    sprite.anims.stop()
    sprite.setFrame(WALK_COLUMN_BY_DIRECTION[lastDirection])
    return
  }

  // 速度の大きい軸を向きとして採用する
  let direction: WalkDirection
  if (Math.abs(velocityX) >= Math.abs(velocityY)) {
    direction = velocityX >= 0 ? 'right' : 'left'
  } else {
    direction = velocityY >= 0 ? 'down' : 'up'
  }

  sprite.setData('walkDirection', direction)
  sprite.anims.play(getWalkAnimationKey(direction), true)
}
