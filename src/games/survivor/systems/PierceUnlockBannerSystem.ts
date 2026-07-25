// ============================================================
// PierceUnlockBannerSystem.ts
// ------------------------------------------------------------
// Move+1 かつ Speed+1 で Pierce を自動取得したとき、
// 大きなアイコン＋「PIERCE OBTAINED」を出してからプレイ再開する。
//
// レベルアップ中は scene.time.paused = true なので、
// delayedCall は使わず、再開カウントダウンと同じ tweens.chain で進める。
// ============================================================

import Phaser from 'phaser'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PIERCE_UNLOCK_BANNER_TITLE,
  PIERCE_UNLOCK_BANNER_SUBTITLE,
  PIERCE_UNLOCK_BANNER_TITLE_FONT_SIZE,
  PIERCE_UNLOCK_BANNER_SUBTITLE_FONT_SIZE,
  PIERCE_UNLOCK_BANNER_TITLE_COLOR,
  PIERCE_UNLOCK_BANNER_SUBTITLE_COLOR,
  PIERCE_UNLOCK_BANNER_STROKE_COLOR,
  PIERCE_UNLOCK_BANNER_STROKE_THICKNESS,
  PIERCE_UNLOCK_BANNER_DEPTH,
  PIERCE_UNLOCK_BANNER_POP_MS,
  PIERCE_UNLOCK_BANNER_HOLD_MS,
  PIERCE_UNLOCK_BANNER_FADE_MS,
  PIERCE_UNLOCK_ICON_SIZE,
  UNLOCK_ICON_PIERCE_COLOR,
  UNLOCK_ICON_PIERCE_LETTER,
  FONT_FAMILY_HEADING,
  FONT_FAMILY_UI,
  PIERCE_LEVEL_UP_BANNER_TITLE_PREFIX,
  PIERCE_LEVEL_UP_BANNER_SUBTITLE,
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
 * Pierce 取得の大きな通知。フェード完了後に onComplete を呼ぶ。
 */
export function playPierceUnlockBanner(
  scene: Phaser.Scene,
  onComplete: () => void,
): void {
  const centerX = GAME_WIDTH / 2
  const centerY = GAME_HEIGHT / 2 - 20

  const container = scene.add.container(centerX, centerY)
  container.setDepth(PIERCE_UNLOCK_BANNER_DEPTH)
  container.setAlpha(0)
  container.setScale(0.4)

  const iconBorder = scene.add.rectangle(
    0,
    -56,
    PIERCE_UNLOCK_ICON_SIZE + 10,
    PIERCE_UNLOCK_ICON_SIZE + 10,
    UNLOCK_ICON_PIERCE_COLOR,
  )
  iconBorder.setStrokeStyle(4, 0xffffff, 1)

  const iconFill = scene.add.rectangle(
    0,
    -56,
    PIERCE_UNLOCK_ICON_SIZE,
    PIERCE_UNLOCK_ICON_SIZE,
    0x0f172a,
  )

  const iconLetter = scene.add.text(0, -56, UNLOCK_ICON_PIERCE_LETTER, {
    fontFamily: FONT_FAMILY_HEADING,
    fontSize: '40px',
    color: '#7dd3fc',
  })
  iconLetter.setOrigin(0.5)

  const titleText = scene.add.text(0, 12, PIERCE_UNLOCK_BANNER_TITLE, {
    fontFamily: FONT_FAMILY_HEADING,
    fontSize: PIERCE_UNLOCK_BANNER_TITLE_FONT_SIZE,
    color: PIERCE_UNLOCK_BANNER_TITLE_COLOR,
    stroke: PIERCE_UNLOCK_BANNER_STROKE_COLOR,
    strokeThickness: PIERCE_UNLOCK_BANNER_STROKE_THICKNESS,
  })
  titleText.setOrigin(0.5)
  shrinkTextToFitWidth(titleText, GAME_WIDTH - 48)

  const subtitleText = scene.add.text(0, 58, PIERCE_UNLOCK_BANNER_SUBTITLE, {
    fontFamily: FONT_FAMILY_UI,
    fontSize: PIERCE_UNLOCK_BANNER_SUBTITLE_FONT_SIZE,
    color: PIERCE_UNLOCK_BANNER_SUBTITLE_COLOR,
    stroke: PIERCE_UNLOCK_BANNER_STROKE_COLOR,
    strokeThickness: 4,
  })
  subtitleText.setOrigin(0.5)
  shrinkTextToFitWidth(subtitleText, GAME_WIDTH - 48)

  container.add([iconBorder, iconFill, iconLetter, titleText, subtitleText])

  // StartCountdown と同じ: time.paused 中でも進む tween 連鎖
  scene.tweens.chain({
    tweens: [
      {
        targets: container,
        alpha: 1,
        scale: 1,
        duration: PIERCE_UNLOCK_BANNER_POP_MS,
        ease: 'Back.Out',
      },
      {
        targets: container,
        alpha: 0,
        scale: 1.08,
        duration: PIERCE_UNLOCK_BANNER_FADE_MS,
        delay: PIERCE_UNLOCK_BANNER_HOLD_MS,
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
 * Pierce レベル上昇の控えめな通知（例: PIERCE Lv.3）。
 */
export function playPierceLevelUpBanner(
  scene: Phaser.Scene,
  pierceLevel: number,
  onComplete: () => void,
): void {
  const centerX = GAME_WIDTH / 2
  const centerY = GAME_HEIGHT / 2 - 36
  const safeLevel = Math.max(1, Math.floor(pierceLevel))

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
    UNLOCK_ICON_PIERCE_COLOR,
  )
  iconBorder.setStrokeStyle(2, 0xffffff, 0.7)

  const iconFill = scene.add.rectangle(0, -36, iconSize, iconSize, 0x0f172a)

  const iconLetter = scene.add.text(0, -36, UNLOCK_ICON_PIERCE_LETTER, {
    fontFamily: FONT_FAMILY_HEADING,
    fontSize: '22px',
    color: '#7dd3fc',
  })
  iconLetter.setOrigin(0.5)

  const titleText = scene.add.text(
    0,
    8,
    `${PIERCE_LEVEL_UP_BANNER_TITLE_PREFIX}${safeLevel}`,
    {
      fontFamily: FONT_FAMILY_HEADING,
      fontSize: SKILL_LEVEL_UP_BANNER_TITLE_FONT_SIZE,
      color: PIERCE_UNLOCK_BANNER_TITLE_COLOR,
      stroke: PIERCE_UNLOCK_BANNER_STROKE_COLOR,
      strokeThickness: SKILL_LEVEL_UP_BANNER_STROKE_THICKNESS,
    },
  )
  titleText.setOrigin(0.5)
  shrinkTextToFitWidth(titleText, GAME_WIDTH - 48)

  const subtitleText = scene.add.text(0, 38, PIERCE_LEVEL_UP_BANNER_SUBTITLE, {
    fontFamily: FONT_FAMILY_UI,
    fontSize: SKILL_LEVEL_UP_BANNER_SUBTITLE_FONT_SIZE,
    color: PIERCE_UNLOCK_BANNER_SUBTITLE_COLOR,
    stroke: PIERCE_UNLOCK_BANNER_STROKE_COLOR,
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
