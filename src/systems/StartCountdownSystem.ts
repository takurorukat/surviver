// ============================================================
// ゲーム開始カウントダウン（3・2・1・スタート）
// ------------------------------------------------------------
// GameScene の create 後に呼び、完了コールバックで本編開始（敵スポーン等）する。
// 文字オブジェクトは1つだけ使い回し、WebGL テクスチャ生成の負荷を抑える。
// ============================================================

import Phaser from 'phaser'
import {
  START_COUNTDOWN_STEP_MS,
  START_COUNTDOWN_LABELS,
  START_COUNTDOWN_POP_IN_MS,
  START_COUNTDOWN_HOLD_MS,
  START_COUNTDOWN_FADE_OUT_MS,
  START_COUNTDOWN_FONT_SIZE,
  START_COUNTDOWN_START_FONT_SIZE,
  START_COUNTDOWN_TEXT_COLOR,
  START_COUNTDOWN_STROKE_COLOR,
  START_COUNTDOWN_STROKE_THICKNESS,
  START_COUNTDOWN_DEPTH,
  FONT_FAMILY_UI,
} from '../GameConstants'

// 画面中央に 3・2・1・スタート をトゥイーン表示する
// 各ラベルは START_COUNTDOWN_STEP_MS 間隔で出現。全部終わったら onComplete
export function playStartCountdown(
  scene: Phaser.Scene,
  centerX: number,
  centerY: number,
  onComplete: () => void,
): void {
  const countdownText = scene.add
    .text(centerX, centerY, '', {
      fontFamily: FONT_FAMILY_UI,
      fontSize: `${START_COUNTDOWN_FONT_SIZE}px`,
      color: START_COUNTDOWN_TEXT_COLOR,
      stroke: START_COUNTDOWN_STROKE_COLOR,
      strokeThickness: START_COUNTDOWN_STROKE_THICKNESS,
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setDepth(START_COUNTDOWN_DEPTH)
    .setAlpha(0)
    .setScale(0.4)

  // 表示前に全ラベルを一度セットしてフォントキャッシュを温める
  for (let index = 0; index < START_COUNTDOWN_LABELS.length; index++) {
    const label = START_COUNTDOWN_LABELS[index]
    const isStartLabel = label === 'START'
    const fontSize = isStartLabel ? START_COUNTDOWN_START_FONT_SIZE : START_COUNTDOWN_FONT_SIZE
    countdownText.setText(label)
    countdownText.setFontSize(`${fontSize}px`)
  }
  countdownText.setText('')
  countdownText.setAlpha(0)
  countdownText.setScale(0.4)

  const tweenSteps: Phaser.Types.Tweens.TweenBuilderConfig[] = []

  for (let stepIndex = 0; stepIndex < START_COUNTDOWN_LABELS.length; stepIndex++) {
    const label = START_COUNTDOWN_LABELS[stepIndex]
    const isStartLabel = label === 'START'
    const fontSize = isStartLabel ? START_COUNTDOWN_START_FONT_SIZE : START_COUNTDOWN_FONT_SIZE

    // 各ステップの開始位置へリセット
    tweenSteps.push({
      targets: countdownText,
      alpha: 0,
      scale: 0.4,
      duration: 0,
      onStart: () => {
        countdownText.setText(label)
        countdownText.setFontSize(`${fontSize}px`)
      },
    })

    // ポップイン
    tweenSteps.push({
      targets: countdownText,
      alpha: 1,
      scale: 1.15,
      duration: START_COUNTDOWN_POP_IN_MS,
      ease: 'Back.Out',
    })

    // ホールド → フェードアウト
    tweenSteps.push({
      targets: countdownText,
      alpha: 0,
      scale: 1.35,
      duration: START_COUNTDOWN_FADE_OUT_MS,
      delay: START_COUNTDOWN_HOLD_MS,
      ease: 'Quad.In',
    })

    // 最後のラベル以外は次の数字まで待つ
    if (stepIndex < START_COUNTDOWN_LABELS.length - 1) {
      const waitMs =
        START_COUNTDOWN_STEP_MS -
        START_COUNTDOWN_POP_IN_MS -
        START_COUNTDOWN_HOLD_MS -
        START_COUNTDOWN_FADE_OUT_MS
      if (waitMs > 0) {
        tweenSteps.push({
          targets: countdownText,
          duration: waitMs,
        })
      }
    }
  }

  scene.tweens.chain({
    tweens: tweenSteps,
    onComplete: () => {
      countdownText.destroy()
      onComplete()
    },
  })
}
