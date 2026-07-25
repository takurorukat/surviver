// ============================================================
// SfxPreviewSystem.ts
// ------------------------------------------------------------
// 効果音の聴き比べ用パネル。
// Settings → SFX Preview から開く。
// 正式 SE 一覧と、波形合成 a/b/c 候補の再生画面を切り替える。
// ============================================================

import Phaser from 'phaser'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  FONT_FAMILY_HEADING,
  FONT_FAMILY_UI,
  SETTINGS_MENU_PANEL_COLOR,
  SETTINGS_MENU_BORDER_COLOR,
  SETTINGS_MENU_BUTTON_HEIGHT,
  SFX_PREVIEW_PANEL_WIDTH,
  SFX_PREVIEW_PANEL_HEIGHT,
  SFX_PREVIEW_DEPTH,
  SFX_PREVIEW_ROW_HEIGHT,
  SFX_PREVIEW_VOLUME_STEP,
  SFX_VOLUME,
  SFX_CANDIDATE_DIR,
  SFX_CANDIDATE_VARIANTS,
  type SfxCandidateVariant,
  SFX_KEY_PLAYER_FIRE_POWER,
  SFX_KEY_PLAYER_HIT_POWER,
  SFX_KEY_PLAYER_FIRE_WIND,
  SFX_KEY_PLAYER_HIT_WIND,
  SFX_KEY_PLAYER_FIRE_WATER,
  SFX_KEY_PLAYER_HIT_WATER,
  SFX_KEY_PLAYER_FIRE_FIRE,
  SFX_KEY_PLAYER_HIT_FIRE,
  SFX_KEY_PLAYER_FIRE_EARTH,
  SFX_KEY_PLAYER_HIT_EARTH,
  SFX_KEY_ENEMY_DEFEAT,
  SFX_KEY_ENEMY_HIT,
  SFX_KEY_ENEMY_BLOCKED,
  SFX_KEY_COIN_PICKUP,
  SFX_KEY_PLAYER_HURT,
  SFX_KEY_LEVEL_UP,
  SFX_KEY_STAGE_CLEAR,
  SFX_KEY_AREA_CLEAR,
  SFX_KEY_GAME_OVER,
  SFX_KEY_MENU_MOVE,
  SFX_KEY_SHOP_PURCHASE,
  SFX_KEY_MENU_CANCEL,
} from '../GameConstants'
import { GameAudioSystem } from './GameAudioSystem'
import { shrinkTextToFitWidth } from '../utils/fitTextToWidth'

export type SfxPreviewCallbacks = {
  audioSystem: GameAudioSystem
  /** パネル内オブジェクトをメインカメラのブラーから外すとき */
  onUiObjectsReady?: (objects: Phaser.GameObjects.GameObject[]) => void
  onClose?: () => void
  onCancelled?: () => void
}

type SfxPreviewEntry =
  | { kind: 'header'; label: string }
  | { kind: 'file'; label: string; note: string; audioKey: string }
  | { kind: 'openCandidates'; label: string; note: string }

type CandidateRowDef = {
  label: string
  sfxId: string
}

type SelectableRow =
  | { kind: 'volume' }
  | { kind: 'sfx'; entryIndex: number }
  | { kind: 'candidate'; rowIndex: number }
  | { kind: 'openCandidates' }
  | { kind: 'backToCatalog' }
  | { kind: 'back' }

type RowView = {
  background: Phaser.GameObjects.Rectangle
  label: Phaser.GameObjects.Text
  note: Phaser.GameObjects.Text | null
}

type PreviewMode = 'catalog' | 'candidates'

const SFX_CATALOG: SfxPreviewEntry[] = [
  { kind: 'header', label: 'Bullet Fire / Hit' },
  { kind: 'file', label: 'Power Fire', note: 'shoot', audioKey: SFX_KEY_PLAYER_FIRE_POWER },
  { kind: 'file', label: 'Power Hit', note: 'shoot', audioKey: SFX_KEY_PLAYER_HIT_POWER },
  { kind: 'file', label: 'Wind Fire', note: 'cut', audioKey: SFX_KEY_PLAYER_FIRE_WIND },
  { kind: 'file', label: 'Wind Hit', note: 'cut', audioKey: SFX_KEY_PLAYER_HIT_WIND },
  { kind: 'file', label: 'Water Fire', note: 'freeze', audioKey: SFX_KEY_PLAYER_FIRE_WATER },
  { kind: 'file', label: 'Water Hit', note: 'freeze', audioKey: SFX_KEY_PLAYER_HIT_WATER },
  { kind: 'file', label: 'Fire Fire', note: 'burn', audioKey: SFX_KEY_PLAYER_FIRE_FIRE },
  { kind: 'file', label: 'Fire Hit', note: 'burn', audioKey: SFX_KEY_PLAYER_HIT_FIRE },
  { kind: 'file', label: 'Earth Fire', note: 'impact', audioKey: SFX_KEY_PLAYER_FIRE_EARTH },
  { kind: 'file', label: 'Earth Hit', note: 'impact', audioKey: SFX_KEY_PLAYER_HIT_EARTH },
  { kind: 'header', label: 'Combat / Pickup' },
  { kind: 'file', label: 'Enemy Defeat', note: 'ogg', audioKey: SFX_KEY_ENEMY_DEFEAT },
  { kind: 'file', label: 'Enemy Hit', note: 'ogg', audioKey: SFX_KEY_ENEMY_HIT },
  { kind: 'file', label: 'Enemy Blocked', note: 'ogg', audioKey: SFX_KEY_ENEMY_BLOCKED },
  { kind: 'file', label: 'Player Hurt', note: 'ogg', audioKey: SFX_KEY_PLAYER_HURT },
  { kind: 'file', label: 'Coin Pickup', note: 'ogg', audioKey: SFX_KEY_COIN_PICKUP },
  { kind: 'header', label: 'UI / Events' },
  { kind: 'file', label: 'Menu Move', note: 'ogg', audioKey: SFX_KEY_MENU_MOVE },
  { kind: 'file', label: 'Shop Purchase', note: 'ogg', audioKey: SFX_KEY_SHOP_PURCHASE },
  { kind: 'file', label: 'Menu Cancel', note: 'ogg', audioKey: SFX_KEY_MENU_CANCEL },
  { kind: 'file', label: 'Level Up', note: 'ogg', audioKey: SFX_KEY_LEVEL_UP },
  { kind: 'file', label: 'Stage Clear', note: 'ogg', audioKey: SFX_KEY_STAGE_CLEAR },
  { kind: 'file', label: 'Area Clear', note: 'ogg', audioKey: SFX_KEY_AREA_CLEAR },
  { kind: 'file', label: 'Game Over', note: 'ogg', audioKey: SFX_KEY_GAME_OVER },
]

/** 波形合成候補の聴き比べ対象（regen_element_bullet_sfx.py と対応） */
const CANDIDATE_ROWS: CandidateRowDef[] = [
  { label: 'Enemy Defeat', sfxId: 'enemy_defeat' },
  { label: 'Enemy Hit', sfxId: 'enemy_hit' },
  { label: 'Enemy Blocked', sfxId: 'enemy_blocked' },
  { label: 'Coin Pickup', sfxId: 'coin_pickup' },
  { label: 'Player Hurt', sfxId: 'player_hurt' },
  { label: 'Menu Move', sfxId: 'menu_move' },
  { label: 'Menu Cancel', sfxId: 'menu_cancel' },
  { label: 'Shop Purchase', sfxId: 'shop_purchase' },
  { label: 'Power Fire', sfxId: 'player_fire_power' },
  { label: 'Power Hit', sfxId: 'player_hit_power' },
  { label: 'Wind Fire', sfxId: 'player_fire_wind' },
  { label: 'Wind Hit', sfxId: 'player_hit_wind' },
]

const ROW_NORMAL = 0x1e293b
const ROW_SELECTED = 0x475569
const BODY_PADDING_X = 20

export class SfxPreviewSystem {
  private scene: Phaser.Scene
  private callbacks: SfxPreviewCallbacks
  private isOpenFlag = false
  private previewVolume = SFX_VOLUME
  private selectedIndex = 0
  private mode: PreviewMode = 'catalog'
  private selectableRows: SelectableRow[] = []
  private rowViews: RowView[] = []
  private volumeLabel: Phaser.GameObjects.Text | null = null
  private ownedObjects: Phaser.GameObjects.GameObject[] = []
  // 候補行ごとの選択中バリアント（a/b/c）
  private candidateVariantByRow: SfxCandidateVariant[] = []
  private loadingCandidateKeys: Record<string, boolean> = {}

  private keyW: Phaser.Input.Keyboard.Key | null = null
  private keyS: Phaser.Input.Keyboard.Key | null = null
  private keyUp: Phaser.Input.Keyboard.Key | null = null
  private keyDown: Phaser.Input.Keyboard.Key | null = null
  private keyLeft: Phaser.Input.Keyboard.Key | null = null
  private keyRight: Phaser.Input.Keyboard.Key | null = null
  private keyA: Phaser.Input.Keyboard.Key | null = null
  private keyD: Phaser.Input.Keyboard.Key | null = null
  private keySpace: Phaser.Input.Keyboard.Key | null = null
  private keyEnter: Phaser.Input.Keyboard.Key | null = null

  private readonly onMoveUp = (): void => {
    this.moveSelection(-1)
  }
  private readonly onMoveDown = (): void => {
    this.moveSelection(1)
  }
  private readonly onLeft = (): void => {
    this.handleHorizontal(-1)
  }
  private readonly onRight = (): void => {
    this.handleHorizontal(1)
  }
  private readonly onConfirm = (): void => {
    this.confirmSelection()
  }

  constructor(scene: Phaser.Scene, callbacks: SfxPreviewCallbacks) {
    this.scene = scene
    this.callbacks = callbacks
    this.resetCandidateVariants()
  }

  isOpen(): boolean {
    return this.isOpenFlag
  }

  open(): void {
    if (this.isOpenFlag) {
      return
    }
    this.isOpenFlag = true
    this.mode = 'catalog'
    this.selectedIndex = 0
    this.buildPanel()
    this.setupKeyboard()
    this.refreshSelectionVisual()
  }

  close(playCancelSound: boolean = true): void {
    if (!this.isOpenFlag) {
      return
    }
    if (playCancelSound) {
      this.callbacks.onCancelled?.()
    }
    this.clearKeyboard()
    this.destroyPanel()
    this.isOpenFlag = false
    this.callbacks.onClose?.()
  }

  destroy(): void {
    this.clearKeyboard()
    this.destroyPanel()
    this.isOpenFlag = false
  }

  private resetCandidateVariants(): void {
    this.candidateVariantByRow = []
    for (let index = 0; index < CANDIDATE_ROWS.length; index++) {
      this.candidateVariantByRow.push('a')
    }
  }

  private buildPanel(): void {
    this.destroyPanel()
    this.selectableRows = []
    this.rowViews = []

    const centerX = GAME_WIDTH / 2
    const centerY = GAME_HEIGHT / 2
    const panelTop = centerY - SFX_PREVIEW_PANEL_HEIGHT / 2
    const panelBottom = centerY + SFX_PREVIEW_PANEL_HEIGHT / 2

    const overlay = this.scene.add.rectangle(
      centerX,
      centerY,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.55,
    )
    overlay.setDepth(SFX_PREVIEW_DEPTH)
    overlay.setScrollFactor(0)
    overlay.setInteractive()
    overlay.on('pointerdown', () => {
      this.close(true)
    })
    this.ownedObjects.push(overlay)

    const border = this.scene.add.rectangle(
      centerX,
      centerY,
      SFX_PREVIEW_PANEL_WIDTH + 4,
      SFX_PREVIEW_PANEL_HEIGHT + 4,
      SETTINGS_MENU_BORDER_COLOR,
    )
    border.setDepth(SFX_PREVIEW_DEPTH + 1)
    border.setScrollFactor(0)
    this.ownedObjects.push(border)

    const panel = this.scene.add.rectangle(
      centerX,
      centerY,
      SFX_PREVIEW_PANEL_WIDTH,
      SFX_PREVIEW_PANEL_HEIGHT,
      SETTINGS_MENU_PANEL_COLOR,
    )
    panel.setDepth(SFX_PREVIEW_DEPTH + 2)
    panel.setScrollFactor(0)
    panel.setInteractive()
    this.ownedObjects.push(panel)

    const titleText = this.mode === 'candidates' ? 'SFX Candidates' : 'SFX Preview'
    const title = this.scene.add.text(centerX, panelTop + 18, titleText, {
      fontFamily: FONT_FAMILY_HEADING,
      fontSize: '14px',
      color: '#fde68a',
    })
    title.setOrigin(0.5)
    title.setDepth(SFX_PREVIEW_DEPTH + 3)
    title.setScrollFactor(0)
    shrinkTextToFitWidth(title, SFX_PREVIEW_PANEL_WIDTH - BODY_PADDING_X)
    this.ownedObjects.push(title)

    const hintText =
      this.mode === 'candidates'
        ? 'W/S select  ·  ←/→ a/b/c  ·  SPACE play  ·  ESC back'
        : 'W/S select  ·  SPACE play  ·  ←/→ volume  ·  ESC back'
    const hint = this.scene.add.text(centerX, panelTop + 36, hintText, {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '10px',
      color: '#71717a',
    })
    hint.setOrigin(0.5)
    hint.setDepth(SFX_PREVIEW_DEPTH + 3)
    hint.setScrollFactor(0)
    shrinkTextToFitWidth(hint, SFX_PREVIEW_PANEL_WIDTH - BODY_PADDING_X)
    this.ownedObjects.push(hint)

    let cursorY = panelTop + 52

    this.selectableRows.push({ kind: 'volume' })
    const volumeRow = this.createRow(
      centerX,
      cursorY,
      this.getVolumeRowText(),
      '← →',
      () => {
        this.selectRowByKind('volume')
      },
      () => {
        this.selectRowByKind('volume')
      },
    )
    this.volumeLabel = volumeRow.label
    this.rowViews.push(volumeRow)
    cursorY = cursorY + SFX_PREVIEW_ROW_HEIGHT + 1

    if (this.mode === 'catalog') {
      cursorY = this.buildCatalogRows(centerX, cursorY)
    } else {
      cursorY = this.buildCandidateRows(centerX, cursorY)
    }

    if (this.mode === 'catalog') {
      this.selectableRows.push({ kind: 'openCandidates' })
      const candidatesRow = this.createRow(
        centerX,
        panelBottom - 50,
        'Synth Candidates',
        'a/b/c',
        () => {
          this.selectRowByKind('openCandidates')
        },
        () => {
          this.openCandidatesMode()
        },
        SETTINGS_MENU_BUTTON_HEIGHT - 8,
      )
      this.rowViews.push(candidatesRow)
    } else {
      this.selectableRows.push({ kind: 'backToCatalog' })
      const catalogRow = this.createRow(
        centerX,
        panelBottom - 50,
        'Back to Catalog',
        null,
        () => {
          this.selectRowByKind('backToCatalog')
        },
        () => {
          this.openCatalogMode()
        },
        SETTINGS_MENU_BUTTON_HEIGHT - 8,
      )
      this.rowViews.push(catalogRow)
    }

    this.selectableRows.push({ kind: 'back' })
    const backRow = this.createRow(
      centerX,
      panelBottom - 24,
      'Back',
      null,
      () => {
        this.selectRowByKind('back')
      },
      () => {
        this.close(true)
      },
      SETTINGS_MENU_BUTTON_HEIGHT - 6,
    )
    this.rowViews.push(backRow)

    if (this.callbacks.onUiObjectsReady !== undefined) {
      this.callbacks.onUiObjectsReady(this.ownedObjects.slice())
    }
  }

  private buildCatalogRows(centerX: number, startY: number): number {
    let cursorY = startY
    for (let index = 0; index < SFX_CATALOG.length; index++) {
      const entry = SFX_CATALOG[index]
      if (entry.kind === 'header') {
        const header = this.scene.add.text(
          centerX - SFX_PREVIEW_PANEL_WIDTH / 2 + BODY_PADDING_X,
          cursorY + 1,
          entry.label,
          {
            fontFamily: FONT_FAMILY_UI,
            fontSize: '10px',
            color: '#94a3b8',
          },
        )
        header.setOrigin(0, 0.5)
        header.setDepth(SFX_PREVIEW_DEPTH + 3)
        header.setScrollFactor(0)
        this.ownedObjects.push(header)
        cursorY = cursorY + 13
        continue
      }
      if (entry.kind !== 'file') {
        continue
      }

      const entryIndex = index
      this.selectableRows.push({ kind: 'sfx', entryIndex })
      const row = this.createRow(
        centerX,
        cursorY,
        entry.label,
        entry.note,
        () => {
          this.selectRowByEntryIndex(entryIndex)
        },
        () => {
          this.selectRowByEntryIndex(entryIndex)
          this.playEntry(entry)
        },
      )
      this.rowViews.push(row)
      cursorY = cursorY + SFX_PREVIEW_ROW_HEIGHT
    }
    return cursorY
  }

  private buildCandidateRows(centerX: number, startY: number): number {
    let cursorY = startY
    const header = this.scene.add.text(
      centerX - SFX_PREVIEW_PANEL_WIDTH / 2 + BODY_PADDING_X,
      cursorY + 1,
      'Wave synth a / b / c  (← → switch)',
      {
        fontFamily: FONT_FAMILY_UI,
        fontSize: '10px',
        color: '#94a3b8',
      },
    )
    header.setOrigin(0, 0.5)
    header.setDepth(SFX_PREVIEW_DEPTH + 3)
    header.setScrollFactor(0)
    this.ownedObjects.push(header)
    cursorY = cursorY + 14

    for (let rowIndex = 0; rowIndex < CANDIDATE_ROWS.length; rowIndex++) {
      const def = CANDIDATE_ROWS[rowIndex]
      this.selectableRows.push({ kind: 'candidate', rowIndex })
      const variant = this.candidateVariantByRow[rowIndex]
      const row = this.createRow(
        centerX,
        cursorY,
        def.label,
        this.getCandidateNote(variant),
        () => {
          this.selectCandidateRow(rowIndex)
        },
        () => {
          this.selectCandidateRow(rowIndex)
          this.playCandidate(rowIndex)
        },
      )
      this.rowViews.push(row)
      cursorY = cursorY + SFX_PREVIEW_ROW_HEIGHT
    }
    return cursorY
  }

  private getCandidateNote(variant: SfxCandidateVariant): string {
    return `[${variant}]`
  }

  private createRow(
    centerX: number,
    y: number,
    labelText: string,
    noteText: string | null,
    onHover: () => void,
    onClick: () => void,
    rowHeight: number = SFX_PREVIEW_ROW_HEIGHT,
  ): RowView {
    const rowWidth = SFX_PREVIEW_PANEL_WIDTH - BODY_PADDING_X * 2
    const background = this.scene.add.rectangle(
      centerX,
      y,
      rowWidth,
      rowHeight,
      ROW_NORMAL,
      0.95,
    )
    background.setDepth(SFX_PREVIEW_DEPTH + 3)
    background.setScrollFactor(0)
    background.setInteractive({ useHandCursor: true })
    background.on('pointerover', onHover)
    background.on('pointerdown', onClick)
    this.ownedObjects.push(background)

    const label = this.scene.add.text(centerX - rowWidth / 2 + 10, y, labelText, {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '11px',
      color: '#e5e7eb',
    })
    label.setOrigin(0, 0.5)
    label.setDepth(SFX_PREVIEW_DEPTH + 4)
    label.setScrollFactor(0)
    shrinkTextToFitWidth(label, rowWidth - 90)
    this.ownedObjects.push(label)

    let note: Phaser.GameObjects.Text | null = null
    if (noteText !== null) {
      note = this.scene.add.text(centerX + rowWidth / 2 - 10, y, noteText, {
        fontFamily: FONT_FAMILY_UI,
        fontSize: '10px',
        color: '#a1a1aa',
      })
      note.setOrigin(1, 0.5)
      note.setDepth(SFX_PREVIEW_DEPTH + 4)
      note.setScrollFactor(0)
      this.ownedObjects.push(note)
    }

    return { background, label, note }
  }

  private getVolumeRowText(): string {
    const percent = Math.round(this.previewVolume * 100)
    return `Volume  ${percent}%`
  }

  private openCandidatesMode(): void {
    this.mode = 'candidates'
    this.selectedIndex = 0
    this.buildPanel()
    this.refreshSelectionVisual()
  }

  private openCatalogMode(): void {
    this.mode = 'catalog'
    this.selectedIndex = 0
    this.buildPanel()
    this.refreshSelectionVisual()
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
    this.keyLeft = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT)
    this.keyRight = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT)
    this.keyA = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
    this.keyD = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    this.keySpace = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.keyEnter = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)

    this.keyW.on('down', this.onMoveUp)
    this.keyUp.on('down', this.onMoveUp)
    this.keyS.on('down', this.onMoveDown)
    this.keyDown.on('down', this.onMoveDown)
    this.keyLeft.on('down', this.onLeft)
    this.keyA.on('down', this.onLeft)
    this.keyRight.on('down', this.onRight)
    this.keyD.on('down', this.onRight)
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
    if (this.keyLeft !== null) {
      this.keyLeft.off('down', this.onLeft)
    }
    if (this.keyA !== null) {
      this.keyA.off('down', this.onLeft)
    }
    if (this.keyRight !== null) {
      this.keyRight.off('down', this.onRight)
    }
    if (this.keyD !== null) {
      this.keyD.off('down', this.onRight)
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
    this.keyLeft = null
    this.keyRight = null
    this.keyA = null
    this.keyD = null
    this.keySpace = null
    this.keyEnter = null
  }

  private destroyPanel(): void {
    for (let index = 0; index < this.ownedObjects.length; index++) {
      this.ownedObjects[index].destroy()
    }
    this.ownedObjects = []
    this.rowViews = []
    this.selectableRows = []
    this.volumeLabel = null
  }

  private moveSelection(direction: number): void {
    if (!this.isOpenFlag || this.selectableRows.length <= 0) {
      return
    }
    let nextIndex = this.selectedIndex + direction
    if (nextIndex < 0) {
      nextIndex = this.selectableRows.length - 1
    }
    if (nextIndex >= this.selectableRows.length) {
      nextIndex = 0
    }
    if (nextIndex === this.selectedIndex) {
      return
    }
    this.selectedIndex = nextIndex
    this.refreshSelectionVisual()
  }

  private selectRowByKind(
    kind: 'volume' | 'back' | 'openCandidates' | 'backToCatalog',
  ): void {
    for (let index = 0; index < this.selectableRows.length; index++) {
      if (this.selectableRows[index].kind === kind) {
        this.selectedIndex = index
        this.refreshSelectionVisual()
        return
      }
    }
  }

  private selectRowByEntryIndex(entryIndex: number): void {
    for (let index = 0; index < this.selectableRows.length; index++) {
      const row = this.selectableRows[index]
      if (row.kind === 'sfx' && row.entryIndex === entryIndex) {
        this.selectedIndex = index
        this.refreshSelectionVisual()
        return
      }
    }
  }

  private selectCandidateRow(rowIndex: number): void {
    for (let index = 0; index < this.selectableRows.length; index++) {
      const row = this.selectableRows[index]
      if (row.kind === 'candidate' && row.rowIndex === rowIndex) {
        this.selectedIndex = index
        this.refreshSelectionVisual()
        return
      }
    }
  }

  private refreshSelectionVisual(): void {
    for (let index = 0; index < this.rowViews.length; index++) {
      const row = this.rowViews[index]
      const isSelected = index === this.selectedIndex
      row.background.setFillStyle(isSelected ? ROW_SELECTED : ROW_NORMAL, 0.95)
      row.background.setStrokeStyle(isSelected ? 2 : 0, isSelected ? 0xfde68a : 0x000000)
      row.label.setColor(isSelected ? '#fef3c7' : '#e5e7eb')
      if (row.note !== null) {
        row.note.setColor(isSelected ? '#fde68a' : '#a1a1aa')
      }
    }
  }

  private handleHorizontal(direction: number): void {
    if (!this.isOpenFlag) {
      return
    }
    const row = this.selectableRows[this.selectedIndex]
    if (row !== undefined && row.kind === 'candidate') {
      this.cycleCandidateVariant(row.rowIndex, direction)
      return
    }
    this.adjustVolume(direction * SFX_PREVIEW_VOLUME_STEP)
  }

  private cycleCandidateVariant(rowIndex: number, direction: number): void {
    const current = this.candidateVariantByRow[rowIndex]
    let variantIndex = 0
    for (let index = 0; index < SFX_CANDIDATE_VARIANTS.length; index++) {
      if (SFX_CANDIDATE_VARIANTS[index] === current) {
        variantIndex = index
        break
      }
    }
    let nextIndex = variantIndex + direction
    if (nextIndex < 0) {
      nextIndex = SFX_CANDIDATE_VARIANTS.length - 1
    }
    if (nextIndex >= SFX_CANDIDATE_VARIANTS.length) {
      nextIndex = 0
    }
    this.candidateVariantByRow[rowIndex] = SFX_CANDIDATE_VARIANTS[nextIndex]
    this.refreshCandidateRowNote(rowIndex)
    this.playCandidate(rowIndex)
  }

  private refreshCandidateRowNote(rowIndex: number): void {
    // volume 行が先頭なので、候補行の rowViews 位置を探す
    for (let index = 0; index < this.selectableRows.length; index++) {
      const row = this.selectableRows[index]
      if (row.kind === 'candidate' && row.rowIndex === rowIndex) {
        const view = this.rowViews[index]
        if (view !== undefined && view.note !== null) {
          view.note.setText(this.getCandidateNote(this.candidateVariantByRow[rowIndex]))
        }
        return
      }
    }
  }

  private adjustVolume(delta: number): void {
    if (!this.isOpenFlag) {
      return
    }
    const next = Math.max(0, Math.min(1, this.previewVolume + delta))
    this.previewVolume = Math.round(next * 100) / 100
    if (this.volumeLabel !== null) {
      this.volumeLabel.setText(this.getVolumeRowText())
    }
  }

  private confirmSelection(): void {
    if (!this.isOpenFlag) {
      return
    }
    const row = this.selectableRows[this.selectedIndex]
    if (row === undefined) {
      return
    }
    if (row.kind === 'back') {
      this.close(true)
      return
    }
    if (row.kind === 'openCandidates') {
      this.openCandidatesMode()
      return
    }
    if (row.kind === 'backToCatalog') {
      this.openCatalogMode()
      return
    }
    if (row.kind === 'volume') {
      this.callbacks.audioSystem.playSfxByKey(SFX_KEY_PLAYER_FIRE_POWER, this.previewVolume)
      return
    }
    if (row.kind === 'candidate') {
      this.playCandidate(row.rowIndex)
      return
    }
    const entry = SFX_CATALOG[row.entryIndex]
    if (entry === undefined || entry.kind !== 'file') {
      return
    }
    this.playEntry(entry)
  }

  private playEntry(entry: Extract<SfxPreviewEntry, { kind: 'file' }>): void {
    this.callbacks.audioSystem.playSfxByKey(entry.audioKey, this.previewVolume)
  }

  private getCandidateAudioKey(sfxId: string, variant: SfxCandidateVariant): string {
    return `sfx-cand-${sfxId}-${variant}`
  }

  private getCandidatePath(sfxId: string, variant: SfxCandidateVariant): string {
    return `${SFX_CANDIDATE_DIR}/${sfxId}_${variant}.ogg`
  }

  private playCandidate(rowIndex: number): void {
    const def = CANDIDATE_ROWS[rowIndex]
    if (def === undefined) {
      return
    }
    const variant = this.candidateVariantByRow[rowIndex]
    const audioKey = this.getCandidateAudioKey(def.sfxId, variant)
    if (this.scene.cache.audio.exists(audioKey)) {
      this.callbacks.audioSystem.playSfxByKey(audioKey, this.previewVolume)
      return
    }
    if (this.loadingCandidateKeys[audioKey] === true) {
      return
    }
    this.loadingCandidateKeys[audioKey] = true
    const path = this.getCandidatePath(def.sfxId, variant)
    this.scene.load.audio(audioKey, path)
    const onComplete = (key: string): void => {
      if (key !== audioKey) {
        return
      }
      this.scene.load.off(Phaser.Loader.Events.FILE_COMPLETE, onComplete)
      this.loadingCandidateKeys[audioKey] = false
      if (!this.isOpenFlag) {
        return
      }
      if (!this.scene.cache.audio.exists(audioKey)) {
        console.warn('SFX candidate missing (run --preview-pack):', path)
        return
      }
      this.callbacks.audioSystem.playSfxByKey(audioKey, this.previewVolume)
    }
    this.scene.load.on(Phaser.Loader.Events.FILE_COMPLETE, onComplete)
    this.scene.load.once(Phaser.Loader.Events.FILE_LOAD_ERROR, () => {
      this.loadingCandidateKeys[audioKey] = false
      this.scene.load.off(Phaser.Loader.Events.FILE_COMPLETE, onComplete)
      console.warn('SFX candidate load failed (run --preview-pack):', path)
    })
    this.scene.load.start()
  }
}
