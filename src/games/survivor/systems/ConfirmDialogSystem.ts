// ============================================================
// ConfirmDialogSystem.ts
// ------------------------------------------------------------
// 中央の大きな確認ダイアログ（初期選択は常に NO）。
// Clear Save / Give Up to Title などで共通利用。
// ============================================================

import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY_HEADING, FONT_FAMILY_UI } from '../GameConstants'
import { shrinkTextToFitWidth } from '../utils/fitTextToWidth'

const DIALOG_DEPTH = 500
const PANEL_WIDTH = 420
const PANEL_HEIGHT = 220
const BUTTON_WIDTH = 160
const BUTTON_HEIGHT = 44

export type ConfirmDialogConfig = {
  title: string
  message: string
  yesLabel: string
  noLabel?: string
  onYes: () => void
  onNo?: () => void
}

export class ConfirmDialogSystem {
  private scene: Phaser.Scene
  private isOpenFlag = false
  private choiceIndex = 0
  private config: ConfirmDialogConfig | null = null
  private overlay: Phaser.GameObjects.Rectangle | null = null
  private border: Phaser.GameObjects.Rectangle | null = null
  private panel: Phaser.GameObjects.Rectangle | null = null
  private titleText: Phaser.GameObjects.Text | null = null
  private messageText: Phaser.GameObjects.Text | null = null
  private noBorder: Phaser.GameObjects.Rectangle | null = null
  private noButton: Phaser.GameObjects.Rectangle | null = null
  private noText: Phaser.GameObjects.Text | null = null
  private yesBorder: Phaser.GameObjects.Rectangle | null = null
  private yesButton: Phaser.GameObjects.Rectangle | null = null
  private yesText: Phaser.GameObjects.Text | null = null
  private keyA: Phaser.Input.Keyboard.Key | null = null
  private keyD: Phaser.Input.Keyboard.Key | null = null
  private keyLeft: Phaser.Input.Keyboard.Key | null = null
  private keyRight: Phaser.Input.Keyboard.Key | null = null
  private keySpace: Phaser.Input.Keyboard.Key | null = null
  private keyEnter: Phaser.Input.Keyboard.Key | null = null
  // 名前付きハンドラにして、hide 時に TitleScene 等の他リスナーを消さない
  private readonly onMoveLeft = (): void => {
    this.moveChoice(-1)
  }
  private readonly onMoveRight = (): void => {
    this.moveChoice(1)
  }
  private readonly onConfirm = (): void => {
    this.confirmChoice()
  }

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  isOpen(): boolean {
    return this.isOpenFlag
  }

  show(config: ConfirmDialogConfig): void {
    if (this.isOpenFlag) {
      return
    }

    this.config = config
    this.isOpenFlag = true
    this.choiceIndex = 0

    this.overlay = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.55,
    )
    this.overlay.setDepth(DIALOG_DEPTH)
    this.overlay.setScrollFactor(0)

    this.border = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      PANEL_WIDTH + 6,
      PANEL_HEIGHT + 6,
      0xfde68a,
    )
    this.border.setDepth(DIALOG_DEPTH + 1)
    this.border.setScrollFactor(0)

    this.panel = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      PANEL_WIDTH,
      PANEL_HEIGHT,
      0x1e293b,
    )
    this.panel.setDepth(DIALOG_DEPTH + 2)
    this.panel.setScrollFactor(0)

    this.titleText = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 70, config.title, {
      fontFamily: FONT_FAMILY_HEADING,
      fontSize: '22px',
      color: '#fca5a5',
    })
    this.titleText.setOrigin(0.5)
    this.titleText.setDepth(DIALOG_DEPTH + 3)
    this.titleText.setScrollFactor(0)
    shrinkTextToFitWidth(this.titleText, PANEL_WIDTH - 24)

    this.messageText = this.scene.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 28,
      config.message,
      {
        fontFamily: FONT_FAMILY_UI,
        fontSize: '16px',
        color: '#e2e8f0',
        align: 'center',
        // 長いメッセージはパネル内で折り返す
        wordWrap: { width: PANEL_WIDTH - 32 },
      },
    )
    this.messageText.setOrigin(0.5)
    this.messageText.setDepth(DIALOG_DEPTH + 3)
    this.messageText.setScrollFactor(0)

    const buttonY = GAME_HEIGHT / 2 + 58
    const noX = GAME_WIDTH / 2 - 100
    const yesX = GAME_WIDTH / 2 + 100
    let noLabel = 'NO'
    if (config.noLabel !== undefined) {
      noLabel = config.noLabel
    }

    this.noBorder = this.scene.add.rectangle(
      noX,
      buttonY,
      BUTTON_WIDTH + 4,
      BUTTON_HEIGHT + 4,
      0xfde68a,
    )
    this.noBorder.setDepth(DIALOG_DEPTH + 3)
    this.noBorder.setScrollFactor(0)
    this.noButton = this.scene.add.rectangle(noX, buttonY, BUTTON_WIDTH, BUTTON_HEIGHT, 0x334155)
    this.noButton.setDepth(DIALOG_DEPTH + 4)
    this.noButton.setScrollFactor(0)
    this.noButton.setInteractive({ useHandCursor: true })
    this.noText = this.scene.add.text(noX, buttonY, noLabel, {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    })
    this.noText.setOrigin(0.5)
    this.noText.setDepth(DIALOG_DEPTH + 5)
    this.noText.setScrollFactor(0)
    shrinkTextToFitWidth(this.noText, BUTTON_WIDTH - 12)

    this.yesBorder = this.scene.add.rectangle(
      yesX,
      buttonY,
      BUTTON_WIDTH + 4,
      BUTTON_HEIGHT + 4,
      0x475569,
    )
    this.yesBorder.setDepth(DIALOG_DEPTH + 3)
    this.yesBorder.setScrollFactor(0)
    this.yesButton = this.scene.add.rectangle(yesX, buttonY, BUTTON_WIDTH, BUTTON_HEIGHT, 0x334155)
    this.yesButton.setDepth(DIALOG_DEPTH + 4)
    this.yesButton.setScrollFactor(0)
    this.yesButton.setInteractive({ useHandCursor: true })
    this.yesText = this.scene.add.text(yesX, buttonY, config.yesLabel, {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '15px',
      color: '#ffffff',
      fontStyle: 'bold',
    })
    this.yesText.setOrigin(0.5)
    this.yesText.setDepth(DIALOG_DEPTH + 5)
    this.yesText.setScrollFactor(0)
    shrinkTextToFitWidth(this.yesText, BUTTON_WIDTH - 12)

    this.noButton.on('pointerover', () => {
      this.choiceIndex = 0
      this.refreshChoiceVisual()
    })
    this.noButton.on('pointerdown', () => {
      this.choiceIndex = 0
      this.confirmChoice()
    })
    this.yesButton.on('pointerover', () => {
      this.choiceIndex = 1
      this.refreshChoiceVisual()
    })
    this.yesButton.on('pointerdown', () => {
      this.choiceIndex = 1
      this.confirmChoice()
    })

    this.setupKeyboard()
    this.refreshChoiceVisual()
  }

  private setupKeyboard(): void {
    this.clearKeyboard()
    if (this.scene.input.keyboard === null) {
      return
    }

    this.keyA = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
    this.keyD = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    this.keyLeft = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT)
    this.keyRight = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT)
    this.keySpace = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.keyEnter = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)

    this.keyA.on('down', this.onMoveLeft)
    this.keyLeft.on('down', this.onMoveLeft)
    this.keyD.on('down', this.onMoveRight)
    this.keyRight.on('down', this.onMoveRight)
    this.keySpace.on('down', this.onConfirm)
    this.keyEnter.on('down', this.onConfirm)
  }

  private clearKeyboard(): void {
    if (this.keyA !== null) {
      this.keyA.off('down', this.onMoveLeft)
    }
    if (this.keyLeft !== null) {
      this.keyLeft.off('down', this.onMoveLeft)
    }
    if (this.keyD !== null) {
      this.keyD.off('down', this.onMoveRight)
    }
    if (this.keyRight !== null) {
      this.keyRight.off('down', this.onMoveRight)
    }
    if (this.keySpace !== null) {
      this.keySpace.off('down', this.onConfirm)
    }
    if (this.keyEnter !== null) {
      this.keyEnter.off('down', this.onConfirm)
    }
    this.keyA = null
    this.keyD = null
    this.keyLeft = null
    this.keyRight = null
    this.keySpace = null
    this.keyEnter = null
  }

  private moveChoice(direction: number): void {
    if (!this.isOpenFlag) {
      return
    }
    this.choiceIndex = this.choiceIndex + direction
    if (this.choiceIndex < 0) {
      this.choiceIndex = 1
    }
    if (this.choiceIndex > 1) {
      this.choiceIndex = 0
    }
    this.refreshChoiceVisual()
  }

  private refreshChoiceVisual(): void {
    const noSelected = this.choiceIndex === 0

    if (this.noBorder !== null) {
      if (noSelected) {
        this.noBorder.setFillStyle(0xfde68a)
      } else {
        this.noBorder.setFillStyle(0x475569)
      }
    }
    if (this.yesBorder !== null) {
      if (noSelected) {
        this.yesBorder.setFillStyle(0x475569)
      } else {
        this.yesBorder.setFillStyle(0xfca5a5)
      }
    }
    if (this.noButton !== null) {
      if (noSelected) {
        this.noButton.setFillStyle(0x475569)
      } else {
        this.noButton.setFillStyle(0x334155)
      }
    }
    if (this.yesButton !== null) {
      if (noSelected) {
        this.yesButton.setFillStyle(0x334155)
      } else {
        this.yesButton.setFillStyle(0x7f1d1d)
      }
    }
  }

  private confirmChoice(): void {
    if (!this.isOpenFlag || this.config === null) {
      return
    }

    const config = this.config
    const choseYes = this.choiceIndex === 1
    this.hide()

    if (choseYes) {
      config.onYes()
      return
    }
    if (config.onNo !== undefined) {
      config.onNo()
    }
  }

  hide(): void {
    if (!this.isOpenFlag) {
      return
    }

    this.clearKeyboard()
    this.isOpenFlag = false
    this.config = null
    this.choiceIndex = 0

    const parts = [
      this.overlay,
      this.border,
      this.panel,
      this.titleText,
      this.messageText,
      this.noBorder,
      this.noButton,
      this.noText,
      this.yesBorder,
      this.yesButton,
      this.yesText,
    ]
    for (let index = 0; index < parts.length; index++) {
      const part = parts[index]
      if (part !== null) {
        part.destroy()
      }
    }

    this.overlay = null
    this.border = null
    this.panel = null
    this.titleText = null
    this.messageText = null
    this.noBorder = null
    this.noButton = null
    this.noText = null
    this.yesBorder = null
    this.yesButton = null
    this.yesText = null
  }
}
