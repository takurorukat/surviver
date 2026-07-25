// ============================================================
// ゲーム開始・レベルアップ再開のカウントダウン表示
// ------------------------------------------------------------
// GameScene の create 後（3・2・1・START）や、レベルアップ UI 終了後（ready・GO!）
// に呼ぶ。文字オブジェクトは1つだけ使い回し、WebGL テクスチャ生成の負荷を抑える。
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
  RESUME_COUNTDOWN_LABELS,
  RESUME_COUNTDOWN_STEP_MS,
  RESUME_COUNTDOWN_POP_IN_MS,
  RESUME_COUNTDOWN_HOLD_MS,
  RESUME_COUNTDOWN_FADE_OUT_MS,
  FONT_FAMILY_UI,
} from '../GameConstants'

type CountdownTiming = {
  labels: readonly string[]
  stepMs: number
  popInMs: number
  holdMs: number
  fadeOutMs: number
}

// 最後の強調ラベル（START / GO!）かどうか
function isEmphasisLabel(label: string): boolean {
  return label === 'START' || label === 'GO!'
}

// 画面中央にラベル列をトゥイーン表示する。全部終わったら onComplete
function playCountdownWithTiming(
  scene: Phaser.Scene,
  centerX: number,
  centerY: number,
  timing: CountdownTiming,
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
  for (let index = 0; index < timing.labels.length; index++) {
    const label = timing.labels[index]
    const fontSize = isEmphasisLabel(label)
      ? START_COUNTDOWN_START_FONT_SIZE
      : START_COUNTDOWN_FONT_SIZE
    countdownText.setText(label)
    countdownText.setFontSize(`${fontSize}px`)
  }
  countdownText.setText('')
  countdownText.setAlpha(0)
  countdownText.setScale(0.4)

  const tweenSteps: Phaser.Types.Tweens.TweenBuilderConfig[] = []

  for (let stepIndex = 0; stepIndex < timing.labels.length; stepIndex++) {
    const label = timing.labels[stepIndex]
    const fontSize = isEmphasisLabel(label)
      ? START_COUNTDOWN_START_FONT_SIZE
      : START_COUNTDOWN_FONT_SIZE

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
      duration: timing.popInMs,
      ease: 'Back.Out',
    })

    // ホールド → フェードアウト
    tweenSteps.push({
      targets: countdownText,
      alpha: 0,
      scale: 1.35,
      duration: timing.fadeOutMs,
      delay: timing.holdMs,
      ease: 'Quad.In',
    })

    // 最後のラベル以外は次の文字まで待つ
    if (stepIndex < timing.labels.length - 1) {
      const waitMs =
        timing.stepMs - timing.popInMs - timing.holdMs - timing.fadeOutMs
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

// ステージ開始: 3・2・1・START
export function playStartCountdown(
  scene: Phaser.Scene,
  centerX: number,
  centerY: number,
  onComplete: () => void,
): void {
  playCountdownWithTiming(
    scene,
    centerX,
    centerY,
    {
      labels: START_COUNTDOWN_LABELS,
      stepMs: START_COUNTDOWN_STEP_MS,
      popInMs: START_COUNTDOWN_POP_IN_MS,
      holdMs: START_COUNTDOWN_HOLD_MS,
      fadeOutMs: START_COUNTDOWN_FADE_OUT_MS,
    },
    onComplete,
  )
}

// レベルアップ後の再開: ready・GO!（3・2・1・START のおよそ半分の長さ）
export function playResumeCountdown(
  scene: Phaser.Scene,
  centerX: number,
  centerY: number,
  onComplete: () => void,
): void {
  playCountdownWithTiming(
    scene,
    centerX,
    centerY,
    {
      labels: RESUME_COUNTDOWN_LABELS,
      stepMs: RESUME_COUNTDOWN_STEP_MS,
      popInMs: RESUME_COUNTDOWN_POP_IN_MS,
      holdMs: RESUME_COUNTDOWN_HOLD_MS,
      fadeOutMs: RESUME_COUNTDOWN_FADE_OUT_MS,
    },
    onComplete,
  )
}
