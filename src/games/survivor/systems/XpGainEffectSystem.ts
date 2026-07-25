// ============================================================
// XP 獲得の見た目演出（キラキラ + 「+N XP」テキスト）
// ------------------------------------------------------------
// 敵撃破などで XP が増えたとき GameScene が呼ぶ。
// 実際の XP 加算・レベルアップ判定は呼び出し元 / HudSystem 側。
// ここは HUD の XP バー位置へ向かう見た目だけ。
// ============================================================

import Phaser from 'phaser'
import {
  XP_GAIN_SPARKLE_COUNT,
  XP_GAIN_EFFECT_DURATION_MS,
  XP_GAIN_SPARKLE_COLOR,
  XP_GAIN_TEXT_COLOR,
} from '../GameConstants'
import type { HudSystem } from './HudSystem'

// dungeon sweeper と同様：キラキラが XP バーへ集まり、テキストが上に消える（見た目だけ）
// startX/Y は獲得地点（だいたい敵の位置）。xpGained は表示用の数値
export function playXpGainVisualEffect(
  scene: Phaser.Scene,
  hudSystem: HudSystem,
  startX: number,
  startY: number,
  xpGained: number,
): void {
  // HUD 上の XP バー付近の座標（ワールドではなく UI 側の目標点）
  const xpTarget = hudSystem.getXpEffectTargetPosition()
  const effectDepth = 250

  // 複数の ✦ を少しずつずらして XP バーへ飛ばす
  for (let sparkleIndex = 0; sparkleIndex < XP_GAIN_SPARKLE_COUNT; sparkleIndex++) {
    const sparkle = scene.add
      .text(
        // 開始位置を少しランダムに散らす
        startX + Phaser.Math.Between(-14, 14),
        startY + Phaser.Math.Between(-12, 12),
        '✦',
        {
          fontSize: '16px',
          color: XP_GAIN_SPARKLE_COLOR,
          stroke: '#ffffff',
          strokeThickness: 2,
        },
      )
      .setOrigin(0.5)
      .setDepth(effectDepth)

    scene.tweens.add({
      targets: sparkle,
      // 目標も少し散らして重なりすぎないようにする
      x: xpTarget.x + Phaser.Math.Between(-8, 8),
      y: xpTarget.y + Phaser.Math.Between(-6, 6),
      scale: 0.3,
      alpha: 0,
      duration: XP_GAIN_EFFECT_DURATION_MS,
      ease: 'Quad.InOut',
      // 後から出るキラキラほど遅らせて「連続で飛ぶ」感じにする
      delay: sparkleIndex * 25,
      onComplete: () => {
        sparkle.destroy()
      },
    })
  }

  // 「+12 XP」のようなテキストも同じ目標へ飛ばしながら消える
  const gainedExpText = scene.add
    .text(startX, startY - 18, `+${xpGained} XP`, {
      fontSize: '15px',
      color: XP_GAIN_TEXT_COLOR,
      stroke: '#064e3b',
      strokeThickness: 3,
    })
    .setOrigin(0.5)
    .setDepth(effectDepth)

  scene.tweens.add({
    targets: gainedExpText,
    x: xpTarget.x,
    y: xpTarget.y,
    alpha: 0,
    duration: XP_GAIN_EFFECT_DURATION_MS,
    ease: 'Quad.InOut',
    onComplete: () => {
      gainedExpText.destroy()
    },
  })
}
