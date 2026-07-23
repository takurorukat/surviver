// ============================================================
// 戦闘の見た目フィードバック（数字・風斬り・フラッシュ・HP FULL）
// ------------------------------------------------------------
// GameScene がダメージ発生・撃破・レベルアップ回復時に呼ぶ。
// いずれも見た目の tween / 一時オブジェクトのみ。HP やスコアは変えない。
// ============================================================

import Phaser from 'phaser'
import {
  PLAYER_HURT_FLASH_DURATION_MS,
  PLAYER_HURT_FLASH_COLOR,
  PLAYER_HURT_FLASH_ALPHA,
  ENEMY_BLOCKED_ICON_KEY,
  ENEMY_BLOCKED_ICON_SIZE,
  ENEMY_BLOCKED_ICON_POP_MS,
  ENEMY_BLOCKED_ICON_FADE_MS,
  ENEMY_BLOCKED_ICON_FLOAT_UP,
  ENEMY_BLOCKED_ICON_DEPTH,
  DAMAGE_NUMBER_FONT_SIZE,
  DAMAGE_NUMBER_COLOR,
  DAMAGE_NUMBER_STROKE_COLOR,
  DAMAGE_NUMBER_STROKE_THICKNESS,
  DAMAGE_NUMBER_DURATION_MS,
  DAMAGE_NUMBER_PEAK_HEIGHT,
  DAMAGE_NUMBER_SIDE_SPREAD,
  DAMAGE_NUMBER_FALL_EXTRA,
  DAMAGE_NUMBER_DEPTH,
  WIND_SLASH_COLOR,
  WIND_SLASH_COLOR_INNER,
  WIND_SLASH_OUTLINE_COLOR,
  WIND_SLASH_DURATION_MS,
  WIND_SLASH_LENGTH,
  WIND_SLASH_LINE_WIDTH,
  WIND_SLASH_LINE_SPACING,
  WIND_SLASH_DEPTH,
  WIND_SLASH_LINE_COUNT_MAX,
  WIND_SLASH_LEAF_PER_LINE,
  WIND_SLASH_LEAF_COLOR,
  WIND_SLASH_LEAF_COLOR_DARK,
  WIND_SLASH_LEAF_DURATION_MS,
  WIND_SLASH_LEAF_SPREAD,
  WIND_SLASH_LEAF_FLOAT_UP,
  WIND_SLASH_LEAF_SIZE,
  WIND_SLASH_LEAF_TEXTURE_KEY,
  WIND_SLASH_SIZE_SCALE_PER_POWER,
  WIND_SLASH_SIZE_SCALE_MAX,
  PLAYER_BULLET_POWER_ORB_COLOR,
  PLAYER_BULLET_POWER_ORB_CORE_COLOR,
  PLAYER_BULLET_POWER_ORB_RIM_COLOR,
  ENERGY_ORB_HIT_DEPTH,
  ENERGY_ORB_HIT_RING_DURATION_MS,
  ENERGY_ORB_HIT_RING_START_RADIUS,
  ENERGY_ORB_HIT_RING_END_RADIUS,
  ENERGY_ORB_HIT_BURST_COUNT,
  ENERGY_ORB_HIT_BURST_SIZE,
  ENERGY_ORB_HIT_BURST_SPREAD,
  ENERGY_ORB_HIT_BURST_DURATION_MS,
  ENERGY_ORB_HIT_SIZE_SCALE_PER_POWER,
  ENERGY_ORB_HIT_SIZE_SCALE_MAX,
  PLAYER_BULLET_WATER_ORB_COLOR,
  PLAYER_BULLET_WATER_ORB_CORE_COLOR,
  PLAYER_BULLET_WATER_ORB_RIM_COLOR,
  WATER_ORB_HIT_DEPTH,
  WATER_ORB_HIT_RING_DURATION_MS,
  WATER_ORB_HIT_RING_START_RADIUS,
  WATER_ORB_HIT_RING_END_RADIUS,
  WATER_ORB_HIT_DROPLET_COUNT,
  WATER_ORB_HIT_DROPLET_SIZE,
  WATER_ORB_HIT_DROPLET_SPREAD,
  WATER_ORB_HIT_DROPLET_DURATION_MS,
  WATER_ORB_HIT_CRYSTAL_COUNT,
  WATER_ORB_HIT_CRYSTAL_SIZE,
  WATER_ORB_HIT_CRYSTAL_SPREAD,
  WATER_ORB_HIT_CRYSTAL_DURATION_MS,
  WATER_ORB_HIT_FROST_COLOR,
  WATER_ORB_HIT_ICE_COLOR,
  WATER_ORB_HIT_SIZE_SCALE_PER_POWER,
  WATER_ORB_HIT_SIZE_SCALE_MAX,
  PLAYER_ATTACK_DAMAGE,
  HP_FULL_TEXT,
  HP_FULL_FONT_SIZE,
  HP_FULL_COLOR,
  HP_FULL_STROKE_COLOR,
  HP_FULL_STROKE_THICKNESS,
  HP_FULL_DURATION_MS,
  HP_FULL_FLOAT_UP,
  HP_FULL_DEPTH,
  AUTO_GOLD_LEVEL_UP_TEXT,
  AUTO_GOLD_LEVEL_UP_FONT_SIZE,
  AUTO_GOLD_LEVEL_UP_COLOR,
  AUTO_GOLD_LEVEL_UP_STROKE_COLOR,
  AUTO_GOLD_LEVEL_UP_STROKE_THICKNESS,
  AUTO_GOLD_LEVEL_UP_DURATION_MS,
  AUTO_GOLD_LEVEL_UP_FLOAT_UP,
  AUTO_GOLD_LEVEL_UP_DEPTH,
  GAME_WIDTH,
  GAME_HEIGHT,
  FONT_FAMILY_UI,
} from '../GameConstants'

/**
 * 盾・装甲で通常弾が効かなかった敵の上に盾アイコンを出す。
 * 敵が動いても位置に追従し、上へ浮かびながら消える
 * （その場に置き去りだと、弾がその場に落ちたように見えてしまうため）。
 */
export function playEnemyBlockedShield(
  scene: Phaser.Scene,
  enemy: Phaser.GameObjects.Rectangle,
): void {
  const shield = scene.add.image(enemy.x, enemy.y, ENEMY_BLOCKED_ICON_KEY)
  shield.setDisplaySize(ENEMY_BLOCKED_ICON_SIZE, ENEMY_BLOCKED_ICON_SIZE)
  shield.setDepth(ENEMY_BLOCKED_ICON_DEPTH)
  shield.setAlpha(0.25)

  const normalScaleX = shield.scaleX
  const normalScaleY = shield.scaleY
  shield.setScale(normalScaleX * 0.45, normalScaleY * 0.45)

  // 敵が消えたあとに備えて、最後に知っている位置を覚えておく
  let lastEnemyX = enemy.x
  let lastEnemyY = enemy.y

  // 敵の現在位置＋浮き上がりオフセットへ毎フレーム追従させる
  const followEnemyWithLift = (liftY: number): void => {
    if (enemy.active) {
      lastEnemyX = enemy.x
      lastEnemyY = enemy.y
    }
    shield.setPosition(lastEnemyX, lastEnemyY - liftY)
  }

  scene.tweens.addCounter({
    from: 0,
    to: 1,
    duration: ENEMY_BLOCKED_ICON_POP_MS,
    ease: 'Back.Out',
    onUpdate: (tween) => {
      const t = tween.getValue()
      const scaleProgress = 0.45 + (1.1 - 0.45) * t
      shield.setScale(normalScaleX * scaleProgress, normalScaleY * scaleProgress)
      shield.setAlpha(0.25 + 0.75 * t)
      followEnemyWithLift(0)
    },
    onComplete: () => {
      scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration: ENEMY_BLOCKED_ICON_FADE_MS,
        ease: 'Sine.Out',
        onUpdate: (tween) => {
          const t = tween.getValue()
          const scaleProgress = 1.1 - (1.1 - 1) * t
          shield.setScale(
            normalScaleX * scaleProgress,
            normalScaleY * scaleProgress,
          )
          shield.setAlpha(1 - t)
          followEnemyWithLift(ENEMY_BLOCKED_ICON_FLOAT_UP * t)
        },
        onComplete: () => {
          shield.destroy()
        },
      })
    },
  })
}

// ヒット位置にダメージ数字を放物線で飛ばす
// Python: y = start_y - 4*h*t*(1-t) の放物線に相当（t は 0→1）
export function playDamageNumber(
  scene: Phaser.Scene,
  x: number,
  y: number,
  damage: number,
): void {
  const damageText = scene.add.text(x, y, String(damage), {
    fontFamily: FONT_FAMILY_UI,
    fontSize: DAMAGE_NUMBER_FONT_SIZE,
    color: DAMAGE_NUMBER_COLOR,
    fontStyle: 'bold',
  })
  damageText.setOrigin(0.5, 0.5)
  damageText.setStroke(DAMAGE_NUMBER_STROKE_COLOR, DAMAGE_NUMBER_STROKE_THICKNESS)
  damageText.setDepth(DAMAGE_NUMBER_DEPTH)

  // 左右どちらかへ少しずらす（毎回同じ軌道にならないように）
  const sideDirection = Math.random() < 0.5 ? -1 : 1
  const sideOffset = sideDirection * (8 + Math.random() * DAMAGE_NUMBER_SIDE_SPREAD)
  const startX = x
  const startY = y

  // addCounter: 0→1 の進捗 t を毎フレーム受け取り、位置を自分で計算する
  scene.tweens.addCounter({
    from: 0,
    to: 1,
    duration: DAMAGE_NUMBER_DURATION_MS,
    onUpdate: (tween) => {
      const t = tween.getValue()
      // t=0.5 で頂点。その後は少し下まで落ちる
      const arcY = -DAMAGE_NUMBER_PEAK_HEIGHT * 4 * t * (1 - t)
      const fallY = DAMAGE_NUMBER_FALL_EXTRA * t * t
      damageText.setPosition(startX + sideOffset * t, startY + arcY + fallY)
      // 徐々に透明へ（最後はほぼ見えない）
      damageText.setAlpha(1 - t * 0.85)
    },
    onComplete: () => {
      damageText.destroy()
    },
  })
}

/**
 * パワー（弾ダメージ）から斬撃の線本数を決める。
 * 1→1本, 2→2本, 3以上→3本。
 */
function getWindSlashLineCount(powerDamage: number): number {
  const power = Math.max(1, Math.round(powerDamage))
  if (power >= WIND_SLASH_LINE_COUNT_MAX) {
    return WIND_SLASH_LINE_COUNT_MAX
  }
  return power
}

/**
 * パワーに応じた見た目の拡大率（長さ・太さ・葉の飛び）。
 */
function getWindSlashSizeScale(powerDamage: number): number {
  const extraPower = Math.max(0, Math.round(powerDamage) - PLAYER_ATTACK_DAMAGE)
  const scale = 1 + extraPower * WIND_SLASH_SIZE_SCALE_PER_POWER
  if (scale > WIND_SLASH_SIZE_SCALE_MAX) {
    return WIND_SLASH_SIZE_SCALE_MAX
  }
  return scale
}

/**
 * 線本数に合わせた Y オフセット（中央揃えの平行線）。
 * Python: 1本→[0], 2本→[-s/2, s/2], 3本→[-s, 0, s] に相当
 */
function getWindSlashLineOffsets(lineCount: number, spacing: number): number[] {
  if (lineCount <= 1) {
    return [0]
  }
  if (lineCount === 2) {
    return [-spacing * 0.5, spacing * 0.5]
  }
  return [-spacing, 0, spacing]
}

/**
 * 木の葉テクスチャを1回だけ作る（Phaser Graphics → generateTexture）。
 * 菱形＋葉脈のシンプルな葉。
 */
function ensureWindSlashLeafTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(WIND_SLASH_LEAF_TEXTURE_KEY)) {
    return
  }

  const size = 16
  const graphics = scene.make.graphics({ x: 0, y: 0 })
  const centerX = size / 2
  const centerY = size / 2

  // 葉の本体（縦長の菱形）
  graphics.fillStyle(WIND_SLASH_LEAF_COLOR, 1)
  graphics.beginPath()
  graphics.moveTo(centerX, 1)
  graphics.lineTo(centerX + 5, centerY)
  graphics.lineTo(centerX, size - 1)
  graphics.lineTo(centerX - 5, centerY)
  graphics.closePath()
  graphics.fillPath()

  // 黒縁
  graphics.lineStyle(1, 0x000000, 0.85)
  graphics.beginPath()
  graphics.moveTo(centerX, 1)
  graphics.lineTo(centerX + 5, centerY)
  graphics.lineTo(centerX, size - 1)
  graphics.lineTo(centerX - 5, centerY)
  graphics.closePath()
  graphics.strokePath()

  // 葉脈
  graphics.lineStyle(1, WIND_SLASH_LEAF_COLOR_DARK, 1)
  graphics.beginPath()
  graphics.moveTo(centerX, 3)
  graphics.lineTo(centerX, size - 3)
  graphics.strokePath()

  graphics.generateTexture(WIND_SLASH_LEAF_TEXTURE_KEY, size, size)
  graphics.destroy()
}

/**
 * 斬撃位置から木の葉を数枚、外側へ舞い散らせる。
 */
function playWindSlashLeaves(
  scene: Phaser.Scene,
  x: number,
  y: number,
  leafCount: number,
  sizeScale: number,
): void {
  if (leafCount <= 0) {
    return
  }

  ensureWindSlashLeafTexture(scene)

  for (let index = 0; index < leafCount; index++) {
    const leaf = scene.add.image(x, y, WIND_SLASH_LEAF_TEXTURE_KEY)
    const leafSize =
      WIND_SLASH_LEAF_SIZE * sizeScale * (0.75 + Math.random() * 0.5)
    leaf.setDisplaySize(leafSize, leafSize)
    leaf.setDepth(WIND_SLASH_DEPTH + 1)
    leaf.setAlpha(0.95)
    leaf.setRotation(Math.random() * Math.PI * 2)

    // 全方位へ散らす（少し上寄り）
    const angle = (Math.PI * 2 * index) / leafCount + Math.random() * 0.5
    const distance =
      WIND_SLASH_LEAF_SPREAD * sizeScale * (0.55 + Math.random() * 0.7)
    const endX = x + Math.cos(angle) * distance
    const endY =
      y + Math.sin(angle) * distance - WIND_SLASH_LEAF_FLOAT_UP * sizeScale
    const spin = (Math.random() < 0.5 ? -1 : 1) * (2.2 + Math.random() * 2.5)

    scene.tweens.add({
      targets: leaf,
      x: endX,
      y: endY,
      rotation: leaf.rotation + spin,
      alpha: 0,
      scaleX: leaf.scaleX * 0.6,
      scaleY: leaf.scaleY * 0.6,
      duration: WIND_SLASH_LEAF_DURATION_MS + Math.random() * 120,
      ease: 'Cubic.Out',
      onComplete: () => {
        leaf.destroy()
      },
    })
  }
}

/**
 * 弾が敵に当たったときに、風属性の爪ひっかきを tween で出す。
 * パワー（弾ダメージ）で線の本数・葉の枚数・大きさが増える。
 *
 * @param powerDamage 弾のパワー（通常は bullet の damage）
 * @param directionX / directionY 弾の進行方向（省略時はランダム角度）
 */
export function playWindSlashHit(
  scene: Phaser.Scene,
  x: number,
  y: number,
  directionX?: number,
  directionY?: number,
  powerDamage: number = PLAYER_ATTACK_DAMAGE,
): void {
  let baseRotation = Math.random() * Math.PI * 2
  if (
    typeof directionX === 'number' &&
    typeof directionY === 'number' &&
    (directionX !== 0 || directionY !== 0)
  ) {
    // 弾の進行方向に対して横切る向き（直角）にひっかく
    baseRotation = Math.atan2(directionY, directionX) + Math.PI / 2
  }

  const lineCount = getWindSlashLineCount(powerDamage)
  const sizeScale = getWindSlashSizeScale(powerDamage)
  const leafCount = lineCount * WIND_SLASH_LEAF_PER_LINE
  const lineLength = WIND_SLASH_LENGTH * sizeScale
  const lineWidth = WIND_SLASH_LINE_WIDTH * sizeScale
  const lineSpacing = WIND_SLASH_LINE_SPACING * sizeScale
  const lineOffsets = getWindSlashLineOffsets(lineCount, lineSpacing)

  const slash = scene.add.graphics()
  slash.setPosition(x, y)
  slash.setRotation(baseRotation)
  slash.setDepth(WIND_SLASH_DEPTH)

  const halfLength = lineLength / 2
  for (let index = 0; index < lineOffsets.length; index++) {
    const offsetY = lineOffsets[index]
    // 端の線は少し短く、中央は長く（1本だけのときは長く）
    let lengthScale = 1
    if (lineCount >= 3 && index !== 1) {
      lengthScale = 0.82
    } else if (lineCount === 2) {
      lengthScale = 0.9
    }
    const x0 = -halfLength * lengthScale
    const x1 = halfLength * lengthScale

    // 黒縁
    slash.lineStyle(lineWidth + 3, WIND_SLASH_OUTLINE_COLOR, 0.95)
    slash.beginPath()
    slash.moveTo(x0, offsetY)
    slash.lineTo(x1, offsetY)
    slash.strokePath()

    // 水色本体
    slash.lineStyle(lineWidth, WIND_SLASH_COLOR, 1)
    slash.beginPath()
    slash.moveTo(x0, offsetY)
    slash.lineTo(x1, offsetY)
    slash.strokePath()

    // 白いハイライト（少し短め）
    slash.lineStyle(Math.max(1.5, lineWidth * 0.45), WIND_SLASH_COLOR_INNER, 0.95)
    slash.beginPath()
    slash.moveTo(x0 * 0.7, offsetY)
    slash.lineTo(x1 * 0.7, offsetY)
    slash.strokePath()
  }

  slash.setScale(0.4)
  slash.setAlpha(1)

  scene.tweens.add({
    targets: slash,
    scaleX: 1.4,
    scaleY: 1.4,
    alpha: 0,
    duration: WIND_SLASH_DURATION_MS,
    ease: 'Cubic.Out',
    onComplete: () => {
      slash.destroy()
    },
  })

  // 木の葉が少し舞う（本数に比例）
  playWindSlashLeaves(scene, x, y, leafCount, sizeScale)
}

/**
 * パワーオーブ（エネルギー弾）のヒット演出。
 * 直撃用のごく小さいポップ（Blast の広い円とは別物）。
 */
export function playEnergyOrbHit(
  scene: Phaser.Scene,
  x: number,
  y: number,
  powerDamage: number = PLAYER_ATTACK_DAMAGE,
): void {
  const extraPower = Math.max(0, Math.round(powerDamage) - PLAYER_ATTACK_DAMAGE)
  let sizeScale = 1 + extraPower * ENERGY_ORB_HIT_SIZE_SCALE_PER_POWER
  if (sizeScale > ENERGY_ORB_HIT_SIZE_SCALE_MAX) {
    sizeScale = ENERGY_ORB_HIT_SIZE_SCALE_MAX
  }

  const ringEndRadius = ENERGY_ORB_HIT_RING_END_RADIUS * sizeScale
  const ring = scene.add.circle(
    x,
    y,
    ENERGY_ORB_HIT_RING_START_RADIUS,
    PLAYER_BULLET_POWER_ORB_COLOR,
    0.45,
  )
  ring.setStrokeStyle(2.5, PLAYER_BULLET_POWER_ORB_CORE_COLOR, 0.95)
  ring.setDepth(ENERGY_ORB_HIT_DEPTH)

  const ringEndScale = ringEndRadius / ENERGY_ORB_HIT_RING_START_RADIUS
  scene.tweens.add({
    targets: ring,
    scaleX: ringEndScale,
    scaleY: ringEndScale,
    alpha: 0,
    duration: ENERGY_ORB_HIT_RING_DURATION_MS,
    ease: 'Cubic.Out',
    onComplete: () => {
      ring.destroy()
    },
  })

  const core = scene.add.circle(
    x,
    y,
    ENERGY_ORB_HIT_BURST_SIZE * 0.7 * sizeScale,
    PLAYER_BULLET_POWER_ORB_CORE_COLOR,
    0.95,
  )
  core.setDepth(ENERGY_ORB_HIT_DEPTH + 1)
  scene.tweens.add({
    targets: core,
    scaleX: 1.8,
    scaleY: 1.8,
    alpha: 0,
    duration: ENERGY_ORB_HIT_RING_DURATION_MS * 0.7,
    ease: 'Sine.Out',
    onComplete: () => {
      core.destroy()
    },
  })

  const burstCount = ENERGY_ORB_HIT_BURST_COUNT
  const spread = ENERGY_ORB_HIT_BURST_SPREAD * sizeScale
  const blobSize = ENERGY_ORB_HIT_BURST_SIZE * sizeScale
  for (let index = 0; index < burstCount; index++) {
    const angle = (Math.PI * 2 * index) / burstCount + Math.random() * 0.25
    const distance = spread * (0.65 + Math.random() * 0.45)
    const endX = x + Math.cos(angle) * distance
    const endY = y + Math.sin(angle) * distance
    const useRim = index % 2 === 0
    const fillColor = useRim
      ? PLAYER_BULLET_POWER_ORB_RIM_COLOR
      : PLAYER_BULLET_POWER_ORB_COLOR
    const blob = scene.add.circle(x, y, blobSize * (0.7 + Math.random() * 0.4), fillColor, 0.95)
    blob.setStrokeStyle(1.5, 0x000000, 0.7)
    blob.setDepth(ENERGY_ORB_HIT_DEPTH)
    scene.tweens.add({
      targets: blob,
      x: endX,
      y: endY,
      scaleX: 0.2,
      scaleY: 0.2,
      alpha: 0,
      duration: ENERGY_ORB_HIT_BURST_DURATION_MS + Math.random() * 80,
      ease: 'Cubic.Out',
      onComplete: () => {
        blob.destroy()
      },
    })
  }
}

/**
 * 水魔法弾のヒット演出。
 * 水色の波紋＋水滴＋小さな氷の結晶が散って、少し凍るイメージ。
 */
export function playWaterOrbHit(
  scene: Phaser.Scene,
  x: number,
  y: number,
  powerDamage: number = PLAYER_ATTACK_DAMAGE,
): void {
  const extraPower = Math.max(0, Math.round(powerDamage) - PLAYER_ATTACK_DAMAGE)
  let sizeScale = 1 + extraPower * WATER_ORB_HIT_SIZE_SCALE_PER_POWER
  if (sizeScale > WATER_ORB_HIT_SIZE_SCALE_MAX) {
    sizeScale = WATER_ORB_HIT_SIZE_SCALE_MAX
  }

  const ringEndRadius = WATER_ORB_HIT_RING_END_RADIUS * sizeScale
  const ring = scene.add.circle(
    x,
    y,
    WATER_ORB_HIT_RING_START_RADIUS,
    PLAYER_BULLET_WATER_ORB_COLOR,
    0.4,
  )
  ring.setStrokeStyle(2, WATER_ORB_HIT_ICE_COLOR, 0.9)
  ring.setDepth(WATER_ORB_HIT_DEPTH)

  const ringEndScale = ringEndRadius / WATER_ORB_HIT_RING_START_RADIUS
  scene.tweens.add({
    targets: ring,
    scaleX: ringEndScale,
    scaleY: ringEndScale,
    alpha: 0,
    duration: WATER_ORB_HIT_RING_DURATION_MS,
    ease: 'Cubic.Out',
    onComplete: () => {
      ring.destroy()
    },
  })

  // 中心の霜っぽいフラッシュ
  const frostFlash = scene.add.circle(
    x,
    y,
    WATER_ORB_HIT_DROPLET_SIZE * 1.2 * sizeScale,
    WATER_ORB_HIT_ICE_COLOR,
    0.9,
  )
  frostFlash.setDepth(WATER_ORB_HIT_DEPTH + 1)
  scene.tweens.add({
    targets: frostFlash,
    scaleX: 1.6,
    scaleY: 1.6,
    alpha: 0,
    duration: WATER_ORB_HIT_RING_DURATION_MS * 0.75,
    ease: 'Sine.Out',
    onComplete: () => {
      frostFlash.destroy()
    },
  })

  // 水滴
  for (let index = 0; index < WATER_ORB_HIT_DROPLET_COUNT; index++) {
    const angle = (Math.PI * 2 * index) / WATER_ORB_HIT_DROPLET_COUNT + Math.random() * 0.3
    const distance = WATER_ORB_HIT_DROPLET_SPREAD * sizeScale * (0.55 + Math.random() * 0.5)
    const endX = x + Math.cos(angle) * distance
    const endY = y + Math.sin(angle) * distance + 4
    const droplet = scene.add.circle(
      x,
      y,
      WATER_ORB_HIT_DROPLET_SIZE * sizeScale * (0.7 + Math.random() * 0.4),
      index % 2 === 0 ? PLAYER_BULLET_WATER_ORB_COLOR : PLAYER_BULLET_WATER_ORB_RIM_COLOR,
      0.95,
    )
    droplet.setStrokeStyle(1, PLAYER_BULLET_WATER_ORB_CORE_COLOR, 0.8)
    droplet.setDepth(WATER_ORB_HIT_DEPTH)
    scene.tweens.add({
      targets: droplet,
      x: endX,
      y: endY,
      scaleX: 0.25,
      scaleY: 0.45,
      alpha: 0,
      duration: WATER_ORB_HIT_DROPLET_DURATION_MS + Math.random() * 60,
      ease: 'Cubic.Out',
      onComplete: () => {
        droplet.destroy()
      },
    })
  }

  // 小さな氷の結晶（ひし形）
  for (let index = 0; index < WATER_ORB_HIT_CRYSTAL_COUNT; index++) {
    const angle = (Math.PI * 2 * index) / WATER_ORB_HIT_CRYSTAL_COUNT + 0.4
    const distance = WATER_ORB_HIT_CRYSTAL_SPREAD * sizeScale * (0.7 + Math.random() * 0.35)
    const endX = x + Math.cos(angle) * distance
    const endY = y + Math.sin(angle) * distance
    const crystalSize = WATER_ORB_HIT_CRYSTAL_SIZE * sizeScale * (0.75 + Math.random() * 0.35)
    const crystal = scene.add.rectangle(
      x,
      y,
      crystalSize * 0.55,
      crystalSize,
      index % 2 === 0 ? WATER_ORB_HIT_FROST_COLOR : WATER_ORB_HIT_ICE_COLOR,
      0.95,
    )
    crystal.setStrokeStyle(1, 0x0284c7, 0.7)
    crystal.setAngle(45 + Math.random() * 30)
    crystal.setDepth(WATER_ORB_HIT_DEPTH + 1)
    scene.tweens.add({
      targets: crystal,
      x: endX,
      y: endY,
      angle: crystal.angle + 40,
      scaleX: 0.2,
      scaleY: 0.2,
      alpha: 0,
      duration: WATER_ORB_HIT_CRYSTAL_DURATION_MS + Math.random() * 80,
      ease: 'Sine.Out',
      onComplete: () => {
        crystal.destroy()
      },
    })
  }
}

// レベルアップで HP 全回復したとき、プレイヤー上に HP FULL! を出す
// x/y はプレイヤー付近。実際の HP 回復は呼び出し元（GameScene）の仕事
export function playHpFullText(scene: Phaser.Scene, x: number, y: number): void {
  const fullText = scene.add.text(x, y - 20, HP_FULL_TEXT, {
    fontFamily: FONT_FAMILY_UI,
    fontSize: HP_FULL_FONT_SIZE,
    color: HP_FULL_COLOR,
    fontStyle: 'bold',
  })
  fullText.setOrigin(0.5, 0.5)
  fullText.setStroke(HP_FULL_STROKE_COLOR, HP_FULL_STROKE_THICKNESS)
  fullText.setDepth(HP_FULL_DEPTH)
  fullText.setScale(0.6)
  fullText.setAlpha(0)

  // 小さく→大きく現れ、上へ浮かびながら消える（Phaser 標準 tween）
  scene.tweens.add({
    targets: fullText,
    alpha: 1,
    scaleX: 1.15,
    scaleY: 1.15,
    duration: 180,
    ease: 'Back.Out',
    onComplete: () => {
      scene.tweens.add({
        targets: fullText,
        y: fullText.y - HP_FULL_FLOAT_UP,
        alpha: 0,
        scaleX: 1,
        scaleY: 1,
        duration: HP_FULL_DURATION_MS - 180,
        ease: 'Sine.Out',
        onComplete: () => {
          fullText.destroy()
        },
      })
    },
  })
}

// 能力が全部上限のとき、選択画面なしでレベルアップしたことを知らせる
export function playAutoGoldLevelUpText(
  scene: Phaser.Scene,
  x: number,
  y: number,
): void {
  const levelUpText = scene.add.text(x, y - 36, AUTO_GOLD_LEVEL_UP_TEXT, {
    fontFamily: FONT_FAMILY_UI,
    fontSize: AUTO_GOLD_LEVEL_UP_FONT_SIZE,
    color: AUTO_GOLD_LEVEL_UP_COLOR,
    fontStyle: 'bold',
  })
  levelUpText.setOrigin(0.5, 0.5)
  levelUpText.setStroke(
    AUTO_GOLD_LEVEL_UP_STROKE_COLOR,
    AUTO_GOLD_LEVEL_UP_STROKE_THICKNESS,
  )
  levelUpText.setDepth(AUTO_GOLD_LEVEL_UP_DEPTH)
  levelUpText.setScale(0.55)
  levelUpText.setAlpha(0)

  scene.tweens.add({
    targets: levelUpText,
    alpha: 1,
    scaleX: 1.2,
    scaleY: 1.2,
    duration: 180,
    ease: 'Back.Out',
    onComplete: () => {
      scene.tweens.add({
        targets: levelUpText,
        y: levelUpText.y - AUTO_GOLD_LEVEL_UP_FLOAT_UP,
        alpha: 0,
        scaleX: 1,
        scaleY: 1,
        duration: AUTO_GOLD_LEVEL_UP_DURATION_MS - 180,
        ease: 'Sine.Out',
        onComplete: () => {
          levelUpText.destroy()
        },
      })
    },
  })
}

// 被弾時に画面を赤く一瞬フラッシュする（カメラ固定のフルスクリーン矩形）
export function playPlayerHurtFlash(scene: Phaser.Scene): void {
  const flash = scene.add.rectangle(
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2,
    GAME_WIDTH,
    GAME_HEIGHT,
    PLAYER_HURT_FLASH_COLOR,
    PLAYER_HURT_FLASH_ALPHA,
  )
  flash.setDepth(350) // HUD より手前寄りに出す
  // カメラが動いても画面全体を覆い続ける
  flash.setScrollFactor(0)

  scene.tweens.add({
    targets: flash,
    alpha: 0,
    duration: PLAYER_HURT_FLASH_DURATION_MS,
    onComplete: () => {
      flash.destroy()
    },
  })
}
