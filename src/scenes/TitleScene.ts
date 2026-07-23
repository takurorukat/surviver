import Phaser from 'phaser'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  TOP_BAR_HEIGHT,
  STAGE_AREAS,
  getTitleAreaArtTextureKey,
  TITLE_AREA_PANEL_COLUMNS,
  TITLE_AREA_VISIBLE_COUNT,
  TITLE_AREA_PANEL_WIDTH,
  TITLE_AREA_PANEL_HEIGHT,
  TITLE_AREA_PANEL_GAP,
  TITLE_AREA_PANEL_ROW_GAP,
  TITLE_AREA_GRID_START_Y,
  TITLE_AREA_PANEL_COLOR,
  TITLE_AREA_PANEL_BORDER_COLOR,
  TITLE_AREA_PANEL_SELECTED_BORDER_COLOR,
  TITLE_AREA_PANEL_HOVER_COLOR,
  TITLE_AREA_LOCKED_PANEL_COLOR,
  TITLE_AREA_PANEL_FILL_ALPHA_PLAYABLE,
  TITLE_AREA_PANEL_FILL_ALPHA_LOCKED,
  TITLE_AREA_PANEL_FILL_ALPHA_HIDDEN,
  TITLE_AREA_ART_ALPHA,
  TITLE_AREA_HOVER_SCALE,
  TITLE_AREA_HOVER_ART_ZOOM,
  TITLE_AREA_HOVER_ART_ALPHA,
  TITLE_AREA_HOVER_LIFT_Y,
  TITLE_AREA_HOVER_TEXT_LIFT_Y,
  TITLE_AREA_HOVER_PLAINS_STAGES_TOP_PADDING,
  TITLE_AREA_HOVER_OVERLAY_ALPHA,
  TITLE_AREA_HOVER_TWEEN_MS,
  TITLE_AREA_HOVER_DEPTH,
  TITLE_AREA_NAME_STROKE_COLOR,
  TITLE_AREA_NAME_STROKE_THICKNESS,
  TITLE_AREA_STAGES_STROKE_THICKNESS,
  TITLE_AREA_NAME_COLOR,
  TITLE_AREA_SUB_COLOR,
  TITLE_AREA_LOCKED_NAME_COLOR,
  TITLE_LOCK_ICON_SIZE,
  TITLE_LOCK_ICON_COLOR,
  TITLE_LOCK_ICON_GAP,
  TITLE_AREA_NAME_OFFSET_Y,
  TITLE_AREA_STAGES_OFFSET_Y,
  TITLE_AREA_NAME_FONT_SIZE,
  TITLE_AREA_STAGES_FONT_SIZE,
  TITLE_AREA_CONDITION_COLOR,
  TITLE_SHOW_SHOP_AND_SEAL,
  TITLE_SHOW_DEBUG_PROGRESS,
  TITLE_SHOP_PANEL_WIDTH,
  TITLE_SHOP_PANEL_HEIGHT,
  TITLE_SHOP_PANEL_CENTER_Y,
  TITLE_SHOP_PANEL_BORDER_COLOR,
  TITLE_SHOP_PANEL_COLOR,
  TITLE_SHOP_TITLE_COLOR,
  TITLE_SHOP_DESC_COLOR,
  TITLE_SHOP_TITLE_FONT_SIZE,
  TITLE_SHOP_DESC_FONT_SIZE,
  TITLE_SHOP_TITLE_OFFSET_Y,
  TITLE_SHOP_DESC_OFFSET_Y,
  TITLE_SHOP_TITLE_TEXT,
  TITLE_SHOP_DESC_TEXT,
  TITLE_SHOP_UNLOCK_CONDITION,
  TITLE_SHOP_UNLOCK_TIP_TEXT,
  TITLE_SHOP_UNLOCK_TIP_HINT,
  TITLE_ACTION_PANEL_GAP,
  TITLE_SEAL_TITLE_TEXT,
  TITLE_SEAL_DESC_TEXT,
  GAME_TITLE,
  type StageAreaDef,
  type StageAreaId,
  FONT_FAMILY_HEADING,
  FONT_FAMILY_UI,
} from '../GameConstants'
import {
  isAreaPlayable,
  isAreaRevealed,
  isAreaSelectableOnTitle,
  clearAllSaveData,
  clearRunProgress,
  getPurchasedSealSlotCount,
  isShopUnlocked,
  shouldShowShopUnlockTip,
  markShopUnlockTipSeen,
} from '../systems/UnlockSaveSystem'
import { createTopBar, type TopBarView } from '../systems/TopBarSystem'
import { GameAudioSystem } from '../systems/GameAudioSystem'
import {
  createBgmToggleButton,
  type BgmToggleButtonView,
} from '../systems/BgmToggleButtonSystem'
import {
  createDebugProgressButton,
  type DebugProgressButtonView,
} from '../systems/DebugProgressButtonSystem'
import {
  createOrientationGuide,
  type OrientationGuideView,
} from '../systems/OrientationGuideSystem'
import { SettingsMenuSystem } from '../systems/SettingsMenuSystem'
import { ConfirmDialogSystem } from '../systems/ConfirmDialogSystem'
import { ShopSystem } from '../systems/ShopSystem'
import { SealSkillSystem } from '../systems/SealSkillSystem'
import { shrinkTextToFitWidth } from '../utils/fitTextToWidth'
import {
  createLockIcon,
  layoutLockIconWithCenteredText,
  playLockIconDeniedPulse,
  setLockIconColor,
  type LockIconView,
} from '../ui/LockIcon'

type AreaPanelView = {
  area: StageAreaDef
  centerX: number
  centerY: number
  nameBaseY: number
  stagesBaseY: number
  border: Phaser.GameObjects.Rectangle
  background: Phaser.GameObjects.Rectangle
  artImage: Phaser.GameObjects.Image | null
  artMaskGraphics: Phaser.GameObjects.Graphics | null
  artBaseScaleX: number
  artBaseScaleY: number
  nameText: Phaser.GameObjects.Text
  stagesText: Phaser.GameObjects.Text
  lockIcon: LockIconView
  isHovered: boolean
  hoverTween: Phaser.Tweens.Tween | null
  /** ホバー演出の進行度 0〜1（tween 用） */
  hoverProgress: number
}

type ActionPreviewView = {
  centerX: number
  titleCenterY: number
  border: Phaser.GameObjects.Rectangle
  background: Phaser.GameObjects.Rectangle
  titleText?: Phaser.GameObjects.Text
  descText?: Phaser.GameObjects.Text
  lockIcon: LockIconView
}

// =============================================================================
// TitleScene — タイトル画面＋エリア選択
//
// W/S でエリアパネルを上下選択。ロック中は南京錠表示で決定不可。
// Clear Save は設定ギアメニューからのみ（ConfirmDialogSystem で確認）。
// =============================================================================
export class TitleScene extends Phaser.Scene {
  private hasStarted = false
  private selectedIndex = 0
  private panelViews: AreaPanelView[] = []
  private conditionText: Phaser.GameObjects.Text | null = null
  private keyW: Phaser.Input.Keyboard.Key | null = null
  private keyS: Phaser.Input.Keyboard.Key | null = null
  private keyUp: Phaser.Input.Keyboard.Key | null = null
  private keyDown: Phaser.Input.Keyboard.Key | null = null
  private keySpace: Phaser.Input.Keyboard.Key | null = null
  private keyEnter: Phaser.Input.Keyboard.Key | null = null
  private keyA: Phaser.Input.Keyboard.Key | null = null
  private keyD: Phaser.Input.Keyboard.Key | null = null
  private keyT: Phaser.Input.Keyboard.Key | null = null
  private keyLeft: Phaser.Input.Keyboard.Key | null = null
  private keyRight: Phaser.Input.Keyboard.Key | null = null
  private titleAudioSystem!: GameAudioSystem
  private settingsMenuSystem!: SettingsMenuSystem
  private confirmDialogSystem!: ConfirmDialogSystem
  private shopSystem!: ShopSystem
  private sealSkillSystem!: SealSkillSystem
  private shopPreviewView: ActionPreviewView | null = null
  private sealPreviewView: ActionPreviewView | null = null
  // Shop 解放直後の吹き出し案内（表示中は操作を受け付けず、クリック／キーで閉じる）
  private shopUnlockTipVisible = false
  private shopUnlockTipObjects: Phaser.GameObjects.GameObject[] = []
  private topBarView: TopBarView | null = null
  private bgmToggleButton: BgmToggleButtonView | null = null
  private debugProgressButton: DebugProgressButtonView | null = null
  private orientationGuide: OrientationGuideView | null = null

  constructor() {
    super({ key: 'TitleScene' })
  }

  create(): void {
    this.hasStarted = false
    this.selectedIndex = 0
    this.panelViews = []
    this.cameras.main.setBackgroundColor(0x111111)

    this.titleAudioSystem = new GameAudioSystem(this)
    this.titleAudioSystem.prepare()
    // 戦闘 BGM・ゲームオーバー SE など、前シーンの音をすべて止めてからタイトル曲だけ流す
    this.titleAudioSystem.stopAllSounds()
    if (this.titleAudioSystem.getBgmEnabled()) {
      this.titleAudioSystem.startTitleBgm()
    }
    this.confirmDialogSystem = new ConfirmDialogSystem(this)
    this.settingsMenuSystem = new SettingsMenuSystem(this, {
      mode: 'title',
      audioSystem: this.titleAudioSystem,
      onClearSave: () => {
        this.confirmDialogSystem.show({
          title: 'Clear Save?',
          message: 'Delete all saved data?\nUnlocks and progress will be lost.',
          yesLabel: 'Yes clear data',
          onYes: () => {
            clearAllSaveData()
            // 表示中の Shop 案内も消す（「見た」フラグはセーブ削除で既に false）
            this.hideShopUnlockTip(false)
            // ロック表示と実績カウントをその場で更新する（再読み込み不要）
            this.refreshSelectionVisual()
            if (this.topBarView !== null) {
              this.topBarView.refreshAchievementProgress()
              this.topBarView.refreshGold()
            }
          },
        })
      },
      onCancelled: () => {
        this.titleAudioSystem.playMenuCancel()
      },
      onSelectionChanged: () => {
        this.titleAudioSystem.playMenuMove()
      },
      // タイトルでは ESC で設定を開く（開いているときは閉じる処理が先に動く）
      onEscapeWhenClosed: () => {
        this.openSettingsFromEscape()
      },
    })

    this.topBarView = createTopBar(this, () => {
      if (this.confirmDialogSystem.isOpen()) {
        return
      }
      this.openSettingsMenu()
    })
    this.shopSystem = new ShopSystem(this, {
      onGoldChanged: () => {
        this.topBarView?.refreshGold()
        // Seal Slot 購入直後に、タイトルの Seal Skills 枠のロックを外す
        this.refreshSelectionVisual()
      },
      onPurchased: () => {
        this.titleAudioSystem.playShopPurchase()
      },
      onPurchaseFailed: () => {
        // Back と同じキャンセル音
        this.titleAudioSystem.playMenuCancel()
      },
      onSelectionChanged: () => {
        this.titleAudioSystem.playMenuMove()
      },
      onClose: () => {
        this.titleAudioSystem.playMenuCancel()
      },
    })
    this.sealSkillSystem = new SealSkillSystem(this, {
      onSelectionChanged: () => {
        this.titleAudioSystem.playMenuMove()
      },
      onSealed: () => {
        // ショップ購入と同じ決定音（Accept）
        this.titleAudioSystem.playShopPurchase()
      },
      onClose: () => {
        this.titleAudioSystem.playMenuCancel()
      },
    })
    // 実績・歯車にマウスを乗せたときも、選択移動音を鳴らす
    this.topBarView.achievementHit.on('pointerover', () => {
      if (
        this.confirmDialogSystem.isOpen() ||
        this.shopSystem.isOpen() ||
        this.sealSkillSystem.isOpen()
      ) {
        return
      }
      this.selectMenuItem(this.getAchievementSelectionIndex())
    })
    this.topBarView.gearHit.on('pointerover', () => {
      if (
        this.confirmDialogSystem.isOpen() ||
        this.shopSystem.isOpen() ||
        this.sealSkillSystem.isOpen()
      ) {
        return
      }
      this.selectMenuItem(this.getSettingsSelectionIndex())
    })
    this.topBarView.goldHit.on('pointerover', () => {
      if (
        this.confirmDialogSystem.isOpen() ||
        this.shopSystem.isOpen() ||
        this.sealSkillSystem.isOpen()
      ) {
        return
      }
      this.selectMenuItem(this.getGoldSelectionIndex())
    })

    // 6エリアを1画面に収めるため、ヘッダーはやや詰める
    const contentTop = TOP_BAR_HEIGHT + 28

    const titleText = this.add.text(GAME_WIDTH / 2, contentTop, GAME_TITLE, {
      fontFamily: FONT_FAMILY_HEADING,
      fontSize: '28px',
      color: '#ffffff',
    })
    titleText.setOrigin(0.5)
    shrinkTextToFitWidth(titleText, GAME_WIDTH - 64)

    const selectLabel = this.add.text(GAME_WIDTH / 2, contentTop + 34, 'SELECT AREA', {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '15px',
      color: '#a1a1aa',
    })
    selectLabel.setOrigin(0.5)
    shrinkTextToFitWidth(selectLabel, GAME_WIDTH - 64)

    // 途中再開はしない（旧セーブに残っていても消す）
    clearRunProgress()
    this.createAreaPanels()
    if (TITLE_SHOW_SHOP_AND_SEAL) {
      this.shopPreviewView = this.createShopPreviewPanel()
      this.sealPreviewView = this.createSealPreviewPanel()
    }

    // Shop 枠のすぐ下に、開始／解除条件の案内を置く
    this.conditionText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 56, '', {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '15px',
      color: TITLE_AREA_CONDITION_COLOR,
    })
    this.conditionText.setOrigin(0.5)

    const hintText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 24,
      'WASD · Arrows select  /  SPACE · ENTER confirm  /  ESC settings',
      {
        fontFamily: FONT_FAMILY_UI,
        fontSize: '13px',
        color: '#71717a',
      },
    )
    hintText.setOrigin(0.5)
    shrinkTextToFitWidth(hintText, GAME_WIDTH - 64)
    this.bgmToggleButton = createBgmToggleButton(this, this.titleAudioSystem, () => {
      if (
        this.confirmDialogSystem.isOpen() ||
        this.shopSystem.isOpen() ||
        this.sealSkillSystem.isOpen()
      ) {
        return
      }
      this.selectMenuItem(this.getBgmSelectionIndex())
    })

    if (TITLE_SHOW_DEBUG_PROGRESS) {
      this.debugProgressButton = createDebugProgressButton(
        this,
        () => {
          this.refreshSelectionVisual()
          if (this.topBarView !== null) {
            this.topBarView.refreshAchievementProgress()
          }
        },
        () => {
          if (
            this.confirmDialogSystem.isOpen() ||
            this.shopSystem.isOpen() ||
            this.sealSkillSystem.isOpen()
          ) {
            return
          }
          this.selectMenuItem(this.getDebugSelectionIndex())
        },
      )
    }

    this.setupKeyboard()
    this.refreshSelectionVisual()

    // 初めて Shop が開いたあと、タイトルに戻ったときだけ吹き出し案内を出す
    if (TITLE_SHOW_SHOP_AND_SEAL && shouldShowShopUnlockTip()) {
      this.showShopUnlockTip()
    }

    // タイトル操作の時点で音声ロックを外しておく（バトル入場直後の無音対策）
    this.input.once('pointerdown', () => {
      this.sound.unlock()
      this.titleAudioSystem.unlock()
    })
    if (this.input.keyboard !== null) {
      this.input.keyboard.once('keydown', () => {
        this.sound.unlock()
        this.titleAudioSystem.unlock()
      })
    }

    this.orientationGuide = createOrientationGuide(this)
  }

  shutdown(): void {
    if (this.debugProgressButton !== null) {
      this.debugProgressButton.destroy()
      this.debugProgressButton = null
    }
    if (this.orientationGuide !== null) {
      this.orientationGuide.destroy()
      this.orientationGuide = null
    }
  }

  update(): void {
    // 設定メニュー側でBGMを切り替えた場合も、右下アイコンへすぐ反映する
    this.bgmToggleButton?.refresh()
  }

  // 選択番号: エリア → (Shop → Seal Skills) → Gold → 実績 → Settings → BGM
  // Shop / Seal は TITLE_SHOW_SHOP_AND_SEAL が false のとき番号に含めない
  // 縦移動では実績を飛ばし、実績は Settings から左右キーだけ
  private getShopSealMenuOffset(): number {
    if (TITLE_SHOW_SHOP_AND_SEAL) {
      return 2
    }
    return 0
  }

  private getShopSelectionIndex(): number {
    return this.panelViews.length
  }

  private getSealSelectionIndex(): number {
    return this.panelViews.length + 1
  }

  private getAchievementSelectionIndex(): number {
    return this.panelViews.length + this.getShopSealMenuOffset() + 1
  }

  private getSettingsSelectionIndex(): number {
    return this.panelViews.length + this.getShopSealMenuOffset() + 2
  }

  private getBgmSelectionIndex(): number {
    return this.panelViews.length + this.getShopSealMenuOffset() + 3
  }

  // BGM の左隣（TITLE_SHOW_DEBUG_PROGRESS のときだけ使う）
  private getDebugSelectionIndex(): number {
    return this.getBgmSelectionIndex() + 1
  }

  private getGoldSelectionIndex(): number {
    // 上部バー左端寄り: Gold → Achievements → Settings
    return this.panelViews.length + this.getShopSealMenuOffset()
  }

  private isShopSelected(): boolean {
    if (!TITLE_SHOW_SHOP_AND_SEAL) {
      return false
    }
    return this.selectedIndex === this.getShopSelectionIndex()
  }

  private isSealSelected(): boolean {
    if (!TITLE_SHOW_SHOP_AND_SEAL) {
      return false
    }
    return this.selectedIndex === this.getSealSelectionIndex()
  }

  private isBgmSelected(): boolean {
    return this.selectedIndex === this.getBgmSelectionIndex()
  }

  private isDebugSelected(): boolean {
    if (!TITLE_SHOW_DEBUG_PROGRESS || this.debugProgressButton === null) {
      return false
    }
    return this.selectedIndex === this.getDebugSelectionIndex()
  }

  // ショップで Seal Slot を1つ以上買うと、タイトルから Seal Skills を開ける
  private isSealSkillsUnlocked(): boolean {
    return getPurchasedSealSlotCount() > 0
  }

  // 初めてゴールドを得ると Shop が開く
  private isShopMenuUnlocked(): boolean {
    return isShopUnlocked()
  }

  // 役割: メニュー選択を切り替え、変わったときだけ移動音を鳴らす
  private selectMenuItem(nextIndex: number): void {
    // ? 表記のエリアは選択できない
    if (nextIndex >= 0 && nextIndex < this.panelViews.length) {
      if (!isAreaSelectableOnTitle(this.panelViews[nextIndex].area)) {
        return
      }
    }
    if (nextIndex === this.selectedIndex) {
      return
    }
    this.selectedIndex = nextIndex
    this.titleAudioSystem.playMenuMove()
    this.refreshSelectionVisual()
  }

  /** 下から見て、最後に選べるエリアの index（なければ 0）。 */
  private findLastSelectableAreaIndex(): number {
    for (let index = this.panelViews.length - 1; index >= 0; index--) {
      if (isAreaSelectableOnTitle(this.panelViews[index].area)) {
        return index
      }
    }
    return 0
  }

  private isAchievementsSelected(): boolean {
    return this.selectedIndex === this.getAchievementSelectionIndex()
  }

  private isGoldSelected(): boolean {
    return this.selectedIndex === this.getGoldSelectionIndex()
  }

  private isSettingsSelected(): boolean {
    return this.selectedIndex === this.getSettingsSelectionIndex()
  }

  private createAreaPanels(): void {
    const columns = TITLE_AREA_PANEL_COLUMNS
    const visibleCount = Math.min(TITLE_AREA_VISIBLE_COUNT, STAGE_AREAS.length)
    const totalWidth =
      columns * TITLE_AREA_PANEL_WIDTH + (columns - 1) * TITLE_AREA_PANEL_GAP
    const gridLeft = (GAME_WIDTH - totalWidth) / 2
    // SELECT AREA の下。2×2 パネルがラベルを隠さない位置
    const startY = TITLE_AREA_GRID_START_Y

    for (let index = 0; index < visibleCount; index++) {
      const area = STAGE_AREAS[index]
      const column = index % columns
      const row = Math.floor(index / columns)
      const centerX =
        gridLeft +
        TITLE_AREA_PANEL_WIDTH / 2 +
        column * (TITLE_AREA_PANEL_WIDTH + TITLE_AREA_PANEL_GAP)
      const centerY =
        startY + row * (TITLE_AREA_PANEL_HEIGHT + TITLE_AREA_PANEL_ROW_GAP)
      const panelView = this.createOneAreaPanel(area, centerX, centerY, index)
      this.panelViews.push(panelView)
    }
  }

  // 「Click / SPACE / ENTER to start」のすぐ上に、ショップ案内の四角枠を置く
  private createShopPreviewPanel(): ActionPreviewView {
    const centerX =
      GAME_WIDTH / 2 - TITLE_SHOP_PANEL_WIDTH / 2 - TITLE_ACTION_PANEL_GAP / 2
    const centerY = TITLE_SHOP_PANEL_CENTER_Y

    const border = this.add.rectangle(
      centerX,
      centerY,
      TITLE_SHOP_PANEL_WIDTH + 4,
      TITLE_SHOP_PANEL_HEIGHT + 4,
      TITLE_SHOP_PANEL_BORDER_COLOR,
    )
    border.setScrollFactor(0)

    const background = this.add.rectangle(
      centerX,
      centerY,
      TITLE_SHOP_PANEL_WIDTH,
      TITLE_SHOP_PANEL_HEIGHT,
      TITLE_SHOP_PANEL_COLOR,
    )
    background.setScrollFactor(0)
    background.setInteractive({ useHandCursor: true })

    const titleCenterY = centerY + TITLE_SHOP_TITLE_OFFSET_Y
    const titleText = this.add.text(centerX, titleCenterY, TITLE_SHOP_TITLE_TEXT, {
      fontFamily: FONT_FAMILY_UI,
      fontSize: TITLE_SHOP_TITLE_FONT_SIZE,
      color: TITLE_SHOP_TITLE_COLOR,
      fontStyle: 'bold',
    })
    titleText.setOrigin(0.5)
    titleText.setScrollFactor(0)

    const descText = this.add.text(
      centerX,
      centerY + TITLE_SHOP_DESC_OFFSET_Y,
      TITLE_SHOP_DESC_TEXT,
      {
        fontFamily: FONT_FAMILY_UI,
        fontSize: TITLE_SHOP_DESC_FONT_SIZE,
        color: TITLE_SHOP_DESC_COLOR,
      },
    )
    descText.setOrigin(0.5)
    descText.setScrollFactor(0)
    shrinkTextToFitWidth(descText, TITLE_SHOP_PANEL_WIDTH - 16)

    const lockIcon = createLockIcon(
      this,
      centerX,
      titleCenterY,
      TITLE_LOCK_ICON_SIZE,
      TITLE_LOCK_ICON_COLOR,
    )
    lockIcon.container.setScrollFactor(0)

    background.on('pointerover', () => {
      if (
        this.confirmDialogSystem.isOpen() ||
        this.shopSystem.isOpen() ||
        this.sealSkillSystem.isOpen()
      ) {
        return
      }
      this.selectMenuItem(this.getShopSelectionIndex())
    })
    background.on('pointerdown', () => {
      if (
        this.confirmDialogSystem.isOpen() ||
        this.shopSystem.isOpen() ||
        this.sealSkillSystem.isOpen()
      ) {
        return
      }
      this.selectMenuItem(this.getShopSelectionIndex())
      if (!this.isShopMenuUnlocked()) {
        this.playLockedActionDenied(lockIcon)
        return
      }
      this.openShopMenu()
    })

    return {
      centerX,
      titleCenterY,
      border,
      background,
      titleText,
      descText,
      lockIcon,
    }
  }

  // Shop の横に、レベルアップ候補から外すスキルを選ぶ入口を置く
  private createSealPreviewPanel(): ActionPreviewView {
    const centerX =
      GAME_WIDTH / 2 + TITLE_SHOP_PANEL_WIDTH / 2 + TITLE_ACTION_PANEL_GAP / 2
    const centerY = TITLE_SHOP_PANEL_CENTER_Y

    const border = this.add.rectangle(
      centerX,
      centerY,
      TITLE_SHOP_PANEL_WIDTH + 4,
      TITLE_SHOP_PANEL_HEIGHT + 4,
      TITLE_SHOP_PANEL_BORDER_COLOR,
    )
    const background = this.add.rectangle(
      centerX,
      centerY,
      TITLE_SHOP_PANEL_WIDTH,
      TITLE_SHOP_PANEL_HEIGHT,
      TITLE_SHOP_PANEL_COLOR,
    )
    background.setInteractive({ useHandCursor: true })

    const titleCenterY = centerY + TITLE_SHOP_TITLE_OFFSET_Y
    const titleText = this.add.text(centerX, titleCenterY, TITLE_SEAL_TITLE_TEXT, {
      fontFamily: FONT_FAMILY_UI,
      fontSize: TITLE_SHOP_TITLE_FONT_SIZE,
      color: TITLE_SHOP_TITLE_COLOR,
      fontStyle: 'bold',
    })
    titleText.setOrigin(0.5)
    const descText = this.add.text(
      centerX,
      centerY + TITLE_SHOP_DESC_OFFSET_Y,
      TITLE_SEAL_DESC_TEXT,
      {
        fontFamily: FONT_FAMILY_UI,
        fontSize: TITLE_SHOP_DESC_FONT_SIZE,
        color: TITLE_SHOP_DESC_COLOR,
      },
    )
    descText.setOrigin(0.5)
    shrinkTextToFitWidth(descText, TITLE_SHOP_PANEL_WIDTH - 16)

    const lockIcon = createLockIcon(
      this,
      centerX,
      titleCenterY,
      TITLE_LOCK_ICON_SIZE,
      TITLE_LOCK_ICON_COLOR,
    )

    background.on('pointerover', () => {
      if (
        this.confirmDialogSystem.isOpen() ||
        this.shopSystem.isOpen() ||
        this.sealSkillSystem.isOpen()
      ) {
        return
      }
      // ロック中でも選択ハイライト（黄色い枠）は出せる
      this.selectMenuItem(this.getSealSelectionIndex())
    })
    background.on('pointerdown', () => {
      if (
        this.confirmDialogSystem.isOpen() ||
        this.shopSystem.isOpen() ||
        this.sealSkillSystem.isOpen()
      ) {
        return
      }
      this.selectMenuItem(this.getSealSelectionIndex())
      if (!this.isSealSkillsUnlocked()) {
        this.playLockedActionDenied(lockIcon)
        return
      }
      this.openSealSkillsMenu()
    })

    return {
      centerX,
      titleCenterY,
      border,
      background,
      titleText,
      descText,
      lockIcon,
    }
  }

  private createOneAreaPanel(
    area: StageAreaDef,
    centerX: number,
    centerY: number,
    panelIndex: number,
  ): AreaPanelView {
    const playable = isAreaPlayable(area)
    const revealed = isAreaRevealed(area)
    const fillColor = playable ? TITLE_AREA_PANEL_COLOR : TITLE_AREA_LOCKED_PANEL_COLOR
    const nameColor = playable ? TITLE_AREA_NAME_COLOR : TITLE_AREA_LOCKED_NAME_COLOR
    const fillAlpha = revealed
      ? playable
        ? TITLE_AREA_PANEL_FILL_ALPHA_PLAYABLE
        : TITLE_AREA_PANEL_FILL_ALPHA_LOCKED
      : TITLE_AREA_PANEL_FILL_ALPHA_HIDDEN

    const border = this.add.rectangle(
      centerX,
      centerY,
      TITLE_AREA_PANEL_WIDTH + 4,
      TITLE_AREA_PANEL_HEIGHT + 4,
      TITLE_AREA_PANEL_BORDER_COLOR,
    )

    // エリア絵（パネル内にカバー表示。文字の下に薄く見える）
    let artImage: Phaser.GameObjects.Image | null = null
    let artMaskGraphics: Phaser.GameObjects.Graphics | null = null
    const artKey = getTitleAreaArtTextureKey(area.id)
    if (artKey !== null && this.textures.exists(artKey)) {
      artImage = this.add.image(centerX, centerY, artKey)
      artImage.setAlpha(TITLE_AREA_ART_ALPHA)
      this.fitAreaArtToPanel(artImage, centerX, centerY)
      artMaskGraphics = this.make.graphics({ x: 0, y: 0 })
      artMaskGraphics.fillStyle(0xffffff)
      artMaskGraphics.fillRect(
        centerX - TITLE_AREA_PANEL_WIDTH / 2,
        centerY - TITLE_AREA_PANEL_HEIGHT / 2,
        TITLE_AREA_PANEL_WIDTH,
        TITLE_AREA_PANEL_HEIGHT,
      )
      artImage.setMask(artMaskGraphics.createGeometryMask())
      // 名前が隠れる ? エリアでは絵を出さない（ネタバレ防止）
      artImage.setVisible(revealed)
    }

    const background = this.add.rectangle(
      centerX,
      centerY,
      TITLE_AREA_PANEL_WIDTH,
      TITLE_AREA_PANEL_HEIGHT,
      fillColor,
      fillAlpha,
    )

    let nameLabel = '?'
    if (revealed) {
      nameLabel = area.name
    }
    const nameCenterY = centerY + TITLE_AREA_NAME_OFFSET_Y
    const stagesCenterY = centerY + TITLE_AREA_STAGES_OFFSET_Y
    const nameText = this.add.text(centerX, nameCenterY, nameLabel, {
      fontFamily: FONT_FAMILY_UI,
      fontSize: TITLE_AREA_NAME_FONT_SIZE,
      color: nameColor,
      fontStyle: 'bold',
    })
    nameText.setOrigin(0.5)
    nameText.setStroke(TITLE_AREA_NAME_STROKE_COLOR, TITLE_AREA_NAME_STROKE_THICKNESS)
    shrinkTextToFitWidth(nameText, TITLE_AREA_PANEL_WIDTH - 48)

    const stagesLabel = revealed ? `${area.stageCount} Stages` : '???'
    const stagesText = this.add.text(
      centerX,
      stagesCenterY,
      stagesLabel,
      {
        fontFamily: FONT_FAMILY_UI,
        fontSize: TITLE_AREA_STAGES_FONT_SIZE,
        color: playable ? TITLE_AREA_SUB_COLOR : TITLE_AREA_LOCKED_NAME_COLOR,
      },
    )
    stagesText.setOrigin(0.5)
    stagesText.setStroke(TITLE_AREA_NAME_STROKE_COLOR, TITLE_AREA_STAGES_STROKE_THICKNESS)
    shrinkTextToFitWidth(stagesText, TITLE_AREA_PANEL_WIDTH - 48)

    const lockIcon = createLockIcon(
      this,
      centerX,
      nameCenterY,
      TITLE_LOCK_ICON_SIZE,
      TITLE_LOCK_ICON_COLOR,
    )
    layoutLockIconWithCenteredText(
      lockIcon,
      nameText,
      centerX,
      nameCenterY,
      TITLE_LOCK_ICON_GAP,
      revealed && !playable,
    )

    const panelView: AreaPanelView = {
      area,
      centerX,
      centerY,
      nameBaseY: nameCenterY,
      stagesBaseY: stagesCenterY,
      border,
      background,
      artImage,
      artMaskGraphics,
      artBaseScaleX: artImage !== null ? artImage.scaleX : 1,
      artBaseScaleY: artImage !== null ? artImage.scaleY : 1,
      nameText,
      stagesText,
      lockIcon,
      isHovered: false,
      hoverTween: null,
      hoverProgress: 0,
    }

    background.setInteractive({ useHandCursor: revealed })
    background.on('pointerover', () => {
      if (
        this.confirmDialogSystem.isOpen() ||
        this.shopSystem.isOpen() ||
        this.sealSkillSystem.isOpen()
      ) {
        return
      }
      // ? 表記のエリアは選択できない
      if (!isAreaSelectableOnTitle(area)) {
        return
      }
      this.selectMenuItem(panelIndex)
    })
    background.on('pointerdown', () => {
      if (
        this.confirmDialogSystem.isOpen() ||
        this.shopSystem.isOpen() ||
        this.sealSkillSystem.isOpen()
      ) {
        return
      }
      if (!isAreaSelectableOnTitle(area)) {
        return
      }
      this.selectMenuItem(panelIndex)
      if (isAreaPlayable(area)) {
        this.startGame(area.id)
      } else {
        this.playLockedActionDenied(lockIcon)
      }
    })

    return panelView
  }

  /**
   * エリア絵をパネル全体にカバー表示する（はみ出しはマスクで切る）。
   * Python: scale = max(panel_w/src_w, panel_h/src_h) に相当
   */
  private fitAreaArtToPanel(
    artImage: Phaser.GameObjects.Image,
    centerX: number,
    centerY: number,
  ): void {
    const source = artImage.texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement
    const sourceWidth = source.width
    const sourceHeight = source.height
    if (sourceWidth <= 0 || sourceHeight <= 0) {
      return
    }
    const scale = Math.max(
      TITLE_AREA_PANEL_WIDTH / sourceWidth,
      TITLE_AREA_PANEL_HEIGHT / sourceHeight,
    )
    artImage.setDisplaySize(sourceWidth * scale, sourceHeight * scale)
    artImage.setPosition(centerX, centerY)
  }

  /** ホバー進行中の tween を止める */
  private stopAreaPanelHoverTween(panel: AreaPanelView): void {
    if (panel.hoverTween !== null) {
      panel.hoverTween.stop()
      panel.hoverTween = null
    }
  }

  /**
   * 選択中パネルを浮かせ・絵をズームする（マウス／カーソルキー共通）。
   * Python: progress 0→1 で scale / lift / art_zoom を補間するイメージ
   */
  private playAreaPanelHoverIn(panel: AreaPanelView): void {
    if (panel.isHovered) {
      return
    }
    panel.isHovered = true
    this.stopAreaPanelHoverTween(panel)
    panel.hoverTween = this.tweens.add({
      targets: panel,
      hoverProgress: 1,
      duration: TITLE_AREA_HOVER_TWEEN_MS,
      ease: 'Back.Out',
      onUpdate: () => {
        this.applyAreaPanelHoverVisual(panel)
      },
    })
  }

  /** 非選択パネルを元の大きさ・位置へ戻す */
  private playAreaPanelHoverOut(panel: AreaPanelView): void {
    if (!panel.isHovered && panel.hoverProgress <= 0) {
      return
    }
    panel.isHovered = false
    this.stopAreaPanelHoverTween(panel)
    panel.hoverTween = this.tweens.add({
      targets: panel,
      hoverProgress: 0,
      duration: TITLE_AREA_HOVER_TWEEN_MS,
      ease: 'Quad.Out',
      onUpdate: () => {
        this.applyAreaPanelHoverVisual(panel)
      },
      onComplete: () => {
        this.applyAreaPanelHoverVisual(panel)
        panel.hoverTween = null
      },
    })
  }

  /** プレイ可能な選択中エリアだけ浮き演出（ロック中は枠だけ） */
  private syncAreaPanelRaiseFromSelection(): void {
    for (let index = 0; index < this.panelViews.length; index++) {
      const panel = this.panelViews[index]
      const canRaise =
        index === this.selectedIndex && isAreaPlayable(panel.area)
      if (canRaise) {
        this.playAreaPanelHoverIn(panel)
      } else {
        this.playAreaPanelHoverOut(panel)
      }
    }
  }

  /** メニューを開くときなど、ホバー浮きをすぐ消す */
  private clearAllAreaPanelHovers(): void {
    for (const panel of this.panelViews) {
      this.stopAreaPanelHoverTween(panel)
      panel.isHovered = false
      panel.hoverProgress = 0
      this.applyAreaPanelHoverVisual(panel)
    }
  }

  /** hoverProgress に合わせてスケール・位置・マスク・深度・グレー重ねを反映する */
  private applyAreaPanelHoverVisual(panel: AreaPanelView): void {
    const t = panel.hoverProgress
    const panelScale = 1 + (TITLE_AREA_HOVER_SCALE - 1) * t
    const liftY = TITLE_AREA_HOVER_LIFT_Y * t
    const textLiftY = TITLE_AREA_HOVER_TEXT_LIFT_Y * t
    const artZoom = 1 + (TITLE_AREA_HOVER_ART_ZOOM - 1) * t
    const centerY = panel.centerY + liftY
    const depthBoost = Math.round(TITLE_AREA_HOVER_DEPTH * t)

    panel.border.setPosition(panel.centerX, centerY)
    panel.border.setScale(panelScale)
    panel.border.setDepth(depthBoost)

    panel.background.setPosition(panel.centerX, centerY)
    panel.background.setScale(panelScale)
    panel.background.setDepth(depthBoost + 2)
    // グレー重ねを tween で薄くして絵を見せる
    // Python: overlay = rest_alpha * (1 - t) + hover_alpha * t に相当
    const restOverlayAlpha = this.getAreaPanelRestOverlayAlpha(panel)
    const overlayAlpha =
      restOverlayAlpha + (TITLE_AREA_HOVER_OVERLAY_ALPHA - restOverlayAlpha) * t
    panel.background.setFillStyle(panel.background.fillColor, overlayAlpha)

    // 名前はロック有無で X が違うので、Y とスケールだけ動かす（さらに上へ）
    panel.nameText.y = panel.nameBaseY + liftY + textLiftY
    panel.nameText.setScale(panelScale)
    panel.nameText.setDepth(depthBoost + 3)

    // 通常は名前と同じだけ上げる。Plains だけ目に重なるので上端ギリギリまで上げる
    let stagesY = panel.stagesBaseY + liftY + textLiftY
    if (panel.area.id === 'plains') {
      const panelTopY =
        panel.centerY + liftY - (TITLE_AREA_PANEL_HEIGHT * panelScale) / 2
      const plainsStagesY = panelTopY + TITLE_AREA_HOVER_PLAINS_STAGES_TOP_PADDING
      stagesY = stagesY + (plainsStagesY - stagesY) * t
    }
    panel.stagesText.setPosition(panel.centerX, stagesY)
    panel.stagesText.setScale(panelScale)
    panel.stagesText.setDepth(depthBoost + 3)

    // ロックアイコンは名前に合わせて上へ
    panel.lockIcon.container.y = panel.nameBaseY + liftY + textLiftY
    panel.lockIcon.container.setScale(panelScale)
    panel.lockIcon.container.setDepth(depthBoost + 4)

    if (panel.artImage !== null) {
      panel.artImage.setPosition(panel.centerX, centerY)
      panel.artImage.setScale(
        panel.artBaseScaleX * panelScale * artZoom,
        panel.artBaseScaleY * panelScale * artZoom,
      )
      const artAlpha =
        TITLE_AREA_ART_ALPHA + (TITLE_AREA_HOVER_ART_ALPHA - TITLE_AREA_ART_ALPHA) * t
      panel.artImage.setAlpha(artAlpha)
      panel.artImage.setDepth(depthBoost + 1)
      this.redrawAreaArtMask(panel, panelScale, liftY)
    }
  }

  /** 非選択時のグレー重ねの不透明度 */
  private getAreaPanelRestOverlayAlpha(panel: AreaPanelView): number {
    if (!isAreaRevealed(panel.area)) {
      return TITLE_AREA_PANEL_FILL_ALPHA_HIDDEN
    }
    if (isAreaPlayable(panel.area)) {
      return TITLE_AREA_PANEL_FILL_ALPHA_PLAYABLE
    }
    return TITLE_AREA_PANEL_FILL_ALPHA_LOCKED
  }

  /** ホバーでパネルが動いても絵が枠内に収まるようマスクを描き直す */
  private redrawAreaArtMask(
    panel: AreaPanelView,
    panelScale: number,
    liftY: number,
  ): void {
    if (panel.artMaskGraphics === null) {
      return
    }
    const width = TITLE_AREA_PANEL_WIDTH * panelScale
    const height = TITLE_AREA_PANEL_HEIGHT * panelScale
    panel.artMaskGraphics.clear()
    panel.artMaskGraphics.fillStyle(0xffffff)
    panel.artMaskGraphics.fillRect(
      panel.centerX - width / 2,
      panel.centerY + liftY - height / 2,
      width,
      height,
    )
  }

  private setupKeyboard(): void {
    if (this.input.keyboard === null) {
      return
    }

    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
    this.keyUp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP)
    this.keyDown = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN)
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    this.keyT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T)
    this.keyLeft = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT)
    this.keyRight = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT)

    this.keyW.on('down', () => {
      if (this.consumeShopUnlockTipInput()) {
        return
      }
      this.moveSelection(-1)
    })
    this.keyUp.on('down', () => {
      if (this.consumeShopUnlockTipInput()) {
        return
      }
      this.moveSelection(-1)
    })
    this.keyS.on('down', () => {
      if (this.consumeShopUnlockTipInput()) {
        return
      }
      this.moveSelection(1)
    })
    this.keyDown.on('down', () => {
      if (this.consumeShopUnlockTipInput()) {
        return
      }
      this.moveSelection(1)
    })
    this.keySpace.on('down', () => {
      if (this.consumeShopUnlockTipInput()) {
        return
      }
      this.confirmSelection()
    })
    this.keyEnter.on('down', () => {
      if (this.consumeShopUnlockTipInput()) {
        return
      }
      this.confirmSelection()
    })
    // 歯車選択中に A / T / ← で実績へ。実績選択中に D / → で歯車へ
    this.keyA.on('down', () => {
      if (this.consumeShopUnlockTipInput()) {
        return
      }
      this.moveTopBarHorizontal(-1)
    })
    this.keyT.on('down', () => {
      if (this.consumeShopUnlockTipInput()) {
        return
      }
      this.moveTopBarHorizontal(-1)
    })
    this.keyLeft.on('down', () => {
      if (this.consumeShopUnlockTipInput()) {
        return
      }
      this.moveTopBarHorizontal(-1)
    })
    this.keyD.on('down', () => {
      if (this.consumeShopUnlockTipInput()) {
        return
      }
      this.moveTopBarHorizontal(1)
    })
    this.keyRight.on('down', () => {
      if (this.consumeShopUnlockTipInput()) {
        return
      }
      this.moveTopBarHorizontal(1)
    })
  }

  // 役割: 上部バー（Gold ↔ 実績 ↔ 歯車）の左右移動
  private moveTopBarHorizontal(direction: number): void {
    if (this.debugProgressButton !== null && this.debugProgressButton.isMenuOpen()) {
      return
    }
    if (this.confirmDialogSystem.isOpen()) {
      return
    }
    if (this.shopSystem.isOpen()) {
      return
    }
    if (this.sealSkillSystem.isOpen()) {
      return
    }
    if (this.settingsMenuSystem !== undefined && this.settingsMenuSystem.isMenuOpen()) {
      return
    }
    // 下部の横並び枠は、A/D・左右キーで Shop ↔ Seal Skills を移動する
    // （ロック中でも選択だけはできる）
    if (this.isShopSelected() || this.isSealSelected()) {
      if (direction < 0) {
        this.selectMenuItem(this.getShopSelectionIndex())
      } else {
        this.selectMenuItem(this.getSealSelectionIndex())
      }
      return
    }

    // 上部バー: Gold ←→ Achievements ←→ Settings
    if (this.isSettingsSelected()) {
      if (direction < 0) {
        this.selectMenuItem(this.getAchievementSelectionIndex())
      }
      return
    }
    if (this.isAchievementsSelected()) {
      if (direction < 0) {
        this.selectMenuItem(this.getGoldSelectionIndex())
      } else {
        this.selectMenuItem(this.getSettingsSelectionIndex())
      }
      return
    }
    if (this.isGoldSelected()) {
      if (direction > 0) {
        this.selectMenuItem(this.getAchievementSelectionIndex())
      }
      return
    }

    // 右下: Debug ←→ BGM（Debug は BGM の左）
    if (this.isBgmSelected()) {
      if (
        direction < 0 &&
        TITLE_SHOW_DEBUG_PROGRESS &&
        this.debugProgressButton !== null
      ) {
        this.selectMenuItem(this.getDebugSelectionIndex())
      }
      return
    }
    if (this.isDebugSelected()) {
      if (direction > 0) {
        this.selectMenuItem(this.getBgmSelectionIndex())
      }
      return
    }

    // エリアグリッド内: 同じ行の左右移動
    if (this.selectedIndex >= 0 && this.selectedIndex < this.panelViews.length) {
      this.moveAreaGridHorizontal(direction)
    }
  }

  // 役割: エリア 2列グリッドの左右移動（? は飛ばす）
  private moveAreaGridHorizontal(direction: number): void {
    const columns = TITLE_AREA_PANEL_COLUMNS
    const row = Math.floor(this.selectedIndex / columns)
    const column = this.selectedIndex % columns
    const targetColumn = column + direction
    if (targetColumn < 0 || targetColumn >= columns) {
      return
    }

    const targetIndex = row * columns + targetColumn
    if (targetIndex < 0 || targetIndex >= this.panelViews.length) {
      return
    }
    if (!isAreaSelectableOnTitle(this.panelViews[targetIndex].area)) {
      return
    }
    this.selectMenuItem(targetIndex)
  }

  private moveSelection(direction: number): void {
    if (this.debugProgressButton !== null && this.debugProgressButton.isMenuOpen()) {
      return
    }
    if (this.confirmDialogSystem.isOpen()) {
      return
    }
    if (this.shopSystem.isOpen()) {
      return
    }
    if (this.sealSkillSystem.isOpen()) {
      return
    }
    if (this.settingsMenuSystem !== undefined && this.settingsMenuSystem.isMenuOpen()) {
      return
    }
    if (this.topBarView !== null && this.topBarView.isAchievementsPanelOpen()) {
      this.topBarView.closeAchievementsPanel()
    }

    // 縦移動の直感的な並び:
    // Plains ←上→ Settings / Achievements / Gold ←上→ BGM
    // Shop / Seal Skills ←下→ BGM ←下→ Settings
    if (this.isGoldSelected() || this.isAchievementsSelected()) {
      if (direction > 0) {
        // 下 → Plains（Settings と同じ）
        this.selectMenuItem(0)
      } else {
        this.selectMenuItem(this.getBgmSelectionIndex())
      }
      return
    }

    if (this.isBgmSelected() || this.isDebugSelected()) {
      if (direction > 0) {
        this.selectMenuItem(this.getSettingsSelectionIndex())
      } else if (TITLE_SHOW_SHOP_AND_SEAL) {
        this.selectMenuItem(this.getShopSelectionIndex())
      } else {
        this.selectMenuItem(this.findLastSelectableAreaIndex())
      }
      return
    }

    if (this.isSettingsSelected()) {
      if (direction < 0) {
        this.selectMenuItem(this.getBgmSelectionIndex())
      } else {
        this.selectMenuItem(0)
      }
      return
    }

    if (this.isShopSelected() || this.isSealSelected()) {
      if (direction > 0) {
        this.selectMenuItem(this.getBgmSelectionIndex())
        return
      }
      // Shop / Seal Skills から上 → 最後に選べるエリア（? は飛ばす）
      if (this.panelViews.length > 0) {
        this.selectMenuItem(this.findLastSelectableAreaIndex())
      }
      return
    }

    // エリアグリッド内の上下移動（同じ列。? 表記はスキップ）
    if (this.panelViews.length <= 0) {
      return
    }

    const columns = TITLE_AREA_PANEL_COLUMNS
    const column = this.selectedIndex % columns
    const row = Math.floor(this.selectedIndex / columns)
    const rowStep = direction < 0 ? -1 : 1
    let nextRow = row + rowStep

    while (nextRow >= 0) {
      const candidateIndex = nextRow * columns + column
      if (candidateIndex >= this.panelViews.length) {
        break
      }
      if (isAreaSelectableOnTitle(this.panelViews[candidateIndex].area)) {
        this.selectMenuItem(candidateIndex)
        return
      }
      nextRow = nextRow + rowStep
    }

    if (direction < 0) {
      // 上に選べるエリアがない → Settings
      this.selectMenuItem(this.getSettingsSelectionIndex())
      return
    }
    // 下に選べるエリアがない → Shop（非表示時は BGM）
    if (TITLE_SHOW_SHOP_AND_SEAL) {
      this.selectMenuItem(this.getShopSelectionIndex())
      return
    }
    this.selectMenuItem(this.getBgmSelectionIndex())
  }

  private refreshSelectionVisual(): void {
    // Clear Save などで ? に戻ったあと、選択が ? に残らないようにする
    if (
      this.selectedIndex >= 0 &&
      this.selectedIndex < this.panelViews.length &&
      !isAreaSelectableOnTitle(this.panelViews[this.selectedIndex].area)
    ) {
      this.selectedIndex = this.findLastSelectableAreaIndex()
    }

    for (let index = 0; index < this.panelViews.length; index++) {
      const panel = this.panelViews[index]
      const playable = isAreaPlayable(panel.area)
      const revealed = isAreaRevealed(panel.area)
      const selectable = isAreaSelectableOnTitle(panel.area)
      const isSelected = index === this.selectedIndex

      // Clear Save 直後にも即時反映されるよう、文字の内容と色を毎回更新する
      // ホバー中でも基準位置でレイアウトし、最後に浮き演出をかけ直す
      const nameCenterX = panel.centerX
      const nameCenterY = panel.nameBaseY
      if (!revealed) {
        panel.nameText.setText('?')
        panel.stagesText.setText('???')
        layoutLockIconWithCenteredText(
          panel.lockIcon,
          panel.nameText,
          nameCenterX,
          nameCenterY,
          TITLE_LOCK_ICON_GAP,
          false,
        )
      } else if (playable) {
        panel.nameText.setText(panel.area.name)
        panel.stagesText.setText(`${panel.area.stageCount} Stages`)
        layoutLockIconWithCenteredText(
          panel.lockIcon,
          panel.nameText,
          nameCenterX,
          nameCenterY,
          TITLE_LOCK_ICON_GAP,
          false,
        )
      } else {
        panel.nameText.setText(panel.area.name)
        panel.stagesText.setText(`${panel.area.stageCount} Stages`)
        layoutLockIconWithCenteredText(
          panel.lockIcon,
          panel.nameText,
          nameCenterX,
          nameCenterY,
          TITLE_LOCK_ICON_GAP,
          true,
        )
      }

      if (playable) {
        panel.nameText.setColor(TITLE_AREA_NAME_COLOR)
        panel.stagesText.setColor(TITLE_AREA_SUB_COLOR)
        setLockIconColor(panel.lockIcon, TITLE_LOCK_ICON_COLOR)
      } else {
        panel.nameText.setColor(TITLE_AREA_LOCKED_NAME_COLOR)
        panel.stagesText.setColor(TITLE_AREA_LOCKED_NAME_COLOR)
        setLockIconColor(panel.lockIcon, TITLE_LOCK_ICON_COLOR)
      }

      if (panel.artImage !== null) {
        panel.artImage.setVisible(revealed)
      }

      // ? はクリック不可。名前が出たら（グレー含む）選択可能
      if (selectable) {
        panel.background.setInteractive({ useHandCursor: true })
      } else {
        panel.background.disableInteractive()
      }

      if (isSelected) {
        panel.border.setFillStyle(TITLE_AREA_PANEL_SELECTED_BORDER_COLOR)
      } else {
        panel.border.setFillStyle(TITLE_AREA_PANEL_BORDER_COLOR)
      }

      if (!revealed) {
        panel.background.setFillStyle(
          TITLE_AREA_LOCKED_PANEL_COLOR,
          TITLE_AREA_PANEL_FILL_ALPHA_HIDDEN,
        )
      } else if (playable) {
        if (isSelected) {
          panel.background.setFillStyle(
            TITLE_AREA_PANEL_HOVER_COLOR,
            TITLE_AREA_PANEL_FILL_ALPHA_PLAYABLE,
          )
        } else {
          panel.background.setFillStyle(
            TITLE_AREA_PANEL_COLOR,
            TITLE_AREA_PANEL_FILL_ALPHA_PLAYABLE,
          )
        }
      } else {
        panel.background.setFillStyle(
          TITLE_AREA_LOCKED_PANEL_COLOR,
          TITLE_AREA_PANEL_FILL_ALPHA_LOCKED,
        )
      }

      this.applyAreaPanelHoverVisual(panel)
    }

    // マウスでもキーでも、選択中エリアだけ浮き・ズーム
    this.syncAreaPanelRaiseFromSelection()

    if (this.topBarView !== null) {
      this.topBarView.setGearSelected(this.isSettingsSelected())
      this.topBarView.setAchievementSelected(this.isAchievementsSelected())
      this.topBarView.setGoldSelected(this.isGoldSelected())
    }
    this.bgmToggleButton?.setSelected(this.isBgmSelected())
    this.debugProgressButton?.setSelected(this.isDebugSelected())

    if (this.shopPreviewView !== null) {
      const shopUnlocked = this.isShopMenuUnlocked()
      const shopSelected = this.isShopSelected()

      // ロック中でも選択時は黄色い枠（エリアの LOCKED と同じ）
      this.shopPreviewView.border.setFillStyle(
        shopSelected
          ? TITLE_AREA_PANEL_SELECTED_BORDER_COLOR
          : TITLE_SHOP_PANEL_BORDER_COLOR,
      )

      if (shopUnlocked) {
        this.shopPreviewView.background.setFillStyle(
          shopSelected ? TITLE_AREA_PANEL_HOVER_COLOR : TITLE_SHOP_PANEL_COLOR,
        )
        if (this.shopPreviewView.titleText !== undefined) {
          this.shopPreviewView.titleText.setColor(TITLE_SHOP_TITLE_COLOR)
          this.shopPreviewView.titleText.setText(TITLE_SHOP_TITLE_TEXT)
        }
        if (this.shopPreviewView.descText !== undefined) {
          this.shopPreviewView.descText.setColor(TITLE_SHOP_DESC_COLOR)
          this.shopPreviewView.descText.setText(TITLE_SHOP_DESC_TEXT)
          shrinkTextToFitWidth(
            this.shopPreviewView.descText,
            TITLE_SHOP_PANEL_WIDTH - 16,
          )
        }
        if (this.shopPreviewView.titleText !== undefined) {
          layoutLockIconWithCenteredText(
            this.shopPreviewView.lockIcon,
            this.shopPreviewView.titleText,
            this.shopPreviewView.centerX,
            this.shopPreviewView.titleCenterY,
            TITLE_LOCK_ICON_GAP,
            false,
          )
        }
      } else {
        this.shopPreviewView.background.setFillStyle(TITLE_AREA_LOCKED_PANEL_COLOR)
        if (this.shopPreviewView.titleText !== undefined) {
          this.shopPreviewView.titleText.setColor(TITLE_AREA_LOCKED_NAME_COLOR)
          this.shopPreviewView.titleText.setText(TITLE_SHOP_TITLE_TEXT)
        }
        if (this.shopPreviewView.descText !== undefined) {
          this.shopPreviewView.descText.setColor(TITLE_AREA_LOCKED_NAME_COLOR)
          this.shopPreviewView.descText.setText(TITLE_SHOP_UNLOCK_CONDITION)
          shrinkTextToFitWidth(
            this.shopPreviewView.descText,
            TITLE_SHOP_PANEL_WIDTH - 16,
          )
        }
        if (this.shopPreviewView.titleText !== undefined) {
          layoutLockIconWithCenteredText(
            this.shopPreviewView.lockIcon,
            this.shopPreviewView.titleText,
            this.shopPreviewView.centerX,
            this.shopPreviewView.titleCenterY,
            TITLE_LOCK_ICON_GAP,
            true,
          )
        }
      }
      this.shopPreviewView.background.setInteractive({ useHandCursor: true })
    }

    if (this.sealPreviewView !== null) {
      const sealUnlocked = this.isSealSkillsUnlocked()
      const sealSelected = this.isSealSelected()

      // ロック中でも選択時は黄色い枠
      this.sealPreviewView.border.setFillStyle(
        sealSelected
          ? TITLE_AREA_PANEL_SELECTED_BORDER_COLOR
          : TITLE_SHOP_PANEL_BORDER_COLOR,
      )

      if (sealUnlocked) {
        this.sealPreviewView.background.setFillStyle(
          sealSelected ? TITLE_AREA_PANEL_HOVER_COLOR : TITLE_SHOP_PANEL_COLOR,
        )
        if (this.sealPreviewView.titleText !== undefined) {
          this.sealPreviewView.titleText.setColor(TITLE_SHOP_TITLE_COLOR)
          this.sealPreviewView.titleText.setText(TITLE_SEAL_TITLE_TEXT)
        }
        if (this.sealPreviewView.descText !== undefined) {
          this.sealPreviewView.descText.setColor(TITLE_SHOP_DESC_COLOR)
          this.sealPreviewView.descText.setText(TITLE_SEAL_DESC_TEXT)
          shrinkTextToFitWidth(
            this.sealPreviewView.descText,
            TITLE_SHOP_PANEL_WIDTH - 16,
          )
        }
        if (this.sealPreviewView.titleText !== undefined) {
          layoutLockIconWithCenteredText(
            this.sealPreviewView.lockIcon,
            this.sealPreviewView.titleText,
            this.sealPreviewView.centerX,
            this.sealPreviewView.titleCenterY,
            TITLE_LOCK_ICON_GAP,
            false,
          )
        }
      } else {
        this.sealPreviewView.background.setFillStyle(TITLE_AREA_LOCKED_PANEL_COLOR)
        if (this.sealPreviewView.titleText !== undefined) {
          this.sealPreviewView.titleText.setColor(TITLE_AREA_LOCKED_NAME_COLOR)
          this.sealPreviewView.titleText.setText(TITLE_SEAL_TITLE_TEXT)
        }
        if (this.sealPreviewView.descText !== undefined) {
          this.sealPreviewView.descText.setColor(TITLE_AREA_LOCKED_NAME_COLOR)
          this.sealPreviewView.descText.setText('Buy Seal Slot in Shop')
          shrinkTextToFitWidth(
            this.sealPreviewView.descText,
            TITLE_SHOP_PANEL_WIDTH - 16,
          )
        }
        if (this.sealPreviewView.titleText !== undefined) {
          layoutLockIconWithCenteredText(
            this.sealPreviewView.lockIcon,
            this.sealPreviewView.titleText,
            this.sealPreviewView.centerX,
            this.sealPreviewView.titleCenterY,
            TITLE_LOCK_ICON_GAP,
            true,
          )
        }
      }
      this.sealPreviewView.background.setInteractive({ useHandCursor: true })
    }

    this.refreshConditionText()
  }

  private refreshConditionText(): void {
    if (this.conditionText === null) {
      return
    }

    if (this.confirmDialogSystem.isOpen()) {
      this.applyConditionText('', TITLE_AREA_CONDITION_COLOR)
      return
    }

    if (this.shopSystem.isOpen()) {
      this.applyConditionText('', TITLE_AREA_CONDITION_COLOR)
      return
    }
    if (this.sealSkillSystem.isOpen()) {
      this.applyConditionText('', TITLE_AREA_CONDITION_COLOR)
      return
    }

    if (this.isShopSelected()) {
      if (this.isShopMenuUnlocked()) {
        this.applyConditionText(
          'Click / SPACE / ENTER to open Shop',
          TITLE_SHOP_TITLE_COLOR,
        )
      } else {
        this.applyConditionText(
          TITLE_SHOP_UNLOCK_CONDITION,
          TITLE_AREA_LOCKED_NAME_COLOR,
        )
      }
      return
    }

    if (this.isSealSelected()) {
      if (this.isSealSkillsUnlocked()) {
        this.applyConditionText(
          'Choose skills to hide from level-up choices',
          TITLE_SHOP_TITLE_COLOR,
        )
      } else {
        this.applyConditionText('Buy Seal Slot in Shop', TITLE_AREA_LOCKED_NAME_COLOR)
      }
      return
    }

    if (this.isAchievementsSelected()) {
      this.applyConditionText(
        'SPACE / ENTER to open Achievements',
        TITLE_AREA_SUB_COLOR,
      )
      return
    }

    if (this.isGoldSelected()) {
      if (TITLE_SHOW_SHOP_AND_SEAL) {
        this.applyConditionText('Gold — spend in the Shop', TITLE_AREA_SUB_COLOR)
      } else {
        this.applyConditionText('Gold earned from clearing stages', TITLE_AREA_SUB_COLOR)
      }
      return
    }

    if (this.isSettingsSelected()) {
      this.applyConditionText(
        '← / A: Gold · Achievements  ·  SPACE: Settings',
        TITLE_AREA_SUB_COLOR,
      )
      return
    }

    if (this.isBgmSelected()) {
      if (TITLE_SHOW_DEBUG_PROGRESS) {
        this.applyConditionText(
          'SPACE / ENTER to switch BGM ON / OFF  ·  ← Debug',
          TITLE_AREA_SUB_COLOR,
        )
      } else {
        this.applyConditionText(
          'SPACE / ENTER to switch BGM ON / OFF',
          TITLE_AREA_SUB_COLOR,
        )
      }
      return
    }

    if (this.isDebugSelected()) {
      this.applyConditionText(
        'SPACE / ENTER: open  ·  → BGM  ·  menu: W/S + SPACE',
        TITLE_AREA_SUB_COLOR,
      )
      return
    }

    const panel = this.panelViews[this.selectedIndex]
    if (panel === undefined) {
      this.applyConditionText('', TITLE_AREA_CONDITION_COLOR)
      return
    }

    if (isAreaPlayable(panel.area)) {
      this.applyConditionText(
        'Click / SPACE / ENTER to start',
        TITLE_AREA_SUB_COLOR,
      )
      return
    }

    if (!isAreaRevealed(panel.area)) {
      this.applyConditionText('Unknown area', TITLE_AREA_CONDITION_COLOR)
      return
    }

    this.applyConditionText(panel.area.unlockCondition, TITLE_AREA_CONDITION_COLOR)
  }

  /** 条件文をセットし、画面幅に収まるよう縮小する（多言語化向け）。 */
  private applyConditionText(message: string, color: string): void {
    if (this.conditionText === null) {
      return
    }
    this.conditionText.setText(message)
    this.conditionText.setColor(color)
    if (message !== '') {
      shrinkTextToFitWidth(this.conditionText, GAME_WIDTH - 64)
    }
  }

  // 役割: ショップを開き、購入と同じ決定音を鳴らす
  private openShopMenu(): void {
    if (!this.isShopMenuUnlocked()) {
      this.playLockedActionDenied(this.shopPreviewView?.lockIcon ?? null)
      return
    }
    this.titleAudioSystem.playShopPurchase()
    this.clearAllAreaPanelHovers()
    this.shopSystem.open()
  }

  /**
   * Shop が初めて使えるようになったあと、タイトルに戻ったときの吹き出し案内。
   * Shop 枠の上に差し、クリックまたはキーで閉じる。
   */
  private showShopUnlockTip(): void {
    if (this.shopUnlockTipVisible || this.shopPreviewView === null) {
      return
    }

    this.shopUnlockTipVisible = true
    // Shop を選択状態にして、どこを指しているか分かりやすくする
    this.selectedIndex = this.getShopSelectionIndex()
    this.refreshSelectionVisual()

    const tipDepth = 550
    const shopX = this.shopPreviewView.background.x
    const shopY = this.shopPreviewView.background.y
    const bubbleWidth = 320
    const bubbleHeight = 78
    const bubbleCenterY = shopY - TITLE_SHOP_PANEL_HEIGHT / 2 - bubbleHeight / 2 - 18

    // 画面全体クリックで閉じる（下の UI は押せない）
    const dimOverlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.35,
    )
    dimOverlay.setScrollFactor(0)
    dimOverlay.setDepth(tipDepth)
    dimOverlay.setInteractive()
    dimOverlay.on('pointerdown', () => {
      this.consumeShopUnlockTipInput()
    })

    const bubbleBorder = this.add.rectangle(
      shopX,
      bubbleCenterY,
      bubbleWidth + 4,
      bubbleHeight + 4,
      0xfacc15,
    )
    bubbleBorder.setScrollFactor(0)
    bubbleBorder.setDepth(tipDepth + 1)

    const bubbleBody = this.add.rectangle(
      shopX,
      bubbleCenterY,
      bubbleWidth,
      bubbleHeight,
      0x1e293b,
    )
    bubbleBody.setScrollFactor(0)
    bubbleBody.setDepth(tipDepth + 2)

    // Shop を指す三角（下向き）
    const pointer = this.add.triangle(
      shopX,
      shopY - TITLE_SHOP_PANEL_HEIGHT / 2 - 6,
      0,
      0,
      -10,
      -14,
      10,
      -14,
      0xfacc15,
    )
    pointer.setScrollFactor(0)
    pointer.setDepth(tipDepth + 1)

    const tipText = this.add.text(shopX, bubbleCenterY - 10, TITLE_SHOP_UNLOCK_TIP_TEXT, {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '13px',
      color: '#fef9c3',
      align: 'center',
      wordWrap: { width: bubbleWidth - 24 },
    })
    tipText.setOrigin(0.5)
    tipText.setScrollFactor(0)
    tipText.setDepth(tipDepth + 3)

    const hintText = this.add.text(shopX, bubbleCenterY + 22, TITLE_SHOP_UNLOCK_TIP_HINT, {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '11px',
      color: '#94a3b8',
      align: 'center',
    })
    hintText.setOrigin(0.5)
    hintText.setScrollFactor(0)
    hintText.setDepth(tipDepth + 3)

    this.shopUnlockTipObjects = [
      dimOverlay,
      bubbleBorder,
      bubbleBody,
      pointer,
      tipText,
      hintText,
    ]
  }

  /** 吹き出し表示中なら閉じて true。表示していなければ false。 */
  private consumeShopUnlockTipInput(): boolean {
    return this.hideShopUnlockTip(true)
  }

  /**
   * Shop 解放案内の吹き出しを閉じる。
   * markSeen が true のときだけ「見た」をセーブに記録する。
   */
  private hideShopUnlockTip(markSeen: boolean): boolean {
    if (!this.shopUnlockTipVisible) {
      return false
    }

    for (let index = 0; index < this.shopUnlockTipObjects.length; index++) {
      this.shopUnlockTipObjects[index].destroy()
    }
    this.shopUnlockTipObjects = []
    this.shopUnlockTipVisible = false

    if (markSeen) {
      markShopUnlockTipSeen()
    }
    this.refreshSelectionVisual()
    return true
  }

  // 役割: シールスキル画面を開き、購入と同じ決定音を鳴らす
  private openSealSkillsMenu(): void {
    this.titleAudioSystem.playShopPurchase()
    this.clearAllAreaPanelHovers()
    this.sealSkillSystem.open()
  }

  // 役割: 設定を開き／閉じ、開くときだけ購入と同じ決定音を鳴らす
  private openSettingsMenu(): void {
    // すでに開いているときは閉じるだけ（決定音はキャンセル音側）
    if (this.settingsMenuSystem.isMenuOpen()) {
      this.settingsMenuSystem.toggle()
      return
    }
    this.titleAudioSystem.playShopPurchase()
    this.settingsMenuSystem.toggle()
  }

  // 役割: ESC で設定を開く（他のパネルが開いているときは何もしない）
  private openSettingsFromEscape(): void {
    if (this.consumeShopUnlockTipInput()) {
      return
    }
    if (this.debugProgressButton !== null && this.debugProgressButton.isMenuOpen()) {
      this.debugProgressButton.closeMenu()
      return
    }
    if (this.confirmDialogSystem.isOpen()) {
      return
    }
    if (this.shopSystem.isOpen()) {
      return
    }
    if (this.sealSkillSystem.isOpen()) {
      return
    }
    if (this.topBarView !== null) {
      this.topBarView.closeAchievementsPanel()
    }
    this.openSettingsMenu()
  }

  private confirmSelection(): void {
    if (this.debugProgressButton !== null && this.debugProgressButton.isMenuOpen()) {
      return
    }
    if (this.confirmDialogSystem.isOpen()) {
      return
    }
    if (this.shopSystem.isOpen()) {
      return
    }
    if (this.sealSkillSystem.isOpen()) {
      return
    }
    if (this.settingsMenuSystem !== undefined && this.settingsMenuSystem.isMenuOpen()) {
      return
    }

    if (this.isAchievementsSelected()) {
      if (this.topBarView !== null) {
        this.topBarView.toggleAchievementsPanel()
      }
      return
    }

    // ゴールドは説明フロートだけ。決定しても何もしない
    if (this.isGoldSelected()) {
      return
    }

    if (this.isShopSelected()) {
      if (!this.isShopMenuUnlocked()) {
        this.playLockedActionDenied(this.shopPreviewView?.lockIcon ?? null)
        return
      }
      this.openShopMenu()
      return
    }

    if (this.isSealSelected()) {
      if (!this.isSealSkillsUnlocked()) {
        this.playLockedActionDenied(this.sealPreviewView?.lockIcon ?? null)
        return
      }
      this.openSealSkillsMenu()
      return
    }

    if (this.isSettingsSelected()) {
      if (this.topBarView !== null) {
        this.topBarView.closeAchievementsPanel()
      }
      this.openSettingsMenu()
      return
    }

    if (this.isBgmSelected()) {
      this.bgmToggleButton?.toggle()
      return
    }

    if (this.isDebugSelected()) {
      this.debugProgressButton?.openMenu()
      return
    }

    const panel = this.panelViews[this.selectedIndex]
    if (panel === undefined) {
      return
    }
    if (!isAreaPlayable(panel.area)) {
      this.playLockedActionDenied(panel.lockIcon)
      return
    }
    this.startGame(panel.area.id)
  }

  /** ロック中メニューを決定したとき: キャンセル音 + 南京錠の拡大縮小 */
  private playLockedActionDenied(lockIcon: LockIconView | null): void {
    this.titleAudioSystem.playMenuCancel()
    if (lockIcon === null) {
      return
    }
    playLockIconDeniedPulse(this, lockIcon)
  }

  private startGame(areaId: StageAreaId): void {
    if (this.hasStarted) {
      return
    }
    if (this.confirmDialogSystem.isOpen()) {
      return
    }

    let selectedArea: StageAreaDef | null = null
    for (let index = 0; index < STAGE_AREAS.length; index++) {
      if (STAGE_AREAS[index].id === areaId) {
        selectedArea = STAGE_AREAS[index]
        break
      }
    }
    if (selectedArea === null || !isAreaPlayable(selectedArea)) {
      return
    }

    clearRunProgress()

    this.hasStarted = true
    // ユーザー操作の直後に音声ロックを外す（このタイミングが一番確実）
    this.sound.unlock()
    this.titleAudioSystem.unlock()
    this.titleAudioSystem.prepare()
    this.scene.start('GameScene', {
      stageNumber: 1,
      areaId: selectedArea.id,
      // 最初は止まっている（キーボードモード）。画面クリックでマウス追従へ
      isKeyboardMode: true,
    })
  }
}
