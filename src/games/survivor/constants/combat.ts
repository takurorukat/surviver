// constants/combat.ts
// プレイヤー／弾／貫通・爆破・跳弾・ノックバック・ダメージ関連

import { WORLD_ENTITY_SCALE } from './layout'

// --- プレイヤー本体・戦闘基礎値 ---
// createPlayer / PlayerMovement / 被ダメ・攻撃 System が参照。
// 実際の移動速度は GameScene.currentMoveSpeed（アイテムで増減）。PLAYER_SPEED は基準・上限用。
export const PLAYER_HP = 3
// 基本移動速度。実際の速度は GameScene の currentMoveSpeed（アイテムで増減可能）
export const PLAYER_SPEED = 165 // 旧 150 の 1.1 倍

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


export const PLAYER_WIDTH = 24 * WORLD_ENTITY_SCALE
export const PLAYER_HEIGHT = 24 * WORLD_ENTITY_SCALE
export const PLAYER_RADIUS = 12 * WORLD_ENTITY_SCALE
export const PLAYER_COLOR = 0x4fc3f7
// 3コマ横並び（384×128）。1コマは 128×128
// 魔法使いスプライトが見やすいよう、当たり判定より少し大きめに表示
// 新スプライトはすでに丸みがあるので、横伸ばしはほぼしない
export const PLAYER_INVINCIBLE_SECONDS = 0.8
// 被ダメ時に敵から離す（連続接触ダメージを防ぐ）
export const PLAYER_KNOCKBACK_SPEED = 600
export const PLAYER_KNOCKBACK_DURATION_MS = 200
export const PLAYER_ATTACK_DAMAGE = 1
export const PLAYER_ATTACK_INTERVAL_MS = 800
export const PLAYER_ATTACK_RANGE = 150 * WORLD_ENTITY_SCALE

// --- プレイヤー弾（見た目・速度・上限は objects/PlayerBullet）---
export const PLAYER_BULLET_WIDTH = 10 * WORLD_ENTITY_SCALE
export const PLAYER_BULLET_HEIGHT = 10 * WORLD_ENTITY_SCALE
// 風魔法弾の本体色（水色寄り）
export const PLAYER_BULLET_COLOR = 0x67e8f9
// 渦の外側リング用の少し濃い色
export const PLAYER_BULLET_SWIRL_COLOR = 0x22d3ee
// Plains Stage1・Move未強化時の丸パワー弾（Blast と同系の琥珀）
export const PLAYER_BULLET_POWER_ORB_COLOR = 0xfbbf24
export const PLAYER_BULLET_POWER_ORB_CORE_COLOR = 0xfde68a
export const PLAYER_BULLET_POWER_ORB_RIM_COLOR = 0xf59e0b
// Pickup 強化後の水魔法弾（青〜水色）
export const PLAYER_BULLET_WATER_ORB_COLOR = 0x38bdf8
export const PLAYER_BULLET_WATER_ORB_CORE_COLOR = 0xe0f2fe
export const PLAYER_BULLET_WATER_ORB_RIM_COLOR = 0x0284c7
// XP Bonus 強化後の火魔法弾
export const PLAYER_BULLET_FIRE_ORB_COLOR = 0xf97316
export const PLAYER_BULLET_FIRE_ORB_CORE_COLOR = 0xfed7aa
export const PLAYER_BULLET_FIRE_ORB_RIM_COLOR = 0xea580c
// Dungeon（土）の岩弾
export const PLAYER_BULLET_EARTH_ORB_COLOR = 0xa8a29e
export const PLAYER_BULLET_EARTH_ORB_CORE_COLOR = 0xe7e5e4
export const PLAYER_BULLET_EARTH_ORB_RIM_COLOR = 0x78716c

// --- エネルギー弾（パワーオーブ）のヒット演出 ---
// 直撃の小さなポップのみ。Blast の広い円リングと二重に見えないよう、
// 終端半径・飛び散りは Blast（BLAST_RADIUS_BASE 付近）よりかなり小さくする
export const ENERGY_ORB_HIT_DEPTH = 58
export const ENERGY_ORB_HIT_RING_DURATION_MS = 140
export const ENERGY_ORB_HIT_RING_START_RADIUS = 3 * WORLD_ENTITY_SCALE
export const ENERGY_ORB_HIT_RING_END_RADIUS = 8 * WORLD_ENTITY_SCALE
export const ENERGY_ORB_HIT_BURST_COUNT = 4
export const ENERGY_ORB_HIT_BURST_SIZE = 2.5 * WORLD_ENTITY_SCALE
export const ENERGY_ORB_HIT_BURST_SPREAD = 7 * WORLD_ENTITY_SCALE
export const ENERGY_ORB_HIT_BURST_DURATION_MS = 160
export const ENERGY_ORB_HIT_SIZE_SCALE_PER_POWER = 0.06
export const ENERGY_ORB_HIT_SIZE_SCALE_MAX = 1.2

// --- 水魔法弾のヒット演出（水しぶき＋小さな氷の結晶）---
export const WATER_ORB_HIT_DEPTH = 58
export const WATER_ORB_HIT_RING_DURATION_MS = 180
export const WATER_ORB_HIT_RING_START_RADIUS = 4 * WORLD_ENTITY_SCALE
export const WATER_ORB_HIT_RING_END_RADIUS = 14 * WORLD_ENTITY_SCALE
export const WATER_ORB_HIT_DROPLET_COUNT = 5
export const WATER_ORB_HIT_DROPLET_SIZE = 3 * WORLD_ENTITY_SCALE
export const WATER_ORB_HIT_DROPLET_SPREAD = 12 * WORLD_ENTITY_SCALE
export const WATER_ORB_HIT_DROPLET_DURATION_MS = 220
export const WATER_ORB_HIT_CRYSTAL_COUNT = 4
export const WATER_ORB_HIT_CRYSTAL_SIZE = 5 * WORLD_ENTITY_SCALE
export const WATER_ORB_HIT_CRYSTAL_SPREAD = 10 * WORLD_ENTITY_SCALE
export const WATER_ORB_HIT_CRYSTAL_DURATION_MS = 280
export const WATER_ORB_HIT_FROST_COLOR = 0xbae6fd
export const WATER_ORB_HIT_ICE_COLOR = 0xf0f9ff
export const WATER_ORB_HIT_SIZE_SCALE_PER_POWER = 0.08
export const WATER_ORB_HIT_SIZE_SCALE_MAX = 1.35
// パワー（ダメージ）が上がるほど弾が大きくなる。基準は PLAYER_ATTACK_DAMAGE
export const PLAYER_BULLET_SIZE_SCALE_PER_DAMAGE = 0.18
export const PLAYER_BULLET_MAX_SIZE_SCALE = 2.4
// 渦が回る速さ（ラジアン／フレーム）。丸パワー弾は回さない
export const PLAYER_BULLET_SPIN_RADIANS_PER_FRAME = 0.28
// 弾の1ステップ移動距離が速すぎないよう、弾速は控えめにする
// （すり抜けは物理サブステップ側で対策）
export const PLAYER_BULLET_SPEED = 480
// 狙った敵へ弱く曲がる割合（1フレームあたり。0=なし, 1=即追従）
export const PLAYER_BULLET_HOMING_BLEND = 0.12
// すり抜け防止は判定拡大ではなく物理サブステップで行う（PHYSICS_SUBSTEPS_PER_FRAME 参照）
export const PLAYER_BULLET_RADIUS = 5 * WORLD_ENTITY_SCALE

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
export const COIN_XP_VALUE = 1
export const COIN_MAGNET_RADIUS = 80 * WORLD_ENTITY_SCALE
export const COIN_MAGNET_INITIAL_SPEED = 120
export const COIN_MAGNET_MAX_SPEED = 520
export const COIN_MAGNET_ACCELERATION = 2200
// ステージクリア時: 画面上の全コインを高速で集める
export const COIN_CLEAR_VACUUM_SPEED = 780
export const STAGE_CLEAR_VACUUM_SETTLE_MS = 350

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

// --- レベルアップ成長・貫通／爆破スキル ---
// LevelUpSystem / 攻撃計算。PIERCE / BLAST は実績解放とも連動。
export const DAMAGE_BONUS_PER_LEVEL_UP = 1
export const RANGE_MULTIPLIER = 1.25
// 発射速度レベル（1,2,3...）。間隔 = 基本間隔 / 速度レベル
export const FIRE_RATE_LEVEL_START = 1
export const RANGE_LEVEL_START = 1
export const MOVE_LEVEL_START = 1
// Move を1上げるごとに基準速度へ加算する倍率（Lv2=1.5倍, Lv3=2倍, Lv4=2.5倍）
export const MOVE_SPEED_MULTIPLIER_STEP = 0.5
export const MAGNET_LEVEL_START = 1
export const COIN_MAGNET_RADIUS_BONUS_PER_LEVEL = 28 * WORLD_ENTITY_SCALE
export const HP_BONUS_PER_LEVEL_UP = 1

/**
 * 弾の見た目スタイルを決める。
 * - 初期: エネルギー弾（パワー）
 * - Move 強化: 風
 * - Pickup 強化: 水（風より優先）
 * - XP Bonus 強化: 火（さらに優先）
 * - Dungeon（ruins）で元素スキル未強化: 土
 */
export function resolvePlayerBulletStyle(
  moveLevel: number,
  magnetLevel: number,
  xpBonusLevel: number = XP_BONUS_LEVEL_START,
  areaId: string = 'plains',
): 'powerOrb' | 'waterOrb' | 'windVortex' | 'fireOrb' | 'earthOrb' {
  if (xpBonusLevel > XP_BONUS_LEVEL_START) {
    return 'fireOrb'
  }
  if (magnetLevel > MAGNET_LEVEL_START) {
    return 'waterOrb'
  }
  if (moveLevel > MOVE_LEVEL_START) {
    return 'windVortex'
  }
  if (areaId === 'ruins') {
    return 'earthOrb'
  }
  return 'powerOrb'
}

/**
 * @deprecated resolvePlayerBulletStyle を使う。互換のため残す。
 */
export function shouldUsePowerOrbBulletStyle(
  _areaId: string,
  _stageNumber: number,
  moveLevel: number,
): boolean {
  return moveLevel <= MOVE_LEVEL_START
}
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
// Plains クリア後の Power / Speed 上限（Range はまだ 3 のまま）
export const PLAINS_CLEAR_POWER_SPEED_LEVEL_CAP = 5
// Forest クリア後はさらに +2（5→7）
export const FOREST_CLEAR_POWER_SPEED_LEVEL_CAP =
  PLAINS_CLEAR_POWER_SPEED_LEVEL_CAP + 2
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
export const BLAST_RADIUS_BASE = 28 * WORLD_ENTITY_SCALE
export const BLAST_RADIUS_GROWTH_PER_LEVEL = 12 * WORLD_ENTITY_SCALE
export const BLAST_RING_COLOR = 0xfbbf24
export const BLAST_RING_STROKE_COLOR = 0xfde68a
export const BLAST_RING_DURATION_MS = 220
export const BLAST_RING_START_RADIUS = 8 * WORLD_ENTITY_SCALE
export const BLAST_RING_DEPTH = 18

// レベルアップ UI に出す候補数（プールからランダムで選ぶ）
export const LEVEL_UP_CHOICES_SHOWN = 3

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

/**
 * Move レベルから実際の移動速度を求める。
 * Lv1（初期）= 1.0倍 / Lv2 = 1.5倍 / Lv3 = 2.0倍 / Lv4 = 2.5倍 …
 * 速度の保存先は currentMoveSpeed だけ。
 */
export function calculateMoveSpeed(moveLevel: number): number {
  const safeLevel = Math.max(MOVE_LEVEL_START, moveLevel)
  const raisedCount = safeLevel - MOVE_LEVEL_START
  const multiplier = 1 + raisedCount * MOVE_SPEED_MULTIPLIER_STEP
  return PLAYER_SPEED * multiplier
}

/** Magnet レベルからコイン吸引半径を求める。 */
export function calculateCoinMagnetRadius(magnetLevel: number): number {
  const safeLevel = Math.max(MAGNET_LEVEL_START, magnetLevel)
  return (
    COIN_MAGNET_RADIUS +
    (safeLevel - MAGNET_LEVEL_START) * COIN_MAGNET_RADIUS_BONUS_PER_LEVEL
  )
}

/** Earth Dungeon（内部 id: ruins）の各ステージで目安にする最大 HP。HP候補を出し続ける判定に使う。 */
export function getRecommendedMaxHpForRuins(stageNumber: number): number {
  const safeStage = Math.max(1, stageNumber)
  // Stage 1〜5: 4 / 4 / 5 / 5 / 6。HPを毎回必須選択にしない。
  return PLAYER_HP + Math.ceil(safeStage / 2)
}

/**
 * ステージクリア後に次ステージへ持ち込む開始HP。
 * 通常エリアは従来どおり全快、Ruinsだけは残HPを維持する。
 */
export function calculateCarriedStageStartHp(
  areaId: string,
  previousCurrentHp: number,
  maxHp: number,
): number {
  const safeMaxHp = Math.max(1, Math.floor(maxHp))
  if (areaId !== 'ruins') {
    return safeMaxHp
  }
  const safePreviousHp = Math.max(1, Math.floor(previousCurrentHp))
  return Math.min(safeMaxHp, safePreviousHp)
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
 * 爆破ダメージ: 直撃ダメージの半分（端数は切り上げ）。
 * 例: Power2 → 周囲 1 / Power3 → 周囲 2 / Power5 → 周囲 3
 * blastLevel 未取得なら 0。半径は calculateBlastRadius 側でレベルが効く。
 */
export function calculateBlastDamage(blastLevel: number, bulletDamage: number): number {
  if (blastLevel <= BLAST_LEVEL_START) {
    return 0
  }
  const safeBulletDamage = Math.max(0, bulletDamage)
  // Python: math.ceil(damage / 2) に相当
  return Math.ceil(safeBulletDamage / 2)
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
// Move / Speed の低い方 − 1 が Pierce（両方 Lv2 以上のとき）
// 例: Move2&Speed2→Pierce1 / Move3&Speed3→Pierce2
export const PIERCE_AUTO_SYNC_MIN_LEVEL = MOVE_LEVEL_START + 1

/**
 * Move と Speed から Pierce レベルを求める。
 * 両方とも 2 以上のとき: Pierce = 低い方 − 1（初回は必ず Lv1）
 */
export function calculatePierceLevelFromMoveAndSpeed(
  moveLevel: number,
  speedLevel: number,
): number {
  const lowerLevel = Math.min(moveLevel, speedLevel)
  if (lowerLevel < PIERCE_AUTO_SYNC_MIN_LEVEL) {
    return PIERCE_LEVEL_START
  }
  return lowerLevel - 1
}
// Power / Range の低い方 − 1 が Blast（両方 Lv2 以上のとき）
// 例: Power2&Range2→Blast1 / Power3&Range3→Blast2
export const BLAST_AUTO_SYNC_MIN_LEVEL = RANGE_LEVEL_START + 1

/**
 * Power と Range から Blast レベルを求める。
 * 両方とも 2 以上のとき: Blast = 低い方 − 1
 */
export function calculateBlastLevelFromPowerAndRange(
  powerLevel: number,
  rangeLevel: number,
): number {
  const lowerLevel = Math.min(powerLevel, rangeLevel)
  if (lowerLevel < BLAST_AUTO_SYNC_MIN_LEVEL) {
    return BLAST_LEVEL_START
  }
  return lowerLevel - 1
}
// Power / Speed / Pickup の低い方 − 1 が Ricochet（3つとも Lv2 以上のとき）
// 例: 全部2→Ricochet1 / 全部3→Ricochet2
export const RICOCHET_AUTO_SYNC_MIN_LEVEL = FIRE_RATE_LEVEL_START + 1

/**
 * Power・Speed・Pickup から Ricochet レベルを求める。
 * 3つとも 2 以上のとき: Ricochet = 低い方 − 1
 */
export function calculateRicochetLevelFromPowerSpeedAndPickup(
  powerLevel: number,
  speedLevel: number,
  magnetLevel: number,
): number {
  const lowerLevel = Math.min(powerLevel, speedLevel, magnetLevel)
  if (lowerLevel < RICOCHET_AUTO_SYNC_MIN_LEVEL) {
    return RICOCHET_LEVEL_START
  }
  return lowerLevel - 1
}

// --- 撃破・被弾フラッシュ演出 ---
// 撃破は playEnemyDefeatFadeOut（Enemy.ts）の tween フェードのみ使う
export const ENEMY_DEFEAT_FADE_DURATION_MS = 140
export const ENEMY_DEFEAT_SCALE_TO = 1.35
export const PLAYER_HURT_FLASH_DURATION_MS = 120
export const PLAYER_HURT_FLASH_COLOR = 0xff4444
export const PLAYER_HURT_FLASH_ALPHA = 0.35

// --- 盾・装甲で通常弾を防いだときのアイコン演出 ---

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

// --- 風属性の切り裂き（弾が敵に当たったときのヒット演出）---
// 爪でひっかいたような平行線。本数・葉の数はパワー（ダメージ）で増える
export const WIND_SLASH_COLOR = 0xa5f3fc
export const WIND_SLASH_COLOR_INNER = 0xffffff
export const WIND_SLASH_OUTLINE_COLOR = 0x000000
export const WIND_SLASH_DURATION_MS = 260
export const WIND_SLASH_LENGTH = 36 * WORLD_ENTITY_SCALE
export const WIND_SLASH_LINE_WIDTH = 4.5 * WORLD_ENTITY_SCALE
export const WIND_SLASH_LINE_SPACING = 7 * WORLD_ENTITY_SCALE
export const WIND_SLASH_DEPTH = 58
// 線の本数上限（パワー1→1本, 2→2本, 3以上→3本）
export const WIND_SLASH_LINE_COUNT_MAX = 3
// 葉の枚数: パワー1→2枚, 2→4枚, 3以上→6枚（= 本数 × この倍率）
export const WIND_SLASH_LEAF_PER_LINE = 2
export const WIND_SLASH_LEAF_COLOR = 0x86efac
export const WIND_SLASH_LEAF_COLOR_DARK = 0x4ade80
export const WIND_SLASH_LEAF_DURATION_MS = 420
export const WIND_SLASH_LEAF_SPREAD = 28 * WORLD_ENTITY_SCALE
export const WIND_SLASH_LEAF_FLOAT_UP = 18 * WORLD_ENTITY_SCALE
export const WIND_SLASH_LEAF_SIZE = 8 * WORLD_ENTITY_SCALE
// パワーが1上がるごとの見た目拡大（長さ・太さ・葉の飛び）
export const WIND_SLASH_SIZE_SCALE_PER_POWER = 0.18
export const WIND_SLASH_SIZE_SCALE_MAX = 1.55
