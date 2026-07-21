// ============================================================
// 戦闘の見た目フィードバック（数字・フラッシュ・HP FULL）
// ------------------------------------------------------------
// GameScene がダメージ発生・撃破・レベルアップ回復時に呼ぶ。
// いずれも見た目の tween / 一時オブジェクトのみ。HP やスコアは変えない。
// ============================================================

import Phaser from 'phaser'
import {
  ENEMY_DEFEAT_FLASH_DURATION_MS,
  ENEMY_DEFEAT_FLASH_COLOR,
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
  HP_FULL_TEXT,
  HP_FULL_FONT_SIZE,
  HP_FULL_COLOR,
  HP_FULL_STROKE_COLOR,
  HP_FULL_STROKE_THICKNESS,
  HP_FULL_DURATION_MS,
  HP_FULL_FLOAT_UP,
  HP_FULL_DEPTH,
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

// 撃破位置に短い白フラッシュを出す（敵スプライト自体は別処理で消える）
export function playEnemyDefeatFlash(
  scene: Phaser.Scene,
  x: number,
  y: number,
  size: number,
): void {
  const flash = scene.add.rectangle(x, y, size, size, ENEMY_DEFEAT_FLASH_COLOR, 0.9)
  flash.setDepth(50)

  scene.tweens.add({
    targets: flash,
    alpha: 0,
    duration: ENEMY_DEFEAT_FLASH_DURATION_MS,
    onComplete: () => {
      flash.destroy()
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
