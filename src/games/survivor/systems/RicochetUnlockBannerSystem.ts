// ============================================================
// RicochetUnlockBannerSystem.ts
// ------------------------------------------------------------
// XP Bonus + Pickup + Speed で Ricochet を自動取得したとき、
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
  SKILL_LEVEL_UP_BANNER_STROKE_THICKNESS,
  UNLOCK_BANNER_SKILL_ICON_SCALE,
  LEVEL_UP_BANNER_SKILL_ICON_SCALE,
} from '../GameConstants'
import { shrinkTextToFitWidth } from '../utils/fitTextToWidth'
import { createSkillIcon } from '../ui/SkillIcon'

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

  const icon = createSkillIcon(
    scene,
    'ricochet',
    UNLOCK_BANNER_SKILL_ICON_SCALE,
  )
  icon.container.setPosition(0, -56)
  icon.border.setStrokeStyle(4, 0xffffff, 1)

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

  container.add([icon.container, titleText, subtitleText])

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

  const icon = createSkillIcon(
    scene,
    'ricochet',
    LEVEL_UP_BANNER_SKILL_ICON_SCALE,
  )
  icon.container.setPosition(0, -36)
  icon.border.setStrokeStyle(2, 0xffffff, 0.7)

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
