// constants/areas.ts
// エリア定義・解放ヘルパー・床色 / タイル関連

// --- エリア（タイトルのステージ選択）---
// Plains は最初から遊べる。Forest は Plains クリア後。他は後続実装。
export type StageAreaId =
  | 'plains'
  | 'forest'
  | 'volcano'
  | 'ruins'
  | 'castle'
  | 'dungeon'

export type StageAreaDef = {
  id: StageAreaId
  name: string
  stageCount: number
  // 解除に必要な「クリア済みエリア」。null なら最初から遊べる
  unlockRequiresClearedAreaId: StageAreaId | null
  // 選択中に表示する解除条件（英語）
  unlockCondition: string
  // このエリアが遊べるようになるまでは、タイトル上の名前を「?」で隠す
  // （例: Volcano は Forest が開放されるまで ?）
  hiddenUntilAreaPlayableId: StageAreaId | null
  // true なら条件を満たしてもまだ遊べない（後続実装用）
  comingSoon: boolean
}

export const STAGE_AREA_PLAINS_ID: StageAreaId = 'plains'

/** 結果画面: 次エリア解放の括弧内文言 */
export const AREA_UNLOCK_NOTIFICATION_REASON = 'New Area'
/** 結果画面: エリア初クリアの Max HP +1 */
export const AREA_CLEAR_MAX_HP_BONUS_LABEL = 'Max HP +1'
export const AREA_CLEAR_MAX_HP_BONUS_REASON = 'Area Clear Bonus'
/** 結果画面: スキル解放の括弧内文言（UNLOCKED: Pierce の下に重複しないよう） */
export const SKILL_UNLOCK_NOTIFICATION_REASON = 'New Skill'

export const STAGE_AREAS: StageAreaDef[] = [
  {
    id: 'plains',
    name: 'Windy Plains',
    stageCount: 3,
    unlockRequiresClearedAreaId: null,
    unlockCondition: '',
    hiddenUntilAreaPlayableId: null,
    comingSoon: false,
  },
  {
    id: 'forest',
    name: 'Water Forest',
    stageCount: 5,
    unlockRequiresClearedAreaId: 'plains',
    unlockCondition: 'Clear Windy Plains to unlock',
    // 最初から名前は見える（未解放はグレー）
    hiddenUntilAreaPlayableId: null,
    comingSoon: false,
  },
  {
    id: 'volcano',
    name: 'Fire Volcano',
    stageCount: 5,
    unlockRequiresClearedAreaId: 'forest',
    unlockCondition: 'Clear Water Forest to unlock',
    // Water Forest が開放されるまで ?
    hiddenUntilAreaPlayableId: 'forest',
    comingSoon: false,
  },
  {
    id: 'ruins',
    name: 'Earth Dungeon',
    stageCount: 5,
    unlockRequiresClearedAreaId: 'volcano',
    unlockCondition: 'Clear Fire Volcano to unlock',
    // Volcano が開放されるまで ?
    hiddenUntilAreaPlayableId: 'volcano',
    comingSoon: false,
  },
  {
    id: 'castle',
    name: 'Castle',
    stageCount: 5,
    unlockRequiresClearedAreaId: 'ruins',
    unlockCondition: 'Coming Soon',
    hiddenUntilAreaPlayableId: 'ruins',
    // 専用の敵構成・床・タイトル絵・BGMが揃うまで選択不可
    comingSoon: true,
  },
  {
    id: 'dungeon',
    name: 'Abyss',
    stageCount: 5,
    unlockRequiresClearedAreaId: 'castle',
    unlockCondition: 'Coming Soon',
    hiddenUntilAreaPlayableId: 'castle',
    // 同上。完成までは comingSoon のままにする
    comingSoon: true,
  },
]

/**
 * エリア ID から定義を探す。見つからなければ null。
 */
export function getAreaById(areaId: string): StageAreaDef | null {
  for (let index = 0; index < STAGE_AREAS.length; index++) {
    if (STAGE_AREAS[index].id === areaId) {
      return STAGE_AREAS[index]
    }
  }
  return null
}

/** タイトルのエリア選択パネル用イラストのテクスチャキー。無いエリアは null。 */
export function getTitleAreaArtTextureKey(areaId: string): string | null {
  if (areaId === 'plains') {
    return TITLE_AREA_ART_PLAINS_KEY
  }
  if (areaId === 'forest') {
    return TITLE_AREA_ART_FOREST_KEY
  }
  if (areaId === 'volcano') {
    return TITLE_AREA_ART_VOLCANO_KEY
  }
  if (areaId === 'ruins') {
    return TITLE_AREA_ART_DUNGEON_KEY
  }
  return null
}

/**
 * あるエリアを初めてクリアしたときに遊べるようになる次エリア一覧。
 * 例: plains クリア → Forest / forest クリア → Volcano
 * comingSoon のエリアはまだ遊べないので含めない。
 */
export function getAreasUnlockedByClearing(clearedAreaId: string): StageAreaDef[] {
  const unlockedAreas: StageAreaDef[] = []
  for (let index = 0; index < STAGE_AREAS.length; index++) {
    const area = STAGE_AREAS[index]
    if (area.comingSoon) {
      continue
    }
    if (area.unlockRequiresClearedAreaId === clearedAreaId) {
      unlockedAreas.push(area)
    }
  }
  return unlockedAreas
}

/**
 * そのエリアのステージ総数（最終ステージ番号）。不明なら Plains の 3。
 */
export function getAreaStageCount(areaId: string): number {
  const area = getAreaById(areaId)
  if (area === null) {
    return 3
  }
  return area.stageCount
}

/**
 * いまのステージがエリア最終か（難易度アップ・ゲームクリア判定用）。
 */
export function isFinalStage(stageNumber: number, totalStages: number): boolean {
  return stageNumber >= totalStages
}

/**
 * ステージクリア時のゴールド報酬。
 * エリアが進むごとに基礎額 +1、最終ステージは2倍、
 * さらにそのステージをノーダメージかつ全敵撃破でクリアすると2倍。
 */
export function calculateStageClearGold(
  areaId: StageAreaId,
  finalStage: boolean,
  noDamageAllEnemiesClear: boolean,
): number {
  const areaOrder: StageAreaId[] = [
    'plains',
    'forest',
    'volcano',
    'ruins',
    'castle',
    'dungeon',
  ]
  const areaIndex = areaOrder.indexOf(areaId)
  const baseGold = areaIndex >= 0 ? areaIndex + 1 : 1

  let awardedGold = baseGold
  if (finalStage) {
    awardedGold = awardedGold * 2
  }
  if (noDamageAllEnemiesClear) {
    awardedGold = awardedGold * 2
  }
  return awardedGold
}
export const TITLE_AREA_ART_PLAINS_KEY = 'title-area-art-plains'
export const TITLE_AREA_ART_PLAINS_PATH = 'assets/ui/area_windy_plains.jpg'
export const TITLE_AREA_ART_FOREST_KEY = 'title-area-art-forest'
export const TITLE_AREA_ART_FOREST_PATH = 'assets/ui/area_lake_forest.jpg'
export const TITLE_AREA_ART_VOLCANO_KEY = 'title-area-art-volcano'
export const TITLE_AREA_ART_VOLCANO_PATH = 'assets/ui/area_fiery_volcano.jpg'
export const TITLE_AREA_ART_DUNGEON_KEY = 'title-area-art-dungeon'
export const TITLE_AREA_ART_DUNGEON_PATH = 'assets/ui/area_earth_dungeon.jpg'
export const TITLE_AREA_ART_ALPHA = 0.9

// --- ステージ床の色（Rectangle のみ・背景画像なし）---
// 床の上に重ねる黒の濃さ（0 = 変化なし、1 = 真っ黒）。フィールドを暗めに見せる
export const FLOOR_DARKEN_ALPHA = 0.3

// --- Volcano 床（Plains タイルを使い、明るい赤 → 徐々に黒へ）---
// タイル自体は Plains Stage1 と同じ明るいマスを使い、色はオーバーレイで変える
export const VOLCANO_FLOOR_TILE_BLOCK_INDEX = 0
// 床全体に重ねる赤い色（明るい溶岩っぽさ）
export const VOLCANO_FLOOR_RED_OVERLAY_COLOR = 0xff3b2f
// ステージごとの赤オーバーレイの濃さ（最初が一番赤く、後半は弱める）
export const VOLCANO_FLOOR_RED_OVERLAY_ALPHAS: number[] = [0.48, 0.38, 0.28, 0.18, 0.1]
// ステージごとの黒オーバーレイの濃さ（後半ほど真っ暗）
export const VOLCANO_FLOOR_DARKEN_ALPHAS: number[] = [0.08, 0.28, 0.45, 0.62, 0.78]

/** Volcano 床の赤オーバーレイ濃さ（stage 1〜）。 */
export function getVolcanoFloorRedOverlayAlpha(stageNumber: number): number {
  const index = Math.max(0, Math.floor(stageNumber) - 1)
  if (index >= VOLCANO_FLOOR_RED_OVERLAY_ALPHAS.length) {
    return VOLCANO_FLOOR_RED_OVERLAY_ALPHAS[VOLCANO_FLOOR_RED_OVERLAY_ALPHAS.length - 1]
  }
  return VOLCANO_FLOOR_RED_OVERLAY_ALPHAS[index]
}

/** Volcano 床の黒オーバーレイ濃さ（stage 1〜）。 */
export function getVolcanoFloorDarkenAlpha(stageNumber: number): number {
  const index = Math.max(0, Math.floor(stageNumber) - 1)
  if (index >= VOLCANO_FLOOR_DARKEN_ALPHAS.length) {
    return VOLCANO_FLOOR_DARKEN_ALPHAS[VOLCANO_FLOOR_DARKEN_ALPHAS.length - 1]
  }
  return VOLCANO_FLOOR_DARKEN_ALPHAS[index]
}

// インデックス = stageNumber - 1。GameScene が床色を切り替える。
export const STAGE_FLOOR_COLORS: number[] = [
  0x1a2e1a, // Stage 1
  0x1a1a2e, // Stage 2
  0x2e1a1a, // Stage 3
  0x2e2e1a, // Stage 4
  0x3a1218, // Stage 5（最終・少し暗い赤）
]

// --- Plains の床タイル（縦に5色並んだタイルシート。上から順に使う）---
// 各色ブロックは高さ48px。左側は角丸の飾りタイル（角が透明）なので床には使わない。
// 床には右側のベタ塗りタイル（x=48〜80）を使う。ただし最外周1pxに透明な角が
// あるため、完全に不透明な内側 28×28（x=50, y=+2 から）だけを切り出して敷き詰める。
export const PLAINS_FLOOR_TILESET_KEY = 'plains-floor-tiles'
export const PLAINS_FLOOR_TILESET_PATH = 'assets/sprites/plains_floor_tiles.png'
export const PLAINS_FLOOR_BLOCK_HEIGHT = 48
export const PLAINS_FLOOR_BLOCK_COUNT = 5
export const PLAINS_FLOOR_SOURCE_CROP_X = 50
export const PLAINS_FLOOR_SOURCE_CROP_Y_OFFSET = 2
export const PLAINS_FLOOR_SOURCE_CROP_SIZE = 28
// 28px の切り出しを2倍に拡大して敷く（キャラのドット感と揃える）
export const PLAINS_FLOOR_TILE_DISPLAY_SIZE = 56

// --- 床の装飾タイル（16px タイルが 16×5 で並ぶシート）---
// Forest では床の上に枝・小枝・草・葉を散らして森っぽくする
export const FLOOR_DETAIL_TILESET_KEY = 'floor-detail-tiles'
export const FLOOR_DETAIL_TILESET_PATH = 'assets/sprites/floor_detail_tiles.png'
export const FLOOR_DETAIL_TILE_SIZE = 16
// 16px タイルを2倍（32px）で描く
export const FLOOR_DETAIL_DISPLAY_SIZE = 32
// 森っぽいタイルの位置（タイル単位の列・行）。上段 = 枝・小枝、3段目 = 草・葉
export const FOREST_DETAIL_TILES: { column: number; row: number }[] = [
  { column: 5, row: 0 },
  { column: 6, row: 0 },
  { column: 7, row: 0 },
  { column: 8, row: 0 },
  { column: 0, row: 2 },
  { column: 1, row: 2 },
  { column: 2, row: 2 },
  { column: 3, row: 2 },
  { column: 4, row: 2 },
  { column: 5, row: 2 },
  { column: 6, row: 2 },
  { column: 7, row: 2 },
]
// 64px 格子ごとに 30% の確率で装飾を1つ置く（置きすぎるとうるさいので控えめ）
export const FOREST_DETAIL_GRID_SIZE = 64
export const FOREST_DETAIL_CHANCE = 0.3

/**
 * ステージ番号に応じた床色。エリア最終はいちばん暗い赤。
 */
export function getStageFloorColor(stageNumber: number, totalStages: number): number {
  if (isFinalStage(stageNumber, totalStages)) {
    return STAGE_FLOOR_COLORS[STAGE_FLOOR_COLORS.length - 1]
  }
  const colorIndex = stageNumber - 1
  if (colorIndex >= 0 && colorIndex < STAGE_FLOOR_COLORS.length) {
    return STAGE_FLOOR_COLORS[colorIndex]
  }
  return STAGE_FLOOR_COLORS[0]
}
