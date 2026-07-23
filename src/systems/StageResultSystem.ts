// ============================================================
// StageResultSystem.ts
// ------------------------------------------------------------
// ステージ終了時の結果画面（クリア／ゲームクリア／失敗）。
//
// 役割:
//   - 暗いオーバーレイ＋パネル＋タイトル＋ボタンを出す
//   - ボタンクリックまたは SPACE で onConfirm を呼ぶ
//   - ゲームクリア時は実績解放の文言（unlockLines）も表示できる
//
// 呼び出し元:
//   - GameScene.ts … ステージクリア／ゲームクリア／敗北時に show
//
// 関連ファイル:
//   - AchievementSystem.ts … formatUnlockNotificationLines で文言を作る
//   - GameConstants.ts … 色・サイズ・depth などの UI 定数
// ============================================================

import Phaser from 'phaser'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  STAGE_RESULT_OVERLAY_COLOR,
  STAGE_RESULT_OVERLAY_ALPHA,
  STAGE_RESULT_PANEL_WIDTH,
  STAGE_RESULT_PANEL_HEIGHT,
  STAGE_RESULT_PANEL_HEIGHT_WITH_UNLOCK,
  STAGE_RESULT_UNLOCK_LINE_HEIGHT,
  STAGE_RESULT_UNLOCK_PANEL_CHROME_HEIGHT,
  STAGE_RESULT_PANEL_MAX_HEIGHT,
  STAGE_RESULT_PANEL_COLOR,
  STAGE_RESULT_PANEL_BORDER_COLOR,
  STAGE_RESULT_TITLE_CLEAR_COLOR,
  STAGE_RESULT_TITLE_AREA_CLEAR_LABEL,
  STAGE_RESULT_SUBTITLE_AREA_CLEAR,
  STAGE_RESULT_TITLE_GAME_CLEAR_COLOR,
  STAGE_RESULT_TITLE_DEFEAT_COLOR,
  STAGE_RESULT_SUBTITLE_COLOR,
  STAGE_RESULT_BUTTON_HOVER_COLOR,
  STAGE_RESULT_BUTTON_TEXT_COLOR,
  STAGE_RESULT_UI_DEPTH,
  STAGE_RESULT_UNLOCK_TEXT_COLOR,
  TITLE_AREA_PANEL_SELECTED_BORDER_COLOR,
  FONT_FAMILY_HEADING,
  FONT_FAMILY_UI,
} from '../GameConstants'
import { shrinkTextToFitWidth, fitTextInBounds } from '../utils/fitTextToWidth'

// clear=次ステージへ / gameClear=タイトルへ / defeat=リトライ
export type StageResultKind = 'clear' | 'gameClear' | 'defeat'

// ステージ終了時の結果画面（クリア／ゲームクリア／失敗）
export class StageResultSystem {
  private scene: Phaser.Scene
  private overlay: Phaser.GameObjects.Rectangle | null = null
  private panelBorder: Phaser.GameObjects.Rectangle | null = null
  private panelBackground: Phaser.GameObjects.Rectangle | null = null
  private titleText: Phaser.GameObjects.Text | null = null
  private subtitleText: Phaser.GameObjects.Text | null = null
  private unlockText: Phaser.GameObjects.Text | null = null
  private buttonBackground: Phaser.GameObjects.Rectangle | null = null
  private buttonBorder: Phaser.GameObjects.Rectangle | null = null
  private buttonText: Phaser.GameObjects.Text | null = null
  private hintText: Phaser.GameObjects.Text | null = null
  private isVisible = false
  // 決定時に GameScene 側へ戻るコールバック（次ステージ・タイトル・リトライ）
  private onConfirm: (() => void) | null = null
  private keySpace: Phaser.Input.Keyboard.Key | null = null
  private keyEnter: Phaser.Input.Keyboard.Key | null = null
  // ゲームクリア時の実績解放メッセージ（空なら表示しない）
  private unlockLines: string[] = []

  /**
   * 結果画面システムを作る。
   * GameScene.create で new StageResultSystem(this) される。
   */
  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  /** 結果画面が開いているか。GameScene が入力・更新を止める判定に使う。 */
  isOpen(): boolean {
    return this.isVisible
  }

  /**
   * 結果を表示し、ボタンまたは SPACE で onConfirm を呼ぶ。
   * unlockLines はゲームクリア時の新規実績文言（なければ空配列）。
   */
  show(
    kind: StageResultKind,
    stageNumber: number,
    onConfirm: () => void,
    unlockLines: string[] = [],
  ): void {
    if (this.isVisible) {
      return
    }

    this.isVisible = true
    this.onConfirm = onConfirm
    this.unlockLines = unlockLines
    this.createOverlay()
    this.createPanel()
    this.createTitle(kind)
    this.createSubtitle(kind, stageNumber)
    this.createUnlockText()
    this.createButton(kind)
    this.createHintText()
    this.setupKeyboard()
  }

  /** 結果画面を閉じて UI オブジェクトを破棄する。confirm の直前にも呼ばれる。 */
  hide(): void {
    if (!this.isVisible) {
      return
    }

    this.isVisible = false
    this.onConfirm = null
    this.unlockLines = []
    this.teardownKeyboard()

    const objects = [
      this.overlay,
      this.panelBorder,
      this.panelBackground,
      this.titleText,
      this.subtitleText,
      this.unlockText,
      this.buttonBorder,
      this.buttonBackground,
      this.buttonText,
      this.hintText,
    ]

    for (let index = 0; index < objects.length; index++) {
      const object = objects[index]
      if (object !== null) {
        object.destroy()
      }
    }

    this.overlay = null
    this.panelBorder = null
    this.panelBackground = null
    this.titleText = null
    this.subtitleText = null
    this.unlockText = null
    this.buttonBorder = null
    this.buttonBackground = null
    this.buttonText = null
    this.hintText = null
  }

  /** 解放文言があるときは行数に合わせてパネルを高くする。 */
  private getPanelHeight(): number {
    if (this.unlockLines.length === 0) {
      return STAGE_RESULT_PANEL_HEIGHT
    }

    // Forest + Pierce + XP Bonus のように行が増えても、下の行が潰れない高さにする
    const unlockBlockHeight =
      this.unlockLines.length * STAGE_RESULT_UNLOCK_LINE_HEIGHT
    const neededHeight =
      STAGE_RESULT_UNLOCK_PANEL_CHROME_HEIGHT + unlockBlockHeight
    let panelHeight = STAGE_RESULT_PANEL_HEIGHT_WITH_UNLOCK
    if (neededHeight > panelHeight) {
      panelHeight = neededHeight
    }
    if (panelHeight > STAGE_RESULT_PANEL_MAX_HEIGHT) {
      panelHeight = STAGE_RESULT_PANEL_MAX_HEIGHT
    }
    return panelHeight
  }

  /** パネル上端の Y（タイトル位置の基準）。 */
  private getPanelTopY(): number {
    return GAME_HEIGHT / 2 - this.getPanelHeight() / 2
  }

  /** パネル下端の Y（ボタン・ヒント位置の基準）。 */
  private getPanelBottomY(): number {
    return GAME_HEIGHT / 2 + this.getPanelHeight() / 2
  }

  /** 画面全体を暗くする半透明の矩形。クリックを吸収する。 */
  private createOverlay(): void {
    this.overlay = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      STAGE_RESULT_OVERLAY_COLOR,
      STAGE_RESULT_OVERLAY_ALPHA,
    )
    this.overlay.setDepth(STAGE_RESULT_UI_DEPTH)
    this.overlay.setInteractive()
  }

  /** 中央の枠＋背景パネルを作る。 */
  private createPanel(): void {
    const centerX = GAME_WIDTH / 2
    const centerY = GAME_HEIGHT / 2
    const panelHeight = this.getPanelHeight()

    this.panelBorder = this.scene.add.rectangle(
      centerX,
      centerY,
      STAGE_RESULT_PANEL_WIDTH + 6,
      panelHeight + 6,
      STAGE_RESULT_PANEL_BORDER_COLOR,
    )
    this.panelBorder.setDepth(STAGE_RESULT_UI_DEPTH + 1)

    this.panelBackground = this.scene.add.rectangle(
      centerX,
      centerY,
      STAGE_RESULT_PANEL_WIDTH,
      panelHeight,
      STAGE_RESULT_PANEL_COLOR,
    )
    this.panelBackground.setDepth(STAGE_RESULT_UI_DEPTH + 2)
  }

  /** kind に応じたタイトル文字と色を出す。 */
  private createTitle(kind: StageResultKind): void {
    let title = 'STAGE CLEAR!'
    let color = STAGE_RESULT_TITLE_CLEAR_COLOR

    if (kind === 'gameClear') {
      title = STAGE_RESULT_TITLE_AREA_CLEAR_LABEL
      color = STAGE_RESULT_TITLE_GAME_CLEAR_COLOR
    }

    if (kind === 'defeat') {
      title = 'DEFEATED'
      color = STAGE_RESULT_TITLE_DEFEAT_COLOR
    }

    const titleY = this.getPanelTopY() + 32
    this.titleText = this.scene.add.text(GAME_WIDTH / 2, titleY, title, {
      fontFamily: FONT_FAMILY_HEADING,
      fontSize: '30px',
      color: color,
      stroke: '#000000',
      strokeThickness: 6,
    })
    this.titleText.setOrigin(0.5)
    this.titleText.setDepth(STAGE_RESULT_UI_DEPTH + 3)
    this.shrinkTextToFitPanelWidth(this.titleText)
  }

  /** 文字がパネル幅からはみ出すときだけ、収まるサイズまで縮める。 */
  private shrinkTextToFitPanelWidth(text: Phaser.GameObjects.Text): void {
    shrinkTextToFitWidth(text, STAGE_RESULT_PANEL_WIDTH - 24)
  }

  /** kind とステージ番号に応じたサブタイトルを出す。 */
  private createSubtitle(kind: StageResultKind, stageNumber: number): void {
    let subtitle = `Stage ${stageNumber} clear`

    if (kind === 'gameClear') {
      subtitle = STAGE_RESULT_SUBTITLE_AREA_CLEAR
    }

    if (kind === 'defeat') {
      subtitle = `Stage ${stageNumber} failed\nReturn to title`
    }

    const subtitleY = this.getPanelTopY() + 70
    this.subtitleText = this.scene.add.text(GAME_WIDTH / 2, subtitleY, subtitle, {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '16px',
      color: STAGE_RESULT_SUBTITLE_COLOR,
      stroke: '#000000',
      strokeThickness: 3,
    })
    this.subtitleText.setOrigin(0.5)
    this.subtitleText.setDepth(STAGE_RESULT_UI_DEPTH + 3)
    shrinkTextToFitWidth(this.subtitleText, STAGE_RESULT_PANEL_WIDTH - 24)
  }

  /** 実績解放メッセージ（unlockLines）をパネル中央付近に出す。空なら何もしない。 */
  private createUnlockText(): void {
    if (this.unlockLines.length === 0) {
      return
    }

    // 字幕の下〜ボタンの上の余白に置く（TITLE ボタンと重ならない）
    const unlockY = this.getPanelTopY() + 100
    const unlockMessage = this.unlockLines.join('\n')
    this.unlockText = this.scene.add.text(GAME_WIDTH / 2, unlockY, unlockMessage, {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '14px',
      color: STAGE_RESULT_UNLOCK_TEXT_COLOR,
      align: 'center',
      lineSpacing: 4,
      stroke: '#000000',
      strokeThickness: 3,
      // 長い行はパネル内で自動折り返しする（スペース区切りで改行）
      wordWrap: { width: STAGE_RESULT_PANEL_WIDTH - 32 },
    })
    // setOrigin(0.5, 0): 横は中央、縦は上端基準（複数行でも上から積み上げ）
    this.unlockText.setOrigin(0.5, 0)
    this.unlockText.setDepth(STAGE_RESULT_UI_DEPTH + 3)

    // 折り返して行数が増え、ボタンと重なりそうなときは縮めて収める
    const buttonTopY = this.getPanelBottomY() - 52 - 22
    const availableHeight = buttonTopY - unlockY - 8
    fitTextInBounds(this.unlockText, {
      maxWidth: STAGE_RESULT_PANEL_WIDTH - 32,
      maxHeight: availableHeight,
      wrap: true,
    })
  }

  /** kind に応じたボタン（NEXT STAGE / TITLE）を作る。選択肢は1つなので最初から選択状態にする。 */
  private createButton(kind: StageResultKind): void {
    let label = 'NEXT STAGE'
    if (kind === 'gameClear' || kind === 'defeat') {
      label = 'TITLE'
    }

    const buttonY = this.getPanelBottomY() - 52
    // ボタンは1つだけなので、開いた瞬間から選択中の見た目にする
    this.buttonBorder = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      buttonY,
      184,
      44,
      TITLE_AREA_PANEL_SELECTED_BORDER_COLOR,
    )
    this.buttonBorder.setDepth(STAGE_RESULT_UI_DEPTH + 3)

    this.buttonBackground = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      buttonY,
      180,
      40,
      STAGE_RESULT_BUTTON_HOVER_COLOR,
    )
    this.buttonBackground.setDepth(STAGE_RESULT_UI_DEPTH + 3)
    this.buttonBackground.setInteractive({ useHandCursor: true })

    this.buttonText = this.scene.add.text(GAME_WIDTH / 2, buttonY, label, {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '18px',
      color: STAGE_RESULT_BUTTON_TEXT_COLOR,
      fontStyle: 'bold',
    })
    this.buttonText.setOrigin(0.5)
    this.buttonText.setDepth(STAGE_RESULT_UI_DEPTH + 4)
    shrinkTextToFitWidth(this.buttonText, 168)

    this.buttonBackground.on('pointerdown', () => {
      this.confirm()
    })
  }

  /** 「SPACE / ENTER で決定」のヒント文字。 */
  private createHintText(): void {
    const hintY = this.getPanelBottomY() - 16
    this.hintText = this.scene.add.text(
      GAME_WIDTH / 2,
      hintY,
      'SPACE / ENTER to confirm',
      {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '14px',
      color: '#cbd5e1',
      stroke: '#000000',
      strokeThickness: 3,
      },
    )
    this.hintText.setOrigin(0.5)
    this.hintText.setDepth(STAGE_RESULT_UI_DEPTH + 3)
    shrinkTextToFitWidth(this.hintText, STAGE_RESULT_PANEL_WIDTH - 24)
  }

  /** SPACE / ENTER キーで confirm を呼ぶようにする。 */
  private setupKeyboard(): void {
    if (this.scene.input.keyboard === null) {
      return
    }

    this.keySpace = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.keyEnter = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    this.keySpace.on('down', () => {
      this.confirm()
    })
    this.keyEnter.on('down', () => {
      this.confirm()
    })
  }

  /** SPACE キーのリスナーを外して破棄する。 */
  private teardownKeyboard(): void {
    if (this.keySpace !== null) {
      this.keySpace.removeAllListeners()
      this.keySpace.destroy()
      this.keySpace = null
    }
    if (this.keyEnter !== null) {
      this.keyEnter.removeAllListeners()
      this.keyEnter.destroy()
      this.keyEnter = null
    }
  }

  /**
   * 決定処理。先に hide してから onConfirm を呼ぶ
   * （コールバック内で次の画面遷移をしても、この UI が残らないようにする）。
   */
  private confirm(): void {
    if (!this.isVisible || this.onConfirm === null) {
      return
    }

    const action = this.onConfirm
    this.hide()
    action()
  }
}
