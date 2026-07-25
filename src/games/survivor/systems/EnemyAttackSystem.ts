// ============================================================
// 射撃型敵の攻撃（プレイヤーへ弾を撃つ）
// ------------------------------------------------------------
// GameScene の毎フレーム更新から呼ばれる。
// 近接敵の接触ダメージはここではなく GameScene の overlap 側。
// 弾の生成・飛行は objects/EnemyBullet の fireEnemyBullet に任せる。
// プレイヤー攻撃レンジの外にいるときだけ撃つ（中にいるときは逃げる優先）。
// ============================================================

import Phaser from 'phaser'
import { ENEMY_RANGED_ATTACK_INTERVAL_MS } from '../GameConstants'
import { fireEnemyBullet } from '../objects/EnemyBullet'

// 射撃型敵がプレイヤーへ弾を撃つ（グループ内の全敵を走査）
// 各敵の nextShotAtMs（次に撃ってよい時刻）を getData/setData で管理
export function updateEnemyRangedAttacks(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  enemyBulletGroup: Phaser.Physics.Arcade.Group,
  playerX: number,
  playerY: number,
  playerAttackRange: number,
  nowMs: number,
): void {
  const children = enemyGroup.getChildren()

  for (let index = 0; index < children.length; index++) {
    const enemy = children[index] as Phaser.GameObjects.Rectangle
    // 非アクティブ（プールに戻った等）はスキップ
    if (!enemy.active) {
      continue
    }
    // 撃破演出中の敵は撃たない
    if (enemy.getData('isDefeated') === true) {
      continue
    }
    // 近接敵は isRanged が false。射撃型だけ処理する
    if (enemy.getData('isRanged') !== true) {
      continue
    }

    // 初回は「今からインターバル後」をセットしてすぐ撃たないようにする
    let nextShotAtMs = enemy.getData('nextShotAtMs') as number
    if (typeof nextShotAtMs !== 'number') {
      nextShotAtMs = nowMs + ENEMY_RANGED_ATTACK_INTERVAL_MS
      enemy.setData('nextShotAtMs', nextShotAtMs)
    }

    // まだ発射時刻前なら何もしない
    if (nowMs < nextShotAtMs) {
      continue
    }

    const dx = playerX - enemy.x
    const dy = playerY - enemy.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // プレイヤー攻撃レンジ内では撃たない（外へ出てから撃つ）
    if (distance <= playerAttackRange) {
      continue
    }

    // 敵の位置からプレイヤーへ向けて弾を1発生成
    const bullet = fireEnemyBullet(
      scene,
      enemyBulletGroup,
      enemy.x,
      enemy.y,
      playerX,
      playerY,
    )

    // プールが満杯などで弾が出せなかったときは次回時刻を進めない
    // （次フレームで再試行できるようにする）
    if (bullet !== null) {
      enemy.setData('nextShotAtMs', nowMs + ENEMY_RANGED_ATTACK_INTERVAL_MS)
    }
  }
}
