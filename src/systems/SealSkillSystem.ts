import Phaser from 'phaser'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  SEAL_UI_DEPTH,
  SEAL_PANEL_WIDTH,
  SEAL_PANEL_HEIGHT,
  SEAL_CARD_WIDTH,
  SEAL_CARD_HEIGHT,
  SEAL_CARD_GAP_X,
  SEAL_CARD_GAP_Y,
  SHOP_PANEL_COLOR,
  SHOP_PANEL_BORDER_COLOR,
  SHOP_CARD_COLOR,
  SHOP_CARD_HOVER_COLOR,
  SHOP_CARD_BORDER_COLOR,
  SHOP_CARD_SELECTED_BORDER_COLOR,
  FONT_FAMILY_HEADING,
  FONT_FAMILY_UI,
} from '../GameConstants'
import { isSkillUnlocked } from './AchievementSystem'
import {
  getPurchasedSealSlotCount,
  getSealedSkillIds,
  setSkillSealed,
} from './UnlockSaveSystem'
import type { LevelUpChoiceId } from './LevelUpChoiceSystem'
import { shrinkTextToFitWidth } from '../utils/fitTextToWidth'

type SealableSkillDef = {
  id: LevelUpChoiceId
  title: string
}

type SealCardView = {
  def: SealableSkillDef
  container: Phaser.GameObjects.Container
  border: Phaser.GameObjects.Rectangle
  background: Phaser.GameObjects.Rectangle
  stateText: Phaser.GameObjects.Text
}

const SEALABLE_SKILLS: SealableSkillDef[] = [
  { id: 'damage', title: 'Power' },
  { id: 'fireRate', title: 'Speed' },
  { id: 'range', title: 'Range' },
  { id: 'move', title: 'Move' },
  { id: 'magnet', title: 'Pickup' },
  // Pierce / Blast / Ricochet はレベルアップ候補に出ないのでシール対象外
  { id: 'xpBonus', title: 'XP Bonus' },
]

export type SealSkillSystemCallbacks = {
  onClose?: () => void
  /** カーソル（選択項目）が変わったとき */
  onSelectionChanged?: () => void
  /** シールの ON/OFF が実際に切り替わったとき */
  onSealed?: () => void
}

/** タイトル画面で、レベルアップ候補から除外するスキルを選ぶ画面。 */
export class SealSkillSystem {
  private scene: Phaser.Scene
  private callbacks: SealSkillSystemCallbacks
  private openState = false
  private selectedIndex = 0
  private lastColumn = 0
  private overlay: Phaser.GameObjects.Rectangle | null = null
  private panelContainer: Phaser.GameObjects.Container | null = null
  private statusText: Phaser.GameObjects.Text | null = null
  private cards: SealCardView[] = []
  private backText: Phaser.GameObjects.Text | null = null
  private backBorder: Phaser.GameObjects.Rectangle | null = null
  private backBackground: Phaser.GameObjects.Rectangle | null = null

  private keyW: Phaser.Input.Keyboard.Key | null = null
  private keyA: Phaser.Input.Keyboard.Key | null = null
  private keyS: Phaser.Input.Keyboard.Key | null = null
  private keyD: Phaser.Input.Keyboard.Key | null = null
  private keyUp: Phaser.Input.Keyboard.Key | null = null
  private keyDown: Phaser.Input.Keyboard.Key | null = null
  private keyLeft: Phaser.Input.Keyboard.Key | null = null
  private keyRight: Phaser.Input.Keyboard.Key | null = null
  private keySpace: Phaser.Input.Keyboard.Key | null = null
  private keyEnter: Phaser.Input.Keyboard.Key | null = null
  private keyEsc: Phaser.Input.Keyboard.Key | null = null

  constructor(scene: Phaser.Scene, callbacks: SealSkillSystemCallbacks = {}) {
    this.scene = scene
    this.callbacks = callbacks
  }

  isOpen(): boolean {
    return this.openState
  }

  open(): void {
    if (this.openState) {
      return
    }
    this.openState = true
    this.selectedIndex = 0
    this.lastColumn = 0
    this.buildScreen()
    this.setupKeyboard()
    this.refreshAllCards()
  }

  close(): void {
    if (!this.openState) {
      return
    }
    this.clearKeyboard()
    this.openState = false
    this.panelContainer?.destroy()
    this.overlay?.destroy()
    this.panelContainer = null
    this.overlay = null
    this.statusText = null
    this.backText = null
    this.backBorder = null
    this.backBackground = null
    this.cards = []
    this.callbacks.onClose?.()
  }

  private buildScreen(): void {
    this.overlay = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x020617,
      0.9,
    )
    this.overlay.setDepth(SEAL_UI_DEPTH)
    this.overlay.setInteractive()
    this.overlay.on('pointerdown', () => {
      this.close()
    })

    const border = this.scene.add.rectangle(
      0,
      0,
      SEAL_PANEL_WIDTH + 6,
      SEAL_PANEL_HEIGHT + 6,
      SHOP_PANEL_BORDER_COLOR,
    )
    const panel = this.scene.add.rectangle(
      0,
      0,
      SEAL_PANEL_WIDTH,
      SEAL_PANEL_HEIGHT,
      SHOP_PANEL_COLOR,
    )
    panel.setInteractive()

    const title = this.scene.add.text(0, -SEAL_PANEL_HEIGHT / 2 + 34, 'SEAL SKILLS', {
      fontFamily: FONT_FAMILY_HEADING,
      fontSize: '20px',
      color: '#fde68a',
    })
    title.setOrigin(0.5)

    // Back はキーボード選択にも対応するので枠＋背景を持つ
    const backCenterX = -SEAL_PANEL_WIDTH / 2 + 58
    const backCenterY = -SEAL_PANEL_HEIGHT / 2 + 34
    const backWidth = 84
    const backHeight = 26

    this.backBorder = this.scene.add.rectangle(
      backCenterX,
      backCenterY,
      backWidth + 4,
      backHeight + 4,
      SHOP_CARD_BORDER_COLOR,
    )
    this.backBackground = this.scene.add.rectangle(
      backCenterX,
      backCenterY,
      backWidth,
      backHeight,
      SHOP_CARD_COLOR,
    )
    this.backBackground.setInteractive({ useHandCursor: true })

    this.backText = this.scene.add.text(backCenterX, backCenterY, '✕ Back', {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '14px',
      color: '#cbd5e1',
    })
    this.backText.setOrigin(0.5)

    this.backBackground.on('pointerover', () => {
      this.selectItem(this.getBackSelectionIndex())
    })
    this.backBackground.on('pointerdown', () => {
      this.close()
    })

    const contents: Phaser.GameObjects.GameObject[] = [
      border,
      panel,
      title,
      this.backBorder,
      this.backBackground,
      this.backText,
    ]
    this.cards = []
    for (let index = 0; index < SEALABLE_SKILLS.length; index++) {
      const column = index % 2
      const row = Math.floor(index / 2)
      const x =
        (column === 0 ? -1 : 1) * (SEAL_CARD_WIDTH / 2 + SEAL_CARD_GAP_X / 2)
      const y = -130 + row * (SEAL_CARD_HEIGHT + SEAL_CARD_GAP_Y)
      const card = this.createCard(SEALABLE_SKILLS[index], index, x, y)
      this.cards.push(card)
      contents.push(card.container)
    }

    this.statusText = this.scene.add.text(0, SEAL_PANEL_HEIGHT / 2 - 46, '', {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '13px',
      color: '#a7f3d0',
      align: 'center',
      // 長いメッセージはパネル内で折り返す
      wordWrap: { width: SEAL_PANEL_WIDTH - 40 },
    })
    this.statusText.setOrigin(0.5)
    contents.push(this.statusText)

    const hint = this.scene.add.text(
      0,
      SEAL_PANEL_HEIGHT / 2 - 20,
      'WASD / Arrows select  ·  SPACE / ENTER toggle  ·  ESC back',
      { fontFamily: FONT_FAMILY_UI, fontSize: '12px', color: '#64748b' },
    )
    hint.setOrigin(0.5)
    shrinkTextToFitWidth(hint, SEAL_PANEL_WIDTH - 40)
    contents.push(hint)

    this.panelContainer = this.scene.add.container(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      contents,
    )
    this.panelContainer.setDepth(SEAL_UI_DEPTH + 1)
  }

  private createCard(
    def: SealableSkillDef,
    index: number,
    x: number,
    y: number,
  ): SealCardView {
    const border = this.scene.add.rectangle(
      0,
      0,
      SEAL_CARD_WIDTH + 4,
      SEAL_CARD_HEIGHT + 4,
      SHOP_CARD_BORDER_COLOR,
    )
    const background = this.scene.add.rectangle(
      0,
      0,
      SEAL_CARD_WIDTH,
      SEAL_CARD_HEIGHT,
      SHOP_CARD_COLOR,
    )
    background.setInteractive({ useHandCursor: true })

    const title = this.scene.add.text(-SEAL_CARD_WIDTH / 2 + 16, 0, def.title, {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '17px',
      color: '#ffffff',
      fontStyle: 'bold',
    })
    title.setOrigin(0, 0.5)
    // 右側の SEALED / OPEN 表示と重ならない幅までに抑える
    shrinkTextToFitWidth(title, SEAL_CARD_WIDTH - 32 - 90)

    const stateText = this.scene.add.text(SEAL_CARD_WIDTH / 2 - 16, 0, '', {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '13px',
      color: '#94a3b8',
      fontStyle: 'bold',
    })
    stateText.setOrigin(1, 0.5)

    const container = this.scene.add.container(x, y, [
      border,
      background,
      title,
      stateText,
    ])

    background.on('pointerover', () => {
      this.lastColumn = index % 2
      this.selectItem(index)
    })
    background.on('pointerdown', () => {
      this.selectItem(index)
      this.toggleSelectedSkill()
    })

    return { def, container, border, background, stateText }
  }

  private isSkillAvailable(def: SealableSkillDef): boolean {
    if (def.id === 'damage' || def.id === 'fireRate' || def.id === 'range') {
      return true
    }
    if (
      def.id === 'move' ||
      def.id === 'magnet' ||
      def.id === 'xpBonus'
    ) {
      return isSkillUnlocked(def.id)
    }
    return false
  }

  private refreshAllCards(): void {
    const sealedIds = getSealedSkillIds()
    const slotCount = getPurchasedSealSlotCount()

    for (let index = 0; index < this.cards.length; index++) {
      const card = this.cards[index]
      if (!this.isSkillAvailable(card.def)) {
        card.stateText.setText('LOCKED')
        card.stateText.setColor('#64748b')
      } else if (sealedIds.includes(card.def.id)) {
        card.stateText.setText('SEALED')
        card.stateText.setColor('#fca5a5')
      } else {
        card.stateText.setText('ACTIVE')
        card.stateText.setColor('#86efac')
      }
    }

    if (this.statusText !== null) {
      this.statusText.setText(`Sealed: ${sealedIds.length} / ${slotCount}`)
    }
    this.refreshSelectionVisual()
  }

  // Back はカード一覧の次の選択番号として扱う
  private getBackSelectionIndex(): number {
    return this.cards.length
  }

  private isBackSelected(): boolean {
    return this.selectedIndex === this.getBackSelectionIndex()
  }

  private getCardRowCount(): number {
    return Math.ceil(this.cards.length / 2)
  }

  /** 指定した行・列にカードがなければ、その行に存在する最後のカードを返す。 */
  private getCardIndexInRow(row: number, column: number): number {
    const rowStart = row * 2
    const requestedIndex = rowStart + column
    if (requestedIndex < this.cards.length) {
      return requestedIndex
    }
    return Math.min(rowStart, this.cards.length - 1)
  }

  private refreshSelectionVisual(): void {
    for (let index = 0; index < this.cards.length; index++) {
      const selected = index === this.selectedIndex
      this.cards[index].border.setFillStyle(
        selected ? SHOP_CARD_SELECTED_BORDER_COLOR : SHOP_CARD_BORDER_COLOR,
      )
      this.cards[index].background.setFillStyle(
        selected ? SHOP_CARD_HOVER_COLOR : SHOP_CARD_COLOR,
      )
    }

    const backSelected = this.isBackSelected()
    if (this.backBorder !== null) {
      this.backBorder.setFillStyle(
        backSelected ? SHOP_CARD_SELECTED_BORDER_COLOR : SHOP_CARD_BORDER_COLOR,
      )
    }
    if (this.backBackground !== null) {
      this.backBackground.setFillStyle(
        backSelected ? SHOP_CARD_HOVER_COLOR : SHOP_CARD_COLOR,
      )
    }
    if (this.backText !== null) {
      this.backText.setColor(backSelected ? '#ffffff' : '#cbd5e1')
    }
  }

  private toggleSelectedSkill(): void {
    // Back 選択中の決定は画面を閉じる
    if (this.isBackSelected()) {
      this.close()
      return
    }

    const card = this.cards[this.selectedIndex]
    if (card === undefined || !this.isSkillAvailable(card.def)) {
      this.showStatus('This skill is still locked', '#94a3b8')
      return
    }

    const sealedIds = getSealedSkillIds()
    const isSealed = sealedIds.includes(card.def.id)
    const didSave = setSkillSealed(card.def.id, !isSealed)
    if (!didSave) {
      this.showStatus('Buy a Seal Slot in the Shop', '#fca5a5')
      return
    }
    // シールの付け外しが成功したときだけ決定音を鳴らす
    this.callbacks.onSealed?.()
    this.refreshAllCards()
  }

  /** 選択先が変わったときだけ、見た目を更新して移動音を鳴らす。 */
  private selectItem(nextIndex: number): void {
    if (nextIndex === this.selectedIndex) {
      return
    }
    this.selectedIndex = nextIndex
    this.callbacks.onSelectionChanged?.()
    this.refreshSelectionVisual()
  }

  private showStatus(message: string, color: string): void {
    if (this.statusText === null) {
      return
    }
    this.statusText.setText(message)
    this.statusText.setColor(color)
  }

  // 縦の並び順は Back → 各カード段 → Back の循環
  private moveVertical(direction: number): void {
    if (this.isBackSelected()) {
      if (direction > 0) {
        // Back から下へ → 上段（最後にいた列）
        this.selectItem(this.getCardIndexInRow(0, this.lastColumn))
      } else {
        // Back から上へ → 最下段（最後にいた列）
        const lastRow = this.getCardRowCount() - 1
        this.selectItem(this.getCardIndexInRow(lastRow, this.lastColumn))
      }
      return
    }

    this.lastColumn = this.selectedIndex % 2
    const row = Math.floor(this.selectedIndex / 2)
    const nextRow = row + direction
    const lastRow = this.getCardRowCount() - 1

    if (nextRow < 0 || nextRow > lastRow) {
      // 最上段から上へ／最下段から下へ → Back
      this.selectItem(this.getBackSelectionIndex())
    } else {
      this.selectItem(this.getCardIndexInRow(nextRow, this.lastColumn))
    }
  }

  private moveHorizontal(direction: number): void {
    // Back の行は1つだけなので左右移動はしない
    if (this.isBackSelected()) {
      return
    }
    const rowStart = Math.floor(this.selectedIndex / 2) * 2
    const column = this.selectedIndex % 2
    const nextColumn = (column + direction + 2) % 2
    const nextIndex = rowStart + nextColumn
    if (nextIndex < this.cards.length) {
      this.lastColumn = nextColumn
      this.selectItem(nextIndex)
    }
  }

  private setupKeyboard(): void {
    const keyboard = this.scene.input.keyboard
    if (keyboard === null) {
      return
    }
    this.keyW = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
    this.keyA = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
    this.keyS = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
    this.keyD = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    this.keyUp = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP)
    this.keyDown = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN)
    this.keyLeft = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT)
    this.keyRight = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT)
    this.keySpace = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.keyEnter = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    this.keyEsc = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)

    this.keyW.on('down', this.onUp)
    this.keyUp.on('down', this.onUp)
    this.keyS.on('down', this.onDown)
    this.keyDown.on('down', this.onDown)
    this.keyA.on('down', this.onLeft)
    this.keyLeft.on('down', this.onLeft)
    this.keyD.on('down', this.onRight)
    this.keyRight.on('down', this.onRight)
    this.keySpace.on('down', this.onConfirm)
    this.keyEnter.on('down', this.onConfirm)
    this.keyEsc.on('down', this.onEscape)
  }

  private clearKeyboard(): void {
    this.keyW?.off('down', this.onUp)
    this.keyUp?.off('down', this.onUp)
    this.keyS?.off('down', this.onDown)
    this.keyDown?.off('down', this.onDown)
    this.keyA?.off('down', this.onLeft)
    this.keyLeft?.off('down', this.onLeft)
    this.keyD?.off('down', this.onRight)
    this.keyRight?.off('down', this.onRight)
    this.keySpace?.off('down', this.onConfirm)
    this.keyEnter?.off('down', this.onConfirm)
    this.keyEsc?.off('down', this.onEscape)
  }

  private readonly onUp = (): void => this.moveVertical(-1)
  private readonly onDown = (): void => this.moveVertical(1)
  private readonly onLeft = (): void => this.moveHorizontal(-1)
  private readonly onRight = (): void => this.moveHorizontal(1)
  private readonly onConfirm = (): void => this.toggleSelectedSkill()
  private readonly onEscape = (): void => this.close()
}
