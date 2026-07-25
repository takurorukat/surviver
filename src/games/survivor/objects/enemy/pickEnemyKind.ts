/**
 * エリア・ステージごとの敵種類抽選（Phaser 非依存）。
 * Wave / スポーン側から呼び、ユニットテストでもそのまま検証できる。
 */
import type { StageAreaId } from '../../GameConstants'
import type { EnemyKind } from './types'

const FOREST_STAGE5_ENEMY_KINDS: EnemyKind[] = ['mushroom', 'stump', 'beetle', 'branch']
// Volcano Stage1〜4 で登場した敵（混沌エレメンタルが出すのも同じ）
const VOLCANO_STAGE5_ENEMY_KINDS: EnemyKind[] = [
  'spiritFire',
  'spiritThunder',
  'burningTree',
  'ashKnight',
]

function pickRandomKind(kinds: EnemyKind[]): EnemyKind {
  const index = Math.floor(Math.random() * kinds.length)
  return kinds[index]
}

export function pickForestStage5EnemyKind(): EnemyKind {
  return pickRandomKind(FOREST_STAGE5_ENEMY_KINDS)
}

export function pickVolcanoStage5EnemyKind(): EnemyKind {
  return pickRandomKind(VOLCANO_STAGE5_ENEMY_KINDS)
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

  // Ruins Stage 1 は Stone Guard だけ（遅い基本追跡）
  if (areaId === 'ruins' && stageNumber === 1) {
    return 'stoneGuard'
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

  // Volcano Stage 2 は雷の精霊だけ（HP3・プレイヤー初期速度）
  if (stageNumber === 2) {
    return 'spiritThunder'
  }

  // Volcano Stage 3 は燃え木だけ（HP8・火の精霊をスポーン）
  if (stageNumber === 3) {
    return 'burningTree'
  }

  // Volcano Stage 4 は灰騎士だけ（HP6・最初の2発はシールド）
  if (stageNumber === 4) {
    return 'ashKnight'
  }

  // Volcano Stage 5（最終）は Stage1〜4 で登場した敵をランダムに混ぜる
  if (stageNumber === 5) {
    return pickVolcanoStage5EnemyKind()
  }

  // 半分は通常敵を残し、必要スキルを取った後も攻撃の手応えを保つ
  if (stageNumber < 5 && Math.random() < 0.4) {
    return 'melee'
  }

  const mixedKinds: EnemyKind[] = [
    'runner',
    'charger',
    'armored',
    'shielded',
    'ranged',
  ]
  return pickRandomKind(mixedKinds)
}
