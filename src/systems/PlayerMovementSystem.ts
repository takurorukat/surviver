// ============================================================
// プレイヤー移動ルール（Phaser 任せ / velocity 前提）
// ------------------------------------------------------------
// 1. 速度は GameScene の currentMoveSpeed だけを使う
// 2. body.setVelocity で動かす（座標は直接書き換えない）
// 3. WASD / 矢印キーを押したらキーボードモード
// 4. キーボードモード中にキーを離したら停止（マウス／タッチへ引かれない）
// 5. マウスクリック後はポインタ追従モード（キー未入力時）
// 6. タッチ中だけ仮想ジョイスティック（指を置いた位置基準の相対方向）
// 7. 新規開始時のデフォルトはキーボードモード（止まっている状態）
// 8. 1描画フレームで届く距離なら止める（通り過ぎ防止・マウス追従時）
// GameScene はノックバック中でないとき、物理ステップ直前に applyPlayerMovement を呼ぶ
// ============================================================

import Phaser from 'phaser'
import { PLAYER_RADIUS } from '../GameConstants'
import { configureArcadeBodyForConstantSpeed } from '../utils/arcadePhysicsHelpers'
import type { VirtualJoystick } from './VirtualJoystick'

// プレイ可能エリア（ポインタ目標のクランプに使う）
export type PlayAreaBounds = {
  left: number
  top: number
  width: number
  height: number
}

// 移動モード（GameScene が保持する）
// isKeyboardMode=true の間はマウス追従しない
// allowMouseFollow=true のときだけマウス追従（タッチ後は false のまま）
export type MovementState = {
  isKeyboardMode: boolean
  allowMouseFollow: boolean
}

// 矢印 + WASD のキーオブジェクト一式
export type MovementKeys = {
  up: Phaser.Input.Keyboard.Key
  down: Phaser.Input.Keyboard.Key
  left: Phaser.Input.Keyboard.Key
  right: Phaser.Input.Keyboard.Key
  keyW: Phaser.Input.Keyboard.Key
  keyA: Phaser.Input.Keyboard.Key
  keyS: Phaser.Input.Keyboard.Key
  keyD: Phaser.Input.Keyboard.Key
}

// キーボード入力オブジェクトを作成する（create 時に1回）
export function createMovementKeys(scene: Phaser.Scene): MovementKeys {
  const keyboard = scene.input.keyboard
  if (keyboard === null) {
    throw new Error('キーボード入力が利用できません')
  }

  const cursors = keyboard.createCursorKeys()
  const keyCodes = Phaser.Input.Keyboard.KeyCodes

  return {
    up: cursors.up!,
    down: cursors.down!,
    left: cursors.left!,
    right: cursors.right!,
    keyW: keyboard.addKey(keyCodes.W),
    keyA: keyboard.addKey(keyCodes.A),
    keyS: keyboard.addKey(keyCodes.S),
    keyD: keyboard.addKey(keyCodes.D),
  }
}

// 方向ベクトルを長さ1に正規化する（斜め移動が速くなりすぎないように）
// Python: (x/len, y/len) if len else (0,0) に相当
function normalizeDirection(x: number, y: number): { x: number; y: number } {
  const length = Math.sqrt(x * x + y * y)
  if (length === 0) {
    return { x: 0, y: 0 }
  }
  return { x: x / length, y: y / length }
}

// 移動キーのいずれかが押されているか
function isAnyKeyboardKeyPressed(keys: MovementKeys): boolean {
  if (keys.up.isDown) return true
  if (keys.down.isDown) return true
  if (keys.left.isDown) return true
  if (keys.right.isDown) return true
  if (keys.keyW.isDown) return true
  if (keys.keyA.isDown) return true
  if (keys.keyS.isDown) return true
  if (keys.keyD.isDown) return true
  return false
}

// 押されているキーから生の方向（-1/0/1）を作る（まだ正規化しない）
function getKeyboardDirection(keys: MovementKeys): { x: number; y: number } {
  let x = 0
  let y = 0

  if (keys.left.isDown || keys.keyA.isDown) {
    x = -1
  }
  if (keys.right.isDown || keys.keyD.isDown) {
    x = 1
  }
  if (keys.up.isDown || keys.keyW.isDown) {
    y = -1
  }
  if (keys.down.isDown || keys.keyS.isDown) {
    y = 1
  }

  return { x, y }
}

// ポインタ座標をプレイエリア内（プレイヤー半径ぶん余白）に収める
function clampPointerToPlayArea(
  pointerX: number,
  pointerY: number,
  playArea: PlayAreaBounds,
): { x: number; y: number } {
  const minX = playArea.left + PLAYER_RADIUS
  const maxX = playArea.left + playArea.width - PLAYER_RADIUS
  const minY = playArea.top + PLAYER_RADIUS
  const maxY = playArea.top + playArea.height - PLAYER_RADIUS

  let clampedX = pointerX
  let clampedY = pointerY

  if (clampedX < minX) {
    clampedX = minX
  }
  if (clampedX > maxX) {
    clampedX = maxX
  }
  if (clampedY < minY) {
    clampedY = minY
  }
  if (clampedY > maxY) {
    clampedY = maxY
  }

  return { x: clampedX, y: clampedY }
}

// 現在のポインタ（マウス）のワールド座標を、プレイエリア内にクランプして返す
function getPointerTargetPosition(
  scene: Phaser.Scene,
  playArea: PlayAreaBounds,
): { x: number; y: number } {
  const pointer = scene.input.activePointer
  return clampPointerToPlayArea(pointer.worldX, pointer.worldY, playArea)
}

// 目標点へ向かう速度をセット。近すぎたら停止（通り過ぎて戻るのを防ぐ）
function setVelocityTowardTarget(
  player: Phaser.GameObjects.Rectangle,
  playerBody: Phaser.Physics.Arcade.Body,
  targetX: number,
  targetY: number,
  moveSpeed: number,
  deltaSeconds: number,
): void {
  const dx = targetX - player.x
  const dy = targetY - player.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  // この描画フレームで進める最大距離
  const stopDistance = moveSpeed * deltaSeconds

  // 1フレームで届くなら止める（通り過ぎて戻るのを防ぐ）
  if (distance <= stopDistance) {
    playerBody.setVelocity(0, 0)
    return
  }

  playerBody.setVelocity((dx / distance) * moveSpeed, (dy / distance) * moveSpeed)
}

// 毎フレーム呼ぶ：プレイヤーの速度を更新する（物理ステップの直前）
// moveSpeed は必ず GameScene.currentMoveSpeed を渡すこと
export function applyPlayerMovement(
  scene: Phaser.Scene,
  player: Phaser.GameObjects.Rectangle,
  playerBody: Phaser.Physics.Arcade.Body,
  keys: MovementKeys,
  movementState: MovementState,
  playArea: PlayAreaBounds,
  moveSpeed: number,
  virtualJoystick: VirtualJoystick,
  deltaSeconds: number,
): void {
  // maxVelocity が低すぎて希望速度がクリップされないようにする
  configureArcadeBodyForConstantSpeed(playerBody, moveSpeed)

  // キー入力あり → キーボードモードへ切り替え、その方向へ移動
  if (isAnyKeyboardKeyPressed(keys)) {
    movementState.isKeyboardMode = true
    movementState.allowMouseFollow = false
    if (virtualJoystick.isActive()) {
      virtualJoystick.cancel()
    }
    const keyboardDir = getKeyboardDirection(keys)
    const normalized = normalizeDirection(keyboardDir.x, keyboardDir.y)
    playerBody.setVelocity(normalized.x * moveSpeed, normalized.y * moveSpeed)
    return
  }

  // キーを離した直後もキーボードモードのまま → 停止（マウスに吸い寄せない）
  if (movementState.isKeyboardMode) {
    playerBody.setVelocity(0, 0)
    return
  }

  // タッチ中: 仮想ジョイスティックの力（0〜1）× 移動速度
  if (virtualJoystick.isActive()) {
    const force = virtualJoystick.getForce()
    playerBody.setVelocity(force.x * moveSpeed, force.y * moveSpeed)
    return
  }

  // マウス追従モードのときだけポインタへ追従
  if (movementState.allowMouseFollow) {
    const target = getPointerTargetPosition(scene, playArea)
    setVelocityTowardTarget(player, playerBody, target.x, target.y, moveSpeed, deltaSeconds)
    return
  }

  // タッチを離したあとなど → 停止
  playerBody.setVelocity(0, 0)
}
