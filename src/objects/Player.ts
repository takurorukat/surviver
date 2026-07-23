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
  PLAYER_WALK_DISPLAY_SIZE,
  PLAYER_WALK_DISPLAY_SCALE_X,
  PLAYER_FACING_FRAME_DOWN,
  PLAYER_FACING_FRAME_SIDE,
  PLAYER_FACING_FRAME_UP,
  PLAYER_BREATH_OUTLINE_SCALE,
  PLAYER_BREATH_SCALE_Y_MAX,
  PLAYER_BREATH_SCALE_Y_MIN,
  PLAYER_BREATH_DURATION_MS,
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

// 向き（歩行コマは使わず、静止絵1枚ずつ）
// side = 右向き横顔。左移動時は flipX で反転する（敵と同じ）
type FacingDirection = 'down' | 'up' | 'side'

const FACING_FRAME_BY_DIRECTION: Record<FacingDirection, number> = {
  down: PLAYER_FACING_FRAME_DOWN,
  side: PLAYER_FACING_FRAME_SIDE,
  up: PLAYER_FACING_FRAME_UP,
}

/** プレイヤー見た目（本体 + 黒枠 + 呼吸）。物理は Rectangle 側。 */
export type PlayerWalkVisual = {
  body: Phaser.GameObjects.Image
  outline: Phaser.GameObjects.Image
  // 縦の基準倍率（呼吸の scaleY に使う）
  baseScaleY: number
  // 横の基準倍率（頭身補正で baseScaleY より大きい）
  baseScaleX: number
  outlineScaleMultiplier: number
  breathTween: Phaser.Tweens.Tween | null
}

/** 枠を本体の見た目中心に合わせ、同じ比率で少し大きくする。 */
function syncPlayerOutlineToBody(visual: PlayerWalkVisual): void {
  const body = visual.body
  const centerX = body.x
  // 本体は足元原点なので、中心は「足元から displayHeight/2 だけ上」
  const centerY = body.y - body.displayHeight / 2
  visual.outline.setPosition(centerX, centerY)
  visual.outline.setScale(
    body.scaleX * visual.outlineScaleMultiplier,
    body.scaleY * visual.outlineScaleMultiplier,
  )
  visual.outline.setFrame(body.frame.name)
  visual.outline.setFlipX(body.flipX)
}

function startPlayerBreathing(scene: Phaser.Scene, visual: PlayerWalkVisual): void {
  // 体積感: Yが伸びるとき X を少し減らす（平均1付近を保つ）
  // Python: scale_x = base_x * (2 - scale_y) に相当
  const bodyScaleXAtMax = visual.baseScaleX * (2 - PLAYER_BREATH_SCALE_Y_MAX)
  const bodyScaleXAtMin = visual.baseScaleX * (2 - PLAYER_BREATH_SCALE_Y_MIN)
  const bodyScaleYAtMax = visual.baseScaleY * PLAYER_BREATH_SCALE_Y_MAX
  const bodyScaleYAtMin = visual.baseScaleY * PLAYER_BREATH_SCALE_Y_MIN

  visual.body.setScale(bodyScaleXAtMin, bodyScaleYAtMin)
  syncPlayerOutlineToBody(visual)

  visual.breathTween = scene.tweens.add({
    targets: visual.body,
    scaleX: bodyScaleXAtMax,
    scaleY: bodyScaleYAtMax,
    duration: PLAYER_BREATH_DURATION_MS,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut',
    onUpdate: () => {
      syncPlayerOutlineToBody(visual)
    },
  })
}

function applyFacingToVisual(
  visual: PlayerWalkVisual,
  direction: FacingDirection,
  faceRight: boolean,
): void {
  const body = visual.body
  body.setFrame(FACING_FRAME_BY_DIRECTION[direction])
  // 横顔シートは右向き。左へ行くときだけ反転
  if (direction === 'side') {
    body.setFlipX(!faceRight)
  } else {
    body.setFlipX(false)
  }
  body.setData('facingDirection', direction)
  body.setData('faceRight', faceRight)
  syncPlayerOutlineToBody(visual)
}

/**
 * プレイヤーの見た目を作る（物理は今まで通り Rectangle 側）。
 * 歩行アニメは使わず、正面／横顔／背中の静止絵＋黒枠＋呼吸（敵と同じ方式）。
 */
export function createPlayerWalkSprite(
  scene: Phaser.Scene,
  player: Phaser.GameObjects.Rectangle,
): PlayerWalkVisual {
  const baseScaleY = PLAYER_WALK_DISPLAY_SIZE / PLAYER_WALK_FRAME_SIZE
  const baseScaleX = baseScaleY * PLAYER_WALK_DISPLAY_SCALE_X
  const feetY = player.y + PLAYER_HEIGHT / 2

  // 枠は中心基準で拡大 → 上下左右の太さが均等になる
  const outline = scene.add.image(
    player.x,
    player.y,
    PLAYER_WALK_SPRITE_KEY,
    PLAYER_FACING_FRAME_DOWN,
  )
  outline.setOrigin(0.5, 0.5)
  outline.setTint(0x000000)
  outline.setScale(
    baseScaleX * PLAYER_BREATH_OUTLINE_SCALE,
    baseScaleY * PLAYER_BREATH_OUTLINE_SCALE,
  )
  outline.setDepth(player.depth)

  // 本体は足元基準。伸び縮みしても下端が動かない
  const body = scene.add.image(
    player.x,
    feetY,
    PLAYER_WALK_SPRITE_KEY,
    PLAYER_FACING_FRAME_DOWN,
  )
  body.setOrigin(0.5, 1)
  body.setScale(baseScaleX, baseScaleY)
  body.setDepth(player.depth + 1)
  body.setData('facingDirection', 'down')
  body.setData('faceRight', true)

  const visual: PlayerWalkVisual = {
    body,
    outline,
    baseScaleX,
    baseScaleY,
    outlineScaleMultiplier: PLAYER_BREATH_OUTLINE_SCALE,
    breathTween: null,
  }
  syncPlayerOutlineToBody(visual)
  startPlayerBreathing(scene, visual)
  return visual
}

/**
 * プレイヤーの速度に合わせて、見た目の位置・向きを更新する。
 * 歩行コマは切り替えない。向きの静止絵と左右反転だけ変える。
 * GameScene.update から毎フレーム呼ぶ。
 */
export function updatePlayerWalkSprite(
  visual: PlayerWalkVisual,
  player: Phaser.GameObjects.Rectangle,
  body: Phaser.Physics.Arcade.Body,
): void {
  const sprite = visual.body
  // 物理中心 → 足元（当たり判定の下端）
  const feetY = player.y + PLAYER_HEIGHT / 2
  sprite.setPosition(player.x, feetY)
  // 無敵中の点滅（Rectangle の alpha 変化）をそのまま反映する
  sprite.setAlpha(player.alpha)
  visual.outline.setAlpha(player.alpha)

  const velocityX = body.velocity.x
  const velocityY = body.velocity.y
  const isMoving = Math.abs(velocityX) > 1 || Math.abs(velocityY) > 1

  if (!isMoving) {
    // 停止中も最後の向きを維持（絵は変えず枠だけ同期）
    syncPlayerOutlineToBody(visual)
    return
  }

  // 速度の大きい軸を向きとして採用する
  let direction: FacingDirection
  let faceRight = sprite.getData('faceRight') as boolean
  if (Math.abs(velocityX) >= Math.abs(velocityY)) {
    direction = 'side'
    faceRight = velocityX >= 0
  } else {
    direction = velocityY >= 0 ? 'down' : 'up'
  }

  applyFacingToVisual(visual, direction, faceRight)
}
