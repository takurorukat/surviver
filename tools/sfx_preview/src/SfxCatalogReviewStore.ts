// ============================================================
// SfxCatalogReviewStore.ts
// ------------------------------------------------------------
// SFX Catalog の Review All モードで使う localStorage 永続化。
// ここでの「採用(adopt)」はあくまでレビュー記録であり、
// ゲーム本編の runtime 再生には一切影響しない。
// ============================================================

import type { SfxCatalogEntry, SfxCatalogVariant } from './sfxCatalog'
import { findCatalogVariant } from './sfxCatalog'
import {
  resolveSurvivorSfxEventKey,
  type SurvivorSfxEventId,
} from '../../../src/games/survivor/audio/sfxEvents'

const REVIEW_STORE_KEY = 'mage-survivor-sfx-catalog-review-v1'
const REVIEW_STORE_VERSION = 1

/** Combat Core 移行前の Entry / Variant ID → 新 ID（Adopt・Memo を失わない） */
const LEGACY_ENTRY_ID_MIGRATION: Record<string, string> = {
  'player.fire.power': 'skill.power.cast',
  'enemy.hit.power': 'skill.power.impact',
}

const LEGACY_VARIANT_ID_MIGRATION: Record<string, string> = {
  'player.fire.power-runtime': 'skill.power.cast-runtime',
  'player.fire.power-rev': 'skill.power.cast-rev',
  'player.fire.power-cand-b': 'skill.power.cast-cand-b',
  'player.fire.power-cand-c': 'skill.power.cast-cand-c',
  'enemy.hit.power-runtime': 'skill.power.impact-runtime',
  'enemy.hit.power-cand-a': 'skill.power.impact-cand-a',
  'enemy.hit.power-cand-b': 'skill.power.impact-cand-b',
  'enemy.hit.power-cand-c': 'skill.power.impact-cand-c',
}

function migrateVariantId(variantId: string | null): string | null {
  if (variantId === null) {
    return null
  }
  const migrated = LEGACY_VARIANT_ID_MIGRATION[variantId]
  if (migrated !== undefined) {
    return migrated
  }
  return variantId
}

function migrateVariantIdMap(
  source: Record<string, string | number> | undefined,
): Record<string, string | number> | undefined {
  if (source === undefined) {
    return undefined
  }
  const next: Record<string, string | number> = {}
  const keys = Object.keys(source)
  for (let index = 0; index < keys.length; index++) {
    const oldKey = keys[index]
    const newKey = migrateVariantId(oldKey) ?? oldKey
    next[newKey] = source[oldKey]
  }
  return next
}

function migrateEntryReviewState(
  entryState: SfxCatalogEntryReviewState,
): SfxCatalogEntryReviewState {
  return {
    adoptedVariantId: migrateVariantId(entryState.adoptedVariantId),
    ratingByVariantId: migrateVariantIdMap(entryState.ratingByVariantId) as
      | Record<string, number>
      | undefined,
    memoByVariantId: migrateVariantIdMap(entryState.memoByVariantId) as
      | Record<string, string>
      | undefined,
    statusByVariantId: migrateVariantIdMap(entryState.statusByVariantId) as
      | Record<string, string>
      | undefined,
  }
}

/** 旧 Entry ID を新 ID へ移し、既存の新 ID があれば旧側を捨てないようマージする */
function migrateReviewEntries(
  entries: Record<string, SfxCatalogEntryReviewState>,
): Record<string, SfxCatalogEntryReviewState> {
  const next: Record<string, SfxCatalogEntryReviewState> = {}
  const entryIds = Object.keys(entries)
  for (let index = 0; index < entryIds.length; index++) {
    const oldEntryId = entryIds[index]
    const newEntryId = LEGACY_ENTRY_ID_MIGRATION[oldEntryId] ?? oldEntryId
    const migratedState = migrateEntryReviewState(entries[oldEntryId])
    const existing = next[newEntryId]
    if (existing === undefined) {
      next[newEntryId] = migratedState
      continue
    }
    // 新 ID 側が未採用で旧側に採用があるときだけ移す
    if (existing.adoptedVariantId === null && migratedState.adoptedVariantId !== null) {
      existing.adoptedVariantId = migratedState.adoptedVariantId
    }
  }
  return next
}

export type SfxCatalogEntryReviewState = {
  adoptedVariantId: string | null
  ratingByVariantId?: Record<string, number>
  memoByVariantId?: Record<string, string>
  statusByVariantId?: Record<string, string>
}

export type SfxCatalogReviewState = {
  version: 1
  updatedAt: string
  entries: Record<string, SfxCatalogEntryReviewState>
}

function createEmptyState(): SfxCatalogReviewState {
  return {
    version: REVIEW_STORE_VERSION,
    updatedAt: new Date().toISOString(),
    entries: {},
  }
}

function getLocalStorageSafely(): Storage | null {
  try {
    if (typeof window === 'undefined' || window.localStorage === undefined) {
      return null
    }
    return window.localStorage
  } catch (_error) {
    // Python: except Exception: return None に相当（プライベートモード等での例外を吸収）
    return null
  }
}

/** 壊れた/存在しない JSON でも例外を投げず、必ず有効な state を返す */
export function loadReviewState(): SfxCatalogReviewState {
  const storage = getLocalStorageSafely()
  if (storage === null) {
    return createEmptyState()
  }
  try {
    const raw = storage.getItem(REVIEW_STORE_KEY)
    if (raw === null || raw === '') {
      return createEmptyState()
    }
    const parsed = JSON.parse(raw) as Partial<SfxCatalogReviewState>
    if (parsed === null || typeof parsed !== 'object' || parsed.entries === undefined) {
      return createEmptyState()
    }
    return {
      version: REVIEW_STORE_VERSION,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
      entries: migrateReviewEntries(
        parsed.entries as Record<string, SfxCatalogEntryReviewState>,
      ),
    }
  } catch (_error) {
    return createEmptyState()
  }
}

export function saveReviewState(state: SfxCatalogReviewState): void {
  const storage = getLocalStorageSafely()
  if (storage === null) {
    return
  }
  try {
    const toSave: SfxCatalogReviewState = {
      version: REVIEW_STORE_VERSION,
      updatedAt: new Date().toISOString(),
      entries: state.entries,
    }
    storage.setItem(REVIEW_STORE_KEY, JSON.stringify(toSave))
  } catch (_error) {
    // 保存に失敗しても UI 側は動作を継続する（例: 容量超過・プライベートモード）
  }
}

function getOrCreateEntryState(
  state: SfxCatalogReviewState,
  entryId: string,
): SfxCatalogEntryReviewState {
  const existing = state.entries[entryId]
  if (existing !== undefined) {
    return existing
  }
  const created: SfxCatalogEntryReviewState = { adoptedVariantId: null }
  state.entries[entryId] = created
  return created
}

export function getAdoptedVariantId(entryId: string): string | null {
  const state = loadReviewState()
  const entryState = state.entries[entryId]
  if (entryState === undefined) {
    return null
  }
  return entryState.adoptedVariantId
}

/** variantId に null を渡すと「未選択」に戻す（同じ候補をもう一度選んだ時など） */
export function setAdoptedVariantId(entryId: string, variantId: string | null): void {
  const state = loadReviewState()
  const existing = getOrCreateEntryState(state, entryId)
  state.entries[entryId] = {
    ...existing,
    adoptedVariantId: variantId,
  }
  saveReviewState(state)
}

export function getVariantRating(entryId: string, variantId: string): number {
  const state = loadReviewState()
  const entryState = state.entries[entryId]
  if (entryState === undefined || entryState.ratingByVariantId === undefined) {
    return 0
  }
  const value = entryState.ratingByVariantId[variantId]
  if (typeof value !== 'number') {
    return 0
  }
  return value
}

export function setVariantRating(entryId: string, variantId: string, rating: number): void {
  const state = loadReviewState()
  const existing = getOrCreateEntryState(state, entryId)
  const ratingByVariantId = { ...(existing.ratingByVariantId ?? {}) }
  ratingByVariantId[variantId] = rating
  state.entries[entryId] = {
    ...existing,
    ratingByVariantId,
  }
  saveReviewState(state)
}

export function getVariantMemo(entryId: string, variantId: string): string {
  const state = loadReviewState()
  const entryState = state.entries[entryId]
  if (entryState === undefined || entryState.memoByVariantId === undefined) {
    return ''
  }
  return entryState.memoByVariantId[variantId] ?? ''
}

export function setVariantMemo(entryId: string, variantId: string, memo: string): void {
  const state = loadReviewState()
  const existing = getOrCreateEntryState(state, entryId)
  const memoByVariantId = { ...(existing.memoByVariantId ?? {}) }
  memoByVariantId[variantId] = memo
  state.entries[entryId] = {
    ...existing,
    memoByVariantId,
  }
  saveReviewState(state)
}

export function getVariantReviewStatus(entryId: string, variantId: string): string {
  const state = loadReviewState()
  const entryState = state.entries[entryId]
  if (entryState === undefined || entryState.statusByVariantId === undefined) {
    return 'unreviewed'
  }
  return entryState.statusByVariantId[variantId] ?? 'unreviewed'
}

export function setVariantReviewStatus(
  entryId: string,
  variantId: string,
  status: string,
): void {
  const state = loadReviewState()
  const existing = getOrCreateEntryState(state, entryId)
  const statusByVariantId = { ...(existing.statusByVariantId ?? {}) }
  statusByVariantId[variantId] = status
  state.entries[entryId] = {
    ...existing,
    statusByVariantId,
  }
  saveReviewState(state)
}

/** 採用状態だけを全消去する（レーティングやメモなど他の記録には触れない） */
export function clearAllAdoptions(): void {
  const state = loadReviewState()
  const nextEntries: Record<string, SfxCatalogEntryReviewState> = {}
  const entryIds = Object.keys(state.entries)
  for (let index = 0; index < entryIds.length; index++) {
    const entryId = entryIds[index]
    const existing = state.entries[entryId]
    nextEntries[entryId] = {
      ...existing,
      adoptedVariantId: null,
    }
  }
  saveReviewState({
    version: REVIEW_STORE_VERSION,
    updatedAt: new Date().toISOString(),
    entries: nextEntries,
  })
}

function findRecommendationRank(
  entry: SfxCatalogEntry,
  variantId: string | null,
): number | null {
  if (variantId === null) {
    return null
  }
  const recommendations = entry.recommendations ?? []
  for (let index = 0; index < recommendations.length; index++) {
    if (recommendations[index].variantId === variantId) {
      return recommendations[index].rank
    }
  }
  return null
}

function resolveAdoptedVariant(
  entry: SfxCatalogEntry,
  variantId: string | null,
): SfxCatalogVariant | null {
  if (variantId === null) {
    return null
  }
  return findCatalogVariant(entry, variantId)
}

/** Export JSON 用のデータをそのまま JSON 文字列として組み立てる */
export function buildAdoptionExportJson(entries: SfxCatalogEntry[]): string {
  const state = loadReviewState()
  const exportEntries: Record<
    string,
    {
      eventId: SurvivorSfxEventId | null
      runtimeKey: string | null
      runtimePath: string | null
      adoptedVariantId: string | null
      variantLabel: string | null
      sourcePath: string | null
      sourceName: string | null
      licenseName: string | null
      checksumSha256: string | null
      recommendationRank: number | null
    }
  > = {}
  let decidedEntryCount = 0
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index]
    const entryState = state.entries[entry.id]
    const adoptedVariantId = entryState?.adoptedVariantId ?? null
    const adoptedVariant = resolveAdoptedVariant(entry, adoptedVariantId)
    if (adoptedVariantId !== null) {
      decidedEntryCount = decidedEntryCount + 1
    }
    const eventId = entry.eventId ?? null
    let resolvedRuntimeKey: string | null = entry.runtimeKey ?? null
    if (eventId !== null) {
      resolvedRuntimeKey = resolveSurvivorSfxEventKey(eventId)
    }
    exportEntries[entry.id] = {
      eventId,
      runtimeKey: resolvedRuntimeKey,
      runtimePath: entry.runtimePath ?? null,
      adoptedVariantId,
      variantLabel: adoptedVariant !== null ? adoptedVariant.label : null,
      sourcePath: adoptedVariant !== null ? adoptedVariant.path : null,
      sourceName:
        adoptedVariant !== null && adoptedVariant.sourceName !== undefined
          ? adoptedVariant.sourceName
          : null,
      licenseName:
        adoptedVariant !== null && adoptedVariant.licenseName !== undefined
          ? adoptedVariant.licenseName
          : null,
      checksumSha256:
        adoptedVariant !== null && adoptedVariant.checksumSha256 !== undefined
          ? adoptedVariant.checksumSha256
          : null,
      recommendationRank: findRecommendationRank(entry, adoptedVariantId),
    }
  }
  const payload = {
    version: REVIEW_STORE_VERSION,
    exportedAt: new Date().toISOString(),
    purpose: 'sfx-catalog-adoption-for-runtime-apply',
    note:
      'Review Adopt only. Does not modify Runtime files. Hand to Cursor with docs/audio/combat-core-runtime-adoption.md.',
    catalogEntryCount: entries.length,
    decidedEntryCount,
    entries: exportEntries,
  }
  return JSON.stringify(payload, null, 2)
}

/** Copy Summary 用の読みやすいテキストを組み立てる */
export function buildAdoptionSummaryText(entries: SfxCatalogEntry[]): string {
  const state = loadReviewState()
  const lines: string[] = []
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index]
    const entryState = state.entries[entry.id]
    const adoptedVariantId = entryState?.adoptedVariantId ?? null
    if (adoptedVariantId === null) {
      lines.push(`${entry.id} → undecided`)
    } else {
      lines.push(`${entry.id} → ${adoptedVariantId}`)
    }
  }
  return lines.join('\n')
}

export function getReviewStoreKey(): string {
  return REVIEW_STORE_KEY
}
