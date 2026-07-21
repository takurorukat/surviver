// ============================================================
// EnemyMovementSystem.ts
// ------------------------------------------------------------
// 敵の移動更新（近接は追尾、射撃型はプレイヤー攻撃レンジ外で距離を保つ）。
//
// 役割:
//   - 毎フレーム、敵グループ全員の body.setVelocity を設定する
//   - 速度は敵データの speed だけを使う（座標の直接書き換えはしない）
//
// 呼び出し元:
//   - GameScene.ts … update 内で updateEnemyChaseMovement(...)
//
// 関連ファイル:
//   - objects/Enemy.ts … 敵生成時に speed / isRanged / isDefeated を setData
//   - GameConstants.ts … 射撃型の外側マージン・保持帯・プレイエリア境界
//
// 敵移動ルール（Phaser 任せ）
// ------------------------------------------------------------
// 1. 速度は敵データの speed だけを使う
// 2. 近接: body.setVelocity でプレイヤー方向へ追いかける
// 3. 射撃: プレイヤー攻撃レンジ内／近すぎ → 逃げる
//          遠すぎ → 近づく / レンジ外の好み帯では止まる
// 4. 【上位ルール】全敵は setCollideWorldBounds(true)（Enemy.ts で設定）。
//    ここでどんな速度を出しても、物理エンジンがプレイエリア境界で止める。
//    射撃型はさらに、端で外向きの逃げ速度を打ち消す（壁に押し付け続けない）
// ============================================================

import Phaser from 'phaser'
import {
  ENEMY_RADIUS,
  ENEMY_RANGED_OUTSIDE_RANGE_MARGIN,
  ENEMY_RANGED_HOLD_BAND,
  PLAY_AREA_ORIGIN_X,
  PLAY_AREA_ORIGIN_Y,
  PLAY_AREA_WIDTH,
  PLAY_AREA_HEIGHT,
  ENEMY_CHARGE_TRIGGER_DISTANCE,
  ENEMY_CHARGE_SPEED_MULTIPLIER,
  ENEMY_CHARGE_DURATION_MS,
  ENEMY_CHARGE_COOLDOWN_MS,
  ENEMY_BEETLE_CHARGE_TRIGGER_DISTANCE,
  ENEMY_BEETLE_CHARGE_SPEED_MULTIPLIER,
  ENEMY_BEETLE_CHARGE_WINDUP_MS,
  ENEMY_BEETLE_CHARGE_DURATION_MS,
  ENEMY_BEETLE_CHARGE_COOLDOWN_MS,
} from '../GameConstants'
import { configureArcadeBodyForConstantSpeed } from '../utils/arcadePhysicsHelpers'

/**
 * 敵の移動を更新する（近接は追尾、射撃はプレイヤー攻撃レンジ基準）。
 * GameScene.update から毎フレーム呼ばれる。
 */
export function updateEnemyChaseMovement(
  enemyGroup: Phaser.Physics.Arcade.Group,
  playerX: number,
  playerY: number,
  playerAttackRange: number,
): void {
  const children = enemyGroup.getChildren()

  for (let index = 0; index < children.length; index++) {
    const enemy = children[index] as Phaser.GameObjects.Rectangle
    if (!enemy.active) {
      continue
    }

    const body = enemy.body as Phaser.Physics.Arcade.Body

    // 撃破演出中は動かさない
    if (enemy.getData('isDefeated') === true) {
      body.setVelocity(0, 0)
      continue
    }

    // 墓石など、出現位置から動かない敵
    if (enemy.getData('isStationary') === true) {
      body.setVelocity(0, 0)
      continue
    }

    const speed = enemy.getData('speed') as number
    if (typeof speed !== 'number') {
      continue
    }

    if (enemy.getData('enemyKind') === 'beetle') {
      applyBeetleMovement(enemy, body, playerX, playerY)
      continue
    }

    if (enemy.getData('enemyKind') === 'charger') {
      applyChargerMovement(enemy, body, playerX, playerY)
      continue
    }

    if (enemy.getData('isRanged') === true) {
      applyRangedEnemyMovement(enemy, body, playerX, playerY, speed, playerAttackRange)
      continue
    }

    applyMeleeEnemyChase(enemy, body, playerX, playerY, speed)
  }
}

/**
 * カブトムシ: プレイヤー初期レンジ内に近づいたら、
 * 0.3秒止まってから、その瞬間のプレイヤー位置へ一直線に 4 倍速で突進する。
 */
function applyBeetleMovement(
  enemy: Phaser.GameObjects.Rectangle,
  body: Phaser.Physics.Arcade.Body,
  playerX: number,
  playerY: number,
): void {
  const now = enemy.scene.time.now
  const normalSpeed = enemy.getData('normalSpeed') as number
  const windupEndsAtMs = enemy.getData('beetleWindupEndsAtMs') as number
  const chargeEndsAtMs = enemy.getData('beetleChargeEndsAtMs') as number

  // 溜め中: 完全停止（方向は溜め開始時に固定済み）
  if (windupEndsAtMs > 0 && now < windupEndsAtMs) {
    body.setVelocity(0, 0)
    return
  }

  // 溜め終了 → 固定方向へ突進開始
  if (windupEndsAtMs > 0 && now >= windupEndsAtMs) {
    enemy.setData('beetleWindupEndsAtMs', 0)
    const directionX = enemy.getData('beetleChargeDirectionX') as number
    const directionY = enemy.getData('beetleChargeDirectionY') as number
    const chargeSpeed = normalSpeed * ENEMY_BEETLE_CHARGE_SPEED_MULTIPLIER
    enemy.setData('beetleChargeEndsAtMs', now + ENEMY_BEETLE_CHARGE_DURATION_MS)
    enemy.setData('speed', chargeSpeed)
    configureArcadeBodyForConstantSpeed(body, chargeSpeed)
    body.setVelocity(directionX * chargeSpeed, directionY * chargeSpeed)
    return
  }

  // 突進中: 開始時に決めた一直線の方向を保つ
  if (chargeEndsAtMs > 0 && now < chargeEndsAtMs) {
    const directionX = enemy.getData('beetleChargeDirectionX') as number
    const directionY = enemy.getData('beetleChargeDirectionY') as number
    const chargeSpeed = normalSpeed * ENEMY_BEETLE_CHARGE_SPEED_MULTIPLIER
    // maxVelocity が通常速度のままだと突進速度がクリップされるので都度上げる
    configureArcadeBodyForConstantSpeed(body, chargeSpeed)
    body.setVelocity(directionX * chargeSpeed, directionY * chargeSpeed)
    return
  }

  // 突進終了 → 通常速度に戻してクールダウン
  if (chargeEndsAtMs > 0 && now >= chargeEndsAtMs) {
    enemy.setData('beetleChargeEndsAtMs', 0)
    enemy.setData('speed', normalSpeed)
    enemy.setData('beetleNextChargeAtMs', now + ENEMY_BEETLE_CHARGE_COOLDOWN_MS)
    configureArcadeBodyForConstantSpeed(body, normalSpeed)
  }

  const dx = playerX - enemy.x
  const dy = playerY - enemy.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const nextChargeAtMs = enemy.getData('beetleNextChargeAtMs') as number

  // 初期攻撃レンジ内に入ったら、0.3秒止まってから突進する準備
  if (
    distance > 0 &&
    distance <= ENEMY_BEETLE_CHARGE_TRIGGER_DISTANCE &&
    now >= nextChargeAtMs
  ) {
    const directionX = dx / distance
    const directionY = dy / distance
    enemy.setData('beetleChargeDirectionX', directionX)
    enemy.setData('beetleChargeDirectionY', directionY)
    enemy.setData('beetleWindupEndsAtMs', now + ENEMY_BEETLE_CHARGE_WINDUP_MS)
    enemy.setData('speed', 0)
    body.setVelocity(0, 0)
    return
  }

  // 遠距離: 通常速度で追尾
  enemy.setData('speed', normalSpeed)
  configureArcadeBodyForConstantSpeed(body, normalSpeed)
  applyMeleeEnemyChase(enemy, body, playerX, playerY, normalSpeed)
}

/**
 * 突進敵: 近距離に入った瞬間の方向を固定し、一定時間だけ加速する。
 * 突進終了後は通常速度へ戻し、少し待ってから再び狙う。
 */
function applyChargerMovement(
  enemy: Phaser.GameObjects.Rectangle,
  body: Phaser.Physics.Arcade.Body,
  playerX: number,
  playerY: number,
): void {
  const now = enemy.scene.time.now
  const isCharging = enemy.getData('isCharging') === true
  const chargeEndsAtMs = enemy.getData('chargeEndsAtMs') as number

  if (isCharging && now < chargeEndsAtMs) {
    const directionX = enemy.getData('chargeDirectionX') as number
    const directionY = enemy.getData('chargeDirectionY') as number
    const chargeSpeed = enemy.getData('speed') as number
    configureArcadeBodyForConstantSpeed(body, chargeSpeed)
    body.setVelocity(directionX * chargeSpeed, directionY * chargeSpeed)
    return
  }

  if (isCharging) {
    const normalSpeed = enemy.getData('normalSpeed') as number
    enemy.setData('speed', normalSpeed)
    enemy.setData('isCharging', false)
    enemy.setData('nextChargeAtMs', now + ENEMY_CHARGE_COOLDOWN_MS)
    configureArcadeBodyForConstantSpeed(body, normalSpeed)
  }

  const dx = playerX - enemy.x
  const dy = playerY - enemy.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const nextChargeAtMs = enemy.getData('nextChargeAtMs') as number

  if (distance > 0 && distance <= ENEMY_CHARGE_TRIGGER_DISTANCE && now >= nextChargeAtMs) {
    const directionX = dx / distance
    const directionY = dy / distance
    const normalSpeed = enemy.getData('normalSpeed') as number
    const chargeSpeed = normalSpeed * ENEMY_CHARGE_SPEED_MULTIPLIER

    enemy.setData('chargeDirectionX', directionX)
    enemy.setData('chargeDirectionY', directionY)
    enemy.setData('isCharging', true)
    enemy.setData('chargeEndsAtMs', now + ENEMY_CHARGE_DURATION_MS)
    enemy.setData('speed', chargeSpeed)

    configureArcadeBodyForConstantSpeed(body, chargeSpeed)
    body.setVelocity(directionX * chargeSpeed, directionY * chargeSpeed)
    return
  }

  const normalSpeed = enemy.getData('normalSpeed') as number
  configureArcadeBodyForConstantSpeed(body, normalSpeed)
  applyMeleeEnemyChase(enemy, body, playerX, playerY, normalSpeed)
}

/**
 * 近接敵: プレイヤー方向の単位ベクトル × speed で追いかける。
 * ほぼ重なっているときは止まる（ゼロ割・振動防止）。
 */
function applyMeleeEnemyChase(
  enemy: Phaser.GameObjects.Rectangle,
  body: Phaser.Physics.Arcade.Body,
  playerX: number,
  playerY: number,
  speed: number,
): void {
  const dx = playerX - enemy.x
  const dy = playerY - enemy.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  if (distance < 1) {
    body.setVelocity(0, 0)
    return
  }

  // (dx/distance, dy/distance) が方向の単位ベクトル
  body.setVelocity((dx / distance) * speed, (dy / distance) * speed)
}

/**
 * 射撃型の立ち位置（プレイヤー攻撃レンジの外側）。
 * レンジが広がると min/max も一緒に外側へずれる。
 */
function calculateRangedHoldDistances(playerAttackRange: number): {
  minDistance: number
  maxDistance: number
} {
  const minDistance = playerAttackRange + ENEMY_RANGED_OUTSIDE_RANGE_MARGIN
  const maxDistance = minDistance + ENEMY_RANGED_HOLD_BAND
  return { minDistance, maxDistance }
}

/**
 * 射撃型: 攻撃レンジ内／近すぎ → 逃げる / 遠すぎ → 近づく / 帯内 → 停止して撃つ。
 * 移動はすべて setRangedVelocityInsidePlayArea 経由（画面外へ出ない）。
 */
function applyRangedEnemyMovement(
  enemy: Phaser.GameObjects.Rectangle,
  body: Phaser.Physics.Arcade.Body,
  playerX: number,
  playerY: number,
  speed: number,
  playerAttackRange: number,
): void {
  const dx = playerX - enemy.x
  const dy = playerY - enemy.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  if (distance < 1) {
    // 重なり時は上方向へ少し逃がす（レンジ外を取りに行く）
    setRangedVelocityInsidePlayArea(enemy, body, 0, -speed)
    return
  }

  const dirX = dx / distance
  const dirY = dy / distance
  const hold = calculateRangedHoldDistances(playerAttackRange)

  if (distance < hold.minDistance) {
    // 攻撃レンジ内、またはレンジ直外のマージン内 → プレイヤーから離れる
    setRangedVelocityInsidePlayArea(enemy, body, -dirX * speed, -dirY * speed)
    return
  }

  if (distance > hold.maxDistance) {
    setRangedVelocityInsidePlayArea(enemy, body, dirX * speed, dirY * speed)
    return
  }

  // レンジ外の好み帯: 止まって射撃（射撃ロジックは別システム）
  body.setVelocity(0, 0)
}

/**
 * プレイエリア端にいるとき、外へ向かう速度成分だけ消し、画面内に留める。
 * 近接敵には使わない（近接は壁際でもプレイヤーへ向かってよい）。
 */
function setRangedVelocityInsidePlayArea(
  enemy: Phaser.GameObjects.Rectangle,
  body: Phaser.Physics.Arcade.Body,
  velocityX: number,
  velocityY: number,
): void {
  const minX = PLAY_AREA_ORIGIN_X + ENEMY_RADIUS
  const maxX = PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH - ENEMY_RADIUS
  const minY = PLAY_AREA_ORIGIN_Y + ENEMY_RADIUS
  const maxY = PLAY_AREA_ORIGIN_Y + PLAY_AREA_HEIGHT - ENEMY_RADIUS

  let nextVelocityX = velocityX
  let nextVelocityY = velocityY

  // 左端にいるのに左へ動こうとしている → X 速度を 0
  if (enemy.x <= minX && nextVelocityX < 0) {
    nextVelocityX = 0
  }
  if (enemy.x >= maxX && nextVelocityX > 0) {
    nextVelocityX = 0
  }
  if (enemy.y <= minY && nextVelocityY < 0) {
    nextVelocityY = 0
  }
  if (enemy.y >= maxY && nextVelocityY > 0) {
    nextVelocityY = 0
  }

  body.setVelocity(nextVelocityX, nextVelocityY)
}
