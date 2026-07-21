// ============================================================
// SettingsMenuSystem.ts
// ------------------------------------------------------------
// 歯車から開く設定メニュー（右から tween でスライドイン）。
// BGM ON/OFF、タイトルでは Clear Save、ゲーム中は Give Up。
// Credits は Back の上。押すとクレジット表示。
// キーボード: W/S・上下矢印で選択、SPACE/ENTER で決定、一番下の Back で閉じる。
// 背景は Phaser の postFX ブラーでぼかす（設定 UI は別カメラでくっきり）。
// ============================================================

import Phaser from 'phaser'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  SETTINGS_MENU_WIDTH,
  SETTINGS_MENU_DEPTH,
  SETTINGS_MENU_PANEL_COLOR,
  SETTINGS_MENU_BORDER_COLOR,
  SETTINGS_MENU_OVERLAY_COLOR,
  SETTINGS_MENU_OVERLAY_ALPHA,
  SETTINGS_MENU_TWEEN_MS,
  SETTINGS_MENU_BUTTON_HEIGHT,
  SETTINGS_MENU_BUTTON_GAP,
  SETTINGS_MENU_BLUR_QUALITY,
  SETTINGS_MENU_BLUR_OFFSET,
  SETTINGS_MENU_BLUR_STRENGTH,
  SETTINGS_MENU_BLUR_STEPS,
  SETTINGS_CREDITS_TITLE,
  SETTINGS_CREDITS_BODY,
  FONT_FAMILY_HEADING,
  FONT_FAMILY_UI,
} from '../GameConstants'
import { GameAudioSystem } from './GameAudioSystem'
import { shrinkTextToFitWidth } from '../utils/fitTextToWidth'

export type SettingsMenuMode = 'title' | 'game'

export type SettingsMenuCallbacks = {
  mode: SettingsMenuMode
  audioSystem: GameAudioSystem
  onClearSave?: () => void
  onGiveUp?: () => void
  onOpen?: () => void
  onClose?: () => void
  /** 選択が変わったとき（キー移動・ホバー） */
  onSelectionChanged?: () => void
  /** Back・ESC・枠外クリックなどで設定を閉じたとき */
  onCancelled?: () => void
  /** 設定が閉じているときに ESC を押したとき（タイトルで設定を開くなど） */
  onEscapeWhenClosed?: () => void
}

type MenuButtonView = {
  border: Phaser.GameObjects.Rectangle
  background: Phaser.GameObjects.Rectangle
  label: Phaser.GameObjects.Text
  onClick: () => void
}

const BUTTON_BORDER_NORMAL = 0x475569
const BUTTON_BG_NORMAL = 0x334155
const BUTTON_BG_HOVER = 0x475569
const CREDITS_PANEL_WIDTH = 420
const CREDITS_PANEL_HEIGHT = 280
const CREDITS_BODY_PADDING_X = 36
const CREDITS_DEPTH = SETTINGS_MENU_DEPTH + 20

export class SettingsMenuSystem {
  private scene: Phaser.Scene
  private callbacks: SettingsMenuCallbacks
  private isOpen = false
  private isTweening = false
  private isCreditsOpen = false
  private panelContainer: Phaser.GameObjects.Container | null = null
  private overlay: Phaser.GameObjects.Rectangle | null = null
  private bgmButtonLabel: Phaser.GameObjects.Text | null = null
  private fullscreenButtonLabel: Phaser.GameObjects.Text | null = null
  private menuButtons: MenuButtonView[] = []
  private selectedIndex = 0
  private closedPanelX = 0
  private openPanelX = 0
  // 背景だけぼかす用（メインカメラに blur、設定 UI は別カメラでくっきり）
  private blurFx: Phaser.FX.Blur | null = null
  private uiCamera: Phaser.Cameras.Scene2D.Camera | null = null
  // クレジット表示（設定の上に重ねる）
  private creditsOverlay: Phaser.GameObjects.Rectangle | null = null
  private creditsBorder: Phaser.GameObjects.Rectangle | null = null
  private creditsPanel: Phaser.GameObjects.Rectangle | null = null
  private creditsTitleText: Phaser.GameObjects.Text | null = null
  private creditsBodyText: Phaser.GameObjects.Text | null = null
  private creditsBackButton: MenuButtonView | null = null

  private keyW: Phaser.Input.Keyboard.Key | null = null
  private keyS: Phaser.Input.Keyboard.Key | null = null
  private keyUp: Phaser.Input.Keyboard.Key | null = null
  private keyDown: Phaser.Input.Keyboard.Key | null = null
  private keySpace: Phaser.Input.Keyboard.Key | null = null
  private keyEnter: Phaser.Input.Keyboard.Key | null = null

  // 名前付きハンドラにして、close 時に TitleScene 等の他リスナーを消さない
  private readonly onMoveUp = (): void => {
    this.moveSelection(-1)
  }
  private readonly onMoveDown = (): void => {
    this.moveSelection(1)
  }
  private readonly onConfirm = (): void => {
    this.confirmSelection()
  }
  // ESC: 開いているときは閉じる／閉じているときはコールバック（タイトルで設定を開くなど）
  private readonly onEscapeClose = (): void => {
    if (!this.isOpen) {
      if (this.callbacks.onEscapeWhenClosed !== undefined) {
        this.callbacks.onEscapeWhenClosed()
      }
      return
    }
    if (this.isCreditsOpen) {
      this.closeCredits()
      return
    }
    this.close()
  }

  constructor(scene: Phaser.Scene, callbacks: SettingsMenuCallbacks) {
    this.scene = scene
    this.callbacks = callbacks
    this.closedPanelX = GAME_WIDTH + SETTINGS_MENU_WIDTH / 2 + 8
    this.openPanelX = GAME_WIDTH - SETTINGS_MENU_WIDTH / 2

    if (this.scene.input.keyboard !== null) {
      this.scene.input.keyboard.on('keydown-ESC', this.onEscapeClose)
    }
  }

  isMenuOpen(): boolean {
    return this.isOpen
  }

  toggle(): void {
    if (this.isOpen) {
      this.close()
    } else {
      this.open()
    }
  }

  open(): void {
    if (this.isOpen || this.isTweening) {
      return
    }

    this.isOpen = true
    this.selectedIndex = 0
    this.buildMenu()
    this.applyBackgroundBlur()
    this.refreshBgmButtonLabel()
    this.refreshFullscreenButtonLabel()
    this.refreshSelectionVisual()
    this.setupKeyboard()

    if (this.callbacks.onOpen !== undefined) {
      this.callbacks.onOpen()
    }

    if (this.panelContainer === null) {
      return
    }

    this.isTweening = true
    this.panelContainer.setX(this.closedPanelX)
    this.scene.tweens.add({
      targets: this.panelContainer,
      x: this.openPanelX,
      duration: SETTINGS_MENU_TWEEN_MS,
      ease: 'Cubic.Out',
      onComplete: () => {
        this.isTweening = false
      },
    })

    if (this.overlay !== null) {
      this.overlay.setAlpha(0)
      this.scene.tweens.add({
        targets: this.overlay,
        alpha: SETTINGS_MENU_OVERLAY_ALPHA,
        duration: SETTINGS_MENU_TWEEN_MS,
        ease: 'Cubic.Out',
      })
    }
  }

  close(playCancelSound: boolean = true): void {
    if (!this.isOpen) {
      return
    }

    if (playCancelSound) {
      this.callbacks.onCancelled?.()
    }

    // 開く／閉じるアニメ中でも ESC で抜けられるようにする
    if (this.panelContainer !== null) {
      this.scene.tweens.killTweensOf(this.panelContainer)
    }
    if (this.overlay !== null) {
      this.scene.tweens.killTweensOf(this.overlay)
    }
    this.isTweening = false

    this.clearKeyboard()
    this.destroyCredits()

    if (this.panelContainer === null) {
      this.isOpen = false
      this.clearBackgroundBlur()
      if (this.callbacks.onClose !== undefined) {
        this.callbacks.onClose()
      }
      return
    }

    this.isTweening = true
    this.scene.tweens.add({
      targets: this.panelContainer,
      x: this.closedPanelX,
      duration: SETTINGS_MENU_TWEEN_MS,
      ease: 'Cubic.In',
      onComplete: () => {
        this.destroyMenu()
        this.isOpen = false
        this.isTweening = false
        if (this.callbacks.onClose !== undefined) {
          this.callbacks.onClose()
        }
      },
    })

    if (this.overlay !== null) {
      this.scene.tweens.add({
        targets: this.overlay,
        alpha: 0,
        duration: SETTINGS_MENU_TWEEN_MS,
        ease: 'Cubic.In',
      })
    }
  }

  private buildMenu(): void {
    this.destroyMenu()
    this.menuButtons = []

    this.overlay = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      SETTINGS_MENU_OVERLAY_COLOR,
      SETTINGS_MENU_OVERLAY_ALPHA,
    )
    this.overlay.setDepth(SETTINGS_MENU_DEPTH)
    this.overlay.setScrollFactor(0)
    this.overlay.setInteractive()
    this.overlay.on('pointerdown', () => {
      this.close()
    })

    const border = this.scene.add.rectangle(
      0,
      0,
      SETTINGS_MENU_WIDTH + 4,
      GAME_HEIGHT,
      SETTINGS_MENU_BORDER_COLOR,
    )
    const panel = this.scene.add.rectangle(
      0,
      0,
      SETTINGS_MENU_WIDTH,
      GAME_HEIGHT,
      SETTINGS_MENU_PANEL_COLOR,
    )

    const titleText = this.scene.add.text(0, -GAME_HEIGHT / 2 + 36, 'Settings', {
      fontFamily: FONT_FAMILY_HEADING,
      fontSize: '18px',
      color: '#fde68a',
    })
    titleText.setOrigin(0.5)

    const buttonViews: Phaser.GameObjects.GameObject[] = [border, panel, titleText]

    let nextButtonY = -GAME_HEIGHT / 2 + 90

    const bgmButton = this.createMenuButton(0, nextButtonY, this.getBgmButtonText(), () => {
      this.handleBgmToggle()
    })
    this.bgmButtonLabel = bgmButton.label
    this.menuButtons.push(bgmButton)
    buttonViews.push(bgmButton.border, bgmButton.background, bgmButton.label)
    nextButtonY = nextButtonY + SETTINGS_MENU_BUTTON_HEIGHT + SETTINGS_MENU_BUTTON_GAP

    const fullscreenButton = this.createMenuButton(
      0,
      nextButtonY,
      this.getFullscreenButtonText(),
      () => {
        this.handleFullscreenToggle()
      },
    )
    this.fullscreenButtonLabel = fullscreenButton.label
    this.menuButtons.push(fullscreenButton)
    buttonViews.push(
      fullscreenButton.border,
      fullscreenButton.background,
      fullscreenButton.label,
    )
    nextButtonY = nextButtonY + SETTINGS_MENU_BUTTON_HEIGHT + SETTINGS_MENU_BUTTON_GAP

    if (this.callbacks.mode === 'title') {
      const clearButton = this.createMenuButton(0, nextButtonY, 'Clear Save', () => {
        // Clear Save の決定音（キャンセル音は鳴らさない）
        this.callbacks.audioSystem.playShopPurchase()
        this.close(false)
        if (this.callbacks.onClearSave !== undefined) {
          this.callbacks.onClearSave()
        }
      })
      this.menuButtons.push(clearButton)
      buttonViews.push(clearButton.border, clearButton.background, clearButton.label)
      nextButtonY = nextButtonY + SETTINGS_MENU_BUTTON_HEIGHT + SETTINGS_MENU_BUTTON_GAP
    }

    if (this.callbacks.mode === 'game') {
      const giveUpButton = this.createMenuButton(0, nextButtonY, 'Give Up to Title', () => {
        // Give Up の決定なのでキャンセル音は鳴らさない
        this.close(false)
        if (this.callbacks.onGiveUp !== undefined) {
          this.callbacks.onGiveUp()
        }
      })
      this.menuButtons.push(giveUpButton)
      buttonViews.push(giveUpButton.border, giveUpButton.background, giveUpButton.label)
    }

    // Back のすぐ上に Credits
    const backButtonY = GAME_HEIGHT / 2 - 56
    const creditsButtonY =
      backButtonY - SETTINGS_MENU_BUTTON_HEIGHT - SETTINGS_MENU_BUTTON_GAP
    const creditsButton = this.createMenuButton(0, creditsButtonY, 'Credits', () => {
      // Settings を開くときと同じ決定音
      this.callbacks.audioSystem.playShopPurchase()
      this.openCredits()
    })
    this.menuButtons.push(creditsButton)
    buttonViews.push(creditsButton.border, creditsButton.background, creditsButton.label)

    // 一番下に Back（設定を閉じて元の画面へ）
    const backButton = this.createMenuButton(0, backButtonY, 'Back', () => {
      this.close()
    })
    this.menuButtons.push(backButton)
    buttonViews.push(backButton.border, backButton.background, backButton.label)

    const closeHint = this.scene.add.text(
      0,
      GAME_HEIGHT / 2 - 22,
      'W/S · ↑/↓ select  /  SPACE · ENTER confirm  /  ESC back',
      {
        fontFamily: FONT_FAMILY_UI,
        fontSize: '12px',
        color: '#71717a',
      },
    )
    closeHint.setOrigin(0.5)
    buttonViews.push(closeHint)

    this.panelContainer = this.scene.add.container(this.closedPanelX, GAME_HEIGHT / 2, buttonViews)
    this.panelContainer.setDepth(SETTINGS_MENU_DEPTH + 1)
    this.panelContainer.setScrollFactor(0)
  }

  // 役割: クレジット画面を設定の上に表示する
  private openCredits(): void {
    if (this.isCreditsOpen) {
      return
    }
    this.isCreditsOpen = true

    const panelCenterY = GAME_HEIGHT / 2
    const panelTopY = panelCenterY - CREDITS_PANEL_HEIGHT / 2
    const panelBottomY = panelCenterY + CREDITS_PANEL_HEIGHT / 2

    this.creditsOverlay = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      panelCenterY,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.55,
    )
    this.creditsOverlay.setDepth(CREDITS_DEPTH)
    this.creditsOverlay.setScrollFactor(0)
    this.creditsOverlay.setInteractive()
    this.creditsOverlay.on('pointerdown', () => {
      this.closeCredits()
    })

    this.creditsBorder = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      panelCenterY,
      CREDITS_PANEL_WIDTH + 4,
      CREDITS_PANEL_HEIGHT + 4,
      SETTINGS_MENU_BORDER_COLOR,
    )
    this.creditsBorder.setDepth(CREDITS_DEPTH + 1)
    this.creditsBorder.setScrollFactor(0)

    this.creditsPanel = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      panelCenterY,
      CREDITS_PANEL_WIDTH,
      CREDITS_PANEL_HEIGHT,
      SETTINGS_MENU_PANEL_COLOR,
    )
    this.creditsPanel.setDepth(CREDITS_DEPTH + 2)
    this.creditsPanel.setScrollFactor(0)
    // パネル上クリックで下のオーバーレイへ届かないようにする
    this.creditsPanel.setInteractive()

    this.creditsTitleText = this.scene.add.text(
      GAME_WIDTH / 2,
      panelTopY + 28,
      SETTINGS_CREDITS_TITLE,
      {
        fontFamily: FONT_FAMILY_HEADING,
        fontSize: '18px',
        color: '#fde68a',
      },
    )
    this.creditsTitleText.setOrigin(0.5)
    this.creditsTitleText.setDepth(CREDITS_DEPTH + 3)
    this.creditsTitleText.setScrollFactor(0)
    shrinkTextToFitWidth(this.creditsTitleText, CREDITS_PANEL_WIDTH - CREDITS_BODY_PADDING_X)

    const bodyTopY = panelTopY + 56
    const backButtonY = panelBottomY - 36
    const bodyMaxHeight = backButtonY - SETTINGS_MENU_BUTTON_HEIGHT / 2 - 12 - bodyTopY

    this.creditsBodyText = this.scene.add.text(
      GAME_WIDTH / 2,
      bodyTopY,
      SETTINGS_CREDITS_BODY,
      {
        fontFamily: FONT_FAMILY_UI,
        fontSize: '13px',
        color: '#e2e8f0',
        align: 'center',
        lineSpacing: 4,
        wordWrap: { width: CREDITS_PANEL_WIDTH - CREDITS_BODY_PADDING_X },
      },
    )
    this.creditsBodyText.setOrigin(0.5, 0)
    this.creditsBodyText.setDepth(CREDITS_DEPTH + 3)
    this.creditsBodyText.setScrollFactor(0)
    this.fitCreditsBodyToPanel(this.creditsBodyText, bodyTopY, bodyMaxHeight)

    this.creditsBackButton = this.createStandaloneButton(
      GAME_WIDTH / 2,
      backButtonY,
      'Back',
      () => {
        this.closeCredits()
      },
      CREDITS_DEPTH + 3,
    )
    // クレジット中は Back だけ選択中表示にする
    this.creditsBackButton.border.setFillStyle(SETTINGS_MENU_BORDER_COLOR)
    this.creditsBackButton.background.setFillStyle(BUTTON_BG_HOVER)

    this.keepCreditsSharpOnUiCamera()
  }

  // 役割: クレジット本文をパネル幅・高さの中に収める（折り返し＋必要なら文字を小さく）
  private fitCreditsBodyToPanel(
    bodyText: Phaser.GameObjects.Text,
    topY: number,
    maxHeight: number,
  ): void {
    const maxWidth = CREDITS_PANEL_WIDTH - CREDITS_BODY_PADDING_X
    let fontSize = 13
    const minFontSize = 10

    while (fontSize >= minFontSize) {
      bodyText.setStyle({
        fontFamily: FONT_FAMILY_UI,
        fontSize: `${fontSize}px`,
        color: '#e2e8f0',
        align: 'center',
        lineSpacing: 4,
        wordWrap: { width: maxWidth },
      })
      if (bodyText.height <= maxHeight) {
        break
      }
      fontSize = fontSize - 1
    }

    bodyText.setOrigin(0.5, 0)
    bodyText.setPosition(GAME_WIDTH / 2, topY)
  }

  // 役割: クレジット用オブジェクトをメインカメラ（ブラー）から外し、くっきり見せる
  private keepCreditsSharpOnUiCamera(): void {
    if (this.uiCamera === null) {
      return
    }

    const creditsObjects: Phaser.GameObjects.GameObject[] = []
    if (this.creditsOverlay !== null) {
      creditsObjects.push(this.creditsOverlay)
    }
    if (this.creditsBorder !== null) {
      creditsObjects.push(this.creditsBorder)
    }
    if (this.creditsPanel !== null) {
      creditsObjects.push(this.creditsPanel)
    }
    if (this.creditsTitleText !== null) {
      creditsObjects.push(this.creditsTitleText)
    }
    if (this.creditsBodyText !== null) {
      creditsObjects.push(this.creditsBodyText)
    }
    if (this.creditsBackButton !== null) {
      creditsObjects.push(
        this.creditsBackButton.border,
        this.creditsBackButton.background,
        this.creditsBackButton.label,
      )
    }

    this.scene.cameras.main.ignore(creditsObjects)
  }

  private closeCredits(): void {
    if (!this.isCreditsOpen) {
      return
    }
    this.callbacks.onCancelled?.()
    this.destroyCredits()
  }

  private destroyCredits(): void {
    this.isCreditsOpen = false

    if (this.creditsOverlay !== null) {
      this.creditsOverlay.destroy()
      this.creditsOverlay = null
    }
    if (this.creditsBorder !== null) {
      this.creditsBorder.destroy()
      this.creditsBorder = null
    }
    if (this.creditsPanel !== null) {
      this.creditsPanel.destroy()
      this.creditsPanel = null
    }
    if (this.creditsTitleText !== null) {
      this.creditsTitleText.destroy()
      this.creditsTitleText = null
    }
    if (this.creditsBodyText !== null) {
      this.creditsBodyText.destroy()
      this.creditsBodyText = null
    }
    if (this.creditsBackButton !== null) {
      this.creditsBackButton.border.destroy()
      this.creditsBackButton.background.destroy()
      this.creditsBackButton.label.destroy()
      this.creditsBackButton = null
    }
  }

  // 役割: クレジット用の独立ボタン（menuButtons には入れない）
  private createStandaloneButton(
    x: number,
    y: number,
    labelText: string,
    onClick: () => void,
    depth: number,
  ): MenuButtonView {
    const buttonWidth = 160
    const border = this.scene.add.rectangle(
      x,
      y,
      buttonWidth + 4,
      SETTINGS_MENU_BUTTON_HEIGHT + 4,
      BUTTON_BORDER_NORMAL,
    )
    border.setDepth(depth)
    border.setScrollFactor(0)

    const background = this.scene.add.rectangle(
      x,
      y,
      buttonWidth,
      SETTINGS_MENU_BUTTON_HEIGHT,
      BUTTON_BG_NORMAL,
    )
    background.setDepth(depth)
    background.setScrollFactor(0)
    background.setInteractive({ useHandCursor: true })

    const label = this.scene.add.text(x, y, labelText, {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    })
    label.setOrigin(0.5)
    label.setDepth(depth)
    label.setScrollFactor(0)

    background.on('pointerdown', () => {
      onClick()
    })

    return { border, background, label, onClick }
  }

  private createMenuButton(
    x: number,
    y: number,
    labelText: string,
    onClick: () => void,
  ): MenuButtonView {
    const buttonWidth = SETTINGS_MENU_WIDTH - 32
    const buttonIndex = this.menuButtons.length

    const border = this.scene.add.rectangle(
      x,
      y,
      buttonWidth + 4,
      SETTINGS_MENU_BUTTON_HEIGHT + 4,
      BUTTON_BORDER_NORMAL,
    )
    const background = this.scene.add.rectangle(
      x,
      y,
      buttonWidth,
      SETTINGS_MENU_BUTTON_HEIGHT,
      BUTTON_BG_NORMAL,
    )
    background.setInteractive({ useHandCursor: true })

    const label = this.scene.add.text(x, y, labelText, {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    })
    label.setOrigin(0.5)

    const buttonView: MenuButtonView = { border, background, label, onClick }

    background.on('pointerover', () => {
      if (this.isCreditsOpen) {
        return
      }
      this.selectMenuItem(buttonIndex)
    })
    background.on('pointerdown', () => {
      if (this.isCreditsOpen) {
        return
      }
      this.selectMenuItem(buttonIndex)
      onClick()
    })

    return buttonView
  }

  private setupKeyboard(): void {
    this.clearKeyboard()
    if (this.scene.input.keyboard === null) {
      return
    }

    this.keyW = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
    this.keyS = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
    this.keyUp = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP)
    this.keyDown = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN)
    this.keySpace = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.keyEnter = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)

    this.keyW.on('down', this.onMoveUp)
    this.keyUp.on('down', this.onMoveUp)
    this.keyS.on('down', this.onMoveDown)
    this.keyDown.on('down', this.onMoveDown)
    this.keySpace.on('down', this.onConfirm)
    this.keyEnter.on('down', this.onConfirm)
  }

  private clearKeyboard(): void {
    if (this.keyW !== null) {
      this.keyW.off('down', this.onMoveUp)
    }
    if (this.keyUp !== null) {
      this.keyUp.off('down', this.onMoveUp)
    }
    if (this.keyS !== null) {
      this.keyS.off('down', this.onMoveDown)
    }
    if (this.keyDown !== null) {
      this.keyDown.off('down', this.onMoveDown)
    }
    if (this.keySpace !== null) {
      this.keySpace.off('down', this.onConfirm)
    }
    if (this.keyEnter !== null) {
      this.keyEnter.off('down', this.onConfirm)
    }
    this.keyW = null
    this.keyS = null
    this.keyUp = null
    this.keyDown = null
    this.keySpace = null
    this.keyEnter = null
  }

  private moveSelection(direction: number): void {
    if (!this.isOpen || this.isTweening || this.isCreditsOpen) {
      return
    }
    if (this.menuButtons.length <= 0) {
      return
    }

    let nextIndex = this.selectedIndex + direction
    if (nextIndex < 0) {
      nextIndex = this.menuButtons.length - 1
    }
    if (nextIndex >= this.menuButtons.length) {
      nextIndex = 0
    }
    this.selectMenuItem(nextIndex)
  }

  // 役割: 設定メニューの選択を切り替え、変わったときだけ移動音を鳴らす
  private selectMenuItem(nextIndex: number): void {
    if (nextIndex === this.selectedIndex) {
      return
    }
    this.selectedIndex = nextIndex
    this.callbacks.onSelectionChanged?.()
    this.refreshSelectionVisual()
  }

  private confirmSelection(): void {
    if (!this.isOpen || this.isTweening) {
      return
    }
    // クレジット表示中は SPACE / ENTER で閉じる
    if (this.isCreditsOpen) {
      this.closeCredits()
      return
    }

    const button = this.menuButtons[this.selectedIndex]
    if (button === undefined) {
      return
    }
    button.onClick()
  }

  private refreshSelectionVisual(): void {
    for (let index = 0; index < this.menuButtons.length; index++) {
      const button = this.menuButtons[index]
      const isSelected = index === this.selectedIndex

      if (isSelected) {
        button.border.setFillStyle(SETTINGS_MENU_BORDER_COLOR)
        button.background.setFillStyle(BUTTON_BG_HOVER)
      } else {
        button.border.setFillStyle(BUTTON_BORDER_NORMAL)
        button.background.setFillStyle(BUTTON_BG_NORMAL)
      }
    }
  }

  private getBgmButtonText(): string {
    if (this.callbacks.audioSystem.getBgmEnabled()) {
      return 'BGM: ON'
    }
    return 'BGM: OFF'
  }

  private refreshBgmButtonLabel(): void {
    if (this.bgmButtonLabel === null) {
      return
    }
    this.bgmButtonLabel.setText(this.getBgmButtonText())
  }

  private getFullscreenButtonText(): string {
    if (!this.scene.scale.fullscreen.available) {
      return 'Fullscreen: N/A'
    }
    if (this.scene.scale.isFullscreen) {
      return 'Fullscreen: ON'
    }
    return 'Fullscreen: OFF'
  }

  private refreshFullscreenButtonLabel(): void {
    if (this.fullscreenButtonLabel === null) {
      return
    }
    this.fullscreenButtonLabel.setText(this.getFullscreenButtonText())
  }

  private handleFullscreenToggle(): void {
    if (!this.scene.scale.fullscreen.available) {
      this.refreshFullscreenButtonLabel()
      return
    }
    if (this.scene.scale.isFullscreen) {
      this.scene.scale.stopFullscreen()
    } else {
      this.scene.scale.startFullscreen()
    }
    this.refreshFullscreenButtonLabel()
  }

  private handleBgmToggle(): void {
    const nextEnabled = !this.callbacks.audioSystem.getBgmEnabled()
    this.callbacks.audioSystem.setBgmEnabled(nextEnabled)
    this.refreshBgmButtonLabel()
  }

  // 役割: 背景を Phaser ネイティブの postFX ブラーでぼかす。
  // 設定パネル自体は別カメラで描画し、ぼやけないようにする。
  // WebGL のときだけ有効（Canvas フォールバック時は暗いオーバーレイのみ）。
  private applyBackgroundBlur(): void {
    this.clearBackgroundBlur()

    if (this.scene.game.renderer.type !== Phaser.WEBGL) {
      return
    }
    if (this.overlay === null || this.panelContainer === null) {
      return
    }

    const mainCamera = this.scene.cameras.main
    this.blurFx = mainCamera.postFX.addBlur(
      SETTINGS_MENU_BLUR_QUALITY,
      SETTINGS_MENU_BLUR_OFFSET,
      SETTINGS_MENU_BLUR_OFFSET,
      SETTINGS_MENU_BLUR_STRENGTH,
      0xffffff,
      SETTINGS_MENU_BLUR_STEPS,
    )

    this.uiCamera = this.scene.cameras.add(0, 0, GAME_WIDTH, GAME_HEIGHT)
    this.uiCamera.setScroll(mainCamera.scrollX, mainCamera.scrollY)
    this.uiCamera.transparent = true

    const uiObjects: Phaser.GameObjects.GameObject[] = [this.overlay, this.panelContainer]
    mainCamera.ignore(uiObjects)

    // UI カメラには設定以外を描画しない
    const allChildren = this.scene.children.list
    for (let index = 0; index < allChildren.length; index++) {
      const child = allChildren[index]
      if (child === this.overlay || child === this.panelContainer) {
        continue
      }
      this.uiCamera.ignore(child)
    }
  }

  private clearBackgroundBlur(): void {
    if (this.blurFx !== null) {
      this.scene.cameras.main.postFX.remove(this.blurFx)
      this.blurFx = null
    }
    if (this.uiCamera !== null) {
      this.scene.cameras.remove(this.uiCamera)
      this.uiCamera = null
    }
  }

  private destroyMenu(): void {
    this.clearKeyboard()
    this.destroyCredits()
    this.clearBackgroundBlur()
    if (this.overlay !== null) {
      this.overlay.destroy()
      this.overlay = null
    }
    if (this.panelContainer !== null) {
      this.panelContainer.destroy(true)
      this.panelContainer = null
    }
    this.bgmButtonLabel = null
    this.fullscreenButtonLabel = null
    this.menuButtons = []
  }
}
