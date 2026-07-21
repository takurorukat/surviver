import Phaser from 'phaser'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  TOP_BAR_HEIGHT,
  STAGE_AREAS,
  TITLE_AREA_PANEL_WIDTH,
  TITLE_AREA_PANEL_HEIGHT,
  TITLE_AREA_PANEL_GAP,
  TITLE_AREA_PANEL_COLOR,
  TITLE_AREA_PANEL_BORDER_COLOR,
  TITLE_AREA_PANEL_SELECTED_BORDER_COLOR,
  TITLE_AREA_PANEL_HOVER_COLOR,
  TITLE_AREA_LOCKED_PANEL_COLOR,
  TITLE_AREA_NAME_COLOR,
  TITLE_AREA_SUB_COLOR,
  TITLE_AREA_LOCKED_NAME_COLOR,
  TITLE_LOCK_ICON_SIZE,
  TITLE_LOCK_ICON_COLOR,
  TITLE_LOCK_ICON_GAP,
  TITLE_AREA_NAME_LEFT_PADDING,
  TITLE_AREA_STAGES_RIGHT_PADDING,
  TITLE_AREA_CONDITION_COLOR,
  TITLE_SHOP_PANEL_WIDTH,
  TITLE_SHOP_PANEL_HEIGHT,
  TITLE_SHOP_PANEL_BORDER_COLOR,
  TITLE_SHOP_PANEL_COLOR,
  TITLE_SHOP_TITLE_COLOR,
  TITLE_SHOP_DESC_COLOR,
  TITLE_SHOP_TITLE_TEXT,
  TITLE_SHOP_DESC_TEXT,
  TITLE_SHOP_UNLOCK_CONDITION,
  TITLE_SHOP_UNLOCK_TIP_TEXT,
  TITLE_SHOP_UNLOCK_TIP_HINT,
  TITLE_ACTION_PANEL_GAP,
  TITLE_SEAL_TITLE_TEXT,
  TITLE_SEAL_DESC_TEXT,
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
  createFullscreenToggleButton,
  type FullscreenToggleButtonView,
} from '../systems/FullscreenToggleButtonSystem'
import { SettingsMenuSystem } from '../systems/SettingsMenuSystem'
import { ConfirmDialogSystem } from '../systems/ConfirmDialogSystem'
import { ShopSystem } from '../systems/ShopSystem'
import { SealSkillSystem } from '../systems/SealSkillSystem'
import { shrinkTextToFitWidth } from '../utils/fitTextToWidth'
import {
  createLockIcon,
  layoutLockIconAfterText,
  layoutLockIconWithCenteredText,
  playLockIconDeniedPulse,
  setLockIconColor,
  type LockIconView,
} from '../ui/LockIcon'

type AreaPanelView = {
  area: StageAreaDef
  border: Phaser.GameObjects.Rectangle
  background: Phaser.GameObjects.Rectangle
  nameText: Phaser.GameObjects.Text
  stagesText: Phaser.GameObjects.Text
  lockIcon: LockIconView
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
  private fullscreenToggleButton: FullscreenToggleButtonView | null = null

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
    // 戦闘 BGM が残っていても、タイトルでは必ず止める（死亡後の鳴り続け対策）
    this.titleAudioSystem.stopBgm()
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

    const titleText = this.add.text(GAME_WIDTH / 2, contentTop, 'Survivor Stage', {
      fontFamily: FONT_FAMILY_HEADING,
      fontSize: '28px',
      color: '#ffffff',
    })
    titleText.setOrigin(0.5)

    const selectLabel = this.add.text(GAME_WIDTH / 2, contentTop + 34, 'SELECT AREA', {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '15px',
      color: '#a1a1aa',
    })
    selectLabel.setOrigin(0.5)

    // 途中再開はしない（旧セーブに残っていても消す）
    clearRunProgress()
    this.createAreaPanels()
    this.shopPreviewView = this.createShopPreviewPanel()
    this.sealPreviewView = this.createSealPreviewPanel()

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

    this.fullscreenToggleButton = createFullscreenToggleButton(this, () => {
      if (
        this.confirmDialogSystem.isOpen() ||
        this.shopSystem.isOpen() ||
        this.sealSkillSystem.isOpen()
      ) {
        return
      }
      this.selectMenuItem(this.getFullscreenSelectionIndex())
    })

    this.setupKeyboard()
    this.refreshSelectionVisual()

    // 初めて Shop が開いたあと、タイトルに戻ったときだけ吹き出し案内を出す
    if (shouldShowShopUnlockTip()) {
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
  }

  update(): void {
    // 設定メニュー側でBGMを切り替えた場合も、右下アイコンへすぐ反映する
    this.bgmToggleButton?.refresh()
    this.fullscreenToggleButton?.refresh()
  }

  // 選択番号: エリア → Shop → Seal Skills → 実績 → Settings → BGM → Fullscreen
  // 縦移動では実績を飛ばし、実績は Settings から左右キーだけ
  private getShopSelectionIndex(): number {
    return this.panelViews.length
  }

  private getSealSelectionIndex(): number {
    return this.panelViews.length + 1
  }

  private getAchievementSelectionIndex(): number {
    return this.panelViews.length + 3
  }

  private getSettingsSelectionIndex(): number {
    return this.panelViews.length + 4
  }

  private getBgmSelectionIndex(): number {
    return this.panelViews.length + 5
  }

  private getFullscreenSelectionIndex(): number {
    return this.panelViews.length + 6
  }

  private getGoldSelectionIndex(): number {
    // 上部バー左端寄り: Gold → Achievements → Settings
    return this.panelViews.length + 2
  }

  private isShopSelected(): boolean {
    return this.selectedIndex === this.getShopSelectionIndex()
  }

  private isSealSelected(): boolean {
    return this.selectedIndex === this.getSealSelectionIndex()
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

  /** エリア一覧で、direction 方向の次に選べるパネル index。なければ null。 */
  private findNextSelectableAreaIndex(
    fromIndex: number,
    direction: number,
  ): number | null {
    let index = fromIndex + direction
    while (index >= 0 && index < this.panelViews.length) {
      if (isAreaSelectableOnTitle(this.panelViews[index].area)) {
        return index
      }
      index = index + direction
    }
    return null
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

  private isBgmSelected(): boolean {
    return this.selectedIndex === this.getBgmSelectionIndex()
  }

  private isFullscreenSelected(): boolean {
    return this.selectedIndex === this.getFullscreenSelectionIndex()
  }

  private createAreaPanels(): void {
    const centerX = GAME_WIDTH / 2
    // SELECT AREA の下に余白を空けて、文字がパネルに隠れないようにする
    // 6エリア全体が GAME_HEIGHT に収まる位置から始める（スクロールなし）
    const startY = TOP_BAR_HEIGHT + 104

    for (let index = 0; index < STAGE_AREAS.length; index++) {
      const area = STAGE_AREAS[index]
      const centerY = startY + index * (TITLE_AREA_PANEL_HEIGHT + TITLE_AREA_PANEL_GAP)
      const panelView = this.createOneAreaPanel(area, centerX, centerY, index)
      this.panelViews.push(panelView)
    }
  }

  // 「Click / SPACE / ENTER to start」のすぐ上に、ショップ案内の四角枠を置く
  private createShopPreviewPanel(): ActionPreviewView {
    const centerX =
      GAME_WIDTH / 2 - TITLE_SHOP_PANEL_WIDTH / 2 - TITLE_ACTION_PANEL_GAP / 2
    // conditionText（GAME_HEIGHT - 56）のすぐ上
    const centerY = GAME_HEIGHT - 92

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

    const titleCenterY = centerY - 9
    const titleText = this.add.text(centerX, titleCenterY, TITLE_SHOP_TITLE_TEXT, {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '16px',
      color: TITLE_SHOP_TITLE_COLOR,
      fontStyle: 'bold',
    })
    titleText.setOrigin(0.5)
    titleText.setScrollFactor(0)

    const descText = this.add.text(centerX, centerY + 11, TITLE_SHOP_DESC_TEXT, {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '12px',
      color: TITLE_SHOP_DESC_COLOR,
    })
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
    const centerY = GAME_HEIGHT - 92

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

    const titleCenterY = centerY - 9
    const titleText = this.add.text(centerX, titleCenterY, TITLE_SEAL_TITLE_TEXT, {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '16px',
      color: TITLE_SHOP_TITLE_COLOR,
      fontStyle: 'bold',
    })
    titleText.setOrigin(0.5)
    const descText = this.add.text(centerX, centerY + 11, TITLE_SEAL_DESC_TEXT, {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '12px',
      color: TITLE_SHOP_DESC_COLOR,
    })
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

    const border = this.add.rectangle(
      centerX,
      centerY,
      TITLE_AREA_PANEL_WIDTH + 4,
      TITLE_AREA_PANEL_HEIGHT + 4,
      TITLE_AREA_PANEL_BORDER_COLOR,
    )

    const background = this.add.rectangle(
      centerX,
      centerY,
      TITLE_AREA_PANEL_WIDTH,
      TITLE_AREA_PANEL_HEIGHT,
      fillColor,
    )

    const panelLeft = centerX - TITLE_AREA_PANEL_WIDTH / 2
    const nameX = panelLeft + TITLE_AREA_NAME_LEFT_PADDING
    let nameLabel = '?'
    if (revealed) {
      nameLabel = area.name
    }
    const nameText = this.add.text(nameX, centerY, nameLabel, {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '18px',
      color: nameColor,
      fontStyle: 'bold',
    })
    nameText.setOrigin(0, 0.5)

    const panelRight = centerX + TITLE_AREA_PANEL_WIDTH / 2
    const stagesX = panelRight - TITLE_AREA_STAGES_RIGHT_PADDING
    const stagesLabel = revealed ? `${area.stageCount} Stages` : '???'
    const stagesText = this.add.text(stagesX, centerY, stagesLabel, {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '14px',
      color: playable ? TITLE_AREA_SUB_COLOR : TITLE_AREA_LOCKED_NAME_COLOR,
    })
    stagesText.setOrigin(1, 0.5)

    const lockIcon = createLockIcon(
      this,
      nameX,
      centerY,
      TITLE_LOCK_ICON_SIZE,
      TITLE_LOCK_ICON_COLOR,
    )
    layoutLockIconAfterText(
      lockIcon,
      nameText,
      TITLE_LOCK_ICON_GAP,
      revealed && !playable,
    )

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

    return {
      area,
      border,
      background,
      nameText,
      stagesText,
      lockIcon,
    }
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

    // 右下ボタン: Fullscreen ←→ BGM
    if (this.isBgmSelected()) {
      if (direction < 0) {
        this.selectMenuItem(this.getFullscreenSelectionIndex())
      }
      return
    }
    if (this.isFullscreenSelected()) {
      if (direction > 0) {
        this.selectMenuItem(this.getBgmSelectionIndex())
      }
      return
    }
  }

  private moveSelection(direction: number): void {
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

    if (this.isBgmSelected() || this.isFullscreenSelected()) {
      if (direction > 0) {
        this.selectMenuItem(this.getSettingsSelectionIndex())
      } else {
        this.selectMenuItem(this.getShopSelectionIndex())
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

    // エリア一覧内の上下移動（? 表記はスキップ）
    if (this.panelViews.length <= 0) {
      return
    }

    if (direction < 0) {
      const nextAreaIndex = this.findNextSelectableAreaIndex(this.selectedIndex, -1)
      if (nextAreaIndex === null) {
        // 上に選べるエリアがない → Settings
        this.selectMenuItem(this.getSettingsSelectionIndex())
        return
      }
      this.selectMenuItem(nextAreaIndex)
      return
    }

    const nextAreaIndex = this.findNextSelectableAreaIndex(this.selectedIndex, 1)
    if (nextAreaIndex === null) {
      // 下に選べるエリアがない → Shop
      this.selectMenuItem(this.getShopSelectionIndex())
      return
    }
    this.selectMenuItem(nextAreaIndex)
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
      if (!revealed) {
        panel.nameText.setText('?')
        panel.stagesText.setText('???')
        layoutLockIconAfterText(panel.lockIcon, panel.nameText, TITLE_LOCK_ICON_GAP, false)
      } else if (playable) {
        panel.nameText.setText(panel.area.name)
        panel.stagesText.setText(`${panel.area.stageCount} Stages`)
        layoutLockIconAfterText(panel.lockIcon, panel.nameText, TITLE_LOCK_ICON_GAP, false)
      } else {
        panel.nameText.setText(panel.area.name)
        panel.stagesText.setText(`${panel.area.stageCount} Stages`)
        layoutLockIconAfterText(panel.lockIcon, panel.nameText, TITLE_LOCK_ICON_GAP, true)
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

      if (playable) {
        if (isSelected) {
          panel.background.setFillStyle(TITLE_AREA_PANEL_HOVER_COLOR)
        } else {
          panel.background.setFillStyle(TITLE_AREA_PANEL_COLOR)
        }
      } else {
        panel.background.setFillStyle(TITLE_AREA_LOCKED_PANEL_COLOR)
      }
    }

    if (this.topBarView !== null) {
      this.topBarView.setGearSelected(this.isSettingsSelected())
      this.topBarView.setAchievementSelected(this.isAchievementsSelected())
      this.topBarView.setGoldSelected(this.isGoldSelected())
    }
    this.bgmToggleButton?.setSelected(this.isBgmSelected())
    this.fullscreenToggleButton?.setSelected(this.isFullscreenSelected())

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
      this.conditionText.setText('')
      return
    }

    if (this.shopSystem.isOpen()) {
      this.conditionText.setText('')
      return
    }
    if (this.sealSkillSystem.isOpen()) {
      this.conditionText.setText('')
      return
    }

    if (this.isShopSelected()) {
      if (this.isShopMenuUnlocked()) {
        this.conditionText.setText('Click / SPACE / ENTER to open Shop')
        this.conditionText.setColor(TITLE_SHOP_TITLE_COLOR)
      } else {
        this.conditionText.setText(TITLE_SHOP_UNLOCK_CONDITION)
        this.conditionText.setColor(TITLE_AREA_LOCKED_NAME_COLOR)
      }
      return
    }

    if (this.isSealSelected()) {
      if (this.isSealSkillsUnlocked()) {
        this.conditionText.setText('Choose skills to hide from level-up choices')
        this.conditionText.setColor(TITLE_SHOP_TITLE_COLOR)
      } else {
        this.conditionText.setText('Buy Seal Slot in Shop')
        this.conditionText.setColor(TITLE_AREA_LOCKED_NAME_COLOR)
      }
      return
    }

    if (this.isAchievementsSelected()) {
      this.conditionText.setText('SPACE / ENTER to open Achievements')
      this.conditionText.setColor(TITLE_AREA_SUB_COLOR)
      return
    }

    if (this.isGoldSelected()) {
      this.conditionText.setText('Gold — spend in the Shop')
      this.conditionText.setColor(TITLE_AREA_SUB_COLOR)
      return
    }

    if (this.isSettingsSelected()) {
      this.conditionText.setText('← / A: Gold · Achievements  ·  SPACE: Settings')
      this.conditionText.setColor(TITLE_AREA_SUB_COLOR)
      return
    }

    if (this.isBgmSelected()) {
      this.conditionText.setText('SPACE / ENTER to switch BGM ON / OFF')
      this.conditionText.setColor(TITLE_AREA_SUB_COLOR)
      return
    }

    const panel = this.panelViews[this.selectedIndex]
    if (panel === undefined) {
      this.conditionText.setText('')
      return
    }

    if (isAreaPlayable(panel.area)) {
      this.conditionText.setText('Click / SPACE / ENTER to start')
      this.conditionText.setColor(TITLE_AREA_SUB_COLOR)
      return
    }

    if (!isAreaRevealed(panel.area)) {
      this.conditionText.setText('Unknown area')
      this.conditionText.setColor(TITLE_AREA_CONDITION_COLOR)
      return
    }

    this.conditionText.setText(panel.area.unlockCondition)
    this.conditionText.setColor(TITLE_AREA_CONDITION_COLOR)
  }

  // 役割: ショップを開き、購入と同じ決定音を鳴らす
  private openShopMenu(): void {
    if (!this.isShopMenuUnlocked()) {
      this.playLockedActionDenied(this.shopPreviewView?.lockIcon ?? null)
      return
    }
    this.titleAudioSystem.playShopPurchase()
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

    if (this.isFullscreenSelected()) {
      this.fullscreenToggleButton?.toggle()
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
