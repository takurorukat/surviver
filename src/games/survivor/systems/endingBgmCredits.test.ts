import { describe, expect, it } from 'vitest'
import {
  BGM_KEY,
  BGM_PATHS,
  ENDING_FINAL_ASCENT_BGM_VOLUME,
  ENDING_TEASER_TO_TITLE_BGM_FADE_MS,
  ENDING_VICTORY_BGM_VOLUME,
  ENDING_VICTORY_TO_TEASER_BGM_FADE_MS,
  RUINS_BGM_KEY,
  RUINS_BGM_PATH,
  SFX_KEY_AREA_CLEAR,
  SFX_PATH_AREA_CLEAR,
  SETTINGS_CREDITS_BODY,
} from '../GameConstants'
import { SURVIVOR_ASSET_MANIFEST } from '../constants/assetManifest'

describe('Ending BGM constants', () => {
  it('Victory は Plains BGM（BGM_KEY）を再利用し音量 0.11', () => {
    expect(BGM_KEY).toBe('bgm')
    expect(BGM_PATHS[0]).toContain('cc0-loop-pack/plains.ogg')
    expect(ENDING_VICTORY_BGM_VOLUME).toBe(0.11)
  })

  it('Final Ascent は Ruins BGM を再利用し音量 0.09', () => {
    expect(RUINS_BGM_KEY).toBe('bgm-ruins')
    expect(RUINS_BGM_PATH).toContain('cc0-loop-pack/ruins.ogg')
    expect(ENDING_FINAL_ASCENT_BGM_VOLUME).toBe(0.09)
  })

  it('フェード時間が仕様どおり', () => {
    expect(ENDING_VICTORY_TO_TEASER_BGM_FADE_MS).toBe(400)
    expect(ENDING_TEASER_TO_TITLE_BGM_FADE_MS).toBe(600)
  })

  it('Victory と Final Ascent の曲キーは異なる', () => {
    expect(BGM_KEY).not.toBe(RUINS_BGM_KEY)
  })
})

describe('Music Credits', () => {
  it('Pixel-Boy / Ninja Adventure の Music 表記が消えている', () => {
    expect(SETTINGS_CREDITS_BODY.includes('Pixel-Boy')).toBe(false)
    expect(SETTINGS_CREDITS_BODY.includes('Ninja Adventure')).toBe(false)
    expect(SETTINGS_CREDITS_BODY.includes('LevelUp2')).toBe(false)
  })

  it('obscure music (Gichco) と OpenGameArt が表示される（UIに CC0 は出さない）', () => {
    expect(SETTINGS_CREDITS_BODY.includes('obscure music (Gichco)')).toBe(true)
    expect(SETTINGS_CREDITS_BODY.includes('Music by')).toBe(true)
    expect(SETTINGS_CREDITS_BODY.includes('CC0')).toBe(false)
    expect(SETTINGS_CREDITS_BODY.includes('OpenGameArt')).toBe(true)
    expect(SETTINGS_CREDITS_BODY.includes('https://')).toBe(false)
    expect(SETTINGS_CREDITS_BODY.includes('TMFactory')).toBe(false)
  })
})

describe('area_clear_bgm Runtime 除外', () => {
  it('manifest に bgm-area-clear / area_clear_bgm.ogg がない', () => {
    const audioEntries = SURVIVOR_ASSET_MANIFEST.audio ?? []
    for (let index = 0; index < audioEntries.length; index++) {
      const entry = audioEntries[index]
      expect(entry.key).not.toBe('bgm-area-clear')
      const paths = Array.isArray(entry.paths) ? entry.paths : [entry.paths]
      for (let pathIndex = 0; pathIndex < paths.length; pathIndex++) {
        expect(String(paths[pathIndex]).includes('area_clear_bgm')).toBe(false)
      }
    }
  })

  it('Area Clear SFX（短い効果音）は維持される', () => {
    expect(SFX_KEY_AREA_CLEAR).toBe('sfx-area-clear')
    expect(SFX_PATH_AREA_CLEAR).toBe('assets/audio/area_clear.ogg')
    const audioEntries = SURVIVOR_ASSET_MANIFEST.audio ?? []
    const found = audioEntries.some((entry) => {
      return entry.key === SFX_KEY_AREA_CLEAR
    })
    expect(found).toBe(true)
  })
})
