// ============================================================
// HudSystem.ts
// ------------------------------------------------------------
// 画面上部・右側の HUD（HP・タイマー・XP・ステータス・解放一覧）。
//
// 役割:
//   - HP マスバー、残り時間、XP バー、レベル／ステージ表示
//   - 右側の POWER / SPEED / … とスキルツリー（Blast←Power+Range など）
//   - ステータス上昇時の一瞬パルス、XP 演出の飛び先座標
//
// 呼び出し元:
//   - GameScene.ts … create / 各種 updateXxx / playStatUpgradePulse
//   - XpGainEffectSystem.ts … getXpEffectTargetPosition（キラキラの着地点）
//
// 関連ファイル:
//   - AchievementSystem.ts … getUnlockStatusRows / isSkillUnlocked
//   - GameConstants.ts … レイアウト・色・XP 累積計算
//   - utils/formatElapsedTime.ts … タイマー文字列
// ============================================================

import Phaser from 'phaser'
import {
  GAME_WIDTH,
  HUD_SIDE_MARGIN,
  HUD_CONTENT_RIGHT,
  TOP_BAR_HEIGHT,
  XP_BAR_BASE_WIDTH,
  XP_BAR_GROWTH_PER_REQUIRED_XP,
  XP_BAR_MAX_WIDTH,
  XP_BAR_HEIGHT,
  XP_LEVEL_LEFT_MARGIN,
  HP_BAR_SEGMENT_WIDTH,
  HP_BAR_HEIGHT,
  HP_BAR_SEGMENT_GAP,
  PLAYER_STATS_FONT_SIZE,
  PLAYER_STATS_COLOR,
  PLAYER_STATS_LINE_HEIGHT,
  PLAYER_STATS_TOP_OFFSET,
  PLAYER_STATS_GAP_FROM_PLAY_AREA,
  PLAYER_STATS_PULSE_ALPHA,
  PLAYER_STATS_PULSE_DURATION_MS,
  PLAY_AREA_ORIGIN_X,
  PLAY_AREA_WIDTH,
  UNLOCK_STATUS_GAP_FROM_STATS,
  UNLOCK_STATUS_HEADER_TEXT,
  UNLOCK_STATUS_HEADER_COLOR,
  UNLOCK_STATUS_LOCKED_COLOR,
  UNLOCK_STATUS_LOCKED_ALPHA,
  UNLOCK_ICON_SIZE,
  UNLOCK_ICON_GAP,
  UNLOCK_ICON_BORDER_SIZE,
  SKILL_TREE_ROW_GAP,
  SKILL_TREE_EXTRA_ROW_GAP,
  SKILL_TREE_LINE_COLOR,
  SKILL_TREE_LINE_ALPHA,
  SKILL_TREE_LINE_THICKNESS,
  SKILL_TREE_LINE_DEPTH_OFFSET,
  UNLOCK_ICON_POWER_COLOR,
  UNLOCK_ICON_SPEED_COLOR,
  UNLOCK_ICON_RANGE_COLOR,
  UNLOCK_ICON_PIERCE_COLOR,
  UNLOCK_ICON_BLAST_COLOR,
  UNLOCK_ICON_RICOCHET_COLOR,
  UNLOCK_ICON_MOVE_COLOR,
  UNLOCK_ICON_MAGNET_COLOR,
  UNLOCK_ICON_HP_COLOR,
  UNLOCK_ICON_XP_BONUS_COLOR,
  UNLOCK_ICON_LOCKED_FILL_COLOR,
  UNLOCK_ICON_LOCKED_BORDER_COLOR,
  UNLOCK_ICON_LETTER_COLOR,
  UNLOCK_ICON_LOCKED_LETTER_COLOR,
  UNLOCK_ICON_POWER_LETTER,
  UNLOCK_ICON_SPEED_LETTER,
  UNLOCK_ICON_RANGE_LETTER,
  UNLOCK_ICON_PIERCE_LETTER,
  UNLOCK_ICON_BLAST_LETTER,
  UNLOCK_ICON_RICOCHET_LETTER,
  UNLOCK_ICON_MOVE_LETTER,
  UNLOCK_ICON_MAGNET_LETTER,
  UNLOCK_ICON_XP_BONUS_LETTER,
  UNLOCK_ICON_SEAL_FROST_COLOR,
  UNLOCK_ICON_SEAL_FROST_ALPHA,
  UNLOCK_ICON_SEAL_FROST_BORDER_ALPHA,
  UNLOCK_ICON_SEAL_FROST_COLOR_MIX,
  UNLOCK_ICON_SEAL_ICE_WHITE,
  UNLOCK_ICON_SEAL_GLINT_COLOR,
  UNLOCK_ICON_SEAL_GLINT_SIZE,
  UNLOCK_ICON_SEAL_GLINT_CHECK_MS,
  UNLOCK_ICON_SEAL_GLINT_CHANCE,
  UNLOCK_ICON_SEAL_GLINT_FLASH_MS,
  UNLOCK_ICON_SEAL_TOOLTIP_COLOR,
  UNLOCK_STATUS_TOOLTIP_COLOR,
  UNLOCK_STATUS_TOOLTIP_BG_COLOR,
  UNLOCK_STATUS_TOOLTIP_BG_ALPHA,
  UNLOCK_STATUS_TOOLTIP_PADDING,
  UNLOCK_STATUS_TOOLTIP_DEPTH,
  UNLOCK_STATUS_TOOLTIP_MAX_WIDTH,
  UNLOCK_STATUS_TOOLTIP_OFFSET_X,
  UNLOCK_STATUS_TOOLTIP_TITLE_COLOR,
  UNLOCK_STATUS_TOOLTIP_DESC_COLOR,
  UNLOCK_STATUS_TOOLTIP_LOCK_COLOR,
  UNLOCK_STATUS_RIGHT_MARGIN,
  calculatePlayerStatAlpha,
  getCumulativeXpForLevel,
  FONT_FAMILY_UI,
} from '../GameConstants'
import { formatRemainingSeconds } from '../utils/formatElapsedTime'
import { shrinkTextToFitWidth } from '../utils/fitTextToWidth'
import { getUnlockStatusRows, isSkillUnlocked } from './AchievementSystem'
import { getSealedSkillIds } from './UnlockSaveSystem'
import { createTopBar, type TopBarView } from './TopBarSystem'

const STATUS_TEXT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: FONT_FAMILY_UI,
  fontSize: '16px',
  color: '#f4f4f5',
}

const LEVEL_TEXT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: FONT_FAMILY_UI,
  fontSize: '16px',
  color: '#f4f4f5',
  fontStyle: 'bold',
}

const TIMER_TEXT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: FONT_FAMILY_UI,
  fontSize: '26px',
  color: '#fef08a',
  fontStyle: 'bold',
}

const HP_LABEL_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: FONT_FAMILY_UI,
  fontSize: '14px',
  color: '#fca5a5',
}

const XP_LABEL_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: FONT_FAMILY_UI,
  fontSize: '14px',
  color: '#86efac',
}

const XP_VALUE_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: FONT_FAMILY_UI,
  fontSize: '13px',
  color: '#e5e7eb',
}

const PLAYER_STATS_TEXT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontSize: PLAYER_STATS_FONT_SIZE,
  color: PLAYER_STATS_COLOR,
  fontFamily: FONT_FAMILY_UI,
}

const UNLOCK_STATUS_HEADER_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontSize: '10px',
  color: UNLOCK_STATUS_HEADER_COLOR,
  fontFamily: FONT_FAMILY_UI,
  fontStyle: 'bold',
}

const UNLOCK_ICON_LETTER_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: FONT_FAMILY_UI,
  fontSize: '13px',
  color: UNLOCK_ICON_LETTER_COLOR,
  fontStyle: 'bold',
}

const UNLOCK_TOOLTIP_TITLE_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: FONT_FAMILY_UI,
  fontSize: '13px',
  color: UNLOCK_STATUS_TOOLTIP_TITLE_COLOR,
  fontStyle: 'bold',
  wordWrap: { width: UNLOCK_STATUS_TOOLTIP_MAX_WIDTH },
}

const UNLOCK_TOOLTIP_DESC_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: FONT_FAMILY_UI,
  fontSize: '11px',
  color: UNLOCK_STATUS_TOOLTIP_DESC_COLOR,
  wordWrap: { width: UNLOCK_STATUS_TOOLTIP_MAX_WIDTH },
}

const UNLOCK_TOOLTIP_LOCK_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: FONT_FAMILY_UI,
  fontSize: '10px',
  color: UNLOCK_STATUS_TOOLTIP_LOCK_COLOR,
  wordWrap: { width: UNLOCK_STATUS_TOOLTIP_MAX_WIDTH },
}

// 右側ステータス行のキー（パルス演出の指定にも使う）
export type PlayerStatKey =
  | 'power'
  | 'speed'
  | 'range'
  | 'move'
  | 'magnet'
  | 'hp'
  | 'penetrate'
  | 'blast'
  | 'ricochet'
  | 'xpBonus'

// GameScene から渡す表示用ステータス値
export type PlayerStatsDisplay = {
  power: number
  speed: number
  range: number
  move: number
  magnet: number
  hp: number
  penetrate: number
  blast: number
  ricochet: number
  xpBonus: number
}

type PlayerStatLine = {
  key: PlayerStatKey
  label: string
  text: Phaser.GameObjects.Text
}

type UnlockStatusIcon = {
  skillId: string
  skillLabel: string
  skillDescription: string
  unlockCondition: string
  isUnlocked: boolean
  // シール中（レベルアップ候補から隠している）かどうか
  isSealed: boolean
  border: Phaser.GameObjects.Rectangle
  fill: Phaser.GameObjects.Rectangle
  letterText: Phaser.GameObjects.Text
  // シール中: 青白い凍り幕
  frostVeil: Phaser.GameObjects.Rectangle
  // シール中: 時々きらめく小さな氷のかけら（2つ）
  frostGlintA: Phaser.GameObjects.Rectangle
  frostGlintB: Phaser.GameObjects.Rectangle
  frostGlintTimer: Phaser.Time.TimerEvent | null
}

type UnlockSkillTooltip = {
  background: Phaser.GameObjects.Rectangle
  titleText: Phaser.GameObjects.Text
  descText: Phaser.GameObjects.Text
  lockText: Phaser.GameObjects.Text
}

// スキルツリーのマス目（上段コンボ → 下段素材 → その他）
// col は 0〜3。Blast/Pierce は素材2つの真ん中（0.5 / 2.5）
type SkillTreeSlot = {
  skillId: string
  row: number
  col: number
}

const SKILL_TREE_SLOTS: SkillTreeSlot[] = [
  { skillId: 'blast', row: 0, col: 0.5 },
  { skillId: 'ricochet', row: 0, col: 1.5 },
  { skillId: 'pierce', row: 0, col: 2.5 },
  { skillId: 'damage', row: 1, col: 0 },
  { skillId: 'range', row: 1, col: 1 },
  { skillId: 'fireRate', row: 1, col: 2 },
  { skillId: 'move', row: 1, col: 3 },
  { skillId: 'magnet', row: 2, col: 0 },
  { skillId: 'xpBonus', row: 2, col: 1 },
]

// 上のコンボスキル ← 下の素材スキル（線でつなぐ）
const SKILL_TREE_LINKS: { parentId: string; childId: string }[] = [
  { parentId: 'blast', childId: 'damage' },
  { parentId: 'blast', childId: 'range' },
  { parentId: 'ricochet', childId: 'damage' },
  { parentId: 'ricochet', childId: 'fireRate' },
  { parentId: 'ricochet', childId: 'magnet' },
  { parentId: 'pierce', childId: 'fireRate' },
  { parentId: 'pierce', childId: 'move' },
]

// 画面上部の HP・タイマー・XP バーを表示する
// Python: HudView クラスに相当
export class HudSystem {
  private scene: Phaser.Scene
  private onSettingsClick: (() => void) | null = null
  private onAchievementsOpen: (() => void) | null = null
  private onAchievementsClose: (() => void) | null = null
  private topBarView: TopBarView | null = null
  private statusText!: Phaser.GameObjects.Text
  private levelText!: Phaser.GameObjects.Text
  private timerText!: Phaser.GameObjects.Text
  private hpLabelText!: Phaser.GameObjects.Text
  private hpBarGraphics!: Phaser.GameObjects.Graphics
  private xpLabelText!: Phaser.GameObjects.Text
  private xpValueText!: Phaser.GameObjects.Text
  private xpBarBackground!: Phaser.GameObjects.Rectangle
  private xpBarFill!: Phaser.GameObjects.Rectangle
  private xpBarTicks!: Phaser.GameObjects.Graphics
  private playerStatLines: PlayerStatLine[] = []
  private unlockStatusHeaderText: Phaser.GameObjects.Text | null = null
  private unlockStatusIcons: UnlockStatusIcon[] = []
  private skillTreeLinesGraphics: Phaser.GameObjects.Graphics | null = null
  private unlockSkillTooltip: UnlockSkillTooltip | null = null
  // ステータス上昇パルス中の tween（キーごと）
  private playerStatPulseTweens = new Map<PlayerStatKey, Phaser.Tweens.Tween>()
  private currentStatValues: Record<PlayerStatKey, number> = {
    power: 1,
    speed: 1,
    range: 1,
    move: 1,
    magnet: 1,
    hp: 3,
    penetrate: 0,
    blast: 0,
    ricochet: 0,
    xpBonus: 0,
  }
  private hpBarLeft = 0
  private hpBarCenterY = 0
  private xpAnchorX = 0
  private xpBarCenterY = 0
  private unlockPanelX = 0

  /**
   * HUD システムを作る（見た目の生成は create() で行う）。
   * GameScene.create で new HudSystem(this, onSettingsClick) のあと create() を呼ぶ。
   */
  constructor(
    scene: Phaser.Scene,
    onSettingsClick?: () => void,
    onAchievementsOpen?: () => void,
    onAchievementsClose?: () => void,
  ) {
    this.scene = scene
    if (onSettingsClick !== undefined) {
      this.onSettingsClick = onSettingsClick
    }
    if (onAchievementsOpen !== undefined) {
      this.onAchievementsOpen = onAchievementsOpen
    }
    if (onAchievementsClose !== undefined) {
      this.onAchievementsClose = onAchievementsClose
    }
  }

  /** HUD の全要素を生成し、解放状態を初回反映する。 */
  create(): void {
    this.createTopBar()
    this.createHpBar()
    this.createStatusText()
    this.createLevelText()
    this.createTimerText()
    this.createXpBar()
    this.createPlayerStatsText()
    this.createUnlockStatusText()
    this.setAllHudDepth()
    this.refreshUnlockStatus()
  }

  /** HP バーを現在値・最大値で描き直す。 */
  updateHpBar(currentHp: number, maxHp: number): void {
    this.renderHpBar(currentHp, maxHp)
  }

  /** 上部中央の Stage 表示と、XP バー左の Lv 表示を更新する。 */
  updateStatusLine(level: number, stageNumber: number): void {
    this.statusText.setText(`Stage ${stageNumber}`)
    this.levelText.setText(`Lv ${level}`)
  }

  /** 残り秒数を MM:SS 形式でタイマー文字に反映する。 */
  updateTimer(remainingSeconds: number): void {
    const timerText = formatRemainingSeconds(remainingSeconds)
    this.timerText.setText(timerText)
  }

  /** 現在レベル内の XP 進捗でバーを更新する。 */
  updateXpBar(currentInLevel: number, neededForNext: number): void {
    this.renderXpMeter(currentInLevel, neededForNext)
  }

  /**
   * XP 獲得演出中に、合計 XP からバーを更新する。
   * 累積閾値の差で「レベル内進捗」に直してから描画する。
   */
  updateXpBarForTotalXp(totalXp: number, currentLevel: number): void {
    const currentThreshold = getCumulativeXpForLevel(currentLevel)
    const nextThreshold = getCumulativeXpForLevel(currentLevel + 1)
    const currentInLevel = totalXp - currentThreshold
    const neededForNext = nextThreshold - currentThreshold
    this.renderXpMeter(currentInLevel, neededForNext)
  }

  /**
   * 右側の POWER / SPEED / RANGE / MOVE / PENETRATE / BOMB を更新する。
   * 強いステータスほど濃く見える（Phaser の setAlpha だけ使う）。
   */
  updatePlayerStats(stats: PlayerStatsDisplay): void {
    this.currentStatValues = {
      power: stats.power,
      speed: stats.speed,
      range: stats.range,
      move: stats.move,
      magnet: stats.magnet,
      hp: stats.hp,
      penetrate: stats.penetrate,
      blast: stats.blast,
      ricochet: stats.ricochet,
      xpBonus: stats.xpBonus,
    }

    for (let index = 0; index < this.playerStatLines.length; index++) {
      const line = this.playerStatLines[index]
      const value = this.currentStatValues[line.key]
      if (line.key === 'xpBonus') {
        line.text.setText(`${line.label}  Lv${value}`)
      } else {
        line.text.setText(formatStatLine(line.label, value))
      }
      // 右カラム幅に収める（翻訳で長くなってもはみ出さない）
      const statsX =
        PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH + PLAYER_STATS_GAP_FROM_PLAY_AREA
      const statsMaxWidth = Math.max(
        48,
        GAME_WIDTH - statsX - UNLOCK_STATUS_RIGHT_MARGIN,
      )
      shrinkTextToFitWidth(line.text, statsMaxWidth)

      // フラッシュ中は alpha を上書きしない（tween を邪魔しない）
      if (this.playerStatPulseTweens.has(line.key)) {
        continue
      }

      // 未解放／未取得のスキルはグレーアウト
      // Move は実績解放まで。Pierce / Blast は今ランで付くまで（値 0）
      if (line.key === 'move' && !isSkillUnlocked('move')) {
        line.text.setColor(UNLOCK_STATUS_LOCKED_COLOR)
        line.text.setAlpha(UNLOCK_STATUS_LOCKED_ALPHA)
        continue
      }
      if (line.key === 'magnet' && !isSkillUnlocked('magnet')) {
        line.text.setColor(UNLOCK_STATUS_LOCKED_COLOR)
        line.text.setAlpha(UNLOCK_STATUS_LOCKED_ALPHA)
        continue
      }
      if (line.key === 'xpBonus' && !isSkillUnlocked('xpBonus')) {
        line.text.setColor(UNLOCK_STATUS_LOCKED_COLOR)
        line.text.setAlpha(UNLOCK_STATUS_LOCKED_ALPHA)
        continue
      }
      if (line.key === 'penetrate' && value <= 0) {
        line.text.setColor(UNLOCK_STATUS_LOCKED_COLOR)
        line.text.setAlpha(UNLOCK_STATUS_LOCKED_ALPHA)
        continue
      }
      if (line.key === 'blast' && value <= 0) {
        line.text.setColor(UNLOCK_STATUS_LOCKED_COLOR)
        line.text.setAlpha(UNLOCK_STATUS_LOCKED_ALPHA)
        continue
      }
      if (line.key === 'ricochet' && value <= 0) {
        line.text.setColor(UNLOCK_STATUS_LOCKED_COLOR)
        line.text.setAlpha(UNLOCK_STATUS_LOCKED_ALPHA)
        continue
      }

      line.text.setColor(PLAYER_STATS_COLOR)
      line.text.setAlpha(calculatePlayerStatAlpha(value))
    }

    // スキルツリーの Blast / Pierce / Move も同じ条件でグレーを更新
    this.syncSkillTreeComboIconLooks()
  }

  /**
   * ロック／解放のアイコン表示を localStorage の最新状態に合わせる。
   * ゲームクリア後の再開や実績解放直後に GameScene から呼ぶ。
   */
  refreshUnlockStatus(): void {
    const rows = getUnlockStatusRows()
    const sealedSkillIds: string[] = getSealedSkillIds()
    // skillId で対応付ける（ツリー配置順と rows の順が違ってもよい）
    const rowBySkillId = new Map<string, (typeof rows)[number]>()
    for (let index = 0; index < rows.length; index++) {
      rowBySkillId.set(rows[index].skillId, rows[index])
    }

    for (let index = 0; index < this.unlockStatusIcons.length; index++) {
      const icon = this.unlockStatusIcons[index]
      const row = rowBySkillId.get(icon.skillId)
      if (row === undefined) {
        continue
      }

      icon.skillLabel = row.skillLabel
      icon.skillDescription = row.skillDescription
      icon.unlockCondition = row.unlockCondition
      icon.isUnlocked = this.resolveSkillTreeIconUnlocked(icon.skillId, row.isUnlocked)
      icon.isSealed = sealedSkillIds.includes(row.skillId)
      this.applyUnlockIconLook(icon)
    }

    this.layoutUnlockStatusIcons()
    this.refreshAchievementProgress()
    this.hideUnlockSkillTooltip()
  }

  /**
   * スキルツリーの色付き／グレーを決める。
   * - Move: 実績で解放されるまでグレー
   * - Blast / Pierce / Ricochet: 今ランで合成により付くまでグレー（レベル 0）
   * - その他: 実績の解放状態
   */
  private resolveSkillTreeIconUnlocked(
    skillId: string,
    achievementUnlocked: boolean,
  ): boolean {
    if (skillId === 'blast') {
      return this.currentStatValues.blast > 0
    }
    if (skillId === 'pierce') {
      return this.currentStatValues.penetrate > 0
    }
    if (skillId === 'ricochet') {
      return this.currentStatValues.ricochet > 0
    }
    if (skillId === 'move') {
      return isSkillUnlocked('move')
    }
    return achievementUnlocked
  }

  /** ステータス更新後に、ツリー上の合成スキル / Move だけ見た目を合わせる。 */
  private syncSkillTreeComboIconLooks(): void {
    const rows = getUnlockStatusRows()
    const rowBySkillId = new Map<string, (typeof rows)[number]>()
    for (let index = 0; index < rows.length; index++) {
      rowBySkillId.set(rows[index].skillId, rows[index])
    }

    for (let index = 0; index < this.unlockStatusIcons.length; index++) {
      const icon = this.unlockStatusIcons[index]
      if (
        icon.skillId !== 'blast' &&
        icon.skillId !== 'pierce' &&
        icon.skillId !== 'ricochet' &&
        icon.skillId !== 'move'
      ) {
        continue
      }
      const row = rowBySkillId.get(icon.skillId)
      const achievementUnlocked = row !== undefined ? row.isUnlocked : false
      icon.isUnlocked = this.resolveSkillTreeIconUnlocked(
        icon.skillId,
        achievementUnlocked,
      )
      this.applyUnlockIconLook(icon)
    }
  }

  // アイコンの色・文字をロック／解放に合わせる
  private applyUnlockIconLook(icon: UnlockStatusIcon): void {
    let fillColor = UNLOCK_ICON_LOCKED_FILL_COLOR
    let borderColor = UNLOCK_ICON_LOCKED_BORDER_COLOR
    let letterColor = UNLOCK_ICON_LOCKED_LETTER_COLOR
    let alpha = UNLOCK_STATUS_LOCKED_ALPHA

    if (icon.isUnlocked) {
      alpha = 1
      letterColor = UNLOCK_ICON_LETTER_COLOR
      if (icon.skillId === 'damage') {
        fillColor = UNLOCK_ICON_POWER_COLOR
        borderColor = UNLOCK_ICON_POWER_COLOR
      } else if (icon.skillId === 'fireRate') {
        fillColor = UNLOCK_ICON_SPEED_COLOR
        borderColor = UNLOCK_ICON_SPEED_COLOR
      } else if (icon.skillId === 'range') {
        fillColor = UNLOCK_ICON_RANGE_COLOR
        borderColor = UNLOCK_ICON_RANGE_COLOR
      } else if (icon.skillId === 'pierce') {
        fillColor = UNLOCK_ICON_PIERCE_COLOR
        borderColor = UNLOCK_ICON_PIERCE_COLOR
      } else if (icon.skillId === 'blast') {
        fillColor = UNLOCK_ICON_BLAST_COLOR
        borderColor = UNLOCK_ICON_BLAST_COLOR
      } else if (icon.skillId === 'ricochet') {
        fillColor = UNLOCK_ICON_RICOCHET_COLOR
        borderColor = UNLOCK_ICON_RICOCHET_COLOR
      } else if (icon.skillId === 'move') {
        fillColor = UNLOCK_ICON_MOVE_COLOR
        borderColor = UNLOCK_ICON_MOVE_COLOR
      } else if (icon.skillId === 'magnet') {
        fillColor = UNLOCK_ICON_MAGNET_COLOR
        borderColor = UNLOCK_ICON_MAGNET_COLOR
      } else if (icon.skillId === 'hp') {
        fillColor = UNLOCK_ICON_HP_COLOR
        borderColor = UNLOCK_ICON_HP_COLOR
      } else {
        fillColor = UNLOCK_ICON_XP_BONUS_COLOR
        borderColor = UNLOCK_ICON_XP_BONUS_COLOR
      }
    }

    // シール中はスキル固有色を氷白へ少し寄せて「色の上に薄い氷」に見せる
    if (icon.isUnlocked && icon.isSealed) {
      fillColor = mixColorTowardIce(fillColor, UNLOCK_ICON_SEAL_FROST_COLOR_MIX)
      borderColor = mixColorTowardIce(borderColor, UNLOCK_ICON_SEAL_FROST_COLOR_MIX * 0.75)
    }

    icon.border.setFillStyle(borderColor)
    icon.fill.setFillStyle(fillColor)
    icon.border.setAlpha(alpha)
    icon.fill.setAlpha(alpha)
    icon.letterText.setColor(letterColor)
    icon.letterText.setAlpha(alpha)

    // さらに薄い白の氷幕を重ねる（色は透けてスキルごとに違って見える）
    this.setUnlockIconFrostVisible(icon, icon.isUnlocked && icon.isSealed)
  }

  /** 凍り幕の表示／非表示ときらめきタイマーを切り替える。 */
  private setUnlockIconFrostVisible(icon: UnlockStatusIcon, isVisible: boolean): void {
    icon.frostVeil.setVisible(isVisible)
    if (!isVisible) {
      icon.frostGlintA.setVisible(false)
      icon.frostGlintB.setVisible(false)
      icon.frostGlintA.setAlpha(0)
      icon.frostGlintB.setAlpha(0)
      if (icon.frostGlintTimer !== null) {
        icon.frostGlintTimer.destroy()
        icon.frostGlintTimer = null
      }
      return
    }

    if (icon.frostGlintTimer !== null) {
      return
    }

    // たまにだけ氷がきらめく（毎回光るとうるさいので確率付き）
    icon.frostGlintTimer = this.scene.time.addEvent({
      delay: UNLOCK_ICON_SEAL_GLINT_CHECK_MS,
      loop: true,
      callback: () => {
        if (!icon.isSealed || !icon.isUnlocked) {
          return
        }
        if (Math.random() > UNLOCK_ICON_SEAL_GLINT_CHANCE) {
          return
        }
        this.flashFrostGlint(icon)
      },
    })
  }

  /** 凍り幕の上で、小さな氷のかけらを1つ短く光らせる。 */
  private flashFrostGlint(icon: UnlockStatusIcon): void {
    const useGlintA = Math.random() < 0.5
    const glint = useGlintA ? icon.frostGlintA : icon.frostGlintB
    // アイコン内のランダムな位置へずらす（端に寄りすぎないよう少し内側）
    const half = UNLOCK_ICON_SIZE / 2 - 3
    const offsetX = Phaser.Math.Between(-half, half)
    const offsetY = Phaser.Math.Between(-half, half)
    glint.setPosition(icon.frostVeil.x + offsetX, icon.frostVeil.y + offsetY)
    glint.setVisible(true)
    glint.setAlpha(0)

    this.scene.tweens.add({
      targets: glint,
      alpha: 0.95,
      duration: UNLOCK_ICON_SEAL_GLINT_FLASH_MS / 2,
      yoyo: true,
      ease: 'Sine.Out',
      onComplete: () => {
        glint.setVisible(false)
        glint.setAlpha(0)
      },
    })
  }

  // スキルツリー配置: 上段 Blast/Ricochet/Pierce、中段 Power/Range/Speed/Move、下段 Pickup/XP
  private layoutUnlockStatusIcons(): void {
    if (this.unlockStatusHeaderText === null) {
      return
    }

    let nextY =
      PLAYER_STATS_TOP_OFFSET +
      this.playerStatLines.length * PLAYER_STATS_LINE_HEIGHT +
      UNLOCK_STATUS_GAP_FROM_STATS

    this.unlockStatusHeaderText.setPosition(this.unlockPanelX, nextY)
    nextY = nextY + this.unlockStatusHeaderText.height + 6

    const stepX = UNLOCK_ICON_SIZE + UNLOCK_ICON_GAP
    const row0Y = nextY + UNLOCK_ICON_SIZE / 2
    const row1Y = row0Y + UNLOCK_ICON_SIZE + SKILL_TREE_ROW_GAP
    const row2Y = row1Y + UNLOCK_ICON_SIZE + SKILL_TREE_EXTRA_ROW_GAP
    const rowCentersY = [row0Y, row1Y, row2Y]

    const iconBySkillId = new Map<string, UnlockStatusIcon>()
    for (let index = 0; index < this.unlockStatusIcons.length; index++) {
      iconBySkillId.set(this.unlockStatusIcons[index].skillId, this.unlockStatusIcons[index])
    }

    for (let slotIndex = 0; slotIndex < SKILL_TREE_SLOTS.length; slotIndex++) {
      const slot = SKILL_TREE_SLOTS[slotIndex]
      const icon = iconBySkillId.get(slot.skillId)
      if (icon === undefined) {
        continue
      }

      const iconX = this.unlockPanelX + UNLOCK_ICON_SIZE / 2 + slot.col * stepX
      const iconY = rowCentersY[slot.row]
      icon.border.setPosition(iconX, iconY)
      icon.fill.setPosition(iconX, iconY)
      icon.letterText.setPosition(iconX, iconY)
      icon.frostVeil.setPosition(iconX, iconY)
      icon.frostGlintA.setPosition(iconX - 4, iconY - 3)
      icon.frostGlintB.setPosition(iconX + 3, iconY + 4)
    }

    this.redrawSkillTreeLines(iconBySkillId)
  }

  /**
   * Power+Range→Blast / Pickup+Power+Speed→Ricochet / Speed+Move→Pierce のつなぎ線を描く。
   */
  private redrawSkillTreeLines(
    iconBySkillId: Map<string, UnlockStatusIcon>,
  ): void {
    if (this.skillTreeLinesGraphics === null) {
      return
    }

    const graphics = this.skillTreeLinesGraphics
    graphics.clear()
    graphics.lineStyle(
      SKILL_TREE_LINE_THICKNESS,
      SKILL_TREE_LINE_COLOR,
      SKILL_TREE_LINE_ALPHA,
    )

    const half = UNLOCK_ICON_SIZE / 2
    for (let index = 0; index < SKILL_TREE_LINKS.length; index++) {
      const link = SKILL_TREE_LINKS[index]
      const parentIcon = iconBySkillId.get(link.parentId)
      const childIcon = iconBySkillId.get(link.childId)
      if (parentIcon === undefined || childIcon === undefined) {
        continue
      }

      // 上のコンボの下端 → 下の素材の上端
      const startX = parentIcon.border.x
      const startY = parentIcon.border.y + half
      const endX = childIcon.border.x
      const endY = childIcon.border.y - half
      graphics.beginPath()
      graphics.moveTo(startX, startY)
      graphics.lineTo(endX, endY)
      graphics.strokePath()
    }
  }

  /**
   * 上げた直後だけ一瞬明るくして、通常の濃さへ戻す。
   * レベルアップ選択直後に GameScene から呼ぶ。
   */
  playStatUpgradePulse(statKey: PlayerStatKey): void {
    const line = this.findStatLine(statKey)
    if (line === null) {
      return
    }

    const restingAlpha = calculatePlayerStatAlpha(this.currentStatValues[statKey])
    this.stopStatPulse(statKey)

    line.text.setAlpha(PLAYER_STATS_PULSE_ALPHA)
    const pulseTween = this.scene.tweens.add({
      targets: line.text,
      alpha: restingAlpha,
      duration: PLAYER_STATS_PULSE_DURATION_MS,
      ease: 'Sine.Out',
      onComplete: () => {
        this.playerStatPulseTweens.delete(statKey)
        // 完了時にも最新値の濃さへ合わせる（途中で値が変わった場合に備える）
        line.text.setAlpha(calculatePlayerStatAlpha(this.currentStatValues[statKey]))
      },
    })
    this.playerStatPulseTweens.set(statKey, pulseTween)
  }

  /**
   * キラキラ演出の飛び先（XP バーの位置）。
   * XpGainEffectSystem がコイン→XP の演出に使う。
   */
  getXpEffectTargetPosition(): { x: number; y: number } {
    return {
      x: this.xpAnchorX - 24,
      y: this.xpBarCenterY,
    }
  }

  /** キーに対応するステータス行を探す。なければ null。 */
  private findStatLine(statKey: PlayerStatKey): PlayerStatLine | null {
    for (let index = 0; index < this.playerStatLines.length; index++) {
      if (this.playerStatLines[index].key === statKey) {
        return this.playerStatLines[index]
      }
    }
    return null
  }

  /** 進行中のパルス tween を止めて Map から外す。 */
  private stopStatPulse(statKey: PlayerStatKey): void {
    const existingTween = this.playerStatPulseTweens.get(statKey)
    if (existingTween === undefined) {
      return
    }
    existingTween.stop()
    this.playerStatPulseTweens.delete(statKey)
  }

  /** 画面上部の細い帯・実績ボタン・設定歯車。 */
  private createTopBar(): void {
    if (this.onSettingsClick !== null) {
      this.topBarView = createTopBar(
        this.scene,
        this.onSettingsClick,
        this.onAchievementsOpen ?? undefined,
        this.onAchievementsClose ?? undefined,
      )
      return
    }
    this.topBarView = createTopBar(
      this.scene,
      undefined,
      this.onAchievementsOpen ?? undefined,
      this.onAchievementsClose ?? undefined,
    )
  }

  /** 実績解除後などにバーの達成数表示を更新する。 */
  refreshAchievementProgress(): void {
    if (this.topBarView === null) {
      return
    }
    this.topBarView.refreshAchievementProgress()
  }

  /** ステージクリアで加算したゴールド所持数を更新する。 */
  refreshGold(): void {
    if (this.topBarView === null) {
      return
    }
    this.topBarView.refreshGold()
  }

  /** ゴールド獲得キラキラの飛び先（上部バー）。 */
  getGoldEffectTargetPosition(): { x: number; y: number } {
    if (this.topBarView === null) {
      return { x: GAME_WIDTH / 2, y: TOP_BAR_HEIGHT / 2 }
    }
    return this.topBarView.getGoldEffectTargetPosition()
  }

  /** HP ラベルと描画用 Graphics を用意する（実描画は renderHpBar）。 */
  private createHpBar(): void {
    // 設定バーの下に余白を空けて HP を置く
    this.hpBarCenterY = TOP_BAR_HEIGHT + 18
    this.hpBarLeft = HUD_SIDE_MARGIN + 28

    this.hpLabelText = this.scene.add
      .text(HUD_SIDE_MARGIN, this.hpBarCenterY, 'HP', HP_LABEL_STYLE)
      .setOrigin(0, 0.5)
    this.hpLabelText.setScrollFactor(0)

    this.hpBarGraphics = this.scene.add.graphics()
    this.hpBarGraphics.setScrollFactor(0)
  }

  /** 上部中央の Stage 文字。 */
  private createStatusText(): void {
    const stageCenterY = TOP_BAR_HEIGHT + 12
    this.statusText = this.scene.add.text(GAME_WIDTH / 2, stageCenterY, '', STATUS_TEXT_STYLE)
    this.statusText.setOrigin(0.5, 0.5)
    this.statusText.setScrollFactor(0)
  }

  /** XP バー左の Lv 文字（位置は layoutXpBarObjects で更新）。 */
  private createLevelText(): void {
    this.levelText = this.scene.add.text(0, 0, 'Lv 1', LEVEL_TEXT_STYLE)
    this.levelText.setOrigin(1, 0.5)
    this.levelText.setScrollFactor(0)
  }

  /** 上部中央・Stage の下の残り時間。 */
  private createTimerText(): void {
    const timerCenterY = TOP_BAR_HEIGHT + 36
    this.timerText = this.scene.add
      .text(GAME_WIDTH / 2, timerCenterY, '0:30', TIMER_TEXT_STYLE)
      .setOrigin(0.5, 0.5)
    this.timerText.setScrollFactor(0)
  }

  /** 右上の XP バー一式（背景・塗り・目盛り・数値）を作る。 */
  private createXpBar(): void {
    // 右端まで XP を伸ばす（歯車は上バーなので干渉しない）
    this.xpAnchorX = HUD_CONTENT_RIGHT
    const xpAnchorY = TOP_BAR_HEIGHT + 14
    this.xpBarCenterY = xpAnchorY + 18

    const initialBarWidth = XP_BAR_BASE_WIDTH
    const initialBarLeft = this.xpAnchorX - initialBarWidth

    this.xpLabelText = this.scene.add
      .text(0, this.xpBarCenterY, 'XP', XP_LABEL_STYLE)
      .setOrigin(1, 0.5)
    this.xpLabelText.setScrollFactor(0)

    this.xpBarBackground = this.scene.add
      .rectangle(
        initialBarLeft + initialBarWidth / 2,
        this.xpBarCenterY,
        initialBarWidth,
        XP_BAR_HEIGHT,
        0x1f2937,
      )
      .setOrigin(0.5)
    this.xpBarBackground.setScrollFactor(0)

    // 塗りは左端基準（width だけ伸ばす）
    this.xpBarFill = this.scene.add
      .rectangle(initialBarLeft, this.xpBarCenterY, 0, XP_BAR_HEIGHT, 0x22c55e)
      .setOrigin(0, 0.5)
    this.xpBarFill.setScrollFactor(0)

    this.xpBarTicks = this.scene.add.graphics()
    this.xpBarTicks.setScrollFactor(0)

    this.xpValueText = this.scene.add
      .text(this.xpAnchorX, this.xpBarCenterY - 8, '', XP_VALUE_STYLE)
      .setOrigin(1, 1)
    this.xpValueText.setScrollFactor(0)

    this.layoutXpBarObjects(initialBarLeft, initialBarWidth)
  }

  /** プレイエリア右のステータス 6 行を作る。 */
  private createPlayerStatsText(): void {
    // プレイエリアのすぐ右（プレイヤーが見やすい位置）に左揃えで置く
    const playAreaRight = PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH
    const statsX = playAreaRight + PLAYER_STATS_GAP_FROM_PLAY_AREA
    const statsY = PLAYER_STATS_TOP_OFFSET

    const lineDefs: { key: PlayerStatKey; label: string }[] = [
      { key: 'power', label: 'POWER' },
      { key: 'speed', label: 'SPEED' },
      { key: 'range', label: 'RANGE' },
      { key: 'move', label: 'MOVE' },
      { key: 'magnet', label: 'PICKUP' },
      { key: 'hp', label: 'HP MAX' },
      { key: 'penetrate', label: 'PIERCE' },
      { key: 'blast', label: 'BLAST' },
      { key: 'ricochet', label: 'RICOCHET' },
      { key: 'xpBonus', label: 'XP 2X' },
    ]

    this.playerStatLines = []
    for (let index = 0; index < lineDefs.length; index++) {
      const lineDef = lineDefs[index]
      const lineY = statsY + index * PLAYER_STATS_LINE_HEIGHT
      const lineText = this.scene.add.text(statsX, lineY, '', PLAYER_STATS_TEXT_STYLE)
      lineText.setOrigin(0, 0)
      lineText.setAlpha(calculatePlayerStatAlpha(1))
      lineText.setScrollFactor(0)
      this.playerStatLines.push({
        key: lineDef.key,
        label: lineDef.label,
        text: lineText,
      })
    }
  }

  /** ステータス下の SKILL TREE 見出しとツリー配置のアイコン。 */
  private createUnlockStatusText(): void {
    const playAreaRight = PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH
    this.unlockPanelX = playAreaRight + PLAYER_STATS_GAP_FROM_PLAY_AREA

    const statsBottomY =
      PLAYER_STATS_TOP_OFFSET + this.playerStatLines.length * PLAYER_STATS_LINE_HEIGHT
    const headerY = statsBottomY + UNLOCK_STATUS_GAP_FROM_STATS

    this.unlockStatusHeaderText = this.scene.add.text(
      this.unlockPanelX,
      headerY,
      UNLOCK_STATUS_HEADER_TEXT,
      UNLOCK_STATUS_HEADER_STYLE,
    )
    this.unlockStatusHeaderText.setOrigin(0, 0)
    this.unlockStatusHeaderText.setScrollFactor(0)
    shrinkTextToFitWidth(
      this.unlockStatusHeaderText,
      Math.max(48, GAME_WIDTH - this.unlockPanelX - UNLOCK_STATUS_RIGHT_MARGIN),
    )

    this.skillTreeLinesGraphics = this.scene.add.graphics()
    this.skillTreeLinesGraphics.setScrollFactor(0)

    this.createUnlockSkillTooltip()

    const rows = getUnlockStatusRows()
    const rowBySkillId = new Map<string, (typeof rows)[number]>()
    for (let index = 0; index < rows.length; index++) {
      rowBySkillId.set(rows[index].skillId, rows[index])
    }

    this.unlockStatusIcons = []
    for (let slotIndex = 0; slotIndex < SKILL_TREE_SLOTS.length; slotIndex++) {
      const slot = SKILL_TREE_SLOTS[slotIndex]
      const row = rowBySkillId.get(slot.skillId)
      if (row === undefined) {
        continue
      }

      let letter = UNLOCK_ICON_BLAST_LETTER
      if (row.skillId === 'damage') {
        letter = UNLOCK_ICON_POWER_LETTER
      } else if (row.skillId === 'fireRate') {
        letter = UNLOCK_ICON_SPEED_LETTER
      } else if (row.skillId === 'range') {
        letter = UNLOCK_ICON_RANGE_LETTER
      } else if (row.skillId === 'pierce') {
        letter = UNLOCK_ICON_PIERCE_LETTER
      } else if (row.skillId === 'ricochet') {
        letter = UNLOCK_ICON_RICOCHET_LETTER
      } else if (row.skillId === 'move') {
        letter = UNLOCK_ICON_MOVE_LETTER
      } else if (row.skillId === 'magnet') {
        letter = UNLOCK_ICON_MAGNET_LETTER
      } else if (row.skillId === 'xpBonus') {
        letter = UNLOCK_ICON_XP_BONUS_LETTER
      }

      const hitSize = UNLOCK_ICON_SIZE + UNLOCK_ICON_BORDER_SIZE * 2
      const border = this.scene.add.rectangle(
        0,
        0,
        hitSize,
        hitSize,
        UNLOCK_ICON_LOCKED_BORDER_COLOR,
      )
      border.setScrollFactor(0)
      border.setInteractive({ useHandCursor: true })

      const fill = this.scene.add.rectangle(
        0,
        0,
        UNLOCK_ICON_SIZE,
        UNLOCK_ICON_SIZE,
        UNLOCK_ICON_LOCKED_FILL_COLOR,
      )
      fill.setScrollFactor(0)

      const letterText = this.scene.add.text(0, 0, letter, UNLOCK_ICON_LETTER_STYLE)
      letterText.setOrigin(0.5)
      letterText.setScrollFactor(0)

      const frostVeil = this.scene.add.rectangle(
        0,
        0,
        UNLOCK_ICON_SIZE,
        UNLOCK_ICON_SIZE,
        UNLOCK_ICON_SEAL_FROST_COLOR,
        UNLOCK_ICON_SEAL_FROST_ALPHA,
      )
      frostVeil.setStrokeStyle(1, UNLOCK_ICON_SEAL_ICE_WHITE, UNLOCK_ICON_SEAL_FROST_BORDER_ALPHA)
      frostVeil.setScrollFactor(0)
      frostVeil.setVisible(false)

      const frostGlintA = this.scene.add.rectangle(
        0,
        0,
        UNLOCK_ICON_SEAL_GLINT_SIZE,
        UNLOCK_ICON_SEAL_GLINT_SIZE,
        UNLOCK_ICON_SEAL_GLINT_COLOR,
        0,
      )
      frostGlintA.setScrollFactor(0)
      frostGlintA.setVisible(false)

      const frostGlintB = this.scene.add.rectangle(
        0,
        0,
        UNLOCK_ICON_SEAL_GLINT_SIZE + 1,
        UNLOCK_ICON_SEAL_GLINT_SIZE - 1,
        UNLOCK_ICON_SEAL_GLINT_COLOR,
        0,
      )
      frostGlintB.setScrollFactor(0)
      frostGlintB.setVisible(false)

      const unlockIcon: UnlockStatusIcon = {
        skillId: row.skillId,
        skillLabel: row.skillLabel,
        skillDescription: row.skillDescription,
        unlockCondition: row.unlockCondition,
        isUnlocked: row.isUnlocked,
        isSealed: false,
        border,
        fill,
        letterText,
        frostVeil,
        frostGlintA,
        frostGlintB,
        frostGlintTimer: null,
      }

      border.on('pointerover', () => {
        this.showUnlockSkillTooltip(unlockIcon)
      })
      border.on('pointerout', () => {
        this.hideUnlockSkillTooltip()
      })

      this.unlockStatusIcons.push(unlockIcon)
      this.applyUnlockIconLook(unlockIcon)
    }
  }

  // フロート説明用の枠と文字を1組だけ作って使い回す
  private createUnlockSkillTooltip(): void {
    const background = this.scene.add.rectangle(
      0,
      0,
      10,
      10,
      UNLOCK_STATUS_TOOLTIP_BG_COLOR,
      UNLOCK_STATUS_TOOLTIP_BG_ALPHA,
    )
    background.setOrigin(0, 0)
    background.setScrollFactor(0)
    background.setDepth(UNLOCK_STATUS_TOOLTIP_DEPTH)
    background.setVisible(false)

    const titleText = this.scene.add.text(0, 0, '', UNLOCK_TOOLTIP_TITLE_STYLE)
    titleText.setOrigin(0, 0)
    titleText.setScrollFactor(0)
    titleText.setDepth(UNLOCK_STATUS_TOOLTIP_DEPTH + 1)
    titleText.setVisible(false)

    const descText = this.scene.add.text(0, 0, '', UNLOCK_TOOLTIP_DESC_STYLE)
    descText.setOrigin(0, 0)
    descText.setScrollFactor(0)
    descText.setDepth(UNLOCK_STATUS_TOOLTIP_DEPTH + 1)
    descText.setVisible(false)

    const lockText = this.scene.add.text(0, 0, '', UNLOCK_TOOLTIP_LOCK_STYLE)
    lockText.setOrigin(0, 0)
    lockText.setScrollFactor(0)
    lockText.setDepth(UNLOCK_STATUS_TOOLTIP_DEPTH + 1)
    lockText.setVisible(false)

    this.unlockSkillTooltip = {
      background,
      titleText,
      descText,
      lockText,
    }
  }

  // アイコンの左隣に名前・効果・（ロック時は条件）を出す
  private showUnlockSkillTooltip(icon: UnlockStatusIcon): void {
    if (this.unlockSkillTooltip === null) {
      return
    }

    const tooltip = this.unlockSkillTooltip
    tooltip.descText.setText(icon.skillDescription)

    if (icon.isUnlocked && icon.isSealed) {
      // スキル名と合わせて Sealed と分かるようにする
      tooltip.titleText.setText(`${icon.skillLabel}  ·  Sealed`)
      tooltip.titleText.setColor(UNLOCK_ICON_SEAL_TOOLTIP_COLOR)
      tooltip.lockText.setText('Hidden from level-up choices')
      tooltip.lockText.setColor(UNLOCK_ICON_SEAL_TOOLTIP_COLOR)
    } else if (icon.isUnlocked) {
      tooltip.titleText.setText(icon.skillLabel)
      tooltip.titleText.setColor(UNLOCK_STATUS_TOOLTIP_COLOR)
      tooltip.lockText.setText('Unlocked')
      tooltip.lockText.setColor(UNLOCK_STATUS_TOOLTIP_DESC_COLOR)
    } else {
      tooltip.titleText.setText(icon.skillLabel)
      tooltip.titleText.setColor(UNLOCK_STATUS_TOOLTIP_COLOR)
      tooltip.lockText.setText(`Locked: ${icon.unlockCondition}`)
      tooltip.lockText.setColor(UNLOCK_STATUS_TOOLTIP_LOCK_COLOR)
    }

    const pad = UNLOCK_STATUS_TOOLTIP_PADDING
    const contentWidth = Math.max(
      tooltip.titleText.width,
      tooltip.descText.width,
      tooltip.lockText.width,
    )
    const boxWidth = contentWidth + pad * 2
    const boxHeight =
      tooltip.titleText.height +
      4 +
      tooltip.descText.height +
      4 +
      tooltip.lockText.height +
      pad * 2

    // 右カラムの左隣に出す（画面外に出ないよう左右をクランプ）
    let boxX = icon.border.x - UNLOCK_ICON_SIZE / 2 - UNLOCK_STATUS_TOOLTIP_OFFSET_X - boxWidth
    if (boxX < HUD_SIDE_MARGIN) {
      boxX = icon.border.x + UNLOCK_ICON_SIZE / 2 + UNLOCK_STATUS_TOOLTIP_OFFSET_X
    }
    if (boxX + boxWidth > GAME_WIDTH - HUD_SIDE_MARGIN) {
      boxX = GAME_WIDTH - HUD_SIDE_MARGIN - boxWidth
    }

    let boxY = icon.border.y - boxHeight / 2
    if (boxY < TOP_BAR_HEIGHT + 4) {
      boxY = TOP_BAR_HEIGHT + 4
    }
    if (boxY + boxHeight > this.scene.scale.height - 4) {
      boxY = this.scene.scale.height - 4 - boxHeight
    }

    tooltip.background.setPosition(boxX, boxY)
    tooltip.background.setSize(boxWidth, boxHeight)
    tooltip.titleText.setPosition(boxX + pad, boxY + pad)
    tooltip.descText.setPosition(
      boxX + pad,
      boxY + pad + tooltip.titleText.height + 4,
    )
    tooltip.lockText.setPosition(
      boxX + pad,
      boxY + pad + tooltip.titleText.height + 4 + tooltip.descText.height + 4,
    )

    tooltip.background.setVisible(true)
    tooltip.titleText.setVisible(true)
    tooltip.descText.setVisible(true)
    tooltip.lockText.setVisible(true)
  }

  private hideUnlockSkillTooltip(): void {
    if (this.unlockSkillTooltip === null) {
      return
    }

    this.unlockSkillTooltip.background.setVisible(false)
    this.unlockSkillTooltip.titleText.setVisible(false)
    this.unlockSkillTooltip.descText.setVisible(false)
    this.unlockSkillTooltip.lockText.setVisible(false)
  }

  /** HUD 要素の depth（描画順）をまとめて設定する。 */
  private setAllHudDepth(): void {
    const hudDepth = 200
    this.hpLabelText.setDepth(hudDepth)
    this.hpBarGraphics.setDepth(hudDepth + 1)
    this.statusText.setDepth(hudDepth)
    this.levelText.setDepth(hudDepth)
    this.timerText.setDepth(hudDepth)
    this.xpLabelText.setDepth(hudDepth)
    this.xpValueText.setDepth(hudDepth)
    this.xpBarBackground.setDepth(hudDepth)
    this.xpBarFill.setDepth(hudDepth + 1)
    this.xpBarTicks.setDepth(hudDepth + 2)
    for (let index = 0; index < this.playerStatLines.length; index++) {
      this.playerStatLines[index].text.setDepth(hudDepth)
    }
    if (this.unlockStatusHeaderText !== null) {
      this.unlockStatusHeaderText.setDepth(hudDepth)
    }
    if (this.skillTreeLinesGraphics !== null) {
      this.skillTreeLinesGraphics.setDepth(hudDepth + SKILL_TREE_LINE_DEPTH_OFFSET)
    }
    for (let index = 0; index < this.unlockStatusIcons.length; index++) {
      const icon = this.unlockStatusIcons[index]
      icon.border.setDepth(hudDepth)
      icon.fill.setDepth(hudDepth + 1)
      icon.letterText.setDepth(hudDepth + 2)
      icon.frostVeil.setDepth(hudDepth + 3)
      icon.frostGlintA.setDepth(hudDepth + 4)
      icon.frostGlintB.setDepth(hudDepth + 4)
    }
  }

  // 1HP = 1マス（幅固定）。maxHp が増えるとバー全体が横に伸びる。
  private renderHpBar(currentHp: number, maxHp: number): void {
    const safeMaxHp = Math.max(1, maxHp)
    const clampedCurrentHp = Phaser.Math.Clamp(currentHp, 0, safeMaxHp)

    this.hpBarGraphics.clear()

    const topY = this.hpBarCenterY - HP_BAR_HEIGHT / 2
    const filledColor = 0xef4444
    const emptyColor = 0x1f2937
    const borderColor = 0x111827

    for (let segmentIndex = 0; segmentIndex < safeMaxHp; segmentIndex++) {
      const segmentLeft = this.hpBarLeft + segmentIndex * (HP_BAR_SEGMENT_WIDTH + HP_BAR_SEGMENT_GAP)
      const isFilled = segmentIndex < clampedCurrentHp
      const segmentColor = isFilled ? filledColor : emptyColor

      this.hpBarGraphics.fillStyle(segmentColor, 1)
      this.hpBarGraphics.fillRect(segmentLeft, topY, HP_BAR_SEGMENT_WIDTH, HP_BAR_HEIGHT)

      this.hpBarGraphics.lineStyle(1, borderColor, 0.85)
      this.hpBarGraphics.strokeRect(segmentLeft, topY, HP_BAR_SEGMENT_WIDTH, HP_BAR_HEIGHT)
    }
  }

  /** XP バー幅・目盛り・塗り・数値をまとめて更新する。 */
  private renderXpMeter(currentExperience: number, neededForNextLevel: number): void {
    const safeNeeded = Math.max(1, neededForNextLevel)
    const barWidth = this.calculateXpBarWidth(safeNeeded)
    const barLeft = this.xpAnchorX - barWidth

    this.layoutXpBarObjects(barLeft, barWidth)
    this.drawXpBarTicks(barLeft, barWidth, safeNeeded)

    const clampedCurrent = Phaser.Math.Clamp(currentExperience, 0, safeNeeded)
    const ratio = clampedCurrent / safeNeeded
    this.xpBarFill.width = barWidth * ratio
    this.xpValueText.setText(`${clampedCurrent} / ${safeNeeded}`)
  }

  /**
   * 次レベルに必要な XP が多いほどバーを長くする（上限あり）。
   * 基準は「必要 4」のときの幅。
   */
  private calculateXpBarWidth(neededForNextLevel: number): number {
    const extraRequiredXp = Math.max(0, neededForNextLevel - 4)
    const width = XP_BAR_BASE_WIDTH + extraRequiredXp * XP_BAR_GROWTH_PER_REQUIRED_XP
    return Math.min(width, XP_BAR_MAX_WIDTH)
  }

  /** バー幅に合わせて背景・塗り・Lv / XP ラベルの位置を揃える。 */
  private layoutXpBarObjects(barLeft: number, barWidth: number): void {
    this.xpBarBackground.setPosition(barLeft + barWidth / 2, this.xpBarCenterY)
    this.xpBarBackground.setSize(barWidth, XP_BAR_HEIGHT)
    this.xpBarFill.setPosition(barLeft, this.xpBarCenterY)

    // 右から: [Lv] --余白-- [XP] [バー]
    const xpLabelX = barLeft - 10
    this.xpLabelText.setPosition(xpLabelX, this.xpBarCenterY)
    this.levelText.setPosition(xpLabelX - XP_LEVEL_LEFT_MARGIN, this.xpBarCenterY)
  }

  /** 必要 XP に応じた縦目盛り線を描く（1 区切り＝1 XP）。 */
  private drawXpBarTicks(barLeft: number, barWidth: number, neededForNextLevel: number): void {
    this.xpBarTicks.clear()
    if (neededForNextLevel <= 1) {
      return
    }

    this.xpBarTicks.lineStyle(1, 0x111827, 0.75)
    const topY = this.xpBarCenterY - XP_BAR_HEIGHT / 2
    const bottomY = this.xpBarCenterY + XP_BAR_HEIGHT / 2

    for (let tickIndex = 1; tickIndex < neededForNextLevel; tickIndex++) {
      const x = barLeft + (barWidth * tickIndex) / neededForNextLevel
      this.xpBarTicks.beginPath()
      this.xpBarTicks.moveTo(x, topY)
      this.xpBarTicks.lineTo(x, bottomY)
      this.xpBarTicks.strokePath()
    }
  }
}

/**
 * ラベル幅を揃えて、数字が縦一列になるようにする。
 * 例: POWER:1 / PIERCE:0
 */
function formatStatLine(label: string, value: number): string {
  // いちばん長い "PIERCE:" に合わせて桁を揃える
  const labelWithColon = `${label}:`.padEnd(7, ' ')
  return `${labelWithColon}${value}`
}

/**
 * スキル色を氷白へ寄せる（薄い氷を張った色にする）。
 * mixAmount: 0=元の色のまま / 1=氷白だけ
 * Python: r = int(base_r * (1 - m) + ice_r * m) に相当
 */
function mixColorTowardIce(baseColor: number, mixAmount: number): number {
  const amount = Phaser.Math.Clamp(mixAmount, 0, 1)
  const baseR = (baseColor >> 16) & 0xff
  const baseG = (baseColor >> 8) & 0xff
  const baseB = baseColor & 0xff
  const iceR = (UNLOCK_ICON_SEAL_ICE_WHITE >> 16) & 0xff
  const iceG = (UNLOCK_ICON_SEAL_ICE_WHITE >> 8) & 0xff
  const iceB = UNLOCK_ICON_SEAL_ICE_WHITE & 0xff
  const mixedR = Math.round(baseR * (1 - amount) + iceR * amount)
  const mixedG = Math.round(baseG * (1 - amount) + iceG * amount)
  const mixedB = Math.round(baseB * (1 - amount) + iceB * amount)
  return (mixedR << 16) | (mixedG << 8) | mixedB
}
