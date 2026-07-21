// ============================================================
// ゲーム開始カウントダウン（3・2・1・スタート）
// ------------------------------------------------------------
// GameScene の create 後に呼び、完了コールバックで本編開始（敵スポーン等）する。
// 見た目の tween のみ。ゲーム進行の停止は呼び出し元側の責務。
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
} from '../GameConstants'

// 画面中央に 3・2・1・スタート をトゥイーン表示する
// 各ラベルは START_COUNTDOWN_STEP_MS 間隔で出現。全部終わったら onComplete
export function playStartCountdown(
  scene: Phaser.Scene,
  centerX: number,
  centerY: number,
  onComplete: () => void,
): void {
  const totalDurationMs = START_COUNTDOWN_LABELS.length * START_COUNTDOWN_STEP_MS

  // 各ステップを delayedCall でスケジュール（同時にループを回しても待ちはしない）
  for (let stepIndex = 0; stepIndex < START_COUNTDOWN_LABELS.length; stepIndex++) {
    const label = START_COUNTDOWN_LABELS[stepIndex]
    const stepDelayMs = stepIndex * START_COUNTDOWN_STEP_MS

    scene.time.delayedCall(stepDelayMs, () => {
      showCountdownLabel(scene, centerX, centerY, label)
    })
  }

  // 最後のラベル開始から STEP 分待って完了（各ラベルのフェード完了より少し早くてもよい設計）
  scene.time.delayedCall(totalDurationMs, () => {
    onComplete()
  })
}

// 1枚のカウントダウン文字をポップイン → ホールド → フェードアウト
function showCountdownLabel(
  scene: Phaser.Scene,
  centerX: number,
  centerY: number,
  label: string,
): void {
  // 「スタート」だけ大きめのフォント
  const isStartLabel = label === 'START'
  const fontSize = isStartLabel ? START_COUNTDOWN_START_FONT_SIZE : START_COUNTDOWN_FONT_SIZE

  const countdownText = scene.add
    .text(centerX, centerY, label, {
      fontSize: `${fontSize}px`,
      color: START_COUNTDOWN_TEXT_COLOR,
      stroke: START_COUNTDOWN_STROKE_COLOR,
      strokeThickness: START_COUNTDOWN_STROKE_THICKNESS,
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setDepth(START_COUNTDOWN_DEPTH)
    .setAlpha(0)
    .setScale(0.4)

  // 出現: 透明・小 → 不透明・やや大きめ
  scene.tweens.add({
    targets: countdownText,
    alpha: 1,
    scale: 1.15,
    duration: START_COUNTDOWN_POP_IN_MS,
    ease: 'Back.Out',
    onComplete: () => {
      // 少し表示してから拡大しつつフェードアウト
      scene.tweens.add({
        targets: countdownText,
        alpha: 0,
        scale: 1.35,
        duration: START_COUNTDOWN_FADE_OUT_MS,
        delay: START_COUNTDOWN_HOLD_MS,
        ease: 'Quad.In',
        onComplete: () => {
          countdownText.destroy()
        },
      })
    },
  })
}
