// constants/enemies.ts
// 敵種別の HP・速度・スプライト・スポーン関連

import { WORLD_ENTITY_SCALE } from './layout'
import { PLAYER_ATTACK_RANGE, PLAYER_SPEED } from './combat'

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
// true のとき melee / toughMelee / mushroom / earthSlime / earthRock / earthSkeleton / spiritFire / spiritThunder / burningTree / ashKnight / chaosElemental / stump / beetle / branch / gravestone / ranged に BreathingSprite を付ける
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
// Earth Dungeon Stage1 の土スライム（ステータスは緑スライムと同じ）
export const ENEMY_EARTH_SLIME_BREATH_SPRITE_KEY = 'enemy-earth-slime-breath'
export const ENEMY_EARTH_SLIME_BREATH_SPRITE_PATH = 'assets/sprites/enemy_earth_slime_breath.png'
// Earth Dungeon Stage2 の岩敵（HP5・やや遅い・最初の1発ブロック・小石弾）
export const ENEMY_EARTH_ROCK_BREATH_SPRITE_KEY = 'enemy-earth-rock-breath'
export const ENEMY_EARTH_ROCK_BREATH_SPRITE_PATH = 'assets/sprites/enemy_earth_rock_breath.png'
// Earth Dungeon Stage3 のスケルトン（HP10・カブトムシと同じ突進・経験値2倍）
export const ENEMY_EARTH_SKELETON_BREATH_SPRITE_KEY = 'enemy-earth-skeleton-breath'
export const ENEMY_EARTH_SKELETON_BREATH_SPRITE_PATH =
  'assets/sprites/enemy_earth_skeleton_breath.png'
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
// Earth Dungeon Stage1 土スライムは 1.5 倍（見た目・当たり判定）
export const ENEMY_EARTH_SLIME_SIZE_SCALE = 1.5
export const ENEMY_EARTH_SLIME_WIDTH = ENEMY_WIDTH * ENEMY_EARTH_SLIME_SIZE_SCALE
export const ENEMY_EARTH_SLIME_HEIGHT = ENEMY_HEIGHT * ENEMY_EARTH_SLIME_SIZE_SCALE
export const ENEMY_EARTH_SLIME_RADIUS = ENEMY_RADIUS * ENEMY_EARTH_SLIME_SIZE_SCALE
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
// Earth Dungeon Stage3 スケルトンはカブトムシと同じサイズ倍率
export const ENEMY_EARTH_SKELETON_SIZE_SCALE = ENEMY_BEETLE_SIZE_SCALE
export const ENEMY_EARTH_SKELETON_WIDTH = ENEMY_WIDTH * ENEMY_EARTH_SKELETON_SIZE_SCALE
export const ENEMY_EARTH_SKELETON_HEIGHT = ENEMY_HEIGHT * ENEMY_EARTH_SKELETON_SIZE_SCALE
export const ENEMY_EARTH_SKELETON_RADIUS = ENEMY_RADIUS * ENEMY_EARTH_SKELETON_SIZE_SCALE
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
export const ENEMY_EARTH_SLIME_BREATH_DISPLAY_HEIGHT = ENEMY_EARTH_SLIME_HEIGHT
export const ENEMY_EARTH_ROCK_BREATH_DISPLAY_HEIGHT = ENEMY_HEIGHT * 1.5
export const ENEMY_EARTH_SKELETON_BREATH_DISPLAY_HEIGHT = ENEMY_EARTH_SKELETON_HEIGHT
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
// プレイヤーも敵と同じ黒枠＋呼吸パラメータ
export const PLAYER_BREATH_OUTLINE_SCALE = ENEMY_SLIME_BREATH_OUTLINE_SCALE
export const PLAYER_BREATH_SCALE_Y_MAX = ENEMY_SLIME_BREATH_SCALE_Y_MAX
export const PLAYER_BREATH_SCALE_Y_MIN = ENEMY_SLIME_BREATH_SCALE_Y_MIN
export const PLAYER_BREATH_DURATION_MS = ENEMY_SLIME_BREATH_DURATION_MS
// 泥スライム・キノコ・切り株・蜂も緑スライムと同じ呼吸パラメータを使う
export const ENEMY_SLIME_MUD_BREATH_OUTLINE_SCALE = ENEMY_SLIME_BREATH_OUTLINE_SCALE
export const ENEMY_SLIME_MUD_BREATH_SCALE_Y_MAX = ENEMY_SLIME_BREATH_SCALE_Y_MAX
export const ENEMY_SLIME_MUD_BREATH_SCALE_Y_MIN = ENEMY_SLIME_BREATH_SCALE_Y_MIN
export const ENEMY_SLIME_MUD_BREATH_DURATION_MS = ENEMY_SLIME_BREATH_DURATION_MS
export const ENEMY_MUSHROOM_BREATH_OUTLINE_SCALE = ENEMY_SLIME_BREATH_OUTLINE_SCALE
export const ENEMY_MUSHROOM_BREATH_SCALE_Y_MAX = ENEMY_SLIME_BREATH_SCALE_Y_MAX
export const ENEMY_MUSHROOM_BREATH_SCALE_Y_MIN = ENEMY_SLIME_BREATH_SCALE_Y_MIN
export const ENEMY_MUSHROOM_BREATH_DURATION_MS = ENEMY_SLIME_BREATH_DURATION_MS
// 土スライムも緑スライムと同じ呼吸パラメータ
export const ENEMY_EARTH_SLIME_BREATH_OUTLINE_SCALE = ENEMY_SLIME_BREATH_OUTLINE_SCALE
export const ENEMY_EARTH_SLIME_BREATH_SCALE_Y_MAX = ENEMY_SLIME_BREATH_SCALE_Y_MAX
export const ENEMY_EARTH_SLIME_BREATH_SCALE_Y_MIN = ENEMY_SLIME_BREATH_SCALE_Y_MIN
export const ENEMY_EARTH_SLIME_BREATH_DURATION_MS = ENEMY_SLIME_BREATH_DURATION_MS
export const ENEMY_EARTH_SLIME_COLOR = 0xd4a574
// 岩敵も緑スライムと同じ呼吸パラメータ
export const ENEMY_EARTH_ROCK_BREATH_OUTLINE_SCALE = ENEMY_SLIME_BREATH_OUTLINE_SCALE
export const ENEMY_EARTH_ROCK_BREATH_SCALE_Y_MAX = ENEMY_SLIME_BREATH_SCALE_Y_MAX
export const ENEMY_EARTH_ROCK_BREATH_SCALE_Y_MIN = ENEMY_SLIME_BREATH_SCALE_Y_MIN
export const ENEMY_EARTH_ROCK_BREATH_DURATION_MS = ENEMY_SLIME_BREATH_DURATION_MS
export const ENEMY_EARTH_ROCK_COLOR = 0x78716c
export const ENEMY_EARTH_ROCK_HP = 5
export const ENEMY_EARTH_ROCK_SPEED_FACTOR = 0.85
export const ENEMY_EARTH_ROCK_BLOCK_HIT_COUNT = 1
export const ENEMY_EARTH_ROCK_PEBBLE_INTERVAL_MS = 5000
export const ENEMY_EARTH_ROCK_WIDTH = ENEMY_WIDTH * 1.5
export const ENEMY_EARTH_ROCK_HEIGHT = ENEMY_HEIGHT * 1.5
export const ENEMY_EARTH_ROCK_RADIUS = ENEMY_RADIUS * 1.5
// 小石弾（コード生成テクスチャ）
export const ENEMY_PEBBLE_BULLET_TEXTURE_KEY = 'enemy-pebble-bullet'
export const ENEMY_PEBBLE_BULLET_SIZE = 10 * WORLD_ENTITY_SCALE
export const ENEMY_PEBBLE_BULLET_RADIUS = 4 * WORLD_ENTITY_SCALE
export const ENEMY_PEBBLE_BULLET_FILL_COLOR = 0x9ca3af
export const ENEMY_PEBBLE_BULLET_HIGHLIGHT_COLOR = 0xd1d5db
export const ENEMY_PEBBLE_BULLET_SHADOW_COLOR = 0x57534e
export const ENEMY_PEBBLE_BULLET_OUTLINE_COLOR = 0x000000
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
export const ENEMY_CHAOS_ELEMENTAL_HP = 150
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
// スケルトンもカブトムシと同じ呼吸パラメータ
export const ENEMY_EARTH_SKELETON_BREATH_OUTLINE_SCALE = ENEMY_BEETLE_BREATH_OUTLINE_SCALE
export const ENEMY_EARTH_SKELETON_BREATH_SCALE_Y_MAX = ENEMY_BEETLE_BREATH_SCALE_Y_MAX
export const ENEMY_EARTH_SKELETON_BREATH_SCALE_Y_MIN = ENEMY_BEETLE_BREATH_SCALE_Y_MIN
export const ENEMY_EARTH_SKELETON_BREATH_DURATION_MS = ENEMY_BEETLE_BREATH_DURATION_MS
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
// Earth Dungeon Stage3 スケルトン（突進はカブトムシと同一、HP10、経験値2倍）
export const ENEMY_EARTH_SKELETON_HP = 10
export const ENEMY_EARTH_SKELETON_XP_DROP_MULTIPLIER = ENEMY_BEETLE_XP_DROP_MULTIPLIER
export const ENEMY_EARTH_SKELETON_COLOR = 0xe7e5e4
// Ruins Stage3 は Forest Stage3 より出現を多めにする
export const RUINS_STAGE3_SPAWN_COUNT_FACTOR = 1.4
// ばらけスポーン時、スポーン地点同士の最短距離
export const ENEMY_SPAWN_MIN_DISTANCE_BETWEEN = 72 * WORLD_ENTITY_SCALE
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
// 難易度調整: 旧 0.38 の約 1.2 倍
export const FOREST_STAGE5_SPAWN_COUNT_FACTOR = 0.456
export const ENEMY_BRANCH_COLOR = 0xa16207
// 枝がカブトムシを出す間隔（少し余裕を持たせる）
export const ENEMY_BRANCH_BEETLE_SPAWN_INTERVAL_MS = 1500
// 枝の隣にカブトムシを出す距離
export const ENEMY_BRANCH_BEETLE_SPAWN_OFFSET = 28 * WORLD_ENTITY_SCALE
// Forest Stage5 の墓石（動かない・一定間隔で切り株／枝を出す）
export const ENEMY_GRAVESTONE_BREATH_SPRITE_KEY = 'enemy-gravestone-breath'
export const ENEMY_GRAVESTONE_BREATH_SPRITE_PATH = 'assets/sprites/enemy_gravestone_breath.png'
export const ENEMY_GRAVESTONE_BREATH_DISPLAY_HEIGHT = 32 * WORLD_ENTITY_SCALE
export const ENEMY_GRAVESTONE_BREATH_OUTLINE_SCALE = ENEMY_SLIME_BREATH_OUTLINE_SCALE
export const ENEMY_GRAVESTONE_BREATH_SCALE_Y_MAX = ENEMY_SLIME_BREATH_SCALE_Y_MAX
export const ENEMY_GRAVESTONE_BREATH_SCALE_Y_MIN = ENEMY_SLIME_BREATH_SCALE_Y_MIN
export const ENEMY_GRAVESTONE_BREATH_DURATION_MS = ENEMY_SLIME_BREATH_DURATION_MS
export const ENEMY_GRAVESTONE_HP = 180 // 旧 120 の 1.5 倍
export const ENEMY_GRAVESTONE_XP_DROP_MULTIPLIER = 10
export const ENEMY_GRAVESTONE_COLOR = 0x6b7280
export const ENEMY_GRAVESTONE_SPAWN_INTERVAL_MS = 4000
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
// Ruins Stage1 の Stone Guard（遅い基本追跡。特殊攻撃・無敵・弾・召喚なし）
// HP は通常近接の基準(2)より少し高い固定値。速度は緑スライムより遅い。
export const ENEMY_STONE_GUARD_HP = 3
export const ENEMY_STONE_GUARD_SPEED_FACTOR = 0.7
export const ENEMY_STONE_GUARD_COLOR = 0x78716c
// Stage1 の1パックあたり出現数（既存 Stage1–2 パックと同数）
export const ENEMY_STONE_GUARD_PACK_SIZE = 3
// 想定火力が上がっても HP は抑えめ（群れを貫通でなぎ倒しやすくする）
export const ENEMY_HP_POWER_SCALE = 0.45
// 難易度は「想定プレイヤー成長」に合わせる
// 想定: 1ステージあたり約 1.25 回レベルアップし、
// 弾の強さ / 連射 / 射程を混ぜると火力がレベル1回あたり約 +35%
export const EXPECTED_LEVEL_UPS_PER_STAGE = 1.25
export const EXPECTED_POWER_GROWTH_PER_LEVEL_UP = 0.35
// 移動速度はプレイヤーよりゆっくり伸ばす
export const ENEMY_SPEED_GROWTH_PER_STAGE = 0.07
