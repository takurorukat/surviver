// ============================================================
// OrbitingOrbUnlockBannerSystem.ts
// ------------------------------------------------------------
// Move + Pickup で Orbiting Orb を自動取得したとき、
// 大きなアイコン＋「ORBIT GET!」を出してからプレイ再開する。
// ============================================================

import Phaser from 'phaser'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  ORBITING_ORB_UNLOCK_BANNER_TITLE,
  ORBITING_ORB_UNLOCK_BANNER_SUBTITLE,
  ORBITING_ORB_UNLOCK_BANNER_TITLE_FONT_SIZE,
  ORBITING_ORB_UNLOCK_BANNER_SUBTITLE_FONT_SIZE,
  ORBITING_ORB_UNLOCK_BANNER_TITLE_COLOR,
  ORBITING_ORB_UNLOCK_BANNER_SUBTITLE_COLOR,
  ORBITING_ORB_UNLOCK_BANNER_STROKE_COLOR,
  ORBITING_ORB_UNLOCK_BANNER_STROKE_THICKNESS,
  ORBITING_ORB_UNLOCK_BANNER_DEPTH,
  ORBITING_ORB_UNLOCK_BANNER_POP_MS,
  ORBITING_ORB_UNLOCK_BANNER_HOLD_MS,
  ORBITING_ORB_UNLOCK_BANNER_FADE_MS,
  FONT_FAMILY_HEADING,
  FONT_FAMILY_UI,
  ORBITING_ORB_LEVEL_UP_BANNER_TITLE_PREFIX,
  ORBITING_ORB_LEVEL_UP_BANNER_SUBTITLE,
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
 * Orbiting Orb 取得の大きな通知。フェード完了後に onComplete を呼ぶ。
 */
export function playOrbitingOrbUnlockBanner(
  scene: Phaser.Scene,
  onComplete: () => void,
  orbitingOrbLevel: number = 0,
): void {
  const centerX = GAME_WIDTH / 2
  const centerY = GAME_HEIGHT / 2 - 20

  const container = scene.add.container(centerX, centerY)
  container.setDepth(ORBITING_ORB_UNLOCK_BANNER_DEPTH)
  container.setAlpha(0)
  container.setScale(0.4)

  const icon = createSkillIcon(
    scene,
    'orbitingOrb',
    UNLOCK_BANNER_SKILL_ICON_SCALE,
  )
  icon.container.setPosition(0, -56)
  icon.border.setStrokeStyle(4, 0xffffff, 1)

  const titleText = scene.add.text(0, 12, ORBITING_ORB_UNLOCK_BANNER_TITLE, {
    fontFamily: FONT_FAMILY_HEADING,
    fontSize: ORBITING_ORB_UNLOCK_BANNER_TITLE_FONT_SIZE,
    color: ORBITING_ORB_UNLOCK_BANNER_TITLE_COLOR,
    stroke: ORBITING_ORB_UNLOCK_BANNER_STROKE_COLOR,
    strokeThickness: ORBITING_ORB_UNLOCK_BANNER_STROKE_THICKNESS,
  })
  titleText.setOrigin(0.5)
  shrinkTextToFitWidth(titleText, GAME_WIDTH - 48)

  let subtitle = ORBITING_ORB_UNLOCK_BANNER_SUBTITLE
  if (orbitingOrbLevel > 0) {
    subtitle = `Level ${Math.floor(orbitingOrbLevel)}  ·  ${ORBITING_ORB_UNLOCK_BANNER_SUBTITLE}`
  }
  const subtitleText = scene.add.text(0, 58, subtitle, {
    fontFamily: FONT_FAMILY_UI,
    fontSize: ORBITING_ORB_UNLOCK_BANNER_SUBTITLE_FONT_SIZE,
    color: ORBITING_ORB_UNLOCK_BANNER_SUBTITLE_COLOR,
    stroke: ORBITING_ORB_UNLOCK_BANNER_STROKE_COLOR,
    strokeThickness: 4,
  })
  subtitleText.setOrigin(0.5)

  container.add([icon.container, titleText, subtitleText])

  scene.tweens.chain({
    targets: container,
    tweens: [
      {
        alpha: 1,
        scale: 1,
        duration: ORBITING_ORB_UNLOCK_BANNER_POP_MS,
        ease: 'Back.easeOut',
      },
      {
        alpha: 0,
        scale: 1.05,
        duration: ORBITING_ORB_UNLOCK_BANNER_FADE_MS,
        delay: ORBITING_ORB_UNLOCK_BANNER_HOLD_MS,
        ease: 'Quad.easeIn',
      },
    ],
    onComplete: () => {
      container.destroy(true)
      onComplete()
    },
  })
}

/**
 * Orbiting Orb レベル上昇の控えめな通知。
 */
export function playOrbitingOrbLevelUpBanner(
  scene: Phaser.Scene,
  orbitingOrbLevel: number,
  onComplete: () => void,
): void {
  const centerX = GAME_WIDTH / 2
  const centerY = GAME_HEIGHT / 2 - 36
  const safeLevel = Math.max(1, Math.floor(orbitingOrbLevel))

  const container = scene.add.container(centerX, centerY)
  container.setDepth(SKILL_LEVEL_UP_BANNER_DEPTH)
  container.setAlpha(0)
  container.setScale(0.85)

  const icon = createSkillIcon(
    scene,
    'orbitingOrb',
    LEVEL_UP_BANNER_SKILL_ICON_SCALE,
  )
  icon.container.setPosition(0, -36)
  icon.border.setStrokeStyle(2, 0xffffff, 0.7)

  const titleText = scene.add.text(
    0,
    8,
    `${ORBITING_ORB_LEVEL_UP_BANNER_TITLE_PREFIX}${safeLevel}`,
    {
      fontFamily: FONT_FAMILY_HEADING,
      fontSize: SKILL_LEVEL_UP_BANNER_TITLE_FONT_SIZE,
      color: ORBITING_ORB_UNLOCK_BANNER_TITLE_COLOR,
      stroke: ORBITING_ORB_UNLOCK_BANNER_STROKE_COLOR,
      strokeThickness: SKILL_LEVEL_UP_BANNER_STROKE_THICKNESS,
    },
  )
  titleText.setOrigin(0.5)

  const subtitleText = scene.add.text(0, 38, ORBITING_ORB_LEVEL_UP_BANNER_SUBTITLE, {
    fontFamily: FONT_FAMILY_UI,
    fontSize: SKILL_LEVEL_UP_BANNER_SUBTITLE_FONT_SIZE,
    color: ORBITING_ORB_UNLOCK_BANNER_SUBTITLE_COLOR,
    stroke: ORBITING_ORB_UNLOCK_BANNER_STROKE_COLOR,
    strokeThickness: 3,
  })
  subtitleText.setOrigin(0.5)

  container.add([icon.container, titleText, subtitleText])

  scene.tweens.chain({
    targets: container,
    tweens: [
      {
        alpha: 1,
        scale: 1,
        duration: SKILL_LEVEL_UP_BANNER_POP_MS,
        ease: 'Back.easeOut',
      },
      {
        alpha: 0,
        duration: SKILL_LEVEL_UP_BANNER_FADE_MS,
        delay: SKILL_LEVEL_UP_BANNER_HOLD_MS,
        ease: 'Quad.easeIn',
      },
    ],
    onComplete: () => {
      container.destroy(true)
      onComplete()
    },
  })
}
