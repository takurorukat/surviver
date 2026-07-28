/**
 * 敵まわりの共有型。
 */
import Phaser from 'phaser'

/** スポーン座標（警告マーカーと実体の両方で使う） */
export type SpawnPosition = {
  x: number
  y: number
}

export type EnemyKind =
  | 'melee'
  | 'toughMelee'
  | 'mushroom'
  | 'earthSlime'
  | 'earthRock'
  | 'earthSkeleton'
  | 'spiritFire'
  | 'spiritThunder'
  | 'burningTree'
  | 'ashKnight'
  | 'chaosElemental'
  | 'stump'
  | 'beetle'
  | 'branch'
  | 'gravestone'
  | 'stoneGuard'
  | 'ranged'
  | 'runner'
  | 'charger'
  | 'armored'
  | 'shielded'

/**
 * 警告点滅と本番スポーンのタイマー一式。
 * ステージ切替などでキャンセルするときに destroy する。
 */
export type SpawnWarningTimers = {
  blinkTimer: Phaser.Time.TimerEvent
  spawnTimer: Phaser.Time.TimerEvent
}

