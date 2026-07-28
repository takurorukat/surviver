// constants/audio.ts
// SFX / BGM のキー・パス・音量

export const BGM_ENABLED_STORAGE_KEY = 'survivor-bgm-enabled-v2'

// --- 効果音 ---
// 発射・ヒット・撃破・クリア・コイン・被弾などは外部 OGG（SoundFont レンダー）。
export const SFX_KEY_ENEMY_DEFEAT = 'sfx-enemy-defeat'
export const SFX_PATH_ENEMY_DEFEAT =
  'assets/audio/library/kenney/enemy_defeat_candidate.ogg'
export const SFX_KEY_ENEMY_HIT = 'sfx-enemy-hit'
export const SFX_PATH_ENEMY_HIT = 'assets/audio/library/kenney/enemy_hit_candidate.ogg'
export const SFX_KEY_ENEMY_BLOCKED = 'sfx-enemy-blocked'
export const SFX_PATH_ENEMY_BLOCKED = 'assets/audio/library/kenney/blocked_metal_candidate.ogg'
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
export const SFX_PATH_PLAYER_HIT_EARTH = 'assets/audio/library/kenney/earth_hit_candidate.ogg'
export const SFX_KEY_GAME_OVER = 'sfx-game-over'
export const SFX_PATH_GAME_OVER = 'assets/audio/game_over.ogg'
export const SFX_KEY_COIN_PICKUP = 'sfx-coin-pickup'
export const SFX_PATH_COIN_PICKUP = 'assets/audio/library/kenney/coin_pickup_candidate.ogg'
export const SFX_KEY_PLAYER_HURT = 'sfx-player-hurt'
export const SFX_PATH_PLAYER_HURT = 'assets/audio/player_hurt.ogg'
export const SFX_KEY_LEVEL_UP = 'sfx-level-up'
export const SFX_PATH_LEVEL_UP = 'assets/audio/library/kenney/level_up_candidate.ogg'
export const SFX_KEY_STAGE_CLEAR = 'sfx-stage-clear'
export const SFX_PATH_STAGE_CLEAR = 'assets/audio/stage_clear.ogg'
// エリアクリア用ジングル（Ninja Adventure: LevelUp2）
export const SFX_KEY_AREA_CLEAR = 'sfx-area-clear'
export const SFX_PATH_AREA_CLEAR = 'assets/audio/area_clear.ogg'
export const SFX_KEY_MENU_MOVE = 'sfx-menu-move'
export const SFX_PATH_MENU_MOVE = 'assets/audio/library/kenney/menu_move_candidate.ogg'
export const SFX_KEY_SHOP_PURCHASE = 'sfx-shop-purchase'
export const SFX_PATH_SHOP_PURCHASE = 'assets/audio/library/kenney/purchase_candidate.ogg'
export const SFX_KEY_MENU_CANCEL = 'sfx-menu-cancel'
export const SFX_PATH_MENU_CANCEL = 'assets/audio/library/kenney/menu_cancel_candidate.ogg'
// Orbiting Orb（氷）: Tone.js オフライン生成
export const SFX_KEY_ORBITING_ORB_OBTAIN = 'sfx-orbiting-orb-obtain'
export const SFX_PATH_ORBITING_ORB_OBTAIN = 'assets/audio/orbiting_orb_obtain.ogg'
export const SFX_KEY_ORBITING_ORB_HIT = 'sfx-orbiting-orb-hit'
export const SFX_PATH_ORBITING_ORB_HIT = 'assets/audio/orbiting_orb_hit.ogg'
export const SFX_KEY_ORBITING_ORB_SHATTER = 'sfx-orbiting-orb-shatter'
export const SFX_PATH_ORBITING_ORB_SHATTER = 'assets/audio/orbiting_orb_shatter.ogg'
/** Orbiting Orb 命中・迎撃 SE の最短間隔（高頻度防止） */
export const ORBITING_ORB_HIT_SFX_COOLDOWN_MS = 70
export const ORBITING_ORB_SHATTER_SFX_COOLDOWN_MS = 55
/** Power 発射・敵撃破の最短間隔（高頻度防止・他SEへは影響しない） */
export const PLAYER_FIRE_POWER_SFX_COOLDOWN_MS = 55
export const ENEMY_DEFEAT_SFX_COOLDOWN_MS = 60
export const COIN_PICKUP_SFX_COOLDOWN_MS = 60
export const SFX_VOLUME = 0.35

// --- BGM（ループ再生）---
// 仮採用: CC0 Loop Pack。全エリアで同一作者・同一ループ設計のセットを使う。
export const BGM_KEY = 'bgm'
export const BGM_PATHS = ['assets/audio/library/cc0-loop-pack/plains.ogg']
// 外部ループBGMは音圧が高いため、従来値の60%へ下げる。
export const BGM_VOLUME = 0.162
export const FOREST_BGM_KEY = 'bgm-forest'
export const FOREST_BGM_PATH = 'assets/audio/library/cc0-loop-pack/forest.ogg'
// Fire Volcano BGM（game_music_generator の volcano テーマ）
export const VOLCANO_BGM_KEY = 'bgm-volcano'
export const VOLCANO_BGM_PATH = 'assets/audio/library/cc0-loop-pack/volcano.ogg'
// Earth Dungeon BGM（game_music_generator の dungeon テーマ / area id: ruins）
export const RUINS_BGM_KEY = 'bgm-ruins'
export const RUINS_BGM_PATH = 'assets/audio/library/cc0-loop-pack/ruins.ogg'
// エリアクリア用ジングル（Ninja Adventure: LevelUp2）。ループしない
export const AREA_CLEAR_BGM_KEY = 'bgm-area-clear'
export const AREA_CLEAR_BGM_PATH = 'assets/audio/area_clear_bgm.ogg'
export const TITLE_BGM_KEY = 'bgm-title'
export const TITLE_BGM_PATH = 'assets/audio/library/cc0-loop-pack/title.ogg'
// 元の曲が大きいため、戦闘BGMの半分の音量にする
export const TITLE_BGM_VOLUME = BGM_VOLUME / 2
