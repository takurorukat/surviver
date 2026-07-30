// constants/ui.ts
// 設定・タイトル・レベルアップ UI・バナー・ショップ/封印フラグ

import { GAME_HEIGHT, TOP_BAR_HEIGHT, WORLD_ENTITY_SCALE } from './layout'

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
/** ロゴの上に出す短い一文（ロゴ自体に ROSSO ARGINE が入っている） */
export const SETTINGS_CREDITS_CREATED_BY = 'created by'
/**
 * Credits 画面用の短い帰属（SSoT）。
 * URL・SHA・個別ファイル名・加工詳細は docs/licenses と public 配下のライセンス文書へ。
 */
export const SETTINGS_CREDITS_BODY = [
  'MUSIC',
  'Music by obscure music (Gichco)',
  'Source: OpenGameArt',
  '',
  'SKILL ICONS',
  'Icons by Lorc',
  'Source: Game-icons.net',
  'License: CC BY 3.0',
].join('\n')
/** Credits パネル幅（ゲーム座標） */
export const CREDITS_PANEL_WIDTH = 400
/** Credits パネルの上限高さ（画面内マージンを確保） */
export const CREDITS_PANEL_MAX_HEIGHT = 420
export const CREDITS_PANEL_MARGIN_Y = 24
export const CREDITS_BODY_PADDING_X = 36
/** ロゴの下の帰属本文。ロゴより小さく読みやすさ優先で控えめに */
export const CREDITS_BODY_FONT_SIZE = 10
export const CREDITS_BODY_MIN_FONT_SIZE = 9
export const CREDITS_BODY_LINE_SPACING = 1
/** 「created by」ラベル（ロゴ直前） */
export const CREDITS_CREATED_BY_FONT_SIZE = 11

/**
 * 画面高さに収まる Credits パネル高さを返す。
 * Python: min(max_height, game_height - margin * 2) に相当
 */
export function calculateCreditsPanelHeight(gameHeight: number): number {
  const capped = gameHeight - CREDITS_PANEL_MARGIN_Y * 2
  if (capped < CREDITS_PANEL_MAX_HEIGHT) {
    return capped
  }
  return CREDITS_PANEL_MAX_HEIGHT
}

/**
 * 本文が可視領域より高いとき、スクロール上限（下方向の最大オフセット）を返す。
 */
export function calculateCreditsBodyMaxScroll(
  bodyHeight: number,
  visibleHeight: number,
): number {
  if (bodyHeight <= visibleHeight) {
    return 0
  }
  return bodyHeight - visibleHeight
}
// Phaser postFX.addBlur(quality, x, y, strength, color, steps)
export const SETTINGS_MENU_BLUR_QUALITY = 1
export const SETTINGS_MENU_BLUR_OFFSET = 2
export const SETTINGS_MENU_BLUR_STRENGTH = 1.4
export const SETTINGS_MENU_BLUR_STEPS = 4

export const TITLE_AREA_PANEL_COLUMNS = 2

import { getSkillIconMetrics } from './skillIcons'

// --- スキルアイコン倍率（原本は constants/skillIcons.ts）---
export const SKILL_TREE_ICON_SCALE = 1
export const LEVEL_UP_SKILL_ICON_SCALE = 1.5
export const UNLOCK_BANNER_SKILL_ICON_SCALE = 4.5
export const LEVEL_UP_BANNER_SKILL_ICON_SCALE = 2.5
const SKILL_TREE_ICON_METRICS = getSkillIconMetrics(SKILL_TREE_ICON_SCALE)
const LEVEL_UP_SKILL_ICON_METRICS = getSkillIconMetrics(
  LEVEL_UP_SKILL_ICON_SCALE,
)
export const SKILL_TREE_ICON_SIZE = SKILL_TREE_ICON_METRICS.size
export const SKILL_TREE_ICON_BORDER = SKILL_TREE_ICON_METRICS.border
export const SKILL_TREE_ICON_OUTER_SIZE = SKILL_TREE_ICON_METRICS.outerSize
export const SKILL_TREE_ICON_GAP = SKILL_TREE_ICON_METRICS.gap
export const SKILL_TREE_ICON_SYMBOL_FONT_SIZE = `${SKILL_TREE_ICON_METRICS.symbolFontSize}px`
export const LEVEL_UP_SKILL_ICON_SIZE = LEVEL_UP_SKILL_ICON_METRICS.size
export const LEVEL_UP_SKILL_ICON_BORDER = LEVEL_UP_SKILL_ICON_METRICS.border
export const LEVEL_UP_SKILL_ICON_OUTER_SIZE =
  LEVEL_UP_SKILL_ICON_METRICS.outerSize
export const LEVEL_UP_SKILL_ICON_GAP = LEVEL_UP_SKILL_ICON_METRICS.gap
export const LEVEL_UP_SKILL_ICON_SYMBOL_FONT_SIZE = `${LEVEL_UP_SKILL_ICON_METRICS.symbolFontSize}px`
export const SKILL_ICON_SYMBOL_OFFSET_X = 0
export const SKILL_ICON_SYMBOL_OFFSET_Y = 0

// --- タイトルに出すエリア数 ---
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
// エリア絵の上に重ねるパネル色の不透明度（文字が読めるようやや濃く）
export const TITLE_AREA_PANEL_FILL_ALPHA_PLAYABLE = 0.72
export const TITLE_AREA_PANEL_FILL_ALPHA_LOCKED = 0.82
export const TITLE_AREA_PANEL_FILL_ALPHA_HIDDEN = 1
// エリア選択用イラスト（? のときは出さない）
// マウスオーバー時: パネルが少し浮き、絵がグッとズームする
export const TITLE_AREA_HOVER_SCALE = 1.06
export const TITLE_AREA_HOVER_ART_ZOOM = 1.18
export const TITLE_AREA_HOVER_ART_ALPHA = 1
export const TITLE_AREA_HOVER_LIFT_Y = -10
/** 選択時、名前／ステージ数をさらに上へずらして絵を見せる */
export const TITLE_AREA_HOVER_TEXT_LIFT_Y = -44
/**
 * Windy Plains だけ: 選択時「N Stages」をパネル上端からのこの距離まで上げる
 * （キャラの目に重ならないようにする）
 */
export const TITLE_AREA_HOVER_PLAINS_STAGES_TOP_PADDING = 11
/** 選択時、グレー重ねの不透明度（0＝絵がはっきり見える） */
export const TITLE_AREA_HOVER_OVERLAY_ALPHA = 0
export const TITLE_AREA_HOVER_TWEEN_MS = 160
export const TITLE_AREA_HOVER_DEPTH = 40
export const TITLE_AREA_NAME_STROKE_COLOR = '#000000'
export const TITLE_AREA_NAME_STROKE_THICKNESS = 5
export const TITLE_AREA_STAGES_STROKE_THICKNESS = 4
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
/** @deprecated タイトルでは南京錠アイコンを使う。他で参照がなければ削除可 */
export const TITLE_AREA_LOCKED_LABEL = 'LOCKED'
export const TITLE_AREA_NAME_LEFT_PADDING = 24
export const TITLE_AREA_STAGES_RIGHT_PADDING = 24
export const TITLE_AREA_NAME_OFFSET_Y = -18
export const TITLE_AREA_STAGES_OFFSET_Y = 20
export const TITLE_AREA_NAME_FONT_SIZE = '24px'
export const TITLE_AREA_STAGES_FONT_SIZE = '15px'
export const TITLE_AREA_CONDITION_COLOR = '#fde68a'
// false のあいだはタイトルから Shop / Seal Skills を隠し、
// ショップ解放の吹き出し・結果画面の UNLOCKED: Shop も出さない
export const TITLE_SHOW_SHOP_AND_SEAL = false
// Version 1: Gold／Shop を完全削除せず Runtime から休止する。
// false のあいだは Gold の生成・取得・報酬・HUD・演出・Shop 導線を止める。
// セーブ上の gold／shopUpgrades の読み取りと既存強化の適用は維持する。
// XP（Coin.ts）はこのフラグの対象外。
export const RUNTIME_ENABLE_GOLD_AND_SHOP = false
// 開発ビルド（vite dev / import.meta.env.DEV）だけ進行デバッグボタンを出す
// 本番ビルド（npm run build）では必ず false
export const TITLE_SHOW_DEBUG_PROGRESS = import.meta.env.DEV
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
export const FINAL_WAVE_BANNER_FONT_SIZE = '52px'
export const FINAL_WAVE_BANNER_COLOR = '#fca5a5'
export const FINAL_WAVE_BANNER_STROKE_COLOR = '#000000'
export const FINAL_WAVE_BANNER_STROKE_THICKNESS = 8
// レベルアップ選択肢（LEVEL_UP_UI_DEPTH=400）より奥に出し、重なって選べなくならないようにする
export const FINAL_WAVE_BANNER_DEPTH = 380
export const FINAL_WAVE_BANNER_POP_MS = 260
export const FINAL_WAVE_BANNER_HOLD_MS = 900
export const FINAL_WAVE_BANNER_FADE_MS = 320

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
// クリア時ゴールドも経験値と同じく上から落とす
export const CLEAR_GOLD_COIN_FALL_TILES = CLEAR_TIME_BONUS_COIN_FALL_TILES
export const CLEAR_GOLD_COIN_SPREAD_RADIUS = CLEAR_TIME_BONUS_COIN_SPREAD_RADIUS
export const CLEAR_GOLD_COIN_FALL_MS = CLEAR_TIME_BONUS_COIN_FALL_MS
export const CLEAR_GOLD_COIN_PICKUP_DISTANCE = 18 * WORLD_ENTITY_SCALE

// --- レベルアップ 3択 UI の見た目 ---
export const LEVEL_UP_OVERLAY_COLOR = 0x000000
export const LEVEL_UP_OVERLAY_ALPHA = 0.32
export const LEVEL_UP_PANEL_WIDTH = 220
export const LEVEL_UP_PANEL_HEIGHT = 108
/** 複合スキル予告が1つあるときの高さ（基本＋予告1件分） */
export const LEVEL_UP_PANEL_HEIGHT_WITH_COMBO = 150
/** 複合予告が2件目以降、1件増えるごとの追加高さ */
export const LEVEL_UP_PANEL_HEIGHT_PER_EXTRA_COMBO = 48
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
/** Level Up の属性タグ（WIND など）。タイトルより小さく、説明より識別しやすく */
export const LEVEL_UP_CHOICE_ELEMENT_TAG_FONT_SIZE = '12px'
/** 複合スキル（Pierce / Blast / Ricochet）が付く予告の色（名前は通常タイトルと同サイズ） */
export const LEVEL_UP_CHOICE_COMBO_COLOR = '#fde68a'
export const LEVEL_UP_CHOICE_COMBO_BLOCK_GAP = 8
export const LEVEL_UP_UI_DEPTH = 400
// --- Move+1 かつ Speed+1 で Pierce を自動取得したときの大きな通知 ---
export const PIERCE_UNLOCK_BANNER_TITLE = 'PIERCE GET!'
export const PIERCE_UNLOCK_BANNER_SUBTITLE = 'Bullets pierce through enemies'
export const PIERCE_UNLOCK_BANNER_TITLE_FONT_SIZE = '48px'
export const PIERCE_UNLOCK_BANNER_SUBTITLE_FONT_SIZE = '20px'
export const PIERCE_UNLOCK_BANNER_TITLE_COLOR = '#7dd3fc'
export const PIERCE_UNLOCK_BANNER_SUBTITLE_COLOR = '#e0f2fe'
export const PIERCE_UNLOCK_BANNER_STROKE_COLOR = '#000000'
export const PIERCE_UNLOCK_BANNER_STROKE_THICKNESS = 8
export const PIERCE_UNLOCK_BANNER_DEPTH = 435
export const PIERCE_UNLOCK_BANNER_POP_MS = 280
export const PIERCE_UNLOCK_BANNER_HOLD_MS = 1100
export const PIERCE_UNLOCK_BANNER_FADE_MS = 320

// --- Power+1 かつ Range+1 で Blast を自動取得したときの大きな通知 ---
export const BLAST_UNLOCK_BANNER_TITLE = 'BLAST GET!'
export const BLAST_UNLOCK_BANNER_SUBTITLE = 'Damages nearby enemies on hit'
export const BLAST_UNLOCK_BANNER_TITLE_FONT_SIZE = '48px'
export const BLAST_UNLOCK_BANNER_SUBTITLE_FONT_SIZE = '20px'
export const BLAST_UNLOCK_BANNER_TITLE_COLOR = '#fbbf24'
export const BLAST_UNLOCK_BANNER_SUBTITLE_COLOR = '#fef3c7'
export const BLAST_UNLOCK_BANNER_STROKE_COLOR = '#000000'
export const BLAST_UNLOCK_BANNER_STROKE_THICKNESS = 8
export const BLAST_UNLOCK_BANNER_DEPTH = 435
export const BLAST_UNLOCK_BANNER_POP_MS = 280
export const BLAST_UNLOCK_BANNER_HOLD_MS = 1100
export const BLAST_UNLOCK_BANNER_FADE_MS = 320

// --- Pickup+1 かつ Power+1 かつ Speed+1 で Ricochet を自動取得 ---
export const RICOCHET_UNLOCK_BANNER_TITLE = 'RICOCHET GET!'
export const RICOCHET_UNLOCK_BANNER_SUBTITLE = 'Bullets bounce to nearby enemies'
export const RICOCHET_UNLOCK_BANNER_TITLE_FONT_SIZE = '48px'
export const RICOCHET_UNLOCK_BANNER_SUBTITLE_FONT_SIZE = '20px'
export const RICOCHET_UNLOCK_BANNER_TITLE_COLOR = '#e9d5ff'
export const RICOCHET_UNLOCK_BANNER_SUBTITLE_COLOR = '#f3e8ff'
export const RICOCHET_UNLOCK_BANNER_STROKE_COLOR = '#000000'
export const RICOCHET_UNLOCK_BANNER_STROKE_THICKNESS = 8
export const RICOCHET_UNLOCK_BANNER_DEPTH = 435
export const RICOCHET_UNLOCK_BANNER_POP_MS = 280
export const RICOCHET_UNLOCK_BANNER_HOLD_MS = 1100
export const RICOCHET_UNLOCK_BANNER_FADE_MS = 320

// Blast / Pierce / Ricochet のレベル上昇時（初回 GET! より控えめ）
export const SKILL_LEVEL_UP_BANNER_TITLE_FONT_SIZE = '28px'
export const SKILL_LEVEL_UP_BANNER_SUBTITLE_FONT_SIZE = '16px'
export const SKILL_LEVEL_UP_BANNER_DEPTH = 430
export const SKILL_LEVEL_UP_BANNER_POP_MS = 180
export const SKILL_LEVEL_UP_BANNER_HOLD_MS = 700
export const SKILL_LEVEL_UP_BANNER_FADE_MS = 220
export const SKILL_LEVEL_UP_BANNER_STROKE_THICKNESS = 5
export const BLAST_LEVEL_UP_BANNER_TITLE_PREFIX = 'BLAST Lv.'
export const BLAST_LEVEL_UP_BANNER_SUBTITLE = 'Power + Attack Range'
export const PIERCE_LEVEL_UP_BANNER_TITLE_PREFIX = 'PIERCE Lv.'
export const PIERCE_LEVEL_UP_BANNER_SUBTITLE = 'Move Speed + Attack Speed'
export const RICOCHET_LEVEL_UP_BANNER_TITLE_PREFIX = 'RICOCHET Lv.'
export const RICOCHET_LEVEL_UP_BANNER_SUBTITLE = 'XP Bonus + Pickup Range + Attack Speed'

export const ORBITING_ORB_UNLOCK_BANNER_TITLE = 'ORBIT GET!'
export const ORBITING_ORB_UNLOCK_BANNER_SUBTITLE =
  'Ice orbs orbit, hit enemies, and shatter projectiles'
export const ORBITING_ORB_UNLOCK_BANNER_TITLE_FONT_SIZE = '48px'
export const ORBITING_ORB_UNLOCK_BANNER_SUBTITLE_FONT_SIZE = '20px'
export const ORBITING_ORB_UNLOCK_BANNER_TITLE_COLOR = '#7dd3fc'
export const ORBITING_ORB_UNLOCK_BANNER_SUBTITLE_COLOR = '#e0f2fe'
export const ORBITING_ORB_UNLOCK_BANNER_STROKE_COLOR = '#000000'
export const ORBITING_ORB_UNLOCK_BANNER_STROKE_THICKNESS = 8
export const ORBITING_ORB_UNLOCK_BANNER_DEPTH = 435
export const ORBITING_ORB_UNLOCK_BANNER_POP_MS = 280
export const ORBITING_ORB_UNLOCK_BANNER_HOLD_MS = 1100
export const ORBITING_ORB_UNLOCK_BANNER_FADE_MS = 320
export const ORBITING_ORB_LEVEL_UP_BANNER_TITLE_PREFIX = 'ORBIT Lv.'
export const ORBITING_ORB_LEVEL_UP_BANNER_SUBTITLE = 'Move Speed + Pickup Range'

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
export const UNLOCK_STATUS_TOOLTIP_DEPTH = 450
export const UNLOCK_STATUS_TOOLTIP_MAX_WIDTH = 200
export const UNLOCK_STATUS_TOOLTIP_OFFSET_X = 10
export const UNLOCK_STATUS_TOOLTIP_TITLE_COLOR = '#ffffff'
export const UNLOCK_STATUS_TOOLTIP_DESC_COLOR = '#cbd5e1'
export const UNLOCK_STATUS_TOOLTIP_LOCK_COLOR = '#fca5a5'
export const UNLOCK_STATUS_HEADER_TEXT = 'SKILL TREE'
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
// スキルツリー: 左列＝基本スキル、右列＝合成スキル（線でつなぐ）
export const SKILL_TREE_ROW_GAP = 6
/** 基本列(0)と合成列のあいだの空き列（線の見通し用） */
export const SKILL_TREE_COMBO_COL = 2
/** アイコン外枠と接続線の見通しを両立する列間の追加余白。 */
export const SKILL_TREE_COLUMN_CLEARANCE = 6
export const SKILL_TREE_COLUMN_STEP =
  SKILL_TREE_ICON_OUTER_SIZE +
  SKILL_TREE_ICON_GAP +
  SKILL_TREE_COLUMN_CLEARANCE
/** 左端から右端までの実幅。現行レイアウトでは右マージン8pxを正確に残す。 */
export const SKILL_TREE_WIDTH =
  SKILL_TREE_ICON_OUTER_SIZE + SKILL_TREE_COMBO_COL * SKILL_TREE_COLUMN_STEP
export const SKILL_TREE_LINE_COLOR = 0x94a3b8
export const SKILL_TREE_LINE_ALPHA = 0.55
export const SKILL_TREE_LINE_THICKNESS = 1.25
/** レベルアップ済みスキルにつながる線（達成が分かるよう太く） */
export const SKILL_TREE_LINE_ACTIVE_COLOR = 0xfde68a
export const SKILL_TREE_LINE_ACTIVE_ALPHA = 0.95
export const SKILL_TREE_LINE_ACTIVE_THICKNESS = 3
export const SKILL_TREE_LINE_DEPTH_OFFSET = -1
export const UNLOCK_ICON_LOCKED_FILL_COLOR = 0x374151
export const UNLOCK_ICON_LOCKED_BORDER_COLOR = 0x6b7280
export const UNLOCK_ICON_LETTER_COLOR = '#0f172a'
export const UNLOCK_ICON_LOCKED_LETTER_COLOR = '#9ca3af'
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
