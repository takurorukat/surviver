import { describe, expect, it } from 'vitest'
import * as GameConstants from '../GameConstants'
import { SURVIVOR_ASSET_MANIFEST } from '../constants/assetManifest'
import {
  SFX_KEY_AREA_CLEAR,
  SFX_KEY_LEVEL_UP,
  SFX_KEY_PLAYER_FIRE,
  SFX_PATH_AREA_CLEAR,
  SFX_PATH_LEVEL_UP,
  SFX_PATH_PLAYER_FIRE,
} from '../constants/audio'

describe('Production Settings has no SFX Preview', () => {
  it('GameConstants に Preview 専用定数が無い', () => {
    const keys = Object.keys(GameConstants)
    expect(keys.includes('SFX_PREVIEW_DEPTH')).toBe(false)
    expect(keys.includes('SFX_PREVIEW_PANEL_WIDTH')).toBe(false)
    expect(keys.includes('SFX_CANDIDATE_DIR')).toBe(false)
  })

  it('Production manifest に Preview 候補パスが無い', () => {
    const audioEntries = SURVIVOR_ASSET_MANIFEST.audio ?? []
    for (const entry of audioEntries) {
      for (const audioPath of entry.paths) {
        expect(audioPath.includes('/candidates/')).toBe(false)
        expect(audioPath.includes('_softsynth_backup')).toBe(false)
        expect(audioPath.includes('sfx-preview')).toBe(false)
      }
    }
  })

  it('Runtime SFX の key と path が維持されている', () => {
    expect(SFX_KEY_PLAYER_FIRE).toBe('sfx-player-fire')
    expect(SFX_PATH_PLAYER_FIRE).toBe('assets/audio/player_fire.ogg')
    expect(SFX_KEY_LEVEL_UP).toBe('sfx-level-up')
    expect(SFX_PATH_LEVEL_UP).toBe(
      'assets/audio/library/kenney/level_up_candidate.ogg',
    )
    expect(SFX_KEY_AREA_CLEAR).toBe('sfx-area-clear')
    expect(SFX_PATH_AREA_CLEAR).toBe('assets/audio/area_clear.ogg')
  })
})
