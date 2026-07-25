// ============================================================
// FinalWaveBannerSystem.ts
// ------------------------------------------------------------
// 残り時間終盤に大きな「FINAL WAVE」文字を画面中央へ出す。
//
// 役割:
//   - ポップ → 少し縮む → 待機 → フェードアウトの tween 連鎖
//
// 呼び出し元:
//   - GameScene.ts … 終盤トリガー時に playFinalWaveBanner(this)
//
// 関連ファイル:
//   - WaveSystem.ts … startFinalWaveExtraSpawns（敵の追加出現）
//   - GameConstants.ts … 文字サイズ・色・各フェーズの時間
//
// 注意: バナーは見た目だけ。敵の追加スポーンは WaveSystem 側。
// レベルアップ中は time.paused = true なので delayedCall は使わない。
// ============================================================

import Phaser from 'phaser'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  FINAL_WAVE_BANNER_FONT_SIZE,
  FINAL_WAVE_BANNER_COLOR,
  FINAL_WAVE_BANNER_STROKE_COLOR,
  FINAL_WAVE_BANNER_STROKE_THICKNESS,
  FINAL_WAVE_BANNER_DEPTH,
  FINAL_WAVE_BANNER_POP_MS,
  FINAL_WAVE_BANNER_HOLD_MS,
  FINAL_WAVE_BANNER_FADE_MS,
  FONT_FAMILY_HEADING,
} from '../GameConstants'

/**
 * 残り時間終盤に大きな FINAL WAVE 文字を tween で出す。
 * 呼び出し後は非同期でアニメが進み、終わると Text を destroy する。
 */
export function playFinalWaveBanner(scene: Phaser.Scene): void {
  const bannerText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'FINAL WAVE', {
    fontFamily: FONT_FAMILY_HEADING,
    fontSize: FINAL_WAVE_BANNER_FONT_SIZE,
    color: FINAL_WAVE_BANNER_COLOR,
    stroke: FINAL_WAVE_BANNER_STROKE_COLOR,
    strokeThickness: FINAL_WAVE_BANNER_STROKE_THICKNESS,
  })
  bannerText.setOrigin(0.5)
  bannerText.setDepth(FINAL_WAVE_BANNER_DEPTH)
  bannerText.setScale(0.3)
  bannerText.setAlpha(0)

  // StartCountdown / Pierce 取得と同じ tweens.chain（time.paused 中も動く）
  scene.tweens.chain({
    tweens: [
      {
        targets: bannerText,
        alpha: 1,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: FINAL_WAVE_BANNER_POP_MS,
        ease: 'Back.Out',
      },
      {
        targets: bannerText,
        scaleX: 1,
        scaleY: 1,
        duration: 120,
        ease: 'Sine.Out',
      },
      {
        targets: bannerText,
        alpha: 0,
        scaleX: 1.1,
        scaleY: 1.1,
        y: bannerText.y - 20,
        duration: FINAL_WAVE_BANNER_FADE_MS,
        delay: FINAL_WAVE_BANNER_HOLD_MS,
        ease: 'Sine.In',
      },
    ],
    onComplete: () => {
      bannerText.destroy()
    },
  })
}
