// ============================================================
// PlayerAttackSystem.ts
// ------------------------------------------------------------
// プレイヤーの自動攻撃（最寄り敵への弾発射）と弾の毎フレーム更新。
//
// 役割:
//   - 発射間隔・射程・ダメージ・貫通数を見て弾を撃つ
//   - 毎回、射程内で一番近い敵を狙う（より近い敵が来たらそちらへ切り替える）
//   - 弾の速度維持とプレイエリア外削除を毎フレーム呼ぶ
//
// 呼び出し元:
//   - GameScene.ts … update で tryFireBulletAtNearestEnemy /
//                     updatePlayerBullets / clearLockedTargetIfEnemyDestroyed
//
// 関連ファイル:
//   - objects/PlayerBullet.ts … firePlayerBullet / 速度維持 / エリア外削除
//   - objects/Enemy.ts … countActiveEnemies
//   - LevelUpChoiceSystem.ts … 連射・射程・ダメージ・貫通の強化元
//
// 注意: 弾と敵の当たり判定は GameScene の physics.overlap。
//       ここは「誰に撃つか・いつ撃つか」だけ。
// ============================================================

import Phaser from 'phaser'
import {
  firePlayerBullet,
  removePlayerBulletsOutsidePlayArea,
  maintainPlayerBulletVelocities,
  type PlayerBulletStyle,
} from '../objects/PlayerBullet'
import { countActiveEnemies } from '../objects/Enemy'

// 攻撃のクールダウンと現在の狙いにまとめた状態
// GameScene が 1 つ保持し、毎フレーム渡す
export type PlayerAttackState = {
  lastAttackTimeMs: number
  // いま狙っている敵（毎発射前に最寄りへ更新する）
  lockedTarget: Phaser.GameObjects.Rectangle | null
}

/** 攻撃状態の初期値を作る。ステージ開始・リスタート時に使う。 */
export function createPlayerAttackState(): PlayerAttackState {
  return {
    lastAttackTimeMs: 0,
    lockedTarget: null,
  }
}

/**
 * 射程内で最も近い敵を探す。
 * 見つからなければ null。
 */
export function findNearestEnemyInRange(
  enemyGroup: Phaser.Physics.Arcade.Group,
  playerX: number,
  playerY: number,
  attackRange: number,
): Phaser.GameObjects.Rectangle | null {
  const children = enemyGroup.getChildren()
  let nearestEnemy: Phaser.GameObjects.Rectangle | null = null
  // 初期値を射程の二乗にしておけば、射程外は自動で除外される
  let nearestDistanceSquared = attackRange * attackRange

  for (let index = 0; index < children.length; index++) {
    const enemy = children[index] as Phaser.GameObjects.Rectangle
    if (!enemy.active) {
      continue
    }

    if (enemy.getData('isDefeated') === true) {
      continue
    }

    const dx = enemy.x - playerX
    const dy = enemy.y - playerY
    const distanceSquared = dx * dx + dy * dy

    if (distanceSquared > nearestDistanceSquared) {
      continue
    }

    nearestDistanceSquared = distanceSquared
    nearestEnemy = enemy
  }

  return nearestEnemy
}

/**
 * 跳弾用: 命中済み UID を除き、指定地点から最も近い敵を探す。
 */
export function findNearestUnhitEnemyInRange(
  enemyGroup: Phaser.Physics.Arcade.Group,
  originX: number,
  originY: number,
  searchRadius: number,
  hitEnemyUids: number[],
): Phaser.GameObjects.Rectangle | null {
  const children = enemyGroup.getChildren()
  let nearestEnemy: Phaser.GameObjects.Rectangle | null = null
  let nearestDistanceSquared = searchRadius * searchRadius

  for (let index = 0; index < children.length; index++) {
    const enemy = children[index] as Phaser.GameObjects.Rectangle
    if (!enemy.active || enemy.getData('isDefeated') === true) {
      continue
    }

    const enemyUid = enemy.getData('enemyUid') as number
    if (hitEnemyUids.includes(enemyUid)) {
      continue
    }

    const dx = enemy.x - originX
    const dy = enemy.y - originY
    const distanceSquared = dx * dx + dy * dy
    if (distanceSquared > nearestDistanceSquared) {
      continue
    }

    nearestDistanceSquared = distanceSquared
    nearestEnemy = enemy
  }

  return nearestEnemy
}

/**
 * 射程内で一番近い敵を選び、attackState.lockedTarget を更新する。
 * より近い敵が来たら、毎回そちらへ切り替える。
 */
function resolveAttackTarget(
  attackState: PlayerAttackState,
  enemyGroup: Phaser.Physics.Arcade.Group,
  playerX: number,
  playerY: number,
  attackRange: number,
): Phaser.GameObjects.Rectangle | null {
  const nearestEnemy = findNearestEnemyInRange(
    enemyGroup,
    playerX,
    playerY,
    attackRange,
  )
  attackState.lockedTarget = nearestEnemy
  return nearestEnemy
}

/**
 * クールダウンが空いていて狙える敵がいれば弾を撃つ。
 * 撃てたら true。クールダウン中・敵なし・弾生成失敗なら false。
 * GameScene.update から毎フレーム呼ばれる。
 */
export function tryFireBulletAtNearestEnemy(
  scene: Phaser.Scene,
  bulletGroup: Phaser.Physics.Arcade.Group,
  enemyGroup: Phaser.Physics.Arcade.Group,
  playerX: number,
  playerY: number,
  attackState: PlayerAttackState,
  attackIntervalMs: number,
  attackRange: number,
  attackDamage: number,
  bulletMaxHits: number,
  ricochetLevel: number,
  nowMs: number,
  bulletStyle: PlayerBulletStyle = 'windVortex',
): boolean {
  const elapsedSinceLastAttack = nowMs - attackState.lastAttackTimeMs
  // lastAttackTimeMs === 0 は「まだ一度も撃っていない」→ すぐ撃てる
  if (attackState.lastAttackTimeMs > 0 && elapsedSinceLastAttack < attackIntervalMs) {
    return false
  }

  const targetEnemy = resolveAttackTarget(
    attackState,
    enemyGroup,
    playerX,
    playerY,
    attackRange,
  )
  if (targetEnemy === null) {
    return false
  }

  const bullet = firePlayerBullet(
    scene,
    bulletGroup,
    playerX,
    playerY,
    targetEnemy.x,
    targetEnemy.y,
    attackDamage,
    bulletMaxHits,
    ricochetLevel,
    targetEnemy,
    bulletStyle,
  )

  if (bullet !== null) {
    attackState.lastAttackTimeMs = nowMs
    return true
  }

  return false
}

/**
 * 弾グループの毎フレーム更新。
 * 速度を維持し、プレイエリア外の弾を消す。
 */
export function updatePlayerBullets(bulletGroup: Phaser.Physics.Arcade.Group): void {
  maintainPlayerBulletVelocities(bulletGroup)
  removePlayerBulletsOutsidePlayArea(bulletGroup)
}

/**
 * 生存中の敵が 1 体でもいるか。
 * ステージクリア判定などで使う。
 */
export function hasAnyEnemyAlive(
  enemyGroup: Phaser.Physics.Arcade.Group,
): boolean {
  return countActiveEnemies(enemyGroup) > 0
}

/**
 * 撃破された敵がロック対象ならクリアする。
 * GameScene の撃破処理から呼ばれ、次フレームで新しい敵を狙えるようにする。
 */
export function clearLockedTargetIfEnemyDestroyed(
  attackState: PlayerAttackState,
  enemy: Phaser.GameObjects.Rectangle,
): void {
  if (attackState.lockedTarget === enemy) {
    attackState.lockedTarget = null
  }
}
