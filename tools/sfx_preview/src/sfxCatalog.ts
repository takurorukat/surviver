// ============================================================
// sfxCatalog.ts
// ------------------------------------------------------------
// SFX Catalog の Manifest（試聴・候補・表示の SSoT）。
// Runtime のキー／パスは audio.ts の export を参照するだけ。
// Runtime 再生処理からは参照しない。
// ============================================================

import {
  SFX_KEY_ENEMY_DEFEAT,
  SFX_PATH_ENEMY_DEFEAT,
  SFX_KEY_ENEMY_BLOCKED,
  SFX_PATH_ENEMY_BLOCKED,
  SFX_KEY_PLAYER_FIRE_POWER,
  SFX_PATH_PLAYER_FIRE_POWER,
  SFX_KEY_PLAYER_HIT_POWER,
  SFX_PATH_PLAYER_HIT_POWER,
  SFX_KEY_PLAYER_FIRE_WIND,
  SFX_PATH_PLAYER_FIRE_WIND,
  SFX_KEY_PLAYER_HIT_WIND,
  SFX_PATH_PLAYER_HIT_WIND,
  SFX_KEY_PLAYER_FIRE_WATER,
  SFX_PATH_PLAYER_FIRE_WATER,
  SFX_KEY_PLAYER_HIT_WATER,
  SFX_PATH_PLAYER_HIT_WATER,
  SFX_KEY_PLAYER_FIRE_FIRE,
  SFX_PATH_PLAYER_FIRE_FIRE,
  SFX_KEY_PLAYER_HIT_FIRE,
  SFX_PATH_PLAYER_HIT_FIRE,
  SFX_KEY_PLAYER_FIRE_EARTH,
  SFX_PATH_PLAYER_FIRE_EARTH,
  SFX_KEY_PLAYER_HIT_EARTH,
  SFX_PATH_PLAYER_HIT_EARTH,
  SFX_KEY_GAME_OVER,
  SFX_PATH_GAME_OVER,
  SFX_KEY_COIN_PICKUP,
  SFX_PATH_COIN_PICKUP,
  SFX_KEY_PLAYER_HURT,
  SFX_PATH_PLAYER_HURT,
  SFX_KEY_LEVEL_UP,
  SFX_PATH_LEVEL_UP,
  SFX_KEY_STAGE_CLEAR,
  SFX_PATH_STAGE_CLEAR,
  SFX_KEY_AREA_CLEAR,
  SFX_PATH_AREA_CLEAR,
  SFX_KEY_MENU_MOVE,
  SFX_PATH_MENU_MOVE,
  SFX_KEY_SHOP_PURCHASE,
  SFX_PATH_SHOP_PURCHASE,
  SFX_KEY_MENU_CANCEL,
  SFX_PATH_MENU_CANCEL,
  SFX_KEY_ORBITING_ORB_OBTAIN,
  SFX_PATH_ORBITING_ORB_OBTAIN,
  SFX_KEY_ORBITING_ORB_HIT,
  SFX_PATH_ORBITING_ORB_HIT,
  SFX_KEY_ORBITING_ORB_SHATTER,
  SFX_PATH_ORBITING_ORB_SHATTER,
  PLAYER_FIRE_POWER_SFX_COOLDOWN_MS,
  ENEMY_DEFEAT_SFX_COOLDOWN_MS,
  ORBITING_ORB_HIT_SFX_COOLDOWN_MS,
  ORBITING_ORB_SHATTER_SFX_COOLDOWN_MS,
} from '../../../src/games/survivor/constants/audio'
import { SFX_CANDIDATE_DIR } from './previewUi'
import {
  COMBAT_CORE_SFX_EVENT_IDS,
  SURVIVOR_SFX_EVENT_IDS,
  type SurvivorSfxEventId,
} from '../../../src/games/survivor/audio/sfxEvents'
import {
  COMBAT_CORE_EXTERNAL_CAST_RECOMMENDATIONS,
  COMBAT_CORE_EXTERNAL_CAST_VARIANTS,
  COMBAT_CORE_EXTERNAL_DEFEAT_RECOMMENDATIONS,
  COMBAT_CORE_EXTERNAL_DEFEAT_VARIANTS,
  COMBAT_CORE_EXTERNAL_IMPACT_RECOMMENDATIONS,
  COMBAT_CORE_EXTERNAL_IMPACT_VARIANTS,
} from './combatCoreExternalCandidates'

export type SfxCatalogCategory =
  | 'combat-core'
  | 'player'
  | 'enemy'
  | 'skill'
  | 'pickup'
  | 'progression'
  | 'ui'
  | 'system'

export type SfxCatalogEntryStatus =
  | 'unreviewed'
  | 'reviewing'
  | 'preferred'
  | 'missing-candidates'

export type SfxCatalogVariantStatus =
  | 'runtime'
  | 'revision'
  | 'candidate'
  | 'legacy'

export type SfxCatalogAssetOrigin =
  | 'runtime'
  | 'repository-generated'
  | 'repository-existing'
  | 'external-free'
  | 'unknown'

export type SfxCatalogVariant = {
  id: string
  label: string
  path: string
  audioKey: string
  formalKey?: string
  status: SfxCatalogVariantStatus
  origin?: SfxCatalogAssetOrigin
  sourceName?: string
  sourcePageUrl?: string
  downloadUrl?: string
  author?: string
  licenseName?: string
  licenseUrl?: string
  attributionText?: string
  attributionRequired?: boolean
  downloadedAt?: string
  originalFilename?: string
  modifiedFromOriginal?: boolean
  modificationNotes?: string
  checksumSha256?: string
  durationMs?: number
  sampleRate?: number
  channels?: number
  format?: 'ogg' | 'wav' | 'mp3' | 'flac'
  /** Manifest の soundFeatures（試聴ガイド用。任意） */
  soundFeatures?: string
  /** 互換用の短い表示（sourceName が無いとき） */
  source?: string
  license?: string
}

export type SfxCatalogBurstMode = {
  id: string
  label: string
  count: number
  intervalMs: number
}

/**
 * Review All モードで使う「おすすめ候補」情報。
 * ChatGPT/Codex 側でランク付けした Top 3 をそのまま保持するだけで、
 * ここでは再ランク付けはしない。
 * Python: {"variantId": ..., "rank": 1, "direction": [...], "reason": "..."} という dict に相当
 */
export type SfxCatalogRecommendation = {
  variantId: string
  rank: 1 | 2 | 3
  direction?: string[]
  reason?: string
}

export type SfxCatalogEntry = {
  id: string
  category: SfxCatalogCategory
  label: string
  description?: string
  /**
   * Runtime Event ID。Combat Core 等では Catalog ID と同じ文字列を使う。
   * 無い Entry はレビュー専用（専用 Runtime 未接続）を意味する。
   */
  eventId?: SurvivorSfxEventId
  runtimeKey?: string
  runtimePath?: string
  sharedWith?: string[]
  dedicatedRuntimeSfx: boolean
  variants: SfxCatalogVariant[]
  burstModes: SfxCatalogBurstMode[]
  initialStatus: SfxCatalogEntryStatus
  /** Review All で表示するおすすめ Top 3（ランク付けは呼び出し側で確定済み） */
  recommendations?: SfxCatalogRecommendation[]
  /** Review All で「優先度低」バッジを付ける候補の variant id 一覧 */
  deprioritizedVariantIds?: string[]
}

const CAND = SFX_CANDIDATE_DIR

function burstFire(): SfxCatalogBurstMode[] {
  return [
    { id: 'single', label: 'Single', count: 1, intervalMs: 0 },
    {
      id: 'x5',
      label: 'x5',
      count: 5,
      intervalMs: PLAYER_FIRE_POWER_SFX_COOLDOWN_MS,
    },
    {
      id: 'x10',
      label: 'x10',
      count: 10,
      intervalMs: PLAYER_FIRE_POWER_SFX_COOLDOWN_MS,
    },
  ]
}

function burstHit(): SfxCatalogBurstMode[] {
  return [
    { id: 'single', label: 'Single', count: 1, intervalMs: 0 },
    { id: 'x3', label: 'x3', count: 3, intervalMs: ENEMY_DEFEAT_SFX_COOLDOWN_MS },
    { id: 'x8', label: 'x8', count: 8, intervalMs: ENEMY_DEFEAT_SFX_COOLDOWN_MS },
  ]
}

function burstUi(): SfxCatalogBurstMode[] {
  return [
    { id: 'single', label: 'Single', count: 1, intervalMs: 0 },
    { id: 'x3', label: 'x3', count: 3, intervalMs: 80 },
    { id: 'x8', label: 'x8', count: 8, intervalMs: 80 },
  ]
}

function burstSingle(): SfxCatalogBurstMode[] {
  return [{ id: 'single', label: 'Single', count: 1, intervalMs: 0 }]
}

function runtimeVariant(
  id: string,
  path: string,
  formalKey: string,
  extras?: Partial<SfxCatalogVariant>,
): SfxCatalogVariant {
  return {
    id,
    label: 'Runtime',
    path,
    audioKey: `sfx-cat-${id}`,
    formalKey,
    status: 'runtime',
    origin: 'runtime',
    source: extras?.source ?? extras?.sourceName ?? 'runtime',
    license: extras?.license ?? extras?.licenseName,
    ...extras,
  }
}

function revisionVariant(
  id: string,
  path: string,
  extras?: Partial<SfxCatalogVariant>,
): SfxCatalogVariant {
  return {
    id,
    label: 'Revision',
    path,
    audioKey: `sfx-cat-${id}`,
    status: 'revision',
    origin: extras?.origin ?? 'repository-generated',
    source: extras?.source ?? 'repository-generated',
    license: extras?.license ?? 'repository',
    ...extras,
  }
}

function candidateVariant(
  letter: 'A' | 'B' | 'C',
  id: string,
  path: string,
  extras?: Partial<SfxCatalogVariant>,
): SfxCatalogVariant {
  return {
    id,
    label: `Candidate ${letter}`,
    path,
    audioKey: `sfx-cat-${id}`,
    status: 'candidate',
    origin: extras?.origin ?? 'repository-generated',
    source: extras?.source ?? 'existing candidate',
    license: extras?.license ?? 'repository',
    ...extras,
  }
}

function legacyVariant(
  id: string,
  path: string,
  extras?: Partial<SfxCatalogVariant>,
): SfxCatalogVariant {
  return {
    id,
    label: 'Legacy',
    path,
    audioKey: `sfx-cat-${id}`,
    status: 'legacy',
    origin: extras?.origin ?? 'repository-existing',
    source: extras?.source ?? 'legacy file',
    license: extras?.license ?? 'Unknown',
    ...extras,
  }
}

/** candidates/ の a/b/c と任意の無印ファイルを Candidate として並べる */
function abcCandidates(
  entryPrefix: string,
  fileBase: string,
  includeBareAsA: boolean,
): SfxCatalogVariant[] {
  const variants: SfxCatalogVariant[] = []
  if (includeBareAsA) {
    variants.push(
      candidateVariant(
        'A',
        `${entryPrefix}-cand-a`,
        `${CAND}/${fileBase}.ogg`,
      ),
    )
    variants.push(
      candidateVariant(
        'B',
        `${entryPrefix}-cand-b`,
        `${CAND}/${fileBase}_b.ogg`,
      ),
    )
    variants.push(
      candidateVariant(
        'C',
        `${entryPrefix}-cand-c`,
        `${CAND}/${fileBase}_c.ogg`,
      ),
    )
    return variants
  }
  variants.push(
    candidateVariant(
      'A',
      `${entryPrefix}-cand-a`,
      `${CAND}/${fileBase}_a.ogg`,
    ),
  )
  variants.push(
    candidateVariant(
      'B',
      `${entryPrefix}-cand-b`,
      `${CAND}/${fileBase}_b.ogg`,
    ),
  )
  variants.push(
    candidateVariant(
      'C',
      `${entryPrefix}-cand-c`,
      `${CAND}/${fileBase}_c.ogg`,
    ),
  )
  return variants
}

function fireElementEntry(
  id: string,
  label: string,
  key: string,
  path: string,
  fileBase: string,
): SfxCatalogEntry {
  const hasBareCandidate = fileBase === 'player_fire_power'
  const candidates = hasBareCandidate
    ? [
        revisionVariant(
          `${id}-rev`,
          `${CAND}/player_fire_power_c.ogg`,
          { source: 'existing candidate' },
        ),
        candidateVariant('B', `${id}-cand-b`, `${CAND}/player_fire_power_b.ogg`),
        candidateVariant('C', `${id}-cand-c`, `${CAND}/player_fire_power.ogg`),
      ]
    : abcCandidates(id, fileBase, false)

  return {
    id,
    category: 'player',
    label,
    description: 'Player bullet fire',
    runtimeKey: key,
    runtimePath: path,
    dedicatedRuntimeSfx: true,
    variants: [
      runtimeVariant(`${id}-runtime`, path, key, {
        source: 'runtime',
        license: 'repository',
      }),
      ...candidates,
    ],
    burstModes: burstFire(),
    initialStatus: 'unreviewed',
  }
}

function hitElementEntry(
  id: string,
  label: string,
  key: string,
  path: string,
  fileBase: string,
  sharedWith?: string[],
  kenneyRuntime?: boolean,
): SfxCatalogEntry {
  const variants: SfxCatalogVariant[] = [
    runtimeVariant(`${id}-runtime`, path, key, {
      source: kenneyRuntime ? 'Kenney' : 'runtime',
      license: kenneyRuntime ? 'CC0' : 'repository',
      sourceName: kenneyRuntime ? 'Kenney' : undefined,
      licenseName: kenneyRuntime ? 'CC0' : undefined,
    }),
  ]
  // earth hit runtime は Kenney。candidates の player_hit_earth* と legacy を比較用に追加
  if (fileBase === 'player_hit_earth') {
    variants.push(...abcCandidates(id, fileBase, true))
    variants.push(
      legacyVariant(`${id}-legacy`, 'assets/audio/player_hit_earth.ogg', {
        source: 'legacy file',
      }),
    )
  } else {
    variants.push(...abcCandidates(id, fileBase, false))
  }

  return {
    id,
    category: 'enemy',
    label,
    description: 'Enemy hit by player bullet (element)',
    runtimeKey: key,
    runtimePath: path,
    sharedWith,
    dedicatedRuntimeSfx: true,
    variants,
    burstModes: burstHit(),
    initialStatus: 'unreviewed',
  }
}

type ExternalSourceDef = {
  sourceName: string
  sourcePageUrl: string
  downloadUrl: string
  author: string
}

type ExternalAssetDef = {
  filename: string
  label: string
  originalFilename: string
  checksumSha256: string
  durationMs: number
  sampleRate: number
  channels: number
  format: 'ogg' | 'wav'
}

const KENNEY_IMPACT_SOURCE: ExternalSourceDef = {
  sourceName: 'Kenney Impact Sounds',
  sourcePageUrl: 'https://kenney.nl/assets/impact-sounds',
  downloadUrl:
    'https://kenney.nl/media/pages/assets/impact-sounds/87b4ddecda-1677589768/kenney_impact-sounds.zip',
  author: 'Kenney',
}

const KENNEY_RPG_SOURCE: ExternalSourceDef = {
  sourceName: 'Kenney RPG Audio',
  sourcePageUrl: 'https://kenney.nl/assets/rpg-audio',
  downloadUrl:
    'https://kenney.nl/media/pages/assets/rpg-audio/8e99002d76-1677590336/kenney_rpg-audio.zip',
  author: 'Kenney Vleugels',
}

const KENNEY_INTERFACE_SOURCE: ExternalSourceDef = {
  sourceName: 'Kenney Interface Sounds',
  sourcePageUrl: 'https://kenney.nl/assets/interface-sounds',
  downloadUrl:
    'https://kenney.nl/media/pages/assets/interface-sounds/fa43c1dd4d-1677589452/kenney_interface-sounds.zip',
  author: 'Kenney',
}

const OGA_SWISH_SOURCE: ExternalSourceDef = {
  sourceName: 'OpenGameArt Swishes Sound Pack',
  sourcePageUrl: 'https://opengameart.org/content/swishes-sound-pack',
  downloadUrl: 'https://opengameart.org/sites/default/files/swishes.zip',
  author: 'artisticdude',
}

function externalCandidateVariants(
  entryId: string,
  sourceDef: ExternalSourceDef,
  assets: ExternalAssetDef[],
  startIndex: number = 1,
): SfxCatalogVariant[] {
  const entryFolder = entryId.split('.').join('-')
  return assets.map((asset, assetIndex) => {
    const candidateNumber = startIndex + assetIndex
    const numberText = String(candidateNumber).padStart(2, '0')
    return {
      id: `${entryId}-external-${numberText}`,
      label: asset.label,
      path: `assets/audio/candidates/external/${entryFolder}/${asset.filename}`,
      audioKey: `sfx-catalog-${entryFolder}-external-${numberText}`,
      status: 'candidate',
      origin: 'external-free',
      sourceName: sourceDef.sourceName,
      sourcePageUrl: sourceDef.sourcePageUrl,
      downloadUrl: sourceDef.downloadUrl,
      author: sourceDef.author,
      licenseName: 'Creative Commons CC0 1.0 Universal',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      attributionRequired: false,
      downloadedAt: '2026-07-26',
      originalFilename: asset.originalFilename,
      modifiedFromOriginal: false,
      modificationNotes: 'Unmodified original file.',
      checksumSha256: asset.checksumSha256,
      durationMs: asset.durationMs,
      sampleRate: asset.sampleRate,
      channels: asset.channels,
      format: asset.format,
      source: sourceDef.sourceName,
      license: 'CC0-1.0',
    }
  })
}

const EXTERNAL_SKILL_BLAST = externalCandidateVariants(
  'skill.blast',
  KENNEY_IMPACT_SOURCE,
  [
    { filename: 'kenney_bell-heavy_01.ogg', label: 'Kenney Bell Heavy', originalFilename: 'impactBell_heavy_000.ogg', checksumSha256: '94b8bb5f2d43ab65e4bcc32b28562416e9bc2c51d9fd4be1e333660ee52f977f', durationMs: 1480, sampleRate: 44100, channels: 2, format: 'ogg' },
    { filename: 'kenney_glass-heavy_02.ogg', label: 'Kenney Glass Heavy', originalFilename: 'impactGlass_heavy_000.ogg', checksumSha256: 'b44b39a940e8948e74b9bd3776bff980df43cf220abdaf0d467dc4c43c0244a5', durationMs: 241, sampleRate: 44100, channels: 2, format: 'ogg' },
    { filename: 'kenney_metal-heavy_03.ogg', label: 'Kenney Metal Heavy', originalFilename: 'impactMetal_heavy_000.ogg', checksumSha256: 'e07045693e4a2b3d165c424e3dab4c781d9ff8880a386880ac89a51315d7f831', durationMs: 168, sampleRate: 44100, channels: 2, format: 'ogg' },
    { filename: 'kenney_mining-impact_04.ogg', label: 'Kenney Mining Impact', originalFilename: 'impactMining_000.ogg', checksumSha256: '36b4ea107222d073c67ca64dde26944975609202d5090b2f2021213c1a7e35cd', durationMs: 937, sampleRate: 44100, channels: 2, format: 'ogg' },
    { filename: 'kenney_plate-heavy_05.ogg', label: 'Kenney Plate Heavy', originalFilename: 'impactPlate_heavy_000.ogg', checksumSha256: '112d4f93ddcc370b410630f971c0f5d991856102da9c76bc5c5540d388e75aaa', durationMs: 489, sampleRate: 44100, channels: 2, format: 'ogg' },
    { filename: 'kenney_punch-heavy_06.ogg', label: 'Kenney Punch Heavy', originalFilename: 'impactPunch_heavy_000.ogg', checksumSha256: 'b33a8f14068aec24ec69ba85e5e87fdc41228975f6a1a3e44a6e7d6fc3d9f8d8', durationMs: 649, sampleRate: 44100, channels: 2, format: 'ogg' },
    { filename: 'kenney_soft-heavy_07.ogg', label: 'Kenney Soft Heavy', originalFilename: 'impactSoft_heavy_000.ogg', checksumSha256: '49e7ca88743fca974bb8676ea138b751cfd8f9033b5e7af8736c2a215d6edbc1', durationMs: 505, sampleRate: 44100, channels: 2, format: 'ogg' },
    { filename: 'kenney_wood-heavy_08.ogg', label: 'Kenney Wood Heavy', originalFilename: 'impactWood_heavy_000.ogg', checksumSha256: '15ff82332f342c30e469215539e1cc57e11b221aa2cf7e11e811d313a9927f3d', durationMs: 313, sampleRate: 44100, channels: 2, format: 'ogg' },
    { filename: 'kenney_generic-light_09.ogg', label: 'Kenney Generic Light', originalFilename: 'impactGeneric_light_000.ogg', checksumSha256: 'f0e982611e97512fee5f777986b67e8b435434b601f94992ec044f7e89fb5acb', durationMs: 139, sampleRate: 44100, channels: 2, format: 'ogg' },
    { filename: 'kenney_tin-medium_10.ogg', label: 'Kenney Tin Medium', originalFilename: 'impactTin_medium_000.ogg', checksumSha256: 'f4bbee66ca191ec744b84fc07ac9ed2a6fda955d51cfed8360f12b62815d3cbd', durationMs: 159, sampleRate: 44100, channels: 2, format: 'ogg' },
  ],
)

const EXTERNAL_SKILL_PIERCE = externalCandidateVariants(
  'skill.pierce',
  OGA_SWISH_SOURCE,
  [
    { filename: 'opengameart_swish-01.wav', label: 'OpenGameArt Swish 1', originalFilename: 'swish-1.wav', checksumSha256: '9a15c881345c1ce1c39cc31f52f081c8c4dc81fa41111e0079400f39d3ba0e45', durationMs: 126, sampleRate: 44100, channels: 2, format: 'wav' },
    { filename: 'opengameart_swish-02.wav', label: 'OpenGameArt Swish 2', originalFilename: 'swish-2.wav', checksumSha256: '1ce7752cce3d43f16fc222ad7f7ffb69d9a5fc01e64b93d205765fc37b8e9b0d', durationMs: 96, sampleRate: 44100, channels: 2, format: 'wav' },
    { filename: 'opengameart_swish-03.wav', label: 'OpenGameArt Swish 3', originalFilename: 'swish-3.wav', checksumSha256: '55b100e2c67fa43dad8510e31e85bbd51a68d5ce84a6e0259e21e19030083e24', durationMs: 146, sampleRate: 44100, channels: 2, format: 'wav' },
    { filename: 'opengameart_swish-04.wav', label: 'OpenGameArt Swish 4', originalFilename: 'swish-4.wav', checksumSha256: '0060f4a7040edce4cc50d1daa10a9cb76764128a942e4688339e69cd1d5d784c', durationMs: 146, sampleRate: 44100, channels: 2, format: 'wav' },
    { filename: 'opengameart_swish-05.wav', label: 'OpenGameArt Swish 5', originalFilename: 'swish-5.wav', checksumSha256: '4db41f2d2f97caf94627be05ff2870217fecc86534cf30f2aab413b847a0d50a', durationMs: 127, sampleRate: 44100, channels: 2, format: 'wav' },
    { filename: 'opengameart_swish-06.wav', label: 'OpenGameArt Swish 6', originalFilename: 'swish-6.wav', checksumSha256: 'edcaacf008da7ae692566f4fe0d6023ea68d0a014149889e95209be7ee0b746d', durationMs: 138, sampleRate: 44100, channels: 2, format: 'wav' },
    { filename: 'opengameart_swish-07.wav', label: 'OpenGameArt Swish 7', originalFilename: 'swish-7.wav', checksumSha256: 'e6de737a34de16afed094d6170d7679149022f149e0a8356d2f029b0e8f4a4d7', durationMs: 187, sampleRate: 44100, channels: 2, format: 'wav' },
    { filename: 'opengameart_swish-08.wav', label: 'OpenGameArt Swish 8', originalFilename: 'swish-8.wav', checksumSha256: '113a3709ad889ad2fcf38eaceaf4eb9d67ffe1e96713fed93a6f0aed08769980', durationMs: 154, sampleRate: 44100, channels: 2, format: 'wav' },
    { filename: 'opengameart_swish-09.wav', label: 'OpenGameArt Swish 9', originalFilename: 'swish-9.wav', checksumSha256: '123883f006ce55feecbff11eea5f87c4493df4399989983037144570a23723c1', durationMs: 197, sampleRate: 44100, channels: 2, format: 'wav' },
    { filename: 'opengameart_swish-10.wav', label: 'OpenGameArt Swish 10', originalFilename: 'swish-10.wav', checksumSha256: '4f7381a76f280d3f36f962ac3f44f16f77eec44797f30715d063c81ea3859024', durationMs: 125, sampleRate: 44100, channels: 2, format: 'wav' },
  ],
)

const EXTERNAL_SKILL_RICOCHET = externalCandidateVariants(
  'skill.ricochet',
  KENNEY_IMPACT_SOURCE,
  [
    { filename: 'kenney_glass-light_01.ogg', label: 'Kenney Glass Light', originalFilename: 'impactGlass_light_001.ogg', checksumSha256: '05e513fbd42829060eb37855f8c3866722ec5c39a8937c9bfde518cc609effa2', durationMs: 210, sampleRate: 44100, channels: 2, format: 'ogg' },
    { filename: 'kenney_glass-medium_02.ogg', label: 'Kenney Glass Medium', originalFilename: 'impactGlass_medium_001.ogg', checksumSha256: 'd3d806cb3012c9ddd87010b30295ccb74d6d8b690077d19e67afd09a9d8feb03', durationMs: 543, sampleRate: 44100, channels: 2, format: 'ogg' },
    { filename: 'kenney_metal-light_03.ogg', label: 'Kenney Metal Light', originalFilename: 'impactMetal_light_001.ogg', checksumSha256: 'fba69c467ddd85da7b1d82e259f936b876d9ba6a3d6f1b24bdd10468e46bfe08', durationMs: 252, sampleRate: 44100, channels: 2, format: 'ogg' },
    { filename: 'kenney_metal-medium_04.ogg', label: 'Kenney Metal Medium', originalFilename: 'impactMetal_medium_001.ogg', checksumSha256: 'e8a9eaba7c4d27422e4eeb3e6c7100d5d7dc0f83e005efc98c960adcc5265337', durationMs: 143, sampleRate: 44100, channels: 2, format: 'ogg' },
    { filename: 'kenney_plank-medium_05.ogg', label: 'Kenney Plank Medium', originalFilename: 'impactPlank_medium_001.ogg', checksumSha256: 'd7c304319f8beac616231b62041fa8da74045b62d7155965516efb9b19303df4', durationMs: 779, sampleRate: 44100, channels: 2, format: 'ogg' },
    { filename: 'kenney_plate-light_06.ogg', label: 'Kenney Plate Light', originalFilename: 'impactPlate_light_001.ogg', checksumSha256: '947915c2eb6ac57ee08fd3a48b297fd108d69abc72076e79882c21cad0eef56e', durationMs: 655, sampleRate: 44100, channels: 2, format: 'ogg' },
    { filename: 'kenney_plate-medium_07.ogg', label: 'Kenney Plate Medium', originalFilename: 'impactPlate_medium_001.ogg', checksumSha256: '68ba7701b71ef620f498f3038e832157d71ac8db7ad59424545890b250ceb24e', durationMs: 616, sampleRate: 44100, channels: 2, format: 'ogg' },
    { filename: 'kenney_wood-medium_08.ogg', label: 'Kenney Wood Medium', originalFilename: 'impactWood_medium_001.ogg', checksumSha256: '15271dbe8e2872dbb0ff1aeb7b12b2d2b92b7c1951c88532b9ab9158c36dfc73', durationMs: 333, sampleRate: 44100, channels: 2, format: 'ogg' },
    { filename: 'kenney_soft-medium_09.ogg', label: 'Kenney Soft Medium', originalFilename: 'impactSoft_medium_001.ogg', checksumSha256: '7642a4fd43e547afe4f7adfadb3dabb681c0ff512f52c1674bae30a726841faf', durationMs: 183, sampleRate: 44100, channels: 2, format: 'ogg' },
    { filename: 'kenney_wood-light_10.ogg', label: 'Kenney Wood Light', originalFilename: 'impactWood_light_001.ogg', checksumSha256: '4b76bf3ccc8e60d19188f3165b778a7817786faa6887c55d9049bcbeef3b425f', durationMs: 266, sampleRate: 44100, channels: 2, format: 'ogg' },
  ],
)

const EXTERNAL_ENEMY_PROJECTILE_FIRE = [
  ...externalCandidateVariants(
    'enemy.projectile.fire',
    OGA_SWISH_SOURCE,
    [
      { filename: 'opengameart_swish-fast_01.wav', label: 'OpenGameArt Swish Fast', originalFilename: 'swish-11.wav', checksumSha256: '9e81d548d8215fbb36f7a41b5771d4b52c2fd02fbb9b5ff9a4c65118fd88ee4d', durationMs: 104, sampleRate: 44100, channels: 2, format: 'wav' },
      { filename: 'opengameart_swish-short_02.wav', label: 'OpenGameArt Swish Short', originalFilename: 'swish-12.wav', checksumSha256: '0513a86d428d9ed8601e93b8554580a5932c6c1a82d39d81a8f48883f1807a67', durationMs: 76, sampleRate: 44100, channels: 2, format: 'wav' },
      { filename: 'opengameart_swish-light_03.wav', label: 'OpenGameArt Swish Light', originalFilename: 'swish-13.wav', checksumSha256: '698230ba3fe05a68c18d68cd6b3a07fb98e6c1198bb1a4238592ee9912c02c77', durationMs: 71, sampleRate: 44100, channels: 2, format: 'wav' },
    ],
  ),
  ...externalCandidateVariants(
    'enemy.projectile.fire',
    KENNEY_RPG_SOURCE,
    [
      { filename: 'kenney_draw-whoosh-2_04.ogg', label: 'Kenney Draw Whoosh 2', originalFilename: 'drawKnife2.ogg', checksumSha256: 'd5df6a4130cbb016f97b4883769a418917b9629cb4c21717030b186e0c73281a', durationMs: 446, sampleRate: 48000, channels: 2, format: 'ogg' },
      { filename: 'kenney_draw-whoosh-3_05.ogg', label: 'Kenney Draw Whoosh 3', originalFilename: 'drawKnife3.ogg', checksumSha256: 'a11ae62fb1a628425769d11a9de394980ad8909c31f4c9a4316f226963e21caf', durationMs: 477, sampleRate: 48000, channels: 2, format: 'ogg' },
      { filename: 'kenney_cloth-whoosh-1_06.ogg', label: 'Kenney Cloth Whoosh 1', originalFilename: 'cloth1.ogg', checksumSha256: 'ddb93a3671233f95da0e0b10367f082f7eb42fa6caaddcf776410aa8833c747d', durationMs: 661, sampleRate: 48000, channels: 2, format: 'ogg' },
      { filename: 'kenney_cloth-whoosh-2_07.ogg', label: 'Kenney Cloth Whoosh 2', originalFilename: 'cloth2.ogg', checksumSha256: '8a7451193c38bc05483aec25dd193e163a15d44cf7fff04ac7912573231b0201', durationMs: 415, sampleRate: 48000, channels: 2, format: 'ogg' },
      { filename: 'kenney_cloth-whoosh-3_08.ogg', label: 'Kenney Cloth Whoosh 3', originalFilename: 'cloth3.ogg', checksumSha256: 'a48632d17a4f1416541d261a32a31612e01267144c407fa3ecab3ff410f0085b', durationMs: 477, sampleRate: 48000, channels: 2, format: 'ogg' },
      { filename: 'kenney_leather-whoosh-1_09.ogg', label: 'Kenney Leather Whoosh 1', originalFilename: 'beltHandle1.ogg', checksumSha256: '2ef665bd8b65dbe669f4560be38a6d8f04a162e618b15a49e3e71b58e558aab0', durationMs: 277, sampleRate: 48000, channels: 2, format: 'ogg' },
      { filename: 'kenney_leather-whoosh-2_10.ogg', label: 'Kenney Leather Whoosh 2', originalFilename: 'beltHandle2.ogg', checksumSha256: 'f3b692d5c83263c25bce779805b212dbab515d18a603c695fc6a1e8650cf5366', durationMs: 477, sampleRate: 48000, channels: 2, format: 'ogg' },
    ],
    4,
  ),
]

const EXTERNAL_ENEMY_PROJECTILE_HIT = externalCandidateVariants(
  'enemy.projectile.hit',
  KENNEY_IMPACT_SOURCE,
  [
    { filename: 'kenney_soft-impact_01.ogg', label: 'Kenney Soft Magic Contact', originalFilename: 'impactSoft_medium_002.ogg', checksumSha256: '5069e3571a77d7f7aae9ef71d0364aa245fb7d64a7c8cc9956f221d03088c089', durationMs: 135, sampleRate: 44100, channels: 2, format: 'ogg' },
    { filename: 'kenney_generic-contact_02.ogg', label: 'Kenney Generic Magic Contact', originalFilename: 'impactGeneric_light_002.ogg', checksumSha256: 'd0bf60905b59ff630ffe01eb0edeeacd2504eaa8fb6523aeef7d2458b78264d3', durationMs: 140, sampleRate: 44100, channels: 2, format: 'ogg' },
    { filename: 'kenney_glass-contact_03.ogg', label: 'Kenney Crystal Contact', originalFilename: 'impactGlass_light_003.ogg', checksumSha256: '765290ce32fa108c939a0dbd6fbacbcd05abde622b57b708eb8a64058ef4225a', durationMs: 210, sampleRate: 44100, channels: 2, format: 'ogg' },
    { filename: 'kenney_metal-contact_04.ogg', label: 'Kenney Metallic Magic Contact', originalFilename: 'impactMetal_light_004.ogg', checksumSha256: '9b1c35820fba507081261f19ab5f461f69a5e2627a7d91acdb73ca3cfc997979', durationMs: 213, sampleRate: 44100, channels: 2, format: 'ogg' },
    { filename: 'kenney_punch-impact_05.ogg', label: 'Kenney Rounded Impact', originalFilename: 'impactPunch_medium_004.ogg', checksumSha256: '4a256878a3afb994ec9a4399336687748e68c7c136872c08c9c797d8c4e2464a', durationMs: 543, sampleRate: 44100, channels: 2, format: 'ogg' },
    { filename: 'kenney_wood-impact_06.ogg', label: 'Kenney Organic Impact', originalFilename: 'impactWood_medium_003.ogg', checksumSha256: '635c37cfcd854b187d643d450ff0397798dcc29ae94da32192b814fae6bd854c', durationMs: 333, sampleRate: 44100, channels: 2, format: 'ogg' },
    { filename: 'kenney_tin-impact_07.ogg', label: 'Kenney Bright Impact', originalFilename: 'impactTin_medium_001.ogg', checksumSha256: '84253095543c094d83cd749f42ecfbc96e356b60385f18a192c18eafb25b3cc6', durationMs: 174, sampleRate: 44100, channels: 2, format: 'ogg' },
    { filename: 'kenney_plate-impact_08.ogg', label: 'Kenney Plate Impact', originalFilename: 'impactPlate_medium_004.ogg', checksumSha256: 'f0e8164081190839caff6c2958361b22780ffba5617f77f2d4ee3a4275b318bf', durationMs: 534, sampleRate: 44100, channels: 2, format: 'ogg' },
    { filename: 'kenney_mining-impact_09.ogg', label: 'Kenney Dark Stone Impact', originalFilename: 'impactMining_004.ogg', checksumSha256: '8ca3a99d85d845751ad8ce7b40509da58263a62e48cde70e5a30b5ccef4c9a3b', durationMs: 830, sampleRate: 44100, channels: 2, format: 'ogg' },
    { filename: 'kenney_bell-impact_10.ogg', label: 'Kenney Bell Impact', originalFilename: 'impactBell_heavy_004.ogg', checksumSha256: '49fe4fafa2001bd0d312976796824571ca8429851f285997e1327d17bb34fd00', durationMs: 301, sampleRate: 44100, channels: 2, format: 'ogg' },
  ],
)

const EXTERNAL_BOSS_ATTACK = [
  ...externalCandidateVariants(
    'boss.attack',
    KENNEY_IMPACT_SOURCE,
    [
      { filename: 'kenney_heavy-punch_01.ogg', label: 'Kenney Heavy Punch', originalFilename: 'impactPunch_heavy_004.ogg', checksumSha256: 'f4c0c3eb8ab6517583b8218ed03f28923d1b687379aab4c1d5a6d4c10cf8e500', durationMs: 536, sampleRate: 44100, channels: 2, format: 'ogg' },
      { filename: 'kenney_heavy-metal_02.ogg', label: 'Kenney Heavy Metal Impact', originalFilename: 'impactMetal_heavy_003.ogg', checksumSha256: 'b0f2ba4dabde9a87eb9c188a19d31e0c2300fd321adeba08d3b9b8aa011d7037', durationMs: 207, sampleRate: 44100, channels: 2, format: 'ogg' },
      { filename: 'kenney_heavy-wood_03.ogg', label: 'Kenney Heavy Organic Impact', originalFilename: 'impactWood_heavy_004.ogg', checksumSha256: '2c647ae6bd29c72ae2523f7e16e325d8d331b75cc99ab4f637c48a0e11c34677', durationMs: 313, sampleRate: 44100, channels: 2, format: 'ogg' },
      { filename: 'kenney_heavy-plate_04.ogg', label: 'Kenney Heavy Plate Impact', originalFilename: 'impactPlate_heavy_004.ogg', checksumSha256: 'e31bfec90630155bcc6af541d1d14ae8202c435c52b42e6b6183fdb6ffb248b0', durationMs: 559, sampleRate: 44100, channels: 2, format: 'ogg' },
      { filename: 'kenney_mining-heavy_05.ogg', label: 'Kenney Heavy Stone Impact', originalFilename: 'impactMining_003.ogg', checksumSha256: '4237fa2cd80364ad81cd0af44f67d7497f1c5edcc7bdb02cd22be2ba4580c83d', durationMs: 992, sampleRate: 44100, channels: 2, format: 'ogg' },
      { filename: 'kenney_bell-heavy_06.ogg', label: 'Kenney Heavy Bell Impact', originalFilename: 'impactBell_heavy_002.ogg', checksumSha256: 'a4171ed1a4a17fb858a38de1c59b5b42e50d8f046c525706c0e3ac8671f189f5', durationMs: 697, sampleRate: 44100, channels: 2, format: 'ogg' },
    ],
  ),
  ...externalCandidateVariants(
    'boss.attack',
    KENNEY_RPG_SOURCE,
    [
      { filename: 'kenney_rpg-chop_07.ogg', label: 'Kenney RPG Heavy Chop', originalFilename: 'chop.ogg', checksumSha256: 'd00c2b3c9fff07e376145c8c8c45c90e5084ec192f6ce0387db233f7b86f1486', durationMs: 240, sampleRate: 48000, channels: 2, format: 'ogg' },
      { filename: 'kenney_rpg-metal-pot_08.ogg', label: 'Kenney RPG Resonant Metal', originalFilename: 'metalPot3.ogg', checksumSha256: 'd306e5b848f6843332d0ca19f8f7dfe5796aeb56d8273902b085df463273f1dc', durationMs: 907, sampleRate: 48000, channels: 2, format: 'ogg' },
    ],
    7,
  ),
  ...externalCandidateVariants(
    'boss.attack',
    KENNEY_INTERFACE_SOURCE,
    [
      { filename: 'kenney_bong-impact_09.ogg', label: 'Kenney Low Bong Impact', originalFilename: 'bong_001.ogg', checksumSha256: 'd21d0f0b782445db579d11e2506b24cd1ac9d664ee33aeaf807761aa7b6fd710', durationMs: 123, sampleRate: 44100, channels: 1, format: 'ogg' },
      { filename: 'kenney_dark-error-impact_10.ogg', label: 'Kenney Dark Pulse Impact', originalFilename: 'error_008.ogg', checksumSha256: 'eba17ecb2a426bfd4a8a6acff5f8a86202b6424a77af0fd842e37809a1ab6d81', durationMs: 139, sampleRate: 44100, channels: 1, format: 'ogg' },
    ],
    9,
  ),
]

const EXTERNAL_ENEMY_SUMMON = [
  ...externalCandidateVariants(
    'enemy.summon',
    KENNEY_INTERFACE_SOURCE,
    [
      { filename: 'kenney_open-arcane_01.ogg', label: 'Kenney Arcane Open', originalFilename: 'open_003.ogg', checksumSha256: 'bcdca6b5c9c33aa15ca3fb18a1fa8d98a01b528b85be08c5a610e57c75fc022d', durationMs: 314, sampleRate: 44100, channels: 1, format: 'ogg' },
      { filename: 'kenney_rising-summon_02.ogg', label: 'Kenney Rising Summon', originalFilename: 'maximize_008.ogg', checksumSha256: '57c074e600e193a303ce781c04c0ccc191c6030f9f106594fd94a65e55435c17', durationMs: 225, sampleRate: 44100, channels: 1, format: 'ogg' },
      { filename: 'kenney_question-tone_03.ogg', label: 'Kenney Mystery Tone', originalFilename: 'question_003.ogg', checksumSha256: '00bafc564e29c12e99da584864a750260e7110378251d63d3aa5b3d727836efe', durationMs: 332, sampleRate: 44100, channels: 1, format: 'ogg' },
      { filename: 'kenney_pluck-pulse_04.ogg', label: 'Kenney Arcane Pluck', originalFilename: 'pluck_001.ogg', checksumSha256: 'be97ec4893a02d6eccfb678daa76c83e34cb2583b834ec2593d2641def739fa4', durationMs: 102, sampleRate: 44100, channels: 2, format: 'ogg' },
      { filename: 'kenney_glass-shimmer_05.ogg', label: 'Kenney Glass Summon', originalFilename: 'glass_006.ogg', checksumSha256: '840500be48078f1210f1fd7a9ac4e5665ed9b6f4a2b8dce91a237152a65e94cc', durationMs: 111, sampleRate: 44100, channels: 1, format: 'ogg' },
      { filename: 'kenney_error-pulse_06.ogg', label: 'Kenney Dark Error Pulse', originalFilename: 'error_005.ogg', checksumSha256: '3f75b11df5b06d68d2c25fbf0e9c9d9e7dd9250562a4007ee34856b8a309a2ae', durationMs: 500, sampleRate: 44100, channels: 1, format: 'ogg' },
    ],
  ),
  ...externalCandidateVariants(
    'enemy.summon',
    KENNEY_RPG_SOURCE,
    [
      { filename: 'kenney_book-open_07.ogg', label: 'Kenney Spellbook Open', originalFilename: 'bookOpen.ogg', checksumSha256: '953390534377222bee89ac8cd9e60a58fdc037c71a4d7c18c43cd647c7f34ba8', durationMs: 154, sampleRate: 48000, channels: 2, format: 'ogg' },
      { filename: 'kenney_creak-dark_08.ogg', label: 'Kenney Dark Creak', originalFilename: 'creak3.ogg', checksumSha256: 'f9638787f95004b9d2d06f8eff8e99d4e594c21b51947daf562856fbcec905d1', durationMs: 338, sampleRate: 48000, channels: 2, format: 'ogg' },
      { filename: 'kenney_book-flip_09.ogg', label: 'Kenney Spellbook Flip', originalFilename: 'bookFlip3.ogg', checksumSha256: 'c85db5dceb3f1df073e960630277eaa88a5afda0477c1ddd68dad707621767be', durationMs: 231, sampleRate: 48000, channels: 2, format: 'ogg' },
      { filename: 'kenney_cloth-rustle_10.ogg', label: 'Kenney Summoning Robe', originalFilename: 'clothBelt2.ogg', checksumSha256: 'd545b1d9f20e6188140aaf551a96f1e82fe0d15f7ca066fac8b065e1231e0038', durationMs: 753, sampleRate: 48000, channels: 2, format: 'ogg' },
    ],
    7,
  ),
]

const EXTERNAL_PLAYER_HEAL = [
  ...externalCandidateVariants(
    'player.heal',
    KENNEY_INTERFACE_SOURCE,
    [
      { filename: 'kenney_confirmation-chime_01.ogg', label: 'Kenney Confirmation Chime', originalFilename: 'confirmation_001.ogg', checksumSha256: '063564703b6094d70718a3e787a55cc9141611e4ecd6b6637f8828f79b4a8c3a', durationMs: 290, sampleRate: 44100, channels: 1, format: 'ogg' },
      { filename: 'kenney_rising-heal_02.ogg', label: 'Kenney Rising Heal', originalFilename: 'maximize_005.ogg', checksumSha256: '0ee06fc3ee494723fc95b2224f9dc0af857f2903e7f94d5d33d8e67f454b3cf7', durationMs: 526, sampleRate: 44100, channels: 1, format: 'ogg' },
      { filename: 'kenney_select-spark_03.ogg', label: 'Kenney Select Spark', originalFilename: 'select_007.ogg', checksumSha256: 'cd4390dd2b24f09016a5fa1be63334fa0f1859811f4cf29c02e8e2750f6a2cd0', durationMs: 47, sampleRate: 44100, channels: 1, format: 'ogg' },
      { filename: 'kenney_glass-chime_04.ogg', label: 'Kenney Glass Heal Chime', originalFilename: 'glass_004.ogg', checksumSha256: '2379b58f953e3d86982aa8cddcae763022c6258e9820171bf905ce58b4e97766', durationMs: 692, sampleRate: 44100, channels: 1, format: 'ogg' },
      { filename: 'kenney_pluck-heal_05.ogg', label: 'Kenney Healing Pluck', originalFilename: 'pluck_002.ogg', checksumSha256: 'c977fe249ff42d1c93a552b33abc13a8399df3879fa510475426e5c4bbac1da9', durationMs: 165, sampleRate: 44100, channels: 2, format: 'ogg' },
      { filename: 'kenney_question-rise_06.ogg', label: 'Kenney Gentle Rise', originalFilename: 'question_001.ogg', checksumSha256: 'abb8f9e4eb2071491b0b15f84ee302386b1847609310c1b000ae174639a6cc5a', durationMs: 491, sampleRate: 44100, channels: 1, format: 'ogg' },
      { filename: 'kenney_open-soft_07.ogg', label: 'Kenney Soft Open', originalFilename: 'open_001.ogg', checksumSha256: 'a27c6bb0df7da1e6af5dd5937593c98bc58b6e513f42fe6a3254cd6a6949c648', durationMs: 148, sampleRate: 44100, channels: 1, format: 'ogg' },
      { filename: 'kenney_toggle-soft_08.ogg', label: 'Kenney Soft Toggle', originalFilename: 'toggle_003.ogg', checksumSha256: '7e69aba356d590826cce291bbd9dc6a85d7c53858b0e3712fcad30e1ad080b23', durationMs: 139, sampleRate: 44100, channels: 1, format: 'ogg' },
      { filename: 'kenney_drop-soft_09.ogg', label: 'Kenney Soft Drop', originalFilename: 'drop_002.ogg', checksumSha256: '4ac4d1cef7e936965cbf795852ca2020300b9e2ba7daa59f2bf4f1f7bf416218', durationMs: 191, sampleRate: 44100, channels: 2, format: 'ogg' },
    ],
  ),
  ...externalCandidateVariants(
    'player.heal',
    KENNEY_RPG_SOURCE,
    [
      { filename: 'kenney_coin-shimmer_10.ogg', label: 'Kenney Coin Shimmer', originalFilename: 'handleCoins2.ogg', checksumSha256: '4b857968d64f9ac9336a10ffac6694d7547e1f01566ad6857b30bc8db3ee6c32', durationMs: 338, sampleRate: 48000, channels: 2, format: 'ogg' },
    ],
    10,
  ),
]

export const SFX_CATALOG: SfxCatalogEntry[] = [
  // ---- Combat Core（Event ID と 1:1。Review All で先頭表示） ----
  {
    id: SURVIVOR_SFX_EVENT_IDS.SKILL_POWER_CAST,
    eventId: SURVIVOR_SFX_EVENT_IDS.SKILL_POWER_CAST,
    category: 'combat-core',
    label: 'Basic Shot — Cast',
    description: '通常の初期 Power 弾が発射された瞬間の音。',
    runtimeKey: SFX_KEY_PLAYER_FIRE_POWER,
    runtimePath: SFX_PATH_PLAYER_FIRE_POWER,
    dedicatedRuntimeSfx: true,
    // 旧 Entry id: player.fire.power（Adopt は ReviewStore で移行）
    variants: [
      runtimeVariant(
        'skill.power.cast-runtime',
        SFX_PATH_PLAYER_FIRE_POWER,
        SFX_KEY_PLAYER_FIRE_POWER,
        { source: 'runtime', license: 'repository' },
      ),
      revisionVariant(
        'skill.power.cast-rev',
        `${CAND}/player_fire_power_c.ogg`,
        { source: 'existing candidate' },
      ),
      candidateVariant(
        'B',
        'skill.power.cast-cand-b',
        `${CAND}/player_fire_power_b.ogg`,
      ),
      candidateVariant(
        'C',
        'skill.power.cast-cand-c',
        `${CAND}/player_fire_power.ogg`,
      ),
      ...COMBAT_CORE_EXTERNAL_CAST_VARIANTS,
    ],
    burstModes: burstFire(),
    initialStatus: 'unreviewed',
    recommendations: COMBAT_CORE_EXTERNAL_CAST_RECOMMENDATIONS,
  },
  {
    id: SURVIVOR_SFX_EVENT_IDS.SKILL_POWER_IMPACT,
    eventId: SURVIVOR_SFX_EVENT_IDS.SKILL_POWER_IMPACT,
    category: 'combat-core',
    label: 'Basic Shot — Impact',
    description: '通常の初期 Power 弾が敵へ命中した瞬間の音。',
    runtimeKey: SFX_KEY_PLAYER_HIT_POWER,
    runtimePath: SFX_PATH_PLAYER_HIT_POWER,
    dedicatedRuntimeSfx: true,
    // 旧 Entry id: enemy.hit.power
    variants: [
      runtimeVariant(
        'skill.power.impact-runtime',
        SFX_PATH_PLAYER_HIT_POWER,
        SFX_KEY_PLAYER_HIT_POWER,
        { source: 'runtime', license: 'repository' },
      ),
      ...abcCandidates('skill.power.impact', 'player_hit_power', false),
      ...COMBAT_CORE_EXTERNAL_IMPACT_VARIANTS,
    ],
    burstModes: burstHit(),
    initialStatus: 'unreviewed',
    recommendations: COMBAT_CORE_EXTERNAL_IMPACT_RECOMMENDATIONS,
  },
  {
    id: SURVIVOR_SFX_EVENT_IDS.ENEMY_DEFEAT,
    eventId: SURVIVOR_SFX_EVENT_IDS.ENEMY_DEFEAT,
    category: 'combat-core',
    label: 'Enemy — Defeat',
    description: '敵の HP が 0 になり、撃破・消滅した際の音。',
    runtimeKey: SFX_KEY_ENEMY_DEFEAT,
    runtimePath: SFX_PATH_ENEMY_DEFEAT,
    sharedWith: ['skill.blast', 'skill.orb.hit'],
    dedicatedRuntimeSfx: true,
    variants: [
      runtimeVariant(
        'enemy.defeat-runtime',
        SFX_PATH_ENEMY_DEFEAT,
        SFX_KEY_ENEMY_DEFEAT,
        { source: 'Kenney', license: 'CC0', sourceName: 'Kenney', licenseName: 'CC0' },
      ),
      revisionVariant('enemy.defeat-rev', 'assets/audio/enemy_defeat.ogg', {
        source: 'repository-generated',
      }),
      candidateVariant('B', 'enemy.defeat-cand-b', `${CAND}/enemy_defeat_b.ogg`),
      candidateVariant('C', 'enemy.defeat-cand-c', `${CAND}/enemy_defeat_c.ogg`),
      ...COMBAT_CORE_EXTERNAL_DEFEAT_VARIANTS,
    ],
    burstModes: [
      { id: 'single', label: 'Single', count: 1, intervalMs: 0 },
      { id: 'x3', label: 'x3', count: 3, intervalMs: ENEMY_DEFEAT_SFX_COOLDOWN_MS },
      { id: 'x8', label: 'x8', count: 8, intervalMs: ENEMY_DEFEAT_SFX_COOLDOWN_MS },
    ],
    initialStatus: 'unreviewed',
    recommendations: COMBAT_CORE_EXTERNAL_DEFEAT_RECOMMENDATIONS,
  },

  // ---- Player fire（属性。Power は Combat Core の skill.power.cast へ移行済み） ----
  fireElementEntry(
    'player.fire.wind',
    'Wind Fire',
    SFX_KEY_PLAYER_FIRE_WIND,
    SFX_PATH_PLAYER_FIRE_WIND,
    'player_fire_wind',
  ),
  fireElementEntry(
    'player.fire.water',
    'Water Fire',
    SFX_KEY_PLAYER_FIRE_WATER,
    SFX_PATH_PLAYER_FIRE_WATER,
    'player_fire_water',
  ),
  fireElementEntry(
    'player.fire.fire',
    'Fire Fire',
    SFX_KEY_PLAYER_FIRE_FIRE,
    SFX_PATH_PLAYER_FIRE_FIRE,
    'player_fire_fire',
  ),
  fireElementEntry(
    'player.fire.earth',
    'Earth Fire',
    SFX_KEY_PLAYER_FIRE_EARTH,
    SFX_PATH_PLAYER_FIRE_EARTH,
    'player_fire_earth',
  ),
  {
    id: 'player.hurt',
    category: 'player',
    label: 'Player Hurt',
    description: 'Contact damage and enemy bullet hit share this sound',
    runtimeKey: SFX_KEY_PLAYER_HURT,
    runtimePath: SFX_PATH_PLAYER_HURT,
    sharedWith: ['enemy.projectile.hit'],
    dedicatedRuntimeSfx: true,
    variants: [
      runtimeVariant('player.hurt-runtime', SFX_PATH_PLAYER_HURT, SFX_KEY_PLAYER_HURT, {
        source: 'runtime',
        license: 'repository',
      }),
      ...abcCandidates('player.hurt', 'player_hurt', false),
    ],
    burstModes: burstSingle(),
    initialStatus: 'unreviewed',
  },

  // ---- Enemy（Power hit は Combat Core の skill.power.impact へ移行済み） ----
  hitElementEntry(
    'enemy.hit.wind',
    'Enemy Hit Wind',
    SFX_KEY_PLAYER_HIT_WIND,
    SFX_PATH_PLAYER_HIT_WIND,
    'player_hit_wind',
  ),
  hitElementEntry(
    'enemy.hit.water',
    'Enemy Hit Water',
    SFX_KEY_PLAYER_HIT_WATER,
    SFX_PATH_PLAYER_HIT_WATER,
    'player_hit_water',
  ),
  hitElementEntry(
    'enemy.hit.fire',
    'Enemy Hit Fire',
    SFX_KEY_PLAYER_HIT_FIRE,
    SFX_PATH_PLAYER_HIT_FIRE,
    'player_hit_fire',
  ),
  hitElementEntry(
    'enemy.hit.earth',
    'Enemy Hit Earth',
    SFX_KEY_PLAYER_HIT_EARTH,
    SFX_PATH_PLAYER_HIT_EARTH,
    'player_hit_earth',
    undefined,
    true,
  ),
  {
    id: 'enemy.blocked',
    category: 'enemy',
    label: 'Enemy Blocked',
    runtimeKey: SFX_KEY_ENEMY_BLOCKED,
    runtimePath: SFX_PATH_ENEMY_BLOCKED,
    dedicatedRuntimeSfx: true,
    variants: [
      runtimeVariant(
        'enemy.blocked-runtime',
        SFX_PATH_ENEMY_BLOCKED,
        SFX_KEY_ENEMY_BLOCKED,
        { source: 'Kenney', license: 'CC0', sourceName: 'Kenney', licenseName: 'CC0' },
      ),
      ...abcCandidates('enemy.blocked', 'enemy_blocked', false),
      legacyVariant('enemy.blocked-legacy', 'assets/audio/enemy_blocked.ogg'),
    ],
    burstModes: burstHit(),
    initialStatus: 'unreviewed',
  },

  // ---- Pickup ----
  {
    id: 'pickup.xp',
    category: 'pickup',
    label: 'Pickup XP',
    description: 'Shares Coin Pickup runtime sound with gold',
    runtimeKey: SFX_KEY_COIN_PICKUP,
    runtimePath: SFX_PATH_COIN_PICKUP,
    sharedWith: ['pickup.gold'],
    dedicatedRuntimeSfx: true,
    variants: [
      runtimeVariant('pickup.xp-runtime', SFX_PATH_COIN_PICKUP, SFX_KEY_COIN_PICKUP, {
        source: 'Kenney',
        license: 'CC0',
        sourceName: 'Kenney',
        licenseName: 'CC0',
      }),
      ...abcCandidates('pickup.xp', 'coin_pickup', false),
      legacyVariant('pickup.xp-legacy', 'assets/audio/coin_pickup.ogg'),
    ],
    burstModes: burstUi(),
    initialStatus: 'unreviewed',
  },
  {
    id: 'pickup.gold',
    category: 'pickup',
    label: 'Pickup Gold',
    description: 'Shares Coin Pickup runtime sound with XP',
    runtimeKey: SFX_KEY_COIN_PICKUP,
    runtimePath: SFX_PATH_COIN_PICKUP,
    sharedWith: ['pickup.xp'],
    dedicatedRuntimeSfx: true,
    variants: [
      runtimeVariant('pickup.gold-runtime', SFX_PATH_COIN_PICKUP, SFX_KEY_COIN_PICKUP, {
        source: 'Kenney',
        license: 'CC0',
        sourceName: 'Kenney',
        licenseName: 'CC0',
      }),
      ...abcCandidates('pickup.gold', 'coin_pickup', false),
      legacyVariant('pickup.gold-legacy', 'assets/audio/coin_pickup.ogg'),
    ],
    burstModes: burstUi(),
    initialStatus: 'unreviewed',
  },

  // ---- Progression ----
  {
    id: 'progression.level_up',
    category: 'progression',
    label: 'Level Up',
    description: 'Also used for pierce/blast/ricochet unlock banners',
    runtimeKey: SFX_KEY_LEVEL_UP,
    runtimePath: SFX_PATH_LEVEL_UP,
    sharedWith: ['skill.pierce', 'skill.blast', 'skill.ricochet', 'skill.orb.obtain'],
    dedicatedRuntimeSfx: true,
    variants: [
      runtimeVariant(
        'progression.level_up-runtime',
        SFX_PATH_LEVEL_UP,
        SFX_KEY_LEVEL_UP,
        { source: 'Kenney', license: 'CC0', sourceName: 'Kenney', licenseName: 'CC0' },
      ),
      legacyVariant('progression.level_up-legacy', 'assets/audio/level_up.ogg'),
    ],
    burstModes: burstSingle(),
    initialStatus: 'unreviewed',
  },
  {
    id: 'progression.stage_clear',
    category: 'progression',
    label: 'Stage Clear',
    runtimeKey: SFX_KEY_STAGE_CLEAR,
    runtimePath: SFX_PATH_STAGE_CLEAR,
    dedicatedRuntimeSfx: true,
    variants: [
      runtimeVariant(
        'progression.stage_clear-runtime',
        SFX_PATH_STAGE_CLEAR,
        SFX_KEY_STAGE_CLEAR,
        { source: 'runtime', license: 'repository' },
      ),
    ],
    burstModes: burstSingle(),
    initialStatus: 'unreviewed',
  },
  {
    id: 'progression.area_clear',
    category: 'progression',
    label: 'Area Clear',
    description: 'Also used as Victory jingle',
    runtimeKey: SFX_KEY_AREA_CLEAR,
    runtimePath: SFX_PATH_AREA_CLEAR,
    dedicatedRuntimeSfx: true,
    variants: [
      runtimeVariant(
        'progression.area_clear-runtime',
        SFX_PATH_AREA_CLEAR,
        SFX_KEY_AREA_CLEAR,
        { source: 'runtime', license: 'repository' },
      ),
    ],
    burstModes: burstSingle(),
    initialStatus: 'unreviewed',
  },

  // ---- Skill (dedicated) ----
  {
    id: 'skill.orb.obtain',
    category: 'skill',
    label: 'Orbiting Orb Obtain',
    description: 'Unlock also plays Level Up',
    runtimeKey: SFX_KEY_ORBITING_ORB_OBTAIN,
    runtimePath: SFX_PATH_ORBITING_ORB_OBTAIN,
    sharedWith: ['progression.level_up'],
    dedicatedRuntimeSfx: true,
    variants: [
      runtimeVariant(
        'skill.orb.obtain-runtime',
        SFX_PATH_ORBITING_ORB_OBTAIN,
        SFX_KEY_ORBITING_ORB_OBTAIN,
        { source: 'repository-generated', license: 'repository' },
      ),
    ],
    burstModes: burstSingle(),
    initialStatus: 'missing-candidates',
  },
  {
    id: 'skill.orb.hit',
    category: 'skill',
    label: 'Orbiting Orb Hit',
    runtimeKey: SFX_KEY_ORBITING_ORB_HIT,
    runtimePath: SFX_PATH_ORBITING_ORB_HIT,
    dedicatedRuntimeSfx: true,
    variants: [
      runtimeVariant(
        'skill.orb.hit-runtime',
        SFX_PATH_ORBITING_ORB_HIT,
        SFX_KEY_ORBITING_ORB_HIT,
        { source: 'repository-generated', license: 'repository' },
      ),
    ],
    burstModes: [
      { id: 'single', label: 'Single', count: 1, intervalMs: 0 },
      {
        id: 'x3',
        label: 'x3',
        count: 3,
        intervalMs: ORBITING_ORB_HIT_SFX_COOLDOWN_MS,
      },
      {
        id: 'x8',
        label: 'x8',
        count: 8,
        intervalMs: ORBITING_ORB_HIT_SFX_COOLDOWN_MS,
      },
    ],
    initialStatus: 'missing-candidates',
  },
  {
    id: 'skill.orb.shatter',
    category: 'skill',
    label: 'Orbiting Orb Shatter',
    runtimeKey: SFX_KEY_ORBITING_ORB_SHATTER,
    runtimePath: SFX_PATH_ORBITING_ORB_SHATTER,
    dedicatedRuntimeSfx: true,
    variants: [
      runtimeVariant(
        'skill.orb.shatter-runtime',
        SFX_PATH_ORBITING_ORB_SHATTER,
        SFX_KEY_ORBITING_ORB_SHATTER,
        { source: 'repository-generated', license: 'repository' },
      ),
    ],
    burstModes: [
      { id: 'single', label: 'Single', count: 1, intervalMs: 0 },
      {
        id: 'x3',
        label: 'x3',
        count: 3,
        intervalMs: ORBITING_ORB_SHATTER_SFX_COOLDOWN_MS,
      },
      {
        id: 'x8',
        label: 'x8',
        count: 8,
        intervalMs: ORBITING_ORB_SHATTER_SFX_COOLDOWN_MS,
      },
    ],
    initialStatus: 'missing-candidates',
  },

  // ---- System / UI ----
  {
    id: 'system.game_over',
    category: 'system',
    label: 'Game Over',
    runtimeKey: SFX_KEY_GAME_OVER,
    runtimePath: SFX_PATH_GAME_OVER,
    dedicatedRuntimeSfx: true,
    variants: [
      runtimeVariant(
        'system.game_over-runtime',
        SFX_PATH_GAME_OVER,
        SFX_KEY_GAME_OVER,
        { source: 'runtime', license: 'repository' },
      ),
    ],
    burstModes: burstSingle(),
    initialStatus: 'missing-candidates',
  },
  {
    id: 'ui.move',
    category: 'ui',
    label: 'UI Move',
    runtimeKey: SFX_KEY_MENU_MOVE,
    runtimePath: SFX_PATH_MENU_MOVE,
    dedicatedRuntimeSfx: true,
    variants: [
      runtimeVariant('ui.move-runtime', SFX_PATH_MENU_MOVE, SFX_KEY_MENU_MOVE, {
        source: 'Kenney',
        license: 'CC0',
        sourceName: 'Kenney',
        licenseName: 'CC0',
      }),
      ...abcCandidates('ui.move', 'menu_move', false),
      legacyVariant('ui.move-legacy', 'assets/audio/menu_move.ogg'),
    ],
    burstModes: burstUi(),
    initialStatus: 'unreviewed',
  },
  {
    id: 'ui.accept',
    category: 'ui',
    label: 'UI Accept',
    description: 'Shop purchase / confirm / open Preview·Credits share this',
    runtimeKey: SFX_KEY_SHOP_PURCHASE,
    runtimePath: SFX_PATH_SHOP_PURCHASE,
    dedicatedRuntimeSfx: true,
    variants: [
      runtimeVariant(
        'ui.accept-runtime',
        SFX_PATH_SHOP_PURCHASE,
        SFX_KEY_SHOP_PURCHASE,
        { source: 'Kenney', license: 'CC0', sourceName: 'Kenney', licenseName: 'CC0' },
      ),
      ...abcCandidates('ui.accept', 'shop_purchase', false),
      legacyVariant('ui.accept-legacy', 'assets/audio/shop_purchase.ogg'),
    ],
    burstModes: burstUi(),
    initialStatus: 'unreviewed',
  },
  {
    id: 'ui.cancel',
    category: 'ui',
    label: 'UI Cancel',
    runtimeKey: SFX_KEY_MENU_CANCEL,
    runtimePath: SFX_PATH_MENU_CANCEL,
    dedicatedRuntimeSfx: true,
    variants: [
      runtimeVariant(
        'ui.cancel-runtime',
        SFX_PATH_MENU_CANCEL,
        SFX_KEY_MENU_CANCEL,
        { source: 'Kenney', license: 'CC0', sourceName: 'Kenney', licenseName: 'CC0' },
      ),
      ...abcCandidates('ui.cancel', 'menu_cancel', false),
      legacyVariant('ui.cancel-legacy', 'assets/audio/menu_cancel.ogg'),
    ],
    burstModes: burstUi(),
    initialStatus: 'unreviewed',
  },

  // ---- No dedicated runtime SFX (future candidates) ----
  {
    id: 'skill.blast',
    category: 'skill',
    label: 'Blast',
    description: 'Uses normal hit / Enemy Defeat sounds today',
    dedicatedRuntimeSfx: false,
    sharedWith: ['enemy.defeat', 'skill.power.impact'],
    variants: EXTERNAL_SKILL_BLAST,
    burstModes: burstSingle(),
    initialStatus: 'unreviewed',
    recommendations: [
      {
        variantId: 'skill.blast-external-06',
        rank: 1,
        direction: ['balanced', 'strong', 'heavy'],
        reason:
          '十分な質量と持続があり、金属・木材より抽象的な強打として試しやすい。',
      },
      {
        variantId: 'skill.blast-external-02',
        rank: 2,
        direction: ['crystal', 'bright', 'short'],
        reason: '結晶的な魔法表現を期待でき、短く範囲攻撃の輪郭を出しやすい。',
      },
      {
        variantId: 'skill.blast-external-07',
        rank: 3,
        direction: ['organic', 'strong'],
        reason: '金属感を避けた別方向で、十分な強さがある。',
      },
    ],
    deprioritizedVariantIds: [
      'skill.blast-external-01',
      'skill.blast-external-08',
      'skill.blast-external-10',
    ],
  },
  {
    id: 'skill.pierce',
    category: 'skill',
    label: 'Pierce',
    description: 'Uses element Fire / Hit sounds today',
    dedicatedRuntimeSfx: false,
    sharedWith: ['skill.power.cast', 'skill.power.impact'],
    variants: EXTERNAL_SKILL_PIERCE,
    burstModes: burstSingle(),
    initialStatus: 'unreviewed',
    recommendations: [
      {
        variantId: 'skill.pierce-external-03',
        rank: 1,
        direction: ['strong', 'short'],
        reason: '同パック内で存在感が強く、貫通を明確に伝えやすい。',
      },
      {
        variantId: 'skill.pierce-external-02',
        rank: 2,
        direction: ['short', 'balanced'],
        reason: '非常に短く、連続再生へ向いている。',
      },
      {
        variantId: 'skill.pierce-external-07',
        rank: 3,
        direction: ['strong', 'long'],
        reason: 'Top 2より厚みのある方向性を持つ。',
      },
    ],
    deprioritizedVariantIds: [
      'skill.pierce-external-09',
      'skill.pierce-external-10',
      'skill.pierce-external-01',
    ],
  },
  {
    id: 'skill.ricochet',
    category: 'skill',
    label: 'Ricochet',
    description: 'Uses element Fire / Hit sounds today',
    dedicatedRuntimeSfx: false,
    sharedWith: ['skill.power.cast', 'skill.power.impact'],
    variants: EXTERNAL_SKILL_RICOCHET,
    burstModes: burstSingle(),
    initialStatus: 'unreviewed',
    recommendations: [
      {
        variantId: 'skill.ricochet-external-01',
        rank: 1,
        direction: ['crystal', 'bright', 'short'],
        reason: '魔法世界と跳ね返りの両方に合わせやすい。',
      },
      {
        variantId: 'skill.ricochet-external-04',
        rank: 2,
        direction: ['metallic', 'short', 'strong'],
        reason: '短く輪郭が明確で、反射を認識しやすい。',
      },
      {
        variantId: 'skill.ricochet-external-09',
        rank: 3,
        direction: ['soft', 'organic', 'short'],
        reason: '非金属の控えめな反射案として方向性が異なる。',
      },
    ],
    deprioritizedVariantIds: [
      'skill.ricochet-external-05',
      'skill.ricochet-external-06',
      'skill.ricochet-external-07',
    ],
  },
  {
    id: 'enemy.projectile.fire',
    category: 'enemy',
    label: 'Enemy Projectile Fire',
    dedicatedRuntimeSfx: false,
    variants: EXTERNAL_ENEMY_PROJECTILE_FIRE,
    burstModes: burstSingle(),
    initialStatus: 'unreviewed',
    recommendations: [
      {
        variantId: 'enemy.projectile.fire-external-01',
        rank: 1,
        direction: ['strong', 'short'],
        reason: '発射の瞬間を明確に伝えやすい。',
      },
      {
        variantId: 'enemy.projectile.fire-external-09',
        rank: 2,
        direction: ['organic', 'dark', 'short'],
        reason: '暗めで有機的な方向性があり、Player音との差別化候補になる。',
      },
      {
        variantId: 'enemy.projectile.fire-external-06',
        rank: 3,
        direction: ['organic', 'strong', 'long'],
        reason: 'より厚い敵発射音として比較できる。',
      },
    ],
    deprioritizedVariantIds: [
      'enemy.projectile.fire-external-04',
      'enemy.projectile.fire-external-05',
      'enemy.projectile.fire-external-03',
    ],
  },
  {
    id: 'enemy.projectile.hit',
    category: 'enemy',
    label: 'Enemy Projectile Hit',
    description: 'Routes to Player Hurt today',
    dedicatedRuntimeSfx: false,
    sharedWith: ['player.hurt'],
    variants: EXTERNAL_ENEMY_PROJECTILE_HIT,
    burstModes: burstSingle(),
    initialStatus: 'unreviewed',
    recommendations: [
      {
        variantId: 'enemy.projectile.hit-external-01',
        rank: 1,
        direction: ['soft', 'balanced', 'short'],
        reason: '非金属で短く、Player Hurtと重なっても過密になりにくい。',
      },
      {
        variantId: 'enemy.projectile.hit-external-03',
        rank: 2,
        direction: ['crystal', 'bright', 'short'],
        reason: '魔法弾らしい結晶方向の候補。',
      },
      {
        variantId: 'enemy.projectile.hit-external-10',
        rank: 3,
        direction: ['arcane', 'bright'],
        reason: '接触音を魔法的に区別する別方向の候補。',
      },
    ],
    deprioritizedVariantIds: [
      'enemy.projectile.hit-external-09',
      'enemy.projectile.hit-external-08',
      'enemy.projectile.hit-external-06',
    ],
  },
  {
    id: 'boss.attack',
    category: 'enemy',
    label: 'Boss Attack',
    dedicatedRuntimeSfx: false,
    variants: EXTERNAL_BOSS_ATTACK,
    burstModes: burstSingle(),
    initialStatus: 'unreviewed',
    recommendations: [
      {
        variantId: 'boss.attack-external-05',
        rank: 1,
        direction: ['heavy', 'strong', 'long'],
        reason: '重量があり、Boss用として十分な存在感を確認できる。',
      },
      {
        variantId: 'boss.attack-external-01',
        rank: 2,
        direction: ['strong', 'balanced'],
        reason: '長すぎず、攻撃発動音として扱いやすい。',
      },
      {
        variantId: 'boss.attack-external-06',
        rank: 3,
        direction: ['arcane', 'bright', 'heavy'],
        reason: '魔法的・予兆的な別方向の候補。',
      },
    ],
    deprioritizedVariantIds: [
      'boss.attack-external-08',
      'boss.attack-external-07',
      'boss.attack-external-09',
    ],
  },
  {
    id: 'enemy.summon',
    category: 'enemy',
    label: 'Enemy Summon',
    dedicatedRuntimeSfx: false,
    variants: EXTERNAL_ENEMY_SUMMON,
    burstModes: burstSingle(),
    initialStatus: 'unreviewed',
    recommendations: [
      {
        variantId: 'enemy.summon-external-01',
        rank: 1,
        direction: ['arcane', 'balanced'],
        reason: '開放という意味と適度な長さが召喚開始に合いやすい。',
      },
      {
        variantId: 'enemy.summon-external-02',
        rank: 2,
        direction: ['arcane', 'bright', 'short'],
        reason: '出現の上昇感があり、テンポを阻害しにくい。',
      },
      {
        variantId: 'enemy.summon-external-03',
        rank: 3,
        direction: ['dark', 'arcane', 'strong'],
        reason: '不穏で明確な別方向の候補。',
      },
    ],
    deprioritizedVariantIds: [
      'enemy.summon-external-06',
      'enemy.summon-external-07',
      'enemy.summon-external-10',
    ],
  },
  {
    id: 'player.heal',
    category: 'player',
    label: 'Player Heal',
    description: 'Visual + Level Up cue today',
    dedicatedRuntimeSfx: false,
    sharedWith: ['progression.level_up'],
    variants: EXTERNAL_PLAYER_HEAL,
    burstModes: burstSingle(),
    initialStatus: 'unreviewed',
    recommendations: [
      {
        variantId: 'player.heal-external-02',
        rank: 1,
        direction: ['bright', 'arcane', 'balanced'],
        reason: '上昇方向が明確で、回復の意味を伝えやすい。',
      },
      {
        variantId: 'player.heal-external-04',
        rank: 2,
        direction: ['crystal', 'bright', 'long'],
        reason: '魔法的で安心感のある結晶方向の候補。',
      },
      {
        variantId: 'player.heal-external-05',
        rank: 3,
        direction: ['soft', 'arcane', 'short'],
        reason: '短く控えめな回復音として方向性が異なる。',
      },
    ],
    deprioritizedVariantIds: [
      'player.heal-external-03',
      'player.heal-external-08',
      'player.heal-external-10',
    ],
  },
  {
    id: 'progression.stage_countdown',
    category: 'progression',
    label: 'Stage Countdown',
    dedicatedRuntimeSfx: false,
    variants: [],
    burstModes: burstSingle(),
    initialStatus: 'missing-candidates',
  },
  {
    id: 'progression.resume_countdown',
    category: 'progression',
    label: 'Resume Countdown',
    dedicatedRuntimeSfx: false,
    variants: [],
    burstModes: burstSingle(),
    initialStatus: 'missing-candidates',
  },
  {
    id: 'progression.stage_start',
    category: 'progression',
    label: 'Stage Start',
    description: 'BGM start only today',
    dedicatedRuntimeSfx: false,
    variants: [],
    burstModes: burstSingle(),
    initialStatus: 'missing-candidates',
  },
]

export function countCandidateVariants(entry: SfxCatalogEntry): number {
  let count = 0
  for (let index = 0; index < entry.variants.length; index++) {
    if (entry.variants[index].status === 'candidate') {
      count = count + 1
    }
  }
  return count
}

export function pickDefaultVariantId(entry: SfxCatalogEntry): string | null {
  const order: SfxCatalogVariantStatus[] = [
    'runtime',
    'revision',
    'candidate',
    'legacy',
  ]
  for (let statusIndex = 0; statusIndex < order.length; statusIndex++) {
    const status = order[statusIndex]
    for (let index = 0; index < entry.variants.length; index++) {
      if (entry.variants[index].status === status) {
        return entry.variants[index].id
      }
    }
  }
  if (entry.variants.length > 0) {
    return entry.variants[0].id
  }
  return null
}

export function findCatalogEntry(entryId: string): SfxCatalogEntry | null {
  for (let index = 0; index < SFX_CATALOG.length; index++) {
    if (SFX_CATALOG[index].id === entryId) {
      return SFX_CATALOG[index]
    }
  }
  return null
}

export function findCatalogVariant(
  entry: SfxCatalogEntry,
  variantId: string,
): SfxCatalogVariant | null {
  for (let index = 0; index < entry.variants.length; index++) {
    if (entry.variants[index].id === variantId) {
      return entry.variants[index]
    }
  }
  return null
}

/** external-free（Kenney / OpenGameArt など）の候補を1つでも持つか */
export function entryHasExternalCandidates(entry: SfxCatalogEntry): boolean {
  for (let index = 0; index < entry.variants.length; index++) {
    if (entry.variants[index].origin === 'external-free') {
      return true
    }
  }
  return false
}

/** Review All モードの対象になる SFX エントリ一覧 */
export function getReviewAllEntries(): SfxCatalogEntry[] {
  const result: SfxCatalogEntry[] = []
  const seenIds: Record<string, boolean> = {}

  // Combat Core を先頭固定順で入れる（cast → impact → defeat）
  for (let index = 0; index < COMBAT_CORE_SFX_EVENT_IDS.length; index++) {
    const eventId = COMBAT_CORE_SFX_EVENT_IDS[index]
    const entry = findCatalogEntry(eventId)
    if (entry !== null) {
      result.push(entry)
      seenIds[entry.id] = true
    }
  }

  for (let index = 0; index < SFX_CATALOG.length; index++) {
    const entry = SFX_CATALOG[index]
    if (seenIds[entry.id] === true) {
      continue
    }
    if (entry.category === 'combat-core' || entryHasExternalCandidates(entry)) {
      result.push(entry)
      seenIds[entry.id] = true
    }
  }
  return result
}

/**
 * Review All の一覧表示順に variant を並べ替える。
 * 並び順: 採用中(adopt) → runtime → おすすめ1〜3位 → revision →
 *        その他の候補 → 優先度低(deprioritized) → legacy
 * 同じ variant が2回出ないようにする。
 * Python: 各グループを順番に走査して、まだ使っていない id だけ結果に足す、に相当
 */
export function sortVariantsForReview(
  entry: SfxCatalogEntry,
  adoptedVariantId: string | null,
): SfxCatalogVariant[] {
  const result: SfxCatalogVariant[] = []
  const usedVariantIds: Record<string, boolean> = {}

  function addVariantById(variantId: string | null): void {
    if (variantId === null) {
      return
    }
    if (usedVariantIds[variantId] === true) {
      return
    }
    const variant = findCatalogVariant(entry, variantId)
    if (variant === null) {
      return
    }
    usedVariantIds[variantId] = true
    result.push(variant)
  }

  addVariantById(adoptedVariantId)

  for (let index = 0; index < entry.variants.length; index++) {
    if (entry.variants[index].status === 'runtime') {
      addVariantById(entry.variants[index].id)
    }
  }

  const recommendations = entry.recommendations ?? []
  const sortedRecommendations = recommendations.slice().sort((a, b) => a.rank - b.rank)
  for (let index = 0; index < sortedRecommendations.length; index++) {
    addVariantById(sortedRecommendations[index].variantId)
  }

  for (let index = 0; index < entry.variants.length; index++) {
    if (entry.variants[index].status === 'revision') {
      addVariantById(entry.variants[index].id)
    }
  }

  const deprioritizedIds = entry.deprioritizedVariantIds ?? []
  for (let index = 0; index < entry.variants.length; index++) {
    const variant = entry.variants[index]
    if (variant.status === 'candidate' && deprioritizedIds.indexOf(variant.id) < 0) {
      addVariantById(variant.id)
    }
  }

  for (let index = 0; index < deprioritizedIds.length; index++) {
    addVariantById(deprioritizedIds[index])
  }

  for (let index = 0; index < entry.variants.length; index++) {
    if (entry.variants[index].status === 'legacy') {
      addVariantById(entry.variants[index].id)
    }
  }

  // 念のため取りこぼした variant があれば末尾に足す
  for (let index = 0; index < entry.variants.length; index++) {
    addVariantById(entry.variants[index].id)
  }

  return result
}
