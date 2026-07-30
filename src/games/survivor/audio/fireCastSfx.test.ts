import { describe, expect, it } from 'vitest'
import {
  SFX_KEY_PLAYER_FIRE_FIRE,
  SFX_KEY_PLAYER_FIRE_POWER,
  SFX_PATH_PLAYER_FIRE_EARTH,
  SFX_PATH_PLAYER_FIRE_FIRE,
  SFX_PATH_PLAYER_FIRE_POWER,
  SFX_PATH_PLAYER_FIRE_WATER,
  SFX_PATH_PLAYER_FIRE_WIND,
  SFX_PATH_PLAYER_HIT_FIRE,
} from '../GameConstants'
import { SURVIVOR_ASSET_MANIFEST } from '../constants/assetManifest'
import { getSurvivorFireSfxKey } from './survivorBulletSfx'

describe('XP Bonus fireOrb cast SFX', () => {
  it('fireOrbだけがFire発射キーを使う', () => {
    expect(getSurvivorFireSfxKey('fireOrb')).toBe(SFX_KEY_PLAYER_FIRE_FIRE)
    expect(getSurvivorFireSfxKey('powerOrb')).toBe(SFX_KEY_PLAYER_FIRE_POWER)
  })

  it('Fire発射キーはKenneyの正式Runtime音源をpreloadする', () => {
    expect(SFX_PATH_PLAYER_FIRE_FIRE).toBe(
      'assets/audio/library/kenney/player_fire_fire_kenney.ogg',
    )

    const fireEntry = SURVIVOR_ASSET_MANIFEST.audio?.find((entry) => {
      return entry.key === SFX_KEY_PLAYER_FIRE_FIRE
    })
    expect(fireEntry?.paths).toBe(SFX_PATH_PLAYER_FIRE_FIRE)
  })

  it('他属性の発射音とFire impact音は変更しない', () => {
    expect(SFX_PATH_PLAYER_FIRE_POWER).toBe('assets/audio/player_fire_power.ogg')
    expect(SFX_PATH_PLAYER_FIRE_WIND).toBe('assets/audio/player_fire_wind.ogg')
    expect(SFX_PATH_PLAYER_FIRE_WATER).toBe('assets/audio/player_fire_water.ogg')
    expect(SFX_PATH_PLAYER_FIRE_EARTH).toBe('assets/audio/player_fire_earth.ogg')
    expect(SFX_PATH_PLAYER_HIT_FIRE).toBe('assets/audio/player_hit_fire.ogg')
  })

  it('開発用候補パスをProduction manifestへ登録しない', () => {
    const audioEntries = SURVIVOR_ASSET_MANIFEST.audio ?? []
    for (let index = 0; index < audioEntries.length; index++) {
      const paths = Array.isArray(audioEntries[index].paths)
        ? audioEntries[index].paths
        : [audioEntries[index].paths]
      for (let pathIndex = 0; pathIndex < paths.length; pathIndex++) {
        expect(String(paths[pathIndex]).includes('/candidates/')).toBe(false)
        expect(String(paths[pathIndex]).includes('thrusterFire_')).toBe(false)
        expect(String(paths[pathIndex]).includes('laserSmall_')).toBe(false)
      }
    }
  })
})
