// ============================================================
// ステージクリア / ゲームクリアの大きなバナー演出
// ------------------------------------------------------------
// GameScene がクリア確定後に呼ぶ。見た目の tween だけ担当。
// フェードアウト完了後に onComplete（次の結果画面など）へ進む。
// ============================================================

import Phaser from 'phaser'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  STAGE_CLEAR_BANNER_FONT_SIZE,
  STAGE_CLEAR_BANNER_COLOR,
  STAGE_CLEAR_BANNER_STROKE_COLOR,
  STAGE_CLEAR_BANNER_STROKE_THICKNESS,
  STAGE_CLEAR_BANNER_DEPTH,
  STAGE_CLEAR_BANNER_POP_MS,
  STAGE_CLEAR_BANNER_HOLD_MS,
  STAGE_CLEAR_BANNER_FADE_MS,
  STAGE_CLEAR_BANNER_AREA_CLEAR_LABEL,
  ALL_ENEMIES_CLEAR_BANNER_FONT_SIZE,
  ALL_ENEMIES_CLEAR_BANNER_COLOR,
  ALL_ENEMIES_CLEAR_BANNER_POP_MS,
  ALL_ENEMIES_CLEAR_BANNER_SETTLE_MS,
  ALL_ENEMIES_CLEAR_BANNER_HOLD_MS,
  ALL_ENEMIES_CLEAR_BANNER_FADE_MS,
  CLEAR_REWARD_TEXT_XP_COLOR,
  CLEAR_REWARD_TEXT_GOLD_COLOR,
  CLEAR_REWARD_TEXT_FORMULA_COLOR,
  CLEAR_REWARD_TEXT_XP_FONT_SIZE,
  CLEAR_REWARD_TEXT_FORMULA_FONT_SIZE,
  CLEAR_REWARD_TEXT_GOLD_FONT_SIZE,
  CLEAR_REWARD_TEXT_POP_MS,
  CLEAR_REWARD_TEXT_SETTLE_MS,
  CLEAR_REWARD_TEXT_HOLD_MS,
  CLEAR_REWARD_TEXT_FADE_MS,
  CLEAR_REWARD_XP_FORMULA_LABEL,
  FONT_FAMILY_HEADING,
  FONT_FAMILY_UI,
} from '../GameConstants'

type ClearBannerTiming = {
  popMs: number
  settleMs: number
  holdMs: number
  fadeMs: number
}

const DEFAULT_BANNER_TIMING: ClearBannerTiming = {
  popMs: STAGE_CLEAR_BANNER_POP_MS,
  settleMs: 120,
  holdMs: STAGE_CLEAR_BANNER_HOLD_MS,
  fadeMs: STAGE_CLEAR_BANNER_FADE_MS,
}

// クリア系バナー共通のポップイン→停止→フェード演出
function playClearBanner(
  scene: Phaser.Scene,
  label: string,
  fontSize: string,
  color: string,
  onComplete: () => void,
  timing: ClearBannerTiming = DEFAULT_BANNER_TIMING,
): void {
  const bannerText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, label, {
    fontFamily: FONT_FAMILY_HEADING,
    fontSize,
    color,
    stroke: STAGE_CLEAR_BANNER_STROKE_COLOR,
    strokeThickness: STAGE_CLEAR_BANNER_STROKE_THICKNESS,
  })
  bannerText.setOrigin(0.5) // 中心基準で拡大するため
  bannerText.setDepth(STAGE_CLEAR_BANNER_DEPTH) // 他 UI より手前
  bannerText.setScale(0.35) // 小さく始まってポップイン
  bannerText.setAlpha(0)

  // ① 拡大して出現（Back.Out = 少し行き過ぎてから戻る弾み）
  scene.tweens.add({
    targets: bannerText,
    alpha: 1,
    scaleX: 1.15,
    scaleY: 1.15,
    duration: timing.popMs,
    ease: 'Back.Out',
    onComplete: () => {
      // ② 少し縮小して静止（1.15 → 1.0）
      scene.tweens.add({
        targets: bannerText,
        scaleX: 1,
        scaleY: 1,
        duration: timing.settleMs,
        ease: 'Sine.Out',
        onComplete: () => {
          // ③ ホールド後にフェードアウトしつつ少し上へ
          scene.time.delayedCall(timing.holdMs, () => {
            scene.tweens.add({
              targets: bannerText,
              alpha: 0,
              scaleX: 1.08,
              scaleY: 1.08,
              y: bannerText.y - 24,
              duration: timing.fadeMs,
              ease: 'Sine.In',
              onComplete: () => {
                bannerText.destroy()
                onComplete()
              },
            })
          })
        },
      })
    },
  })
}

// 大きな STAGE CLEAR / AREA CLEAR 文字を tween で出す
export function playStageClearBanner(
  scene: Phaser.Scene,
  isGameClear: boolean,
  onComplete: () => void,
): void {
  const label = isGameClear ? STAGE_CLEAR_BANNER_AREA_CLEAR_LABEL : 'STAGE CLEAR!'
  playClearBanner(
    scene,
    label,
    STAGE_CLEAR_BANNER_FONT_SIZE,
    STAGE_CLEAR_BANNER_COLOR,
    onComplete,
  )
}

// 全敵撃破による早期クリア専用バナー
export function playAllEnemiesClearBanner(
  scene: Phaser.Scene,
  onComplete: () => void,
): void {
  playClearBanner(
    scene,
    'ALL ENEMIES CLEAR!',
    ALL_ENEMIES_CLEAR_BANNER_FONT_SIZE,
    ALL_ENEMIES_CLEAR_BANNER_COLOR,
    onComplete,
    {
      popMs: ALL_ENEMIES_CLEAR_BANNER_POP_MS,
      settleMs: ALL_ENEMIES_CLEAR_BANNER_SETTLE_MS,
      holdMs: ALL_ENEMIES_CLEAR_BANNER_HOLD_MS,
      fadeMs: ALL_ENEMIES_CLEAR_BANNER_FADE_MS,
    },
  )
}

/**
 * ALL ENEMIES CLEAR の実報酬を大きく表示する。
 * XP は「オールクリアボーナス + タイムボーナス ×残り秒」と合計を明示する。
 * ノーダメージ時だけ GOLD ×2 の行を追加する。
 */
export function playAllEnemiesRewardBanner(
  scene: Phaser.Scene,
  remainingSeconds: number,
  totalBonusXp: number,
  hasNoDamageGoldBonus: boolean,
  onComplete: () => void,
): void {
  // 計算と同じく、表示の残り秒は切り上げ
  const timeBonusSeconds = Math.max(0, Math.ceil(remainingSeconds))
  const formulaLine = `${CLEAR_REWARD_XP_FORMULA_LABEL} ×${timeBonusSeconds}`

  // 行の縦位置: 式 → 合計XP →（あれば）ゴールド
  let formulaY = -22
  let xpY = 18
  let goldY = 48
  if (hasNoDamageGoldBonus) {
    formulaY = -36
    xpY = 4
    goldY = 36
  }

  const formulaText = scene.add.text(0, formulaY, formulaLine, {
    fontFamily: FONT_FAMILY_UI,
    fontSize: CLEAR_REWARD_TEXT_FORMULA_FONT_SIZE,
    color: CLEAR_REWARD_TEXT_FORMULA_COLOR,
    fontStyle: 'bold',
    stroke: STAGE_CLEAR_BANNER_STROKE_COLOR,
    strokeThickness: 6,
  })
  formulaText.setOrigin(0.5)

  const xpText = scene.add.text(0, xpY, `+${totalBonusXp} XP`, {
    fontFamily: FONT_FAMILY_UI,
    fontSize: CLEAR_REWARD_TEXT_XP_FONT_SIZE,
    color: CLEAR_REWARD_TEXT_XP_COLOR,
    fontStyle: 'bold',
    stroke: STAGE_CLEAR_BANNER_STROKE_COLOR,
    strokeThickness: 7,
  })
  xpText.setOrigin(0.5)

  const contents: Phaser.GameObjects.GameObject[] = [formulaText, xpText]
  if (hasNoDamageGoldBonus) {
    const goldText = scene.add.text(0, goldY, 'NO DAMAGE  ·  GOLD ×2', {
      fontFamily: FONT_FAMILY_UI,
      fontSize: CLEAR_REWARD_TEXT_GOLD_FONT_SIZE,
      color: CLEAR_REWARD_TEXT_GOLD_COLOR,
      fontStyle: 'bold',
      stroke: STAGE_CLEAR_BANNER_STROKE_COLOR,
      strokeThickness: 6,
    })
    goldText.setOrigin(0.5)
    contents.push(goldText)
  }

  const container = scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2, contents)
  container.setDepth(STAGE_CLEAR_BANNER_DEPTH)
  container.setScale(0.45)
  container.setAlpha(0)

  scene.tweens.add({
    targets: container,
    alpha: 1,
    scaleX: 1.12,
    scaleY: 1.12,
    duration: CLEAR_REWARD_TEXT_POP_MS,
    ease: 'Back.Out',
    onComplete: () => {
      scene.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: CLEAR_REWARD_TEXT_SETTLE_MS,
        ease: 'Sine.Out',
        onComplete: () => {
          scene.time.delayedCall(CLEAR_REWARD_TEXT_HOLD_MS, () => {
            scene.tweens.add({
              targets: container,
              alpha: 0,
              y: container.y - 20,
              duration: CLEAR_REWARD_TEXT_FADE_MS,
              ease: 'Sine.In',
              onComplete: () => {
                container.destroy()
                onComplete()
              },
            })
          })
        },
      })
    },
  })
}
