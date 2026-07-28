/**
 * Survivor 固有の意味的 SFX Event ID → Runtime SFX キー対応。
 * SoundManager はキー再生のみ。ゲームイベントの識別はここ（と GameAudioSystem.playEvent）で行う。
 * Catalog / 音源パスは参照しない。キーの SSoT は constants/audio.ts。
 */
import {
  SFX_KEY_COIN_PICKUP,
  SFX_KEY_ENEMY_DEFEAT,
  SFX_KEY_LEVEL_UP,
  SFX_KEY_PLAYER_FIRE_POWER,
  SFX_KEY_PLAYER_HIT_POWER,
  SFX_KEY_PLAYER_HURT,
  SFX_PATH_ENEMY_DEFEAT,
  SFX_PATH_PLAYER_FIRE_POWER,
  SFX_PATH_PLAYER_HIT_POWER,
} from '../GameConstants'

export const SURVIVOR_SFX_EVENT_IDS = {
  PICKUP_XP_COLLECT: 'pickup.xp.collect',
  PICKUP_GOLD_COLLECT: 'pickup.gold.collect',
  PLAYER_DAMAGE_CONTACT: 'player.damage.contact',
  PLAYER_DAMAGE_PROJECTILE: 'player.damage.projectile',
  ENEMY_DEFEAT: 'enemy.defeat',
  PROGRESSION_LEVEL_UP_OPEN: 'progression.level_up.open',
  PROGRESSION_LEVEL_UP_CHOICE_CONFIRM: 'progression.level_up.choice_confirm',
  SKILL_POWER_CAST: 'skill.power.cast',
  SKILL_POWER_IMPACT: 'skill.power.impact',
} as const

export type SurvivorSfxEventId =
  (typeof SURVIVOR_SFX_EVENT_IDS)[keyof typeof SURVIVOR_SFX_EVENT_IDS]

/** Combat Core Workbench Phase 1 の3 Event（Catalog と対応） */
export const COMBAT_CORE_SFX_EVENT_IDS = [
  SURVIVOR_SFX_EVENT_IDS.SKILL_POWER_CAST,
  SURVIVOR_SFX_EVENT_IDS.SKILL_POWER_IMPACT,
  SURVIVOR_SFX_EVENT_IDS.ENEMY_DEFEAT,
] as const

export type CombatCoreSfxEventId = (typeof COMBAT_CORE_SFX_EVENT_IDS)[number]

/** Event ID → 既存 Runtime SFX キー。未登録 ID は型で拒否（暗黙 fallback なし）。 */
const SURVIVOR_SFX_EVENT_TO_KEY = {
  [SURVIVOR_SFX_EVENT_IDS.PICKUP_XP_COLLECT]: SFX_KEY_COIN_PICKUP,
  [SURVIVOR_SFX_EVENT_IDS.PICKUP_GOLD_COLLECT]: SFX_KEY_COIN_PICKUP,
  [SURVIVOR_SFX_EVENT_IDS.PLAYER_DAMAGE_CONTACT]: SFX_KEY_PLAYER_HURT,
  [SURVIVOR_SFX_EVENT_IDS.PLAYER_DAMAGE_PROJECTILE]: SFX_KEY_PLAYER_HURT,
  [SURVIVOR_SFX_EVENT_IDS.ENEMY_DEFEAT]: SFX_KEY_ENEMY_DEFEAT,
  [SURVIVOR_SFX_EVENT_IDS.PROGRESSION_LEVEL_UP_OPEN]: SFX_KEY_LEVEL_UP,
  [SURVIVOR_SFX_EVENT_IDS.PROGRESSION_LEVEL_UP_CHOICE_CONFIRM]: SFX_KEY_LEVEL_UP,
  [SURVIVOR_SFX_EVENT_IDS.SKILL_POWER_CAST]: SFX_KEY_PLAYER_FIRE_POWER,
  [SURVIVOR_SFX_EVENT_IDS.SKILL_POWER_IMPACT]: SFX_KEY_PLAYER_HIT_POWER,
} satisfies Record<SurvivorSfxEventId, string>

/**
 * Combat Core の Runtime ファイルパス（audio.ts の定数を参照するだけ）。
 * Catalog はこれを二重定義せず、Entry でも同じ定数を使う。
 */
const COMBAT_CORE_SFX_EVENT_TO_PATH: Record<CombatCoreSfxEventId, string> = {
  [SURVIVOR_SFX_EVENT_IDS.SKILL_POWER_CAST]: SFX_PATH_PLAYER_FIRE_POWER,
  [SURVIVOR_SFX_EVENT_IDS.SKILL_POWER_IMPACT]: SFX_PATH_PLAYER_HIT_POWER,
  [SURVIVOR_SFX_EVENT_IDS.ENEMY_DEFEAT]: SFX_PATH_ENEMY_DEFEAT,
}

/**
 * Event ID から Runtime SFX キーを返す。
 * 未登録 ID は型で拒否される（暗黙 fallback なし）。
 */
export function resolveSurvivorSfxEventKey(eventId: SurvivorSfxEventId): string {
  return SURVIVOR_SFX_EVENT_TO_KEY[eventId]
}

/** Combat Core Event の Runtime ファイルパスを返す（audio.ts SSoT）。 */
export function resolveCombatCoreSfxEventPath(eventId: CombatCoreSfxEventId): string {
  return COMBAT_CORE_SFX_EVENT_TO_PATH[eventId]
}

export function isSurvivorSfxEventId(value: string): value is SurvivorSfxEventId {
  const eventIds = Object.values(SURVIVOR_SFX_EVENT_IDS)
  for (let index = 0; index < eventIds.length; index++) {
    if (eventIds[index] === value) {
      return true
    }
  }
  return false
}

export function isCombatCoreSfxEventId(value: string): value is CombatCoreSfxEventId {
  for (let index = 0; index < COMBAT_CORE_SFX_EVENT_IDS.length; index++) {
    if (COMBAT_CORE_SFX_EVENT_IDS[index] === value) {
      return true
    }
  }
  return false
}
