// constants/layout.ts
// 画面サイズ・フォント・HUD / プレイエリア幾何・物理 FPS・WORLD_ENTITY_SCALE

// --- 画面（キャンバス全体）---
// Phaser の game config とカメラ／レイアウトの基準。main.ts と GameScene が参照。
export const GAME_WIDTH = 960
export const GAME_HEIGHT = 540

// --- フォント ---
// 見出し（タイトル・バナー）用と、HUD・ボタンなど本文用の2種類だけ使う。
// 読み込みは index.html の Google Fonts。失敗時は monospace で代用する。
export const FONT_FAMILY_HEADING = '"Press Start 2P", monospace'
export const FONT_FAMILY_UI = '"Silkscreen", monospace'

// タイトル画面・ブラウザタブのゲーム名
export const GAME_TITLE = 'Mage Survivor'

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
// 最終ボス出現: プレイエリア上端からこの割合だけ下（中央 X と組み合わせる）
export const FINAL_BOSS_SPAWN_Y_RATIO = 0.2

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
// ゲームロジックの基準フレームレート（描画・速度計算の基準）。
export const PHYSICS_FPS = 60
export const PHYSICS_FIXED_STEP_SECONDS = 1 / PHYSICS_FPS
// --- 弾のすり抜け（トンネリング）対策 ---
// Arcade Physics には高速弾用の連続衝突判定（CCD）がないため、
// Phaser 公式が推奨する「物理の刻みを細かくする」方法を使う。
// 1描画フレーム（1/60秒）を4つの小さなステップに分けて進めることで、
// 弾の1ステップ移動距離が PLAYER_BULLET_SPEED÷240 程度になり、判定を飛び越えにくくなる。
// 速度は px/秒 で指定しているので、刻みを細かくしても移動速度は変わらない。
export const PHYSICS_SUBSTEPS_PER_FRAME = 4
export const ARCADE_PHYSICS_FPS = PHYSICS_FPS * PHYSICS_SUBSTEPS_PER_FRAME
// 後方互換の別名（コイン加速計算などで使用）
export const PLAYER_MOVEMENT_FIXED_STEP_SECONDS = PHYSICS_FIXED_STEP_SECONDS

// プレイ画面のキャラ・コイン・当たり判定の拡大率（スマホでも見やすく）
export const WORLD_ENTITY_SCALE = 1.5
