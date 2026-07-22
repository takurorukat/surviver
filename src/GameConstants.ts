// ============================================================
// GameConstants.ts
// ゲーム全体の数値定数・難易度計算・XP 計算をここに集約する。
// マジックナンバーは原則ここにだけ書き、各オブジェクト／System から import する。
//
// 主な利用者:
// - main.ts / GameScene … 画面サイズ・物理 FPS・ステージ進行
// - objects/* … プレイヤー／敵／弾／コインの見た目と速度
// - systems/* … 移動・攻撃・吸引・ウェーブ・HUD
// - UI 系 … レベルアップ・ステージ結果・実績表示
// ============================================================

// --- 画面（キャンバス全体）---
// Phaser の game config とカメラ／レイアウトの基準。main.ts と GameScene が参照。
export const GAME_WIDTH = 960
export const GAME_HEIGHT = 540

// --- フォント ---
// 見出し（タイトル・バナー）用と、HUD・ボタンなど本文用の2種類だけ使う。
// 読み込みは index.html の Google Fonts。失敗時は monospace で代用する。
export const FONT_FAMILY_HEADING = '"Press Start 2P", monospace'
export const FONT_FAMILY_UI = '"Silkscreen", monospace'

// --- HUD・プレイエリア配置 ---
// 上部 HUD と、その下の戦闘エリア（縮小して中央寄せ）の幾何。
// PLAY_AREA_* はスポーン範囲・弾の画面外判定・移動境界の基準になる。
export const HUD_SIDE_MARGIN = 18
// 一番上の設定バー（アイコンを押しやすくするため太め）
export const TOP_BAR_HEIGHT = 24
// HP / Stage / Timer / XP の帯（設定バーの下）
export const HUD_CONTENT_HEIGHT = 64
// 設定バー込みの上部予約高さ（プレイエリア計算の基準）
export const HUD_HEIGHT = TOP_BAR_HEIGHT + HUD_CONTENT_HEIGHT
// 上部バー右端の設定歯車
export const SETTINGS_GEAR_SIZE = 21
export const SETTINGS_GEAR_GAP = 12
export const SETTINGS_GEAR_HIT_PADDING = 12
export const SETTINGS_GEAR_COLOR = '#cbd5e1'
export const SETTINGS_GEAR_HOVER_COLOR = '#fde68a'
// レベルアップ UI（400）より手前に置き、レベルアップ中も歯車・実績を押せるようにする
export const SETTINGS_GEAR_DEPTH = 415
export const TOP_BAR_BACKGROUND_COLOR = 0x334155
export const TOP_BAR_DEPTH = 150
// 歯車の左に置く実績（書類）ボタン（数字は出さずアイコンのみ）
export const ACHIEVEMENT_ICON_SIZE = 21
export const ACHIEVEMENT_BUTTON_WIDTH = 42
export const ACHIEVEMENT_ICON_COLOR = '#cbd5e1'
export const ACHIEVEMENT_ICON_HOVER_COLOR = '#86efac'
// 実績表示の左に置く、全ラン共通のゴールド所持数
// 幅は「● 999 G」程度が収まるサイズ（2桁以上でもアイコンと重ならない）
export const GOLD_DISPLAY_WIDTH = 120
export const GOLD_DISPLAY_GAP = 12
export const GOLD_ICON_COLOR = '#facc15'
export const GOLD_TEXT_COLOR = '#fde68a'
export const GOLD_BAR_FONT_SIZE = '16px'
export const GOLD_ICON_FONT_SIZE = '16px'
// 表示エリア左端からアイコン中心までの余白
export const GOLD_ICON_LEFT_PADDING = 14
// アイコン右端〜数字左端の隙間
export const GOLD_ICON_TEXT_GAP = 12
// 上部バー項目のホバー説明フロート
export const TOP_BAR_TOOLTIP_BG_COLOR = 0x111827
export const TOP_BAR_TOOLTIP_BG_ALPHA = 0.94
export const TOP_BAR_TOOLTIP_TEXT_COLOR = '#e5e7eb'
export const TOP_BAR_TOOLTIP_PADDING = 8
export const TOP_BAR_TOOLTIP_TWEEN_MS = 140
export const TOP_BAR_TOOLTIP_SLIDE_Y = 6
export const TOP_BAR_TOOLTIP_FONT_SIZE = '14px'
// 選択の黄色い枠の下に少し隙間を空ける（バー直下だと枠が隠れる）
export const TOP_BAR_TOOLTIP_GAP_BELOW_BAR = 12
export const TOP_BAR_TOOLTIP_LABEL_SETTINGS = 'Settings'
export const TOP_BAR_TOOLTIP_LABEL_ACHIEVEMENTS = 'Achievements'
export const TOP_BAR_TOOLTIP_LABEL_GOLD = 'Gold — spend in the Shop'
// バトル HUD の XP 右端（歯車は上バーにあるので画面右マージンまで使う）
export const HUD_CONTENT_RIGHT = GAME_WIDTH - HUD_SIDE_MARGIN

// --- 設定メニュー（右からスライド）---
export const SETTINGS_MENU_WIDTH = 260
export const SETTINGS_MENU_DEPTH = 450
export const SETTINGS_MENU_PANEL_COLOR = 0x1e293b
export const SETTINGS_MENU_BORDER_COLOR = 0xfde68a
export const SETTINGS_MENU_OVERLAY_COLOR = 0x000000
// 背景ブラーと重ねるので、暗さは控えめ
export const SETTINGS_MENU_OVERLAY_ALPHA = 0.22
export const SETTINGS_MENU_TWEEN_MS = 220
export const SETTINGS_MENU_BUTTON_HEIGHT = 40
export const SETTINGS_MENU_BUTTON_GAP = 12
export const SETTINGS_CREDITS_TITLE = 'Credits'
export const SETTINGS_CREDITS_BODY = [
  'Created by TMFactory',
  '',
  'Assets',
  'Graphics, Music: Pixel-Boy (Ninja Adventure, CC0)',
].join('\n')
// Phaser postFX.addBlur(quality, x, y, strength, color, steps)
export const SETTINGS_MENU_BLUR_QUALITY = 1
export const SETTINGS_MENU_BLUR_OFFSET = 2
export const SETTINGS_MENU_BLUR_STRENGTH = 1.4
export const SETTINGS_MENU_BLUR_STEPS = 4
export const BGM_ENABLED_STORAGE_KEY = 'survivor-bgm-enabled-v2'

export const PLAY_AREA_SCALE = 0.8
export const PLAY_AREA_WIDTH = Math.floor(GAME_WIDTH * PLAY_AREA_SCALE)
export const PLAY_AREA_HEIGHT = Math.floor(GAME_HEIGHT * PLAY_AREA_SCALE)
// HUD 下端とプレイ枠のあいだの余白
export const PLAY_AREA_GAP_BELOW_HUD = 12
export const PLAY_AREA_ORIGIN_X = Math.floor((GAME_WIDTH - PLAY_AREA_WIDTH) / 2)
const SPACE_BELOW_HUD = GAME_HEIGHT - HUD_HEIGHT - PLAY_AREA_GAP_BELOW_HUD
export const PLAY_AREA_ORIGIN_Y = Math.floor(
  HUD_HEIGHT + PLAY_AREA_GAP_BELOW_HUD + (SPACE_BELOW_HUD - PLAY_AREA_HEIGHT) / 2,
)

// --- HUD の XP バー（dungeon sweeper と同じ見た目）---
// HudSystem / XP 表示。必要 XP が増えるとバー幅も少し伸びる。
export const XP_BAR_BASE_WIDTH = 108
export const XP_BAR_GROWTH_PER_REQUIRED_XP = 12
export const XP_BAR_MAX_WIDTH = 220
export const XP_BAR_HEIGHT = 14
// Lv 表示と XP ラベルのあいだの余白
export const XP_LEVEL_LEFT_MARGIN = 24

// --- HUD 右側のステータス表示（POWER / SPEED / RANGE / MOVE）---
// レベルアップで上がった強さを半透明テキストで示す。GameScene / Hud 系。
export const PLAYER_STATS_FONT_SIZE = '11px'
export const PLAYER_STATS_COLOR = '#a1a1aa'
export const PLAYER_STATS_LINE_HEIGHT = 14
// プレイエリア上端からのすき間（枠の位置に追従）
export const PLAYER_STATS_GAP_FROM_PLAY_AREA_TOP = 6
export const PLAYER_STATS_TOP_OFFSET =
  PLAY_AREA_ORIGIN_Y + PLAYER_STATS_GAP_FROM_PLAY_AREA_TOP
// プレイエリア右端からのすき間（プレイ画面側に寄せる）
export const PLAYER_STATS_GAP_FROM_PLAY_AREA = 6
// 強いほど不透明度が上がる（太字や色変更は使わない）
export const PLAYER_STATS_ALPHA_MIN = 0.32
export const PLAYER_STATS_ALPHA_PER_LEVEL = 0.1
export const PLAYER_STATS_ALPHA_MAX = 0.9
// レベルアップ直後の一瞬フラッシュ
export const PLAYER_STATS_PULSE_ALPHA = 1
export const PLAYER_STATS_PULSE_DURATION_MS = 450

/**
 * ステータス値から表示の濃さ（alpha）を求める。
 * 0 も表示する PENETRATE / BOMB 用。HUD のステータステキストが呼ぶ。
 * Python: min(max_a, min_a + max(0, level) * step) に相当
 */
export function calculatePlayerStatAlpha(statValue: number): number {
  const safeValue = Math.max(0, statValue)
  const alpha = PLAYER_STATS_ALPHA_MIN + safeValue * PLAYER_STATS_ALPHA_PER_LEVEL
  return Math.min(PLAYER_STATS_ALPHA_MAX, alpha)
}

// --- HUD の HP バー（ゼルダ風・1ライフあたり幅固定）---
// セグメントを並べる幅計算。プレイヤー HP 表示用。
// 1マスは正方形（幅 = 高さ）にして、全体をコンパクトに見せる
export const HP_BAR_SEGMENT_WIDTH = 14
export const HP_BAR_HEIGHT = 14
export const HP_BAR_SEGMENT_GAP = 2

/**
 * maxHp 分の HP バー全体幅（セグメント＋すき間）を返す。
 * HUD のバー描画サイズ決定に使う。
 */
export function calculateHpBarWidth(maxHp: number): number {
  const safeMaxHp = Math.max(1, maxHp)
  const allSegmentsWidth = safeMaxHp * HP_BAR_SEGMENT_WIDTH
  const allGapsWidth = (safeMaxHp - 1) * HP_BAR_SEGMENT_GAP
  return allSegmentsWidth + allGapsWidth
}

// --- ステージ進行・制限時間・スポーン量 ---
// WaveSystem / GameScene がステージ番号に応じて時間と敵数を決める。
// ステージ総数はエリアごと（Plains=3, Forest=5）。TOTAL_STAGES は使わない。
// 全ステージ共通の制限時間
export const STAGE_DURATION_SECONDS = 30
// スポーンは制限時間の少し前まで（クリア余裕を残す）
export const STAGE_LAST_SPAWN_SECONDS = 22
export const STAGE_SPAWN_BURST_INTERVAL_SECONDS = 5
// Forest 最終ステージ（Stage5）だけスポーン間隔を短くする
export const FOREST_FINAL_STAGE_SPAWN_BURST_INTERVAL_SECONDS = 3
export const FOREST_FINAL_STAGE_PACK_GAP_SECONDS = 0.15
export const STAGE_INITIAL_ENEMY_BASE = 3
export const STAGE_RECURRING_ENEMY_BASE = 5
// ステージが進むほど出る数が増える（貫通のありがたさが出るように密度高め）
export const STAGE_INITIAL_ENEMY_GROWTH = 0.8
export const STAGE_RECURRING_ENEMY_GROWTH = 1.2

// --- エリア（タイトルのステージ選択）---
// Plains は最初から遊べる。Forest は Plains クリア後。他は後続実装。
export type StageAreaId =
  | 'plains'
  | 'forest'
  | 'volcano'
  | 'ruins'
  | 'castle'
  | 'dungeon'

export type StageAreaDef = {
  id: StageAreaId
  name: string
  stageCount: number
  // 解除に必要な「クリア済みエリア」。null なら最初から遊べる
  unlockRequiresClearedAreaId: StageAreaId | null
  // 選択中に表示する解除条件（英語）
  unlockCondition: string
  // このエリアが遊べるようになるまでは、タイトル上の名前を「?」で隠す
  // （例: Volcano は Forest が開放されるまで ?）
  hiddenUntilAreaPlayableId: StageAreaId | null
  // true なら条件を満たしてもまだ遊べない（後続実装用）
  comingSoon: boolean
}

export const STAGE_AREA_PLAINS_ID: StageAreaId = 'plains'

/** 結果画面: 次エリア解放の括弧内文言 */
export const AREA_UNLOCK_NOTIFICATION_REASON = 'New Area'
/** 結果画面: スキル解放の括弧内文言（UNLOCKED: Pierce の下に重複しないよう） */
export const SKILL_UNLOCK_NOTIFICATION_REASON = 'New Skill'

export const STAGE_AREAS: StageAreaDef[] = [
  {
    id: 'plains',
    name: 'Plains',
    stageCount: 3,
    unlockRequiresClearedAreaId: null,
    unlockCondition: '',
    hiddenUntilAreaPlayableId: null,
    comingSoon: false,
  },
  {
    id: 'forest',
    name: 'Forest',
    stageCount: 5,
    unlockRequiresClearedAreaId: 'plains',
    unlockCondition: 'Clear Plains to unlock',
    // 最初から名前は見える（未解放はグレー）
    hiddenUntilAreaPlayableId: null,
    comingSoon: false,
  },
  {
    id: 'volcano',
    name: 'Volcano',
    stageCount: 5,
    unlockRequiresClearedAreaId: 'forest',
    unlockCondition: 'Clear Forest to unlock',
    // Forest が開放されるまで ?
    hiddenUntilAreaPlayableId: 'forest',
    comingSoon: false,
  },
  {
    id: 'ruins',
    name: 'Ruins',
    stageCount: 5,
    unlockRequiresClearedAreaId: 'volcano',
    unlockCondition: 'Clear Volcano to unlock',
    // Volcano が開放されるまで ?
    hiddenUntilAreaPlayableId: 'volcano',
    comingSoon: false,
  },
  {
    id: 'castle',
    name: 'Castle',
    stageCount: 5,
    unlockRequiresClearedAreaId: 'ruins',
    unlockCondition: 'Clear Ruins to unlock',
    hiddenUntilAreaPlayableId: 'ruins',
    comingSoon: false,
  },
  {
    id: 'dungeon',
    name: 'Dungeon',
    stageCount: 5,
    unlockRequiresClearedAreaId: 'castle',
    unlockCondition: 'Clear Castle to unlock',
    hiddenUntilAreaPlayableId: 'castle',
    comingSoon: false,
  },
]

/**
 * エリア ID から定義を探す。見つからなければ null。
 */
export function getAreaById(areaId: string): StageAreaDef | null {
  for (let index = 0; index < STAGE_AREAS.length; index++) {
    if (STAGE_AREAS[index].id === areaId) {
      return STAGE_AREAS[index]
    }
  }
  return null
}

/**
 * あるエリアを初めてクリアしたときに遊べるようになる次エリア一覧。
 * 例: plains クリア → Forest / forest クリア → Volcano
 * comingSoon のエリアはまだ遊べないので含めない。
 */
export function getAreasUnlockedByClearing(clearedAreaId: string): StageAreaDef[] {
  const unlockedAreas: StageAreaDef[] = []
  for (let index = 0; index < STAGE_AREAS.length; index++) {
    const area = STAGE_AREAS[index]
    if (area.comingSoon) {
      continue
    }
    if (area.unlockRequiresClearedAreaId === clearedAreaId) {
      unlockedAreas.push(area)
    }
  }
  return unlockedAreas
}

/**
 * そのエリアのステージ総数（最終ステージ番号）。不明なら Plains の 3。
 */
export function getAreaStageCount(areaId: string): number {
  const area = getAreaById(areaId)
  if (area === null) {
    return 3
  }
  return area.stageCount
}

/**
 * いまのステージがエリア最終か（難易度アップ・ゲームクリア判定用）。
 */
export function isFinalStage(stageNumber: number, totalStages: number): boolean {
  return stageNumber >= totalStages
}

/**
 * ステージクリア時のゴールド報酬。
 * エリアが進むごとに基礎額 +1、最終ステージは2倍、
 * さらにそのステージをノーダメージかつ全敵撃破でクリアすると2倍。
 */
export function calculateStageClearGold(
  areaId: StageAreaId,
  finalStage: boolean,
  noDamageAllEnemiesClear: boolean,
): number {
  const areaOrder: StageAreaId[] = [
    'plains',
    'forest',
    'volcano',
    'ruins',
    'castle',
    'dungeon',
  ]
  const areaIndex = areaOrder.indexOf(areaId)
  const baseGold = areaIndex >= 0 ? areaIndex + 1 : 1

  let awardedGold = baseGold
  if (finalStage) {
    awardedGold = awardedGold * 2
  }
  if (noDamageAllEnemiesClear) {
    awardedGold = awardedGold * 2
  }
  return awardedGold
}

export const TITLE_AREA_PANEL_COLUMNS = 2
// タイトルに出すエリア数（Plains / Forest / Volcano / Ruins のみ。Castle 以降は出さない）
export const TITLE_AREA_VISIBLE_COUNT = 4
// 2×2 グリッド用。横は広め、縦は SELECT AREA や下部の Shop を隠さない高さ
export const TITLE_AREA_PANEL_WIDTH = 440
export const TITLE_AREA_PANEL_HEIGHT = 118
export const TITLE_AREA_PANEL_GAP = 20
export const TITLE_AREA_PANEL_ROW_GAP = 14
export const TITLE_AREA_PANEL_COLOR = 0x1e293b
export const TITLE_AREA_PANEL_BORDER_COLOR = 0x475569
export const TITLE_AREA_PANEL_SELECTED_BORDER_COLOR = 0xfde68a
export const TITLE_AREA_PANEL_HOVER_COLOR = 0x334155
export const TITLE_AREA_LOCKED_PANEL_COLOR = 0x111827
export const TITLE_AREA_NAME_COLOR = '#f4f4f5'
export const TITLE_AREA_SUB_COLOR = '#a1a1aa'
export const TITLE_AREA_LOCKED_NAME_COLOR = '#6b7280'
export const TITLE_LOCK_ICON_SIZE = 18
// ロック中テキスト（#6b7280）と同じグレー
export const TITLE_LOCK_ICON_COLOR = 0x6b7280
export const TITLE_LOCK_ICON_GAP = 10
// ロック中エリアを決定したときの南京錠の拡大縮小（1 → この倍率 → 1）
export const TITLE_LOCK_ICON_DENIED_PULSE_SCALE = 1.55
export const TITLE_LOCK_ICON_DENIED_PULSE_DURATION_MS = 110
export const UI_LOCK_ICON_KEY = 'ui-lock-icon'
export const UI_LOCK_ICON_PATH = 'assets/sprites/ui_lock_icon.png'
/** @deprecated タイトルでは南京錠アイコンを使う。他で参照がなければ削除可 */
export const TITLE_AREA_LOCKED_LABEL = 'LOCKED'
export const TITLE_AREA_NAME_LEFT_PADDING = 24
export const TITLE_AREA_STAGES_RIGHT_PADDING = 24
export const TITLE_AREA_NAME_OFFSET_Y = -18
export const TITLE_AREA_STAGES_OFFSET_Y = 20
export const TITLE_AREA_NAME_FONT_SIZE = '24px'
export const TITLE_AREA_STAGES_FONT_SIZE = '15px'
export const TITLE_AREA_CONDITION_COLOR = '#fde68a'
// グリッド上端（1行目パネル中心）。SELECT AREA の下に隙間を残す
export const TITLE_AREA_GRID_START_Y = TOP_BAR_HEIGHT + 136
// タイトル下部のショップ案内枠（中身の購入UIは後続）
// 枠・背景はエリアパネルと同じ配色（選択時の金色ハイライトも共通）
export const TITLE_SHOP_PANEL_WIDTH = 300
export const TITLE_SHOP_PANEL_HEIGHT = 72
export const TITLE_ACTION_PANEL_GAP = 16
// conditionText（GAME_HEIGHT - 56）のすぐ上。高さ増に合わせて少し上げる
export const TITLE_SHOP_PANEL_CENTER_Y = GAME_HEIGHT - 104
export const TITLE_SHOP_PANEL_BORDER_COLOR = TITLE_AREA_PANEL_BORDER_COLOR
export const TITLE_SHOP_PANEL_COLOR = TITLE_AREA_PANEL_COLOR
export const TITLE_SHOP_TITLE_COLOR = '#facc15'
export const TITLE_SHOP_DESC_COLOR = '#d6d3d1'
export const TITLE_SHOP_TITLE_FONT_SIZE = '24px'
export const TITLE_SHOP_DESC_FONT_SIZE = '18px'
export const TITLE_SHOP_TITLE_OFFSET_Y = -14
export const TITLE_SHOP_DESC_OFFSET_Y = 17
export const TITLE_SHOP_TITLE_TEXT = 'Shop'
export const TITLE_SHOP_DESC_TEXT = 'Raise skill caps · Buy Max HP'
// 初回プレイ時のショップ解除条件（タイトル案内用）
export const TITLE_SHOP_UNLOCK_CONDITION = 'Earn Gold to unlock'
// 初めて Shop が開いたあと、タイトルに戻ったときの吹き出し案内
export const TITLE_SHOP_UNLOCK_TIP_TEXT =
  'Buy upgrades here — Max HP, skill caps, and more!'
export const TITLE_SHOP_UNLOCK_TIP_HINT = 'Click or press any key'
// ステージクリア結果などでの Shop 解放表示
export const SHOP_UNLOCK_NOTIFICATION_LABEL = 'Shop'
export const SHOP_UNLOCK_NOTIFICATION_REASON = 'Earn Gold'
export const TITLE_SEAL_TITLE_TEXT = 'Seal Skills'
export const TITLE_SEAL_DESC_TEXT = 'Hide skills from level-up choices'
// ショップ画面（タイトルから開く）
export const SHOP_UI_DEPTH = 600
export const SHOP_PANEL_WIDTH = 680
export const SHOP_PANEL_HEIGHT = 500
export const SHOP_PANEL_COLOR = 0x0f172a
export const SHOP_PANEL_BORDER_COLOR = 0xfacc15
export const SHOP_CARD_WIDTH = 292
export const SHOP_CARD_HEIGHT = 82
export const SHOP_CARD_GAP_X = 18
export const SHOP_CARD_GAP_Y = 8
export const SHOP_CARD_COLOR = 0x1e293b
export const SHOP_CARD_HOVER_COLOR = 0x334155
export const SHOP_CARD_BORDER_COLOR = 0x475569
export const SHOP_CARD_SELECTED_BORDER_COLOR = 0xfacc15
export const SHOP_AFFORDABLE_COLOR = '#fde68a'
export const SHOP_UNAFFORDABLE_COLOR = '#fca5a5'
export const SHOP_OPEN_TWEEN_MS = 180
export const SHOP_PURCHASE_PULSE_MS = 180
// 全商品とも初回は1G。購入するたびに 1G ずつ価格が上がる（1, 2, 3...）。
export const SHOP_BASE_PRICE = 1
export const SHOP_PRICE_INCREASE = 1
// Max HP は 1G → 10G → 20G → 30G → 40G（以降も 40G）
export const MAX_HP_SHOP_PRICES = [1, 10, 20, 30, 40] as const
// Power / Speed / Range / XP Bonus / Pierce Cap は 1G → 5G → 10G → 20G → 30G → 40G（以降も 40G）
export const SKILL_CAP_SHOP_PRICES = [1, 5, 10, 20, 30, 40] as const
// 封印枠は 10G → 20G → 30G → 40G... と購入ごとに10Gずつ上がる
export const SEAL_SLOT_BASE_PRICE = 10
export const SEAL_SLOT_PRICE_INCREASE = 10

// 封印スキル選択画面
export const SEAL_UI_DEPTH = 600
export const SEAL_PANEL_WIDTH = 680
export const SEAL_PANEL_HEIGHT = 500
export const SEAL_CARD_WIDTH = 292
export const SEAL_CARD_HEIGHT = 56
export const SEAL_CARD_GAP_X = 18
export const SEAL_CARD_GAP_Y = 8

// --- ステージ開始カウントダウン（3・2・1・スタート）---
// 戦闘開始前の演出。GameScene の開始シーケンスが参照。
export const START_COUNTDOWN_STEP_MS = 333
export const START_COUNTDOWN_POP_IN_MS = 60
export const START_COUNTDOWN_HOLD_MS = 75
export const START_COUNTDOWN_FADE_OUT_MS = 175
export const START_COUNTDOWN_LABELS = ['3', '2', '1', 'START'] as const
export const START_COUNTDOWN_FONT_SIZE = 72
export const START_COUNTDOWN_START_FONT_SIZE = 56
export const START_COUNTDOWN_TEXT_COLOR = '#ffffff'
export const START_COUNTDOWN_STROKE_COLOR = '#000000'
export const START_COUNTDOWN_STROKE_THICKNESS = 8
export const START_COUNTDOWN_DEPTH = 300
// Stage 1: 中央より下にずらす（上側に余白を確保）
export const START_COUNTDOWN_STAGE1_OFFSET_Y = 72

// --- レベルアップ後の再開カウントダウン（ready・GO! のみ）---
// ラベルが2つなので、3・2・1・START（4つ）のおよそ半分の長さになる
export const RESUME_COUNTDOWN_LABELS = ['ready', 'GO!'] as const
export const RESUME_COUNTDOWN_STEP_MS = START_COUNTDOWN_STEP_MS
export const RESUME_COUNTDOWN_POP_IN_MS = START_COUNTDOWN_POP_IN_MS
export const RESUME_COUNTDOWN_HOLD_MS = START_COUNTDOWN_HOLD_MS
export const RESUME_COUNTDOWN_FADE_OUT_MS = START_COUNTDOWN_FADE_OUT_MS

// --- プレイヤー本体・戦闘基礎値 ---
// createPlayer / PlayerMovement / 被ダメ・攻撃 System が参照。
// 実際の移動速度は GameScene.currentMoveSpeed（アイテムで増減）。PLAYER_SPEED は基準・上限用。
export const PLAYER_HP = 2
// 基本移動速度。実際の速度は GameScene の currentMoveSpeed（アイテムで増減可能）
export const PLAYER_SPEED = 200

// --- 相対ポインタ追従（タッチ専用）---
// 押した位置を起点に、指の移動量 × 倍率ぶん先を目標にする（指の下にキャラが来ない）
export const POINTER_FOLLOW_DRAG_GAIN = 2
// false: PCマウスは従来どおりカーソル位置へ追従。タッチだけ相対追従
export const POINTER_FOLLOW_MOUSE_USES_RELATIVE = false
export const POINTER_FOLLOW_MARKER_RADIUS = 10
export const POINTER_FOLLOW_MARKER_COLOR = 0xffffff
export const POINTER_FOLLOW_MARKER_ALPHA = 0.35
export const POINTER_FOLLOW_MARKER_DEPTH = 6
export const POINTER_FOLLOW_MARKER_STROKE_WIDTH = 2

// ゲームロジックの基準フレームレート（描画・速度計算の基準）。
export const PHYSICS_FPS = 60
export const PHYSICS_FIXED_STEP_SECONDS = 1 / PHYSICS_FPS
// --- 弾のすり抜け（トンネリング）対策 ---
// Arcade Physics には高速弾用の連続衝突判定（CCD）がないため、
// Phaser 公式が推奨する「物理の刻みを細かくする」方法を使う。
// 1描画フレーム（1/60秒）を4つの小さなステップに分けて進めることで、
// 弾の1ステップ移動距離が 800÷240 ≈ 3.3px になり、判定を飛び越えなくなる。
// 速度は px/秒 で指定しているので、刻みを細かくしても移動速度は変わらない。
export const PHYSICS_SUBSTEPS_PER_FRAME = 4
export const ARCADE_PHYSICS_FPS = PHYSICS_FPS * PHYSICS_SUBSTEPS_PER_FRAME
// 後方互換の別名（コイン加速計算などで使用）
export const PLAYER_MOVEMENT_FIXED_STEP_SECONDS = PHYSICS_FIXED_STEP_SECONDS

// プレイ画面のキャラ・コイン・当たり判定の拡大率（スマホでも見やすく）
export const WORLD_ENTITY_SCALE = 1.5

export const PLAYER_WIDTH = 24 * WORLD_ENTITY_SCALE
export const PLAYER_HEIGHT = 24 * WORLD_ENTITY_SCALE
export const PLAYER_RADIUS = 12 * WORLD_ENTITY_SCALE
export const PLAYER_COLOR = 0x4fc3f7
// --- プレイヤー歩行スプライト（4×4 = 16コマ。列 = 向き、行 = アニメコマ）---
// 列0 = 下向き、列1 = 上向き、列2 = 左向き、列3 = 右向き
export const PLAYER_WALK_SPRITE_KEY = 'player-walk'
export const PLAYER_WALK_SPRITE_PATH = 'assets/sprites/player_walk.png'
export const PLAYER_WALK_FRAME_SIZE = 16
export const PLAYER_WALK_FRAME_RATE = 8
// コマ内に透明の余白があるため、当たり判定(24px)より大きめに表示して
// 旧テスト時の四角と同じくらいの見た目にする
export const PLAYER_WALK_DISPLAY_SIZE = 30 * WORLD_ENTITY_SCALE
export const PLAYER_INVINCIBLE_SECONDS = 0.8
// 被ダメ時に敵から離す（連続接触ダメージを防ぐ）
export const PLAYER_KNOCKBACK_SPEED = 600
export const PLAYER_KNOCKBACK_DURATION_MS = 200
export const PLAYER_ATTACK_DAMAGE = 1
export const PLAYER_ATTACK_INTERVAL_MS = 800
export const PLAYER_ATTACK_RANGE = 150 * WORLD_ENTITY_SCALE

// --- プレイヤー弾（見た目・速度・上限は objects/PlayerBullet）---
export const PLAYER_BULLET_WIDTH = 8 * WORLD_ENTITY_SCALE
export const PLAYER_BULLET_HEIGHT = 8 * WORLD_ENTITY_SCALE
export const PLAYER_BULLET_COLOR = 0xfde68a
// 遠い敵の移動にも届きやすいよう、やや速め
export const PLAYER_BULLET_SPEED = 800
// すり抜け防止は判定拡大ではなく物理サブステップで行う（PHYSICS_SUBSTEPS_PER_FRAME 参照）
export const PLAYER_BULLET_RADIUS = 4 * WORLD_ENTITY_SCALE

// --- コイン見た目・吸引（Coin / CoinMagnetSystem）---
// 吸引半径・初速・上限速・加速度は吸引ルールの定数。生成時 magnetSpeed=0 必須。
// 見た目は四角・円・ダイヤ・星・三角のランダム。大きさも少しばらつく。
// 中身はどれも COIN_XP_VALUE（1 XP）。
export const COIN_SIZE_SCALE = 1.5
export const COIN_SIZE_MIN = 4 * WORLD_ENTITY_SCALE * COIN_SIZE_SCALE
export const COIN_SIZE_MAX = 6 * WORLD_ENTITY_SCALE * COIN_SIZE_SCALE
export const COIN_COLOR = 0xfbbf24
// コインが小さくて見つけにくいので、時々キラッと光らせて場所を知らせる
// 1回の光り = 拡大しながら明るくなり、すぐ元に戻る（yoyo）
export const COIN_SPARKLE_SCALE = 2.0
export const COIN_SPARKLE_DURATION_MS = 200
// 全部が同時に光ると目がチカチカするので、待ち時間をランダムにずらす
export const COIN_SPARKLE_DELAY_MIN_MS = 600
export const COIN_SPARKLE_DELAY_MAX_MS = 1800
// コイン・弾がタイル床に溶け込まないよう、細い黒枠で囲む
export const ENTITY_OUTLINE_COLOR = 0x000000
export const ENTITY_OUTLINE_WIDTH = 1 * WORLD_ENTITY_SCALE
export const COIN_XP_VALUE = 1
export const COIN_MAGNET_RADIUS = 80 * WORLD_ENTITY_SCALE
export const COIN_MAGNET_INITIAL_SPEED = 120
export const COIN_MAGNET_MAX_SPEED = 520
export const COIN_MAGNET_ACCELERATION = 2200
// ステージクリア時: 画面上の全コインを高速で集める
export const COIN_CLEAR_VACUUM_SPEED = 780
export const STAGE_CLEAR_VACUUM_SETTLE_MS = 350

// --- 効果音 ---
// 発射音・ゲームオーバー音・レベルアップ音・ステージクリア音・メニュー音などは外部OGG。
// それ以外は GameAudioSystem が Web Audio で生成する。
export const SFX_KEY_ENEMY_DEFEAT = 'sfx-enemy-defeat'
export const SFX_KEY_ENEMY_HIT = 'sfx-enemy-hit'
export const SFX_KEY_ENEMY_BLOCKED = 'sfx-enemy-blocked'
export const SFX_PATH_ENEMY_BLOCKED = 'assets/audio/enemy_blocked.ogg'
export const SFX_KEY_PLAYER_FIRE = 'sfx-player-fire'
export const SFX_PATH_PLAYER_FIRE = 'assets/audio/player_fire.ogg'
export const SFX_KEY_GAME_OVER = 'sfx-game-over'
export const SFX_PATH_GAME_OVER = 'assets/audio/game_over.ogg'
export const SFX_KEY_COIN_PICKUP = 'sfx-coin-pickup'
export const SFX_KEY_PLAYER_HURT = 'sfx-player-hurt'
export const SFX_KEY_LEVEL_UP = 'sfx-level-up'
export const SFX_PATH_LEVEL_UP = 'assets/audio/level_up.ogg'
export const SFX_KEY_STAGE_CLEAR = 'sfx-stage-clear'
export const SFX_PATH_STAGE_CLEAR = 'assets/audio/stage_clear.ogg'
// エリアクリア用ジングル（Ninja Adventure: LevelUp2）
export const SFX_KEY_AREA_CLEAR = 'sfx-area-clear'
export const SFX_PATH_AREA_CLEAR = 'assets/audio/area_clear.ogg'
export const SFX_KEY_MENU_MOVE = 'sfx-menu-move'
export const SFX_PATH_MENU_MOVE = 'assets/audio/menu_move.ogg'
export const SFX_KEY_SHOP_PURCHASE = 'sfx-shop-purchase'
export const SFX_PATH_SHOP_PURCHASE = 'assets/audio/shop_purchase.ogg'
export const SFX_KEY_MENU_CANCEL = 'sfx-menu-cancel'
export const SFX_PATH_MENU_CANCEL = 'assets/audio/menu_cancel.ogg'
export const SFX_VOLUME = 0.35

// --- BGM（ループ再生）---
// Plains／共通戦闘BGM（Ninja Adventure Asset Pack: Good Time）
export const BGM_KEY = 'bgm'
export const BGM_PATHS = ['assets/audio/plains_bgm.ogg']
export const BGM_VOLUME = 0.45
export const FOREST_BGM_KEY = 'bgm-forest'
export const FOREST_BGM_PATH = 'assets/audio/forest_bgm.ogg'
export const VOLCANO_BGM_KEY = 'bgm-volcano'
export const VOLCANO_BGM_PATH = 'assets/audio/volcano_bgm.ogg'
export const RUINS_BGM_KEY = 'bgm-ruins'
export const RUINS_BGM_PATH = 'assets/audio/ruins_bgm.ogg'
// エリアクリア用ジングル（Ninja Adventure: LevelUp2）。ループしない
export const AREA_CLEAR_BGM_KEY = 'bgm-area-clear'
export const AREA_CLEAR_BGM_PATH = 'assets/audio/area_clear_bgm.ogg'
export const TITLE_BGM_KEY = 'bgm-title'
export const TITLE_BGM_PATH = 'assets/audio/title_bgm.ogg'
// 元の曲が大きいため、戦闘BGMの半分の音量にする
export const TITLE_BGM_VOLUME = BGM_VOLUME / 2

// --- ステージクリア大型バナー演出 ---
export const STAGE_CLEAR_BANNER_FONT_SIZE = '56px'
export const STAGE_CLEAR_BANNER_COLOR = '#86efac'
export const STAGE_CLEAR_BANNER_STROKE_COLOR = '#000000'
export const STAGE_CLEAR_BANNER_STROKE_THICKNESS = 8
export const STAGE_CLEAR_BANNER_DEPTH = 430
export const STAGE_CLEAR_BANNER_POP_MS = 280
export const STAGE_CLEAR_BANNER_HOLD_MS = 700
export const STAGE_CLEAR_BANNER_FADE_MS = 320
export const STAGE_CLEAR_BANNER_AREA_CLEAR_LABEL = 'AREA CLEAR!'
// 制限時間前に全敵を倒したときの追加演出・報酬
export const ALL_ENEMIES_CLEAR_BONUS_XP = 5
export const ALL_ENEMIES_CLEAR_BANNER_FONT_SIZE = '42px'
export const ALL_ENEMIES_CLEAR_BANNER_COLOR = '#fde68a'
export const ALL_ENEMIES_CLEAR_BANNER_POP_MS = 140
export const ALL_ENEMIES_CLEAR_BANNER_SETTLE_MS = 70
export const ALL_ENEMIES_CLEAR_BANNER_HOLD_MS = 250
export const ALL_ENEMIES_CLEAR_BANNER_FADE_MS = 160
// 全敵撃破の時間ボーナスコイン: 中央付近にばらまき、約2タイル上から落とす
export const CLEAR_TIME_BONUS_COIN_FALL_TILES = 2
export const CLEAR_TIME_BONUS_COIN_SPREAD_RADIUS = 52 * WORLD_ENTITY_SCALE
export const CLEAR_TIME_BONUS_COIN_FALL_MS = 480
// ALL ENEMIES CLEAR の直後に、実際の追加報酬を大きく見せる
export const CLEAR_REWARD_TEXT_XP_COLOR = '#86efac'
export const CLEAR_REWARD_TEXT_GOLD_COLOR = '#facc15'
export const CLEAR_REWARD_TEXT_FORMULA_COLOR = '#fde68a'
export const CLEAR_REWARD_TEXT_XP_FONT_SIZE = '36px'
export const CLEAR_REWARD_TEXT_FORMULA_FONT_SIZE = '22px'
export const CLEAR_REWARD_TEXT_GOLD_FONT_SIZE = '28px'
export const CLEAR_REWARD_TEXT_POP_MS = 170
export const CLEAR_REWARD_TEXT_SETTLE_MS = 70
export const CLEAR_REWARD_TEXT_HOLD_MS = 520
export const CLEAR_REWARD_TEXT_FADE_MS = 180
// 例: ALL CLEAR BONUS + TIME BONUS ×12
export const CLEAR_REWARD_XP_FORMULA_LABEL = 'ALL CLEAR BONUS + TIME BONUS'

// --- Final Wave（残り時間の終盤の警告と追加スポーン）---
export const FINAL_WAVE_REMAINING_SECONDS = 10
export const FINAL_WAVE_BANNER_FONT_SIZE = '52px'
export const FINAL_WAVE_BANNER_COLOR = '#fca5a5'
export const FINAL_WAVE_BANNER_STROKE_COLOR = '#000000'
export const FINAL_WAVE_BANNER_STROKE_THICKNESS = 8
export const FINAL_WAVE_BANNER_DEPTH = 425
export const FINAL_WAVE_BANNER_POP_MS = 260
export const FINAL_WAVE_BANNER_HOLD_MS = 900
export const FINAL_WAVE_BANNER_FADE_MS = 320
// 追加パックの間隔（秒）。通常バースト分をもう1回分、終盤に散らす
export const FINAL_WAVE_EXTRA_PACK_GAP_SECONDS = 1.6

// --- XP 獲得演出（コイン取得時のキラキラ等）---
export const XP_GAIN_SPARKLE_COUNT = 5
export const XP_GAIN_EFFECT_DURATION_MS = 520
export const XP_GAIN_SPARKLE_COLOR = '#fde68a'
export const XP_GAIN_TEXT_COLOR = '#86efac'
// --- ステージクリア時のゴールド獲得演出（コインが上部バーの所持金へ飛ぶ）---
export const GOLD_GAIN_EFFECT_DURATION_MS = 700
export const GOLD_GAIN_TEXT_COLOR = '#fde68a'
// レベルアップでゴールドを得たとき: プレイヤーから上へ浮かぶ距離
export const GOLD_GAIN_FLOAT_UP = 80
export const GOLD_GAIN_FLOAT_END_SCALE = 1.15
// ステージクリア用ゴールドコイン（4コマ回転アニメ）
export const GOLD_COIN_SPRITE_KEY = 'gold-coin'
export const GOLD_COIN_SPRITE_PATH = 'assets/sprites/gold_coin.png'
export const GOLD_COIN_FRAME_SIZE = 10
export const GOLD_COIN_FRAME_COUNT = 4
export const GOLD_COIN_ANIM_KEY = 'gold-coin-spin'
export const GOLD_COIN_ANIM_FRAME_RATE = 10
export const GOLD_COIN_DISPLAY_SIZE = 20 * WORLD_ENTITY_SCALE
export const GOLD_COIN_HITBOX_SIZE = 14 * WORLD_ENTITY_SCALE
// クリア時ゴールドも経験値と同じく上から落とす
export const CLEAR_GOLD_COIN_FALL_TILES = CLEAR_TIME_BONUS_COIN_FALL_TILES
export const CLEAR_GOLD_COIN_SPREAD_RADIUS = CLEAR_TIME_BONUS_COIN_SPREAD_RADIUS
export const CLEAR_GOLD_COIN_FALL_MS = CLEAR_TIME_BONUS_COIN_FALL_MS
export const CLEAR_GOLD_COIN_PICKUP_DISTANCE = 18 * WORLD_ENTITY_SCALE

// --- 敵の基準見た目・近接／射撃の振る舞い ---
// objects/Enemy と EnemyMovement / EnemyAttack が参照。
// 射撃型は好み距離帯（MIN〜MAX）で接近／後退／停止する。
export const ENEMY_WIDTH = 20 * WORLD_ENTITY_SCALE
export const ENEMY_HEIGHT = 20 * WORLD_ENTITY_SCALE
export const ENEMY_RADIUS = 10 * WORLD_ENTITY_SCALE
export const ENEMY_MELEE_COLOR = 0xf87171
// Plains Stage2 の少し硬い泥スライム（見た目OFF時の四角形色）
export const ENEMY_TOUGH_MELEE_COLOR = 0xb45309
// 少し硬い泥スライム専用HP（敵ごとに 3 か 4）
export const ENEMY_TOUGH_MELEE_MIN_HP = 3
export const ENEMY_TOUGH_MELEE_MAX_HP = 4
// 速度は通常近接と同じ式を使う（係数1）
export const ENEMY_TOUGH_MELEE_SPEED_FACTOR = 1
export const ENEMY_MELEE_DAMAGE = 1
// 敵の歩行スプライト表示スイッチ。
// false にすると色付き四角だけになる（スプライト画像・コードはそのまま残る）。
// 元に戻すときは true にするだけでよい。
export const ENEMY_WALK_SPRITES_ENABLED = false
// 静止PNG＋呼吸アニメの新方式
// true のとき melee / toughMelee / mushroom / spiritFire / spiritThunder / burningTree / ashKnight / chaosElemental / stump / beetle / branch / gravestone / ranged に BreathingSprite を付ける
export const ENEMY_BREATHING_SPRITES_ENABLED = true
// 呼吸スライム（静止1枚）。枠は実行時に黒シルエットを背面重ねする
export const ENEMY_SLIME_BREATH_SPRITE_KEY = 'enemy-slime-breath'
export const ENEMY_SLIME_BREATH_SPRITE_PATH = 'assets/sprites/enemy_slime_breath.png'
// Plains Stage2 の少し硬い泥スライム（静止1枚）
export const ENEMY_SLIME_MUD_BREATH_SPRITE_KEY = 'enemy-slime-mud-breath'
export const ENEMY_SLIME_MUD_BREATH_SPRITE_PATH = 'assets/sprites/enemy_slime_mud_breath.png'
// Forest Stage1 のキノコ（ステータスは緑スライムと同じ）
export const ENEMY_MUSHROOM_BREATH_SPRITE_KEY = 'enemy-mushroom-breath'
export const ENEMY_MUSHROOM_BREATH_SPRITE_PATH = 'assets/sprites/enemy_mushroom_breath.png'
// Volcano Stage1 の火の精霊（ステータスは緑スライムと同じ）
export const ENEMY_SPIRIT_FIRE_BREATH_SPRITE_KEY = 'enemy-spirit-fire-breath'
export const ENEMY_SPIRIT_FIRE_BREATH_SPRITE_PATH = 'assets/sprites/enemy_spirit_fire_breath.png'
// Volcano Stage2 の雷の精霊（HP3・速度はプレイヤー初期速度）
export const ENEMY_SPIRIT_THUNDER_BREATH_SPRITE_KEY = 'enemy-spirit-thunder-breath'
export const ENEMY_SPIRIT_THUNDER_BREATH_SPRITE_PATH = 'assets/sprites/enemy_spirit_thunder_breath.png'
// Volcano Stage3 の燃え木（HP8・3〜5秒ごとに火の精霊を出す）
export const ENEMY_BURNING_TREE_BREATH_SPRITE_KEY = 'enemy-burning-tree-breath'
export const ENEMY_BURNING_TREE_BREATH_SPRITE_PATH = 'assets/sprites/enemy_burning_tree_breath.png'
// Volcano Stage4 の灰騎士（HP6・最初の2発はシールドで無効）
export const ENEMY_ASH_KNIGHT_BREATH_SPRITE_KEY = 'enemy-ash-knight-breath'
export const ENEMY_ASH_KNIGHT_BREATH_SPRITE_PATH = 'assets/sprites/enemy_ash_knight_breath.png'
// Volcano Stage5 の混沌エレメンタル（HP50・動かない・2秒ごとに下位ステージの敵を出す）
export const ENEMY_CHAOS_ELEMENTAL_BREATH_SPRITE_KEY = 'enemy-chaos-elemental-breath'
export const ENEMY_CHAOS_ELEMENTAL_BREATH_SPRITE_PATH =
  'assets/sprites/enemy_chaos_elemental_breath.png'
// Forest Stage2 の切り株（泥スライム相当 HP・速度は半分・3秒ごとにキノコを出す）
export const ENEMY_STUMP_BREATH_SPRITE_KEY = 'enemy-stump-breath'
export const ENEMY_STUMP_BREATH_SPRITE_PATH = 'assets/sprites/enemy_stump_breath.png'
// Forest Stage3 のカブトムシ（HP5・緑スライム相当速度・経験値2倍）
export const ENEMY_BEETLE_BREATH_SPRITE_KEY = 'enemy-beetle-breath'
export const ENEMY_BEETLE_BREATH_SPRITE_PATH = 'assets/sprites/enemy_beetle_breath.png'
// 射撃敵（蜂）の呼吸用・静止PNG
export const ENEMY_BEE_BREATH_SPRITE_KEY = 'enemy-bee-breath'
export const ENEMY_BEE_BREATH_SPRITE_PATH = 'assets/sprites/enemy_bee_breath.png'
// キノコだけ通常敵より 1.25 倍大きくする（見た目・当たり判定）
export const ENEMY_MUSHROOM_SIZE_SCALE = 1.25
export const ENEMY_MUSHROOM_WIDTH = ENEMY_WIDTH * ENEMY_MUSHROOM_SIZE_SCALE
export const ENEMY_MUSHROOM_HEIGHT = ENEMY_HEIGHT * ENEMY_MUSHROOM_SIZE_SCALE
export const ENEMY_MUSHROOM_RADIUS = ENEMY_RADIUS * ENEMY_MUSHROOM_SIZE_SCALE
// 切り株・枝は通常敵の 2 倍（見た目・当たり判定）
export const ENEMY_STUMP_SIZE_SCALE = 2
export const ENEMY_STUMP_WIDTH = ENEMY_WIDTH * ENEMY_STUMP_SIZE_SCALE
export const ENEMY_STUMP_HEIGHT = ENEMY_HEIGHT * ENEMY_STUMP_SIZE_SCALE
export const ENEMY_STUMP_RADIUS = ENEMY_RADIUS * ENEMY_STUMP_SIZE_SCALE
export const ENEMY_BRANCH_SIZE_SCALE = 2
export const ENEMY_BRANCH_WIDTH = ENEMY_WIDTH * ENEMY_BRANCH_SIZE_SCALE
export const ENEMY_BRANCH_HEIGHT = ENEMY_HEIGHT * ENEMY_BRANCH_SIZE_SCALE
export const ENEMY_BRANCH_RADIUS = ENEMY_RADIUS * ENEMY_BRANCH_SIZE_SCALE
// 燃え木は切り株と同じく通常敵の 2 倍（見た目・当たり判定）
export const ENEMY_BURNING_TREE_SIZE_SCALE = 2
export const ENEMY_BURNING_TREE_WIDTH = ENEMY_WIDTH * ENEMY_BURNING_TREE_SIZE_SCALE
export const ENEMY_BURNING_TREE_HEIGHT = ENEMY_HEIGHT * ENEMY_BURNING_TREE_SIZE_SCALE
export const ENEMY_BURNING_TREE_RADIUS = ENEMY_RADIUS * ENEMY_BURNING_TREE_SIZE_SCALE
// 灰騎士は通常敵の 2.4 倍（見た目・当たり判定。以前 1.6 の 1.5 倍）
export const ENEMY_ASH_KNIGHT_SIZE_SCALE = 2.4
export const ENEMY_ASH_KNIGHT_WIDTH = ENEMY_WIDTH * ENEMY_ASH_KNIGHT_SIZE_SCALE
export const ENEMY_ASH_KNIGHT_HEIGHT = ENEMY_HEIGHT * ENEMY_ASH_KNIGHT_SIZE_SCALE
export const ENEMY_ASH_KNIGHT_RADIUS = ENEMY_RADIUS * ENEMY_ASH_KNIGHT_SIZE_SCALE
// 混沌エレメンタルはボス寄りに 2.5 倍（見た目・当たり判定）
export const ENEMY_CHAOS_ELEMENTAL_SIZE_SCALE = 2.5
export const ENEMY_CHAOS_ELEMENTAL_WIDTH = ENEMY_WIDTH * ENEMY_CHAOS_ELEMENTAL_SIZE_SCALE
export const ENEMY_CHAOS_ELEMENTAL_HEIGHT = ENEMY_HEIGHT * ENEMY_CHAOS_ELEMENTAL_SIZE_SCALE
export const ENEMY_CHAOS_ELEMENTAL_RADIUS = ENEMY_RADIUS * ENEMY_CHAOS_ELEMENTAL_SIZE_SCALE
// カブトムシは見た目・当たり判定とも 1.5 倍
export const ENEMY_BEETLE_SIZE_SCALE = 1.5
export const ENEMY_BEETLE_WIDTH = ENEMY_WIDTH * ENEMY_BEETLE_SIZE_SCALE
export const ENEMY_BEETLE_HEIGHT = ENEMY_HEIGHT * ENEMY_BEETLE_SIZE_SCALE
export const ENEMY_BEETLE_RADIUS = ENEMY_RADIUS * ENEMY_BEETLE_SIZE_SCALE
// 炎スプライトは縦長（129x161）。高さだけ合わせると緑スライムより細く小さく見えるので補正
// 緑スライムの表示横幅（約42px）に近づける倍率 ≈ (169/120) / (129/161)
export const ENEMY_SPIRIT_FIRE_SIZE_SCALE = 1.75
export const ENEMY_SPIRIT_FIRE_WIDTH = ENEMY_WIDTH * ENEMY_SPIRIT_FIRE_SIZE_SCALE
export const ENEMY_SPIRIT_FIRE_HEIGHT = ENEMY_HEIGHT * ENEMY_SPIRIT_FIRE_SIZE_SCALE
export const ENEMY_SPIRIT_FIRE_RADIUS = ENEMY_RADIUS * ENEMY_SPIRIT_FIRE_SIZE_SCALE
// 雷の精霊も通常敵の 1.6 倍（見た目・当たり判定）
export const ENEMY_SPIRIT_THUNDER_SIZE_SCALE = 1.6
export const ENEMY_SPIRIT_THUNDER_WIDTH = ENEMY_WIDTH * ENEMY_SPIRIT_THUNDER_SIZE_SCALE
export const ENEMY_SPIRIT_THUNDER_HEIGHT = ENEMY_HEIGHT * ENEMY_SPIRIT_THUNDER_SIZE_SCALE
export const ENEMY_SPIRIT_THUNDER_RADIUS = ENEMY_RADIUS * ENEMY_SPIRIT_THUNDER_SIZE_SCALE
// 見た目の高さは敵の当たり判定に合わせる（プレイヤー24pxと同程度の小ささ）
export const ENEMY_SLIME_BREATH_DISPLAY_HEIGHT = ENEMY_HEIGHT
export const ENEMY_SLIME_MUD_BREATH_DISPLAY_HEIGHT = ENEMY_HEIGHT
export const ENEMY_SPIRIT_FIRE_BREATH_DISPLAY_HEIGHT = ENEMY_SPIRIT_FIRE_HEIGHT
export const ENEMY_SPIRIT_THUNDER_BREATH_DISPLAY_HEIGHT = ENEMY_SPIRIT_THUNDER_HEIGHT
export const ENEMY_BURNING_TREE_BREATH_DISPLAY_HEIGHT = ENEMY_BURNING_TREE_HEIGHT
export const ENEMY_ASH_KNIGHT_BREATH_DISPLAY_HEIGHT = ENEMY_ASH_KNIGHT_HEIGHT
export const ENEMY_CHAOS_ELEMENTAL_BREATH_DISPLAY_HEIGHT = ENEMY_CHAOS_ELEMENTAL_HEIGHT
export const ENEMY_MUSHROOM_BREATH_DISPLAY_HEIGHT = ENEMY_MUSHROOM_HEIGHT
export const ENEMY_STUMP_BREATH_DISPLAY_HEIGHT = ENEMY_STUMP_HEIGHT
export const ENEMY_BEETLE_BREATH_DISPLAY_HEIGHT = ENEMY_BEETLE_HEIGHT
export const ENEMY_BEE_BREATH_DISPLAY_HEIGHT = ENEMY_HEIGHT
// 小さくした分の枠は残しつつ、少し細めに（上下左右は中心拡大で均等）
export const ENEMY_SLIME_BREATH_OUTLINE_SCALE = 1.1
export const ENEMY_SLIME_BREATH_SCALE_Y_MAX = 1.06
export const ENEMY_SLIME_BREATH_SCALE_Y_MIN = 0.94
// 呼吸の片道（伸び or 縮み）。yoyo往復なので周期はこの2倍＝0.7秒
export const ENEMY_SLIME_BREATH_DURATION_MS = 350
// 泥スライム・キノコ・切り株・蜂も緑スライムと同じ呼吸パラメータを使う
export const ENEMY_SLIME_MUD_BREATH_OUTLINE_SCALE = ENEMY_SLIME_BREATH_OUTLINE_SCALE
export const ENEMY_SLIME_MUD_BREATH_SCALE_Y_MAX = ENEMY_SLIME_BREATH_SCALE_Y_MAX
export const ENEMY_SLIME_MUD_BREATH_SCALE_Y_MIN = ENEMY_SLIME_BREATH_SCALE_Y_MIN
export const ENEMY_SLIME_MUD_BREATH_DURATION_MS = ENEMY_SLIME_BREATH_DURATION_MS
export const ENEMY_MUSHROOM_BREATH_OUTLINE_SCALE = ENEMY_SLIME_BREATH_OUTLINE_SCALE
export const ENEMY_MUSHROOM_BREATH_SCALE_Y_MAX = ENEMY_SLIME_BREATH_SCALE_Y_MAX
export const ENEMY_MUSHROOM_BREATH_SCALE_Y_MIN = ENEMY_SLIME_BREATH_SCALE_Y_MIN
export const ENEMY_MUSHROOM_BREATH_DURATION_MS = ENEMY_SLIME_BREATH_DURATION_MS
// 火の精霊も緑スライムと同じ呼吸パラメータ
export const ENEMY_SPIRIT_FIRE_BREATH_OUTLINE_SCALE = ENEMY_SLIME_BREATH_OUTLINE_SCALE
export const ENEMY_SPIRIT_FIRE_BREATH_SCALE_Y_MAX = ENEMY_SLIME_BREATH_SCALE_Y_MAX
export const ENEMY_SPIRIT_FIRE_BREATH_SCALE_Y_MIN = ENEMY_SLIME_BREATH_SCALE_Y_MIN
export const ENEMY_SPIRIT_FIRE_BREATH_DURATION_MS = ENEMY_SLIME_BREATH_DURATION_MS
export const ENEMY_SPIRIT_FIRE_COLOR = 0xf97316
// 雷の精霊も緑スライムと同じ呼吸パラメータ
export const ENEMY_SPIRIT_THUNDER_BREATH_OUTLINE_SCALE = ENEMY_SLIME_BREATH_OUTLINE_SCALE
export const ENEMY_SPIRIT_THUNDER_BREATH_SCALE_Y_MAX = ENEMY_SLIME_BREATH_SCALE_Y_MAX
export const ENEMY_SPIRIT_THUNDER_BREATH_SCALE_Y_MIN = ENEMY_SLIME_BREATH_SCALE_Y_MIN
export const ENEMY_SPIRIT_THUNDER_BREATH_DURATION_MS = ENEMY_SLIME_BREATH_DURATION_MS
export const ENEMY_SPIRIT_THUNDER_COLOR = 0x22d3ee
export const ENEMY_SPIRIT_THUNDER_HP = 3
// プレイヤー初期速度と同じ
export const ENEMY_SPIRIT_THUNDER_SPEED = PLAYER_SPEED
// 燃え木も緑スライムと同じ呼吸パラメータ
export const ENEMY_BURNING_TREE_BREATH_OUTLINE_SCALE = ENEMY_SLIME_BREATH_OUTLINE_SCALE
export const ENEMY_BURNING_TREE_BREATH_SCALE_Y_MAX = ENEMY_SLIME_BREATH_SCALE_Y_MAX
export const ENEMY_BURNING_TREE_BREATH_SCALE_Y_MIN = ENEMY_SLIME_BREATH_SCALE_Y_MIN
export const ENEMY_BURNING_TREE_BREATH_DURATION_MS = ENEMY_SLIME_BREATH_DURATION_MS
export const ENEMY_BURNING_TREE_COLOR = 0xea580c
export const ENEMY_BURNING_TREE_HP = 8
// 火の精霊を出す間隔（毎回この範囲からランダム）
export const ENEMY_BURNING_TREE_SPAWN_INTERVAL_MIN_MS = 3000
export const ENEMY_BURNING_TREE_SPAWN_INTERVAL_MAX_MS = 5000
export const ENEMY_BURNING_TREE_SPAWN_OFFSET = 28 * WORLD_ENTITY_SCALE
// 灰騎士も緑スライムと同じ呼吸パラメータ
export const ENEMY_ASH_KNIGHT_BREATH_OUTLINE_SCALE = ENEMY_SLIME_BREATH_OUTLINE_SCALE
export const ENEMY_ASH_KNIGHT_BREATH_SCALE_Y_MAX = ENEMY_SLIME_BREATH_SCALE_Y_MAX
export const ENEMY_ASH_KNIGHT_BREATH_SCALE_Y_MIN = ENEMY_SLIME_BREATH_SCALE_Y_MIN
export const ENEMY_ASH_KNIGHT_BREATH_DURATION_MS = ENEMY_SLIME_BREATH_DURATION_MS
export const ENEMY_ASH_KNIGHT_COLOR = 0x94a3b8
export const ENEMY_ASH_KNIGHT_HP = 6
// 最初の何発をシールドで無効にするか
export const ENEMY_ASH_KNIGHT_BLOCK_HIT_COUNT = 2
// Forest のカブトムシ／枝と同じく、火山のステージ3以上の敵は経験値2倍
export const ENEMY_BURNING_TREE_XP_DROP_MULTIPLIER = 2
export const ENEMY_ASH_KNIGHT_XP_DROP_MULTIPLIER = 2
export const ENEMY_CHAOS_ELEMENTAL_XP_DROP_MULTIPLIER = 2
// 混沌エレメンタルも緑スライムと同じ呼吸パラメータ
export const ENEMY_CHAOS_ELEMENTAL_BREATH_OUTLINE_SCALE = ENEMY_SLIME_BREATH_OUTLINE_SCALE
export const ENEMY_CHAOS_ELEMENTAL_BREATH_SCALE_Y_MAX = ENEMY_SLIME_BREATH_SCALE_Y_MAX
export const ENEMY_CHAOS_ELEMENTAL_BREATH_SCALE_Y_MIN = ENEMY_SLIME_BREATH_SCALE_Y_MIN
export const ENEMY_CHAOS_ELEMENTAL_BREATH_DURATION_MS = ENEMY_SLIME_BREATH_DURATION_MS
export const ENEMY_CHAOS_ELEMENTAL_COLOR = 0xf472b6
export const ENEMY_CHAOS_ELEMENTAL_HP = 75
// 下位ステージの敵を出す間隔
export const ENEMY_CHAOS_ELEMENTAL_SPAWN_INTERVAL_MS = 2000
export const ENEMY_CHAOS_ELEMENTAL_SPAWN_OFFSET = 36 * WORLD_ENTITY_SCALE
// 開始時の出現位置を中央より少し上へずらす
export const ENEMY_CHAOS_ELEMENTAL_SPAWN_OFFSET_Y = -72 * WORLD_ENTITY_SCALE
export const ENEMY_STUMP_BREATH_OUTLINE_SCALE = ENEMY_SLIME_BREATH_OUTLINE_SCALE
export const ENEMY_STUMP_BREATH_SCALE_Y_MAX = ENEMY_SLIME_BREATH_SCALE_Y_MAX
export const ENEMY_STUMP_BREATH_SCALE_Y_MIN = ENEMY_SLIME_BREATH_SCALE_Y_MIN
export const ENEMY_STUMP_BREATH_DURATION_MS = ENEMY_SLIME_BREATH_DURATION_MS
export const ENEMY_BEETLE_BREATH_OUTLINE_SCALE = ENEMY_SLIME_BREATH_OUTLINE_SCALE
export const ENEMY_BEETLE_BREATH_SCALE_Y_MAX = ENEMY_SLIME_BREATH_SCALE_Y_MAX
export const ENEMY_BEETLE_BREATH_SCALE_Y_MIN = ENEMY_SLIME_BREATH_SCALE_Y_MIN
export const ENEMY_BEETLE_BREATH_DURATION_MS = ENEMY_SLIME_BREATH_DURATION_MS
export const ENEMY_BEE_BREATH_OUTLINE_SCALE = ENEMY_SLIME_BREATH_OUTLINE_SCALE
export const ENEMY_BEE_BREATH_SCALE_Y_MAX = ENEMY_SLIME_BREATH_SCALE_Y_MAX
export const ENEMY_BEE_BREATH_SCALE_Y_MIN = ENEMY_SLIME_BREATH_SCALE_Y_MIN
export const ENEMY_BEE_BREATH_DURATION_MS = ENEMY_SLIME_BREATH_DURATION_MS
// キノコの当たり判定色（スプライト下の四角。ほぼ見えない）
export const ENEMY_MUSHROOM_COLOR = 0xf87171
// 切り株の当たり判定色
export const ENEMY_STUMP_COLOR = 0xd6b48a
// 切り株の固定 HP
export const ENEMY_STUMP_HP = 7
// Forest Stage2: 切り株は1回の出現で必ず2体
export const ENEMY_STUMP_PACK_SIZE = 2
// 切り株の速度 = 泥スライム速度 × この倍率
export const ENEMY_STUMP_SPEED_FACTOR = 0.5
// 燃え木の速度 = 切り株と同じ（泥スライムの半分）
export const ENEMY_BURNING_TREE_SPEED_FACTOR = ENEMY_STUMP_SPEED_FACTOR
// 切り株がキノコを出す間隔
export const ENEMY_STUMP_MUSHROOM_SPAWN_INTERVAL_MS = 3000
// 切り株の隣にキノコを出す距離
export const ENEMY_STUMP_MUSHROOM_SPAWN_OFFSET = 28 * WORLD_ENTITY_SCALE
// カブトムシの固定 HP（従来5の1.5倍）と経験値倍率
export const ENEMY_BEETLE_HP = 8
export const ENEMY_BEETLE_XP_DROP_MULTIPLIER = 2
// カブトムシ: 初期攻撃レンジ内 → 0.3秒停止 → その瞬間の方向へ4倍速で一直線突進
export const ENEMY_BEETLE_CHARGE_TRIGGER_DISTANCE = PLAYER_ATTACK_RANGE
export const ENEMY_BEETLE_CHARGE_SPEED_MULTIPLIER = 3
export const ENEMY_BEETLE_CHARGE_WINDUP_MS = 300
export const ENEMY_BEETLE_CHARGE_DURATION_MS = 700
export const ENEMY_BEETLE_CHARGE_COOLDOWN_MS = 800
// カブトムシの当たり判定色
export const ENEMY_BEETLE_COLOR = 0x3b82f6
// Forest Stage4 の枝（HP12・緑スライムより遅い・範囲爆破で2倍ダメージ・経験値2倍）
export const ENEMY_BRANCH_BREATH_SPRITE_KEY = 'enemy-branch-breath'
export const ENEMY_BRANCH_BREATH_SPRITE_PATH = 'assets/sprites/enemy_branch_breath.png'
export const ENEMY_BRANCH_BREATH_DISPLAY_HEIGHT = ENEMY_BRANCH_HEIGHT
export const ENEMY_BRANCH_BREATH_OUTLINE_SCALE = ENEMY_SLIME_BREATH_OUTLINE_SCALE
export const ENEMY_BRANCH_BREATH_SCALE_Y_MAX = ENEMY_SLIME_BREATH_SCALE_Y_MAX
export const ENEMY_BRANCH_BREATH_SCALE_Y_MIN = ENEMY_SLIME_BREATH_SCALE_Y_MIN
export const ENEMY_BRANCH_BREATH_DURATION_MS = ENEMY_SLIME_BREATH_DURATION_MS
export const ENEMY_BRANCH_HP = 12
export const ENEMY_BRANCH_XP_DROP_MULTIPLIER = 2
export const ENEMY_BRANCH_BLAST_DAMAGE_MULTIPLIER = 2
// 緑スライム速度 × この倍率（0.65 = 35% 遅い）
export const ENEMY_BRANCH_SPEED_FACTOR = 0.65
// Forest Stage5 だけ1回あたり出現数を抑える（他ステージは通常）
// 以前 0.6 → さらにその 0.8 倍（= 0.48）
export const FOREST_STAGE5_SPAWN_COUNT_FACTOR = 0.48
export const ENEMY_BRANCH_COLOR = 0xa16207
// 枝がカブトムシを出す間隔（少し余裕を持たせる）
export const ENEMY_BRANCH_BEETLE_SPAWN_INTERVAL_MS = 1500
// 枝の隣にカブトムシを出す距離
export const ENEMY_BRANCH_BEETLE_SPAWN_OFFSET = 28 * WORLD_ENTITY_SCALE
// Forest Stage5 の墓石（HP60・動かない・5秒ごとにカブトムシを出す）
export const ENEMY_GRAVESTONE_BREATH_SPRITE_KEY = 'enemy-gravestone-breath'
export const ENEMY_GRAVESTONE_BREATH_SPRITE_PATH = 'assets/sprites/enemy_gravestone_breath.png'
export const ENEMY_GRAVESTONE_BREATH_DISPLAY_HEIGHT = 32 * WORLD_ENTITY_SCALE
export const ENEMY_GRAVESTONE_BREATH_OUTLINE_SCALE = ENEMY_SLIME_BREATH_OUTLINE_SCALE
export const ENEMY_GRAVESTONE_BREATH_SCALE_Y_MAX = ENEMY_SLIME_BREATH_SCALE_Y_MAX
export const ENEMY_GRAVESTONE_BREATH_SCALE_Y_MIN = ENEMY_SLIME_BREATH_SCALE_Y_MIN
export const ENEMY_GRAVESTONE_BREATH_DURATION_MS = ENEMY_SLIME_BREATH_DURATION_MS
export const ENEMY_GRAVESTONE_HP = 120
export const ENEMY_GRAVESTONE_XP_DROP_MULTIPLIER = 10
export const ENEMY_GRAVESTONE_COLOR = 0x6b7280
export const ENEMY_GRAVESTONE_SPAWN_INTERVAL_MS = 3000
export const ENEMY_GRAVESTONE_SPAWN_OFFSET = 28 * WORLD_ENTITY_SCALE
// プレイヤー開始位置（中央）と重ならないよう、やや上に出す
export const ENEMY_GRAVESTONE_SPAWN_OFFSET_Y = -96 * WORLD_ENTITY_SCALE
export const ENEMY_SLIME_WALK_SPRITE_KEY = 'enemy-slime-walk'
export const ENEMY_SLIME_WALK_SPRITE_PATH = 'assets/sprites/enemy_slime_walk.png'
export const ENEMY_SLIME_WALK_FRAME_SIZE = 16
export const ENEMY_SLIME_WALK_FRAME_RATE = 8
// コマ内に透明の余白があるため、当たり判定(20px)より大きめに表示する
export const ENEMY_SLIME_DISPLAY_SIZE = 28 * WORLD_ENTITY_SCALE
// 射撃型（Stage 3+）。紫系で近接と区別
export const ENEMY_RANGED_COLOR = 0xc084fc
// 射撃敵に使う4×4歩行スプライト（列 = 向き、行 = アニメコマ）
export const ENEMY_SNAKE_WALK_SPRITE_KEY = 'enemy-snake-walk'
export const ENEMY_SNAKE_WALK_SPRITE_PATH = 'assets/sprites/enemy_snake_walk.png'
export const ENEMY_SNAKE_WALK_FRAME_SIZE = 16
export const ENEMY_SNAKE_WALK_FRAME_RATE = 8
export const ENEMY_SNAKE_DISPLAY_SIZE = 28 * WORLD_ENTITY_SCALE
// Volcano 特殊敵
export const ENEMY_RUNNER_COLOR = 0xef4444
export const ENEMY_CHARGER_COLOR = 0xf97316
// 突進敵に使う4×4歩行スプライト（列 = 向き、行 = アニメコマ）
export const ENEMY_CHARGER_WALK_SPRITE_KEY = 'enemy-charger-walk'
export const ENEMY_CHARGER_WALK_SPRITE_PATH = 'assets/sprites/enemy_charger_walk.png'
export const ENEMY_CHARGER_WALK_FRAME_SIZE = 16
export const ENEMY_CHARGER_WALK_FRAME_RATE = 8
export const ENEMY_CHARGER_DISPLAY_SIZE = 28 * WORLD_ENTITY_SCALE
export const ENEMY_ARMORED_COLOR = 0x64748b
// 防御力がある装甲敵に使う4×4歩行スプライト
export const ENEMY_ARMORED_WALK_SPRITE_KEY = 'enemy-armored-walk'
export const ENEMY_ARMORED_WALK_SPRITE_PATH = 'assets/sprites/enemy_armored_walk.png'
export const ENEMY_ARMORED_WALK_FRAME_SIZE = 16
export const ENEMY_ARMORED_WALK_FRAME_RATE = 8
export const ENEMY_ARMORED_DISPLAY_SIZE = 28 * WORLD_ENTITY_SCALE
export const ENEMY_SHIELDED_COLOR = 0x22d3ee
export const ENEMY_SPECIAL_STROKE_COLOR = 0xf8fafc
export const ENEMY_SPECIAL_STROKE_WIDTH = 2 * WORLD_ENTITY_SCALE
// 装甲敵はこの1発ダメージ以上でないとHPが減らない
export const ENEMY_ARMORED_MIN_DAMAGE = 3
// 高速敵は通常弾（初期1ダメージ）2発で倒せる。速度は初期プレイヤーより少しだけ速い
export const ENEMY_RUNNER_HP = 2
// 実際の移動は enemy data の speed だけを使う
export const ENEMY_RUNNER_MIN_SPEED = PLAYER_SPEED + 10
export const ENEMY_RUNNER_SPEED_MULTIPLIER = 1.05
// 突進敵: 近づくまでは通常追尾し、範囲内で一定時間だけ直線加速する
export const ENEMY_CHARGE_TRIGGER_DISTANCE = PLAYER_ATTACK_RANGE
export const ENEMY_CHARGE_SPEED_MULTIPLIER = 2.4
export const ENEMY_CHARGE_DURATION_MS = 650
export const ENEMY_CHARGE_COOLDOWN_MS = 900
// -1=真正面から飛来、1=背後から飛来
export const ENEMY_SHIELD_FRONT_DOT_THRESHOLD = -0.35
// 射撃敵はレンジ外へ逃げ続けても追いつけるよう、近接敵よりかなり遅くする
export const ENEMY_RANGED_SPEED_FACTOR = 0.55
// 射撃型はプレイヤー攻撃レンジの外側に立つ（レンジ強化後も追従して外へ出る）
// 好み距離 = attackRange + MARGIN 〜 その + HOLD_BAND
export const ENEMY_RANGED_OUTSIDE_RANGE_MARGIN = 24 * WORLD_ENTITY_SCALE
export const ENEMY_RANGED_HOLD_BAND = 56 * WORLD_ENTITY_SCALE
export const ENEMY_RANGED_ATTACK_INTERVAL_MS = 1400
// Stage 3 から射撃型を混ぜる
export const ENEMY_RANGED_FIRST_STAGE = 3
// 出現割合: Stage 3–4 / 5–7 / 8–10
export const ENEMY_RANGED_SPAWN_CHANCE_STAGE_3_4 = 0.25
export const ENEMY_RANGED_SPAWN_CHANCE_STAGE_5_7 = 0.45
export const ENEMY_RANGED_SPAWN_CHANCE_STAGE_8_10 = 0.6
// Plains Stage3 の蜂パックは一度にこの体数だけ出す（1グループ）
export const ENEMY_RANGED_PACK_SIZE = 2
// Plains Stage3: 初回バーストは蜂なし。以降の各バーストと FINAL WAVE で1グループずつ
// （量はランダムではなく固定スケジュール）
export const PLAINS_STAGE3_BEE_GROUPS_PER_SPAWN = 1
export const PLAINS_STAGE3_BEE_GROUPS_ON_FINAL_WAVE = 1

// --- 敵弾（objects/EnemyBullet）---
// 見た目は蜂の針（黄色い三角＋黒枠）。当たり判定は円のまま
export const ENEMY_BULLET_WIDTH = 10 * WORLD_ENTITY_SCALE
export const ENEMY_BULLET_HEIGHT = 6 * WORLD_ENTITY_SCALE
export const ENEMY_BULLET_COLOR = 0xfacc15
export const ENEMY_BULLET_OUTLINE_COLOR = 0x000000
// 針の黒枠。1だと床に溶けやすいので少し太めに
export const ENEMY_BULLET_OUTLINE_WIDTH = 2 * WORLD_ENTITY_SCALE
export const ENEMY_BULLET_SPEED = 280
export const ENEMY_BULLET_RADIUS = 4 * WORLD_ENTITY_SCALE
export const ENEMY_BULLET_DAMAGE = 1

// --- 敵の HP バー・スポーン警告・パック編成 ---
// HP バーは Enemy.ts。警告点滅〜パック人数は WaveSystem / startEnemyPackSpawnWithWarning。
export const ENEMY_HP_BAR_WIDTH = 16 * WORLD_ENTITY_SCALE
export const ENEMY_HP_BAR_HEIGHT = 4 * WORLD_ENTITY_SCALE
export const ENEMY_HP_BAR_OFFSET_Y = 3 * WORLD_ENTITY_SCALE
export const ENEMY_HP_BAR_BORDER_COLOR = 0xffffff
export const ENEMY_HP_BAR_EMPTY_COLOR = 0x111827
export const ENEMY_HP_BAR_FILL_COLOR = 0x22c55e
export const ENEMY_HP_BAR_DEPTH = 9
export const ENEMY_SPAWN_AREA_MARGIN = 16
// プレイヤーの真下など至近距離に沸くと回避不能になるため、
// この距離より近い位置には敵を出さない（避けられる最小限の範囲）。
export const ENEMY_SPAWN_MIN_DISTANCE_FROM_PLAYER = 120 * WORLD_ENTITY_SCALE
export const ENEMY_SPAWN_WARNING_SECONDS = 1.0
export const ENEMY_SPAWN_WARNING_BLINK_INTERVAL_MS = 120
export const ENEMY_SPAWN_WARNING_COLOR = 0xfca5a5
// 近い位置にまとめて出す（貫通のありがたさ用）
// Stage 1–2 は 3 体固定。Stage 3 以降は大きめの群れ
export const ENEMY_PACK_SIZE_STAGE_1_2 = 3
export const ENEMY_PACK_SIZE_STAGE_3_4_MIN = 5
export const ENEMY_PACK_SIZE_STAGE_3_4_MAX = 6
export const ENEMY_PACK_SIZE_STAGE_5_7_MIN = 6
export const ENEMY_PACK_SIZE_STAGE_5_7_MAX = 7
export const ENEMY_PACK_SIZE_STAGE_8_10_MIN = 7
export const ENEMY_PACK_SIZE_STAGE_8_10_MAX = 8
export const ENEMY_PACK_LARGE_FIRST_STAGE = 3
export const ENEMY_PACK_SPACING = 28 * WORLD_ENTITY_SCALE
// 同じバースト内でパックが複数あるときの隙間（秒）
export const ENEMY_PACK_GAP_SECONDS = 0.25
export const ENEMY_BASE_HP = 2
export const ENEMY_BASE_SPEED = 130
// 想定火力が上がっても HP は抑えめ（群れを貫通でなぎ倒しやすくする）
export const ENEMY_HP_POWER_SCALE = 0.45
// 難易度は「想定プレイヤー成長」に合わせる
// 想定: 1ステージあたり約 1.25 回レベルアップし、
// 弾の強さ / 連射 / 射程を混ぜると火力がレベル1回あたり約 +35%
export const EXPECTED_LEVEL_UPS_PER_STAGE = 1.25
export const EXPECTED_POWER_GROWTH_PER_LEVEL_UP = 0.35
// 移動速度はプレイヤーよりゆっくり伸ばす
export const ENEMY_SPEED_GROWTH_PER_STAGE = 0.07

// --- プレイヤー被ダメ演出 ---
export const PLAYER_INVINCIBLE_BLINK_INTERVAL_MS = 100

// --- 射程・コイン吸引範囲の円表示（デバッグ／補助表示）---
export const RANGE_CIRCLE_COLOR = 0xffffff
export const RANGE_CIRCLE_ALPHA = 0.2
export const RANGE_CIRCLE_LINE_WIDTH = 1
// コイン吸引範囲（金色で区別）
export const COIN_MAGNET_CIRCLE_COLOR = 0xfbbf24
export const COIN_MAGNET_CIRCLE_ALPHA = 0.22
export const COIN_MAGNET_CIRCLE_LINE_WIDTH = 1

// --- 通常の当たり判定アウトライン表示 ---
export const HITBOX_DISPLAY_PLAYER_COLOR = 0x4fc3f7
export const HITBOX_DISPLAY_ENEMY_COLOR = 0xf87171
export const HITBOX_DISPLAY_ALPHA = 0.55
export const HITBOX_DISPLAY_LINE_WIDTH = 1
export const HITBOX_DISPLAY_DEPTH = 11

// --- 開発用：当たり判定を最前面に（確認後は false に戻す）---
// applyDevEntityDepth / ヒットボックス描画が参照。DEV_INVERT_LAYER_ORDER=true でキャラを背面へ。
// テスト用の当たり判定表示はオフ（必要なら true に戻す）
export const DEV_INVERT_LAYER_ORDER = false
export const DEV_HITBOX_DISPLAY_DEPTH = 350
export const DEV_HITBOX_PLAYER_COLOR = 0xffffff
export const DEV_HITBOX_ENEMY_COLOR = 0xff66ff
export const DEV_HITBOX_FILL_ALPHA = 0.25
export const DEV_HITBOX_STROKE_ALPHA = 1
export const DEV_HITBOX_LINE_WIDTH = 2
export const DEV_ENTITY_DEPTH = 1

// --- ウェーブ（後方互換・レガシー用）---
export const WAVE_SPAWN_INTERVAL_SECONDS = 2

// --- 同時出現のソフト上限（出しすぎ防止の安全弁。厳しく絞らない）---
// 重さ対策はオブジェクトプールと HP バー軽量化で行い、ここは非常時の天井だけ。
export const MAX_ENEMIES = 64
export const MAX_ENEMIES_PER_STAGE_BONUS = 6
export const MAX_ENEMIES_HARD_CAP = 160
// 同時出現上限で空きがないとき、この待ちのあと再試行（捨てない）
export const ENEMY_SPAWN_RETRY_DELAY_MS = 750
// 弾・コインもプール再利用前提で余裕を持たせる
export const MAX_PLAYER_BULLETS = 40
export const MAX_ENEMY_BULLETS = 48
export const MAX_COINS = 160

// --- レベルアップ成長・貫通／爆破スキル ---
// LevelUpSystem / 攻撃計算。PIERCE / BLAST は実績解放とも連動。
export const DAMAGE_BONUS_PER_LEVEL_UP = 1
export const RANGE_MULTIPLIER = 1.25
// 発射速度レベル（1,2,3...）。間隔 = 基本間隔 / 速度レベル
export const FIRE_RATE_LEVEL_START = 1
export const RANGE_LEVEL_START = 1
export const MOVE_LEVEL_START = 1
export const MOVE_SPEED_BONUS_PER_LEVEL = 24
export const MAGNET_LEVEL_START = 1
export const COIN_MAGNET_RADIUS_BONUS_PER_LEVEL = 28 * WORLD_ENTITY_SCALE
export const HP_BONUS_PER_LEVEL_UP = 1
// 貫通レベル（0=1体で消滅、1=2体目で消滅、2=3体目で消滅…）
export const PIERCE_LEVEL_START = 0
// 跳弾レベル（0=なし、1=1回、2=2回…）
export const RICOCHET_LEVEL_START = 0
// XP Bonus:
// 1枚の価値は常に1 XP。Lv1=50%で2枚、Lv2=常に2枚、
// Lv3=50%で3枚（それ以外2枚）、Lv4=常に3枚。
export const XP_BONUS_LEVEL_START = 0
export const XP_BONUS_HIGHER_MULTIPLIER_CHANCE = 0.5
export const RICOCHET_SEARCH_RADIUS = 260 * WORLD_ENTITY_SCALE
// ヒット爆破（0=なし。初回は周囲1ダメージ・狭い円。以降ダメージ+1、半径も拡大）
export const BLAST_LEVEL_START = 0
// ショップ未購入時のラン中レベル上限。Power/Speed/Range はショップで拡張できる。
export const INITIAL_PRIMARY_SKILL_LEVEL_CAP = 3
// Pierce / Blast は解放直後の上限を1とし、ショップ購入で上限を増やす
export const INITIAL_PIERCE_BLAST_SKILL_LEVEL_CAP = 1
// XP Bonus は解放直後はLv2まで。ショップ購入で上限を増やす
export const INITIAL_XP_BONUS_SKILL_LEVEL_CAP = 2
// 現時点でショップ販売しないその他の解放スキルの固定上限
export const DEFAULT_UNLOCKED_SKILL_LEVEL_CAP = 5

/** 敵1体から落とす1 XPコインの枚数。奇数レベルだけ50%抽選する。 */
export function calculateXpCoinDropCount(
  xpBonusLevel: number,
  randomValue: number = Math.random(),
): number {
  const safeLevel = Math.max(0, Math.floor(xpBonusLevel))
  const guaranteedMultiplier = Math.floor(safeLevel / 2) + 1
  const isOddLevel = safeLevel % 2 === 1
  if (isOddLevel && randomValue < XP_BONUS_HIGHER_MULTIPLIER_CHANCE) {
    return guaranteedMultiplier + 1
  }
  return guaranteedMultiplier
}

/** オールエネミークリアの+5 XP倍率。Lv2ごとに確実に1段階上がる。 */
export function calculateClearXpBonusMultiplier(xpBonusLevel: number): number {
  const safeLevel = Math.max(0, Math.floor(xpBonusLevel))
  return Math.floor(safeLevel / 2) + 1
}

/**
 * 全敵撃破の時間ボーナス XP。
 * 基本ボーナス × 残り時間（秒・表示と同じ切り上げ）。
 */
export function calculateAllEnemiesClearTimeBonusXp(
  baseBonusXp: number,
  remainingSeconds: number,
): number {
  const safeBase = Math.max(0, Math.floor(baseBonusXp))
  const wholeSeconds = Math.max(0, Math.ceil(remainingSeconds))
  return safeBase * wholeSeconds
}
export const BLAST_DAMAGE_START = 1
export const BLAST_RADIUS_BASE = 28 * WORLD_ENTITY_SCALE
export const BLAST_RADIUS_GROWTH_PER_LEVEL = 12 * WORLD_ENTITY_SCALE
export const BLAST_RING_COLOR = 0xfbbf24
export const BLAST_RING_STROKE_COLOR = 0xfde68a
export const BLAST_RING_DURATION_MS = 220
export const BLAST_RING_START_RADIUS = 8 * WORLD_ENTITY_SCALE
export const BLAST_RING_DEPTH = 18

// レベルアップ UI に出す候補数（プールからランダムで選ぶ）
export const LEVEL_UP_CHOICES_SHOWN = 3
// 次レベルに必要な XP: 4, 7, 11, 16, 22...
// 必要量の増加幅を 3, 4, 5, 6... と1ずつ増やす
export const XP_FIRST_LEVEL_UP_COST = 4
export const XP_FIRST_COST_INCREASE = 3
// 1回のレベルアップに必要なXPは、最終的に50で固定する
export const XP_MAX_LEVEL_UP_COST = 50

/**
 * 貫通レベルから「1発が当たれる敵の数」を求める。
 * pierceLevel 0 → 1 / 1 → 2 / 2 → 3。PlayerBullet の hitsLeft 初期値に使う。
 */
export function calculateBulletMaxHits(pierceLevel: number): number {
  const safeLevel = Math.max(PIERCE_LEVEL_START, pierceLevel)
  return safeLevel + 1
}

/**
 * 貫通命中の実ダメージ。1体目はそのまま、2体目以降は半分（端数切り上げ）。
 * enemiesHitBefore = これまでに当たった敵の数（今回の敵は含めない）。
 */
export function calculatePierceHitDamage(
  originalDamage: number,
  enemiesHitBefore: number,
): number {
  const safeOriginalDamage = Math.max(0, Math.round(originalDamage))
  if (enemiesHitBefore <= 0) {
    return safeOriginalDamage
  }
  return Math.ceil(safeOriginalDamage / 2)
}

/** Move レベルから実際の移動速度を求める。速度の保存先は currentMoveSpeed だけ。 */
export function calculateMoveSpeed(moveLevel: number): number {
  const safeLevel = Math.max(MOVE_LEVEL_START, moveLevel)
  return PLAYER_SPEED + (safeLevel - MOVE_LEVEL_START) * MOVE_SPEED_BONUS_PER_LEVEL
}

/** Magnet レベルからコイン吸引半径を求める。 */
export function calculateCoinMagnetRadius(magnetLevel: number): number {
  const safeLevel = Math.max(MAGNET_LEVEL_START, magnetLevel)
  return (
    COIN_MAGNET_RADIUS +
    (safeLevel - MAGNET_LEVEL_START) * COIN_MAGNET_RADIUS_BONUS_PER_LEVEL
  )
}

/** Ruins の各ステージで目安にする最大 HP。HP候補を出し続ける判定に使う。 */
export function getRecommendedMaxHpForRuins(stageNumber: number): number {
  const safeStage = Math.max(1, stageNumber)
  return PLAYER_HP + safeStage
}

/**
 * 爆破レベルから円の半径を求める（未取得は 0）。
 * ヒット時の範囲ダメージ判定で使用。
 */
export function calculateBlastRadius(blastLevel: number): number {
  if (blastLevel <= BLAST_LEVEL_START) {
    return 0
  }
  return BLAST_RADIUS_BASE + (blastLevel - 1) * BLAST_RADIUS_GROWTH_PER_LEVEL
}

/**
 * 爆破ダメージ: 1,2,3… と増え、弾の本来ダメージが上限。
 * blastLevel 未取得なら 0。
 */
export function calculateBlastDamage(blastLevel: number, bulletDamage: number): number {
  if (blastLevel <= BLAST_LEVEL_START) {
    return 0
  }
  const scaledDamage = BLAST_DAMAGE_START + (blastLevel - 1)
  if (scaledDamage > bulletDamage) {
    return bulletDamage
  }
  return scaledDamage
}

/**
 * ステージごとのパック人数レンジ（Stage3+ は大きめ）。
 * WaveSystem が何体まとめて警告スポーンするかを決める。
 * totalStages = そのエリアの最終ステージ番号。
 */
export function getEnemyPackSizeRange(
  stageNumber: number,
  totalStages: number,
): { min: number; max: number } {
  const safeStage = Math.max(1, stageNumber)
  if (isPlainsFinalStage(safeStage, totalStages)) {
    return {
      min: PLAINS_FINAL_STAGE_PACK_SIZE_MIN,
      max: PLAINS_FINAL_STAGE_PACK_SIZE_MAX,
    }
  }
  // エリア最終ステージは最大サイズの群れ
  if (isFinalStage(safeStage, totalStages)) {
    return { min: FINAL_STAGE_PACK_SIZE_MIN, max: FINAL_STAGE_PACK_SIZE_MAX }
  }
  if (safeStage < ENEMY_PACK_LARGE_FIRST_STAGE) {
    return { min: ENEMY_PACK_SIZE_STAGE_1_2, max: ENEMY_PACK_SIZE_STAGE_1_2 }
  }
  if (safeStage <= 4) {
    return { min: ENEMY_PACK_SIZE_STAGE_3_4_MIN, max: ENEMY_PACK_SIZE_STAGE_3_4_MAX }
  }
  if (safeStage <= 7) {
    return { min: ENEMY_PACK_SIZE_STAGE_5_7_MIN, max: ENEMY_PACK_SIZE_STAGE_5_7_MAX }
  }
  return { min: ENEMY_PACK_SIZE_STAGE_8_10_MIN, max: ENEMY_PACK_SIZE_STAGE_8_10_MAX }
}

/**
 * 速度レベルから攻撃間隔(ms)を求める。
 * Python: PLAYER_ATTACK_INTERVAL_MS / fire_rate_level に相当
 */
export function calculateAttackIntervalMs(fireRateLevel: number): number {
  const safeLevel = Math.max(FIRE_RATE_LEVEL_START, fireRateLevel)
  return PLAYER_ATTACK_INTERVAL_MS / safeLevel
}

/**
 * 射程レベルから射程を求める（1→基本、2→×1.25、3→×1.25^2...）。
 * PlayerAttackSystem の索敵距離に使う。
 */
export function calculateAttackRange(rangeLevel: number): number {
  const safeLevel = Math.max(RANGE_LEVEL_START, rangeLevel)
  let range = PLAYER_ATTACK_RANGE
  for (let level = RANGE_LEVEL_START; level < safeLevel; level++) {
    range = range * RANGE_MULTIPLIER
  }
  return range
}

// --- レベルアップ 3択 UI の見た目 ---
export const LEVEL_UP_OVERLAY_COLOR = 0x000000
export const LEVEL_UP_OVERLAY_ALPHA = 0.32
export const LEVEL_UP_PANEL_WIDTH = 220
export const LEVEL_UP_PANEL_HEIGHT = 90
export const LEVEL_UP_PANEL_GAP = 16
export const LEVEL_UP_PANEL_COLOR = 0x1e293b
export const LEVEL_UP_PANEL_HOVER_COLOR = 0x475569
export const LEVEL_UP_PANEL_BORDER_COLOR = 0xfde68a
export const LEVEL_UP_PANEL_HOVER_SCALE = 1.08
export const LEVEL_UP_PANEL_HOVER_LIFT_Y = -10
export const LEVEL_UP_PANEL_HOVER_TWEEN_MS = 120
export const LEVEL_UP_TITLE_COLOR = '#fde68a'
export const LEVEL_UP_CHOICE_TITLE_COLOR = '#ffffff'
export const LEVEL_UP_CHOICE_DESC_COLOR = '#cbd5e1'
export const LEVEL_UP_UI_DEPTH = 400

// --- ステージ結果（クリア／失敗／ゲームクリア）パネル ---
export const STAGE_RESULT_OVERLAY_COLOR = 0x000000
export const STAGE_RESULT_OVERLAY_ALPHA = 0.45
export const STAGE_RESULT_PANEL_WIDTH = 320
// 2行のサブタイトル（例: DEFEATED 時）とボタンが重ならない高さ
export const STAGE_RESULT_PANEL_HEIGHT = 210
export const STAGE_RESULT_PANEL_COLOR = 0x1e293b
export const STAGE_RESULT_PANEL_BORDER_COLOR = 0xfde68a
export const STAGE_RESULT_TITLE_CLEAR_COLOR = '#86efac'
export const STAGE_RESULT_TITLE_AREA_CLEAR_LABEL = 'AREA CLEAR!'
export const STAGE_RESULT_SUBTITLE_AREA_CLEAR = 'Area cleared!'
export const STAGE_RESULT_TITLE_GAME_CLEAR_COLOR = '#fde68a'
export const STAGE_RESULT_TITLE_DEFEAT_COLOR = '#fca5a5'
export const STAGE_RESULT_SUBTITLE_COLOR = '#e2e8f0'
export const STAGE_RESULT_BUTTON_COLOR = 0x334155
export const STAGE_RESULT_BUTTON_HOVER_COLOR = 0x475569
export const STAGE_RESULT_BUTTON_TEXT_COLOR = '#ffffff'
export const STAGE_RESULT_UI_DEPTH = 420

// --- 実績・スキル解放（localStorage）---
// ノーダメージ／エリアクリアなどで貫通・爆破などを解放。Unlock / Achievement 系が参照。
export const UNLOCK_SAVE_STORAGE_KEY = 'survivor-stage-unlocks'
export const ACHIEVEMENT_ID_UNTOUCHED = 'untouched'
export const ACHIEVEMENT_ID_PURE_POWER = 'pure_power'
export const ACHIEVEMENT_ID_PLAINS_CLEAR = 'plains_clear'
export const ACHIEVEMENT_ID_FOREST_CLEAR = 'forest_clear'
export const ACHIEVEMENT_ID_FOREST_UNTOUCHED = 'forest_untouched'
export const ACHIEVEMENT_ID_VOLCANO_UNTOUCHED = 'volcano_untouched'
// 実績画面のスキル名（Unlock は付けない）
export const ACHIEVEMENT_TITLE_UNTOUCHED = 'Pierce'
export const ACHIEVEMENT_TITLE_PURE_POWER = 'Blast'
export const ACHIEVEMENT_TITLE_FOREST_CLEAR = 'Volcano'
export const ACHIEVEMENT_TITLE_MOVE = 'Move'
export const ACHIEVEMENT_TITLE_MAGNET = 'Pickup'
export const ACHIEVEMENT_TITLE_RICOCHET = 'Ricochet'
export const ACHIEVEMENT_TITLE_XP_BONUS = 'XP Bonus'
export const ACHIEVEMENT_CONDITION_UNTOUCHED = 'Clear Plains with no damage'
export const ACHIEVEMENT_CONDITION_PURE_POWER =
  'Clear Plains without upgrading Power'
export const ACHIEVEMENT_CONDITION_PLAINS_CLEAR = 'Clear Plains'
export const ACHIEVEMENT_CONDITION_FOREST_CLEAR = 'Clear Forest'
export const ACHIEVEMENT_CONDITION_FOREST_UNTOUCHED = 'Clear Forest with no damage'
export const ACHIEVEMENT_CONDITION_VOLCANO_UNTOUCHED = 'Clear Volcano with no damage'
export const UNLOCK_SKILL_LABEL_POWER = 'Power'
export const UNLOCK_SKILL_LABEL_SPEED = 'Speed'
export const UNLOCK_SKILL_LABEL_RANGE = 'Range'
export const UNLOCK_SKILL_LABEL_PIERCE = 'Pierce'
export const UNLOCK_SKILL_LABEL_BLAST = 'Blast'
export const UNLOCK_SKILL_LABEL_RICOCHET = 'Ricochet'
export const UNLOCK_SKILL_LABEL_MOVE = 'Move'
// Vampire Survivors ではステータス名 Magnet / アイテム Attractorb。
// 説明文は "Pickup range" なので、表示名は分かりやすい Pickup にする
export const UNLOCK_SKILL_LABEL_MAGNET = 'Pickup'
export const UNLOCK_SKILL_LABEL_HP = 'HP'
export const UNLOCK_SKILL_LABEL_FOREST_REWARDS =
  'Move / Pickup / Pierce'
export const UNLOCK_SKILL_LABEL_XP_BONUS = 'XP Bonus'
// スキルアイコン・実績画面用の短い効果説明（+1 や level-up は書かない）
export const UNLOCK_SKILL_DESC_POWER = 'Increases bullet damage'
export const UNLOCK_SKILL_DESC_SPEED = 'Increases fire speed'
export const UNLOCK_SKILL_DESC_RANGE = 'Increases fire range'
export const UNLOCK_SKILL_DESC_MOVE = 'Increases move speed'
export const UNLOCK_SKILL_DESC_MAGNET = 'Increases coin pickup range'
export const UNLOCK_SKILL_DESC_HP = 'Increases max HP'
export const UNLOCK_SKILL_DESC_XP_BONUS = 'Increases XP from coins'
export const UNLOCK_SKILL_DESC_PIERCE = 'Bullets pierce through enemies'
export const UNLOCK_SKILL_DESC_BLAST = 'Damages nearby enemies on hit'
export const UNLOCK_SKILL_DESC_RICOCHET = 'Bullets bounce to nearby enemies'
export const UNLOCK_CONDITION_TBD = 'Unlock condition: TBD'
export const UNLOCK_STATUS_TOOLTIP_DEPTH = 450
export const UNLOCK_STATUS_TOOLTIP_MAX_WIDTH = 200
export const UNLOCK_STATUS_TOOLTIP_OFFSET_X = 10
export const UNLOCK_STATUS_TOOLTIP_TITLE_COLOR = '#ffffff'
export const UNLOCK_STATUS_TOOLTIP_DESC_COLOR = '#cbd5e1'
export const UNLOCK_STATUS_TOOLTIP_LOCK_COLOR = '#fca5a5'
export const UNLOCK_STATUS_HEADER_TEXT = 'SKILLS'
export const UNLOCK_STATUS_GAP_FROM_STATS = 10
export const UNLOCK_STATUS_HEADER_COLOR = '#a1a1aa'
export const UNLOCK_STATUS_LOCKED_COLOR = '#6b7280'
export const UNLOCK_STATUS_LOCKED_ALPHA = 0.45
export const UNLOCK_STATUS_UNLOCKED_COLOR = '#86efac'
export const UNLOCK_STATUS_UNLOCKED_ALPHA = 0.9
export const UNLOCK_STATUS_TOOLTIP_COLOR = '#fde68a'
export const UNLOCK_STATUS_TOOLTIP_BG_COLOR = 0x111827
export const UNLOCK_STATUS_TOOLTIP_BG_ALPHA = 0.92
export const UNLOCK_STATUS_TOOLTIP_PADDING = 6
export const UNLOCK_STATUS_RIGHT_MARGIN = 8
// 右カラムのスキル解放アイコン（小さな正方形）
export const UNLOCK_ICON_SIZE = 20
export const UNLOCK_ICON_GAP = 8
export const UNLOCK_ICON_BORDER_SIZE = 2
// 最初から使える基本スキル（Power / Speed / Range）
export const UNLOCK_ICON_POWER_COLOR = 0xef4444
export const UNLOCK_ICON_SPEED_COLOR = 0xf97316
export const UNLOCK_ICON_RANGE_COLOR = 0x3b82f6
export const UNLOCK_ICON_PIERCE_COLOR = 0x38bdf8
export const UNLOCK_ICON_BLAST_COLOR = 0xfbbf24
export const UNLOCK_ICON_RICOCHET_COLOR = 0xc084fc
export const UNLOCK_ICON_MOVE_COLOR = 0x4ade80
export const UNLOCK_ICON_MAGNET_COLOR = 0x2dd4bf
export const UNLOCK_ICON_HP_COLOR = 0xfb7185
export const UNLOCK_ICON_XP_BONUS_COLOR = 0xfacc15
export const UNLOCK_ICON_LOCKED_FILL_COLOR = 0x374151
export const UNLOCK_ICON_LOCKED_BORDER_COLOR = 0x6b7280
export const UNLOCK_ICON_LETTER_COLOR = '#0f172a'
export const UNLOCK_ICON_LOCKED_LETTER_COLOR = '#9ca3af'
// アイコンはアルファベットではなく1色で描ける記号を使う
// （テキスト描画なので setColor でロック／解放の色に切り替えられる）
export const UNLOCK_ICON_POWER_LETTER = '⚔' // Power = 攻撃
export const UNLOCK_ICON_SPEED_LETTER = '⚡' // Speed = 連射の速さ
export const UNLOCK_ICON_RANGE_LETTER = '◎' // Range = 射程円
export const UNLOCK_ICON_PIERCE_LETTER = '➤' // 貫通 = 突き抜ける矢
export const UNLOCK_ICON_BLAST_LETTER = '✸' // 爆破 = 破裂する星
export const UNLOCK_ICON_RICOCHET_LETTER = '↯' // 跳弾 = 折れ曲がる軌道
export const UNLOCK_ICON_MOVE_LETTER = '»' // 移動速度 = 前へ進む二重矢印
export const UNLOCK_ICON_MAGNET_LETTER = '¤' // コイン回収 = 通貨記号
export const UNLOCK_ICON_HP_LETTER = '♥' // HP = ハート
export const UNLOCK_ICON_XP_BONUS_LETTER = '✦' // XPボーナス = キラキラ
// シール中: スキル固有色の上に薄い氷を張る（全スキル同じ青にはしない）
// 幕は白に近い半透明。下のスキル色が透けて見える
export const UNLOCK_ICON_SEAL_FROST_COLOR = 0xf8fafc
export const UNLOCK_ICON_SEAL_FROST_ALPHA = 0.28
export const UNLOCK_ICON_SEAL_FROST_BORDER_ALPHA = 0.45
// スキル色を氷白へ寄せる割合（0=そのまま、1=真っ白）
export const UNLOCK_ICON_SEAL_FROST_COLOR_MIX = 0.38
export const UNLOCK_ICON_SEAL_ICE_WHITE = 0xf0f9ff
export const UNLOCK_ICON_SEAL_GLINT_COLOR = 0xffffff
export const UNLOCK_ICON_SEAL_GLINT_SIZE = 3
// きらめきを試す間隔（実際に光るのはそのうちの一部）
export const UNLOCK_ICON_SEAL_GLINT_CHECK_MS = 700
export const UNLOCK_ICON_SEAL_GLINT_CHANCE = 0.35
export const UNLOCK_ICON_SEAL_GLINT_FLASH_MS = 220
// ツールチップのシール文言色（凍り寄りの水色）
export const UNLOCK_ICON_SEAL_TOOLTIP_COLOR = '#7dd3fc'
export const STAGE_RESULT_UNLOCK_TEXT_COLOR = '#fde68a'
// 解放文言ありのときの最小高さ。行が増えたら StageResultSystem がさらに伸ばす
export const STAGE_RESULT_PANEL_HEIGHT_WITH_UNLOCK = 280
export const STAGE_RESULT_UNLOCK_LINE_HEIGHT = 18
export const STAGE_RESULT_UNLOCK_PANEL_CHROME_HEIGHT = 174
export const STAGE_RESULT_PANEL_MAX_HEIGHT = GAME_HEIGHT - 40

// --- 撃破・被弾フラッシュ演出 ---
// 撃破は playEnemyDefeatFadeOut（Enemy.ts）の tween フェードのみ使う
export const ENEMY_DEFEAT_FADE_DURATION_MS = 140
export const ENEMY_DEFEAT_SCALE_TO = 1.35
export const PLAYER_HURT_FLASH_DURATION_MS = 120
export const PLAYER_HURT_FLASH_COLOR = 0xff4444
export const PLAYER_HURT_FLASH_ALPHA = 0.35

// --- 盾・装甲で通常弾を防いだときのアイコン演出 ---
export const ENEMY_BLOCKED_ICON_KEY = 'enemy-blocked-shield'
export const ENEMY_BLOCKED_ICON_PATH = 'assets/sprites/enemy_blocked_shield.png'
export const ENEMY_BLOCKED_ICON_SIZE = 26 * WORLD_ENTITY_SCALE
export const ENEMY_BLOCKED_ICON_POP_MS = 80
export const ENEMY_BLOCKED_ICON_FADE_MS = 180
export const ENEMY_BLOCKED_ICON_FLOAT_UP = 10 * WORLD_ENTITY_SCALE
export const ENEMY_BLOCKED_ICON_DEPTH = 65

// --- ダメージ数字（ヒット時のポップアップ）---
export const DAMAGE_NUMBER_FONT_SIZE = `${13 * WORLD_ENTITY_SCALE}px`
export const DAMAGE_NUMBER_COLOR = '#ffffff'
export const DAMAGE_NUMBER_STROKE_COLOR = '#000000'
export const DAMAGE_NUMBER_STROKE_THICKNESS = 3 * WORLD_ENTITY_SCALE
export const DAMAGE_NUMBER_DURATION_MS = 650
export const DAMAGE_NUMBER_PEAK_HEIGHT = 28 * WORLD_ENTITY_SCALE
export const DAMAGE_NUMBER_SIDE_SPREAD = 18 * WORLD_ENTITY_SCALE
export const DAMAGE_NUMBER_FALL_EXTRA = 12 * WORLD_ENTITY_SCALE
export const DAMAGE_NUMBER_DEPTH = 60

// --- レベルアップ時の HP FULL! 表示 ---
export const HP_FULL_TEXT = 'HP FULL!'
export const HP_FULL_FONT_SIZE = '16px'
export const HP_FULL_COLOR = '#22c55e'
export const HP_FULL_STROKE_COLOR = '#000000'
export const HP_FULL_STROKE_THICKNESS = 4
export const HP_FULL_DURATION_MS = 700
export const HP_FULL_FLOAT_UP = 36
export const HP_FULL_DEPTH = 220

// --- 能力上限時の自動ゴールドレベルアップ表示（プレイは止めない）---
export const AUTO_GOLD_LEVEL_UP_TEXT = 'LEVEL UP'
export const AUTO_GOLD_LEVEL_UP_FONT_SIZE = '20px'
export const AUTO_GOLD_LEVEL_UP_COLOR = '#fde68a'
export const AUTO_GOLD_LEVEL_UP_STROKE_COLOR = '#000000'
export const AUTO_GOLD_LEVEL_UP_STROKE_THICKNESS = 5
export const AUTO_GOLD_LEVEL_UP_DURATION_MS = 900
export const AUTO_GOLD_LEVEL_UP_FLOAT_UP = 42
export const AUTO_GOLD_LEVEL_UP_DEPTH = 230
export const AUTO_GOLD_LEVEL_UP_CHAIN_DELAY_MS = 280

// --- ステージ床の色（Rectangle のみ・背景画像なし）---
// 床の上に重ねる黒の濃さ（0 = 変化なし、1 = 真っ黒）。フィールドを暗めに見せる
export const FLOOR_DARKEN_ALPHA = 0.3

// --- Volcano 床（Plains タイルを使い、明るい赤 → 徐々に黒へ）---
// タイル自体は Plains Stage1 と同じ明るいマスを使い、色はオーバーレイで変える
export const VOLCANO_FLOOR_TILE_BLOCK_INDEX = 0
// 床全体に重ねる赤い色（明るい溶岩っぽさ）
export const VOLCANO_FLOOR_RED_OVERLAY_COLOR = 0xff3b2f
// ステージごとの赤オーバーレイの濃さ（最初が一番赤く、後半は弱める）
export const VOLCANO_FLOOR_RED_OVERLAY_ALPHAS: number[] = [0.48, 0.38, 0.28, 0.18, 0.1]
// ステージごとの黒オーバーレイの濃さ（後半ほど真っ暗）
export const VOLCANO_FLOOR_DARKEN_ALPHAS: number[] = [0.08, 0.28, 0.45, 0.62, 0.78]

/** Volcano 床の赤オーバーレイ濃さ（stage 1〜）。 */
export function getVolcanoFloorRedOverlayAlpha(stageNumber: number): number {
  const index = Math.max(0, Math.floor(stageNumber) - 1)
  if (index >= VOLCANO_FLOOR_RED_OVERLAY_ALPHAS.length) {
    return VOLCANO_FLOOR_RED_OVERLAY_ALPHAS[VOLCANO_FLOOR_RED_OVERLAY_ALPHAS.length - 1]
  }
  return VOLCANO_FLOOR_RED_OVERLAY_ALPHAS[index]
}

/** Volcano 床の黒オーバーレイ濃さ（stage 1〜）。 */
export function getVolcanoFloorDarkenAlpha(stageNumber: number): number {
  const index = Math.max(0, Math.floor(stageNumber) - 1)
  if (index >= VOLCANO_FLOOR_DARKEN_ALPHAS.length) {
    return VOLCANO_FLOOR_DARKEN_ALPHAS[VOLCANO_FLOOR_DARKEN_ALPHAS.length - 1]
  }
  return VOLCANO_FLOOR_DARKEN_ALPHAS[index]
}

// インデックス = stageNumber - 1。GameScene が床色を切り替える。
export const STAGE_FLOOR_COLORS: number[] = [
  0x1a2e1a, // Stage 1
  0x1a1a2e, // Stage 2
  0x2e1a1a, // Stage 3
  0x2e2e1a, // Stage 4
  0x3a1218, // Stage 5（最終・少し暗い赤）
]

// エリア最終ステージだけ難易度を一段上げる倍率・加算
export const FINAL_STAGE_ENEMY_COUNT_BONUS = 6
export const FINAL_STAGE_HP_MULTIPLIER = 1.75
export const FINAL_STAGE_SPEED_MULTIPLIER = 1.25
export const FINAL_STAGE_RANGED_SPAWN_CHANCE = 0.85
export const FINAL_STAGE_PACK_SIZE_MIN = 8
export const FINAL_STAGE_PACK_SIZE_MAX = 9
export const FINAL_STAGE_MAX_ENEMIES_BONUS = 8
export const FINAL_WAVE_EXTRA_PACK_GAP_SECONDS_FINAL_STAGE = 1.1

// Plains Stage 2 は少し硬い泥スライム（toughMelee）専用データを使う。
// 旧名の別名（他ファイル参照があれば壊さない）
export const PLAINS_STAGE_2_MIN_ENEMY_HP = ENEMY_TOUGH_MELEE_MIN_HP
export const PLAINS_STAGE_2_MAX_ENEMY_HP = ENEMY_TOUGH_MELEE_MAX_HP
// Plains Stage 3 は最初に到達する最終面なので、通常の最終面補正を弱める
export const PLAINS_FINAL_STAGE_ENEMY_COUNT_BONUS = 2
export const PLAINS_FINAL_STAGE_HP_MULTIPLIER = 1.25
// 射撃敵は距離を取るぶん倒しにくいため、Plains最終面だけHPを少し下げる（4→3程度）。
export const PLAINS_FINAL_STAGE_RANGED_HP_MULTIPLIER = 0.75
export const PLAINS_FINAL_STAGE_SPEED_MULTIPLIER = 1.08
export const PLAINS_FINAL_STAGE_RANGED_SPAWN_CHANCE = 0.45
export const PLAINS_FINAL_STAGE_PACK_SIZE_MIN = 5
export const PLAINS_FINAL_STAGE_PACK_SIZE_MAX = 6
export const PLAINS_FINAL_STAGE_MAX_ENEMIES_BONUS = 2

export function isPlainsFinalStage(stageNumber: number, totalStages: number): boolean {
  return totalStages === 3 && stageNumber >= 3
}

// --- Plains の床タイル（縦に5色並んだタイルシート。上から順に使う）---
// 各色ブロックは高さ48px。左側は角丸の飾りタイル（角が透明）なので床には使わない。
// 床には右側のベタ塗りタイル（x=48〜80）を使う。ただし最外周1pxに透明な角が
// あるため、完全に不透明な内側 28×28（x=50, y=+2 から）だけを切り出して敷き詰める。
export const PLAINS_FLOOR_TILESET_KEY = 'plains-floor-tiles'
export const PLAINS_FLOOR_TILESET_PATH = 'assets/sprites/plains_floor_tiles.png'
export const PLAINS_FLOOR_BLOCK_HEIGHT = 48
export const PLAINS_FLOOR_BLOCK_COUNT = 5
export const PLAINS_FLOOR_SOURCE_CROP_X = 50
export const PLAINS_FLOOR_SOURCE_CROP_Y_OFFSET = 2
export const PLAINS_FLOOR_SOURCE_CROP_SIZE = 28
// 28px の切り出しを2倍に拡大して敷く（キャラのドット感と揃える）
export const PLAINS_FLOOR_TILE_DISPLAY_SIZE = 56

// --- 床の装飾タイル（16px タイルが 16×5 で並ぶシート）---
// Forest では床の上に枝・小枝・草・葉を散らして森っぽくする
export const FLOOR_DETAIL_TILESET_KEY = 'floor-detail-tiles'
export const FLOOR_DETAIL_TILESET_PATH = 'assets/sprites/floor_detail_tiles.png'
export const FLOOR_DETAIL_TILE_SIZE = 16
// 16px タイルを2倍（32px）で描く
export const FLOOR_DETAIL_DISPLAY_SIZE = 32
// 森っぽいタイルの位置（タイル単位の列・行）。上段 = 枝・小枝、3段目 = 草・葉
export const FOREST_DETAIL_TILES: { column: number; row: number }[] = [
  { column: 5, row: 0 },
  { column: 6, row: 0 },
  { column: 7, row: 0 },
  { column: 8, row: 0 },
  { column: 0, row: 2 },
  { column: 1, row: 2 },
  { column: 2, row: 2 },
  { column: 3, row: 2 },
  { column: 4, row: 2 },
  { column: 5, row: 2 },
  { column: 6, row: 2 },
  { column: 7, row: 2 },
]
// 64px 格子ごとに 30% の確率で装飾を1つ置く（置きすぎるとうるさいので控えめ）
export const FOREST_DETAIL_GRID_SIZE = 64
export const FOREST_DETAIL_CHANCE = 0.3

/**
 * ステージ番号に応じた床色。エリア最終はいちばん暗い赤。
 */
export function getStageFloorColor(stageNumber: number, totalStages: number): number {
  if (isFinalStage(stageNumber, totalStages)) {
    return STAGE_FLOOR_COLORS[STAGE_FLOOR_COLORS.length - 1]
  }
  const colorIndex = stageNumber - 1
  if (colorIndex >= 0 && colorIndex < STAGE_FLOOR_COLORS.length) {
    return STAGE_FLOOR_COLORS[colorIndex]
  }
  return STAGE_FLOOR_COLORS[0]
}
// --- ウェーブ／スポーン予定の型と関数 ---
// Python: {1: {...}, 2: {...}} のような辞書に相当する設定型。
// 現行の本線は getSpawnScheduleForStage（WaveSystem）。getWaveConfigForStage はレガシー。
export type WaveConfig = {
  waveCount: number
  enemiesPerWave: number
  waveIntervalSeconds: number
}

/** 1回のスポーンバースト（開始からの遅延秒と敵数） */
export type SpawnBurst = {
  delaySeconds: number
  enemyCount: number
}

/**
 * ステージの制限時間（秒）。全ステージ共通。
 */
export function getStageDurationSeconds(_stageNumber: number): number {
  return STAGE_DURATION_SECONDS
}

/**
 * そのステージで最後にスポーンしてよい経過秒。
 * クリア直前に敵を出さないための上限。
 */
export function getLastSpawnAtSeconds(_stageNumber: number): number {
  return STAGE_LAST_SPAWN_SECONDS
}

/** Forest の最終ステージ（全5種の敵を混ぜるステージ）か。 */
export function isForestFinalStage(
  areaId: StageAreaId,
  stageNumber: number,
  totalStages: number,
): boolean {
  return areaId === 'forest' && isFinalStage(stageNumber, totalStages)
}

/** Volcano の最終ステージ（Stage1〜4 の敵を混ぜるステージ）か。 */
export function isVolcanoFinalStage(
  areaId: StageAreaId,
  stageNumber: number,
  totalStages: number,
): boolean {
  return areaId === 'volcano' && isFinalStage(stageNumber, totalStages)
}

/**
 * 定期スポーン（バースト）の間隔（秒）。
 * Forest 最終は早め。
 */
export function getSpawnBurstIntervalSeconds(
  areaId: StageAreaId,
  stageNumber: number,
  totalStages: number,
): number {
  if (isForestFinalStage(areaId, stageNumber, totalStages)) {
    return FOREST_FINAL_STAGE_SPAWN_BURST_INTERVAL_SECONDS
  }
  return STAGE_SPAWN_BURST_INTERVAL_SECONDS
}

/**
 * 同じバースト内でパックを分ける隙間（秒）。
 */
export function getEnemyPackGapSeconds(
  areaId: StageAreaId,
  stageNumber: number,
  _totalStages: number,
): number {
  if (isVolcanoFinalStage(areaId, stageNumber, _totalStages)) {
    return 0.35
  }
  if (isForestFinalStage(areaId, stageNumber, _totalStages)) {
    return FOREST_FINAL_STAGE_PACK_GAP_SECONDS
  }
  return ENEMY_PACK_GAP_SECONDS
}

/**
 * 想定プレイヤー火力（Stage 1 = 1.0）。
 * レベルアップ成長に合わせて敵 HP を強くする基準。
 * Python: 1 + levels_per_stage * growth * (stage - 1) に相当
 */
export function calculateExpectedPlayerPower(stageNumber: number): number {
  const safeStage = Math.max(1, stageNumber)
  return (
    1 +
    EXPECTED_LEVEL_UPS_PER_STAGE * EXPECTED_POWER_GROWTH_PER_LEVEL_UP * (safeStage - 1)
  )
}

/**
 * 定期バースト1回あたりの敵数（ステージが進むほど増える）。
 * 実際の出現は WaveSystem が 3〜4 体パックに分割する。
 */
export function getRecurringEnemyCountForStage(
  stageNumber: number,
  totalStages: number,
): number {
  const safeStage = Math.max(1, stageNumber)
  let count =
    STAGE_RECURRING_ENEMY_BASE + Math.floor((safeStage - 1) * STAGE_RECURRING_ENEMY_GROWTH)
  // エリア最終ステージは追加で敵を増やす
  if (isPlainsFinalStage(safeStage, totalStages)) {
    count = count + PLAINS_FINAL_STAGE_ENEMY_COUNT_BONUS
  } else if (isFinalStage(safeStage, totalStages)) {
    count = count + FINAL_STAGE_ENEMY_COUNT_BONUS
  }
  return count
}

/**
 * ステージ開始直後の初回スポーン敵数。
 */
export function getInitialEnemyCountForStage(
  stageNumber: number,
  totalStages: number,
): number {
  const safeStage = Math.max(1, stageNumber)
  let count =
    STAGE_INITIAL_ENEMY_BASE + Math.floor((safeStage - 1) * STAGE_INITIAL_ENEMY_GROWTH)
  if (isPlainsFinalStage(safeStage, totalStages)) {
    count = count + PLAINS_FINAL_STAGE_ENEMY_COUNT_BONUS
  } else if (isFinalStage(safeStage, totalStages)) {
    count = count + FINAL_STAGE_ENEMY_COUNT_BONUS
  }
  return count
}

/**
 * Forest Stage5 だけ出現数を調整する。Stage1〜4 は通常のまま。
 */
export function applyForestStage5SpawnCountFactor(
  areaId: StageAreaId,
  stageNumber: number,
  enemyCount: number,
): number {
  if (areaId === 'forest' && stageNumber === 5) {
    return Math.max(1, Math.round(enemyCount * FOREST_STAGE5_SPAWN_COUNT_FACTOR))
  }
  return enemyCount
}

/**
 * 全ステージ共通: 最初に数体、以降一定間隔でバーストする予定表を返す。
 * WaveSystem がこのスケジュールに沿って警告付きスポーンを予約する。
 */
export function getSpawnScheduleForStage(
  stageNumber: number,
  totalStages: number,
  areaId: StageAreaId = 'plains',
): SpawnBurst[] | null {
  let initialCount = getInitialEnemyCountForStage(stageNumber, totalStages)
  let recurringCount = getRecurringEnemyCountForStage(stageNumber, totalStages)
  initialCount = applyForestStage5SpawnCountFactor(areaId, stageNumber, initialCount)
  recurringCount = applyForestStage5SpawnCountFactor(areaId, stageNumber, recurringCount)
  const burstIntervalSeconds = getSpawnBurstIntervalSeconds(areaId, stageNumber, totalStages)

  const schedule: SpawnBurst[] = [
    { delaySeconds: 0, enemyCount: initialCount },
  ]

  for (
    let delaySeconds = burstIntervalSeconds;
    delaySeconds <= STAGE_LAST_SPAWN_SECONDS;
    delaySeconds = delaySeconds + burstIntervalSeconds
  ) {
    schedule.push({
      delaySeconds,
      enemyCount: recurringCount,
    })
  }

  return schedule
}

/**
 * レガシー用（スポーン予定は getSpawnScheduleForStage を優先）。
 * 旧ウェーブ API 互換のため空に近い値を返す。
 */
export function getWaveConfigForStage(_stageNumber: number): WaveConfig {
  return { waveCount: 0, enemiesPerWave: 0, waveIntervalSeconds: 0 }
}

/**
 * ステージごとの同時敵数のソフト上限（暴走防止の天井付き）。
 * スポーン側がこれ以上出さないよう見る。画面スプライトの厳密上限ではない。
 */
export function getMaxEnemiesForStage(stageNumber: number, totalStages: number): number {
  const safeStage = Math.max(1, stageNumber)
  let maxCount = MAX_ENEMIES + (safeStage - 1) * MAX_ENEMIES_PER_STAGE_BONUS
  if (isPlainsFinalStage(safeStage, totalStages)) {
    maxCount =
      maxCount +
      PLAINS_FINAL_STAGE_ENEMY_COUNT_BONUS +
      PLAINS_FINAL_STAGE_MAX_ENEMIES_BONUS
  } else if (isFinalStage(safeStage, totalStages)) {
    maxCount = maxCount + FINAL_STAGE_ENEMY_COUNT_BONUS + FINAL_STAGE_MAX_ENEMIES_BONUS
  }
  return Math.min(MAX_ENEMIES_HARD_CAP, maxCount)
}

// --- 難易度計算（レベルアップ成長に合わせて HP・速度を伸ばす）---
// Enemy スポーン時に呼ばれる。

/**
 * ステージに応じた通常近接敵の HP。想定火力より控えめに伸ばし、貫通で群れ処理しやすくする。
 * Plains Stage2 の硬いスライムは calculateToughMeleeHp を使う（ここには含めない）。
 */
export function calculateEnemyHpForStage(stageNumber: number, totalStages: number): number {
  const expectedPower = calculateExpectedPlayerPower(stageNumber)
  // HP は想定火力より控えめに伸ばす（貫通で群れを処理しやすくする）
  const hpScale = 1 + (expectedPower - 1) * ENEMY_HP_POWER_SCALE
  let hp = Math.max(1, Math.round(ENEMY_BASE_HP * hpScale))
  if (isPlainsFinalStage(stageNumber, totalStages)) {
    hp = Math.max(1, Math.round(hp * PLAINS_FINAL_STAGE_HP_MULTIPLIER))
  } else if (isFinalStage(stageNumber, totalStages)) {
    hp = Math.max(1, Math.round(hp * FINAL_STAGE_HP_MULTIPLIER))
  }
  return hp
}

/**
 * 少し硬い泥スライム専用 HP（3 か 4 を同じ確率で選ぶ）。
 * Stage2 / Stage3 どちらでも同じ値。最終面の HP 倍率は受けない。
 */
export function calculateToughMeleeHp(): number {
  const hpRange = ENEMY_TOUGH_MELEE_MAX_HP - ENEMY_TOUGH_MELEE_MIN_HP + 1
  return ENEMY_TOUGH_MELEE_MIN_HP + Math.floor(Math.random() * hpRange)
}

/**
 * 少し硬い泥スライムの移動速度。
 * Stage2 / Stage3 どちらでも Stage2 相当の速度に固定する（最終面補正なし）。
 */
export function calculateToughMeleeSpeed(): number {
  // Stage2: BASE * (1 + growth * 1)
  const stage2Multiplier = 1 + ENEMY_SPEED_GROWTH_PER_STAGE
  return ENEMY_BASE_SPEED * stage2Multiplier * ENEMY_TOUGH_MELEE_SPEED_FACTOR
}

/**
 * Forest Stage2 切り株の移動速度（泥スライムの半分）。
 */
export function calculateStumpSpeed(): number {
  return calculateToughMeleeSpeed() * ENEMY_STUMP_SPEED_FACTOR
}

/**
 * Volcano Stage3 燃え木の移動速度（切り株と同じ）。
 */
export function calculateBurningTreeSpeed(): number {
  return calculateToughMeleeSpeed() * ENEMY_BURNING_TREE_SPEED_FACTOR
}

/**
 * Forest Stage4 枝の移動速度（緑スライムより遅め）。
 */
export function calculateBranchSpeed(stageNumber: number, totalStages: number): number {
  return calculateEnemySpeedForStage(stageNumber, totalStages) * ENEMY_BRANCH_SPEED_FACTOR
}

/**
 * 射撃敵のHP。Plains最終面だけ、近接敵より少し柔らかくする。
 */
export function calculateRangedEnemyHpForStage(
  stageNumber: number,
  totalStages: number,
): number {
  const enemyHp = calculateEnemyHpForStage(stageNumber, totalStages)
  if (!isPlainsFinalStage(stageNumber, totalStages)) {
    return enemyHp
  }
  return Math.max(1, Math.round(enemyHp * PLAINS_FINAL_STAGE_RANGED_HP_MULTIPLIER))
}

/**
 * 近接敵の移動速度（ステージが進むと少しずつ上がる）。
 * 実際の移動は EnemyMovementSystem が setData('speed') を読んで setVelocity。
 */
export function calculateEnemySpeedForStage(
  stageNumber: number,
  totalStages: number,
): number {
  const safeStage = Math.max(1, stageNumber)
  const multiplier = 1 + ENEMY_SPEED_GROWTH_PER_STAGE * (safeStage - 1)
  let speed = ENEMY_BASE_SPEED * multiplier
  if (isPlainsFinalStage(safeStage, totalStages)) {
    speed = speed * PLAINS_FINAL_STAGE_SPEED_MULTIPLIER
  } else if (isFinalStage(safeStage, totalStages)) {
    speed = speed * FINAL_STAGE_SPEED_MULTIPLIER
  }
  return speed
}

/**
 * 射撃型の移動速度（近接速度 × ENEMY_RANGED_SPEED_FACTOR）。
 */
export function calculateRangedEnemySpeedForStage(
  stageNumber: number,
  totalStages: number,
): number {
  return calculateEnemySpeedForStage(stageNumber, totalStages) * ENEMY_RANGED_SPEED_FACTOR
}

/**
 * Stage 3+ で射撃型を混ぜるかどうか（ステージ帯で確率上昇）。
 * パック全体で一度だけ呼ばれ、群れの色／種類を揃える。
 * Plains 最終（Stage3）の蜂は WaveSystem が固定スケジュールで出すため、ここでは出さない。
 */
export function shouldSpawnRangedEnemy(stageNumber: number, totalStages: number): boolean {
  if (stageNumber < ENEMY_RANGED_FIRST_STAGE) {
    return false
  }

  // Plains Stage3 の蜂は「初回なし・以降1グループ・FINAL WAVEも1グループ」の固定枠
  if (isPlainsFinalStage(stageNumber, totalStages)) {
    return false
  }

  // エリア最終は射撃型の割合を大きく上げる
  let chance = ENEMY_RANGED_SPAWN_CHANCE_STAGE_3_4
  if (isFinalStage(stageNumber, totalStages)) {
    chance = FINAL_STAGE_RANGED_SPAWN_CHANCE
  } else if (stageNumber >= 5) {
    chance = ENEMY_RANGED_SPAWN_CHANCE_STAGE_5_7
  }

  return Math.random() < chance
}

// --- 経験値（累計 XP からレベル内の進捗を計算）---
// Lv2=4, Lv3=11, Lv4=22, Lv5=38... （必要量 4,7,11,16...、最大50の累計）

/**
 * 指定レベルに到達するまでに必要な累計 XP（閾値）。
 * level 1 → 0、level 2 → 4、など。
 */
export function getCumulativeXpForLevel(level: number): number {
  if (level <= 1) {
    return 0
  }

  const stepCount = level - 1
  let cumulativeXp = 0
  let nextLevelCost = XP_FIRST_LEVEL_UP_COST
  let costIncrease = XP_FIRST_COST_INCREASE

  for (let step = 0; step < stepCount; step++) {
    cumulativeXp = cumulativeXp + nextLevelCost
    // 上限到達後は、以降のレベルアップも毎回50 XPで固定する
    nextLevelCost = Math.min(
      nextLevelCost + costIncrease,
      XP_MAX_LEVEL_UP_COST,
    )
    costIncrease = costIncrease + 1
  }

  return cumulativeXp
}

/**
 * 現在レベル内での XP 進捗（バー表示用）。
 * currentInLevel = 今のレベル内で溜まった量 / neededForNext = 次レベルまでの必要量。
 */
export function getXpProgressForLevel(
  totalXp: number,
  currentLevel: number,
): { currentInLevel: number; neededForNext: number } {
  const currentThreshold = getCumulativeXpForLevel(currentLevel)
  const nextThreshold = getCumulativeXpForLevel(currentLevel + 1)
  return {
    currentInLevel: totalXp - currentThreshold,
    neededForNext: nextThreshold - currentThreshold,
  }
}

/**
 * 累計 XP から到達しているレベルを求める。
 * Python: while total_xp >= threshold(level+1): level += 1 に相当
 */
export function getLevelFromTotalXp(totalXp: number): number {
  let level = 1
  while (totalXp >= getCumulativeXpForLevel(level + 1)) {
    level = level + 1
  }
  return level
}
