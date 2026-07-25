// ============================================================
// ゴールド獲得演出
// ------------------------------------------------------------
// ・レベルアップのゴールド: プレイヤーから上へ浮かぶ
// ・クリア吸引の拾得: 上部バーのゴールド表示へ飛ぶ
// 実際の保存・加算は GameScene / UnlockSaveSystem が担当する。
// ============================================================

import Phaser from 'phaser'
import {
  GOLD_GAIN_EFFECT_DURATION_MS,
  GOLD_GAIN_TEXT_COLOR,
  GOLD_GAIN_FLOAT_UP,
  GOLD_GAIN_FLOAT_END_SCALE,
  GOLD_COIN_SPRITE_KEY,
  GOLD_COIN_ANIM_KEY,
  GOLD_COIN_DISPLAY_SIZE,
} from '../GameConstants'
import { ensureGoldCoinAnimation } from '../objects/GoldCoin'
import type { HudSystem } from './HudSystem'

const GOLD_FLY_EFFECT_DEPTH = 440
// バーに吸い込まれて小さく見える終了スケール（クリア吸引用）
const GOLD_FLY_END_SCALE = 0.45

/**
 * レベルアップでゴールドを得たときの演出。
 * コインと「+N GOLD」がプレイヤー位置から上へ浮かんで消える。
 */
export function playGoldGainVisualEffect(
  scene: Phaser.Scene,
  _hudSystem: HudSystem,
  startX: number,
  startY: number,
  goldGained: number,
): void {
  ensureGoldCoinAnimation(scene)

  const coin = scene.add.sprite(startX, startY, GOLD_COIN_SPRITE_KEY, 0)
  coin.setDisplaySize(GOLD_COIN_DISPLAY_SIZE, GOLD_COIN_DISPLAY_SIZE)
  coin.setDepth(GOLD_FLY_EFFECT_DEPTH)
  if (scene.anims.exists(GOLD_COIN_ANIM_KEY)) {
    coin.play(GOLD_COIN_ANIM_KEY)
  }

  const endY = startY - GOLD_GAIN_FLOAT_UP

  scene.tweens.add({
    targets: coin,
    y: endY,
    scaleX: GOLD_GAIN_FLOAT_END_SCALE,
    scaleY: GOLD_GAIN_FLOAT_END_SCALE,
    alpha: 0,
    duration: GOLD_GAIN_EFFECT_DURATION_MS,
    ease: 'Cubic.Out',
    onComplete: () => {
      coin.destroy()
    },
  })

  const gainedText = scene.add
    .text(startX, startY - 24, `+${goldGained} GOLD`, {
      fontSize: '17px',
      color: GOLD_GAIN_TEXT_COLOR,
      fontStyle: 'bold',
      stroke: '#713f12',
      strokeThickness: 4,
    })
    .setOrigin(0.5)
    .setDepth(GOLD_FLY_EFFECT_DEPTH)

  scene.tweens.add({
    targets: gainedText,
    y: endY - 20,
    alpha: 0,
    duration: GOLD_GAIN_EFFECT_DURATION_MS,
    ease: 'Cubic.Out',
    onComplete: () => {
      gainedText.destroy()
    },
  })
}

/**
 * クリア吸引でゴールドコインを拾ったとき用。
 * 取得地点から上部バーのゴールド表示へ、コイン本体が飛んでいく。
 */
export function playGoldCoinFlyToHud(
  scene: Phaser.Scene,
  hudSystem: HudSystem,
  startX: number,
  startY: number,
): void {
  const target = hudSystem.getGoldEffectTargetPosition()
  ensureGoldCoinAnimation(scene)

  const coin = scene.add.sprite(startX, startY, GOLD_COIN_SPRITE_KEY, 0)
  coin.setDisplaySize(GOLD_COIN_DISPLAY_SIZE, GOLD_COIN_DISPLAY_SIZE)
  coin.setDepth(GOLD_FLY_EFFECT_DEPTH)
  if (scene.anims.exists(GOLD_COIN_ANIM_KEY)) {
    coin.play(GOLD_COIN_ANIM_KEY)
  }

  scene.tweens.add({
    targets: coin,
    x: target.x,
    y: target.y,
    scaleX: GOLD_FLY_END_SCALE,
    scaleY: GOLD_FLY_END_SCALE,
    duration: GOLD_GAIN_EFFECT_DURATION_MS,
    ease: 'Cubic.In',
    onComplete: () => {
      coin.destroy()
    },
  })
}

/** @deprecated playGoldCoinFlyToHud と同じ。旧呼び出し互換用。 */
export function playGoldSparklesToHud(
  scene: Phaser.Scene,
  hudSystem: HudSystem,
  startX: number,
  startY: number,
): void {
  playGoldCoinFlyToHud(scene, hudSystem, startX, startY)
}
