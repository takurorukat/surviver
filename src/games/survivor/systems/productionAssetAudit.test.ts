import { describe, expect, it } from 'vitest'
import { SURVIVOR_ASSET_MANIFEST } from '../constants/assetManifest'
import * as audio from '../constants/audio'
import {
  PLAYER_WALK_SPRITE_PATH,
  CREDITS_ROSSO_ARGINE_LOGO_PATH,
} from '../constants/assets'

/**
 * Production へ載せてはいけない開発用パスの回帰防止。
 * ファイルシステム API は使わず、定数／manifest のみを検査する。
 */
describe('Production asset exposure guards', () => {
  const forbiddenPublicAudio = [
    'physical_fire_candidate.ogg',
    'physical_hit_candidate.ogg',
    'blocked_candidate.ogg',
  ]

  it('未採用 Kenney 候補は audio 定数に無い', () => {
    const audioValues = Object.values(audio).map((value) => String(value))
    for (let index = 0; index < forbiddenPublicAudio.length; index++) {
      const name = forbiddenPublicAudio[index]
      for (let valueIndex = 0; valueIndex < audioValues.length; valueIndex++) {
        expect(audioValues[valueIndex].includes(name)).toBe(false)
      }
    }
  })

  it('Production manifest に未採用候補・Preview・旧prevスプライトが無い', () => {
    const audioEntries = SURVIVOR_ASSET_MANIFEST.audio ?? []
    for (let index = 0; index < audioEntries.length; index++) {
      const entry = audioEntries[index]
      const paths = Array.isArray(entry.paths) ? entry.paths : [entry.paths]
      for (let pathIndex = 0; pathIndex < paths.length; pathIndex++) {
        const pathText = String(paths[pathIndex])
        expect(pathText.includes('/candidates/')).toBe(false)
        expect(pathText.includes('sfx-preview')).toBe(false)
        expect(pathText.includes('_softsynth_backup')).toBe(false)
        for (let nameIndex = 0; nameIndex < forbiddenPublicAudio.length; nameIndex++) {
          expect(pathText.includes(forbiddenPublicAudio[nameIndex])).toBe(false)
        }
      }
    }

    const images = SURVIVOR_ASSET_MANIFEST.images ?? []
    for (let index = 0; index < images.length; index++) {
      const imagePath = images[index].path
      expect(imagePath.includes('player_walk_prev')).toBe(false)
      expect(imagePath.includes('player_walk_legacy')).toBe(false)
      expect(imagePath.includes('vite.svg')).toBe(false)
    }
  })

  it('Runtime 必須パスは現行どおり', () => {
    expect(PLAYER_WALK_SPRITE_PATH).toBe('assets/sprites/player_walk.png')
    expect(CREDITS_ROSSO_ARGINE_LOGO_PATH).toBe(
      'assets/images/credits_rosso_argine.png',
    )
    expect(audio.SFX_PATH_ENEMY_BLOCKED).toBe(
      'assets/audio/library/kenney/blocked_metal_candidate.ogg',
    )
  })
})
