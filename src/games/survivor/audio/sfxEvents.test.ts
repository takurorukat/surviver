import { describe, expect, it } from 'vitest'
import {
  COMBAT_CORE_SFX_EVENT_IDS,
  isCombatCoreSfxEventId,
  isSurvivorSfxEventId,
  resolveCombatCoreSfxEventPath,
  resolveSurvivorSfxEventKey,
  SURVIVOR_SFX_EVENT_IDS,
  type SurvivorSfxEventId,
} from './sfxEvents'
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

describe('resolveSurvivorSfxEventKey', () => {
  it('Batch 1 + Combat Core の全 Event ID が既存 Runtime キーへ解決される', () => {
    const expectedByEvent: Record<SurvivorSfxEventId, string> = {
      [SURVIVOR_SFX_EVENT_IDS.PICKUP_XP_COLLECT]: SFX_KEY_COIN_PICKUP,
      [SURVIVOR_SFX_EVENT_IDS.PICKUP_GOLD_COLLECT]: SFX_KEY_COIN_PICKUP,
      [SURVIVOR_SFX_EVENT_IDS.PLAYER_DAMAGE_CONTACT]: SFX_KEY_PLAYER_HURT,
      [SURVIVOR_SFX_EVENT_IDS.PLAYER_DAMAGE_PROJECTILE]: SFX_KEY_PLAYER_HURT,
      [SURVIVOR_SFX_EVENT_IDS.ENEMY_DEFEAT]: SFX_KEY_ENEMY_DEFEAT,
      [SURVIVOR_SFX_EVENT_IDS.PROGRESSION_LEVEL_UP_OPEN]: SFX_KEY_LEVEL_UP,
      [SURVIVOR_SFX_EVENT_IDS.PROGRESSION_LEVEL_UP_CHOICE_CONFIRM]: SFX_KEY_LEVEL_UP,
      [SURVIVOR_SFX_EVENT_IDS.SKILL_POWER_CAST]: SFX_KEY_PLAYER_FIRE_POWER,
      [SURVIVOR_SFX_EVENT_IDS.SKILL_POWER_IMPACT]: SFX_KEY_PLAYER_HIT_POWER,
    }

    const eventIds = Object.values(SURVIVOR_SFX_EVENT_IDS)
    expect(eventIds).toHaveLength(9)

    for (const eventId of eventIds) {
      expect(resolveSurvivorSfxEventKey(eventId)).toBe(expectedByEvent[eventId])
    }
  })

  it('Combat Core 3 Event ID は互いに異なり、想定キー／パスへ解決される', () => {
    expect(SURVIVOR_SFX_EVENT_IDS.SKILL_POWER_CAST).not.toBe(
      SURVIVOR_SFX_EVENT_IDS.SKILL_POWER_IMPACT,
    )
    expect(SURVIVOR_SFX_EVENT_IDS.SKILL_POWER_CAST).not.toBe(
      SURVIVOR_SFX_EVENT_IDS.ENEMY_DEFEAT,
    )
    expect(SURVIVOR_SFX_EVENT_IDS.SKILL_POWER_IMPACT).not.toBe(
      SURVIVOR_SFX_EVENT_IDS.ENEMY_DEFEAT,
    )

    expect(resolveSurvivorSfxEventKey(SURVIVOR_SFX_EVENT_IDS.SKILL_POWER_CAST)).toBe(
      SFX_KEY_PLAYER_FIRE_POWER,
    )
    expect(resolveSurvivorSfxEventKey(SURVIVOR_SFX_EVENT_IDS.SKILL_POWER_IMPACT)).toBe(
      SFX_KEY_PLAYER_HIT_POWER,
    )
    expect(resolveSurvivorSfxEventKey(SURVIVOR_SFX_EVENT_IDS.ENEMY_DEFEAT)).toBe(
      SFX_KEY_ENEMY_DEFEAT,
    )

    expect(resolveCombatCoreSfxEventPath(SURVIVOR_SFX_EVENT_IDS.SKILL_POWER_CAST)).toBe(
      SFX_PATH_PLAYER_FIRE_POWER,
    )
    expect(resolveCombatCoreSfxEventPath(SURVIVOR_SFX_EVENT_IDS.SKILL_POWER_IMPACT)).toBe(
      SFX_PATH_PLAYER_HIT_POWER,
    )
    expect(resolveCombatCoreSfxEventPath(SURVIVOR_SFX_EVENT_IDS.ENEMY_DEFEAT)).toBe(
      SFX_PATH_ENEMY_DEFEAT,
    )
  })

  it('未登録文字列は Event ID として扱わない（暗黙 fallback なし）', () => {
    expect(isSurvivorSfxEventId('skill.power.cast')).toBe(true)
    expect(isSurvivorSfxEventId('not.a.real.event')).toBe(false)
    expect(isCombatCoreSfxEventId('enemy.defeat')).toBe(true)
    expect(isCombatCoreSfxEventId('pickup.xp.collect')).toBe(false)
    expect(COMBAT_CORE_SFX_EVENT_IDS).toHaveLength(3)
  })
})
