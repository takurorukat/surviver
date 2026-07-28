// ============================================================
// 射撃型敵の攻撃（プレイヤーへ弾を撃つ）
// ------------------------------------------------------------
// GameScene の毎フレーム更新から呼ばれる。
// 近接敵の接触ダメージはここではなく GameScene の overlap 側。
// 弾の生成・飛行は objects/EnemyBullet の fireEnemyBullet に任せる。
// プレイヤー攻撃レンジの外にいるときだけ撃つ（中にいるときは逃げる優先）。
// ============================================================

import Phaser from 'phaser'
import {
  ENEMY_EARTH_DUNGEON_BOSS_ROCK_ATTACK_INTERVAL_MS,
  ENEMY_EARTH_DUNGEON_BOSS_ROCK_BURST_COUNT,
  ENEMY_EARTH_DUNGEON_BOSS_ROCK_BURST_SPACING_MS,
  ENEMY_EARTH_ROCK_PEBBLE_INTERVAL_MS,
  ENEMY_RANGED_ATTACK_INTERVAL_MS,
} from '../GameConstants'
import { fireEnemyBullet, firePebbleEnemyBullet } from '../objects/EnemyBullet'
import {
  advanceEarthDungeonBossRockBurstAfterShot,
  shouldFireEarthDungeonBossRockShot,
  shouldStartEarthDungeonBossRockBurst,
} from './earthDungeonBossLogic'

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
    if (!enemy.active) {
      continue
    }
    if (enemy.getData('isDefeated') === true) {
      continue
    }
    if (enemy.getData('isRanged') !== true) {
      continue
    }

    let nextShotAtMs = enemy.getData('nextShotAtMs') as number
    if (typeof nextShotAtMs !== 'number') {
      nextShotAtMs = nowMs + ENEMY_RANGED_ATTACK_INTERVAL_MS
      enemy.setData('nextShotAtMs', nextShotAtMs)
    }

    if (nowMs < nextShotAtMs) {
      continue
    }

    const dx = playerX - enemy.x
    const dy = playerY - enemy.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance <= playerAttackRange) {
      continue
    }

    const bullet = fireEnemyBullet(
      scene,
      enemyBulletGroup,
      enemy.x,
      enemy.y,
      playerX,
      playerY,
    )

    if (bullet !== null) {
      enemy.setData('nextShotAtMs', nowMs + ENEMY_RANGED_ATTACK_INTERVAL_MS)
    }
  }
}

/**
 * Earth Dungeon Stage2 の岩敵: 約5秒ごとにプレイヤー現在位置へ小石弾を1発。
 */
export function updateEarthRockAttacks(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  enemyBulletGroup: Phaser.Physics.Arcade.Group,
  playerX: number,
  playerY: number,
  nowMs: number,
): void {
  const children = enemyGroup.getChildren()

  for (let index = 0; index < children.length; index++) {
    const enemy = children[index] as Phaser.GameObjects.Rectangle
    if (!enemy.active) {
      continue
    }
    if (enemy.getData('isDefeated') === true) {
      continue
    }
    if (enemy.getData('enemyKind') !== 'earthRock') {
      continue
    }

    let nextPebbleShotAtMs = enemy.getData('nextPebbleShotAtMs') as number
    if (typeof nextPebbleShotAtMs !== 'number') {
      nextPebbleShotAtMs = nowMs + ENEMY_EARTH_ROCK_PEBBLE_INTERVAL_MS
      enemy.setData('nextPebbleShotAtMs', nextPebbleShotAtMs)
    }

    if (nowMs < nextPebbleShotAtMs) {
      continue
    }

    const bullet = firePebbleEnemyBullet(
      scene,
      enemyBulletGroup,
      enemy.x,
      enemy.y,
      playerX,
      playerY,
    )

    if (bullet !== null) {
      enemy.setData(
        'nextPebbleShotAtMs',
        nowMs + ENEMY_EARTH_ROCK_PEBBLE_INTERVAL_MS,
      )
    }
  }
}

/**
 * Earth Dungeon Stage5 ボス: 5秒ごとに小石を5連射。
 * 各弾は発射瞬間のプレイヤー位置を狙い、その後は直進。
 * 1フレーム最大1発（pause復帰の catch-up を避ける）。
 * ボス死亡・非アクティブなら未発射分は自然に止まる。
 */
export function updateEarthDungeonBossRockBursts(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  enemyBulletGroup: Phaser.Physics.Arcade.Group,
  playerX: number,
  playerY: number,
  nowMs: number,
): void {
  const children = enemyGroup.getChildren()

  for (let index = 0; index < children.length; index++) {
    const boss = children[index] as Phaser.GameObjects.Rectangle
    if (!boss.active) {
      continue
    }
    if (boss.getData('isDefeated') === true) {
      continue
    }
    if (boss.getData('enemyKind') !== 'earthDungeonBoss') {
      continue
    }

    let nextBurstAtMs = boss.getData('nextEarthRockBurstAtMs') as number
    if (typeof nextBurstAtMs !== 'number') {
      nextBurstAtMs = nowMs + ENEMY_EARTH_DUNGEON_BOSS_ROCK_ATTACK_INTERVAL_MS
      boss.setData('nextEarthRockBurstAtMs', nextBurstAtMs)
    }

    let shotsRemaining = boss.getData('earthRockBurstShotsRemaining') as number
    if (typeof shotsRemaining !== 'number') {
      shotsRemaining = 0
      boss.setData('earthRockBurstShotsRemaining', 0)
    }

    let nextShotAtMs = boss.getData('nextEarthRockShotAtMs') as number
    if (typeof nextShotAtMs !== 'number') {
      nextShotAtMs = 0
      boss.setData('nextEarthRockShotAtMs', 0)
    }

    if (
      shouldStartEarthDungeonBossRockBurst({
        nowMs,
        nextBurstAtMs,
        shotsRemaining,
      })
    ) {
      shotsRemaining = ENEMY_EARTH_DUNGEON_BOSS_ROCK_BURST_COUNT
      nextShotAtMs = nowMs
      // 次周期は連射完了を待たず、開始時点から 5000ms 後
      boss.setData(
        'nextEarthRockBurstAtMs',
        nowMs + ENEMY_EARTH_DUNGEON_BOSS_ROCK_ATTACK_INTERVAL_MS,
      )
      boss.setData('earthRockBurstShotsRemaining', shotsRemaining)
      boss.setData('nextEarthRockShotAtMs', nextShotAtMs)
    }

    if (
      !shouldFireEarthDungeonBossRockShot({
        nowMs,
        nextShotAtMs,
        shotsRemaining,
      })
    ) {
      continue
    }

    const bullet = firePebbleEnemyBullet(
      scene,
      enemyBulletGroup,
      boss.x,
      boss.y,
      playerX,
      playerY,
    )

    if (bullet === null) {
      continue
    }

    const advanced = advanceEarthDungeonBossRockBurstAfterShot({
      nowMs,
      shotsRemainingBeforeShot: shotsRemaining,
      spacingMs: ENEMY_EARTH_DUNGEON_BOSS_ROCK_BURST_SPACING_MS,
    })
    boss.setData('earthRockBurstShotsRemaining', advanced.shotsRemaining)
    boss.setData('nextEarthRockShotAtMs', advanced.nextShotAtMs)
  }
}
