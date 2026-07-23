/**
 * プレイヤー弾の Group 生成・発射・メンテ・画面外削除。
 *
 * 接続先:
 * - 発射タイミング: PlayerAttackSystem（射程内の敵へ firePlayerBullet）
 * - 当たり判定: physics.add.overlap（弾 × 敵）。距離計算は使わない
 * - 貫通: hitsLeft / hitEnemyUids（同じ enemyUid に二度当たらない）
 * - collisionAge: 発射フレームでは overlap を無視（同フレーム撃破事故防止）
 *
 * 見た目は3種類:
 * - powerOrb: 初期のエネルギー弾
 * - waterOrb: Pickup 強化後の水魔法弾
 * - windVortex: Move 強化後（Pickup 未強化）の風魔法の渦弾
 * パワーが高いほど大きくなる。
 * 弾も座標直書きせず、body.setVelocity で飛ばす。
 * 消すときは destroy せず inactive にして Group 内で再利用する（Phaser のプール）。
 */
import Phaser from 'phaser'
import {
  PLAYER_BULLET_WIDTH,
  PLAYER_BULLET_HEIGHT,
  PLAYER_BULLET_COLOR,
  PLAYER_BULLET_SWIRL_COLOR,
  PLAYER_BULLET_POWER_ORB_COLOR,
  PLAYER_BULLET_POWER_ORB_CORE_COLOR,
  PLAYER_BULLET_POWER_ORB_RIM_COLOR,
  PLAYER_BULLET_WATER_ORB_COLOR,
  PLAYER_BULLET_WATER_ORB_CORE_COLOR,
  PLAYER_BULLET_WATER_ORB_RIM_COLOR,
  PLAYER_BULLET_SPEED,
  PLAYER_BULLET_RADIUS,
  PLAYER_BULLET_SIZE_SCALE_PER_DAMAGE,
  PLAYER_BULLET_MAX_SIZE_SCALE,
  PLAYER_BULLET_SPIN_RADIANS_PER_FRAME,
  PLAYER_BULLET_HOMING_BLEND,
  PLAYER_ATTACK_DAMAGE,
  MAX_PLAYER_BULLETS,
  PLAYER_WIDTH,
  ENTITY_OUTLINE_COLOR,
  PLAY_AREA_ORIGIN_X,
  PLAY_AREA_ORIGIN_Y,
  PLAY_AREA_WIDTH,
  PLAY_AREA_HEIGHT,
} from '../GameConstants'
import { setupCircleHitbox } from '../utils/setupCircleHitbox'
import { applyDevEntityDepth } from '../utils/applyDevEntityDepth'

/** プレイヤー弾の見た目（Image）。物理 Body は別途付ける。 */
export type PlayerBulletVisual = Phaser.GameObjects.Image

/** 弾の見た目スタイル */
export type PlayerBulletStyle = 'powerOrb' | 'waterOrb' | 'windVortex'

/** 渦テクスチャのキー（シーン内で1回だけ生成） */
const PLAYER_BULLET_VORTEX_TEXTURE_KEY = 'player-bullet-vortex'
/** 丸パワー弾テクスチャのキー */
const PLAYER_BULLET_POWER_ORB_TEXTURE_KEY = 'player-bullet-power-orb'
/** 水魔法弾テクスチャのキー */
const PLAYER_BULLET_WATER_ORB_TEXTURE_KEY = 'player-bullet-water-orb'
/** テクスチャ解像度（表示は setDisplaySize で弾サイズに合わせる） */
const PLAYER_BULLET_TEXTURE_SIZE = 64

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
 * ダメージから見た目の拡大率を決める。
 * 基準ダメージ（初期パワー）で 1.0。上がるほど大きく、上限あり。
 * Python: scale = min(max_scale, 1 + max(0, damage - base) * per) に相当
 */
export function calculatePlayerBulletSizeScale(damage: number): number {
  const extraDamage = Math.max(0, damage - PLAYER_ATTACK_DAMAGE)
  const scale = 1 + extraDamage * PLAYER_BULLET_SIZE_SCALE_PER_DAMAGE
  if (scale > PLAYER_BULLET_MAX_SIZE_SCALE) {
    return PLAYER_BULLET_MAX_SIZE_SCALE
  }
  return scale
}

/**
 * Graphics で渦模様を描き、テクスチャとして登録する（1シーン1回）。
 * 円弧を2本＋中心玉＋黒枠リング。
 */
function ensurePlayerBulletVortexTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(PLAYER_BULLET_VORTEX_TEXTURE_KEY)) {
    return
  }

  const size = PLAYER_BULLET_TEXTURE_SIZE
  const graphics = scene.make.graphics({ x: 0, y: 0 })
  const centerX = size / 2
  const centerY = size / 2
  const outerRadius = size * 0.42

  // 外側の黒枠リング
  graphics.lineStyle(2, ENTITY_OUTLINE_COLOR, 1)
  graphics.strokeCircle(centerX, centerY, outerRadius)

  // 外側の渦（黒縁 → 本体色）
  const outerArcRadius = outerRadius * 0.92
  graphics.lineStyle(4, ENTITY_OUTLINE_COLOR, 1)
  graphics.beginPath()
  graphics.arc(
    centerX,
    centerY,
    outerArcRadius,
    Phaser.Math.DegToRad(20),
    Phaser.Math.DegToRad(290),
    false,
  )
  graphics.strokePath()
  graphics.lineStyle(2.5, PLAYER_BULLET_SWIRL_COLOR, 1)
  graphics.beginPath()
  graphics.arc(
    centerX,
    centerY,
    outerArcRadius,
    Phaser.Math.DegToRad(20),
    Phaser.Math.DegToRad(290),
    false,
  )
  graphics.strokePath()

  // 内側の渦（位相をずらす）
  const innerArcRadius = outerRadius * 0.55
  graphics.lineStyle(3.5, ENTITY_OUTLINE_COLOR, 1)
  graphics.beginPath()
  graphics.arc(
    centerX,
    centerY,
    innerArcRadius,
    Phaser.Math.DegToRad(200),
    Phaser.Math.DegToRad(470),
    false,
  )
  graphics.strokePath()
  graphics.lineStyle(2, PLAYER_BULLET_COLOR, 1)
  graphics.beginPath()
  graphics.arc(
    centerX,
    centerY,
    innerArcRadius,
    Phaser.Math.DegToRad(200),
    Phaser.Math.DegToRad(470),
    false,
  )
  graphics.strokePath()

  // 中心の光る玉
  const coreRadius = outerRadius * 0.28
  graphics.fillStyle(PLAYER_BULLET_COLOR, 1)
  graphics.fillCircle(centerX, centerY, coreRadius)
  graphics.lineStyle(1.5, ENTITY_OUTLINE_COLOR, 1)
  graphics.strokeCircle(centerX, centerY, coreRadius)

  graphics.generateTexture(PLAYER_BULLET_VORTEX_TEXTURE_KEY, size, size)
  graphics.destroy()
}

/**
 * Blast 色の丸パワー弾テクスチャを登録する（1シーン1回）。
 * 外側リング → 本体 → 明るいコアの3層。
 */
function ensurePlayerBulletPowerOrbTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(PLAYER_BULLET_POWER_ORB_TEXTURE_KEY)) {
    return
  }

  const size = PLAYER_BULLET_TEXTURE_SIZE
  const graphics = scene.make.graphics({ x: 0, y: 0 })
  const centerX = size / 2
  const centerY = size / 2
  const outerRadius = size * 0.42

  graphics.lineStyle(2.5, ENTITY_OUTLINE_COLOR, 1)
  graphics.strokeCircle(centerX, centerY, outerRadius)

  graphics.fillStyle(PLAYER_BULLET_POWER_ORB_RIM_COLOR, 1)
  graphics.fillCircle(centerX, centerY, outerRadius * 0.95)

  graphics.fillStyle(PLAYER_BULLET_POWER_ORB_COLOR, 1)
  graphics.fillCircle(centerX, centerY, outerRadius * 0.72)

  graphics.fillStyle(PLAYER_BULLET_POWER_ORB_CORE_COLOR, 1)
  graphics.fillCircle(centerX, centerY, outerRadius * 0.38)

  graphics.lineStyle(1.5, ENTITY_OUTLINE_COLOR, 1)
  graphics.strokeCircle(centerX, centerY, outerRadius * 0.95)

  graphics.generateTexture(PLAYER_BULLET_POWER_ORB_TEXTURE_KEY, size, size)
  graphics.destroy()
}

/**
 * 水魔法弾テクスチャを登録する（1シーン1回）。
 * 雫っぽい丸＋ハイライトで、エネルギー弾より青く見える。
 */
function ensurePlayerBulletWaterOrbTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(PLAYER_BULLET_WATER_ORB_TEXTURE_KEY)) {
    return
  }

  const size = PLAYER_BULLET_TEXTURE_SIZE
  const graphics = scene.make.graphics({ x: 0, y: 0 })
  const centerX = size / 2
  const centerY = size / 2
  const outerRadius = size * 0.42

  graphics.lineStyle(2.5, ENTITY_OUTLINE_COLOR, 1)
  graphics.strokeCircle(centerX, centerY, outerRadius)

  graphics.fillStyle(PLAYER_BULLET_WATER_ORB_RIM_COLOR, 1)
  graphics.fillCircle(centerX, centerY, outerRadius * 0.95)

  graphics.fillStyle(PLAYER_BULLET_WATER_ORB_COLOR, 1)
  graphics.fillCircle(centerX, centerY, outerRadius * 0.72)

  graphics.fillStyle(PLAYER_BULLET_WATER_ORB_CORE_COLOR, 1)
  graphics.fillCircle(centerX, centerY, outerRadius * 0.38)

  // 左上のハイライト（水っぽさ）
  graphics.fillStyle(0xffffff, 0.55)
  graphics.fillCircle(centerX - outerRadius * 0.22, centerY - outerRadius * 0.22, outerRadius * 0.16)

  graphics.lineStyle(1.5, ENTITY_OUTLINE_COLOR, 1)
  graphics.strokeCircle(centerX, centerY, outerRadius * 0.95)

  graphics.generateTexture(PLAYER_BULLET_WATER_ORB_TEXTURE_KEY, size, size)
  graphics.destroy()
}

function getTextureKeyForBulletStyle(style: PlayerBulletStyle): string {
  if (style === 'powerOrb') {
    return PLAYER_BULLET_POWER_ORB_TEXTURE_KEY
  }
  if (style === 'waterOrb') {
    return PLAYER_BULLET_WATER_ORB_TEXTURE_KEY
  }
  return PLAYER_BULLET_VORTEX_TEXTURE_KEY
}

function ensureBulletTextureForStyle(scene: Phaser.Scene, style: PlayerBulletStyle): void {
  if (style === 'powerOrb') {
    ensurePlayerBulletPowerOrbTexture(scene)
    return
  }
  if (style === 'waterOrb') {
    ensurePlayerBulletWaterOrbTexture(scene)
    return
  }
  ensurePlayerBulletVortexTexture(scene)
}

/**
 * 弾の見た目スタイルを適用する（プール再利用時も毎回呼ぶ）。
 */
function applyPlayerBulletStyle(
  scene: Phaser.Scene,
  bullet: PlayerBulletVisual,
  style: PlayerBulletStyle,
): void {
  ensureBulletTextureForStyle(scene, style)
  bullet.setTexture(getTextureKeyForBulletStyle(style))
  bullet.setData('bulletStyle', style)
  if (style === 'powerOrb' || style === 'waterOrb') {
    // 丸弾は回転させないので角度をリセット
    bullet.setRotation(0)
  }
}

/**
 * プレイヤー弾の Image を新規作成する（まだ Group には入れない）。
 */
function createPlayerBulletImage(
  scene: Phaser.Scene,
  x: number,
  y: number,
  style: PlayerBulletStyle,
): PlayerBulletVisual {
  ensureBulletTextureForStyle(scene, style)
  const bullet = scene.add.image(x, y, getTextureKeyForBulletStyle(style))
  bullet.setDisplaySize(PLAYER_BULLET_WIDTH, PLAYER_BULLET_HEIGHT)
  bullet.setDepth(9)
  bullet.setData('bulletStyle', style)
  return bullet
}

/**
 * 弾の見た目サイズと当たり判定を、パワー由来の拡大率に合わせる。
 */
function applyBulletVisualAndHitbox(
  bullet: PlayerBulletVisual,
  body: Phaser.Physics.Arcade.Body,
  sizeScale: number,
): void {
  const displayWidth = PLAYER_BULLET_WIDTH * sizeScale
  const displayHeight = PLAYER_BULLET_HEIGHT * sizeScale
  bullet.setDisplaySize(displayWidth, displayHeight)
  const hitRadius = PLAYER_BULLET_RADIUS * sizeScale
  setupCircleHitbox(body, hitRadius, displayWidth, displayHeight)
}

/**
 * 弾 Body にヒットボックスと飛行速度を載せる。
 * Group.add() のあとで呼ぶこと（createCallback が velocity を 0 に戻すため）。
 */
function applyBulletBodySettings(
  bullet: PlayerBulletVisual,
  body: Phaser.Physics.Arcade.Body,
  directionX: number,
  directionY: number,
  sizeScale: number,
): { flightVx: number; flightVy: number } {
  body.setAllowGravity(false)
  body.setCollideWorldBounds(false)
  body.enable = true
  body.moves = true
  applyBulletVisualAndHitbox(bullet, body, sizeScale)
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
export function recyclePlayerBullet(bullet: PlayerBulletVisual): void {
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
 * @param damage 命中時ダメージ（レベルアップで増える）。見た目サイズにも反映
 * @param maxHits 貫通で当たれる回数（pierceLevel+1）。hitsLeft に保存
 * @param maxRicochets 跳弾できる回数
 * @param homingTarget 弱ホーミングの追従先（狙った敵）。倒れたら追従をやめる
 * @param bulletStyle 丸パワー弾 or 風渦弾
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
  homingTarget: Phaser.GameObjects.Rectangle | null = null,
  bulletStyle: PlayerBulletStyle = 'windVortex',
): PlayerBulletVisual | null {
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
  const sizeScale = calculatePlayerBulletSizeScale(damage)

  // Phaser: getFirstDead(false) = 非 active の子を再利用（なければ null）
  let bullet = bulletGroup.getFirstDead(false) as PlayerBulletVisual | null
  if (bullet === null) {
    bullet = createPlayerBulletImage(scene, bulletStartX, bulletStartY, bulletStyle)
    bulletGroup.add(bullet)
  } else {
    bullet.setPosition(bulletStartX, bulletStartY)
    bullet.setActive(true)
    bullet.setVisible(true)
    applyPlayerBulletStyle(scene, bullet, bulletStyle)
  }

  bullet.setData('damage', damage)
  bullet.setData('sizeScale', sizeScale)
  // 狙った敵へ弱く曲がる（倒れた／消えたら追従解除）
  bullet.setData('homingTarget', homingTarget)
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
  const flight = applyBulletBodySettings(
    bullet,
    body,
    directionX,
    directionY,
    sizeScale,
  )
  // 一時停止などで velocity が 0 になっても復元できるように覚える
  bullet.setData('flightVx', flight.flightVx)
  bullet.setData('flightVy', flight.flightVy)
  applyDevEntityDepth(bullet)

  return bullet
}

/**
 * 跳弾時に弾の向きだけを新しい敵へ変える。
 * 座標は直接変えず、body.setVelocity と保存中の flightVx/Vy を更新する。
 * newHomingTarget があれば、その敵へ弱ホーミングを付け直す。
 */
export function redirectPlayerBulletToward(
  bullet: PlayerBulletVisual,
  targetX: number,
  targetY: number,
  newHomingTarget: Phaser.GameObjects.Rectangle | null = null,
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
  bullet.setData('homingTarget', newHomingTarget)

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
    const bullet = children[index] as PlayerBulletVisual
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
 * 狙った敵が生きていれば弱くホーミングし、風渦弾だけ見た目を回す。
 */
export function maintainPlayerBulletVelocities(
  bulletGroup: Phaser.Physics.Arcade.Group,
): void {
  const children = bulletGroup.getChildren()

  for (let index = 0; index < children.length; index++) {
    const bullet = children[index] as PlayerBulletVisual
    if (!bullet.active || bullet.body === null) {
      continue
    }

    let flightVx = bullet.getData('flightVx') as number
    let flightVy = bullet.getData('flightVy') as number
    if (typeof flightVx !== 'number' || typeof flightVy !== 'number') {
      continue
    }

    // 弱ホーミング: 狙った敵の現在位置へ少しずつ曲げる
    const homingTarget = bullet.getData('homingTarget') as
      | Phaser.GameObjects.Rectangle
      | null
    if (
      homingTarget !== null &&
      homingTarget.active &&
      homingTarget.getData('isDefeated') !== true
    ) {
      const toX = homingTarget.x - bullet.x
      const toY = homingTarget.y - bullet.y
      const toDistance = Math.sqrt(toX * toX + toY * toY)
      if (toDistance > 1) {
        const wantVx = (toX / toDistance) * PLAYER_BULLET_SPEED
        const wantVy = (toY / toDistance) * PLAYER_BULLET_SPEED
        // Python: v = v + (want - v) * blend に相当
        let nextVx = flightVx + (wantVx - flightVx) * PLAYER_BULLET_HOMING_BLEND
        let nextVy = flightVy + (wantVy - flightVy) * PLAYER_BULLET_HOMING_BLEND
        const nextSpeed = Math.sqrt(nextVx * nextVx + nextVy * nextVy)
        if (nextSpeed > 0) {
          nextVx = (nextVx / nextSpeed) * PLAYER_BULLET_SPEED
          nextVy = (nextVy / nextSpeed) * PLAYER_BULLET_SPEED
          flightVx = nextVx
          flightVy = nextVy
          bullet.setData('flightVx', flightVx)
          bullet.setData('flightVy', flightVy)
        }
      }
    } else if (homingTarget !== null) {
      // 倒れた／消えた敵は追わない
      bullet.setData('homingTarget', null)
    }

    const body = bullet.body as Phaser.Physics.Arcade.Body
    body.moves = true
    body.setVelocity(flightVx, flightVy)
    // 風渦弾だけ回転（丸のエネルギー／水弾は回さない）
    const bulletStyle = bullet.getData('bulletStyle') as PlayerBulletStyle
    if (bulletStyle === 'windVortex') {
      bullet.rotation = bullet.rotation + PLAYER_BULLET_SPIN_RADIANS_PER_FRAME
    }
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
    const bullet = children[index] as PlayerBulletVisual
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
    const bullet = children[index] as PlayerBulletVisual
    if (bullet.active) {
      activeCount = activeCount + 1
    }
  }

  return activeCount
}
