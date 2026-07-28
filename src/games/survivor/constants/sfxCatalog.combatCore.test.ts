import { describe, expect, it } from 'vitest'
import {
  COMBAT_CORE_SFX_EVENT_IDS,
  isSurvivorSfxEventId,
  resolveCombatCoreSfxEventPath,
  resolveSurvivorSfxEventKey,
} from '../audio/sfxEvents'
import {
  countCandidateVariants,
  findCatalogEntry,
  getReviewAllEntries,
  SFX_CATALOG,
  type SfxCatalogEntry,
} from './sfxCatalog'

describe('Combat Core Catalog coverage', () => {
  it('3 Entry が独立し、Event Map と Runtime Variant を持つ', () => {
    const labels = [
      'Basic Shot — Cast',
      'Basic Shot — Impact',
      'Enemy — Defeat',
    ]

    for (let index = 0; index < COMBAT_CORE_SFX_EVENT_IDS.length; index++) {
      const eventId = COMBAT_CORE_SFX_EVENT_IDS[index]
      const entry = findCatalogEntry(eventId)
      expect(entry).not.toBeNull()
      if (entry === null) {
        continue
      }

      expect(entry.id).toBe(eventId)
      expect(entry.eventId).toBe(eventId)
      const entryEventId = entry.eventId
      expect(entryEventId).toBeDefined()
      if (entryEventId === undefined) {
        continue
      }
      expect(isSurvivorSfxEventId(entryEventId)).toBe(true)
      expect(entry.category).toBe('combat-core')
      expect(entry.label).toBe(labels[index])
      expect(entry.dedicatedRuntimeSfx).toBe(true)
      expect(entry.runtimeKey).toBe(resolveSurvivorSfxEventKey(entryEventId))
      expect(entry.runtimePath).toBe(resolveCombatCoreSfxEventPath(eventId))

      let runtimeVariantCount = 0
      for (let variantIndex = 0; variantIndex < entry.variants.length; variantIndex++) {
        if (entry.variants[variantIndex].status === 'runtime') {
          runtimeVariantCount = runtimeVariantCount + 1
          expect(entry.variants[variantIndex].path).toBe(entry.runtimePath)
          expect(entry.variants[variantIndex].formalKey ?? entry.variants[variantIndex].audioKey).toBeTruthy()
        }
      }
      expect(runtimeVariantCount).toBe(1)
      expect(countCandidateVariants(entry) + entry.variants.length).toBeGreaterThan(1)
    }
  })

  it('Catalog ID と Event ID の重複がない', () => {
    const seenEntryIds: Record<string, boolean> = {}
    const seenEventIds: Record<string, boolean> = {}

    for (let index = 0; index < SFX_CATALOG.length; index++) {
      const entry = SFX_CATALOG[index]
      expect(seenEntryIds[entry.id]).toBeUndefined()
      seenEntryIds[entry.id] = true

      if (entry.eventId === undefined) {
        continue
      }
      expect(seenEventIds[entry.eventId]).toBeUndefined()
      seenEventIds[entry.eventId] = true
      expect(entry.id).toBe(entry.eventId)
    }
  })

  it('同一 Entry 内で Candidate ID が重複しない', () => {
    for (let index = 0; index < SFX_CATALOG.length; index++) {
      assertUniqueVariantIds(SFX_CATALOG[index])
    }
  })

  it('Review All に Combat Core 3 Entry が先頭で含まれる', () => {
    const reviewEntries = getReviewAllEntries()
    expect(reviewEntries.length).toBeGreaterThanOrEqual(3)
    expect(reviewEntries[0].id).toBe(COMBAT_CORE_SFX_EVENT_IDS[0])
    expect(reviewEntries[1].id).toBe(COMBAT_CORE_SFX_EVENT_IDS[1])
    expect(reviewEntries[2].id).toBe(COMBAT_CORE_SFX_EVENT_IDS[2])
  })
})

function assertUniqueVariantIds(entry: SfxCatalogEntry): void {
  const seen: Record<string, boolean> = {}
  for (let index = 0; index < entry.variants.length; index++) {
    const variantId = entry.variants[index].id
    expect(seen[variantId]).toBeUndefined()
    seen[variantId] = true
  }
}
