import { describe, expect, it } from 'vitest'
import {
  COMBAT_CORE_EXTERNAL_CAST_RECOMMENDATIONS,
  COMBAT_CORE_EXTERNAL_CAST_VARIANTS,
  COMBAT_CORE_EXTERNAL_DEFEAT_RECOMMENDATIONS,
  COMBAT_CORE_EXTERNAL_DEFEAT_VARIANTS,
  COMBAT_CORE_EXTERNAL_ENTRY_IDS,
  COMBAT_CORE_EXTERNAL_IMPACT_RECOMMENDATIONS,
  COMBAT_CORE_EXTERNAL_IMPACT_VARIANTS,
} from './combatCoreExternalCandidates'
import {
  countCandidateVariants,
  findCatalogEntry,
  findCatalogVariant,
  type SfxCatalogVariant,
} from './sfxCatalog'

const ENTRY_SPECS = [
  {
    entryId: 'skill.power.cast',
    folder: 'skill-power-cast',
    variants: COMBAT_CORE_EXTERNAL_CAST_VARIANTS,
    recommendations: COMBAT_CORE_EXTERNAL_CAST_RECOMMENDATIONS,
    existingMinCandidates: 2,
  },
  {
    entryId: 'skill.power.impact',
    folder: 'skill-power-impact',
    variants: COMBAT_CORE_EXTERNAL_IMPACT_VARIANTS,
    recommendations: COMBAT_CORE_EXTERNAL_IMPACT_RECOMMENDATIONS,
    existingMinCandidates: 3,
  },
  {
    entryId: 'enemy.defeat',
    folder: 'enemy-defeat',
    variants: COMBAT_CORE_EXTERNAL_DEFEAT_VARIANTS,
    recommendations: COMBAT_CORE_EXTERNAL_DEFEAT_RECOMMENDATIONS,
    existingMinCandidates: 2,
  },
] as const

describe('Combat Core external candidate registration', () => {
  it('生成データが各 Entry 15件で、Catalog に登録されている', () => {
    expect(COMBAT_CORE_EXTERNAL_ENTRY_IDS).toHaveLength(3)
    const allNewIds: Record<string, boolean> = {}

    for (let entryIndex = 0; entryIndex < ENTRY_SPECS.length; entryIndex++) {
      const spec = ENTRY_SPECS[entryIndex]
      expect(spec.variants).toHaveLength(15)

      const entry = findCatalogEntry(spec.entryId)
      expect(entry).not.toBeNull()
      if (entry === null) {
        continue
      }

      for (let index = 0; index < 15; index++) {
        const expectedId = `${spec.entryId}-external-${String(index + 1).padStart(2, '0')}`
        const generated = spec.variants[index]
        expect(generated.id).toBe(expectedId)
        expect(generated.status).toBe('candidate')
        expect(generated.origin).toBe('external-free')
        expect(generated.path.indexOf(`assets/audio/candidates/external/${spec.folder}/`)).toBe(0)
        expect(generated.checksumSha256 !== undefined && generated.checksumSha256.length > 0).toBe(
          true,
        )
        expect(generated.licenseName !== undefined && generated.licenseName.length > 0).toBe(true)
        expect(generated.sourceName !== undefined && generated.sourceName.length > 0).toBe(true)
        expect(generated.label.indexOf('external-') < 0 || generated.label.indexOf(' — ') >= 0).toBe(
          true,
        )

        const inCatalog = findCatalogVariant(entry, generated.id)
        expect(inCatalog).not.toBeNull()
        expect(inCatalog?.path).toBe(generated.path)

        expect(allNewIds[generated.id]).toBeUndefined()
        allNewIds[generated.id] = true
      }

      const externalCount = spec.variants.length
      expect(countCandidateVariants(entry) - externalCount).toBeGreaterThanOrEqual(
        spec.existingMinCandidates,
      )

      let runtimeCount = 0
      for (let variantIndex = 0; variantIndex < entry.variants.length; variantIndex++) {
        if (entry.variants[variantIndex].status === 'runtime') {
          runtimeCount = runtimeCount + 1
        }
      }
      expect(runtimeCount).toBe(1)

      expect(spec.recommendations).toHaveLength(3)
      expect(spec.recommendations[0].variantId).toBe(`${spec.entryId}-external-01`)
      expect(spec.recommendations[0].rank).toBe(1)
      expect(entry.recommendations?.[0].variantId).toBe(`${spec.entryId}-external-01`)
      expect(entry.recommendations?.[1].variantId).toBe(`${spec.entryId}-external-02`)
      expect(entry.recommendations?.[2].variantId).toBe(`${spec.entryId}-external-03`)
    }

    expect(Object.keys(allNewIds)).toHaveLength(45)
  })

  it('Entry 内・Entry 間で Candidate ID が重複しない', () => {
    const seen: Record<string, boolean> = {}
    for (let entryIndex = 0; entryIndex < ENTRY_SPECS.length; entryIndex++) {
      const entry = findCatalogEntry(ENTRY_SPECS[entryIndex].entryId)
      expect(entry).not.toBeNull()
      if (entry === null) {
        continue
      }
      for (let index = 0; index < entry.variants.length; index++) {
        const variant = entry.variants[index] as SfxCatalogVariant
        expect(seen[variant.id]).toBeUndefined()
        seen[variant.id] = true
      }
    }
  })
})
