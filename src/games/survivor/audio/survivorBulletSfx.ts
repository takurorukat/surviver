/**
 * Survivor 固有: 属性弾スタイル → SFX キー対応。
 */
import {
  SFX_KEY_PLAYER_FIRE_EARTH,
  SFX_KEY_PLAYER_FIRE_FIRE,
  SFX_KEY_PLAYER_FIRE_POWER,
  SFX_KEY_PLAYER_FIRE_WATER,
  SFX_KEY_PLAYER_FIRE_WIND,
  SFX_KEY_PLAYER_HIT_EARTH,
  SFX_KEY_PLAYER_HIT_FIRE,
  SFX_KEY_PLAYER_HIT_POWER,
  SFX_KEY_PLAYER_HIT_WATER,
  SFX_KEY_PLAYER_HIT_WIND,
} from '../GameConstants'
import type { PlayerBulletStyle } from '../objects/PlayerBullet'

export function getSurvivorFireSfxKey(bulletStyle: PlayerBulletStyle): string {
  if (bulletStyle === 'windVortex') {
    return SFX_KEY_PLAYER_FIRE_WIND
  }
  if (bulletStyle === 'waterOrb') {
    return SFX_KEY_PLAYER_FIRE_WATER
  }
  if (bulletStyle === 'fireOrb') {
    return SFX_KEY_PLAYER_FIRE_FIRE
  }
  if (bulletStyle === 'earthOrb') {
    return SFX_KEY_PLAYER_FIRE_EARTH
  }
  return SFX_KEY_PLAYER_FIRE_POWER
}

export function getSurvivorHitSfxKey(bulletStyle: PlayerBulletStyle): string {
  if (bulletStyle === 'windVortex') {
    return SFX_KEY_PLAYER_HIT_WIND
  }
  if (bulletStyle === 'waterOrb') {
    return SFX_KEY_PLAYER_HIT_WATER
  }
  if (bulletStyle === 'fireOrb') {
    return SFX_KEY_PLAYER_HIT_FIRE
  }
  if (bulletStyle === 'earthOrb') {
    return SFX_KEY_PLAYER_HIT_EARTH
  }
  return SFX_KEY_PLAYER_HIT_POWER
}
