// ============================================================
// AchievementsPanelSystem.ts
// ------------------------------------------------------------
// 実績画面（SPACE / クリックで開く全画面表示・不透明）。
// 解放内容・トライ回数・撃破数などの生涯統計を表示する。
// レイアウトは上からブロックを積み上げ、次のブロック開始 Y を返す方式。
// ============================================================

import Phaser from 'phaser'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  SKILL_TREE_ICON_SCALE,
  SKILL_TREE_ICON_OUTER_SIZE,
  UNLOCK_ICON_LOCKED_FILL_COLOR,
  UNLOCK_ICON_LOCKED_BORDER_COLOR,
  UNLOCK_ICON_LOCKED_LETTER_COLOR,
  UNLOCK_SKILL_DESC_PIERCE,
  UNLOCK_SKILL_DESC_BLAST,
  UNLOCK_SKILL_DESC_ORBITING_ORB,
  UNLOCK_SKILL_DESC_RICOCHET,
  UNLOCK_SKILL_DESC_MOVE,
  UNLOCK_SKILL_DESC_MAGNET,
  UNLOCK_SKILL_DESC_XP_BONUS,
  TITLE_LOCK_ICON_SIZE,
  TITLE_LOCK_ICON_COLOR,
  FONT_FAMILY_HEADING,
  FONT_FAMILY_UI,
  isSkillIconId,
} from '../GameConstants'
import { shrinkTextToFitWidth, fitTextInBounds } from '../utils/fitTextToWidth'
import { ALL_ACHIEVEMENTS, type UnlockableSkillId } from './AchievementSystem'
import {
  getLifetimeStats,
  hasUnlockedAchievement,
  type LifetimeStats,
} from './UnlockSaveSystem'
import { createLockIcon, setLockIconVisible } from '../ui/LockIcon'
import { createSkillIcon } from '../ui/SkillIcon'

// バトルHUD（depth 200 前後）より確実に手前に出す
const PANEL_DEPTH = 440
const SCREEN_PAD = 32
// 全画面背景の内側に描く囲み枠
const PANEL_FRAME_INSET = 10
const PANEL_FRAME_BORDER_COLOR = 0x475569
const PANEL_FRAME_BORDER_WIDTH = 2

// --- 縦レイアウト（ブロック単位。次のブロックは必ず前の下端＋隙間から始まる）---
const BLOCK_GAP = 16
const HEADER_BLOCK_HEIGHT = 28
const SECTION_TITLE_HEIGHT = 22
const STATS_LINE_HEIGHT = 22
const SKILL_ROW_HEIGHT = 72
const SKILL_ROW_GAP = 8
const FOOTER_RESERVED_HEIGHT = 36
const ACHIEVEMENT_COLUMN_COUNT = 2

const SKILL_EFFECT_DESCS: Record<UnlockableSkillId, string> = {
  pierce: UNLOCK_SKILL_DESC_PIERCE,
  blast: UNLOCK_SKILL_DESC_BLAST,
  orbitingOrb: UNLOCK_SKILL_DESC_ORBITING_ORB,
  ricochet: UNLOCK_SKILL_DESC_RICOCHET,
  move: UNLOCK_SKILL_DESC_MOVE,
  magnet: UNLOCK_SKILL_DESC_MAGNET,
  xpBonus: UNLOCK_SKILL_DESC_XP_BONUS,
}

export type AchievementsPanelController = {
  open: () => void
  close: () => void
  toggle: () => void
  isOpen: () => boolean
}

type AchievementsPanelCallbacks = {
  onOpen?: () => void
  onClose?: () => void
}

/**
 * 実績画面の開閉コントローラを作る。
 * TopBar の実績ボタンから使う。
 */
export function createAchievementsPanelController(
  scene: Phaser.Scene,
  callbacks: AchievementsPanelCallbacks = {},
): AchievementsPanelController {
  let screenObjects: Phaser.GameObjects.GameObject[] = []
  let isOpenFlag = false

  const destroyScreen = (): void => {
    for (let index = 0; index < screenObjects.length; index++) {
      screenObjects[index].destroy()
    }
    screenObjects = []
  }

  // 全画面の不透明背景と閉じるボタン
  const buildBackground = (): void => {
    const background = scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x0f172a,
      1,
    )
    background.setScrollFactor(0)
    background.setDepth(PANEL_DEPTH)
    background.setInteractive()
    screenObjects.push(background)

    // パネルの範囲が分かるように、内側に囲み枠を描く
    const frame = scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH - PANEL_FRAME_INSET * 2,
      GAME_HEIGHT - PANEL_FRAME_INSET * 2,
      0x000000,
      0,
    )
    frame.setStrokeStyle(PANEL_FRAME_BORDER_WIDTH, PANEL_FRAME_BORDER_COLOR)
    frame.setScrollFactor(0)
    frame.setDepth(PANEL_DEPTH)
    screenObjects.push(frame)

    const closeText = scene.add.text(
      GAME_WIDTH - SCREEN_PAD,
      SCREEN_PAD + HEADER_BLOCK_HEIGHT / 2,
      '✕ Close',
      {
        fontFamily: FONT_FAMILY_UI,
        fontSize: '16px',
        color: '#e2e8f0',
        fontStyle: 'bold',
      },
    )
    closeText.setOrigin(1, 0.5)
    closeText.setScrollFactor(0)
    closeText.setDepth(PANEL_DEPTH + 1)
    closeText.setInteractive({ useHandCursor: true })
    closeText.on('pointerover', () => {
      closeText.setColor('#fca5a5')
    })
    closeText.on('pointerout', () => {
      closeText.setColor('#e2e8f0')
    })
    closeText.on('pointerdown', () => {
      close()
    })
    screenObjects.push(closeText)
  }

  /**
   * ブロック1: 画面タイトル。
   * 戻り値 = このブロック下端の Y（次ブロックはここ＋隙間から）
   */
  const buildTitleBlock = (topY: number): number => {
    const centerY = topY + HEADER_BLOCK_HEIGHT / 2
    const header = scene.add.text(GAME_WIDTH / 2, centerY, 'Achievements', {
      fontFamily: FONT_FAMILY_HEADING,
      fontSize: '20px',
      color: '#86efac',
    })
    header.setOrigin(0.5)
    header.setScrollFactor(0)
    header.setDepth(PANEL_DEPTH + 1)
    screenObjects.push(header)
    return topY + HEADER_BLOCK_HEIGHT
  }

  /**
   * ブロック2: Lifetime Stats（見出し＋1行の統計）。
   * 戻り値 = このブロック下端の Y
   */
  const buildStatsBlock = (topY: number, stats: LifetimeStats): number => {
    let cursorY = topY

    const statsTitle = scene.add.text(SCREEN_PAD, cursorY, 'Lifetime Stats', {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '15px',
      color: '#fde68a',
      fontStyle: 'bold',
    })
    statsTitle.setOrigin(0, 0)
    statsTitle.setScrollFactor(0)
    statsTitle.setDepth(PANEL_DEPTH + 1)
    screenObjects.push(statsTitle)
    cursorY = cursorY + SECTION_TITLE_HEIGHT

    const statsItems = [
      `Tries: ${stats.runStarts}`,
      `Enemies Defeated: ${stats.enemiesDefeated}`,
      `Deaths: ${stats.deaths}`,
      `Stages Cleared: ${stats.stagesCleared}`,
      `Game Clears: ${stats.gameClears}`,
    ]
    const statsText = scene.add.text(SCREEN_PAD, cursorY, statsItems.join('    '), {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '14px',
      color: '#e2e8f0',
    })
    statsText.setOrigin(0, 0)
    statsText.setScrollFactor(0)
    statsText.setDepth(PANEL_DEPTH + 1)
    fitTextInBounds(statsText, {
      maxWidth: GAME_WIDTH - SCREEN_PAD * 2,
      maxHeight: STATS_LINE_HEIGHT,
      wrap: true,
    })
    screenObjects.push(statsText)
    cursorY = cursorY + STATS_LINE_HEIGHT

    return cursorY
  }

  /**
   * ブロック3: Skills 見出し。
   * 戻り値 = このブロック下端の Y
   */
  const buildSkillsTitleBlock = (topY: number): number => {
    const skillsTitle = scene.add.text(SCREEN_PAD, topY, 'Skills', {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '15px',
      color: '#fde68a',
      fontStyle: 'bold',
    })
    skillsTitle.setOrigin(0, 0)
    skillsTitle.setScrollFactor(0)
    skillsTitle.setDepth(PANEL_DEPTH + 1)
    screenObjects.push(skillsTitle)
    return topY + SECTION_TITLE_HEIGHT
  }

  /**
   * スキル1件分の行ブロックを描く。
   * rowTopY から SKILL_ROW_HEIGHT の範囲に収める。
   */
  const buildOneSkillRow = (
    rowTopY: number,
    rowLeft: number,
    columnWidth: number,
    achievementIndex: number,
  ): void => {
    const def = ALL_ACHIEVEMENTS[achievementIndex]
    const unlocked = hasUnlockedAchievement(def.id)
    const rowCenterY = rowTopY + SKILL_ROW_HEIGHT / 2

    let titleColor = '#6b7280'
    let detailColor = '#6b7280'
    let effectColor = '#4b5563'
    if (unlocked) {
      titleColor = '#86efac'
      detailColor = '#a7f3d0'
      effectColor = '#86efac'
    }

    // 冒頭はタイトルと同じ南京錠アイコン（解放済みなら非表示）
    const lockIcon = createLockIcon(
      scene,
      rowLeft + TITLE_LOCK_ICON_SIZE / 2,
      rowCenterY,
      TITLE_LOCK_ICON_SIZE,
      TITLE_LOCK_ICON_COLOR,
    )
    setLockIconVisible(lockIcon, !unlocked)
    lockIcon.container.setScrollFactor(0)
    lockIcon.container.setDepth(PANEL_DEPTH + 1)
    screenObjects.push(lockIcon.container)

    // 列揃えのため鍵の幅は常に確保する
    let textLeft = rowLeft + TITLE_LOCK_ICON_SIZE + 10
    if (def.skillId !== undefined && isSkillIconId(def.skillId)) {
      const iconCenterX = textLeft + SKILL_TREE_ICON_OUTER_SIZE / 2
      const skillIcon = createSkillIcon(
        scene,
        def.skillId,
        SKILL_TREE_ICON_SCALE,
      )
      skillIcon.container.setPosition(iconCenterX, rowCenterY)
      skillIcon.container.setScrollFactor(0)
      skillIcon.container.setDepth(PANEL_DEPTH + 1)

      // 未解放はグレー枠・塗り・記号（見た目は従来どおり）
      if (!unlocked) {
        skillIcon.border.setFillStyle(UNLOCK_ICON_LOCKED_BORDER_COLOR)
        skillIcon.fill.setFillStyle(UNLOCK_ICON_LOCKED_FILL_COLOR)
        if (skillIcon.symbol instanceof Phaser.GameObjects.Text) {
          skillIcon.symbol.setColor(UNLOCK_ICON_LOCKED_LETTER_COLOR)
        } else if (skillIcon.symbol instanceof Phaser.GameObjects.Image) {
          skillIcon.symbol.setAlpha(0.55)
        } else {
          // Orbiting Orb Graphics など
          skillIcon.symbol.setAlpha(0.55)
        }
      }

      screenObjects.push(skillIcon.container)
      textLeft = textLeft + SKILL_TREE_ICON_OUTER_SIZE + 10
    }

    // 行内の3行テキスト（上端基準で並べ、行ブロック内に収める）
    const titleText = scene.add.text(textLeft, rowTopY + 4, def.title, {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '15px',
      color: titleColor,
      fontStyle: 'bold',
    })
    titleText.setOrigin(0, 0)
    titleText.setScrollFactor(0)
    titleText.setDepth(PANEL_DEPTH + 1)
    const rowTextMaxWidth = columnWidth - (textLeft - rowLeft) - 8
    shrinkTextToFitWidth(titleText, rowTextMaxWidth)

    const detailLine = unlocked ? 'UNLOCKED' : def.condition
    const detailText = scene.add.text(textLeft, rowTopY + 26, detailLine, {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '12px',
      color: detailColor,
    })
    detailText.setOrigin(0, 0)
    detailText.setScrollFactor(0)
    detailText.setDepth(PANEL_DEPTH + 1)
    shrinkTextToFitWidth(detailText, rowTextMaxWidth)

    let effectLine = ''
    if (def.skillId !== undefined) {
      effectLine = SKILL_EFFECT_DESCS[def.skillId]
    }
    const effectMaxWidth = rowTextMaxWidth
    const effectText = scene.add.text(textLeft, rowTopY + 46, effectLine, {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '11px',
      color: effectColor,
    })
    effectText.setOrigin(0, 0)
    effectText.setScrollFactor(0)
    effectText.setDepth(PANEL_DEPTH + 1)
    fitTextInBounds(effectText, {
      maxWidth: effectMaxWidth,
      maxHeight: 18,
      wrap: true,
    })

    screenObjects.push(titleText, detailText, effectText)
  }

  /**
   * ブロック4: Skills 一覧（2列）。
   * 戻り値 = このブロック下端の Y
   */
  const buildSkillsListBlock = (topY: number): number => {
    const columnWidth = (GAME_WIDTH - SCREEN_PAD * 2) / ACHIEVEMENT_COLUMN_COUNT
    const rowsPerColumn = Math.ceil(
      ALL_ACHIEVEMENTS.length / ACHIEVEMENT_COLUMN_COUNT,
    )

    for (let index = 0; index < ALL_ACHIEVEMENTS.length; index++) {
      const columnIndex = Math.floor(index / rowsPerColumn)
      const rowIndex = index % rowsPerColumn
      const rowLeft = SCREEN_PAD + columnIndex * columnWidth
      const rowTopY = topY + rowIndex * (SKILL_ROW_HEIGHT + SKILL_ROW_GAP)
      buildOneSkillRow(rowTopY, rowLeft, columnWidth, index)
    }

    const listHeight =
      rowsPerColumn * SKILL_ROW_HEIGHT +
      Math.max(0, rowsPerColumn - 1) * SKILL_ROW_GAP
    return topY + listHeight
  }

  const buildFooterHint = (): void => {
    const hint = scene.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - FOOTER_RESERVED_HEIGHT / 2,
      'ESC / ✕ to close',
      {
        fontFamily: FONT_FAMILY_UI,
        fontSize: '12px',
        color: '#71717a',
      },
    )
    hint.setOrigin(0.5)
    hint.setScrollFactor(0)
    hint.setDepth(PANEL_DEPTH + 1)
    shrinkTextToFitWidth(hint, GAME_WIDTH - SCREEN_PAD * 2)
    screenObjects.push(hint)
  }

  const close = (): void => {
    if (!isOpenFlag) {
      return
    }
    destroyScreen()
    isOpenFlag = false
    if (callbacks.onClose !== undefined) {
      callbacks.onClose()
    }
  }

  const open = (): void => {
    if (isOpenFlag) {
      return
    }

    isOpenFlag = true
    if (callbacks.onOpen !== undefined) {
      callbacks.onOpen()
    }

    buildBackground()

    // 上からブロックを積み、次の開始 Y だけを渡す（絶対座標の重複を防ぐ）
    // Python: y = 0; y = draw_block(y) + gap に相当
    let nextY = SCREEN_PAD
    nextY = buildTitleBlock(nextY) + BLOCK_GAP
    nextY = buildStatsBlock(nextY, getLifetimeStats()) + BLOCK_GAP
    nextY = buildSkillsTitleBlock(nextY) + BLOCK_GAP
    buildSkillsListBlock(nextY)

    buildFooterHint()
  }

  const toggle = (): void => {
    if (isOpenFlag) {
      close()
    } else {
      open()
    }
  }

  const isOpen = (): boolean => {
    return isOpenFlag
  }

  // 実績画面には選択項目がないため、ESCを「閉じる」にする
  const keyboard = scene.input.keyboard
  const closeWithKeyboard = (): void => {
    close()
  }
  if (keyboard !== null) {
    keyboard.on('keydown-ESC', closeWithKeyboard)
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      keyboard.off('keydown-ESC', closeWithKeyboard)
    })
  }

  return {
    open,
    close,
    toggle,
    isOpen,
  }
}
