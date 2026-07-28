import { describe, expect, it } from 'vitest'
import {
  CREDITS_ROSSO_ARGINE_LOGO_KEY,
  CREDITS_ROSSO_ARGINE_LOGO_PATH,
  SETTINGS_CREDITS_CREATED_BY,
  SETTINGS_CREDITS_BODY,
} from '../GameConstants'
import { SURVIVOR_ASSET_MANIFEST } from '../constants/assetManifest'

describe('Credits ROSSO ARGINE logo', () => {
  it('created by 文言とロゴアセットが定義されている', () => {
    expect(SETTINGS_CREDITS_CREATED_BY).toBe('created by')
    expect(CREDITS_ROSSO_ARGINE_LOGO_KEY).toBe('credits-rosso-argine')
    expect(CREDITS_ROSSO_ARGINE_LOGO_PATH).toBe(
      'assets/images/credits_rosso_argine.png',
    )
    expect(SETTINGS_CREDITS_BODY.includes('TMFactory')).toBe(false)
  })

  it('manifest にロゴ画像が登録されている', () => {
    const images = SURVIVOR_ASSET_MANIFEST.images ?? []
    const found = images.some((entry) => {
      return (
        entry.key === CREDITS_ROSSO_ARGINE_LOGO_KEY &&
        entry.path === CREDITS_ROSSO_ARGINE_LOGO_PATH
      )
    })
    expect(found).toBe(true)
  })
})
