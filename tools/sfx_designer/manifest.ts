/**
 * SE ファイル名・用途・生成方式のマニフェスト定義。
 * generate.ts 実行時にも output/manifest.json へ実測結果付きで書き出される。
 */

import { SFX_PRESETS, PROTECTED_BGM_FILES, type SfxPreset } from './presets.ts'

export type ManifestEntry = {
  fileName: string
  id: string
  purpose: string
  category: SfxPreset['category']
  patch: string
  engine: 'tone-offline'
  formalPath: string
}

export const MANIFEST_ENTRIES: ManifestEntry[] = SFX_PRESETS.map((p) => ({
  fileName: `${p.id}.ogg`,
  id: p.id,
  purpose: p.purpose,
  category: p.category,
  patch: p.patch,
  engine: 'tone-offline',
  formalPath: `public/assets/audio/${p.id}.ogg`,
}))

export const MANIFEST_META = {
  title: 'Surviver formal SFX manifest',
  engine: 'tone-offline',
  runtimePlayback: 'Phaser / GameAudioSystem (OGG files only)',
  protectedBgm: [...PROTECTED_BGM_FILES],
  note: 'Tone.js is used only in tools/sfx_designer, never in src/',
}
