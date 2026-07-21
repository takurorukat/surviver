/**
 * 敵弾（射撃型敵が撃つ弾）の Group・発射・メンテ・削除。
 *
 * 接続先:
 * - 発射: EnemyAttackSystem がプレイヤー座標へ fireEnemyBullet
 * - 当たり: physics.add.overlap（敵弾 × プレイヤー）
 * - プレイヤー弾と同様、collisionAge / flightVx・flightVy で同フレーム事故と速度復元に対応
 *
 * 見た目は蜂の針（黄色い二等辺三角＋黒枠）。先端が飛行方向を向く。
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
  MAX_ENEMY_BULLETS,
  ENEMY_WIDTH,
  PLAY_AREA_ORIGIN_X,
  PLAY_AREA_ORIGIN_Y,
  PLAY_AREA_WIDTH,
  PLAY_AREA_HEIGHT,
} from '../GameConstants'
import { setupCircleHitbox } from '../utils/setupCircleHitbox'
import { applyDevEntityDepth } from '../utils/applyDevEntityDepth'

/** 敵弾の見た目（三角）。物理 Body は別途付ける。 */
export type EnemyBulletVisual = Phaser.GameObjects.Triangle

/**
 * 敵弾用の Arcade Group を作る（重力なし）。
 * GameScene 起動時に1回作り、以降は使い回す。
 */
export function createEnemyBulletGroup(scene: Phaser.Scene): Phaser.Physics.Arcade.Group {
  return scene.physics.add.group({
    allowGravity: false,
    velocityX: 0,
    velocityY: 0,
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
): { flightVx: number; flightVy: number } {
  body.setAllowGravity(false)
  body.setCollideWorldBounds(false)
  body.moves = true
  setupCircleHitbox(body, ENEMY_BULLET_RADIUS, ENEMY_BULLET_WIDTH, ENEMY_BULLET_HEIGHT)
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
): EnemyBulletVisual {
  const halfWidth = ENEMY_BULLET_WIDTH / 2
  const halfHeight = ENEMY_BULLET_HEIGHT / 2
  // 先端(右) / 左上 / 左下 —— 回転0のとき右向き
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
 * プレイヤー（target）へ向かって敵弾を1発撃つ。
 * 上限超過・距離0なら null。敵本体の少し外側から出現。
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

  const bullet = createStingerTriangle(
    scene,
    bulletStartX,
    bulletStartY,
    directionX,
    directionY,
  )
  bullet.setDepth(9)
  bullet.setData('damage', ENEMY_BULLET_DAMAGE)
  // 0 のフレームはプレイヤーとの overlap を無視
  bullet.setData('collisionAge', 0)
  bulletGroup.add(bullet)

  const body = bullet.body as Phaser.Physics.Arcade.Body
  const flight = applyEnemyBulletBodySettings(body, directionX, directionY)
  bullet.setData('flightVx', flight.flightVx)
  bullet.setData('flightVy', flight.flightVy)
  applyDevEntityDepth(bullet)

  return bullet
}

/**
 * 毎フレーム: collisionAge を進め、1以上で当たり判定可能にする。
 * プレイヤー弾の advancePlayerBulletCollisionAge と同役割。
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
 * プレイエリア外の敵弾を破棄する。
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
      bullet.destroy()
    }
  }
}

/**
 * 画面上の敵弾をすべて消す（ステージ切替・クリア時など）。
 * 後ろから回して destroy 中のインデックスずれを避ける。
 */
export function destroyAllEnemyBullets(
  bulletGroup: Phaser.Physics.Arcade.Group,
): void {
  const children = bulletGroup.getChildren()

  for (let index = children.length - 1; index >= 0; index--) {
    const bullet = children[index] as EnemyBulletVisual
    if (bullet.active) {
      bullet.destroy()
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
 * 速度メンテや age 更新は GameScene 側で別途呼ぶ構成でもよい。
 */
export function updateEnemyBullets(bulletGroup: Phaser.Physics.Arcade.Group): void {
  removeEnemyBulletsOutsidePlayArea(bulletGroup)
}
