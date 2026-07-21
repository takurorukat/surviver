/**
 * ステージクリア時のゴールドコイン。
 * - 回転スプライトで上から落ちる
 * - クリア吸引でプレイヤーへ飛んでいく
 * - 取得時に上部バーのゴールドへキラキラ演出
 *
 * 座標は直接書き換えず、落下は tween、吸引は body.setVelocity。
 */
import Phaser from 'phaser'
import {
  GOLD_COIN_SPRITE_KEY,
  GOLD_COIN_ANIM_KEY,
  GOLD_COIN_DISPLAY_SIZE,
  GOLD_COIN_HITBOX_SIZE,
  GOLD_COIN_FRAME_COUNT,
  GOLD_COIN_ANIM_FRAME_RATE,
  COIN_CLEAR_VACUUM_SPEED,
} from '../GameConstants'
import { applyDevEntityDepth } from '../utils/applyDevEntityDepth'

export type GoldCoinView = Phaser.GameObjects.Sprite

/** ゴールドコイン用 Arcade Group を作る。 */
export function createGoldCoinGroup(scene: Phaser.Scene): Phaser.Physics.Arcade.Group {
  return scene.physics.add.group()
}

/** 回転アニメを1回だけ登録する（シーン開始時）。 */
export function ensureGoldCoinAnimation(scene: Phaser.Scene): void {
  if (scene.anims.exists(GOLD_COIN_ANIM_KEY)) {
    return
  }
  if (!scene.textures.exists(GOLD_COIN_SPRITE_KEY)) {
    return
  }

  const frames: Phaser.Types.Animations.AnimationFrame[] = []
  for (let index = 0; index < GOLD_COIN_FRAME_COUNT; index++) {
    frames.push({ key: GOLD_COIN_SPRITE_KEY, frame: index })
  }

  scene.anims.create({
    key: GOLD_COIN_ANIM_KEY,
    frames,
    frameRate: GOLD_COIN_ANIM_FRAME_RATE,
    repeat: -1,
  })
}

/**
 * ゴールドコインを1枚出す。1枚 = 1 ゴールド。
 * magnetSpeed = 0 を必ずセットする。
 */
export function trySpawnGoldCoinAt(
  scene: Phaser.Scene,
  goldCoinGroup: Phaser.Physics.Arcade.Group,
  spawnX: number,
  spawnY: number,
): GoldCoinView | null {
  ensureGoldCoinAnimation(scene)

  const coin = scene.add.sprite(spawnX, spawnY, GOLD_COIN_SPRITE_KEY, 0)
  coin.setDisplaySize(GOLD_COIN_DISPLAY_SIZE, GOLD_COIN_DISPLAY_SIZE)
  coin.setDepth(7)
  if (scene.anims.exists(GOLD_COIN_ANIM_KEY)) {
    coin.play(GOLD_COIN_ANIM_KEY)
  }

  scene.physics.add.existing(coin)
  const body = coin.body as Phaser.Physics.Arcade.Body
  body.moves = true
  body.setAllowGravity(false)
  body.setVelocity(0, 0)
  body.setSize(GOLD_COIN_HITBOX_SIZE, GOLD_COIN_HITBOX_SIZE)
  body.setOffset(
    (coin.width - GOLD_COIN_HITBOX_SIZE) / 2,
    (coin.height - GOLD_COIN_HITBOX_SIZE) / 2,
  )

  coin.setData('goldValue', 1)
  coin.setData('magnetSpeed', 0)
  goldCoinGroup.add(coin)
  body.updateFromGameObject()
  applyDevEntityDepth(coin)

  return coin
}

/**
 * クリア報酬のゴールドを、中央付近の床へ上から落とす。
 * 着地後はクリア吸引でプレイヤーへ集める。
 */
export function spawnClearGoldCoinRain(
  scene: Phaser.Scene,
  goldCoinGroup: Phaser.Physics.Arcade.Group,
  centerX: number,
  centerY: number,
  goldAmount: number,
  fallHeight: number,
  spreadRadius: number,
  fallDurationMs: number,
): void {
  const safeCount = Math.max(0, Math.floor(goldAmount))
  for (let index = 0; index < safeCount; index++) {
    const angle = Math.random() * Math.PI * 2
    const distance = Math.random() * spreadRadius
    const landX = centerX + Math.cos(angle) * distance
    const landY = centerY + Math.sin(angle) * distance
    const startY = landY - fallHeight

    const coin = trySpawnGoldCoinAt(scene, goldCoinGroup, landX, startY)
    if (coin === null) {
      continue
    }

    const body = coin.body as Phaser.Physics.Arcade.Body
    body.moves = false
    body.setVelocity(0, 0)

    scene.tweens.add({
      targets: coin,
      y: landY,
      duration: fallDurationMs,
      ease: 'Cubic.In',
      delay: Math.floor(Math.random() * 80),
      onComplete: () => {
        if (!coin.active || coin.body === null) {
          return
        }
        const landedBody = coin.body as Phaser.Physics.Arcade.Body
        landedBody.moves = true
        landedBody.setVelocity(0, 0)
        coin.setData('magnetSpeed', 0)
      },
    })
  }
}

/** クリア吸引: 全ゴールドコインをプレイヤーへ飛ばす。 */
export function updateAllGoldCoinsVacuumMovement(
  goldCoinGroup: Phaser.Physics.Arcade.Group,
  playerX: number,
  playerY: number,
): void {
  const children = goldCoinGroup.getChildren()

  for (let index = 0; index < children.length; index++) {
    const coin = children[index] as GoldCoinView
    if (!coin.active || coin.body === null) {
      continue
    }

    const body = coin.body as Phaser.Physics.Arcade.Body
    if (!body.moves) {
      continue
    }

    const dx = playerX - coin.x
    const dy = playerY - coin.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < 1) {
      body.setVelocity(0, 0)
      continue
    }

    coin.setData('magnetSpeed', COIN_CLEAR_VACUUM_SPEED)
    body.setVelocity(
      (dx / distance) * COIN_CLEAR_VACUUM_SPEED,
      (dy / distance) * COIN_CLEAR_VACUUM_SPEED,
    )
  }
}

export function countActiveGoldCoins(
  goldCoinGroup: Phaser.Physics.Arcade.Group,
): number {
  const children = goldCoinGroup.getChildren()
  let activeCount = 0
  for (let index = 0; index < children.length; index++) {
    const coin = children[index] as GoldCoinView
    if (coin.active) {
      activeCount = activeCount + 1
    }
  }
  return activeCount
}
