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
  BLAST_UNLOCK_ICON_SIZE,
  UNLOCK_ICON_BLAST_COLOR,
  UNLOCK_ICON_BLAST_LETTER,
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
  SKILL_LEVEL_UP_BANNER_ICON_SIZE,
  SKILL_LEVEL_UP_BANNER_STROKE_THICKNESS,
} from '../GameConstants'
import { shrinkTextToFitWidth } from '../utils/fitTextToWidth'

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

  const iconBorder = scene.add.rectangle(
    0,
    -56,
    BLAST_UNLOCK_ICON_SIZE + 10,
    BLAST_UNLOCK_ICON_SIZE + 10,
    UNLOCK_ICON_BLAST_COLOR,
  )
  iconBorder.setStrokeStyle(4, 0xffffff, 1)

  const iconFill = scene.add.rectangle(
    0,
    -56,
    BLAST_UNLOCK_ICON_SIZE,
    BLAST_UNLOCK_ICON_SIZE,
    0x0f172a,
  )

  const iconLetter = scene.add.text(0, -56, UNLOCK_ICON_BLAST_LETTER, {
    fontFamily: FONT_FAMILY_HEADING,
    fontSize: '40px',
    color: '#fbbf24',
  })
  iconLetter.setOrigin(0.5)

  const titleText = scene.add.text(0, 12, BLAST_UNLOCK_BANNER_TITLE, {
    fontFamily: FONT_FAMILY_HEADING,
    fontSize: BLAST_UNLOCK_BANNER_TITLE_FONT_SIZE,
    color: BLAST_UNLOCK_BANNER_TITLE_COLOR,
    stroke: BLAST_UNLOCK_BANNER_STROKE_COLOR,
    strokeThickness: BLAST_UNLOCK_BANNER_STROKE_THICKNESS,
  })
  titleText.setOrigin(0.5)
  shrinkTextToFitWidth(titleText, GAME_WIDTH - 48)

  let subtitle = BLAST_UNLOCK_BANNER_SUBTITLE
  if (blastLevel > 0) {
    subtitle = `Level ${Math.floor(blastLevel)}  ·  ${BLAST_UNLOCK_BANNER_SUBTITLE}`
  }
  const subtitleText = scene.add.text(0, 58, subtitle, {
    fontFamily: FONT_FAMILY_UI,
    fontSize: BLAST_UNLOCK_BANNER_SUBTITLE_FONT_SIZE,
    color: BLAST_UNLOCK_BANNER_SUBTITLE_COLOR,
    stroke: BLAST_UNLOCK_BANNER_STROKE_COLOR,
    strokeThickness: 4,
  })
  subtitleText.setOrigin(0.5)
  shrinkTextToFitWidth(subtitleText, GAME_WIDTH - 48)

  container.add([iconBorder, iconFill, iconLetter, titleText, subtitleText])

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

  const iconSize = SKILL_LEVEL_UP_BANNER_ICON_SIZE
  const iconBorder = scene.add.rectangle(
    0,
    -36,
    iconSize + 6,
    iconSize + 6,
    UNLOCK_ICON_BLAST_COLOR,
  )
  iconBorder.setStrokeStyle(2, 0xffffff, 0.7)

  const iconFill = scene.add.rectangle(0, -36, iconSize, iconSize, 0x0f172a)

  const iconLetter = scene.add.text(0, -36, UNLOCK_ICON_BLAST_LETTER, {
    fontFamily: FONT_FAMILY_HEADING,
    fontSize: '22px',
    color: '#fbbf24',
  })
  iconLetter.setOrigin(0.5)

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

  container.add([iconBorder, iconFill, iconLetter, titleText, subtitleText])

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
