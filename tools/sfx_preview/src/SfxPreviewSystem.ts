// ============================================================
// SfxPreviewSystem.ts
// ------------------------------------------------------------
// 独立ツール tools/sfx_preview 用の SFX Catalog（Review All）。
// Manifest: ./sfxCatalog.ts
// ============================================================

import Phaser from 'phaser'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
} from '../../../src/games/survivor/GameConstants'
import { SFX_VOLUME } from '../../../src/games/survivor/constants/audio'
import { SFX_PREVIEW_DEPTH } from './previewUi'
import {
  SFX_CATALOG,
  findCatalogEntry,
  findCatalogVariant,
  getReviewAllEntries,
  pickDefaultVariantId,
  sortVariantsForReview,
  type SfxCatalogCategory,
  type SfxCatalogEntry,
  type SfxCatalogEntryStatus,
  type SfxCatalogRecommendation,
  type SfxCatalogVariant,
} from './sfxCatalog'
import {
  buildAdoptionExportJson,
  buildAdoptionSummaryText,
  clearAllAdoptions,
  getAdoptedVariantId,
  getVariantMemo,
  getVariantRating,
  getVariantReviewStatus,
  setAdoptedVariantId,
  setVariantMemo,
  setVariantRating,
  setVariantReviewStatus,
} from './SfxCatalogReviewStore'

export type SfxPreviewAudioUnlock = {
  unlock: () => void
}

export type SfxPreviewCallbacks = {
  audioSystem: SfxPreviewAudioUnlock
  onUiObjectsReady?: (objects: Phaser.GameObjects.GameObject[]) => void
  onClose?: () => void
  onCancelled?: () => void
}

type EntryUiState = {
  selectedVariantId: string | null
  aVariantId: string | null
  bVariantId: string | null
  burstModeIndex: number
  ratings: Record<string, number>
  reviewStatus: SfxCatalogEntryStatus
  memo: string
}

type ReviewRowRefs = {
  rowEl: HTMLDivElement
  checkbox: HTMLInputElement
  badgesEl: HTMLSpanElement
  statusEl: HTMLSpanElement
}

type ReviewSectionRefs = {
  rowsByVariantId: Record<string, ReviewRowRefs>
  abLabelEl: HTMLSpanElement | null
}

type PreviewPlaybackStatus =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'load-failed'
  | 'decode-failed'
  | 'file-not-found'
  | 'audio-blocked'

const CATEGORY_FILTERS: Array<SfxCatalogCategory | 'all'> = [
  'all',
  'combat-core',
  'player',
  'enemy',
  'skill',
  'pickup',
  'progression',
  'ui',
  'system',
]

const STATUS_FILTERS: Array<SfxCatalogEntryStatus | 'all'> = [
  'all',
  'unreviewed',
  'reviewing',
  'preferred',
  'missing-candidates',
]

export class SfxPreviewSystem {
  private scene: Phaser.Scene
  private callbacks: SfxPreviewCallbacks
  private isOpenFlag = false
  private previewVolume = SFX_VOLUME
  private ownedObjects: Phaser.GameObjects.GameObject[] = []
  private entryUiById: Record<string, EntryUiState> = {}
  private failedKeys: Record<string, boolean> = {}
  private burstTimers: Phaser.Time.TimerEvent[] = []

  private categoryFilter: SfxCatalogCategory | 'all' = 'all'
  private statusFilter: SfxCatalogEntryStatus | 'all' = 'all'
  private searchQuery = ''

  private reviewOverlayEl: HTMLDivElement | null = null
  private reviewSequenceTimers: Phaser.Time.TimerEvent[] = []
  private reviewCurrentPlayingEl: HTMLSpanElement | null = null
  private reviewCountsEl: HTMLSpanElement | null = null
  private reviewUndecidedListEl: HTMLUListElement | null = null
  private reviewSectionRefsByEntryId: Record<string, ReviewSectionRefs> = {}
  private reviewAbByEntryId: Record<string, { aVariantId: string | null; bVariantId: string | null }> =
    {}
  private previewHtmlAudio: HTMLAudioElement | null = null
  private previewPlayToken = 0
  private savedSceneInputEnabled = true
  private overlayIsolationBound = false
  private playbackStatusByVariantId: Record<string, PreviewPlaybackStatus> = {}

  /**
   * Overlay 内のクリックが Phaser の window 入力へ届かないようにする。
   * 重要: capture ではなく bubble で止める。
   * capture だと子の Play ボタンより先に実行され、click が届かなくなる。
   */
  private readonly onOverlayBlockGameInput = (event: Event): void => {
    // 子要素（Play / checkbox / input 等）のハンドラ実行後にここに来る。
    // 上位（document / window / Phaser）へは渡さない。
    event.stopPropagation()
  }

  constructor(scene: Phaser.Scene, callbacks: SfxPreviewCallbacks) {
    this.scene = scene
    this.callbacks = callbacks
    this.initEntryUiStates()
  }

  isOpen(): boolean {
    return this.isOpenFlag
  }

  open(): void {
    if (this.isOpenFlag) {
      return
    }
    this.isOpenFlag = true
    this.savedSceneInputEnabled = this.scene.input.enabled
    // DOM Catalog 操作が Phaser の window mousedown 経由で背面 UI に届くのを防ぐ
    this.scene.input.enabled = false
    this.renderReviewAll()
  }

  close(playCancelSound: boolean = true): void {
    if (!this.isOpenFlag) {
      return
    }
    if (playCancelSound) {
      this.callbacks.onCancelled?.()
    }
    this.teardownUi()
    this.isOpenFlag = false
    this.callbacks.onClose?.()
  }

  destroy(): void {
    this.teardownUi()
    this.isOpenFlag = false
  }

  private teardownUi(): void {
    this.clearBurstTimers()
    this.clearReviewSequenceTimers()
    this.stopPreviewSound()
    this.unbindOverlayInputIsolation()
    this.unmountReviewOverlay()
    this.reviewAbByEntryId = {}
    this.destroyPanel()
    this.scene.input.enabled = this.savedSceneInputEnabled
  }

  private renderReviewAll(): void {
    this.clearBurstTimers()
    this.buildReviewShellPanel()
    this.mountReviewOverlay()
  }

  private variantLabel(entry: SfxCatalogEntry, variantId: string | null): string {
    if (variantId === null) {
      return '(none)'
    }
    const variant = findCatalogVariant(entry, variantId)
    if (variant === null) {
      return '(missing)'
    }
    return variant.label
  }

  private initEntryUiStates(): void {
    for (let index = 0; index < SFX_CATALOG.length; index++) {
      const entry = SFX_CATALOG[index]
      const defaultId = pickDefaultVariantId(entry)
      const revision = this.findFirstVariantByStatus(entry, 'revision')
      const candidate = this.findFirstVariantByStatus(entry, 'candidate')
      const runtime = this.findFirstVariantByStatus(entry, 'runtime')
      let bId = revision?.id ?? candidate?.id ?? runtime?.id ?? defaultId
      if (entry.variants.length <= 1) {
        bId = null
      }
      this.entryUiById[entry.id] = {
        selectedVariantId: defaultId,
        aVariantId: runtime?.id ?? defaultId,
        bVariantId: bId,
        burstModeIndex: 0,
        ratings: {},
        reviewStatus: entry.initialStatus,
        memo: '',
      }
    }
  }

  private findFirstVariantByStatus(
    entry: SfxCatalogEntry,
    status: SfxCatalogVariant['status'],
  ): SfxCatalogVariant | null {
    for (let index = 0; index < entry.variants.length; index++) {
      if (entry.variants[index].status === status) {
        return entry.variants[index]
      }
    }
    return null
  }

  private getEntryUi(entryId: string): EntryUiState {
    return this.entryUiById[entryId]
  }

  private entryMatchesQuery(entry: SfxCatalogEntry, query: string): boolean {
    const parts: string[] = [
      entry.id,
      entry.label,
      entry.category,
      entry.description ?? '',
      entry.runtimeKey ?? '',
      entry.runtimePath ?? '',
    ]
    for (let index = 0; index < entry.variants.length; index++) {
      const variant = entry.variants[index]
      parts.push(variant.id)
      parts.push(variant.label)
      parts.push(variant.path)
      parts.push(variant.sourceName ?? '')
      parts.push(variant.source ?? '')
      parts.push(variant.author ?? '')
    }
    const recommendations = entry.recommendations ?? []
    for (let index = 0; index < recommendations.length; index++) {
      const recommendation = recommendations[index]
      parts.push(recommendation.reason ?? '')
      if (recommendation.direction !== undefined) {
        for (let dirIndex = 0; dirIndex < recommendation.direction.length; dirIndex++) {
          parts.push(recommendation.direction[dirIndex])
        }
      }
    }
    for (let index = 0; index < parts.length; index++) {
      if (parts[index].toLowerCase().indexOf(query) >= 0) {
        return true
      }
    }
    return false
  }

  private variantMatchesQuery(entry: SfxCatalogEntry, variant: SfxCatalogVariant, query: string): boolean {
    if (query === '') {
      return true
    }
    const parts: string[] = [
      entry.id,
      entry.label,
      entry.description ?? '',
      variant.id,
      variant.label,
      variant.path,
      variant.sourceName ?? '',
      variant.source ?? '',
      variant.author ?? '',
    ]
    const recommendation = (entry.recommendations ?? []).find((item) => item.variantId === variant.id)
    if (recommendation !== undefined) {
      parts.push(recommendation.reason ?? '')
      if (recommendation.direction !== undefined) {
        for (let index = 0; index < recommendation.direction.length; index++) {
          parts.push(recommendation.direction[index])
        }
      }
    }
    for (let index = 0; index < parts.length; index++) {
      if (parts[index].toLowerCase().indexOf(query) >= 0) {
        return true
      }
    }
    return false
  }

  private getFilteredReviewAllEntries(): SfxCatalogEntry[] {
    const allEntries = getReviewAllEntries()
    const query = this.searchQuery.trim().toLowerCase()
    const result: SfxCatalogEntry[] = []
    for (let index = 0; index < allEntries.length; index++) {
      const entry = allEntries[index]
      if (this.categoryFilter !== 'all' && entry.category !== this.categoryFilter) {
        continue
      }
      const ui = this.getEntryUi(entry.id)
      if (this.statusFilter !== 'all' && ui.reviewStatus !== this.statusFilter) {
        continue
      }
      if (query !== '' && !this.entryMatchesQuery(entry, query)) {
        continue
      }
      result.push(entry)
    }
    return result
  }

  private buildReviewShellPanel(): void {
    this.destroyPanel()
    const centerX = GAME_WIDTH / 2
    const centerY = GAME_HEIGHT / 2
    const dim = this.scene.add.rectangle(centerX, centerY, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.65)
    dim.setDepth(SFX_PREVIEW_DEPTH)
    dim.setScrollFactor(0)
    this.ownedObjects.push(dim)
    if (this.callbacks.onUiObjectsReady !== undefined) {
      this.callbacks.onUiObjectsReady(this.ownedObjects.slice())
    }
  }

  private mountReviewOverlay(): void {
    const previousScrollTop = this.reviewOverlayEl !== null ? this.reviewOverlayEl.scrollTop : 0
    const previousAbByEntryId = { ...this.reviewAbByEntryId }
    const activeElement = document.activeElement as HTMLElement | null
    const restoreSearchFocus =
      activeElement !== null &&
      activeElement.tagName === 'INPUT' &&
      (activeElement as HTMLInputElement).type === 'search'
    const searchSelectionStart =
      restoreSearchFocus && activeElement instanceof HTMLInputElement
        ? activeElement.selectionStart
        : null
    const searchSelectionEnd =
      restoreSearchFocus && activeElement instanceof HTMLInputElement
        ? activeElement.selectionEnd
        : null
    this.unmountReviewOverlay()
    const entries = this.getFilteredReviewAllEntries()
    this.reviewSectionRefsByEntryId = {}
    this.reviewAbByEntryId = previousAbByEntryId

    const container = document.createElement('div')
    container.setAttribute('data-sfx-review-all-overlay', '1')
    container.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:2147483000',
      'background:#0b1120',
      'color:#e5e7eb',
      'overflow-y:auto',
      'overflow-x:hidden',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'padding:16px',
      'box-sizing:border-box',
    ].join(';')

    container.appendChild(this.buildReviewHeader(entries))

    const list = document.createElement('div')
    for (let index = 0; index < entries.length; index++) {
      list.appendChild(this.buildReviewEntrySection(entries[index]))
    }
    container.appendChild(list)

    document.body.appendChild(container)
    this.reviewOverlayEl = container
    this.bindOverlayInputIsolation(container)
    this.updateReviewCounts()
    container.scrollTop = previousScrollTop
    if (restoreSearchFocus) {
      const nextSearch = container.querySelector('input[type="search"]') as HTMLInputElement | null
      if (nextSearch !== null) {
        nextSearch.focus()
        if (searchSelectionStart !== null && searchSelectionEnd !== null) {
          nextSearch.setSelectionRange(searchSelectionStart, searchSelectionEnd)
        }
      }
    }
  }

  private bindOverlayInputIsolation(container: HTMLElement): void {
    this.unbindOverlayInputIsolation()
    const eventNames = [
      'pointerdown',
      'pointerup',
      'mousedown',
      'mouseup',
      'touchstart',
      'touchend',
      'click',
    ]
    for (let index = 0; index < eventNames.length; index++) {
      // bubble（第3引数 false）: 子ボタンの click を先に実行させてから背後へ漏れないよう止める
      container.addEventListener(eventNames[index], this.onOverlayBlockGameInput, false)
    }
    this.overlayIsolationBound = true
  }

  private unbindOverlayInputIsolation(): void {
    if (!this.overlayIsolationBound || this.reviewOverlayEl === null) {
      this.overlayIsolationBound = false
      return
    }
    const eventNames = [
      'pointerdown',
      'pointerup',
      'mousedown',
      'mouseup',
      'touchstart',
      'touchend',
      'click',
    ]
    for (let index = 0; index < eventNames.length; index++) {
      this.reviewOverlayEl.removeEventListener(
        eventNames[index],
        this.onOverlayBlockGameInput,
        false,
      )
    }
    this.overlayIsolationBound = false
  }

  private unmountReviewOverlay(): void {
    this.clearReviewSequenceTimers()
    this.unbindOverlayInputIsolation()
    if (this.reviewOverlayEl !== null) {
      this.reviewOverlayEl.remove()
      this.reviewOverlayEl = null
    }
    const leftovers = document.querySelectorAll('[data-sfx-review-all-overlay="1"]')
    for (let index = 0; index < leftovers.length; index++) {
      leftovers[index].remove()
    }
    this.reviewCurrentPlayingEl = null
    this.reviewCountsEl = null
    this.reviewUndecidedListEl = null
    this.reviewSectionRefsByEntryId = {}
    // A/B は mount 側で previous を引き継ぐため、ここでは消さない
  }

  private buildReviewHeader(entries: SfxCatalogEntry[]): HTMLDivElement {
    const header = document.createElement('div')
    header.style.cssText =
      'position:sticky;top:0;background:#0b1120;padding-bottom:12px;border-bottom:1px solid #334155;margin-bottom:16px;z-index:1;'

    const titleRow = document.createElement('div')
    titleRow.style.cssText =
      'display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;'
    const title = document.createElement('h2')
    title.textContent = 'SFX Catalog - Review All'
    title.style.cssText = 'margin:0;font-size:18px;color:#fde68a;'
    titleRow.appendChild(title)
    titleRow.appendChild(
      this.createReviewButton(
        'Close',
        () => {
          this.close(true)
        },
        'primary',
      ),
    )
    header.appendChild(titleRow)

    const filterRow = document.createElement('div')
    filterRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center;'
    const searchInput = document.createElement('input')
    searchInput.type = 'search'
    searchInput.placeholder = 'Search entry / variant / source / direction'
    searchInput.value = this.searchQuery
    searchInput.style.cssText =
      'flex:1;min-width:180px;background:#0f172a;color:#e5e7eb;border:1px solid #334155;border-radius:4px;padding:6px 8px;font-size:12px;'
    searchInput.addEventListener('input', () => {
      this.searchQuery = searchInput.value
      this.mountReviewOverlay()
    })
    filterRow.appendChild(searchInput)

    const categorySelect = document.createElement('select')
    categorySelect.style.cssText =
      'background:#0f172a;color:#e5e7eb;border:1px solid #334155;border-radius:4px;padding:6px;font-size:12px;'
    const categoryOptions = CATEGORY_FILTERS
    for (let index = 0; index < categoryOptions.length; index++) {
      const option = document.createElement('option')
      option.value = categoryOptions[index]
      option.textContent = `Category: ${categoryOptions[index]}`
      option.selected = this.categoryFilter === categoryOptions[index]
      categorySelect.appendChild(option)
    }
    categorySelect.addEventListener('change', () => {
      this.categoryFilter = categorySelect.value as SfxCatalogCategory | 'all'
      this.mountReviewOverlay()
    })
    filterRow.appendChild(categorySelect)

    const statusSelect = document.createElement('select')
    statusSelect.style.cssText =
      'background:#0f172a;color:#e5e7eb;border:1px solid #334155;border-radius:4px;padding:6px;font-size:12px;'
    const statusOptions = STATUS_FILTERS
    for (let index = 0; index < statusOptions.length; index++) {
      const option = document.createElement('option')
      option.value = statusOptions[index]
      option.textContent = `Status: ${statusOptions[index]}`
      option.selected = this.statusFilter === statusOptions[index]
      statusSelect.appendChild(option)
    }
    statusSelect.addEventListener('change', () => {
      this.statusFilter = statusSelect.value as SfxCatalogEntryStatus | 'all'
      this.mountReviewOverlay()
    })
    filterRow.appendChild(statusSelect)
    header.appendChild(filterRow)

    const countsEl = document.createElement('div')
    countsEl.style.cssText = 'margin-top:8px;font-size:13px;color:#94a3b8;'
    header.appendChild(countsEl)
    this.reviewCountsEl = countsEl

    const playingRow = document.createElement('div')
    playingRow.style.cssText = 'margin-top:4px;font-size:12px;color:#a1a1aa;'
    const playingLabel = document.createElement('span')
    playingLabel.textContent = '現在再生中: '
    const playingValue = document.createElement('span')
    playingValue.textContent = '(なし)'
    playingRow.appendChild(playingLabel)
    playingRow.appendChild(playingValue)
    const volumeHint = document.createElement('span')
    volumeHint.style.cssText = 'margin-left:12px;color:#94a3b8;'
    volumeHint.textContent = `Preview volume ${Math.round(this.previewVolume * 100)}%`
    playingRow.appendChild(volumeHint)
    header.appendChild(playingRow)
    this.reviewCurrentPlayingEl = playingValue

    const actionsRow = document.createElement('div')
    actionsRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;'
    actionsRow.appendChild(
      this.createReviewButton('Stop Preview', () => {
        this.stopReviewPlayback()
      }),
    )
    actionsRow.appendChild(
      this.createReviewButton('Export Adoption JSON', () => {
        this.exportReviewJson(getReviewAllEntries())
      }),
    )
    actionsRow.appendChild(
      this.createReviewButton('Copy Adoption Summary', () => {
        this.copyReviewSummary(getReviewAllEntries())
      }),
    )
    actionsRow.appendChild(
      this.createReviewButton(
        'Clear All Adoption Selections',
        () => {
          this.clearAllAdoptionsWithConfirm(getReviewAllEntries())
        },
        'danger',
      ),
    )
    header.appendChild(actionsRow)

    const notice = document.createElement('p')
    notice.style.cssText = 'margin:10px 0 0;font-size:11px;color:#facc15;line-height:1.5;'
    notice.textContent =
      '採用候補の選択はレビュー用に保存されます。この操作だけではゲーム内のRuntime音源は変更されません。'
    header.appendChild(notice)

    const undecidedTitle = document.createElement('div')
    undecidedTitle.style.cssText = 'margin-top:10px;font-size:12px;color:#94a3b8;'
    undecidedTitle.textContent = '未決定Entry一覧:'
    header.appendChild(undecidedTitle)

    const undecidedList = document.createElement('ul')
    undecidedList.style.cssText = 'margin:4px 0 0;padding-left:18px;font-size:11px;color:#f87171;'
    header.appendChild(undecidedList)
    this.reviewUndecidedListEl = undecidedList

    const anchorTitle = document.createElement('div')
    anchorTitle.style.cssText = 'margin-top:10px;font-size:12px;color:#94a3b8;'
    anchorTitle.textContent = 'Entryアンカー:'
    header.appendChild(anchorTitle)

    const anchorNav = document.createElement('div')
    anchorNav.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;'
    for (let index = 0; index < entries.length; index++) {
      const entry = entries[index]
      const link = document.createElement('a')
      link.href = `#sfx-review-${entry.id}`
      link.textContent = entry.label
      link.style.cssText =
        'font-size:11px;color:#93c5fd;text-decoration:none;border:1px solid #1e3a8a;border-radius:4px;padding:2px 6px;'
      anchorNav.appendChild(link)
    }
    header.appendChild(anchorNav)

    return header
  }

  private buildReviewEntrySection(entry: SfxCatalogEntry): HTMLDivElement {
    const section = document.createElement('div')
    section.id = `sfx-review-${entry.id}`
    section.style.cssText =
      'border:1px solid #334155;border-radius:8px;padding:12px;margin-bottom:16px;background:#111827;'

    const headingTitle = document.createElement('div')
    const categoryText = this.escapeHtml(entry.category)
    const idText = this.escapeHtml(entry.id)
    headingTitle.innerHTML = `<strong style="font-size:15px;color:#fde68a;">${this.escapeHtml(entry.label)}</strong> <span style="color:#94a3b8;font-size:11px;">(${idText} / ${categoryText})</span>`
    section.appendChild(headingTitle)

    if (entry.eventId !== undefined || entry.runtimeKey !== undefined) {
      const meta = document.createElement('div')
      meta.style.cssText = 'color:#7dd3fc;font-size:11px;margin-top:4px;'
      const eventPart =
        entry.eventId !== undefined ? `Event: ${entry.eventId}` : 'Event: (none)'
      const keyPart =
        entry.runtimeKey !== undefined ? `Runtime key: ${entry.runtimeKey}` : 'Runtime key: (none)'
      meta.textContent = `${eventPart} · ${keyPart}`
      section.appendChild(meta)
    }

    if (entry.description !== undefined) {
      const desc = document.createElement('div')
      desc.style.cssText = 'color:#a1a1aa;font-size:12px;margin-top:4px;'
      desc.textContent = entry.description
      section.appendChild(desc)
    }

    const adoptedVariantId = getAdoptedVariantId(entry.id)
    const adoptedVariant =
      adoptedVariantId !== null ? findCatalogVariant(entry, adoptedVariantId) : null
    let externalCount = 0
    for (let index = 0; index < entry.variants.length; index++) {
      if (entry.variants[index].origin === 'external-free') {
        externalCount = externalCount + 1
      }
    }
    const hasRuntime = this.findFirstVariantByStatus(entry, 'runtime') !== null
    const sharedWithText =
      entry.sharedWith !== undefined && entry.sharedWith.length > 0
        ? entry.sharedWith.join(', ')
        : '(none)'
    const decidedLabel = adoptedVariantId !== null ? 'Decided' : 'Undecided'
    const adoptLabel = adoptedVariant !== null ? adoptedVariant.label : '(none)'

    const metaLine = document.createElement('div')
    metaLine.style.cssText = 'color:#94a3b8;font-size:11px;margin-top:4px;line-height:1.6;'
    metaLine.textContent = [
      `External candidates: ${externalCount}`,
      `Total variants: ${entry.variants.length}`,
      `Runtime variant: ${hasRuntime ? 'yes' : 'no'}`,
      `Shared: ${sharedWithText}`,
      `Adopt Selected: ${adoptLabel}`,
      decidedLabel,
    ].join('  ·  ')
    section.appendChild(metaLine)

    const recommendations: SfxCatalogRecommendation[] = (entry.recommendations ?? [])
      .slice()
      .sort((a, b) => a.rank - b.rank)
    if (recommendations.length > 0) {
      const topLine = document.createElement('div')
      topLine.style.cssText = 'color:#fde68a;font-size:11px;margin-top:6px;'
      const topParts: string[] = []
      for (let index = 0; index < recommendations.length; index++) {
        const rec = recommendations[index]
        const variant = findCatalogVariant(entry, rec.variantId)
        const label = variant !== null ? variant.label : rec.variantId
        topParts.push(`#${rec.rank} ${label}`)
      }
      topLine.textContent = `Recommended Top 3: ${topParts.join(' / ')}`
      section.appendChild(topLine)

      const recRow = document.createElement('div')
      recRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;'
      for (let index = 0; index < recommendations.length; index++) {
        const rec = recommendations[index]
        const variant = findCatalogVariant(entry, rec.variantId)
        if (variant === null) {
          continue
        }
        recRow.appendChild(
          this.createReviewButton(
            `Play Recommended #${rec.rank}`,
            () => {
              this.playReviewVariant(entry, variant)
            },
            'primary',
          ),
        )
      }
      section.appendChild(recRow)
    }

    if (this.reviewAbByEntryId[entry.id] === undefined) {
      this.reviewAbByEntryId[entry.id] = { aVariantId: null, bVariantId: null }
    }

    const controlsRow = document.createElement('div')
    controlsRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;align-items:center;'
    controlsRow.appendChild(
      this.createReviewButton('Play All Candidates', () => {
        this.playAllCandidatesForEntry(entry)
      }),
    )
    controlsRow.appendChild(
      this.createReviewButton('Stop', () => {
        this.stopReviewPlayback()
      }),
    )
    controlsRow.appendChild(
      this.createReviewButton('Play A', () => {
        const ab = this.reviewAbByEntryId[entry.id]
        const variant = ab.aVariantId !== null ? findCatalogVariant(entry, ab.aVariantId) : null
        if (variant !== null) {
          this.playReviewVariant(entry, variant)
        }
      }),
    )
    controlsRow.appendChild(
      this.createReviewButton('Play B', () => {
        const ab = this.reviewAbByEntryId[entry.id]
        const variant = ab.bVariantId !== null ? findCatalogVariant(entry, ab.bVariantId) : null
        if (variant !== null) {
          this.playReviewVariant(entry, variant)
        }
      }),
    )
    controlsRow.appendChild(
      this.createReviewButton('Alternate A/B', () => {
        this.playAlternateAb(entry)
      }),
    )
    controlsRow.appendChild(
      this.createReviewButton('Clear A/B', () => {
        this.reviewAbByEntryId[entry.id] = { aVariantId: null, bVariantId: null }
        this.updateReviewAbLabel(entry.id)
      }),
    )
    const abLabel = document.createElement('span')
    abLabel.style.cssText = 'color:#a1a1aa;font-size:11px;'
    controlsRow.appendChild(abLabel)
    section.appendChild(controlsRow)

    this.reviewSectionRefsByEntryId[entry.id] = { rowsByVariantId: {}, abLabelEl: abLabel }
    this.updateReviewAbLabel(entry.id)

    const query = this.searchQuery.trim().toLowerCase()
    const sortedVariants = sortVariantsForReview(entry, adoptedVariantId)
    const rowsContainer = document.createElement('div')
    rowsContainer.style.cssText = 'margin-top:10px;display:flex;flex-direction:column;gap:6px;'
    for (let index = 0; index < sortedVariants.length; index++) {
      const variant = sortedVariants[index]
      if (query !== '' && !this.variantMatchesQuery(entry, variant, query)) {
        continue
      }
      rowsContainer.appendChild(this.buildReviewVariantRow(entry, variant, adoptedVariantId))
    }
    section.appendChild(rowsContainer)

    return section
  }

  private buildReviewVariantRow(
    entry: SfxCatalogEntry,
    variant: SfxCatalogVariant,
    adoptedVariantId: string | null,
  ): HTMLDivElement {
    const row = document.createElement('div')
    row.style.cssText =
      'display:flex;align-items:flex-start;gap:8px;padding:6px;border:1px solid #1e293b;border-radius:6px;background:#0b1220;flex-wrap:wrap;'

    const isMissing = this.failedKeys[variant.audioKey] === true

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.checked = adoptedVariantId === variant.id
    checkbox.disabled = isMissing
    checkbox.title = 'Adopt（レビュー記録のみ。Runtimeには影響しません）'
    checkbox.addEventListener('change', () => {
      this.handleAdoptToggle(entry, variant.id, checkbox)
    })
    row.appendChild(checkbox)

    const playButton = this.createReviewButton('Play', () => {
      this.playReviewVariant(entry, variant)
    })
    playButton.disabled = isMissing
    row.appendChild(playButton)

    const statusEl = document.createElement('span')
    statusEl.style.cssText = 'font-size:10px;font-weight:bold;color:#93c5fd;min-width:90px;'
    row.appendChild(statusEl)

    const badgesEl = document.createElement('span')
    badgesEl.style.cssText =
      'font-size:10px;font-weight:bold;color:#fde68a;min-width:110px;line-height:1.4;'
    row.appendChild(badgesEl)

    const infoEl = document.createElement('div')
    infoEl.style.cssText = 'flex:1;min-width:220px;font-size:12px;color:#e5e7eb;line-height:1.45;'

    // 初期は短い表示名だけ。クリックで provenance / 技術情報を展開する
    const summaryButton = document.createElement('button')
    summaryButton.type = 'button'
    summaryButton.textContent = variant.label
    summaryButton.title = 'クリックで詳細を表示 / 隠す'
    summaryButton.style.cssText =
      'display:block;width:100%;text-align:left;background:transparent;border:none;padding:0;margin:0;color:#e5e7eb;font-size:12px;font-weight:600;cursor:pointer;line-height:1.45;'

    const detailsEl = document.createElement('div')
    detailsEl.style.cssText =
      'display:none;margin-top:4px;color:#cbd5e1;font-size:11px;font-weight:normal;white-space:pre-wrap;word-break:break-word;'
    detailsEl.textContent = this.buildReviewVariantInfoText(entry, variant)

    let isDetailsOpen = false
    summaryButton.addEventListener('click', (event) => {
      event.stopPropagation()
      isDetailsOpen = !isDetailsOpen
      if (isDetailsOpen) {
        detailsEl.style.display = 'block'
        summaryButton.style.color = '#fde68a'
      } else {
        detailsEl.style.display = 'none'
        summaryButton.style.color = '#e5e7eb'
      }
    })

    infoEl.appendChild(summaryButton)
    infoEl.appendChild(detailsEl)
    row.appendChild(infoEl)

    if (isMissing) {
      const missingEl = document.createElement('span')
      missingEl.textContent = 'FILE NOT FOUND'
      missingEl.style.cssText = 'color:#f87171;font-size:11px;font-weight:bold;'
      row.appendChild(missingEl)
    }

    const reviewControls = document.createElement('div')
    reviewControls.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;align-items:center;'

    const ratingSelect = document.createElement('select')
    ratingSelect.title = 'Rating'
    ratingSelect.style.cssText =
      'background:#0f172a;color:#e5e7eb;border:1px solid #334155;border-radius:4px;padding:2px;font-size:11px;'
    const currentRating = getVariantRating(entry.id, variant.id)
    for (let rating = 0; rating <= 5; rating++) {
      const option = document.createElement('option')
      option.value = String(rating)
      option.textContent = rating === 0 ? 'Rating -' : `★${rating}`
      option.selected = currentRating === rating
      ratingSelect.appendChild(option)
    }
    ratingSelect.addEventListener('change', () => {
      const nextRating = Number(ratingSelect.value)
      setVariantRating(entry.id, variant.id, nextRating)
      const ui = this.getEntryUi(entry.id)
      ui.ratings[variant.id] = nextRating
    })
    reviewControls.appendChild(ratingSelect)

    const statusSelect = document.createElement('select')
    statusSelect.title = 'Status'
    statusSelect.style.cssText =
      'background:#0f172a;color:#e5e7eb;border:1px solid #334155;border-radius:4px;padding:2px;font-size:11px;'
    const statusValues = ['unreviewed', 'reviewing', 'preferred', 'missing-candidates']
    const currentStatus = getVariantReviewStatus(entry.id, variant.id)
    for (let index = 0; index < statusValues.length; index++) {
      const option = document.createElement('option')
      option.value = statusValues[index]
      option.textContent = statusValues[index]
      option.selected = currentStatus === statusValues[index]
      statusSelect.appendChild(option)
    }
    statusSelect.addEventListener('change', () => {
      setVariantReviewStatus(entry.id, variant.id, statusSelect.value)
      this.updateReviewRowBadges(entry, variant, badgesEl, getAdoptedVariantId(entry.id))
    })
    reviewControls.appendChild(statusSelect)

    const memoInput = document.createElement('input')
    memoInput.type = 'text'
    memoInput.placeholder = 'Memo'
    memoInput.value = getVariantMemo(entry.id, variant.id)
    memoInput.style.cssText =
      'min-width:120px;background:#0f172a;color:#e5e7eb;border:1px solid #334155;border-radius:4px;padding:2px 6px;font-size:11px;'
    memoInput.addEventListener('change', () => {
      setVariantMemo(entry.id, variant.id, memoInput.value)
      const ui = this.getEntryUi(entry.id)
      if (ui.selectedVariantId === variant.id) {
        ui.memo = memoInput.value
      }
    })
    reviewControls.appendChild(memoInput)

    const setAButton = this.createReviewButton('Set A', () => {
      this.reviewAbByEntryId[entry.id].aVariantId = variant.id
      this.updateReviewAbLabel(entry.id)
    })
    setAButton.disabled = isMissing
    reviewControls.appendChild(setAButton)

    const setBButton = this.createReviewButton('Set B', () => {
      this.reviewAbByEntryId[entry.id].bVariantId = variant.id
      this.updateReviewAbLabel(entry.id)
    })
    setBButton.disabled = isMissing
    reviewControls.appendChild(setBButton)

    row.appendChild(reviewControls)

    const sectionRefs = this.reviewSectionRefsByEntryId[entry.id]
    sectionRefs.rowsByVariantId[variant.id] = { rowEl: row, checkbox, badgesEl, statusEl }
    this.updateReviewRowBadges(entry, variant, badgesEl, adoptedVariantId)
    this.renderRowPlaybackStatus(entry.id, variant.id)

    return row
  }

  private buildReviewVariantInfoText(entry: SfxCatalogEntry, variant: SfxCatalogVariant): string {
    const lines: string[] = []
    lines.push(`${variant.label}  [${variant.id}]`)
    lines.push(variant.status.toUpperCase())
    const metaParts: string[] = []
    if (variant.sourceName !== undefined && variant.sourceName !== '') {
      metaParts.push(`Source: ${variant.sourceName}`)
    } else if (variant.source !== undefined && variant.source !== '') {
      metaParts.push(`Source: ${variant.source}`)
    }
    if (variant.sourcePageUrl !== undefined && variant.sourcePageUrl !== '') {
      metaParts.push(`Page: ${variant.sourcePageUrl}`)
    }
    if (variant.author !== undefined && variant.author !== '') {
      metaParts.push(`Author: ${variant.author}`)
    }
    if (variant.licenseName !== undefined && variant.licenseName !== '') {
      metaParts.push(`License: ${variant.licenseName}`)
    } else if (variant.license !== undefined && variant.license !== '') {
      metaParts.push(`License: ${variant.license}`)
    }
    if (variant.attributionRequired === true) {
      metaParts.push('Attribution required')
    } else if (variant.attributionRequired === false) {
      metaParts.push('Attribution: not required')
    }
    if (variant.originalFilename !== undefined && variant.originalFilename !== '') {
      metaParts.push(`Original: ${variant.originalFilename}`)
    }
    if (variant.modifiedFromOriginal === false) {
      metaParts.push('Unmodified original')
    } else if (variant.modifiedFromOriginal === true) {
      metaParts.push('Modified from original')
    }
    if (variant.soundFeatures !== undefined && variant.soundFeatures !== '') {
      metaParts.push(`Features: ${variant.soundFeatures}`)
    }
    if (variant.durationMs !== undefined) {
      metaParts.push(`${variant.durationMs}ms`)
    }
    if (variant.format !== undefined) {
      metaParts.push(variant.format)
    }
    if (variant.sampleRate !== undefined) {
      metaParts.push(`${variant.sampleRate}Hz`)
    }
    if (variant.channels !== undefined) {
      metaParts.push(`${variant.channels}ch`)
    }
    if (metaParts.length > 0) {
      lines.push(metaParts.join(' · '))
    }
    const rec = (entry.recommendations ?? []).find((item) => item.variantId === variant.id)
    if (rec !== undefined) {
      if (rec.direction !== undefined && rec.direction.length > 0) {
        lines.push(
          rec.direction
            .map((direction) => direction.toUpperCase())
            .join(' '),
        )
      }
      if (rec.reason !== undefined && rec.reason !== '') {
        lines.push(rec.reason)
      }
    }
    return lines.join('\n')
  }

  private updateReviewRowBadges(
    entry: SfxCatalogEntry,
    variant: SfxCatalogVariant,
    badgesEl: HTMLSpanElement,
    adoptedVariantId: string | null,
  ): void {
    const badges: string[] = []
    if (adoptedVariantId === variant.id) {
      badges.push('ADOPT SELECTED')
    }
    if (variant.status === 'runtime') {
      badges.push('RUNTIME SELECTED')
    }
    const rec = (entry.recommendations ?? []).find((item) => item.variantId === variant.id)
    if (rec !== undefined) {
      badges.push(`RECOMMENDED #${rec.rank}`)
    }
    if (getVariantReviewStatus(entry.id, variant.id) === 'preferred') {
      badges.push('PREFERRED')
    }
    if ((entry.deprioritizedVariantIds ?? []).indexOf(variant.id) >= 0) {
      badges.push('LOW PRIORITY')
    }
    badgesEl.textContent = badges.join(' · ')
  }

  private updateReviewAbLabel(entryId: string): void {
    const refs = this.reviewSectionRefsByEntryId[entryId]
    const ab = this.reviewAbByEntryId[entryId]
    if (refs === undefined || refs.abLabelEl === null || ab === undefined) {
      return
    }
    const entry = findCatalogEntry(entryId)
    const aLabel = entry !== null ? this.variantLabel(entry, ab.aVariantId) : '(none)'
    const bLabel = entry !== null ? this.variantLabel(entry, ab.bVariantId) : '(none)'
    refs.abLabelEl.textContent = `A: ${aLabel}   B: ${bLabel}`
  }

  private handleAdoptToggle(
    entry: SfxCatalogEntry,
    variantId: string,
    checkbox: HTMLInputElement,
  ): void {
    const refs = this.reviewSectionRefsByEntryId[entry.id]
    const nextAdoptedVariantId = checkbox.checked ? variantId : null
    if (refs !== undefined) {
      const otherVariantIds = Object.keys(refs.rowsByVariantId)
      for (let index = 0; index < otherVariantIds.length; index++) {
        const otherVariantId = otherVariantIds[index]
        if (otherVariantId !== variantId) {
          refs.rowsByVariantId[otherVariantId].checkbox.checked = false
        }
      }
    }
    setAdoptedVariantId(entry.id, nextAdoptedVariantId)
    if (refs !== undefined) {
      const variantIds = Object.keys(refs.rowsByVariantId)
      for (let index = 0; index < variantIds.length; index++) {
        const rowVariantId = variantIds[index]
        const rowVariant = findCatalogVariant(entry, rowVariantId)
        if (rowVariant !== null) {
          this.updateReviewRowBadges(
            entry,
            rowVariant,
            refs.rowsByVariantId[rowVariantId].badgesEl,
            nextAdoptedVariantId,
          )
        }
      }
    }
    this.updateReviewCounts()
    // 並び順（Adopt を先頭）を反映するため、スクロール位置を保ったまま再描画する
    this.mountReviewOverlay()
  }

  private updateReviewCounts(): void {
    const entries = getReviewAllEntries()
    let decided = 0
    let variantTotal = 0
    const undecidedLabels: string[] = []
    for (let index = 0; index < entries.length; index++) {
      const entry = entries[index]
      variantTotal = variantTotal + entry.variants.length
      const adoptedVariantId = getAdoptedVariantId(entry.id)
      if (adoptedVariantId !== null) {
        decided = decided + 1
      } else {
        undecidedLabels.push(`${entry.label} (${entry.id})`)
      }
    }
    if (this.reviewCountsEl !== null) {
      this.reviewCountsEl.textContent = [
        `Entry ${entries.length}`,
        `Variant ${variantTotal}`,
        `Decided ${decided}`,
        `Undecided ${entries.length - decided}`,
      ].join('  ·  ')
    }
    if (this.reviewUndecidedListEl !== null) {
      this.reviewUndecidedListEl.innerHTML = ''
      if (undecidedLabels.length === 0) {
        const li = document.createElement('li')
        li.textContent = 'なし（すべて決定済み）'
        li.style.color = '#4ade80'
        this.reviewUndecidedListEl.appendChild(li)
      } else {
        for (let index = 0; index < undecidedLabels.length; index++) {
          const li = document.createElement('li')
          li.textContent = undecidedLabels[index]
          this.reviewUndecidedListEl.appendChild(li)
        }
      }
    }
  }

  private playReviewVariant(entry: SfxCatalogEntry, variant: SfxCatalogVariant): void {
    // Play クリックはユーザー操作なので、ここで AudioContext を起こす
    this.unlockPreviewAudio()

    if (this.failedKeys[variant.audioKey] === true) {
      this.setPlaybackStatus(variant.id, 'file-not-found')
      this.setReviewCurrentPlaying(`FILE NOT FOUND: ${variant.label}`)
      return
    }

    if (this.previewVolume <= 0) {
      this.setPlaybackStatus(variant.id, 'idle')
      this.setReviewCurrentPlaying(`SFX MUTED (volume ${Math.round(this.previewVolume * 100)}%)`)
      return
    }

    const previewUrl = this.resolvePreviewUrl(variant)
    const playToken = this.previewPlayToken + 1
    this.previewPlayToken = playToken

    this.stopPreviewSoundKeepingToken()
    this.setPlaybackStatus(variant.id, 'loading')
    this.setReviewCurrentPlaying(`Loading: ${variant.label}`)

    const audio = new Audio(previewUrl)
    audio.preload = 'auto'
    audio.volume = Math.max(0, Math.min(1, this.previewVolume))
    this.previewHtmlAudio = audio

    const failWith = (status: PreviewPlaybackStatus, message: string): void => {
      if (playToken !== this.previewPlayToken) {
        return
      }
      this.failedKeys[variant.audioKey] = status === 'file-not-found' || status === 'load-failed'
      this.setPlaybackStatus(variant.id, status)
      this.setReviewCurrentPlaying(message)
      console.error('SFX catalog preview failed:', {
        variantId: variant.id,
        url: previewUrl,
        status,
      })
    }

    audio.addEventListener('error', () => {
      const mediaError = audio.error
      if (mediaError !== null && mediaError.code === mediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
        failWith('decode-failed', `DECODE FAILED: ${variant.label}`)
        return
      }
      failWith('load-failed', `LOAD FAILED: ${variant.label}`)
    })

    const playPromise = audio.play()
    if (playPromise === undefined) {
      // 古いブラウザ互換: play() が undefined を返す場合は再生開始とみなす
      if (playToken === this.previewPlayToken) {
        this.setPlaybackStatus(variant.id, 'playing')
        this.setReviewCurrentPlaying(`${entry.label} - ${variant.label} [${variant.id}]`)
      }
      return
    }

    playPromise
      .then(() => {
        if (playToken !== this.previewPlayToken) {
          return
        }
        this.setPlaybackStatus(variant.id, 'playing')
        this.setReviewCurrentPlaying(`${entry.label} - ${variant.label} [${variant.id}]`)
      })
      .catch((error: unknown) => {
        const errorName =
          error instanceof DOMException
            ? error.name
            : typeof error === 'object' && error !== null && 'name' in error
              ? String((error as { name: unknown }).name)
              : undefined
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        console.error('[SFX Preview] Playback failed', {
          variantId: variant.id,
          url: previewUrl,
          name: errorName,
          message: errorMessage,
        })
        if (errorName === 'NotAllowedError') {
          failWith('audio-blocked', `AUDIO CONTEXT BLOCKED: ${variant.label}`)
          return
        }
        failWith('decode-failed', `DECODE FAILED: ${variant.label}`)
      })
  }

  private playAllCandidatesForEntry(entry: SfxCatalogEntry): void {
    this.clearReviewSequenceTimers()
    const adoptedVariantId = getAdoptedVariantId(entry.id)
    const variants = sortVariantsForReview(entry, adoptedVariantId)
    let delayMs = 0
    for (let index = 0; index < variants.length; index++) {
      const variant = variants[index]
      if (this.failedKeys[variant.audioKey] === true) {
        continue
      }
      const timer = this.scene.time.delayedCall(delayMs, () => {
        if (!this.isOpenFlag) {
          return
        }
        this.playReviewVariant(entry, variant)
      })
      this.reviewSequenceTimers.push(timer)
      const estimatedDurationMs = variant.durationMs !== undefined ? variant.durationMs : 900
      const stepMs = Math.max(400, Math.min(2500, estimatedDurationMs + 200))
      delayMs = delayMs + stepMs
    }
  }

  private playAlternateAb(entry: SfxCatalogEntry): void {
    this.clearReviewSequenceTimers()
    const ab = this.reviewAbByEntryId[entry.id]
    if (ab === undefined || ab.aVariantId === null || ab.bVariantId === null) {
      this.setReviewCurrentPlaying('A/B が未設定です')
      return
    }
    const variantA = findCatalogVariant(entry, ab.aVariantId)
    const variantB = findCatalogVariant(entry, ab.bVariantId)
    if (variantA === null || variantB === null) {
      return
    }
    this.playReviewVariant(entry, variantA)
    const gapMs = 450
    const durationA = variantA.durationMs !== undefined ? variantA.durationMs : 700
    const waitMs = Math.min(2500, durationA + gapMs)
    const timer = this.scene.time.delayedCall(waitMs, () => {
      if (!this.isOpenFlag) {
        return
      }
      this.playReviewVariant(entry, variantB)
    })
    this.reviewSequenceTimers.push(timer)
  }

  private stopReviewPlayback(): void {
    this.clearReviewSequenceTimers()
    this.stopPreviewSound()
    this.setReviewCurrentPlaying('(停止しました)')
  }

  /** Preview HTMLAudio だけ止める（BGM / Runtime / stopAll は使わない） */
  private stopPreviewSound(): void {
    this.previewPlayToken = this.previewPlayToken + 1
    this.stopPreviewSoundKeepingToken()
  }

  private stopPreviewSoundKeepingToken(): void {
    if (this.previewHtmlAudio !== null) {
      try {
        this.previewHtmlAudio.pause()
        this.previewHtmlAudio.removeAttribute('src')
        this.previewHtmlAudio.load()
      } catch (_error) {
        // Preview 停止失敗で Catalog を壊さない
      }
      this.previewHtmlAudio = null
    }
  }

  private unlockPreviewAudio(): void {
    this.callbacks.audioSystem.unlock()
  }

  /** Catalog の path をブラウザ到達可能な public URL へ正規化する */
  private normalizePublicAssetUrl(pathValue: string): string {
    let path = pathValue.trim()
    if (path.indexOf('http://') === 0 || path.indexOf('https://') === 0) {
      return path
    }
    if (path.indexOf('public/') === 0) {
      path = path.slice('public/'.length)
    }
    while (path.indexOf('./') === 0) {
      path = path.slice(2)
    }
    if (path.charAt(0) !== '/') {
      path = '/' + path
    }
    path = path.replace(/\/{2,}/g, '/')
    return path
  }

  private resolvePreviewUrl(variant: SfxCatalogVariant): string {
    return this.normalizePublicAssetUrl(variant.path)
  }

  private setPlaybackStatus(variantId: string, status: PreviewPlaybackStatus): void {
    this.playbackStatusByVariantId[variantId] = status
    // どの Entry の行か分からないので、開いている全セクションを更新する
    const entryIds = Object.keys(this.reviewSectionRefsByEntryId)
    for (let index = 0; index < entryIds.length; index++) {
      this.renderRowPlaybackStatus(entryIds[index], variantId)
    }
  }

  private renderRowPlaybackStatus(entryId: string, variantId: string): void {
    const sectionRefs = this.reviewSectionRefsByEntryId[entryId]
    if (sectionRefs === undefined) {
      return
    }
    const rowRefs = sectionRefs.rowsByVariantId[variantId]
    if (rowRefs === undefined) {
      return
    }
    const status = this.playbackStatusByVariantId[variantId] ?? 'idle'
    let label = ''
    let color = '#93c5fd'
    if (status === 'loading') {
      label = 'LOADING'
      color = '#fde68a'
    } else if (status === 'playing') {
      label = 'PLAYING'
      color = '#4ade80'
    } else if (status === 'load-failed') {
      label = 'LOAD FAILED'
      color = '#f87171'
    } else if (status === 'decode-failed') {
      label = 'DECODE FAILED'
      color = '#f87171'
    } else if (status === 'file-not-found') {
      label = 'FILE NOT FOUND'
      color = '#f87171'
    } else if (status === 'audio-blocked') {
      label = 'AUDIO CONTEXT BLOCKED'
      color = '#fb923c'
    }
    rowRefs.statusEl.textContent = label
    rowRefs.statusEl.style.color = color
  }

  private setReviewCurrentPlaying(text: string): void {
    if (this.reviewCurrentPlayingEl !== null) {
      this.reviewCurrentPlayingEl.textContent = text
    }
  }

  private clearReviewSequenceTimers(): void {
    for (let index = 0; index < this.reviewSequenceTimers.length; index++) {
      this.reviewSequenceTimers[index].remove(false)
    }
    this.reviewSequenceTimers = []
  }

  private exportReviewJson(entries: SfxCatalogEntry[]): void {
    const json = buildAdoptionExportJson(entries)
    const didDownload = this.tryDownloadTextFile(
      'sfx-catalog-review-adoptions.json',
      json,
      'application/json',
    )
    if (!didDownload) {
      this.showTextModal('Export JSON', json)
    }
  }

  private copyReviewSummary(entries: SfxCatalogEntry[]): void {
    const text = buildAdoptionSummaryText(entries)
    if (navigator.clipboard !== undefined && navigator.clipboard.writeText !== undefined) {
      navigator.clipboard.writeText(text).catch(() => {
        this.showTextModal('Copy Summary', text)
      })
      return
    }
    this.showTextModal('Copy Summary', text)
  }

  private clearAllAdoptionsWithConfirm(entries: SfxCatalogEntry[]): void {
    const confirmed = window.confirm(
      'すべての採用記録を消去します。よろしいですか？（この操作は元に戻せません）',
    )
    if (!confirmed) {
      return
    }
    clearAllAdoptions()
    for (let index = 0; index < entries.length; index++) {
      const entry = entries[index]
      const refs = this.reviewSectionRefsByEntryId[entry.id]
      if (refs === undefined) {
        continue
      }
      const variantIds = Object.keys(refs.rowsByVariantId)
      for (let rowIndex = 0; rowIndex < variantIds.length; rowIndex++) {
        const variantId = variantIds[rowIndex]
        refs.rowsByVariantId[variantId].checkbox.checked = false
        const variant = findCatalogVariant(entry, variantId)
        if (variant !== null) {
          this.updateReviewRowBadges(entry, variant, refs.rowsByVariantId[variantId].badgesEl, null)
        }
      }
    }
    this.updateReviewCounts()
  }

  private tryDownloadTextFile(filename: string, content: string, mimeType: string): boolean {
    try {
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 1000)
      return true
    } catch (_error) {
      return false
    }
  }

  private showTextModal(title: string, content: string): void {
    const modalOverlay = document.createElement('div')
    modalOverlay.style.cssText =
      'position:fixed;inset:0;z-index:2147483600;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;'

    const modalBox = document.createElement('div')
    modalBox.style.cssText =
      'background:#111827;border:1px solid #334155;border-radius:8px;padding:16px;max-width:640px;width:100%;max-height:80vh;display:flex;flex-direction:column;gap:8px;'

    const modalTitle = document.createElement('div')
    modalTitle.textContent = title
    modalTitle.style.cssText = 'font-size:14px;color:#fde68a;font-weight:bold;'
    modalBox.appendChild(modalTitle)

    const hint = document.createElement('div')
    hint.textContent =
      '自動コピー・自動ダウンロードができなかったため、下のテキストを手動でコピーしてください。'
    hint.style.cssText = 'font-size:11px;color:#a1a1aa;'
    modalBox.appendChild(hint)

    const textarea = document.createElement('textarea')
    textarea.value = content
    textarea.readOnly = true
    textarea.style.cssText =
      'flex:1;min-height:240px;background:#0b1120;color:#e5e7eb;border:1px solid #334155;border-radius:4px;padding:8px;font-size:11px;font-family:monospace;'
    modalBox.appendChild(textarea)

    const closeRow = document.createElement('div')
    closeRow.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;'
    closeRow.appendChild(
      this.createReviewButton(
        'Close',
        () => {
          modalOverlay.remove()
        },
        'primary',
      ),
    )
    modalBox.appendChild(closeRow)

    modalOverlay.appendChild(modalBox)
    document.body.appendChild(modalOverlay)
    textarea.focus()
    textarea.select()
  }

  private createReviewButton(
    label: string,
    onClick: () => void,
    variant: 'default' | 'primary' | 'danger' = 'default',
  ): HTMLButtonElement {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = label
    let background = '#1e293b'
    let borderColor = '#334155'
    if (variant === 'primary') {
      background = '#78350f'
      borderColor = '#fde68a'
    }
    if (variant === 'danger') {
      background = '#7f1d1d'
      borderColor = '#f87171'
    }
    button.style.cssText = `background:${background};color:#f8fafc;border:1px solid ${borderColor};border-radius:4px;padding:4px 10px;font-size:11px;cursor:pointer;`
    button.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      onClick()
    })
    return button
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  private clearBurstTimers(): void {
    for (let index = 0; index < this.burstTimers.length; index++) {
      this.burstTimers[index].remove(false)
    }
    this.burstTimers = []
  }

  private destroyPanel(): void {
    this.clearBurstTimers()
    for (let index = 0; index < this.ownedObjects.length; index++) {
      this.ownedObjects[index].destroy()
    }
    this.ownedObjects = []
  }
}
