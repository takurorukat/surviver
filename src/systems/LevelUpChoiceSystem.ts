// ============================================================
// LevelUpChoiceSystem.ts
// ------------------------------------------------------------
// レベルアップ時の 3 択 UI と、選んだ効果のステータス反映。
//
// 役割:
//   - ランダムに最大 3 つの強化候補を出す（解放済みスキルのみ）
//   - マウス／キーボードで選び、選ばれたらコールバックを呼ぶ
//   - applyChoice でダメージ・連射・射程・貫通・爆破レベルを更新する
//
// 呼び出し元:
//   - GameScene.ts … beginNextLevelUpChoice で show、選後に applyChoice
//
// 関連ファイル:
//   - AchievementSystem.ts … isSkillUnlocked（貫通・爆破の候補フィルタ）
//   - GameConstants.ts … ボーナス量・UI 見た目・選択肢数
//   - PlayerAttackSystem.ts … applyChoice 後の射程・連射が攻撃に反映される
// ============================================================

import Phaser from 'phaser'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  DAMAGE_BONUS_PER_LEVEL_UP,
  calculateAttackIntervalMs,
  calculateAttackRange,
  calculateMoveSpeed,
  calculateCoinMagnetRadius,
  LEVEL_UP_CHOICES_SHOWN,
  LEVEL_UP_OVERLAY_COLOR,
  LEVEL_UP_OVERLAY_ALPHA,
  LEVEL_UP_PANEL_WIDTH,
  LEVEL_UP_PANEL_HEIGHT,
  LEVEL_UP_PANEL_GAP,
  LEVEL_UP_PANEL_COLOR,
  LEVEL_UP_PANEL_HOVER_COLOR,
  LEVEL_UP_PANEL_BORDER_COLOR,
  LEVEL_UP_PANEL_HOVER_SCALE,
  LEVEL_UP_PANEL_HOVER_LIFT_Y,
  LEVEL_UP_PANEL_HOVER_TWEEN_MS,
  LEVEL_UP_TITLE_COLOR,
  LEVEL_UP_CHOICE_TITLE_COLOR,
  LEVEL_UP_CHOICE_DESC_COLOR,
  LEVEL_UP_UI_DEPTH,
  FONT_FAMILY_HEADING,
  FONT_FAMILY_UI,
} from '../GameConstants'
import { isSkillUnlocked } from './AchievementSystem'
import { getSealedSkillIds } from './UnlockSaveSystem'
import { shrinkTextToFitWidth } from '../utils/fitTextToWidth'

// レベルアップの選択肢 ID
export type LevelUpChoiceId =
  | 'damage'
  | 'fireRate'
  | 'range'
  | 'move'
  | 'magnet'
  | 'pierce'
  | 'blast'
  | 'ricochet'
  | 'xpBonus'
  | 'gold'

// UI に出す 1 選択肢分の表示データ
export type LevelUpChoice = {
  id: LevelUpChoiceId
  title: string
  description: string
}

// GameScene が持つプレイヤー攻撃まわりのステータス束
// applyChoice の入出力に使う
export type LevelUpStatBonuses = {
  attackDamage: number
  fireRateLevel: number
  rangeLevel: number
  attackIntervalMs: number
  attackRange: number
  moveLevel: number
  moveSpeed: number
  magnetLevel: number
  magnetRadius: number
  maxHp: number
  pierceLevel: number
  blastLevel: number
  ricochetLevel: number
  xpBonusLevel: number
}

// 全候補の固定プール（実際に出すのは解放済みだけ）
const LEVEL_UP_CHOICE_POOL: LevelUpChoice[] = [
  {
    id: 'damage',
    title: 'Power',
    description: `Fire Damage +${DAMAGE_BONUS_PER_LEVEL_UP}`,
  },
  {
    id: 'fireRate',
    title: 'Speed',
    description: 'Fire Speed +1',
  },
  {
    id: 'range',
    title: 'Range',
    description: 'Fire Range +1',
  },
  {
    id: 'move',
    title: 'Move',
    description: 'Move speed +1',
  },
  {
    id: 'magnet',
    title: 'Pickup',
    description: 'Coin pickup range +1',
  },
  {
    id: 'pierce',
    title: 'Pierce',
    description: 'Hit +1 more enemy',
  },
  {
    id: 'blast',
    title: 'Blast',
    description: 'Damage nearby on hit',
  },
  {
    id: 'ricochet',
    title: 'Ricochet',
    description: 'Bounce to +1 enemy',
  },
  {
    id: 'xpBonus',
    title: 'XP Bonus',
    description: 'Raise XP drop multiplier',
  },
]

// 上限などで通常候補が1つも残らない場合だけ使う。通常プールには入れない。
const GOLD_FALLBACK_CHOICE: LevelUpChoice = {
  id: 'gold',
  title: 'Gold',
  description: 'Gain 1 Gold',
}

// 1 枚の選択肢パネル（見た目コンテナと当たり判定を分ける）
type ChoicePanel = {
  // 見た目（ホバーで動く）
  visualContainer: Phaser.GameObjects.Container
  background: Phaser.GameObjects.Rectangle
  // 当たり判定専用（動かない）
  hitZone: Phaser.GameObjects.Zone
  baseY: number
  choiceId: LevelUpChoiceId
  hoverTween: Phaser.Tweens.Tween | null
  isRaised: boolean
}

/**
 * 解放済みスキルだけ候補に入れる。
 * 貫通・爆破は実績未解放ならプールから除外する。
 */
function buildAvailableLevelUpChoicePool(
  maxedChoiceIds: LevelUpChoiceId[] = [],
): LevelUpChoice[] {
  const available: LevelUpChoice[] = []
  const sealedSkillIds = getSealedSkillIds()

  for (let index = 0; index < LEVEL_UP_CHOICE_POOL.length; index++) {
    const choice = LEVEL_UP_CHOICE_POOL[index]
    if (sealedSkillIds.includes(choice.id)) {
      continue
    }
    if (maxedChoiceIds.includes(choice.id)) {
      continue
    }
    if (choice.id === 'move' && !isSkillUnlocked('move')) {
      continue
    }
    if (choice.id === 'magnet' && !isSkillUnlocked('magnet')) {
      continue
    }
    if (choice.id === 'pierce' && !isSkillUnlocked('pierce')) {
      continue
    }
    if (choice.id === 'blast' && !isSkillUnlocked('blast')) {
      continue
    }
    if (choice.id === 'ricochet' && !isSkillUnlocked('ricochet')) {
      continue
    }
    if (choice.id === 'xpBonus' && !isSkillUnlocked('xpBonus')) {
      continue
    }
    available.push(choice)
  }

  return available
}

/**
 * プールから重複なしで N 個ひく。
 * Python: random.sample(pool, k) に相当
 */
function pickRandomLevelUpChoices(
  count: number,
  requiredChoiceId?: LevelUpChoiceId,
  maxedChoiceIds: LevelUpChoiceId[] = [],
): LevelUpChoice[] {
  const poolCopy = buildAvailableLevelUpChoicePool(maxedChoiceIds)
  const picked: LevelUpChoice[] = []
  const pickCount = Math.min(count, poolCopy.length)

  // Ruins の HP など、必ず候補へ含めたいものを先に1枚入れる
  if (requiredChoiceId !== undefined) {
    for (let index = 0; index < poolCopy.length; index++) {
      if (poolCopy[index].id === requiredChoiceId) {
        picked.push(poolCopy[index])
        poolCopy.splice(index, 1)
        break
      }
    }
  }

  while (picked.length < pickCount && poolCopy.length > 0) {
    const randomIndex = Phaser.Math.Between(0, poolCopy.length - 1)
    picked.push(poolCopy[randomIndex])
    // 引いたものをプールから除去して重複を防ぐ
    poolCopy.splice(randomIndex, 1)
  }

  if (picked.length === 0) {
    return [GOLD_FALLBACK_CHOICE]
  }

  return picked
}

// レベルアップ 3択 UI。表示中はゲームを止める（GameScene 側で isOpen を見る）
export class LevelUpChoiceSystem {
  private scene: Phaser.Scene
  private overlay: Phaser.GameObjects.Rectangle | null = null
  private titleText: Phaser.GameObjects.Text | null = null
  private hintText: Phaser.GameObjects.Text | null = null
  private panels: ChoicePanel[] = []
  private shownChoices: LevelUpChoice[] = []
  private isVisible = false
  // キーボード／マウス共通の選択インデックス（0 始まり）
  private selectedIndex = 0
  private onChoiceSelected: ((choiceId: LevelUpChoiceId) => void) | null = null
  private onSelectionChanged: (() => void) | null = null
  private keyA: Phaser.Input.Keyboard.Key | null = null
  private keyD: Phaser.Input.Keyboard.Key | null = null
  private keyLeft: Phaser.Input.Keyboard.Key | null = null
  private keyRight: Phaser.Input.Keyboard.Key | null = null
  private keySpace: Phaser.Input.Keyboard.Key | null = null
  private keyEnter: Phaser.Input.Keyboard.Key | null = null
  // 設定・実績を開いている間は false にして、SPACE が二重に効かないようにする
  private isKeyboardEnabled = true

  /**
   * レベルアップ UI システムを作る。
   * GameScene.create で new LevelUpChoiceSystem(this) される。
   */
  constructor(scene: Phaser.Scene, onSelectionChanged?: () => void) {
    this.scene = scene
    this.onSelectionChanged = onSelectionChanged ?? null
  }

  /** 3 択が開いているか。GameScene がポーズ判定に使う。 */
  isOpen(): boolean {
    return this.isVisible
  }

  /**
   * 設定や実績パネルを開いている間はキーボードを止め、
   * 閉じたらレベルアップ選択に戻す。
   */
  setKeyboardEnabled(enabled: boolean): void {
    if (this.isKeyboardEnabled === enabled) {
      return
    }
    this.isKeyboardEnabled = enabled
    if (!this.isVisible) {
      return
    }
    if (enabled) {
      this.setupKeyboard()
    } else {
      this.teardownKeyboard()
    }
  }

  /**
   * 3択を表示し、選ばれたら onChoice を呼ぶ。
   * 中央パネルを初期選択（selectedIndex = 1）にする。
   */
  show(
    onChoice: (choiceId: LevelUpChoiceId) => void,
    requiredChoiceId?: LevelUpChoiceId,
    maxedChoiceIds: LevelUpChoiceId[] = [],
  ): void {
    if (this.isVisible) {
      return
    }

    this.isVisible = true
    this.onChoiceSelected = onChoice
    this.shownChoices = pickRandomLevelUpChoices(
      LEVEL_UP_CHOICES_SHOWN,
      requiredChoiceId,
      maxedChoiceIds,
    )
    // 通常3択は中央、Goldだけのときは唯一のパネルを選択
    this.selectedIndex = Math.floor(this.shownChoices.length / 2)
    this.createOverlay()
    this.createTitle()
    this.createHintText()
    this.createChoicePanels()
    this.setupKeyboard()
    this.applySelectionVisuals()
  }

  /** UI を閉じてオブジェクト・キー入力を片付ける。 */
  hide(): void {
    if (!this.isVisible) {
      return
    }

    this.isVisible = false
    this.isKeyboardEnabled = true
    this.onChoiceSelected = null
    this.teardownKeyboard()
    this.scene.input.setDefaultCursor('default')

    if (this.overlay !== null) {
      this.overlay.destroy()
      this.overlay = null
    }

    if (this.titleText !== null) {
      this.titleText.destroy()
      this.titleText = null
    }

    if (this.hintText !== null) {
      this.hintText.destroy()
      this.hintText = null
    }

    for (let index = 0; index < this.panels.length; index++) {
      const panel = this.panels[index]
      if (panel.hoverTween !== null) {
        panel.hoverTween.stop()
      }
      panel.visualContainer.destroy()
      panel.hitZone.destroy()
    }
    this.panels = []
    this.shownChoices = []
  }

  /**
   * 選んだ効果をステータスに反映する。
   * 元の stats は変えず、新しいオブジェクトを返す（イミュータブル風）。
   * 呼び出し元: GameScene.applyLevelUpChoice。
   */
  applyChoice(choiceId: LevelUpChoiceId, stats: LevelUpStatBonuses): LevelUpStatBonuses {
    const nextStats: LevelUpStatBonuses = {
      attackDamage: stats.attackDamage,
      fireRateLevel: stats.fireRateLevel,
      rangeLevel: stats.rangeLevel,
      attackIntervalMs: stats.attackIntervalMs,
      attackRange: stats.attackRange,
      moveLevel: stats.moveLevel,
      moveSpeed: stats.moveSpeed,
      magnetLevel: stats.magnetLevel,
      magnetRadius: stats.magnetRadius,
      maxHp: stats.maxHp,
      pierceLevel: stats.pierceLevel,
      blastLevel: stats.blastLevel,
      ricochetLevel: stats.ricochetLevel,
      xpBonusLevel: stats.xpBonusLevel,
    }

    // Gold は GameScene が永続セーブへ加算する。能力値は変えない。
    if (choiceId === 'gold') {
      return nextStats
    }

    if (choiceId === 'damage') {
      nextStats.attackDamage = nextStats.attackDamage + DAMAGE_BONUS_PER_LEVEL_UP
      return nextStats
    }

    if (choiceId === 'fireRate') {
      nextStats.fireRateLevel = nextStats.fireRateLevel + 1
      nextStats.attackIntervalMs = calculateAttackIntervalMs(nextStats.fireRateLevel)
      return nextStats
    }

    if (choiceId === 'range') {
      nextStats.rangeLevel = nextStats.rangeLevel + 1
      nextStats.attackRange = calculateAttackRange(nextStats.rangeLevel)
      return nextStats
    }

    if (choiceId === 'move') {
      nextStats.moveLevel = nextStats.moveLevel + 1
      nextStats.moveSpeed = calculateMoveSpeed(nextStats.moveLevel)
      return nextStats
    }

    if (choiceId === 'magnet') {
      nextStats.magnetLevel = nextStats.magnetLevel + 1
      nextStats.magnetRadius = calculateCoinMagnetRadius(nextStats.magnetLevel)
      return nextStats
    }

    if (choiceId === 'pierce') {
      nextStats.pierceLevel = nextStats.pierceLevel + 1
      return nextStats
    }

    if (choiceId === 'blast') {
      nextStats.blastLevel = nextStats.blastLevel + 1
      return nextStats
    }

    if (choiceId === 'ricochet') {
      nextStats.ricochetLevel = nextStats.ricochetLevel + 1
      return nextStats
    }

    nextStats.xpBonusLevel = nextStats.xpBonusLevel + 1
    return nextStats
  }

  /** うっすら暗い全画面オーバーレイ（背後の配置が見える）。 */
  private createOverlay(): void {
    // うっすら暗くするだけ（背後の配置が見える）
    // クリック吸収用。パネルより下の depth にする
    this.overlay = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      LEVEL_UP_OVERLAY_COLOR,
      LEVEL_UP_OVERLAY_ALPHA,
    )
    this.overlay.setDepth(LEVEL_UP_UI_DEPTH)
    this.overlay.setInteractive()
  }

  /** 「LEVEL UP」タイトル。 */
  private createTitle(): void {
    this.titleText = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 140, 'LEVEL UP', {
      fontFamily: FONT_FAMILY_HEADING,
      fontSize: '32px',
      color: LEVEL_UP_TITLE_COLOR,
      stroke: '#000000',
      strokeThickness: 6,
    })
    this.titleText.setOrigin(0.5)
    this.titleText.setDepth(LEVEL_UP_UI_DEPTH + 1)
  }

  /** 操作ヒント文字。 */
  private createHintText(): void {
    this.hintText = this.scene.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 110,
      'A/D · ←/→ select   SPACE · ENTER confirm',
      {
        fontFamily: FONT_FAMILY_UI,
        fontSize: '16px',
        color: '#e2e8f0',
        stroke: '#000000',
        strokeThickness: 3,
      },
    )
    this.hintText.setOrigin(0.5)
    this.hintText.setDepth(LEVEL_UP_UI_DEPTH + 1)
  }

  /** shownChoices の枚数ぶん、横並びパネルを作る。 */
  private createChoicePanels(): void {
    const totalWidth =
      this.shownChoices.length * LEVEL_UP_PANEL_WIDTH +
      (this.shownChoices.length - 1) * LEVEL_UP_PANEL_GAP
    const startX = GAME_WIDTH / 2 - totalWidth / 2 + LEVEL_UP_PANEL_WIDTH / 2
    const centerY = GAME_HEIGHT / 2 + 20

    for (let index = 0; index < this.shownChoices.length; index++) {
      const choice = this.shownChoices[index]
      const panelX = startX + index * (LEVEL_UP_PANEL_WIDTH + LEVEL_UP_PANEL_GAP)
      this.panels.push(this.createOnePanel(choice, index, panelX, centerY))
    }
  }

  /**
   * 選択肢 1 枚分の見た目＋当たり判定を作る。
   * 見た目だけ浮かせ、hitZone は固定してホバー判定がズレないようにする。
   */
  private createOnePanel(
    choice: LevelUpChoice,
    panelIndex: number,
    x: number,
    y: number,
  ): ChoicePanel {
    const hitWidth = LEVEL_UP_PANEL_WIDTH + 4
    const hitHeight = LEVEL_UP_PANEL_HEIGHT + 4

    const border = this.scene.add.rectangle(0, 0, hitWidth, hitHeight, LEVEL_UP_PANEL_BORDER_COLOR)
    const background = this.scene.add.rectangle(
      0,
      0,
      LEVEL_UP_PANEL_WIDTH,
      LEVEL_UP_PANEL_HEIGHT,
      LEVEL_UP_PANEL_COLOR,
    )

    const titleText = this.scene.add.text(0, -16, choice.title, {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '20px',
      color: LEVEL_UP_CHOICE_TITLE_COLOR,
      fontStyle: 'bold',
    })
    titleText.setOrigin(0.5)
    shrinkTextToFitWidth(titleText, LEVEL_UP_PANEL_WIDTH - 20)

    const descText = this.scene.add.text(0, 18, choice.description, {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '14px',
      color: LEVEL_UP_CHOICE_DESC_COLOR,
      align: 'center',
      // 長い説明はパネル内で折り返す
      wordWrap: { width: LEVEL_UP_PANEL_WIDTH - 20 },
    })
    descText.setOrigin(0.5)
    // 折り返しても縦にはみ出す場合は、収まるまで縮小する
    const descMaxHeight = LEVEL_UP_PANEL_HEIGHT / 2 - 6
    if (descText.height > descMaxHeight) {
      descText.setScale(descMaxHeight / descText.height)
    }

    // 見た目だけ動かすコンテナ
    const visualContainer = this.scene.add.container(x, y, [
      border,
      background,
      titleText,
      descText,
    ])
    visualContainer.setDepth(LEVEL_UP_UI_DEPTH + 2)

    // 当たり判定は動かない Zone（枠の位置に固定）
    const hitZone = this.scene.add.zone(x, y, hitWidth, hitHeight)
    hitZone.setDepth(LEVEL_UP_UI_DEPTH + 3)
    hitZone.setInteractive({ useHandCursor: true })

    const panel: ChoicePanel = {
      visualContainer,
      background,
      hitZone,
      baseY: y,
      choiceId: choice.id,
      hoverTween: null,
      isRaised: false,
    }

    hitZone.on('pointerover', () => {
      this.selectPanel(panelIndex)
    })
    hitZone.on('pointerout', () => {
      // マウスが枠外に出ても、キーボード選択中の枠は維持する
      this.applySelectionVisuals()
    })
    hitZone.on('pointerdown', () => {
      this.selectedIndex = panelIndex
      this.confirmSelection()
    })

    return panel
  }

  /** A/D・矢印で選択、SPACE / ENTERで決定する。 */
  private setupKeyboard(): void {
    const keyboard = this.scene.input.keyboard
    if (keyboard === null) {
      return
    }

    const keyCodes = Phaser.Input.Keyboard.KeyCodes
    this.keyA = keyboard.addKey(keyCodes.A)
    this.keyD = keyboard.addKey(keyCodes.D)
    this.keyLeft = keyboard.addKey(keyCodes.LEFT)
    this.keyRight = keyboard.addKey(keyCodes.RIGHT)
    this.keySpace = keyboard.addKey(keyCodes.SPACE)
    this.keyEnter = keyboard.addKey(keyCodes.ENTER)

    // 第 3 引数 this: コールバック内の this をクラスに固定する
    this.keyA.on('down', this.handleSelectLeft, this)
    this.keyD.on('down', this.handleSelectRight, this)
    this.keyLeft.on('down', this.handleSelectLeft, this)
    this.keyRight.on('down', this.handleSelectRight, this)
    this.keySpace.on('down', this.handleConfirmKey, this)
    this.keyEnter.on('down', this.handleConfirmKey, this)
  }

  /** キーリスナーを外す（hide 時に必須。残すと次の表示で二重登録になる）。 */
  private teardownKeyboard(): void {
    if (this.keyA !== null) {
      this.keyA.off('down', this.handleSelectLeft, this)
      this.keyA = null
    }
    if (this.keyD !== null) {
      this.keyD.off('down', this.handleSelectRight, this)
      this.keyD = null
    }
    if (this.keyLeft !== null) {
      this.keyLeft.off('down', this.handleSelectLeft, this)
      this.keyLeft = null
    }
    if (this.keyRight !== null) {
      this.keyRight.off('down', this.handleSelectRight, this)
      this.keyRight = null
    }
    if (this.keySpace !== null) {
      this.keySpace.off('down', this.handleConfirmKey, this)
      this.keySpace = null
    }
    if (this.keyEnter !== null) {
      this.keyEnter.off('down', this.handleConfirmKey, this)
      this.keyEnter = null
    }
  }

  /** 左へ選択を移す（端から反対端へループ）。 */
  private handleSelectLeft = (): void => {
    if (!this.isVisible || this.panels.length === 0) {
      return
    }
    let nextIndex = this.selectedIndex - 1
    if (nextIndex < 0) {
      nextIndex = this.panels.length - 1
    }
    this.selectPanel(nextIndex)
  }

  /** 右へ選択を移す（端から反対端へループ）。 */
  private handleSelectRight = (): void => {
    if (!this.isVisible || this.panels.length === 0) {
      return
    }
    let nextIndex = this.selectedIndex + 1
    if (nextIndex >= this.panels.length) {
      nextIndex = 0
    }
    this.selectPanel(nextIndex)
  }

  /** 選択先が変わったときだけ、見た目を更新して移動音を鳴らす。 */
  private selectPanel(nextIndex: number): void {
    if (nextIndex === this.selectedIndex) {
      return
    }
    this.selectedIndex = nextIndex
    this.onSelectionChanged?.()
    this.applySelectionVisuals()
  }

  /** SPACE / ENTER で現在の選択を決定する。 */
  private handleConfirmKey = (): void => {
    if (!this.isVisible || !this.isKeyboardEnabled) {
      return
    }
    this.confirmSelection()
  }

  /** selectedIndex のパネルを確定する。 */
  private confirmSelection(): void {
    if (this.panels.length === 0) {
      return
    }
    const panel = this.panels[this.selectedIndex]
    this.handleChoiceClick(panel.choiceId)
  }

  // 選択中のパネルだけ浮かせる（マウス・キーボード共通）
  private applySelectionVisuals(): void {
    for (let index = 0; index < this.panels.length; index++) {
      const panel = this.panels[index]
      const isSelected = index === this.selectedIndex
      if (isSelected) {
        this.playHoverIn(panel)
      } else {
        this.playHoverOut(panel)
      }
    }
  }

  /** 進行中のホバー tween を止める。 */
  private stopHoverTween(panel: ChoicePanel): void {
    if (panel.hoverTween !== null) {
      panel.hoverTween.stop()
      panel.hoverTween = null
    }
  }

  /** 選択中パネルを少し大きく・少し上へ上げる。 */
  private playHoverIn(panel: ChoicePanel): void {
    if (panel.isRaised) {
      return
    }
    panel.isRaised = true
    this.stopHoverTween(panel)
    panel.background.setFillStyle(LEVEL_UP_PANEL_HOVER_COLOR)

    panel.hoverTween = this.scene.tweens.add({
      targets: panel.visualContainer,
      y: panel.baseY + LEVEL_UP_PANEL_HOVER_LIFT_Y,
      scaleX: LEVEL_UP_PANEL_HOVER_SCALE,
      scaleY: LEVEL_UP_PANEL_HOVER_SCALE,
      duration: LEVEL_UP_PANEL_HOVER_TWEEN_MS,
      ease: 'Back.Out',
    })
  }

  /** 非選択パネルを元の位置・大きさへ戻す。 */
  private playHoverOut(panel: ChoicePanel): void {
    if (!panel.isRaised) {
      return
    }
    panel.isRaised = false
    this.stopHoverTween(panel)
    panel.background.setFillStyle(LEVEL_UP_PANEL_COLOR)

    panel.hoverTween = this.scene.tweens.add({
      targets: panel.visualContainer,
      y: panel.baseY,
      scaleX: 1,
      scaleY: 1,
      duration: LEVEL_UP_PANEL_HOVER_TWEEN_MS,
      ease: 'Quad.Out',
    })
  }

  /**
   * 選択肢確定。先に hide してからコールバックを呼ぶ
   * （GameScene が次のレベルアップや戦闘再開をしても UI が残らない）。
   */
  private handleChoiceClick(choiceId: LevelUpChoiceId): void {
    const callback = this.onChoiceSelected
    this.hide()
    if (callback !== null) {
      callback(choiceId)
    }
  }
}
