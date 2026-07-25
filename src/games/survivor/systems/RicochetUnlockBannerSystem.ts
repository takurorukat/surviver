// ============================================================
// RicochetUnlockBannerSystem.ts
// ------------------------------------------------------------
// Pickup+1 かつ Power+1 かつ Speed+1 で Ricochet を自動取得したとき、
// 大きなアイコン＋「RICOCHET OBTAINED」を出してからプレイ再開する。
// ============================================================

import Phaser from 'phaser'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  RICOCHET_UNLOCK_BANNER_TITLE,
  RICOCHET_UNLOCK_BANNER_SUBTITLE,
  RICOCHET_UNLOCK_BANNER_TITLE_FONT_SIZE,
  RICOCHET_UNLOCK_BANNER_SUBTITLE_FONT_SIZE,
  RICOCHET_UNLOCK_BANNER_TITLE_COLOR,
  RICOCHET_UNLOCK_BANNER_SUBTITLE_COLOR,
  RICOCHET_UNLOCK_BANNER_STROKE_COLOR,
  RICOCHET_UNLOCK_BANNER_STROKE_THICKNESS,
  RICOCHET_UNLOCK_BANNER_DEPTH,
  RICOCHET_UNLOCK_BANNER_POP_MS,
  RICOCHET_UNLOCK_BANNER_HOLD_MS,
  RICOCHET_UNLOCK_BANNER_FADE_MS,
  RICOCHET_UNLOCK_ICON_SIZE,
  UNLOCK_ICON_RICOCHET_COLOR,
  UNLOCK_ICON_RICOCHET_LETTER,
  FONT_FAMILY_HEADING,
  FONT_FAMILY_UI,
  RICOCHET_LEVEL_UP_BANNER_TITLE_PREFIX,
  RICOCHET_LEVEL_UP_BANNER_SUBTITLE,
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
 * Ricochet 取得の大きな通知。フェード完了後に onComplete を呼ぶ。
 */
export function playRicochetUnlockBanner(
  scene: Phaser.Scene,
  onComplete: () => void,
  ricochetLevel: number = 0,
): void {
  const centerX = GAME_WIDTH / 2
  const centerY = GAME_HEIGHT / 2 - 20

  const container = scene.add.container(centerX, centerY)
  container.setDepth(RICOCHET_UNLOCK_BANNER_DEPTH)
  container.setAlpha(0)
  container.setScale(0.4)

  const iconBorder = scene.add.rectangle(
    0,
    -56,
    RICOCHET_UNLOCK_ICON_SIZE + 10,
    RICOCHET_UNLOCK_ICON_SIZE + 10,
    UNLOCK_ICON_RICOCHET_COLOR,
  )
  iconBorder.setStrokeStyle(4, 0xffffff, 1)

  const iconFill = scene.add.rectangle(
    0,
    -56,
    RICOCHET_UNLOCK_ICON_SIZE,
    RICOCHET_UNLOCK_ICON_SIZE,
    0x0f172a,
  )

  const iconLetter = scene.add.text(0, -56, UNLOCK_ICON_RICOCHET_LETTER, {
    fontFamily: FONT_FAMILY_HEADING,
    fontSize: '40px',
    color: '#e9d5ff',
  })
  iconLetter.setOrigin(0.5)

  const titleText = scene.add.text(0, 12, RICOCHET_UNLOCK_BANNER_TITLE, {
    fontFamily: FONT_FAMILY_HEADING,
    fontSize: RICOCHET_UNLOCK_BANNER_TITLE_FONT_SIZE,
    color: RICOCHET_UNLOCK_BANNER_TITLE_COLOR,
    stroke: RICOCHET_UNLOCK_BANNER_STROKE_COLOR,
    strokeThickness: RICOCHET_UNLOCK_BANNER_STROKE_THICKNESS,
  })
  titleText.setOrigin(0.5)
  shrinkTextToFitWidth(titleText, GAME_WIDTH - 48)

  let subtitle = RICOCHET_UNLOCK_BANNER_SUBTITLE
  if (ricochetLevel > 0) {
    subtitle = `Level ${Math.floor(ricochetLevel)}  ·  ${RICOCHET_UNLOCK_BANNER_SUBTITLE}`
  }
  const subtitleText = scene.add.text(0, 58, subtitle, {
    fontFamily: FONT_FAMILY_UI,
    fontSize: RICOCHET_UNLOCK_BANNER_SUBTITLE_FONT_SIZE,
    color: RICOCHET_UNLOCK_BANNER_SUBTITLE_COLOR,
    stroke: RICOCHET_UNLOCK_BANNER_STROKE_COLOR,
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
        duration: RICOCHET_UNLOCK_BANNER_POP_MS,
        ease: 'Back.Out',
      },
      {
        targets: container,
        alpha: 0,
        scale: 1.08,
        duration: RICOCHET_UNLOCK_BANNER_FADE_MS,
        delay: RICOCHET_UNLOCK_BANNER_HOLD_MS,
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
 * Ricochet レベル上昇の控えめな通知（例: RICOCHET Lv.2）。
 */
export function playRicochetLevelUpBanner(
  scene: Phaser.Scene,
  ricochetLevel: number,
  onComplete: () => void,
): void {
  const centerX = GAME_WIDTH / 2
  const centerY = GAME_HEIGHT / 2 - 36
  const safeLevel = Math.max(1, Math.floor(ricochetLevel))

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
    UNLOCK_ICON_RICOCHET_COLOR,
  )
  iconBorder.setStrokeStyle(2, 0xffffff, 0.7)

  const iconFill = scene.add.rectangle(0, -36, iconSize, iconSize, 0x0f172a)

  const iconLetter = scene.add.text(0, -36, UNLOCK_ICON_RICOCHET_LETTER, {
    fontFamily: FONT_FAMILY_HEADING,
    fontSize: '22px',
    color: '#e9d5ff',
  })
  iconLetter.setOrigin(0.5)

  const titleText = scene.add.text(
    0,
    8,
    `${RICOCHET_LEVEL_UP_BANNER_TITLE_PREFIX}${safeLevel}`,
    {
      fontFamily: FONT_FAMILY_HEADING,
      fontSize: SKILL_LEVEL_UP_BANNER_TITLE_FONT_SIZE,
      color: RICOCHET_UNLOCK_BANNER_TITLE_COLOR,
      stroke: RICOCHET_UNLOCK_BANNER_STROKE_COLOR,
      strokeThickness: SKILL_LEVEL_UP_BANNER_STROKE_THICKNESS,
    },
  )
  titleText.setOrigin(0.5)
  shrinkTextToFitWidth(titleText, GAME_WIDTH - 48)

  const subtitleText = scene.add.text(0, 38, RICOCHET_LEVEL_UP_BANNER_SUBTITLE, {
    fontFamily: FONT_FAMILY_UI,
    fontSize: SKILL_LEVEL_UP_BANNER_SUBTITLE_FONT_SIZE,
    color: RICOCHET_UNLOCK_BANNER_SUBTITLE_COLOR,
    stroke: RICOCHET_UNLOCK_BANNER_STROKE_COLOR,
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
