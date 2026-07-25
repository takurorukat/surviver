// ============================================================
// タイトル画面の永続強化ショップ
// ------------------------------------------------------------
// 2×2の商品カードをマウスまたは WASD / 矢印で選び、
// SPACE / ENTER で購入する。価格は 5G, 10G, 15G...。
// ============================================================

import Phaser from 'phaser'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  SHOP_UI_DEPTH,
  SHOP_PANEL_WIDTH,
  SHOP_PANEL_HEIGHT,
  SHOP_PANEL_COLOR,
  SHOP_PANEL_BORDER_COLOR,
  SHOP_CARD_WIDTH,
  SHOP_CARD_HEIGHT,
  SHOP_CARD_GAP_X,
  SHOP_CARD_GAP_Y,
  SHOP_CARD_COLOR,
  SHOP_CARD_HOVER_COLOR,
  SHOP_CARD_BORDER_COLOR,
  SHOP_CARD_SELECTED_BORDER_COLOR,
  SHOP_AFFORDABLE_COLOR,
  SHOP_UNAFFORDABLE_COLOR,
  SHOP_OPEN_TWEEN_MS,
  SHOP_PURCHASE_PULSE_MS,
  INITIAL_PRIMARY_SKILL_LEVEL_CAP,
  FONT_FAMILY_HEADING,
  FONT_FAMILY_UI,
} from '../GameConstants'
import {
  getGold,
  getShopUpgrades,
  getPurchasedMaxHp,
  getShopUpgradePrice,
  purchaseShopUpgrade,
  getPurchasedPowerCap,
  getPurchasedSpeedCap,
  getPurchasedRangeCap,
  getPurchasedPierceCap,
  getPurchasedBlastCap,
  getPurchasedXpBonusCap,
  type ShopUpgradeId,
} from './UnlockSaveSystem'
import { isSkillUnlocked } from './AchievementSystem'
import { shrinkTextToFitWidth, fitTextInBounds } from '../utils/fitTextToWidth'

type ShopItemDef = {
  id: ShopUpgradeId
  title: string
  effect: string
}

type ShopCardView = {
  def: ShopItemDef
  container: Phaser.GameObjects.Container
  border: Phaser.GameObjects.Rectangle
  background: Phaser.GameObjects.Rectangle
  levelText: Phaser.GameObjects.Text
  priceText: Phaser.GameObjects.Text
}

export type ShopSystemCallbacks = {
  onGoldChanged?: () => void
  onPurchased?: () => void
  // ゴールド不足などで買えなかったとき（Back と同じキャンセル音用）
  onPurchaseFailed?: () => void
  onSelectionChanged?: () => void
  onClose?: () => void
}

const BASE_SHOP_ITEMS: ShopItemDef[] = [
  { id: 'maxHp', title: 'Max HP', effect: 'Start every run with +1 HP' },
  { id: 'sealSlots', title: 'Seal Slot', effect: 'Seal one more level-up skill' },
  { id: 'powerCap', title: 'Power Cap', effect: 'Power level limit +1' },
  { id: 'speedCap', title: 'Speed Cap', effect: 'Speed level limit +1' },
  { id: 'rangeCap', title: 'Range Cap', effect: 'Range level limit +1' },
]

/** 実績で入手済みのスキルだけ、対応する上限強化をショップへ追加する。 */
function getAvailableShopItems(): ShopItemDef[] {
  const items = [...BASE_SHOP_ITEMS]
  if (isSkillUnlocked('pierce')) {
    items.push({
      id: 'pierceCap',
      title: 'Pierce Cap',
      effect: 'Pierce level limit +1',
    })
  }
  if (isSkillUnlocked('blast')) {
    items.push({
      id: 'blastCap',
      title: 'Blast Cap',
      effect: 'Blast level limit +1',
    })
  }
  if (isSkillUnlocked('xpBonus')) {
    items.push({
      id: 'xpBonusCap',
      title: 'XP Bonus Cap',
      effect: 'XP Bonus level limit +1',
    })
  }
  return items
}

export class ShopSystem {
  private scene: Phaser.Scene
  private callbacks: ShopSystemCallbacks
  private openState = false
  private selectedIndex = 0
  // Back とカード段を行き来したとき、左右どちらの列にいたかを覚えておく
  private lastColumn = 0
  private overlay: Phaser.GameObjects.Rectangle | null = null
  private panelContainer: Phaser.GameObjects.Container | null = null
  private goldText: Phaser.GameObjects.Text | null = null
  private statusText: Phaser.GameObjects.Text | null = null
  private cards: ShopCardView[] = []
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

  constructor(scene: Phaser.Scene, callbacks: ShopSystemCallbacks = {}) {
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
    this.buildShop()
    this.setupKeyboard()
    this.refreshAllCards()

    if (this.panelContainer !== null) {
      this.panelContainer.setScale(0.96)
      this.panelContainer.setAlpha(0)
      this.scene.tweens.add({
        targets: this.panelContainer,
        scaleX: 1,
        scaleY: 1,
        alpha: 1,
        duration: SHOP_OPEN_TWEEN_MS,
        ease: 'Back.Out',
      })
    }
  }

  close(): void {
    if (!this.openState) {
      return
    }

    this.clearKeyboard()
    this.openState = false
    this.destroyShop()
    if (this.callbacks.onClose !== undefined) {
      this.callbacks.onClose()
    }
  }

  private buildShop(): void {
    this.overlay = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x020617,
      0.9,
    )
    this.overlay.setDepth(SHOP_UI_DEPTH)
    this.overlay.setScrollFactor(0)
    this.overlay.setInteractive()
    // 枠の外（暗い背景）をクリックしたら Back と同じく閉じる
    this.overlay.on('pointerdown', () => {
      this.close()
    })

    const border = this.scene.add.rectangle(
      0,
      0,
      SHOP_PANEL_WIDTH + 6,
      SHOP_PANEL_HEIGHT + 6,
      SHOP_PANEL_BORDER_COLOR,
    )
    const panel = this.scene.add.rectangle(
      0,
      0,
      SHOP_PANEL_WIDTH,
      SHOP_PANEL_HEIGHT,
      SHOP_PANEL_COLOR,
    )
    panel.setInteractive()

    const title = this.scene.add.text(0, -SHOP_PANEL_HEIGHT / 2 + 34, 'SHOP', {
      fontFamily: FONT_FAMILY_HEADING,
      fontSize: '22px',
      color: '#fde68a',
    })
    title.setOrigin(0.5)

    this.goldText = this.scene.add.text(
      SHOP_PANEL_WIDTH / 2 - 24,
      -SHOP_PANEL_HEIGHT / 2 + 36,
      '',
      {
        fontFamily: FONT_FAMILY_UI,
        fontSize: '15px',
        color: '#facc15',
        fontStyle: 'bold',
      },
    )
    this.goldText.setOrigin(1, 0.5)

    // Back ボタン（キーボード選択にも対応するので枠＋背景を持つ）
    const backCenterX = -SHOP_PANEL_WIDTH / 2 + 58
    const backCenterY = -SHOP_PANEL_HEIGHT / 2 + 34
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
      this.goldText,
      this.backBorder,
      this.backBackground,
      this.backText,
    ]

    this.cards = []
    const availableItems = getAvailableShopItems()
    for (let index = 0; index < availableItems.length; index++) {
      const column = index % 2
      const row = Math.floor(index / 2)
      const x =
        (column === 0 ? -1 : 1) * (SHOP_CARD_WIDTH / 2 + SHOP_CARD_GAP_X / 2)
      const y = -140 + row * (SHOP_CARD_HEIGHT + SHOP_CARD_GAP_Y)
      const card = this.createCard(availableItems[index], index, x, y)
      this.cards.push(card)
      contents.push(card.container)
    }

    this.statusText = this.scene.add.text(0, SHOP_PANEL_HEIGHT / 2 - 46, '', {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '13px',
      color: '#a7f3d0',
      align: 'center',
      // 長いメッセージはパネル内で折り返す
      wordWrap: { width: SHOP_PANEL_WIDTH - 40 },
    })
    this.statusText.setOrigin(0.5)
    contents.push(this.statusText)

    const hint = this.scene.add.text(
      0,
      SHOP_PANEL_HEIGHT / 2 - 20,
      'WASD / Arrows select  ·  SPACE / ENTER buy  ·  ESC back',
      {
        fontFamily: FONT_FAMILY_UI,
        fontSize: '12px',
        color: '#64748b',
      },
    )
    hint.setOrigin(0.5)
    shrinkTextToFitWidth(hint, SHOP_PANEL_WIDTH - 40)
    contents.push(hint)

    this.panelContainer = this.scene.add.container(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      contents,
    )
    this.panelContainer.setDepth(SHOP_UI_DEPTH + 1)
    this.panelContainer.setScrollFactor(0)
  }

  private createCard(
    def: ShopItemDef,
    index: number,
    x: number,
    y: number,
  ): ShopCardView {
    const border = this.scene.add.rectangle(
      0,
      0,
      SHOP_CARD_WIDTH + 4,
      SHOP_CARD_HEIGHT + 4,
      SHOP_CARD_BORDER_COLOR,
    )
    const background = this.scene.add.rectangle(
      0,
      0,
      SHOP_CARD_WIDTH,
      SHOP_CARD_HEIGHT,
      SHOP_CARD_COLOR,
    )
    background.setInteractive({ useHandCursor: true })

    const title = this.scene.add.text(-SHOP_CARD_WIDTH / 2 + 16, -27, def.title, {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '19px',
      color: '#ffffff',
      fontStyle: 'bold',
    })
    title.setOrigin(0, 0.5)
    shrinkTextToFitWidth(title, SHOP_CARD_WIDTH - 32)

    const effect = this.scene.add.text(-SHOP_CARD_WIDTH / 2 + 16, -4, def.effect, {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '12px',
      color: '#cbd5e1',
      // 長い説明はカード内で折り返す
      wordWrap: { width: SHOP_CARD_WIDTH - 32 },
    })
    effect.setOrigin(0, 0.5)
    fitTextInBounds(effect, {
      maxWidth: SHOP_CARD_WIDTH - 32,
      maxHeight: 28,
      wrap: true,
    })

    const levelText = this.scene.add.text(-SHOP_CARD_WIDTH / 2 + 16, 24, '', {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '13px',
      color: '#94a3b8',
    })
    levelText.setOrigin(0, 0.5)

    const priceText = this.scene.add.text(SHOP_CARD_WIDTH / 2 - 16, 24, '', {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '15px',
      color: SHOP_AFFORDABLE_COLOR,
      fontStyle: 'bold',
    })
    priceText.setOrigin(1, 0.5)

    const container = this.scene.add.container(x, y, [
      border,
      background,
      title,
      effect,
      levelText,
      priceText,
    ])

    background.on('pointerover', () => {
      this.selectItem(index)
    })
    background.on('pointerdown', () => {
      this.selectItem(index)
      this.tryPurchaseSelected()
    })

    return {
      def,
      container,
      border,
      background,
      levelText,
      priceText,
    }
  }

  private refreshAllCards(): void {
    const upgrades = getShopUpgrades()
    const gold = getGold()
    if (this.goldText !== null) {
      this.goldText.setText(`● ${gold} G`)
    }

    for (let index = 0; index < this.cards.length; index++) {
      const card = this.cards[index]
      const purchases = upgrades[card.def.id]
      const price = getShopUpgradePrice(card.def.id)
      let currentValue = INITIAL_PRIMARY_SKILL_LEVEL_CAP + purchases
      if (card.def.id === 'maxHp') {
        // ショップ購入分 + エリアクリアボーナス込みの開始 HP
        currentValue = getPurchasedMaxHp()
      } else if (card.def.id === 'powerCap') {
        currentValue = getPurchasedPowerCap()
      } else if (card.def.id === 'speedCap') {
        currentValue = getPurchasedSpeedCap()
      } else if (card.def.id === 'rangeCap') {
        currentValue = getPurchasedRangeCap()
      } else if (card.def.id === 'sealSlots') {
        currentValue = purchases
      } else if (card.def.id === 'pierceCap') {
        currentValue = getPurchasedPierceCap()
      } else if (card.def.id === 'blastCap') {
        currentValue = getPurchasedBlastCap()
      } else if (card.def.id === 'xpBonusCap') {
        currentValue = getPurchasedXpBonusCap()
      }
      card.levelText.setText(`Current: ${currentValue}  →  ${currentValue + 1}`)
      shrinkTextToFitWidth(card.levelText, SHOP_CARD_WIDTH - 32 - 90)
      card.priceText.setText(`${price} G`)
      shrinkTextToFitWidth(card.priceText, 80)
      if (gold >= price) {
        card.priceText.setColor(SHOP_AFFORDABLE_COLOR)
      } else {
        card.priceText.setColor(SHOP_UNAFFORDABLE_COLOR)
      }
    }
    this.refreshSelectionVisual()
  }

  // Back はカード4枚の次の選択番号として扱う
  private getBackSelectionIndex(): number {
    return this.cards.length
  }

  private isBackSelected(): boolean {
    return this.selectedIndex === this.getBackSelectionIndex()
  }

  // 役割: 選択が変わったときだけ見た目を更新し、移動音を鳴らす
  private selectItem(nextIndex: number): void {
    if (nextIndex === this.selectedIndex) {
      return
    }
    this.selectedIndex = nextIndex
    this.refreshSelectionVisual()
    this.callbacks.onSelectionChanged?.()
  }

  private refreshSelectionVisual(): void {
    for (let index = 0; index < this.cards.length; index++) {
      const card = this.cards[index]
      const selected = index === this.selectedIndex
      card.border.setFillStyle(
        selected ? SHOP_CARD_SELECTED_BORDER_COLOR : SHOP_CARD_BORDER_COLOR,
      )
      card.background.setFillStyle(
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

  private tryPurchaseSelected(): void {
    // Back 選択中の決定はショップを閉じる
    if (this.isBackSelected()) {
      this.close()
      return
    }

    const card = this.cards[this.selectedIndex]
    if (card === undefined) {
      return
    }

    const result = purchaseShopUpgrade(card.def.id)
    if (!result.purchased) {
      this.showStatus('Not enough Gold', '#fca5a5')
      this.scene.cameras.main.shake(90, 0.002)
      if (this.callbacks.onPurchaseFailed !== undefined) {
        this.callbacks.onPurchaseFailed()
      }
      return
    }

    this.showStatus(`${card.def.title} upgraded!`, '#a7f3d0')
    this.scene.tweens.add({
      targets: card.container,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: SHOP_PURCHASE_PULSE_MS,
      yoyo: true,
      ease: 'Quad.Out',
    })
    this.refreshAllCards()
    if (this.callbacks.onPurchased !== undefined) {
      this.callbacks.onPurchased()
    }
    if (this.callbacks.onGoldChanged !== undefined) {
      this.callbacks.onGoldChanged()
    }
  }

  private showStatus(message: string, color: string): void {
    if (this.statusText === null) {
      return
    }
    this.statusText.setText(message)
    this.statusText.setColor(color)
    this.statusText.setAlpha(1)
    this.scene.tweens.killTweensOf(this.statusText)
    this.scene.tweens.add({
      targets: this.statusText,
      alpha: 0.35,
      duration: 500,
      yoyo: true,
      ease: 'Sine.InOut',
    })
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

  // 縦の並び順は Back → 各カード段 → Back の循環
  private moveVertical(direction: number): void {
    if (!this.openState) {
      return
    }

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
    if (!this.openState) {
      return
    }
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
    this.keyW = null
    this.keyA = null
    this.keyS = null
    this.keyD = null
    this.keyUp = null
    this.keyDown = null
    this.keyLeft = null
    this.keyRight = null
    this.keySpace = null
    this.keyEnter = null
    this.keyEsc = null
  }

  private destroyShop(): void {
    if (this.panelContainer !== null) {
      this.scene.tweens.killTweensOf(this.panelContainer)
    }
    this.panelContainer?.destroy()
    this.overlay?.destroy()
    this.panelContainer = null
    this.overlay = null
    this.goldText = null
    this.statusText = null
    this.backText = null
    this.backBorder = null
    this.backBackground = null
    this.cards = []
  }

  private readonly onUp = (): void => {
    this.moveVertical(-1)
  }
  private readonly onDown = (): void => {
    this.moveVertical(1)
  }
  private readonly onLeft = (): void => {
    this.moveHorizontal(-1)
  }
  private readonly onRight = (): void => {
    this.moveHorizontal(1)
  }
  private readonly onConfirm = (): void => {
    this.tryPurchaseSelected()
  }
  private readonly onEscape = (): void => {
    this.close()
  }
}
