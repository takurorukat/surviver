// constants/audio.ts
// SFX / BGM のキー・パス・音量

export const BGM_ENABLED_STORAGE_KEY = 'survivor-bgm-enabled-v2'

// --- 効果音 ---
// 発射・ヒット・撃破・クリア・コイン・被弾などは外部 OGG（SoundFont レンダー）。
export const SFX_KEY_ENEMY_DEFEAT = 'sfx-enemy-defeat'
export const SFX_PATH_ENEMY_DEFEAT = 'assets/audio/enemy_defeat.ogg'
export const SFX_KEY_ENEMY_HIT = 'sfx-enemy-hit'
export const SFX_PATH_ENEMY_HIT = 'assets/audio/enemy_hit.ogg'
export const SFX_KEY_ENEMY_BLOCKED = 'sfx-enemy-blocked'
export const SFX_PATH_ENEMY_BLOCKED = 'assets/audio/enemy_blocked.ogg'
export const SFX_KEY_PLAYER_FIRE = 'sfx-player-fire'
export const SFX_PATH_PLAYER_FIRE = 'assets/audio/player_fire.ogg'
// 属性弾: 発射 / ヒット（パワー・風・水・火・土）
export const SFX_KEY_PLAYER_FIRE_POWER = 'sfx-player-fire-power'
export const SFX_PATH_PLAYER_FIRE_POWER = 'assets/audio/player_fire_power.ogg'
export const SFX_KEY_PLAYER_HIT_POWER = 'sfx-player-hit-power'
export const SFX_PATH_PLAYER_HIT_POWER = 'assets/audio/player_hit_power.ogg'
export const SFX_KEY_PLAYER_FIRE_WIND = 'sfx-player-fire-wind'
export const SFX_PATH_PLAYER_FIRE_WIND = 'assets/audio/player_fire_wind.ogg'
export const SFX_KEY_PLAYER_HIT_WIND = 'sfx-player-hit-wind'
export const SFX_PATH_PLAYER_HIT_WIND = 'assets/audio/player_hit_wind.ogg'
export const SFX_KEY_PLAYER_FIRE_WATER = 'sfx-player-fire-water'
export const SFX_PATH_PLAYER_FIRE_WATER = 'assets/audio/player_fire_water.ogg'
export const SFX_KEY_PLAYER_HIT_WATER = 'sfx-player-hit-water'
export const SFX_PATH_PLAYER_HIT_WATER = 'assets/audio/player_hit_water.ogg'
export const SFX_KEY_PLAYER_FIRE_FIRE = 'sfx-player-fire-fire'
export const SFX_PATH_PLAYER_FIRE_FIRE = 'assets/audio/player_fire_fire.ogg'
export const SFX_KEY_PLAYER_HIT_FIRE = 'sfx-player-hit-fire'
export const SFX_PATH_PLAYER_HIT_FIRE = 'assets/audio/player_hit_fire.ogg'
export const SFX_KEY_PLAYER_FIRE_EARTH = 'sfx-player-fire-earth'
export const SFX_PATH_PLAYER_FIRE_EARTH = 'assets/audio/player_fire_earth.ogg'
export const SFX_KEY_PLAYER_HIT_EARTH = 'sfx-player-hit-earth'
export const SFX_PATH_PLAYER_HIT_EARTH = 'assets/audio/player_hit_earth.ogg'
export const SFX_KEY_GAME_OVER = 'sfx-game-over'
export const SFX_PATH_GAME_OVER = 'assets/audio/game_over.ogg'
export const SFX_KEY_COIN_PICKUP = 'sfx-coin-pickup'
export const SFX_PATH_COIN_PICKUP = 'assets/audio/coin_pickup.ogg'
export const SFX_KEY_PLAYER_HURT = 'sfx-player-hurt'
export const SFX_PATH_PLAYER_HURT = 'assets/audio/player_hurt.ogg'
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
// Fire Volcano BGM（game_music_generator の volcano テーマ）
export const VOLCANO_BGM_KEY = 'bgm-volcano'
export const VOLCANO_BGM_PATH = 'assets/audio/volcano_bgm.ogg'
// Earth Dungeon BGM（game_music_generator の dungeon テーマ / area id: ruins）
export const RUINS_BGM_KEY = 'bgm-ruins'
export const RUINS_BGM_PATH = 'assets/audio/ruins_bgm.ogg'
// エリアクリア用ジングル（Ninja Adventure: LevelUp2）。ループしない
export const AREA_CLEAR_BGM_KEY = 'bgm-area-clear'
export const AREA_CLEAR_BGM_PATH = 'assets/audio/area_clear_bgm.ogg'
export const TITLE_BGM_KEY = 'bgm-title'
export const TITLE_BGM_PATH = 'assets/audio/title_bgm.ogg'
// 元の曲が大きいため、戦闘BGMの半分の音量にする
export const TITLE_BGM_VOLUME = BGM_VOLUME / 2
