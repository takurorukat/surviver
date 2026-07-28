/**
 * エリア・ステージごとの敵種類抽選（Phaser 非依存）。
 * Wave / スポーン側から呼び、ユニットテストでもそのまま検証できる。
 */
import type { StageAreaId } from '../../GameConstants'
import {
  ENEMY_EARTH_MAGMA_ROCK_STAGE4_WEIGHT,
  ENEMY_EARTH_STAGE4_OTHER_WEIGHT,
} from '../../GameConstants'
import type { EnemyKind } from './types'

const FOREST_STAGE5_ENEMY_KINDS: EnemyKind[] = ['mushroom', 'stump', 'beetle', 'branch']

/** 重み付き抽選の1エントリ。weight は相対比率（合計が100でなくてよい）。 */
export type WeightedEnemyKind = {
  kind: EnemyKind
  weight: number
}

/**
 * Earth Dungeon ボスが召喚できる通常敵（Stage1〜4）。
 * ボス自身・特殊ボスは含めない。
 */
export const EARTH_DUNGEON_SUMMONABLE_ENEMY_KINDS: readonly EnemyKind[] = [
  'earthSlime',
  'earthRock',
  'earthSkeleton',
  'earthMagmaRock',
] as const

/** Earth ボス召喚用: 候補から1種類をランダムに選ぶ。 */
export function pickEarthDungeonSummonEnemyKind(): EnemyKind {
  return pickRandomKind([...EARTH_DUNGEON_SUMMONABLE_ENEMY_KINDS])
}

/**
 * Earth Dungeon Stage4: マグマ岩 20〜25%＋Stage1〜3 通常敵。
 * 重み 22 : 26×3 → マグマ岩 ≈ 22%
 */
export const RUINS_STAGE4_WEIGHTS: WeightedEnemyKind[] = [
  { kind: 'earthMagmaRock', weight: ENEMY_EARTH_MAGMA_ROCK_STAGE4_WEIGHT },
  { kind: 'earthSlime', weight: ENEMY_EARTH_STAGE4_OTHER_WEIGHT },
  { kind: 'earthRock', weight: ENEMY_EARTH_STAGE4_OTHER_WEIGHT },
  { kind: 'earthSkeleton', weight: ENEMY_EARTH_STAGE4_OTHER_WEIGHT },
]

/** Stage4 抽選（マグマ岩上限は呼び出し側で別途制限）。 */
export function pickRuinsStage4EnemyKind(): EnemyKind {
  return pickWeightedEnemyKind(RUINS_STAGE4_WEIGHTS)
}

/** マグマ岩を除いた Stage4 候補から1つ選ぶ。 */
export function pickRuinsStage4EnemyKindWithoutMagmaRock(): EnemyKind {
  const withoutMagma: WeightedEnemyKind[] = []
  for (let index = 0; index < RUINS_STAGE4_WEIGHTS.length; index++) {
    const entry = RUINS_STAGE4_WEIGHTS[index]
    if (entry.kind !== 'earthMagmaRock') {
      withoutMagma.push(entry)
    }
  }
  return pickWeightedEnemyKind(withoutMagma)
}

/**
 * Volcano 本番スポーンから一時除外している敵（定義・Factory・行動は残置）。
 * 理由: 現設定では専用見た目が付かず色付き矩形のまま出る。
 * - armored / charger: walk 画像はあるが ENEMY_WALK_SPRITES_ENABLED=false
 * - runner / shielded: スプライト未接続
 * 戻し方: 見た目を付けたうえで、下の WEIGHTS にエントリを復元する。
 */
export const VOLCANO_SPAWN_EXCLUDED_UNFINISHED_VISUAL_KINDS: EnemyKind[] = [
  'armored',
  'charger',
  'runner',
  'shielded',
]

// Volcano Stage2: spiritThunder / spiritFire（armored は見た目未実装のため除外）
const VOLCANO_STAGE2_WEIGHTS: WeightedEnemyKind[] = [
  { kind: 'spiritThunder', weight: 60 },
  { kind: 'spiritFire', weight: 25 },
]

// Volcano Stage3: burningTree / spiritThunder / ranged
const VOLCANO_STAGE3_WEIGHTS: WeightedEnemyKind[] = [
  { kind: 'burningTree', weight: 55 },
  { kind: 'spiritThunder', weight: 25 },
  { kind: 'ranged', weight: 20 },
]

// Volcano Stage4: ashKnight / spiritThunder（shielded は見た目未実装のため除外）
const VOLCANO_STAGE4_WEIGHTS: WeightedEnemyKind[] = [
  { kind: 'ashKnight', weight: 55 },
  { kind: 'spiritThunder', weight: 25 },
]

// Volcano Stage5: Stage1〜4 実装済み4種＋蜂（runner/charger は見た目未実装のため除外）
// 相対重みは従来どおり（除外分は抽選から消え、残りが自動で正規化される）
const VOLCANO_STAGE5_WEIGHTS: WeightedEnemyKind[] = [
  { kind: 'spiritFire', weight: 175 },
  { kind: 'spiritThunder', weight: 175 },
  { kind: 'burningTree', weight: 175 },
  { kind: 'ashKnight', weight: 175 },
  { kind: 'ranged', weight: 100 },
]

function pickRandomKind(kinds: EnemyKind[]): EnemyKind {
  const index = Math.floor(Math.random() * kinds.length)
  return kinds[index]
}

/**
 * 重み付きで敵種類を1つ選ぶ。
 * Python: random.choices(kinds, weights=weights, k=1)[0] に相当
 */
export function pickWeightedEnemyKind(entries: WeightedEnemyKind[]): EnemyKind {
  let totalWeight = 0
  for (let index = 0; index < entries.length; index++) {
    totalWeight = totalWeight + entries[index].weight
  }

  let roll = Math.random() * totalWeight
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index]
    roll = roll - entry.weight
    if (roll < 0) {
      return entry.kind
    }
  }

  return entries[entries.length - 1].kind
}

export function pickForestStage5EnemyKind(): EnemyKind {
  return pickRandomKind(FOREST_STAGE5_ENEMY_KINDS)
}

/** Volcano Stage5 のウェーブ／混沌エレメンタル召喚で使う抽選。 */
export function pickVolcanoStage5EnemyKind(): EnemyKind {
  return pickWeightedEnemyKind(VOLCANO_STAGE5_WEIGHTS)
}

/**
 * Volcano 各ステージの本番スポーン候補（重み付き）を返す。
 * Stage1 は単一候補のため weight 1。候補が空にならないことをテストで検証する。
 */
export function getVolcanoSpawnWeightTable(stageNumber: number): WeightedEnemyKind[] {
  if (stageNumber === 1) {
    return [{ kind: 'spiritFire', weight: 1 }]
  }
  if (stageNumber === 2) {
    return VOLCANO_STAGE2_WEIGHTS
  }
  if (stageNumber === 3) {
    return VOLCANO_STAGE3_WEIGHTS
  }
  if (stageNumber === 4) {
    return VOLCANO_STAGE4_WEIGHTS
  }
  if (stageNumber === 5) {
    return VOLCANO_STAGE5_WEIGHTS
  }
  return [{ kind: 'spiritFire', weight: 1 }]
}

/**
 * エリアとステージ番号から、スポーンする敵種類を1つ決める。
 * spawnAsRanged は Plains など射撃混在ステージ向け。Ruins Stage1 では無視する。
 */
export function pickEnemyKindForArea(
  areaId: StageAreaId,
  stageNumber: number,
  spawnAsRanged: boolean,
): EnemyKind {
  // Plains Stage 2 は少し硬い泥スライムだけを出す（射撃は Stage3 から）
  if (areaId === 'plains' && stageNumber === 2) {
    return 'toughMelee'
  }

  // Forest Stage 1 はキノコだけ（緑スライムと同じステータス・動き）
  if (areaId === 'forest' && stageNumber === 1) {
    return 'mushroom'
  }

  // Forest Stage 2 は切り株だけ（HP7・速度半分・キノコを出す・出現は2体固定）
  if (areaId === 'forest' && stageNumber === 2) {
    return 'stump'
  }

  // Forest Stage 3 はカブトムシだけ（HP5・緑スライム相当速度・経験値2倍）
  if (areaId === 'forest' && stageNumber === 3) {
    return 'beetle'
  }

  // Forest Stage 4 は枝だけ（HP6・緑スライムより遅い・範囲爆破で2倍ダメージ）
  if (areaId === 'forest' && stageNumber === 4) {
    return 'branch'
  }

  // Forest Stage 5（最終）は Stage1〜4 で登場した敵をランダムに混ぜる
  if (areaId === 'forest' && stageNumber === 5) {
    return pickForestStage5EnemyKind()
  }

  // Ruins Stage 1 は土スライムだけ（緑スライム相当の基本追跡）
  if (areaId === 'ruins' && stageNumber === 1) {
    return 'earthSlime'
  }

  // Ruins Stage 2 は岩敵だけ（HP5・やや遅い・1発ブロック・小石弾）
  if (areaId === 'ruins' && stageNumber === 2) {
    return 'earthRock'
  }

  // Ruins Stage 3 はスケルトンだけ（HP10・カブトムシと同じ突進）
  if (areaId === 'ruins' && stageNumber === 3) {
    return 'earthSkeleton'
  }

  // Ruins Stage 4: マグマ岩（放射攻撃）＋ Stage1〜3 通常敵の混成
  if (areaId === 'ruins' && stageNumber === 4) {
    return pickRuinsStage4EnemyKind()
  }

  // Plains Stage3+ の近接は Stage2 と同じ硬い泥スライム（射撃は蜂）
  // Stage1 は通常の緑スライム（下の共通分岐へ落とす）
  if (areaId === 'plains' && stageNumber >= 3) {
    return spawnAsRanged ? 'ranged' : 'toughMelee'
  }

  if (areaId !== 'volcano') {
    return spawnAsRanged ? 'ranged' : 'melee'
  }

  // Volcano Stage 1 は火の精霊だけ（緑スライムと同じステータス・動き）
  if (stageNumber === 1) {
    return 'spiritFire'
  }

  // Volcano Stage 2: 雷精霊中心＋火精霊（armored は見た目未実装のため除外）
  if (stageNumber === 2) {
    return pickWeightedEnemyKind(VOLCANO_STAGE2_WEIGHTS)
  }

  // Volcano Stage 3: 燃え木中心＋雷精霊・射撃の混成
  if (stageNumber === 3) {
    return pickWeightedEnemyKind(VOLCANO_STAGE3_WEIGHTS)
  }

  // Volcano Stage 4: 灰騎士中心＋雷精霊（shielded は見た目未実装のため除外）
  if (stageNumber === 4) {
    return pickWeightedEnemyKind(VOLCANO_STAGE4_WEIGHTS)
  }

  // Volcano Stage 5（最終）: 実装済み見た目の敵のみ
  if (stageNumber === 5) {
    return pickVolcanoStage5EnemyKind()
  }

  // Stage 1〜5 以外は来ない想定。未実装見た目の混成に落とさず火精霊のみ
  return 'spiritFire'
}
