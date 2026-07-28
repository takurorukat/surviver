// constants/assets.ts
// 敵・エリア以外のスプライト等アセットパス

import { WORLD_ENTITY_SCALE } from './layout'

export const UI_LOCK_ICON_KEY = 'ui-lock-icon'
export const UI_LOCK_ICON_PATH = 'assets/sprites/ui_lock_icon.png'
/** Credits: created by ROSSO ARGINE ロゴ（添付 PNG） */
export const CREDITS_ROSSO_ARGINE_LOGO_KEY = 'credits-rosso-argine'
export const CREDITS_ROSSO_ARGINE_LOGO_PATH = 'assets/images/credits_rosso_argine.png'
/** Credits パネル内の表示幅（元画像 300×150） */
export const CREDITS_ROSSO_ARGINE_LOGO_DISPLAY_WIDTH = 220
// --- プレイヤー見た目（静止絵3コマ。歩行アニメなし）---
// コマ0=正面、コマ1=右向き横顔（左は flipX）、コマ2=背中
// 動きは敵と同じ黒枠＋呼吸だけ
export const PLAYER_WALK_SPRITE_KEY = 'player-walk'
export const PLAYER_WALK_SPRITE_PATH = 'assets/sprites/player_walk.png'
export const PLAYER_WALK_FRAME_SIZE = 128
export const PLAYER_FACING_FRAME_DOWN = 0
export const PLAYER_FACING_FRAME_SIDE = 1
export const PLAYER_FACING_FRAME_UP = 2
export const PLAYER_WALK_DISPLAY_SIZE = 36 * WORLD_ENTITY_SCALE
export const PLAYER_WALK_DISPLAY_SCALE_X = 1.05
export const ENTITY_OUTLINE_COLOR = 0x000000
export const ENTITY_OUTLINE_WIDTH = 1 * WORLD_ENTITY_SCALE
export const GOLD_COIN_SPRITE_KEY = 'gold-coin'
export const GOLD_COIN_SPRITE_PATH = 'assets/sprites/gold_coin.png'
export const GOLD_COIN_FRAME_SIZE = 10
export const GOLD_COIN_FRAME_COUNT = 4
export const GOLD_COIN_ANIM_KEY = 'gold-coin-spin'
export const GOLD_COIN_ANIM_FRAME_RATE = 10
export const GOLD_COIN_DISPLAY_SIZE = 20 * WORLD_ENTITY_SCALE
export const GOLD_COIN_HITBOX_SIZE = 14 * WORLD_ENTITY_SCALE
export const ENEMY_BLOCKED_ICON_KEY = 'enemy-blocked-shield'
export const ENEMY_BLOCKED_ICON_PATH = 'assets/sprites/enemy_blocked_shield.png'
export const ENEMY_BLOCKED_ICON_SIZE = 26 * WORLD_ENTITY_SCALE
export const ENEMY_BLOCKED_ICON_POP_MS = 80
export const ENEMY_BLOCKED_ICON_FADE_MS = 180
export const ENEMY_BLOCKED_ICON_FLOAT_UP = 10 * WORLD_ENTITY_SCALE
export const ENEMY_BLOCKED_ICON_DEPTH = 65
export const WIND_SLASH_LEAF_TEXTURE_KEY = 'wind-slash-leaf'
