/**
 * 敵弾（射撃型敵が撃つ弾）の Group・発射・メンテ・削除。
 *
 * 接続先:
 * - 発射: EnemyAttackSystem がプレイヤー座標へ fireEnemyBullet / firePebbleEnemyBullet
 * - 当たり: physics.add.overlap（敵弾 × プレイヤー）
 * - プレイヤー弾と同様、collisionAge / flightVx・flightVy で同フレーム事故と速度復元に対応
 *
 * 見た目: 蜂の針（黄色い二等辺三角＋黒枠）／小石（コード生成テクスチャ）。
 * ダメージ量は定数 ENEMY_BULLET_DAMAGE（弾ごとに変えない）。
 */
import Phaser from 'phaser'
import {
  ENEMY_BULLET_WIDTH,
  ENEMY_BULLET_HEIGHT,
  ENEMY_BULLET_COLOR,
  ENEMY_BULLET_OUTLINE_COLOR,
  ENEMY_BULLET_OUTLINE_WIDTH,
  ENEMY_BULLET_SPEED,
  ENEMY_BULLET_RADIUS,
  ENEMY_BULLET_DAMAGE,
  ENEMY_PEBBLE_BULLET_FILL_COLOR,
  ENEMY_PEBBLE_BULLET_HIGHLIGHT_COLOR,
  ENEMY_PEBBLE_BULLET_OUTLINE_COLOR,
  ENEMY_PEBBLE_BULLET_RADIUS,
  ENEMY_PEBBLE_BULLET_SHADOW_COLOR,
  ENEMY_PEBBLE_BULLET_SIZE,
  ENEMY_PEBBLE_BULLET_TEXTURE_KEY,
  MAX_ENEMY_BULLETS,
  ENEMY_WIDTH,
  PLAY_AREA_ORIGIN_X,
  PLAY_AREA_ORIGIN_Y,
  PLAY_AREA_WIDTH,
  PLAY_AREA_HEIGHT,
} from '../GameConstants'
import { setupCircleHitbox } from '../utils/setupCircleHitbox'
import { applyDevEntityDepth } from '../utils/applyDevEntityDepth'

/** 敵弾の見た目。物理 Body は別途付ける。 */
export type EnemyBulletVisual =
  | Phaser.GameObjects.Triangle
  | Phaser.GameObjects.Image

/**
 * 敵弾用の Arcade Group を作る（重力なし）。
 * GameScene 起動時に1回作り、以降は使い回す。
 */
export function createEnemyBulletGroup(scene: Phaser.Scene): Phaser.Physics.Arcade.Group {
  return scene.physics.add.group({
    allowGravity: false,
    velocityX: 0,
    velocityY: 0,
    maxSize: MAX_ENEMY_BULLETS,
  })
}

/**
 * 敵弾 Body に円ヒットボックスと飛行速度を設定する。
 * 戻り値の flightVx/Vy は一時停止後の復元用に setData する。
 */
function applyEnemyBulletBodySettings(
  body: Phaser.Physics.Arcade.Body,
  directionX: number,
  directionY: number,
  hitRadius: number,
  hitWidth: number,
  hitHeight: number,
): { flightVx: number; flightVy: number } {
  body.setAllowGravity(false)
  body.setCollideWorldBounds(false)
  body.enable = true
  body.moves = true
  setupCircleHitbox(body, hitRadius, hitWidth, hitHeight)
  const flightVx = directionX * ENEMY_BULLET_SPEED
  const flightVy = directionY * ENEMY_BULLET_SPEED
  body.setVelocity(flightVx, flightVy)
  return { flightVx, flightVy }
}

/**
 * 飛行方向を向く黄色い針（二等辺三角）を作る。
 * ローカル座標では先端が +X（右）。setRotation(atan2) で進行方向へ回す。
 */
function createStingerTriangle(
  scene: Phaser.Scene,
  x: number,
  y: number,
  directionX: number,
  directionY: number,
): Phaser.GameObjects.Triangle {
  const halfWidth = ENEMY_BULLET_WIDTH / 2
  const halfHeight = ENEMY_BULLET_HEIGHT / 2
  const bullet = scene.add.triangle(
    x,
    y,
    halfWidth,
    0,
    -halfWidth,
    -halfHeight,
    -halfWidth,
    halfHeight,
    ENEMY_BULLET_COLOR,
  )
  bullet.setStrokeStyle(ENEMY_BULLET_OUTLINE_WIDTH, ENEMY_BULLET_OUTLINE_COLOR)
  bullet.setRotation(Math.atan2(directionY, directionX))
  return bullet
}

/**
 * 小さめのいびつな灰色小石テクスチャを1回だけ生成する。
 */
export function ensurePebbleBulletTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(ENEMY_PEBBLE_BULLET_TEXTURE_KEY)) {
    return
  }

  const size = Math.max(8, Math.round(ENEMY_PEBBLE_BULLET_SIZE))
  const graphics = scene.make.graphics({ x: 0, y: 0 })
  const center = size / 2

  graphics.fillStyle(ENEMY_PEBBLE_BULLET_FILL_COLOR, 1)
  graphics.beginPath()
  graphics.moveTo(center + size * 0.38, center - size * 0.12)
  graphics.lineTo(center + size * 0.18, center - size * 0.4)
  graphics.lineTo(center - size * 0.22, center - size * 0.36)
  graphics.lineTo(center - size * 0.42, center - size * 0.05)
  graphics.lineTo(center - size * 0.32, center + size * 0.32)
  graphics.lineTo(center + size * 0.05, center + size * 0.4)
  graphics.lineTo(center + size * 0.4, center + size * 0.18)
  graphics.closePath()
  graphics.fillPath()

  graphics.fillStyle(ENEMY_PEBBLE_BULLET_SHADOW_COLOR, 0.85)
  graphics.beginPath()
  graphics.moveTo(center + size * 0.05, center + size * 0.08)
  graphics.lineTo(center + size * 0.32, center + size * 0.02)
  graphics.lineTo(center + size * 0.34, center + size * 0.16)
  graphics.lineTo(center + size * 0.02, center + size * 0.34)
  graphics.lineTo(center - size * 0.18, center + size * 0.26)
  graphics.closePath()
  graphics.fillPath()

  graphics.fillStyle(ENEMY_PEBBLE_BULLET_HIGHLIGHT_COLOR, 1)
  graphics.beginPath()
  graphics.moveTo(center - size * 0.08, center - size * 0.28)
  graphics.lineTo(center + size * 0.08, center - size * 0.3)
  graphics.lineTo(center - size * 0.02, center - size * 0.12)
  graphics.closePath()
  graphics.fillPath()

  graphics.lineStyle(2, ENEMY_PEBBLE_BULLET_OUTLINE_COLOR, 1)
  graphics.beginPath()
  graphics.moveTo(center + size * 0.38, center - size * 0.12)
  graphics.lineTo(center + size * 0.18, center - size * 0.4)
  graphics.lineTo(center - size * 0.22, center - size * 0.36)
  graphics.lineTo(center - size * 0.42, center - size * 0.05)
  graphics.lineTo(center - size * 0.32, center + size * 0.32)
  graphics.lineTo(center + size * 0.05, center + size * 0.4)
  graphics.lineTo(center + size * 0.4, center + size * 0.18)
  graphics.closePath()
  graphics.strokePath()

  graphics.generateTexture(ENEMY_PEBBLE_BULLET_TEXTURE_KEY, size, size)
  graphics.destroy()
}

/** Orbiting Orb などが壊せる敵弾か（接触攻撃・召喚物は対象外）。 */
export function isDestructibleEnemyBullet(bullet: EnemyBulletVisual): boolean {
  return bullet.active === true && bullet.getData('destructible') === true
}

/**
 * 敵弾をプールへ戻す（小石は destroy、蜂の針は再利用）。
 */
export function recycleEnemyBullet(bullet: EnemyBulletVisual): void {
  if (bullet.getData('bulletStyle') === 'pebble') {
    bullet.destroy()
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
 * プレイヤー（target）へ向かって敵弾を1発撃つ。
 * 上限超過・距離0なら null。敵本体の少し外側から出現。
 * 非 active の弾があれば再利用する。
 */
export function fireEnemyBullet(
  scene: Phaser.Scene,
  bulletGroup: Phaser.Physics.Arcade.Group,
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
): EnemyBulletVisual | null {
  const activeBulletCount = countActiveEnemyBullets(bulletGroup)
  if (activeBulletCount >= MAX_ENEMY_BULLETS) {
    return null
  }

  const dx = targetX - startX
  const dy = targetY - startY
  const distance = Math.sqrt(dx * dx + dy * dy)
  if (distance === 0) {
    return null
  }

  const directionX = dx / distance
  const directionY = dy / distance
  const spawnOffset = ENEMY_WIDTH / 2 + 4
  const bulletStartX = startX + directionX * spawnOffset
  const bulletStartY = startY + directionY * spawnOffset

  let bullet = bulletGroup.getFirstDead(false) as EnemyBulletVisual | null
  if (bullet !== null && bullet.getData('bulletStyle') === 'pebble') {
    bullet = null
  }

  if (bullet === null) {
    bullet = createStingerTriangle(
      scene,
      bulletStartX,
      bulletStartY,
      directionX,
      directionY,
    )
    bullet.setDepth(9)
    bullet.setData('bulletStyle', 'stinger')
    bulletGroup.add(bullet)
  } else {
    bullet.setPosition(bulletStartX, bulletStartY)
    if (bullet instanceof Phaser.GameObjects.Triangle) {
      bullet.setRotation(Math.atan2(directionY, directionX))
    }
    bullet.setActive(true)
    bullet.setVisible(true)
  }

  bullet.setData('damage', ENEMY_BULLET_DAMAGE)
  // プレイヤー弾では壊せないが、Orbiting Orb などでは消滅させられる
  bullet.setData('destroyableByPlayer', false)
  bullet.setData('destructible', true)
  bullet.setData('collisionAge', 0)

  const body = bullet.body as Phaser.Physics.Arcade.Body
  const flight = applyEnemyBulletBodySettings(
    body,
    directionX,
    directionY,
    ENEMY_BULLET_RADIUS,
    ENEMY_BULLET_WIDTH,
    ENEMY_BULLET_HEIGHT,
  )
  bullet.setData('flightVx', flight.flightVx)
  bullet.setData('flightVy', flight.flightVy)
  applyDevEntityDepth(bullet)

  return bullet
}

/**
 * プレイヤー現在位置へ向けて小石弾を1発撃つ（岩敵用）。
 * 速度は蜂の弾と同じ。プレイヤー弾で破壊可能。
 */
export function firePebbleEnemyBullet(
  scene: Phaser.Scene,
  bulletGroup: Phaser.Physics.Arcade.Group,
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
): EnemyBulletVisual | null {
  const activeBulletCount = countActiveEnemyBullets(bulletGroup)
  if (activeBulletCount >= MAX_ENEMY_BULLETS) {
    return null
  }

  const dx = targetX - startX
  const dy = targetY - startY
  const distance = Math.sqrt(dx * dx + dy * dy)
  if (distance === 0) {
    return null
  }

  const directionX = dx / distance
  const directionY = dy / distance
  const spawnOffset = ENEMY_WIDTH * 0.75 + 4
  const bulletStartX = startX + directionX * spawnOffset
  const bulletStartY = startY + directionY * spawnOffset

  ensurePebbleBulletTexture(scene)
  const bullet = scene.add.image(
    bulletStartX,
    bulletStartY,
    ENEMY_PEBBLE_BULLET_TEXTURE_KEY,
  )
  bullet.setDepth(9)
  bullet.setData('bulletStyle', 'pebble')
  bullet.setData('destroyableByPlayer', true)
  bullet.setData('destructible', true)
  bullet.setData('damage', ENEMY_BULLET_DAMAGE)
  bullet.setData('collisionAge', 0)
  bulletGroup.add(bullet)

  const body = bullet.body as Phaser.Physics.Arcade.Body
  const size = ENEMY_PEBBLE_BULLET_SIZE
  const flight = applyEnemyBulletBodySettings(
    body,
    directionX,
    directionY,
    ENEMY_PEBBLE_BULLET_RADIUS,
    size,
    size,
  )
  bullet.setData('flightVx', flight.flightVx)
  bullet.setData('flightVy', flight.flightVy)
  applyDevEntityDepth(bullet)

  return bullet
}

/**
 * 毎フレーム: collisionAge を進め、1以上で当たり判定可能にする。
 */
export function advanceEnemyBulletCollisionAge(
  bulletGroup: Phaser.Physics.Arcade.Group,
): void {
  const children = bulletGroup.getChildren()

  for (let index = 0; index < children.length; index++) {
    const bullet = children[index] as EnemyBulletVisual
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
 * 保存済みの飛行速度を毎フレーム載せ直す（ポーズ復帰後もまっすぐ飛ぶ）。
 */
export function maintainEnemyBulletVelocities(
  bulletGroup: Phaser.Physics.Arcade.Group,
): void {
  const children = bulletGroup.getChildren()

  for (let index = 0; index < children.length; index++) {
    const bullet = children[index] as EnemyBulletVisual
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
 * プレイエリア外の敵弾をプールへ戻す。
 */
export function removeEnemyBulletsOutsidePlayArea(
  bulletGroup: Phaser.Physics.Arcade.Group,
): void {
  const children = bulletGroup.getChildren()

  for (let index = 0; index < children.length; index++) {
    const bullet = children[index] as EnemyBulletVisual
    if (!bullet.active) {
      continue
    }

    const isOutside =
      bullet.x < PLAY_AREA_ORIGIN_X ||
      bullet.x > PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH ||
      bullet.y < PLAY_AREA_ORIGIN_Y ||
      bullet.y > PLAY_AREA_ORIGIN_Y + PLAY_AREA_HEIGHT

    if (isOutside) {
      recycleEnemyBullet(bullet)
    }
  }
}

/**
 * 画面上の敵弾をすべてプールへ戻す（ステージ切替・クリア時など）。
 */
export function destroyAllEnemyBullets(
  bulletGroup: Phaser.Physics.Arcade.Group,
): void {
  const children = bulletGroup.getChildren()

  for (let index = 0; index < children.length; index++) {
    const bullet = children[index] as EnemyBulletVisual
    if (bullet.active) {
      recycleEnemyBullet(bullet)
    }
  }
}

/**
 * active な敵弾の数（MAX_ENEMY_BULLETS チェック用）。
 */
export function countActiveEnemyBullets(
  bulletGroup: Phaser.Physics.Arcade.Group,
): number {
  const children = bulletGroup.getChildren()
  let activeCount = 0

  for (let index = 0; index < children.length; index++) {
    const bullet = children[index] as EnemyBulletVisual
    if (bullet.active) {
      activeCount = activeCount + 1
    }
  }

  return activeCount
}

/**
 * 敵弾の毎フレーム更新エントリ（現状は画面外削除のみ）。
 */
export function updateEnemyBullets(bulletGroup: Phaser.Physics.Arcade.Group): void {
  removeEnemyBulletsOutsidePlayArea(bulletGroup)
}
