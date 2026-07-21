// ============================================================
// HitBlastSystem.ts
// ------------------------------------------------------------
// プレイヤー弾が敵に当たったときの「範囲爆破」ダメージと円リング演出。
//
// 役割:
//   - 命中地点の周囲の敵にダメージを与える（当たった本体は除外）
//   - 爆破半径の見た目リングを tween で広げる
//
// 呼び出し元:
//   - GameScene.ts … 弾ヒット時 applyHitBlastIfUnlocked から
//                     applyHitBlastAroundPoint / playHitBlastRing
//
// 関連ファイル:
//   - objects/Enemy.ts … applyDamageToEnemy（実ダメージ）
//   - LevelUpChoiceSystem.ts … blastLevel を上げると半径が大きくなる
//   - GameConstants.ts … リング色・時間・開始半径
//
// 注意: 弾と敵の当たり判定自体は physics.overlap（GameScene）。
//       ここは「命中後の追加範囲ダメージ」だけ。
// ============================================================

import Phaser from 'phaser'
import {
  BLAST_RING_COLOR,
  BLAST_RING_STROKE_COLOR,
  BLAST_RING_DURATION_MS,
  BLAST_RING_START_RADIUS,
  BLAST_RING_DEPTH,
} from '../GameConstants'
import { applyDamageToEnemy, getEnemyBlastDamageMultiplier } from '../objects/Enemy'

// 爆破で倒した敵 1 体分（コイン等の後処理用に座標も残す）
export type HitBlastKill = {
  enemy: Phaser.GameObjects.Rectangle
  x: number
  y: number
  damage: number
}

export type HitBlastDamageResult = {
  killedEnemies: HitBlastKill[]
  damagedEnemyCount: number
}

/**
 * 弾が当たった位置の周りに円形ダメージ（当たった本体は除外）。
 * radius <= 0 なら何もしない。
 * 戻り値にはダメージが通った敵の数と、倒した敵の一覧を含む。
 */
export function applyHitBlastAroundPoint(
  enemyGroup: Phaser.Physics.Arcade.Group,
  centerX: number,
  centerY: number,
  radius: number,
  damage: number,
  excludeEnemy?: Phaser.GameObjects.Rectangle,
): HitBlastDamageResult {
  const killedEnemies: HitBlastKill[] = []
  let damagedEnemyCount = 0
  if (radius <= 0) {
    return { killedEnemies, damagedEnemyCount }
  }

  const children = enemyGroup.getChildren()
  for (let index = 0; index < children.length; index++) {
    const enemy = children[index] as Phaser.GameObjects.Rectangle
    if (!enemy.active) {
      continue
    }
    // 直撃した敵は弾側で既にダメージ済みなので二重にしない
    if (enemy === excludeEnemy) {
      continue
    }
    if (enemy.getData('isDefeated') === true) {
      continue
    }

    const dx = enemy.x - centerX
    const dy = enemy.y - centerY
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance > radius) {
      continue
    }

    // 倒した瞬間に座標が変わる可能性があるので、先に控える
    const enemyX = enemy.x
    const enemyY = enemy.y
    const blastMultiplier = getEnemyBlastDamageMultiplier(enemy)
    const effectiveDamage = damage * blastMultiplier
    const isDead = applyDamageToEnemy(enemy, effectiveDamage)
    damagedEnemyCount = damagedEnemyCount + 1
    if (isDead) {
      killedEnemies.push({ enemy, x: enemyX, y: enemyY, damage: effectiveDamage })
    }
  }

  return { killedEnemies, damagedEnemyCount }
}

/**
 * 爆破の円リング演出。
 * 小さい円から半径まで拡大しつつ透明にして消す。
 */
export function playHitBlastRing(
  scene: Phaser.Scene,
  centerX: number,
  centerY: number,
  radius: number,
): void {
  if (radius <= 0) {
    return
  }

  const ring = scene.add.circle(
    centerX,
    centerY,
    BLAST_RING_START_RADIUS,
    BLAST_RING_COLOR,
    0.35,
  )
  ring.setStrokeStyle(3, BLAST_RING_STROKE_COLOR, 0.95)
  ring.setDepth(BLAST_RING_DEPTH)

  // scale で見た目半径を合わせる（開始半径 → 目標半径）
  const endScale = radius / BLAST_RING_START_RADIUS
  scene.tweens.add({
    targets: ring,
    scaleX: endScale,
    scaleY: endScale,
    alpha: 0,
    duration: BLAST_RING_DURATION_MS,
    ease: 'Quad.Out',
    onComplete: () => {
      if (ring.active) {
        ring.destroy()
      }
    },
  })
}
