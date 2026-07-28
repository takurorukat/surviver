/**
 * プレイヤー弾 ↔ 敵の命中判定・ダメージ・貫通・跳弾・爆破・XPドロップ。
 * GameScene の overlap コールバックから呼ぶ。
 */
import Phaser from 'phaser'
import {
  RICOCHET_SEARCH_RADIUS,
  ENEMY_SHIELD_FRONT_DOT_THRESHOLD,
  calculateXpCoinDropCount,
  calculatePierceHitDamage,
  calculateBlastRadius,
  calculateBlastDamage,
} from '../GameConstants'
import {
  applyDamageToEnemy,
  playEnemyDefeatFadeOut,
} from '../objects/Enemy'
import {
  findNearestUnhitEnemyInRange,
  clearLockedTargetIfEnemyDestroyed,
  type PlayerAttackState,
} from './PlayerAttackSystem'
import {
  redirectPlayerBulletToward,
  recyclePlayerBullet,
  type PlayerBulletVisual,
  type PlayerBulletStyle,
} from '../objects/PlayerBullet'
import { trySpawnCoinAt } from '../objects/Coin'
import { getEnemyXpDropMultiplier } from './EnemySummonSystem'
import {
  applyHitBlastAroundPoint,
  playHitBlastRing,
} from './HitBlastSystem'
import {
  playDamageNumber,
  playWindSlashHit,
  playEnergyOrbHit,
  playWaterOrbHit,
  playEnemyBlockedShield,
} from './CombatFeedbackSystem'
import { recordEnemyDefeated } from './UnlockSaveSystem'

/** GameScene から渡す命中処理用の文脈（複雑なジェネリクスは使わない） */
export type PlayerBulletCombatContext = {
  scene: Phaser.Scene
  playerX: number
  playerY: number
  enemyGroup: Phaser.Physics.Arcade.Group
  coinGroup: Phaser.Physics.Arcade.Group
  attackState: PlayerAttackState
  currentBlastLevel: number
  currentXpBonusLevel: number
  isLevelUpPaused: boolean
  isResumeCountdownActive: boolean
  playEnemyBlocked: () => void
  playBulletHit: (bulletStyle: PlayerBulletStyle) => void
  playEnemyDefeat: () => void
}

/**
 * overlap の processCallback。貫通上限・同一敵への二重ヒットを命中前に弾く。
 */
export function canPlayerBulletHitEnemy(
  bullet: PlayerBulletVisual,
  enemy: Phaser.GameObjects.Rectangle,
): boolean {
  if (!bullet.active || !enemy.active) {
    return false
  }
  if (enemy.getData('isDefeated') === true) {
    return false
  }

  const hitsLeft = bullet.getData('hitsLeft') as number
  if (typeof hitsLeft !== 'number' || hitsLeft <= 0) {
    return false
  }

  const enemyUid = enemy.getData('enemyUid') as number
  if (typeof enemyUid !== 'number') {
    return true
  }

  const hitEnemyUidsRaw = bullet.getData('hitEnemyUids')
  if (!Array.isArray(hitEnemyUidsRaw)) {
    return true
  }

  // すでに命中した敵 UID なら false（同じ敵に何度も当たらない）
  for (let index = 0; index < hitEnemyUidsRaw.length; index++) {
    if (hitEnemyUidsRaw[index] === enemyUid) {
      return false
    }
  }

  return true
}

/**
 * 特殊敵の防御条件を満たしているか判定する。
 */
export function canBulletDamageSpecialEnemy(
  ctx: PlayerBulletCombatContext,
  bullet: PlayerBulletVisual,
  enemy: Phaser.GameObjects.Rectangle,
  bulletDamage: number,
): boolean {
  const enemyKind = enemy.getData('enemyKind') as string

  if (enemyKind === 'armored') {
    const minimumDamage = enemy.getData('minimumDamage') as number
    return typeof minimumDamage !== 'number' || bulletDamage >= minimumDamage
  }

  if (enemyKind !== 'shielded') {
    return true
  }

  const flightVx = bullet.getData('flightVx') as number
  const flightVy = bullet.getData('flightVy') as number
  if (typeof flightVx !== 'number' || typeof flightVy !== 'number') {
    return false
  }

  // 盾敵の正面は常にプレイヤー方向。弾の進行方向との内積で正面攻撃を判定する
  const frontX = ctx.playerX - enemy.x
  const frontY = ctx.playerY - enemy.y
  const frontLength = Math.sqrt(frontX * frontX + frontY * frontY)
  const flightLength = Math.sqrt(flightVx * flightVx + flightVy * flightVy)
  if (frontLength <= 0 || flightLength <= 0) {
    return false
  }

  const dot =
    (flightVx / flightLength) * (frontX / frontLength) +
    (flightVy / flightLength) * (frontY / frontLength)
  return dot > ENEMY_SHIELD_FRONT_DOT_THRESHOLD
}

/**
 * プレイヤー弾が敵に当たったときのダメージ・撃破・爆破・貫通処理。
 */
export function handleBulletEnemyHit(
  ctx: PlayerBulletCombatContext,
  bullet: PlayerBulletVisual,
  enemy: Phaser.GameObjects.Rectangle,
): void {
  if (!bullet.active || !enemy.active || ctx.isLevelUpPaused || ctx.isResumeCountdownActive) {
    return
  }

  // 弾の生成フレームは無視（発射瞬間の誤ヒット・撃破音防止）
  const collisionAge = bullet.getData('collisionAge') as number
  if (typeof collisionAge !== 'number' || collisionAge < 1) {
    return
  }

  // 弾と敵が入れ替わって渡された場合に備える（damage / hp の型で確認）
  const originalDamage = bullet.getData('damage')
  const enemyHp = enemy.getData('hp')
  if (typeof originalDamage !== 'number' || typeof enemyHp !== 'number') {
    return
  }

  // すでに倒れた敵には音もダメージも出さない
  if (enemy.getData('isDefeated') === true || enemyHp <= 0) {
    return
  }

  const hitEnemyUidsRaw = bullet.getData('hitEnemyUids')
  const hitEnemyUids: number[] = Array.isArray(hitEnemyUidsRaw)
    ? (hitEnemyUidsRaw as number[])
    : []
  const effectiveDamage = calculatePierceHitDamage(
    originalDamage,
    hitEnemyUids.length,
  )

  // 灰騎士など: 残りブロック回数があればダメージなし（シールドマーク）
  const remainingBlockHits = enemy.getData('remainingBlockHits') as number
  if (typeof remainingBlockHits === 'number' && remainingBlockHits > 0) {
    enemy.setData('remainingBlockHits', remainingBlockHits - 1)
    playDamageNumber(ctx.scene, enemy.x, enemy.y - 8, 0)
    playEnemyBlockedShield(ctx.scene, enemy)
    ctx.playEnemyBlocked()
    recyclePlayerBullet(bullet)
    return
  }

  // 装甲不足または盾の正面からの攻撃は、0ダメージで弾を消す
  if (!canBulletDamageSpecialEnemy(ctx, bullet, enemy, effectiveDamage)) {
    playDamageNumber(ctx.scene, enemy.x, enemy.y - 8, 0)
    playEnemyBlockedShield(ctx.scene, enemy)
    ctx.playEnemyBlocked()
    recyclePlayerBullet(bullet)
    return
  }

  // 命中済み UID を記録（同じ敵への再ヒット防止）
  const enemyUid = enemy.getData('enemyUid') as number
  if (typeof enemyUid === 'number') {
    hitEnemyUids.push(enemyUid)
    bullet.setData('hitEnemyUids', hitEnemyUids)
  }

  // 残り命中を1減らす。0 になったらこの敵が最後（2体目 / 3体目 …）
  let hitsLeft = bullet.getData('hitsLeft') as number
  if (typeof hitsLeft !== 'number') {
    hitsLeft = 1
  }
  hitsLeft = hitsLeft - 1
  bullet.setData('hitsLeft', hitsLeft)

  const enemyX = enemy.x
  const enemyY = enemy.y
  const isDead = applyDamageToEnemy(enemy, effectiveDamage)

  // ダメージ数字をぴょんと飛ばす（撃破時も表示）
  playDamageNumber(ctx.scene, enemyX, enemyY - 8, effectiveDamage)

  // 弾の種類でヒット演出と音を分ける
  // Power 命中音は GameAudioSystem.playBulletHit → skill.power.impact
  // （Pierce/Ricochet 後続も当面同じ。将来 Event 分離可能）
  const bulletStyle = bullet.getData('bulletStyle') as string
  if (bulletStyle === 'powerOrb') {
    playEnergyOrbHit(ctx.scene, enemyX, enemyY, originalDamage)
    ctx.playBulletHit('powerOrb')
  } else if (bulletStyle === 'waterOrb') {
    playWaterOrbHit(ctx.scene, enemyX, enemyY, originalDamage)
    ctx.playBulletHit('waterOrb')
  } else if (bulletStyle === 'fireOrb') {
    playEnergyOrbHit(ctx.scene, enemyX, enemyY, originalDamage)
    ctx.playBulletHit('fireOrb')
  } else if (bulletStyle === 'earthOrb') {
    playEnergyOrbHit(ctx.scene, enemyX, enemyY, originalDamage)
    ctx.playBulletHit('earthOrb')
  } else {
    const slashDirX = bullet.getData('flightVx') as number
    const slashDirY = bullet.getData('flightVy') as number
    playWindSlashHit(ctx.scene, enemyX, enemyY, slashDirX, slashDirY, originalDamage)
    ctx.playBulletHit('windVortex')
  }
  // 当たった敵へのホーミングは解除（貫通後に戻ってこないようにする）
  bullet.setData('homingTarget', null)

  if (isDead) {
    recordEnemyDefeated()
    clearLockedTargetIfEnemyDestroyed(ctx.attackState, enemy)
    const xpDropMultiplier = getEnemyXpDropMultiplier(enemy)
    ctx.playEnemyDefeat()
    playEnemyDefeatFadeOut(ctx.scene, enemy, () => {
      spawnExperienceCoinsAt(ctx, enemyX, enemyY, xpDropMultiplier)
    })
  }

  // 範囲爆破スキル: 命中瞬間に周囲へ円ダメージ（本体は除外）
  applyHitBlastIfUnlocked(ctx, enemy, enemyX, enemyY, effectiveDamage)

  // 跳弾スキル: 命中済みではない最寄り敵へ向きを変える
  if (hitsLeft > 0 && tryRicochetBullet(ctx, bullet, hitEnemyUids, enemyX, enemyY)) {
    return
  }

  // 命中上限に達したら弾を消す（1回目の貫通取得なら2体目で消滅）
  if (hitsLeft <= 0) {
    recyclePlayerBullet(bullet)
    return
  }

  // 貫通後も飛行速度を維持する（overlap で速度が乱れることがあるため再設定）
  const flightVx = bullet.getData('flightVx') as number
  const flightVy = bullet.getData('flightVy') as number
  if (
    bullet.body !== null &&
    typeof flightVx === 'number' &&
    typeof flightVy === 'number'
  ) {
    const body = bullet.body as Phaser.Physics.Arcade.Body
    body.setVelocity(flightVx, flightVy)
  }
}

/**
 * 残り跳弾回数があれば、命中点から最寄りの未命中敵へ弾を向け直す。
 */
function tryRicochetBullet(
  ctx: PlayerBulletCombatContext,
  bullet: PlayerBulletVisual,
  hitEnemyUids: number[],
  hitX: number,
  hitY: number,
): boolean {
  let ricochetsLeft = bullet.getData('ricochetsLeft') as number
  if (typeof ricochetsLeft !== 'number' || ricochetsLeft <= 0) {
    return false
  }

  const nextEnemy = findNearestUnhitEnemyInRange(
    ctx.enemyGroup,
    hitX,
    hitY,
    RICOCHET_SEARCH_RADIUS,
    hitEnemyUids,
  )
  if (nextEnemy === null) {
    return false
  }

  const didRedirect = redirectPlayerBulletToward(
    bullet,
    nextEnemy.x,
    nextEnemy.y,
    nextEnemy,
  )
  if (!didRedirect) {
    return false
  }

  ricochetsLeft = ricochetsLeft - 1
  bullet.setData('ricochetsLeft', ricochetsLeft)
  return true
}

/**
 * 爆破レベルがあれば、命中点の周囲の敵にダメージを与える。
 */
function applyHitBlastIfUnlocked(
  ctx: PlayerBulletCombatContext,
  hitEnemy: Phaser.GameObjects.Rectangle,
  centerX: number,
  centerY: number,
  bulletDamage: number,
): void {
  const blastRadius = calculateBlastRadius(ctx.currentBlastLevel)
  const blastDamage = calculateBlastDamage(ctx.currentBlastLevel, bulletDamage)
  if (blastRadius <= 0 || blastDamage <= 0) {
    return
  }

  playHitBlastRing(ctx.scene, centerX, centerY, blastRadius)
  const blastResult = applyHitBlastAroundPoint(
    ctx.enemyGroup,
    centerX,
    centerY,
    blastRadius,
    blastDamage,
    hitEnemy,
  )

  for (let index = 0; index < blastResult.damagedEnemies.length; index++) {
    const damaged = blastResult.damagedEnemies[index]
    playDamageNumber(ctx.scene, damaged.x, damaged.y - 8, damaged.damage)
    if (!damaged.isDead) {
      continue
    }
    recordEnemyDefeated()
    clearLockedTargetIfEnemyDestroyed(ctx.attackState, damaged.enemy)
    const xpDropMultiplier = getEnemyXpDropMultiplier(damaged.enemy)
    ctx.playEnemyDefeat()
    playEnemyDefeatFadeOut(ctx.scene, damaged.enemy, () => {
      spawnExperienceCoinsAt(ctx, damaged.x, damaged.y, xpDropMultiplier)
    })
  }
}

/**
 * XP Bonusのレベルに応じた枚数の「1 XPコイン」を敵の周囲へ落とす。
 */
export function spawnExperienceCoinsAt(
  ctx: PlayerBulletCombatContext,
  enemyX: number,
  enemyY: number,
  xpDropMultiplier: number = 1,
): void {
  const safeMultiplier = Math.max(1, Math.floor(xpDropMultiplier))
  const baseCoinCount = calculateXpCoinDropCount(ctx.currentXpBonusLevel)
  const coinCount = baseCoinCount * safeMultiplier
  const spreadRadius = coinCount > 1 ? 8 : 0

  for (let index = 0; index < coinCount; index++) {
    const angle = (Math.PI * 2 * index) / coinCount
    const coinX = enemyX + Math.cos(angle) * spreadRadius
    const coinY = enemyY + Math.sin(angle) * spreadRadius
    trySpawnCoinAt(ctx.scene, ctx.coinGroup, coinX, coinY)
  }
}
