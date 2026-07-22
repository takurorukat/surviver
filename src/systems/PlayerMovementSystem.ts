// ============================================================
// プレイヤー移動ルール（Phaser 任せ / velocity 前提）
// ------------------------------------------------------------
// 1. 速度は GameScene の currentMoveSpeed だけを使う
// 2. body.setVelocity で動かす（座標は直接書き換えない）
// 3. WASD / 矢印キーを押したらキーボードモード
// 4. キーボードモード中にキーを離したら停止（ポインタへ引かれない）
// 5. タッチ／マウス押し込み中は相対追従（起点＋移動量×倍率の点へ向かう）
// 6. 新規開始時のデフォルトはキーボードモード（止まっている状態）
// 7. 1描画フレームで届く距離なら止める（通り過ぎ防止・相対追従時）
// GameScene はノックバック中でないとき、物理ステップ直前に applyPlayerMovement を呼ぶ
// ============================================================

import Phaser from 'phaser'
import {
  PLAYER_RADIUS,
  POINTER_FOLLOW_DRAG_GAIN,
  POINTER_FOLLOW_MOUSE_USES_RELATIVE,
  POINTER_FOLLOW_MARKER_RADIUS,
  POINTER_FOLLOW_MARKER_COLOR,
  POINTER_FOLLOW_MARKER_ALPHA,
  POINTER_FOLLOW_MARKER_DEPTH,
  POINTER_FOLLOW_MARKER_STROKE_WIDTH,
} from '../GameConstants'
import { configureArcadeBodyForConstantSpeed } from '../utils/arcadePhysicsHelpers'

// プレイ可能エリア（ポインタ目標のクランプに使う）
export type PlayAreaBounds = {
  left: number
  top: number
  width: number
  height: number
}

// 移動モード（GameScene が保持する）
// isKeyboardMode=true の間はポインタ追従しない
// isRelativeFollowActive=true のときだけ相対追従（指／マウスを押している間）
export type MovementState = {
  isKeyboardMode: boolean
  allowMouseFollow: boolean
  isRelativeFollowActive: boolean
  // 押した瞬間のポインタ位置（ワールド座標）
  relativeOriginX: number
  relativeOriginY: number
  // 押した瞬間のプレイヤー位置（目標計算の基準）
  relativeBasePlayerX: number
  relativeBasePlayerY: number
  // 追従を開始したポインタ ID（別指の up で誤って解除しない）
  relativePointerId: number
}

// 目標点の薄いマーカー
export type PointerFollowMarker = {
  ring: Phaser.GameObjects.Arc
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

export function createInitialMovementState(isKeyboardMode: boolean): MovementState {
  return {
    isKeyboardMode,
    allowMouseFollow: false,
    isRelativeFollowActive: false,
    relativeOriginX: 0,
    relativeOriginY: 0,
    relativeBasePlayerX: 0,
    relativeBasePlayerY: 0,
    relativePointerId: -1,
  }
}

// 目標マーカーを作る（最初は非表示）
export function createPointerFollowMarker(scene: Phaser.Scene): PointerFollowMarker {
  const ring = scene.add.circle(
    0,
    0,
    POINTER_FOLLOW_MARKER_RADIUS,
    POINTER_FOLLOW_MARKER_COLOR,
    0,
  )
  ring.setStrokeStyle(
    POINTER_FOLLOW_MARKER_STROKE_WIDTH,
    POINTER_FOLLOW_MARKER_COLOR,
    POINTER_FOLLOW_MARKER_ALPHA,
  )
  ring.setDepth(POINTER_FOLLOW_MARKER_DEPTH)
  ring.setVisible(false)
  return { ring }
}

export function hidePointerFollowMarker(marker: PointerFollowMarker | null): void {
  if (marker === null) {
    return
  }
  marker.ring.setVisible(false)
}

export function destroyPointerFollowMarker(marker: PointerFollowMarker | null): void {
  if (marker === null) {
    return
  }
  marker.ring.destroy()
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

// 座標をプレイエリア内（プレイヤー半径ぶん余白）に収める
function clampPointToPlayArea(
  pointX: number,
  pointY: number,
  playArea: PlayAreaBounds,
): { x: number; y: number } {
  const minX = playArea.left + PLAYER_RADIUS
  const maxX = playArea.left + playArea.width - PLAYER_RADIUS
  const minY = playArea.top + PLAYER_RADIUS
  const maxY = playArea.top + playArea.height - PLAYER_RADIUS

  let clampedX = pointX
  let clampedY = pointY

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

// 相対追従を開始したポインタを ID で探す
function findPointerById(
  scene: Phaser.Scene,
  pointerId: number,
): Phaser.Input.Pointer | null {
  const pointers = scene.input.manager.pointers
  for (let index = 0; index < pointers.length; index++) {
    const pointer = pointers[index]
    if (pointer.id === pointerId) {
      return pointer
    }
  }
  return null
}

// 相対追従の目標点を計算する
// Python: base + gain * (pointer - origin) に相当
function calculateRelativeFollowTarget(
  movementState: MovementState,
  pointerWorldX: number,
  pointerWorldY: number,
  playArea: PlayAreaBounds,
): { x: number; y: number } {
  const deltaX = pointerWorldX - movementState.relativeOriginX
  const deltaY = pointerWorldY - movementState.relativeOriginY
  const rawX = movementState.relativeBasePlayerX + deltaX * POINTER_FOLLOW_DRAG_GAIN
  const rawY = movementState.relativeBasePlayerY + deltaY * POINTER_FOLLOW_DRAG_GAIN
  return clampPointToPlayArea(rawX, rawY, playArea)
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

// 相対追従を開始する（pointerdown から呼ぶ）
export function beginRelativePointerFollow(
  movementState: MovementState,
  pointer: Phaser.Input.Pointer,
  playerX: number,
  playerY: number,
): void {
  movementState.isKeyboardMode = false
  movementState.allowMouseFollow = true
  movementState.isRelativeFollowActive = true
  movementState.relativeOriginX = pointer.worldX
  movementState.relativeOriginY = pointer.worldY
  movementState.relativeBasePlayerX = playerX
  movementState.relativeBasePlayerY = playerY
  movementState.relativePointerId = pointer.id
}

// 旧方式: クリック後、ポインタ位置そのものへ追従（マウス用・定数で切替）
export function beginAbsolutePointerFollow(movementState: MovementState): void {
  movementState.isKeyboardMode = false
  movementState.allowMouseFollow = true
  movementState.isRelativeFollowActive = false
  movementState.relativePointerId = -1
}

// このポインタ入力を相対追従として扱うか（タッチは常に相対。マウスは定数）
export function shouldUseRelativePointerFollow(pointer: Phaser.Input.Pointer): boolean {
  if (pointer.wasTouch) {
    return true
  }
  return POINTER_FOLLOW_MOUSE_USES_RELATIVE
}

// 相対追従を終了する（pointerup / ポーズ / キーボード切替）
export function endRelativePointerFollow(
  movementState: MovementState,
  marker: PointerFollowMarker | null,
): void {
  movementState.isRelativeFollowActive = false
  movementState.allowMouseFollow = false
  movementState.relativePointerId = -1
  hidePointerFollowMarker(marker)
}

/**
 * 再開カウントダウン中用。キャラは動かさず、目標マーカーだけ更新する。
 * 指を離したら追従状態も解除する。
 */
export function updateRelativeFollowAimOnly(
  scene: Phaser.Scene,
  movementState: MovementState,
  playArea: PlayAreaBounds,
  marker: PointerFollowMarker | null,
): void {
  if (!movementState.isRelativeFollowActive) {
    hidePointerFollowMarker(marker)
    return
  }

  const pointer = findPointerById(scene, movementState.relativePointerId)
  if (pointer === null || !pointer.isDown) {
    endRelativePointerFollow(movementState, marker)
    return
  }

  const target = calculateRelativeFollowTarget(
    movementState,
    pointer.worldX,
    pointer.worldY,
    playArea,
  )
  if (marker !== null) {
    marker.ring.setPosition(target.x, target.y)
    marker.ring.setVisible(true)
  }
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
  deltaSeconds: number,
  marker: PointerFollowMarker | null,
): void {
  // maxVelocity が低すぎて希望速度がクリップされないようにする
  configureArcadeBodyForConstantSpeed(playerBody, moveSpeed)

  // キー入力あり → キーボードモードへ切り替え、その方向へ移動
  if (isAnyKeyboardKeyPressed(keys)) {
    endRelativePointerFollow(movementState, marker)
    movementState.isKeyboardMode = true
    const keyboardDir = getKeyboardDirection(keys)
    const normalized = normalizeDirection(keyboardDir.x, keyboardDir.y)
    playerBody.setVelocity(normalized.x * moveSpeed, normalized.y * moveSpeed)
    return
  }

  // キーを離した直後もキーボードモードのまま → 停止（ポインタに吸い寄せない）
  if (movementState.isKeyboardMode) {
    hidePointerFollowMarker(marker)
    playerBody.setVelocity(0, 0)
    return
  }

  // 相対追従中だけ、起点＋移動量×倍率の点へ向かう
  if (movementState.isRelativeFollowActive && movementState.allowMouseFollow) {
    const pointer = findPointerById(scene, movementState.relativePointerId)
    if (pointer === null || !pointer.isDown) {
      endRelativePointerFollow(movementState, marker)
      playerBody.setVelocity(0, 0)
      return
    }
    const target = calculateRelativeFollowTarget(
      movementState,
      pointer.worldX,
      pointer.worldY,
      playArea,
    )
    if (marker !== null) {
      marker.ring.setPosition(target.x, target.y)
      marker.ring.setVisible(true)
    }
    setVelocityTowardTarget(player, playerBody, target.x, target.y, moveSpeed, deltaSeconds)
    return
  }

  // 絶対追従（マウス用・POINTER_FOLLOW_MOUSE_USES_RELATIVE=false のとき）
  if (movementState.allowMouseFollow && !movementState.isRelativeFollowActive) {
    const pointer = scene.input.activePointer
    const target = clampPointToPlayArea(pointer.worldX, pointer.worldY, playArea)
    hidePointerFollowMarker(marker)
    setVelocityTowardTarget(player, playerBody, target.x, target.y, moveSpeed, deltaSeconds)
    return
  }

  hidePointerFollowMarker(marker)
  playerBody.setVelocity(0, 0)
}
