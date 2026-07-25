/**
 * 敵オブジェクトに紐づく内部状態（WeakMap / UID）。
 */
import Phaser from 'phaser'
import { BreathingSprite } from '../BreathingSprite'

// setData に頼らず、敵オブジェクト直結で HP バーを覚える
// Rectangle 3枚の Container（毎フレーム Graphics.clear しない＝敵が多いほど効く）
export type EnemyHpBarView = {
  container: Phaser.GameObjects.Container
  fill: Phaser.GameObjects.Rectangle
  innerWidth: number
}
export const enemyHpBarMap = new WeakMap<Phaser.GameObjects.Rectangle, EnemyHpBarView>()
// 近接敵の物理用 Rectangle と、見た目用 Sprite の対応
export const enemyWalkSpriteMap = new WeakMap<
  Phaser.GameObjects.Rectangle,
  Phaser.GameObjects.Sprite
>()
// 呼吸アニメ方式の見た目（静止PNG＋黒枠）
export const enemyBreathingSpriteMap = new WeakMap<
  Phaser.GameObjects.Rectangle,
  BreathingSprite
>()
// 貫通判定用の一意 ID（同じ敵に弾が二度当たらないようにする）
let nextEnemyUid = 1

export function allocateNextEnemyUid(): number {
  const uid = nextEnemyUid
  nextEnemyUid = nextEnemyUid + 1
  return uid
}
