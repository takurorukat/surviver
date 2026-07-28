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
  ENEMY_BULLET_SPEED,
  ENEMY_EARTH_DUNGEON_BOSS_ROCK_ATTACK_INTERVAL_MS,
  ENEMY_EARTH_DUNGEON_BOSS_ROCK_BURST_COUNT,
  ENEMY_EARTH_DUNGEON_BOSS_ROCK_BURST_SPACING_MS,
  ENEMY_EARTH_MAGMA_ROCK_ATTACK_INTERVAL_MS,
  ENEMY_EARTH_MAGMA_ROCK_ATTACK_SWELL_SCALE,
  ENEMY_EARTH_MAGMA_ROCK_PEBBLE_SPEED_FACTOR,
  ENEMY_EARTH_MAGMA_ROCK_RADIAL_COUNT,
  ENEMY_EARTH_MAGMA_ROCK_WINDUP_MS,
  ENEMY_EARTH_ROCK_PEBBLE_INTERVAL_MS,
  ENEMY_RANGED_ATTACK_INTERVAL_MS,
  ENEMY_WIND_HIVE_BOSS_WIND_ORB_INTERVAL_MS,
} from '../GameConstants'
import {
  fireEnemyBullet,
  firePebbleEnemyBullet,
  firePebbleEnemyBulletInDirection,
  fireWindOrbEnemyBullet,
} from '../objects/EnemyBullet'
import { enemyBreathingSpriteMap } from '../objects/enemy/enemyInternal'
import {
  advanceEarthDungeonBossRockBurstAfterShot,
  shouldFireEarthDungeonBossRockShot,
  shouldStartEarthDungeonBossRockBurst,
} from './earthDungeonBossLogic'
import {
  advanceWindHiveBossWindOrbShotAtMs,
  shouldFireWindHiveBossWindOrb,
} from './windHiveBossLogic'

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
 * Wind Plains Stage3 ボス: 2秒ごとに Hero 現在位置へ風の玉を1発。
 * 出現直後は撃たず、初弾は出現から 2000ms 後。発射後は直進。
 * Pause / Level Up 中は GameScene 側でこの更新自体が止まると時間も進まない。
 */
export function updateWindHiveBossWindOrbAttacks(
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
    if (boss.getData('enemyKind') !== 'windHiveBoss') {
      continue
    }

    let nextWindOrbShotAtMs = boss.getData('nextWindOrbShotAtMs') as number
    if (typeof nextWindOrbShotAtMs !== 'number') {
      nextWindOrbShotAtMs = nowMs + ENEMY_WIND_HIVE_BOSS_WIND_ORB_INTERVAL_MS
      boss.setData('nextWindOrbShotAtMs', nextWindOrbShotAtMs)
    }

    if (
      !shouldFireWindHiveBossWindOrb({
        nowMs,
        nextShotAtMs: nextWindOrbShotAtMs,
      })
    ) {
      continue
    }

    const bullet = fireWindOrbEnemyBullet(
      scene,
      enemyBulletGroup,
      boss.x,
      boss.y,
      playerX,
      playerY,
    )

    if (bullet !== null) {
      boss.setData(
        'nextWindOrbShotAtMs',
        advanceWindHiveBossWindOrbShotAtMs(nowMs),
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

/**
 * Earth Dungeon Stage4 マグマ岩: 5秒周期で停止→0.7秒膨らみ予兆→6方向小石放射。
 * 弾はプレイヤー狙いではなく固定角度（0°から60°刻み）。
 */
export function updateEarthMagmaRockAttacks(
  scene: Phaser.Scene,
  enemyGroup: Phaser.Physics.Arcade.Group,
  enemyBulletGroup: Phaser.Physics.Arcade.Group,
  nowMs: number,
): void {
  const children = enemyGroup.getChildren()
  const pebbleSpeed = ENEMY_BULLET_SPEED * ENEMY_EARTH_MAGMA_ROCK_PEBBLE_SPEED_FACTOR

  for (let index = 0; index < children.length; index++) {
    const enemy = children[index] as Phaser.GameObjects.Rectangle
    if (!enemy.active) {
      continue
    }
    if (enemy.getData('isDefeated') === true) {
      continue
    }
    if (enemy.getData('enemyKind') !== 'earthMagmaRock') {
      continue
    }

    let nextAttackAtMs = enemy.getData('nextMagmaRadialAtMs') as number
    if (typeof nextAttackAtMs !== 'number') {
      nextAttackAtMs = nowMs + ENEMY_EARTH_MAGMA_ROCK_ATTACK_INTERVAL_MS
      enemy.setData('nextMagmaRadialAtMs', nextAttackAtMs)
    }

    const windupEndsAtMs = enemy.getData('magmaWindupEndsAtMs') as number
    const isWindingUp = typeof windupEndsAtMs === 'number' && windupEndsAtMs > 0

    if (isWindingUp) {
      if (nowMs < windupEndsAtMs) {
        continue
      }
      // 予兆終了 → 6方向放射
      fireMagmaRockRadialPebbles(scene, enemyBulletGroup, enemy.x, enemy.y, pebbleSpeed)
      enemy.setData('magmaWindupEndsAtMs', 0)
      enemy.setData('isMagmaAttackWindup', false)
      enemy.setData(
        'nextMagmaRadialAtMs',
        nowMs + ENEMY_EARTH_MAGMA_ROCK_ATTACK_INTERVAL_MS,
      )
      const breathing = enemyBreathingSpriteMap.get(enemy)
      if (breathing !== undefined) {
        breathing.setAttackSwellActive(false, ENEMY_EARTH_MAGMA_ROCK_ATTACK_SWELL_SCALE)
      }
      continue
    }

    if (nowMs < nextAttackAtMs) {
      continue
    }

    // 予兆開始（停止＋膨らみ）
    enemy.setData('isMagmaAttackWindup', true)
    enemy.setData('magmaWindupEndsAtMs', nowMs + ENEMY_EARTH_MAGMA_ROCK_WINDUP_MS)
    // 次周期は放射後に設定する（予兆中に再トリガしないよう先送り）
    enemy.setData('nextMagmaRadialAtMs', Number.POSITIVE_INFINITY)
    const breathing = enemyBreathingSpriteMap.get(enemy)
    if (breathing !== undefined) {
      breathing.setAttackSwellActive(true, ENEMY_EARTH_MAGMA_ROCK_ATTACK_SWELL_SCALE)
    }
  }
}

function fireMagmaRockRadialPebbles(
  scene: Phaser.Scene,
  enemyBulletGroup: Phaser.Physics.Arcade.Group,
  originX: number,
  originY: number,
  pebbleSpeed: number,
): void {
  for (let shotIndex = 0; shotIndex < ENEMY_EARTH_MAGMA_ROCK_RADIAL_COUNT; shotIndex++) {
    const angle = (Math.PI * 2 * shotIndex) / ENEMY_EARTH_MAGMA_ROCK_RADIAL_COUNT
    const directionX = Math.cos(angle)
    const directionY = Math.sin(angle)
    firePebbleEnemyBulletInDirection(
      scene,
      enemyBulletGroup,
      originX,
      originY,
      directionX,
      directionY,
      pebbleSpeed,
    )
  }
}
