// ============================================================
// BlastUnlockBannerSystem.ts
// ------------------------------------------------------------
// Power+1 かつ Range+1 で Blast を自動取得したとき、
// 大きなアイコン＋「BLAST OBTAINED」を出してからプレイ再開する。
//
// レベルアップ中は scene.time.paused = true なので、
// delayedCall は使わず、再開カウントダウンと同じ tweens.chain で進む。
// ============================================================

import Phaser from 'phaser'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  BLAST_UNLOCK_BANNER_TITLE,
  BLAST_UNLOCK_BANNER_SUBTITLE,
  BLAST_UNLOCK_BANNER_TITLE_FONT_SIZE,
  BLAST_UNLOCK_BANNER_SUBTITLE_FONT_SIZE,
  BLAST_UNLOCK_BANNER_TITLE_COLOR,
  BLAST_UNLOCK_BANNER_SUBTITLE_COLOR,
  BLAST_UNLOCK_BANNER_STROKE_COLOR,
  BLAST_UNLOCK_BANNER_STROKE_THICKNESS,
  BLAST_UNLOCK_BANNER_DEPTH,
  BLAST_UNLOCK_BANNER_POP_MS,
  BLAST_UNLOCK_BANNER_HOLD_MS,
  BLAST_UNLOCK_BANNER_FADE_MS,
  FONT_FAMILY_HEADING,
  FONT_FAMILY_UI,
  BLAST_LEVEL_UP_BANNER_TITLE_PREFIX,
  BLAST_LEVEL_UP_BANNER_SUBTITLE,
  SKILL_LEVEL_UP_BANNER_TITLE_FONT_SIZE,
  SKILL_LEVEL_UP_BANNER_SUBTITLE_FONT_SIZE,
  SKILL_LEVEL_UP_BANNER_DEPTH,
  SKILL_LEVEL_UP_BANNER_POP_MS,
  SKILL_LEVEL_UP_BANNER_HOLD_MS,
  SKILL_LEVEL_UP_BANNER_FADE_MS,
  SKILL_LEVEL_UP_BANNER_STROKE_THICKNESS,
  UNLOCK_BANNER_SKILL_ICON_SCALE,
  LEVEL_UP_BANNER_SKILL_ICON_SCALE,
} from '../GameConstants'
import { shrinkTextToFitWidth } from '../utils/fitTextToWidth'
import { createSkillIcon } from '../ui/SkillIcon'

/**
 * Blast 取得の大きな通知。フェード完了後に onComplete を呼ぶ。
 */
export function playBlastUnlockBanner(
  scene: Phaser.Scene,
  onComplete: () => void,
  blastLevel: number = 0,
): void {
  const centerX = GAME_WIDTH / 2
  const centerY = GAME_HEIGHT / 2 - 20

  const container = scene.add.container(centerX, centerY)
  container.setDepth(BLAST_UNLOCK_BANNER_DEPTH)
  container.setAlpha(0)
  container.setScale(0.4)

  const icon = createSkillIcon(
    scene,
    'blast',
    UNLOCK_BANNER_SKILL_ICON_SCALE,
  )
  icon.container.setPosition(0, -56)
  icon.border.setStrokeStyle(4, 0xffffff, 1)

  const titleText = scene.add.text(0, 12, BLAST_UNLOCK_BANNER_TITLE, {
    fontFamily: FONT_FAMILY_HEADING,
    fontSize: BLAST_UNLOCK_BANNER_TITLE_FONT_SIZE,
    color: BLAST_UNLOCK_BANNER_TITLE_COLOR,
    stroke: BLAST_UNLOCK_BANNER_STROKE_COLOR,
    strokeThickness: BLAST_UNLOCK_BANNER_STROKE_THICKNESS,
  })
  titleText.setOrigin(0.5)
  shrinkTextToFitWidth(titleText, GAME_WIDTH - 80)

  const subtitle =
    blastLevel > 0
      ? `Level ${Math.floor(blastLevel)}  ·  ${BLAST_UNLOCK_BANNER_SUBTITLE}`
      : BLAST_UNLOCK_BANNER_SUBTITLE
  const subtitleText = scene.add.text(0, 58, subtitle, {
    fontFamily: FONT_FAMILY_UI,
    fontSize: BLAST_UNLOCK_BANNER_SUBTITLE_FONT_SIZE,
    color: BLAST_UNLOCK_BANNER_SUBTITLE_COLOR,
    stroke: BLAST_UNLOCK_BANNER_STROKE_COLOR,
    strokeThickness: 4,
  })
  subtitleText.setOrigin(0.5)
  shrinkTextToFitWidth(subtitleText, GAME_WIDTH - 48)

  container.add([icon.container, titleText, subtitleText])

  scene.tweens.chain({
    tweens: [
      {
        targets: container,
        alpha: 1,
        scale: 1,
        duration: BLAST_UNLOCK_BANNER_POP_MS,
        ease: 'Back.Out',
      },
      {
        targets: container,
        alpha: 0,
        scale: 1.08,
        duration: BLAST_UNLOCK_BANNER_FADE_MS,
        delay: BLAST_UNLOCK_BANNER_HOLD_MS,
        ease: 'Sine.In',
      },
    ],
    onComplete: () => {
      container.destroy(true)
      onComplete()
    },
  })
}

/**
 * Blast レベル上昇の控えめな通知（例: BLAST Lv.2）。
 * 初回 OBTAINED より小さく・短く出す。
 */
export function playBlastLevelUpBanner(
  scene: Phaser.Scene,
  blastLevel: number,
  onComplete: () => void,
): void {
  const centerX = GAME_WIDTH / 2
  const centerY = GAME_HEIGHT / 2 - 36
  const safeLevel = Math.max(1, Math.floor(blastLevel))

  const container = scene.add.container(centerX, centerY)
  container.setDepth(SKILL_LEVEL_UP_BANNER_DEPTH)
  container.setAlpha(0)
  container.setScale(0.85)

  const icon = createSkillIcon(
    scene,
    'blast',
    LEVEL_UP_BANNER_SKILL_ICON_SCALE,
  )
  icon.container.setPosition(0, -36)
  icon.border.setStrokeStyle(2, 0xffffff, 0.7)

  const titleText = scene.add.text(
    0,
    8,
    `${BLAST_LEVEL_UP_BANNER_TITLE_PREFIX}${safeLevel}`,
    {
      fontFamily: FONT_FAMILY_HEADING,
      fontSize: SKILL_LEVEL_UP_BANNER_TITLE_FONT_SIZE,
      color: BLAST_UNLOCK_BANNER_TITLE_COLOR,
      stroke: BLAST_UNLOCK_BANNER_STROKE_COLOR,
      strokeThickness: SKILL_LEVEL_UP_BANNER_STROKE_THICKNESS,
    },
  )
  titleText.setOrigin(0.5)
  shrinkTextToFitWidth(titleText, GAME_WIDTH - 48)

  const subtitleText = scene.add.text(0, 38, BLAST_LEVEL_UP_BANNER_SUBTITLE, {
    fontFamily: FONT_FAMILY_UI,
    fontSize: SKILL_LEVEL_UP_BANNER_SUBTITLE_FONT_SIZE,
    color: BLAST_UNLOCK_BANNER_SUBTITLE_COLOR,
    stroke: BLAST_UNLOCK_BANNER_STROKE_COLOR,
    strokeThickness: 3,
  })
  subtitleText.setOrigin(0.5)
  shrinkTextToFitWidth(subtitleText, GAME_WIDTH - 48)

  container.add([icon.border, icon.fill, icon.symbol, titleText, subtitleText])

  scene.tweens.chain({
    tweens: [
      {
        targets: container,
        alpha: 1,
        scale: 1,
        duration: SKILL_LEVEL_UP_BANNER_POP_MS,
        ease: 'Sine.Out',
      },
      {
        targets: container,
        alpha: 0,
        scale: 1.03,
        duration: SKILL_LEVEL_UP_BANNER_FADE_MS,
        delay: SKILL_LEVEL_UP_BANNER_HOLD_MS,
        ease: 'Sine.In',
      },
    ],
    onComplete: () => {
      container.destroy(true)
      onComplete()
    },
  })
}
