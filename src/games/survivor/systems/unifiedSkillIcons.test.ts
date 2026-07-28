import { describe, expect, it } from 'vitest'
import {
  CORE_SKILL_ICON_ASSETS,
  CORE_SKILL_ICON_IDS,
  SETTINGS_CREDITS_BODY,
} from '../GameConstants'
import { SURVIVOR_ASSET_MANIFEST } from '../constants/assetManifest'

describe('unified seven skill icon assets', () => {
  it('全7ファイルを一意なSVG pathでmanifestへ登録する', () => {
    const images = SURVIVOR_ASSET_MANIFEST.images ?? []
    const imageByKey = new Map(images.map((image) => [image.key, image.path]))
    const registeredPaths: string[] = []

    for (const asset of CORE_SKILL_ICON_ASSETS) {
      expect(imageByKey.get(asset.key)).toBe(asset.path)
      expect(asset.path.startsWith('assets/icons/skills/unified/')).toBe(true)
      expect(asset.path.endsWith('.svg')).toBe(true)
      registeredPaths.push(asset.path)
    }
    expect(new Set(registeredPaths).size).toBe(7)
  })

  it('同一作者・同一ライセンスのCreditsを表示する', () => {
    expect(CORE_SKILL_ICON_IDS).toHaveLength(7)
    expect(SETTINGS_CREDITS_BODY).toContain('Icons by Lorc')
    expect(SETTINGS_CREDITS_BODY).toContain('game-icons.net')
    expect(SETTINGS_CREDITS_BODY).toContain('CC BY 3.0')
  })
})
