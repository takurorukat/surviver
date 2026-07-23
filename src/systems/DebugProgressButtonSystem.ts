import Phaser from 'phaser'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  FONT_FAMILY_UI,
} from '../GameConstants'
import {
  applyDebugClearedProgress,
  type DebugClearedProgressLevel,
} from './UnlockSaveSystem'

// =============================================================================
// タイトル右下（BGM の左）のデバッグ進行ボタン
// Plains / Forest / Volcano / Dungeon までクリアした状態を選べる
// メニュー内はマウス／キーボード両対応。Back で閉じる
// =============================================================================

export type DebugProgressButtonView = {
  destroy: () => void
  isMenuOpen: () => boolean
  closeMenu: () => void
  openMenu: () => void
  setSelected: (selected: boolean) => void
}

type ProgressOption = {
  level: DebugClearedProgressLevel
  label: string
}

const PROGRESS_OPTIONS: ProgressOption[] = [
  { level: 'plains', label: 'Cleared up to Plains' },
  { level: 'forest', label: 'Cleared up to Forest' },
  { level: 'volcano', label: 'Cleared up to Volcano' },
  { level: 'ruins', label: 'Cleared up to Dungeon' },
]

// 最後の行は Back
const BACK_ROW_INDEX = PROGRESS_OPTIONS.length
const TOTAL_ROWS = PROGRESS_OPTIONS.length + 1

type MenuRow = {
  background: Phaser.GameObjects.Rectangle
  label: Phaser.GameObjects.Text
}

export function createDebugProgressButton(
  scene: Phaser.Scene,
  onApplied: () => void,
  onFocus?: () => void,
): DebugProgressButtonView {
  // BGM は (GAME_WIDTH - 30, GAME_HEIGHT - 30)。その左隣
  const centerX = GAME_WIDTH - 100
  const centerY = GAME_HEIGHT - 30
  const iconColor = 0xd4d4d8
  const depth = 520
  const rowNormalColor = 0x1e293b
  const rowSelectedColor = 0x475569

  const circle = scene.add.circle(centerX, centerY, 19, 0x111111, 0)
  circle.setStrokeStyle(2, iconColor)
  circle.setInteractive({ useHandCursor: true })
  circle.setDepth(depth)

  const labelText = scene.add.text(centerX, centerY, 'DBG', {
    fontFamily: FONT_FAMILY_UI,
    fontSize: '12px',
    color: '#d4d4d8',
    fontStyle: 'bold',
  })
  labelText.setOrigin(0.5)
  labelText.setDepth(depth)

  const captionText = scene.add.text(centerX, centerY - 30, 'DEBUG', {
    fontFamily: FONT_FAMILY_UI,
    fontSize: '11px',
    color: '#d4d4d8',
  })
  captionText.setOrigin(0.5)
  captionText.setDepth(depth)

  let menuOpen = false
  let isSelected = false
  let menuObjects: Phaser.GameObjects.GameObject[] = []
  let menuRows: MenuRow[] = []
  let selectedRowIndex = 0
  let keyUp: Phaser.Input.Keyboard.Key | null = null
  let keyDown: Phaser.Input.Keyboard.Key | null = null
  let keyW: Phaser.Input.Keyboard.Key | null = null
  let keyS: Phaser.Input.Keyboard.Key | null = null
  let keySpace: Phaser.Input.Keyboard.Key | null = null
  let keyEnter: Phaser.Input.Keyboard.Key | null = null
  let keyEsc: Phaser.Input.Keyboard.Key | null = null

  const refreshStroke = (): void => {
    circle.setStrokeStyle(2, isSelected ? 0xfde68a : iconColor)
  }

  const refreshRowVisuals = (): void => {
    for (let index = 0; index < menuRows.length; index++) {
      const row = menuRows[index]
      const isRowSelected = index === selectedRowIndex
      row.background.setFillStyle(
        isRowSelected ? rowSelectedColor : rowNormalColor,
        0.95,
      )
      row.background.setStrokeStyle(
        isRowSelected ? 2 : 0,
        isRowSelected ? 0xfde68a : 0x000000,
      )
      if (index === BACK_ROW_INDEX) {
        row.label.setColor(isRowSelected ? '#fde68a' : '#a1a1aa')
      } else {
        row.label.setColor(isRowSelected ? '#fef3c7' : '#e5e7eb')
      }
    }
  }

  const unbindMenuKeys = (): void => {
    if (keyUp !== null) {
      keyUp.off('down', moveSelectionUp)
    }
    if (keyDown !== null) {
      keyDown.off('down', moveSelectionDown)
    }
    if (keyW !== null) {
      keyW.off('down', moveSelectionUp)
    }
    if (keyS !== null) {
      keyS.off('down', moveSelectionDown)
    }
    if (keySpace !== null) {
      keySpace.off('down', confirmSelection)
    }
    if (keyEnter !== null) {
      keyEnter.off('down', confirmSelection)
    }
    if (keyEsc !== null) {
      keyEsc.off('down', closeMenu)
    }
    keyUp = null
    keyDown = null
    keyW = null
    keyS = null
    keySpace = null
    keyEnter = null
    keyEsc = null
  }

  const destroyMenu = (): void => {
    unbindMenuKeys()
    for (let index = 0; index < menuObjects.length; index++) {
      menuObjects[index].destroy()
    }
    menuObjects = []
    menuRows = []
    menuOpen = false
  }

  const closeMenu = (): void => {
    destroyMenu()
  }

  const moveSelectionUp = (): void => {
    if (!menuOpen) {
      return
    }
    selectedRowIndex = selectedRowIndex - 1
    if (selectedRowIndex < 0) {
      selectedRowIndex = TOTAL_ROWS - 1
    }
    refreshRowVisuals()
  }

  const moveSelectionDown = (): void => {
    if (!menuOpen) {
      return
    }
    selectedRowIndex = selectedRowIndex + 1
    if (selectedRowIndex >= TOTAL_ROWS) {
      selectedRowIndex = 0
    }
    refreshRowVisuals()
  }

  const confirmSelection = (): void => {
    if (!menuOpen) {
      return
    }
    if (selectedRowIndex === BACK_ROW_INDEX) {
      closeMenu()
      return
    }
    const option = PROGRESS_OPTIONS[selectedRowIndex]
    if (option === undefined) {
      return
    }
    applyDebugClearedProgress(option.level)
    closeMenu()
    onApplied()
  }

  const bindMenuKeys = (): void => {
    if (scene.input.keyboard === null) {
      return
    }
    const keyCodes = Phaser.Input.Keyboard.KeyCodes
    keyUp = scene.input.keyboard.addKey(keyCodes.UP)
    keyDown = scene.input.keyboard.addKey(keyCodes.DOWN)
    keyW = scene.input.keyboard.addKey(keyCodes.W)
    keyS = scene.input.keyboard.addKey(keyCodes.S)
    keySpace = scene.input.keyboard.addKey(keyCodes.SPACE)
    keyEnter = scene.input.keyboard.addKey(keyCodes.ENTER)
    keyEsc = scene.input.keyboard.addKey(keyCodes.ESC)

    keyUp.on('down', moveSelectionUp)
    keyDown.on('down', moveSelectionDown)
    keyW.on('down', moveSelectionUp)
    keyS.on('down', moveSelectionDown)
    keySpace.on('down', confirmSelection)
    keyEnter.on('down', confirmSelection)
    keyEsc.on('down', closeMenu)
  }

  const openMenu = (): void => {
    if (menuOpen) {
      closeMenu()
      return
    }
    menuOpen = true
    selectedRowIndex = 0

    const menuDepth = depth + 20
    const panelWidth = 260
    const rowHeight = 34
    const panelPadding = 10
    const titleHeight = 28
    const panelHeight =
      panelPadding * 2 + titleHeight + TOTAL_ROWS * rowHeight + 22
    const panelCenterX = centerX - 40
    const panelCenterY = centerY - panelHeight / 2 - 36

    // パネル外クリックで閉じる用の半透明フルスクリーン
    const dimHit = scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.35,
    )
    dimHit.setDepth(menuDepth)
    dimHit.setInteractive()
    dimHit.on('pointerdown', () => {
      closeMenu()
    })
    menuObjects.push(dimHit)

    const panel = scene.add.rectangle(
      panelCenterX,
      panelCenterY,
      panelWidth,
      panelHeight,
      0x111827,
      0.96,
    )
    panel.setStrokeStyle(2, 0x94a3b8)
    panel.setDepth(menuDepth + 1)
    panel.setInteractive()
    menuObjects.push(panel)

    const title = scene.add.text(
      panelCenterX,
      panelCenterY - panelHeight / 2 + panelPadding + 12,
      'Debug Progress',
      {
        fontFamily: FONT_FAMILY_UI,
        fontSize: '14px',
        color: '#fde68a',
        fontStyle: 'bold',
      },
    )
    title.setOrigin(0.5)
    title.setDepth(menuDepth + 2)
    menuObjects.push(title)

    const hint = scene.add.text(
      panelCenterX,
      panelCenterY + panelHeight / 2 - 10,
      'W/S · Arrows  /  SPACE confirm  /  ESC back',
      {
        fontFamily: FONT_FAMILY_UI,
        fontSize: '10px',
        color: '#71717a',
      },
    )
    hint.setOrigin(0.5, 1)
    hint.setDepth(menuDepth + 2)
    menuObjects.push(hint)

    const listTopY =
      panelCenterY - panelHeight / 2 + panelPadding + titleHeight + 4
    menuRows = []

    for (let index = 0; index < PROGRESS_OPTIONS.length; index++) {
      const option = PROGRESS_OPTIONS[index]
      const rowY = listTopY + index * rowHeight + rowHeight / 2
      const rowBg = scene.add.rectangle(
        panelCenterX,
        rowY,
        panelWidth - 16,
        rowHeight - 4,
        rowNormalColor,
        0.95,
      )
      rowBg.setDepth(menuDepth + 2)
      rowBg.setInteractive({ useHandCursor: true })
      menuObjects.push(rowBg)

      const rowLabel = scene.add.text(panelCenterX, rowY, option.label, {
        fontFamily: FONT_FAMILY_UI,
        fontSize: '13px',
        color: '#e5e7eb',
      })
      rowLabel.setOrigin(0.5)
      rowLabel.setDepth(menuDepth + 3)
      menuObjects.push(rowLabel)

      const rowIndex = index
      rowBg.on('pointerover', () => {
        selectedRowIndex = rowIndex
        refreshRowVisuals()
      })
      rowBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event.stopPropagation()
        selectedRowIndex = rowIndex
        confirmSelection()
      })

      menuRows.push({ background: rowBg, label: rowLabel })
    }

    // Back 行
    const backY = listTopY + BACK_ROW_INDEX * rowHeight + rowHeight / 2
    const backBg = scene.add.rectangle(
      panelCenterX,
      backY,
      panelWidth - 16,
      rowHeight - 4,
      rowNormalColor,
      0.95,
    )
    backBg.setDepth(menuDepth + 2)
    backBg.setInteractive({ useHandCursor: true })
    menuObjects.push(backBg)

    const backLabel = scene.add.text(panelCenterX, backY, '← Back', {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '13px',
      color: '#a1a1aa',
    })
    backLabel.setOrigin(0.5)
    backLabel.setDepth(menuDepth + 3)
    menuObjects.push(backLabel)

    backBg.on('pointerover', () => {
      selectedRowIndex = BACK_ROW_INDEX
      refreshRowVisuals()
    })
    backBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation()
      selectedRowIndex = BACK_ROW_INDEX
      confirmSelection()
    })
    menuRows.push({ background: backBg, label: backLabel })

    refreshRowVisuals()
    bindMenuKeys()
  }

  const setSelected = (selected: boolean): void => {
    isSelected = selected
    refreshStroke()
  }

  circle.on('pointerover', () => {
    onFocus?.()
  })

  circle.on('pointerdown', () => {
    onFocus?.()
    openMenu()
  })

  refreshStroke()

  return {
    destroy: () => {
      closeMenu()
      circle.destroy()
      labelText.destroy()
      captionText.destroy()
    },
    isMenuOpen: () => menuOpen,
    closeMenu,
    openMenu,
    setSelected,
  }
}
