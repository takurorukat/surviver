/**
 * プレイヤー弾の Group 生成・発射・メンテ・画面外削除。
 *
 * 接続先:
 * - 発射タイミング: PlayerAttackSystem（射程内の敵へ firePlayerBullet）
 * - 当たり判定: physics.add.overlap（弾 × 敵）。距離計算は使わない
 * - 貫通: hitsLeft / hitEnemyUids（同じ enemyUid に二度当たらない）
 * - collisionAge: 発射フレームでは overlap を無視（同フレーム撃破事故防止）
 *
 * 弾も座標直書きせず、body.setVelocity で飛ばす。
 * 消すときは destroy せず inactive にして Group 内で再利用する（Phaser のプール）。
 */
import Phaser from 'phaser'
import {
  PLAYER_BULLET_WIDTH,
  PLAYER_BULLET_HEIGHT,
  PLAYER_BULLET_COLOR,
  PLAYER_BULLET_SPEED,
  PLAYER_BULLET_RADIUS,
  MAX_PLAYER_BULLETS,
  PLAYER_WIDTH,
  ENTITY_OUTLINE_COLOR,
  ENTITY_OUTLINE_WIDTH,
  PLAY_AREA_ORIGIN_X,
  PLAY_AREA_ORIGIN_Y,
  PLAY_AREA_WIDTH,
  PLAY_AREA_HEIGHT,
} from '../GameConstants'
import { setupCircleHitbox } from '../utils/setupCircleHitbox'
import { applyDevEntityDepth } from '../utils/applyDevEntityDepth'

/**
 * プレイヤー弾用の Arcade Group を作る。
 * 重力なし。初期 velocity は 0（発射時に個別設定）。
 */
export function createPlayerBulletGroup(scene: Phaser.Scene): Phaser.Physics.Arcade.Group {
  return scene.physics.add.group({
    allowGravity: false,
    velocityX: 0,
    velocityY: 0,
    // プール用: 非 active の弾も Group に残す
    maxSize: MAX_PLAYER_BULLETS,
  })
}

/**
 * 弾 Body にヒットボックスと飛行速度を載せる。
 * Group.add() のあとで呼ぶこと（createCallback が velocity を 0 に戻すため）。
 */
function applyBulletBodySettings(
  body: Phaser.Physics.Arcade.Body,
  directionX: number,
  directionY: number,
): { flightVx: number; flightVy: number } {
  body.setAllowGravity(false)
  body.setCollideWorldBounds(false)
  body.enable = true
  body.moves = true
  setupCircleHitbox(body, PLAYER_BULLET_RADIUS, PLAYER_BULLET_WIDTH, PLAYER_BULLET_HEIGHT)
  // Group.add() のあとでないと createCallback が velocity を 0 に戻してしまう
  const flightVx = directionX * PLAYER_BULLET_SPEED
  const flightVy = directionY * PLAYER_BULLET_SPEED
  body.setVelocity(flightVx, flightVy)
  return { flightVx, flightVy }
}

/**
 * 弾をプールへ戻す（destroy しない）。
 * GameScene の命中処理や画面外掃除から呼ぶ。
 */
export function recyclePlayerBullet(bullet: Phaser.GameObjects.Rectangle): void {
  if (!bullet.active && bullet.body === null) {
    return
  }

  if (bullet.body !== null) {
    const body = bullet.body as Phaser.Physics.Arcade.Body
    body.enable = false
    body.setVelocity(0, 0)
  }
  bullet.setActive(false)
  bullet.setVisible(false)
}

/**
 * 弾を1発発射する（velocity で動かす）。上限超過や距離0のときは null。
 * 非 active の弾があれば再利用し、なければ新規作成する。
 *
 * @param damage 命中時ダメージ（レベルアップで増える）
 * @param maxHits 貫通で当たれる回数（pierceLevel+1）。hitsLeft に保存
 * @param maxRicochets 跳弾できる回数
 * @returns 生成した弾、または発射不可時 null
 */
export function firePlayerBullet(
  scene: Phaser.Scene,
  bulletGroup: Phaser.Physics.Arcade.Group,
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  damage: number,
  maxHits: number,
  maxRicochets: number,
): Phaser.GameObjects.Rectangle | null {
  const activeBulletCount = countActivePlayerBullets(bulletGroup)
  if (activeBulletCount >= MAX_PLAYER_BULLETS) {
    return null
  }

  const dx = targetX - startX
  const dy = targetY - startY
  const distance = Math.sqrt(dx * dx + dy * dy)

  if (distance === 0) {
    return null
  }

  // 単位ベクトル（方向だけ）
  const directionX = dx / distance
  const directionY = dy / distance

  // プレイヤー本体の少し外側から出す（自分に重ならない）
  const spawnOffset = PLAYER_WIDTH / 2 + 4
  const bulletStartX = startX + directionX * spawnOffset
  const bulletStartY = startY + directionY * spawnOffset

  // Phaser: getFirstDead(false) = 非 active の子を再利用（なければ null）
  let bullet = bulletGroup.getFirstDead(false) as Phaser.GameObjects.Rectangle | null
  if (bullet === null) {
    bullet = scene.add.rectangle(
      bulletStartX,
      bulletStartY,
      PLAYER_BULLET_WIDTH,
      PLAYER_BULLET_HEIGHT,
      PLAYER_BULLET_COLOR,
    )
    // 床タイルに溶け込まないよう黒枠で囲む
    bullet.setStrokeStyle(ENTITY_OUTLINE_WIDTH, ENTITY_OUTLINE_COLOR)
    bullet.setDepth(9)
    bulletGroup.add(bullet)
  } else {
    bullet.setPosition(bulletStartX, bulletStartY)
    bullet.setActive(true)
    bullet.setVisible(true)
  }

  bullet.setData('damage', damage)
  // 貫通 + 跳弾で当たれる合計回数
  const safeMaxHits = Math.max(1, Math.round(maxHits))
  const safeMaxRicochets = Math.max(0, Math.round(maxRicochets))
  bullet.setData('hitsLeft', safeMaxHits + safeMaxRicochets)
  bullet.setData('ricochetsLeft', safeMaxRicochets)
  bullet.setData('hasRicocheted', false)
  // 同じ敵 UID に二度当たらない
  bullet.setData('hitEnemyUids', [])
  // 0 の間は当たり判定しない（発射と同じフレームで撃破扱いにしない）
  bullet.setData('collisionAge', 0)

  const body = bullet.body as Phaser.Physics.Arcade.Body
  const flight = applyBulletBodySettings(body, directionX, directionY)
  // 一時停止などで velocity が 0 になっても復元できるように覚える
  bullet.setData('flightVx', flight.flightVx)
  bullet.setData('flightVy', flight.flightVy)
  applyDevEntityDepth(bullet)

  return bullet
}

/**
 * 跳弾時に弾の向きだけを新しい敵へ変える。
 * 座標は直接変えず、body.setVelocity と保存中の flightVx/Vy を更新する。
 */
export function redirectPlayerBulletToward(
  bullet: Phaser.GameObjects.Rectangle,
  targetX: number,
  targetY: number,
): boolean {
  if (!bullet.active || bullet.body === null) {
    return false
  }

  const dx = targetX - bullet.x
  const dy = targetY - bullet.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  if (distance <= 0) {
    return false
  }

  const flightVx = (dx / distance) * PLAYER_BULLET_SPEED
  const flightVy = (dy / distance) * PLAYER_BULLET_SPEED
  bullet.setData('flightVx', flightVx)
  bullet.setData('flightVy', flightVy)
  bullet.setData('hasRicocheted', true)

  const body = bullet.body as Phaser.Physics.Arcade.Body
  body.moves = true
  body.setVelocity(flightVx, flightVy)
  return true
}

/**
 * 毎フレーム呼ぶ：弾の collisionAge を進める（1以上で当たり判定OK）。
 * GameScene の update ループから呼ばれる想定。
 */
export function advancePlayerBulletCollisionAge(
  bulletGroup: Phaser.Physics.Arcade.Group,
): void {
  const children = bulletGroup.getChildren()

  for (let index = 0; index < children.length; index++) {
    const bullet = children[index] as Phaser.GameObjects.Rectangle
    if (!bullet.active) {
      continue
    }

    const currentAge = bullet.getData('collisionAge') as number
    if (typeof currentAge !== 'number') {
      bullet.setData('collisionAge', 1)
      continue
    }

    bullet.setData('collisionAge', currentAge + 1)
  }
}

/**
 * 飛行速度を毎フレーム載せ直す（一時停止などで 0 になっても動き続ける）。
 * flightVx / flightVy は発射時に保存した値。
 */
export function maintainPlayerBulletVelocities(
  bulletGroup: Phaser.Physics.Arcade.Group,
): void {
  const children = bulletGroup.getChildren()

  for (let index = 0; index < children.length; index++) {
    const bullet = children[index] as Phaser.GameObjects.Rectangle
    if (!bullet.active || bullet.body === null) {
      continue
    }

    const flightVx = bullet.getData('flightVx') as number
    const flightVy = bullet.getData('flightVy') as number
    if (typeof flightVx !== 'number' || typeof flightVy !== 'number') {
      continue
    }

    const body = bullet.body as Phaser.Physics.Arcade.Body
    body.moves = true
    body.setVelocity(flightVx, flightVy)
  }
}

/**
 * プレイエリア外に出た弾をプールへ戻す。
 * 画面外に溜まって上限を圧迫しないようにする掃除処理。
 */
export function removePlayerBulletsOutsidePlayArea(
  bulletGroup: Phaser.Physics.Arcade.Group,
): void {
  const children = bulletGroup.getChildren()

  for (let index = 0; index < children.length; index++) {
    const bullet = children[index] as Phaser.GameObjects.Rectangle
    if (!bullet.active) {
      continue
    }

    const isOutside =
      bullet.x < PLAY_AREA_ORIGIN_X ||
      bullet.x > PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH ||
      bullet.y < PLAY_AREA_ORIGIN_Y ||
      bullet.y > PLAY_AREA_ORIGIN_Y + PLAY_AREA_HEIGHT

    if (isOutside) {
      recyclePlayerBullet(bullet)
    }
  }
}

/**
 * Group 内の active なプレイヤー弾の数を数える。
 * 発射上限（MAX_PLAYER_BULLETS）チェック用。
 */
export function countActivePlayerBullets(
  bulletGroup: Phaser.Physics.Arcade.Group,
): number {
  const children = bulletGroup.getChildren()
  let activeCount = 0

  for (let index = 0; index < children.length; index++) {
    const bullet = children[index] as Phaser.GameObjects.Rectangle
    if (bullet.active) {
      activeCount = activeCount + 1
    }
  }

  return activeCount
}
