// ============================================================
// TopBarSystem.ts
// ------------------------------------------------------------
// タイトル／プレイ共通の細い上部バー。
// 右端: 設定歯車。その左: 実績（書類）アイコン。
// ============================================================

import Phaser from 'phaser'
import {
  GAME_WIDTH,
  HUD_SIDE_MARGIN,
  TOP_BAR_HEIGHT,
  SETTINGS_GEAR_SIZE,
  SETTINGS_GEAR_COLOR,
  SETTINGS_GEAR_HOVER_COLOR,
  SETTINGS_GEAR_DEPTH,
  SETTINGS_GEAR_GAP,
  SETTINGS_GEAR_HIT_PADDING,
  TOP_BAR_BACKGROUND_COLOR,
  TOP_BAR_DEPTH,
  ACHIEVEMENT_ICON_SIZE,
  ACHIEVEMENT_BUTTON_WIDTH,
  ACHIEVEMENT_ICON_COLOR,
  ACHIEVEMENT_ICON_HOVER_COLOR,
  GOLD_DISPLAY_WIDTH,
  GOLD_DISPLAY_GAP,
  GOLD_ICON_COLOR,
  GOLD_TEXT_COLOR,
  GOLD_BAR_FONT_SIZE,
  GOLD_ICON_FONT_SIZE,
  GOLD_ICON_OFFSET_X,
  GOLD_TEXT_OFFSET_X,
  TOP_BAR_TOOLTIP_BG_COLOR,
  TOP_BAR_TOOLTIP_BG_ALPHA,
  TOP_BAR_TOOLTIP_TEXT_COLOR,
  TOP_BAR_TOOLTIP_PADDING,
  TOP_BAR_TOOLTIP_TWEEN_MS,
  TOP_BAR_TOOLTIP_SLIDE_Y,
  TOP_BAR_TOOLTIP_GAP_BELOW_BAR,
  TOP_BAR_TOOLTIP_FONT_SIZE,
  TOP_BAR_TOOLTIP_LABEL_SETTINGS,
  TOP_BAR_TOOLTIP_LABEL_ACHIEVEMENTS,
  TOP_BAR_TOOLTIP_LABEL_GOLD,
  FONT_FAMILY_UI,
} from '../GameConstants'
import { createAchievementsPanelController } from './AchievementsPanelSystem'
import { getGold } from './UnlockSaveSystem'

export type TopBarView = {
  background: Phaser.GameObjects.Rectangle
  gearHit: Phaser.GameObjects.Rectangle
  gearIcon: Phaser.GameObjects.Text
  achievementHit: Phaser.GameObjects.Rectangle
  achievementIcon: Phaser.GameObjects.Text
  goldHit: Phaser.GameObjects.Rectangle
  goldIcon: Phaser.GameObjects.Text
  goldText: Phaser.GameObjects.Text
  refreshAchievementProgress: () => void
  refreshGold: () => void
  getGoldEffectTargetPosition: () => { x: number; y: number }
  /** タイトルのキーボード選択用: 歯車をハイライトする */
  setGearSelected: (selected: boolean) => void
  /** タイトルのキーボード選択用: 実績ボタンをハイライトする */
  setAchievementSelected: (selected: boolean) => void
  /** タイトルのキーボード選択用: ゴールド表示をハイライトする（決定アクションなし） */
  setGoldSelected: (selected: boolean) => void
  /** 実績パネルを開く／閉じる（キーボード決定用） */
  toggleAchievementsPanel: () => void
  closeAchievementsPanel: () => void
  isAchievementsPanelOpen: () => boolean
}

/**
 * 画面一番上の細いバー・右端歯車・その左の実績ボタンを作る。
 */
export function createTopBar(
  scene: Phaser.Scene,
  onGearClick?: () => void,
  onAchievementsOpen?: () => void,
  onAchievementsClose?: () => void,
): TopBarView {
  const background = scene.add.rectangle(
    GAME_WIDTH / 2,
    TOP_BAR_HEIGHT / 2,
    GAME_WIDTH,
    TOP_BAR_HEIGHT,
    TOP_BAR_BACKGROUND_COLOR,
  )
  background.setScrollFactor(0)
  background.setDepth(TOP_BAR_DEPTH)

  const gearCenterX = GAME_WIDTH - HUD_SIDE_MARGIN - SETTINGS_GEAR_SIZE / 2
  const barCenterY = TOP_BAR_HEIGHT / 2

  const gearHit = scene.add.rectangle(
    gearCenterX,
    barCenterY,
    SETTINGS_GEAR_SIZE + SETTINGS_GEAR_HIT_PADDING,
    TOP_BAR_HEIGHT,
    0x000000,
    0,
  )
  gearHit.setScrollFactor(0)
  gearHit.setDepth(SETTINGS_GEAR_DEPTH)
  gearHit.setInteractive({ useHandCursor: true })

  const gearIcon = scene.add.text(gearCenterX, barCenterY, '⚙', {
    fontSize: `${SETTINGS_GEAR_SIZE}px`,
    color: SETTINGS_GEAR_COLOR,
  })
  gearIcon.setOrigin(0.5)
  gearIcon.setScrollFactor(0)
  gearIcon.setDepth(SETTINGS_GEAR_DEPTH + 1)

  // キーボード選択中の枠（普段は非表示。色だけだと分かりにくい）
  const gearSelectBorder = scene.add.rectangle(
    gearCenterX,
    barCenterY + 2,
    SETTINGS_GEAR_SIZE + 14,
    SETTINGS_GEAR_SIZE + 10,
    0xfde68a,
  )
  gearSelectBorder.setScrollFactor(0)
  gearSelectBorder.setDepth(SETTINGS_GEAR_DEPTH - 1)
  gearSelectBorder.setVisible(false)

  const gearSelectFill = scene.add.rectangle(
    gearCenterX,
    barCenterY + 2,
    SETTINGS_GEAR_SIZE + 10,
    SETTINGS_GEAR_SIZE + 6,
    0x422006,
  )
  gearSelectFill.setScrollFactor(0)
  gearSelectFill.setDepth(SETTINGS_GEAR_DEPTH - 1)
  gearSelectFill.setVisible(false)

  // キーボード選択中は pointerout で色を戻さない
  let isGearKeyboardSelected = false
  let gearPulseTween: Phaser.Tweens.Tween | null = null

  const stopGearPulse = (): void => {
    if (gearPulseTween !== null) {
      gearPulseTween.stop()
      gearPulseTween = null
    }
    gearIcon.setScale(1)
  }

  const startGearPulse = (): void => {
    stopGearPulse()
    gearIcon.setScale(1.25)
    gearPulseTween = scene.tweens.add({
      targets: gearIcon,
      scaleX: 1.45,
      scaleY: 1.45,
      duration: 380,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    })
  }

  const applyGearVisual = (): void => {
    if (isGearKeyboardSelected) {
      gearIcon.setColor('#fef08a')
      gearSelectBorder.setVisible(true)
      gearSelectFill.setVisible(true)
      startGearPulse()
      return
    }
    stopGearPulse()
    gearIcon.setColor(SETTINGS_GEAR_COLOR)
    gearSelectBorder.setVisible(false)
    gearSelectFill.setVisible(false)
  }

  const setGearSelected = (selected: boolean): void => {
    isGearKeyboardSelected = selected
    applyGearVisual()
  }

  // 歯車の左に書類アイコン + 達成数
  const achievementCenterX =
    gearCenterX - SETTINGS_GEAR_SIZE / 2 - SETTINGS_GEAR_GAP - ACHIEVEMENT_BUTTON_WIDTH / 2

  const achievementHit = scene.add.rectangle(
    achievementCenterX,
    barCenterY,
    ACHIEVEMENT_BUTTON_WIDTH,
    TOP_BAR_HEIGHT,
    0x000000,
    0,
  )
  achievementHit.setScrollFactor(0)
  achievementHit.setDepth(SETTINGS_GEAR_DEPTH)
  achievementHit.setInteractive({ useHandCursor: true })

  const achievementIcon = scene.add.text(achievementCenterX, barCenterY, '📄', {
    fontSize: `${ACHIEVEMENT_ICON_SIZE}px`,
    color: ACHIEVEMENT_ICON_COLOR,
  })
  achievementIcon.setOrigin(0.5)
  achievementIcon.setScrollFactor(0)
  achievementIcon.setDepth(SETTINGS_GEAR_DEPTH + 1)

  // 実績の左に、すべてのランで共有するゴールド所持数を表示
  const goldCenterX =
    achievementCenterX -
    ACHIEVEMENT_BUTTON_WIDTH / 2 -
    GOLD_DISPLAY_GAP -
    GOLD_DISPLAY_WIDTH / 2
  const goldIcon = scene.add.text(goldCenterX + GOLD_ICON_OFFSET_X, barCenterY, '●', {
    fontSize: GOLD_ICON_FONT_SIZE,
    color: GOLD_ICON_COLOR,
  })
  goldIcon.setOrigin(0.5)
  goldIcon.setScrollFactor(0)
  goldIcon.setDepth(SETTINGS_GEAR_DEPTH + 1)

  const goldText = scene.add.text(goldCenterX + GOLD_TEXT_OFFSET_X, barCenterY, '0', {
    fontFamily: FONT_FAMILY_UI,
    fontSize: GOLD_BAR_FONT_SIZE,
    color: GOLD_TEXT_COLOR,
    fontStyle: 'bold',
  })
  goldText.setOrigin(0.5)
  goldText.setScrollFactor(0)
  goldText.setDepth(SETTINGS_GEAR_DEPTH + 1)

  // ゴールドはクリックできないが、ホバー説明のために当たり判定だけ置く
  const goldHit = scene.add.rectangle(
    goldCenterX,
    barCenterY,
    GOLD_DISPLAY_WIDTH,
    TOP_BAR_HEIGHT,
    0x000000,
    0,
  )
  goldHit.setScrollFactor(0)
  goldHit.setDepth(SETTINGS_GEAR_DEPTH)
  goldHit.setInteractive()

  // --- ホバー／キーボード選択中の項目名フロート（バーのすぐ下にスッと出る） ---
  const tooltipBackground = scene.add.rectangle(
    0,
    0,
    10,
    10,
    TOP_BAR_TOOLTIP_BG_COLOR,
    TOP_BAR_TOOLTIP_BG_ALPHA,
  )
  tooltipBackground.setOrigin(0.5, 0)
  tooltipBackground.setScrollFactor(0)
  tooltipBackground.setDepth(SETTINGS_GEAR_DEPTH + 2)
  tooltipBackground.setVisible(false)

  const tooltipText = scene.add.text(0, 0, '', {
    fontFamily: FONT_FAMILY_UI,
    fontSize: TOP_BAR_TOOLTIP_FONT_SIZE,
    color: TOP_BAR_TOOLTIP_TEXT_COLOR,
  })
  tooltipText.setOrigin(0.5, 0)
  tooltipText.setScrollFactor(0)
  tooltipText.setDepth(SETTINGS_GEAR_DEPTH + 3)
  tooltipText.setVisible(false)

  let tooltipTween: Phaser.Tweens.Tween | null = null
  // キーボード選択で出しているフロートの種類（選択解除時に誤って消さないため）
  let keyboardTooltipSource: 'settings' | 'achievements' | 'gold' | null = null

  const stopTooltipTween = (): void => {
    if (tooltipTween !== null) {
      tooltipTween.stop()
      tooltipTween = null
    }
  }

  // ホバーした項目の下に、少し上からフェードインで出す
  const showTopBarTooltip = (label: string, itemCenterX: number): void => {
    stopTooltipTween()

    tooltipText.setText(label)
    const pad = TOP_BAR_TOOLTIP_PADDING
    const boxWidth = tooltipText.width + pad * 2
    const boxHeight = tooltipText.height + pad * 2

    // 画面右端からはみ出さないように中心をずらす
    let centerX = itemCenterX
    const rightLimit = GAME_WIDTH - HUD_SIDE_MARGIN
    if (centerX + boxWidth / 2 > rightLimit) {
      centerX = rightLimit - boxWidth / 2
    }

    // 選択枠の下端より少し下に出す（枠が隠れないように）
    const finalTopY = TOP_BAR_HEIGHT + TOP_BAR_TOOLTIP_GAP_BELOW_BAR
    const startTopY = finalTopY - TOP_BAR_TOOLTIP_SLIDE_Y

    tooltipBackground.setSize(boxWidth, boxHeight)
    tooltipBackground.setPosition(centerX, startTopY)
    tooltipText.setPosition(centerX, startTopY + pad)

    tooltipBackground.setAlpha(0)
    tooltipText.setAlpha(0)
    tooltipBackground.setVisible(true)
    tooltipText.setVisible(true)

    tooltipTween = scene.tweens.add({
      targets: [tooltipBackground, tooltipText],
      alpha: 1,
      y: `+=${TOP_BAR_TOOLTIP_SLIDE_Y}`,
      duration: TOP_BAR_TOOLTIP_TWEEN_MS,
      ease: 'Quad.Out',
    })
  }

  const hideTopBarTooltip = (): void => {
    stopTooltipTween()
    tooltipTween = scene.tweens.add({
      targets: [tooltipBackground, tooltipText],
      alpha: 0,
      duration: TOP_BAR_TOOLTIP_TWEEN_MS,
      ease: 'Quad.In',
      onComplete: () => {
        tooltipBackground.setVisible(false)
        tooltipText.setVisible(false)
      },
    })
  }

  // キーボード選択中ならその説明に戻し、そうでなければフロートを消す
  const restoreKeyboardTooltipOrHide = (): void => {
    if (keyboardTooltipSource === 'settings') {
      showTopBarTooltip(TOP_BAR_TOOLTIP_LABEL_SETTINGS, gearCenterX)
      return
    }
    if (keyboardTooltipSource === 'achievements') {
      showTopBarTooltip(TOP_BAR_TOOLTIP_LABEL_ACHIEVEMENTS, achievementCenterX)
      return
    }
    if (keyboardTooltipSource === 'gold') {
      showTopBarTooltip(TOP_BAR_TOOLTIP_LABEL_GOLD, goldCenterX)
      return
    }
    hideTopBarTooltip()
  }

  // キーボードで選んだときも、マウスオーバーと同じフロートを出す
  const setGearSelectedWithTooltip = (selected: boolean): void => {
    setGearSelected(selected)
    if (selected) {
      keyboardTooltipSource = 'settings'
      showTopBarTooltip(TOP_BAR_TOOLTIP_LABEL_SETTINGS, gearCenterX)
      return
    }
    if (keyboardTooltipSource === 'settings') {
      keyboardTooltipSource = null
      hideTopBarTooltip()
    }
  }

  gearHit.on('pointerover', () => {
    if (!isGearKeyboardSelected) {
      gearIcon.setColor(SETTINGS_GEAR_HOVER_COLOR)
    }
    showTopBarTooltip(TOP_BAR_TOOLTIP_LABEL_SETTINGS, gearCenterX)
  })
  gearHit.on('pointerout', () => {
    applyGearVisual()
    restoreKeyboardTooltipOrHide()
  })
  gearHit.on('pointerdown', () => {
    if (onGearClick !== undefined) {
      onGearClick()
    }
  })

  // キーボード選択中のゴールド枠（決定アクションはない。説明フロートのみ）
  const goldSelectBorder = scene.add.rectangle(
    goldCenterX,
    barCenterY + 2,
    GOLD_DISPLAY_WIDTH + 8,
    SETTINGS_GEAR_SIZE + 10,
    0xfde68a,
  )
  goldSelectBorder.setScrollFactor(0)
  goldSelectBorder.setDepth(SETTINGS_GEAR_DEPTH - 1)
  goldSelectBorder.setVisible(false)

  const goldSelectFill = scene.add.rectangle(
    goldCenterX,
    barCenterY + 2,
    GOLD_DISPLAY_WIDTH + 4,
    SETTINGS_GEAR_SIZE + 6,
    0x422006,
  )
  goldSelectFill.setScrollFactor(0)
  goldSelectFill.setDepth(SETTINGS_GEAR_DEPTH - 1)
  goldSelectFill.setVisible(false)

  let isGoldKeyboardSelected = false

  const applyGoldVisual = (): void => {
    if (isGoldKeyboardSelected) {
      goldIcon.setColor('#fef08a')
      goldText.setColor('#ffffff')
      goldSelectBorder.setVisible(true)
      goldSelectFill.setVisible(true)
      return
    }
    goldIcon.setColor(GOLD_ICON_COLOR)
    goldText.setColor(GOLD_TEXT_COLOR)
    goldSelectBorder.setVisible(false)
    goldSelectFill.setVisible(false)
  }

  const setGoldSelected = (selected: boolean): void => {
    isGoldKeyboardSelected = selected
    applyGoldVisual()
    if (selected) {
      keyboardTooltipSource = 'gold'
      showTopBarTooltip(TOP_BAR_TOOLTIP_LABEL_GOLD, goldCenterX)
      return
    }
    if (keyboardTooltipSource === 'gold') {
      keyboardTooltipSource = null
      hideTopBarTooltip()
    }
  }

  goldHit.on('pointerover', () => {
    if (!isGoldKeyboardSelected) {
      goldIcon.setColor('#fef08a')
      goldText.setColor('#ffffff')
    }
    showTopBarTooltip(TOP_BAR_TOOLTIP_LABEL_GOLD, goldCenterX)
  })
  goldHit.on('pointerout', () => {
    applyGoldVisual()
    restoreKeyboardTooltipOrHide()
  })

  // キーボード選択中の実績ハイライト（歯車と同様）
  const achievementSelectBorder = scene.add.rectangle(
    achievementCenterX,
    barCenterY + 2,
    ACHIEVEMENT_BUTTON_WIDTH + 6,
    SETTINGS_GEAR_SIZE + 10,
    0x86efac,
  )
  achievementSelectBorder.setScrollFactor(0)
  achievementSelectBorder.setDepth(SETTINGS_GEAR_DEPTH - 1)
  achievementSelectBorder.setVisible(false)

  const achievementSelectFill = scene.add.rectangle(
    achievementCenterX,
    barCenterY + 2,
    ACHIEVEMENT_BUTTON_WIDTH + 2,
    SETTINGS_GEAR_SIZE + 6,
    0x14532d,
  )
  achievementSelectFill.setScrollFactor(0)
  achievementSelectFill.setDepth(SETTINGS_GEAR_DEPTH - 1)
  achievementSelectFill.setVisible(false)

  let isAchievementKeyboardSelected = false
  let achievementPulseTween: Phaser.Tweens.Tween | null = null

  const stopAchievementPulse = (): void => {
    if (achievementPulseTween !== null) {
      achievementPulseTween.stop()
      achievementPulseTween = null
    }
    achievementIcon.setScale(1)
  }

  const startAchievementPulse = (): void => {
    stopAchievementPulse()
    achievementIcon.setScale(1.2)
    achievementPulseTween = scene.tweens.add({
      targets: achievementIcon,
      scaleX: 1.35,
      scaleY: 1.35,
      duration: 380,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    })
  }

  const applyAchievementVisual = (): void => {
    if (isAchievementKeyboardSelected) {
      achievementIcon.setColor('#bbf7d0')
      achievementSelectBorder.setVisible(true)
      achievementSelectFill.setVisible(true)
      startAchievementPulse()
      return
    }
    stopAchievementPulse()
    achievementIcon.setColor(ACHIEVEMENT_ICON_COLOR)
    achievementSelectBorder.setVisible(false)
    achievementSelectFill.setVisible(false)
  }

  const setAchievementSelected = (selected: boolean): void => {
    isAchievementKeyboardSelected = selected
    applyAchievementVisual()
    // キーボードで選んだときも、マウスオーバーと同じフロートを出す
    if (selected) {
      keyboardTooltipSource = 'achievements'
      showTopBarTooltip(TOP_BAR_TOOLTIP_LABEL_ACHIEVEMENTS, achievementCenterX)
      return
    }
    if (keyboardTooltipSource === 'achievements') {
      keyboardTooltipSource = null
      hideTopBarTooltip()
    }
  }

  const achievementsPanelController = createAchievementsPanelController(scene, {
    onOpen: onAchievementsOpen,
    onClose: onAchievementsClose,
  })

  // 以前は 0/3 のような達成数を出していたが、今はアイコンのみなので何もしない
  const refreshAchievementProgress = (): void => {}

  const refreshGold = (): void => {
    goldText.setText(`${getGold()} G`)
  }

  const getGoldEffectTargetPosition = (): { x: number; y: number } => {
    return {
      x: goldCenterX,
      y: barCenterY,
    }
  }

  const closeAchievementsPanel = (): void => {
    achievementsPanelController.close()
  }

  const toggleAchievementsPanel = (): void => {
    achievementsPanelController.toggle()
  }

  const isAchievementsPanelOpen = (): boolean => {
    return achievementsPanelController.isOpen()
  }

  achievementHit.on('pointerover', () => {
    if (!isAchievementKeyboardSelected) {
      achievementIcon.setColor(ACHIEVEMENT_ICON_HOVER_COLOR)
    }
    showTopBarTooltip(TOP_BAR_TOOLTIP_LABEL_ACHIEVEMENTS, achievementCenterX)
  })
  achievementHit.on('pointerout', () => {
    applyAchievementVisual()
    restoreKeyboardTooltipOrHide()
  })
  // ホバーでは開かない。クリック／SPACE でのみ開く
  achievementHit.on('pointerdown', () => {
    toggleAchievementsPanel()
  })

  refreshGold()

  return {
    background,
    gearHit,
    gearIcon,
    achievementHit,
    achievementIcon,
    goldHit,
    goldIcon,
    goldText,
    refreshAchievementProgress,
    refreshGold,
    getGoldEffectTargetPosition,
    setGearSelected: setGearSelectedWithTooltip,
    setAchievementSelected,
    setGoldSelected,
    toggleAchievementsPanel,
    closeAchievementsPanel,
    isAchievementsPanelOpen,
  }
}
