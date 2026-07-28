// ============================================================
// OrbitingOrbSystem.ts
// ------------------------------------------------------------
// Move + Pickup から同期される複合スキル「Orbiting Orb」。
// プレイヤー周囲を回る氷 Orb を管理し、接触した敵へダメージを与え、
// 破壊可能な敵弾を消滅させる。
// ============================================================

import Phaser from 'phaser'
import {
  ORBITING_ORB_DEPTH,
  ORBITING_ORB_HIT_COOLDOWN_MS,
  ORBITING_ORB_HITBOX_RADIUS,
  ORBITING_ORB_LEVEL_START,
  ORBITING_ORB_TEXTURE_KEY,
  ORBITING_ORB_TEXTURE_SIZE,
  calculateOrbitingOrbDamage,
  calculateOrbitingOrbPositions,
  canOrbitingOrbHitEnemy,
  getOrbitingOrbStatsForLevel,
  pruneOrbitingOrbHitHistory,
} from '../GameConstants'
import {
  applyDamageToEnemy,
  getEnemyXpDropMultiplier,
  playEnemyDefeatFadeOut,
} from '../objects/Enemy'
import {
  isDestructibleEnemyBullet,
  recycleEnemyBullet,
  type EnemyBulletVisual,
} from '../objects/EnemyBullet'
import { setupCircleHitbox } from '../utils/setupCircleHitbox'
import { applyDevEntityDepth } from '../utils/applyDevEntityDepth'
import { playDamageNumber } from './CombatFeedbackSystem'
import { clearLockedTargetIfEnemyDestroyed } from './PlayerAttackSystem'
import { spawnExperienceCoinsAt } from './PlayerBulletCombatSystem'
import type { PlayerBulletCombatContext } from './PlayerBulletCombatSystem'
import { recordEnemyDefeated } from './UnlockSaveSystem'

export type OrbitingOrbAudioHooks = {
  playObtain: () => void
  playHit: () => void
  playShatter: () => void
}

/**
 * Graphics で Orbiting Orb（氷）テクスチャを1回だけ生成する。
 */
export function ensureOrbitingOrbTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(ORBITING_ORB_TEXTURE_KEY)) {
    return
  }

  const size = ORBITING_ORB_TEXTURE_SIZE
  const center = size / 2
  const graphics = scene.make.graphics({ x: 0, y: 0 })

  // 薄い氷の外縁（明るい水色）
  graphics.lineStyle(2, 0xbae6fd, 0.95)
  graphics.strokeCircle(center, center, center - 1)

  // 半透明の氷本体
  graphics.fillStyle(0x7dd3fc, 0.92)
  graphics.fillCircle(center, center, center - 2.5)

  // 内側の冷たい青核
  graphics.fillStyle(0x38bdf8, 1)
  graphics.fillCircle(center, center, center - 5)

  // 白い氷の中心
  graphics.fillStyle(0xf0f9ff, 1)
  graphics.fillCircle(center, center, 3.4)

  // 斜め上の氷ハイライト
  graphics.fillStyle(0xffffff, 0.95)
  graphics.fillCircle(center - 2.6, center - 3.2, 1.7)

  // 小さな霜の粒
  graphics.fillStyle(0xe0f2fe, 0.9)
  graphics.fillCircle(center + 3.5, center + 1.5, 1.1)

  graphics.generateTexture(ORBITING_ORB_TEXTURE_KEY, size, size)
  graphics.destroy()
}

export class OrbitingOrbSystem {
  private scene: Phaser.Scene
  private orbGroup: Phaser.Physics.Arcade.Group
  private orbs: Phaser.Physics.Arcade.Image[] = []
  private level = ORBITING_ORB_LEVEL_START
  private angleRadians = 0
  private hitHistory = new Map<number, number>()
  private enemyOverlapCollider: Phaser.Physics.Arcade.Collider | null = null
  private enemyBulletOverlapCollider: Phaser.Physics.Arcade.Collider | null = null
  private combatContext: PlayerBulletCombatContext | null = null
  private attackDamage = 1
  private hitFrameUids = new Set<number>()
  private audioHooks: OrbitingOrbAudioHooks | null = null

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    ensureOrbitingOrbTexture(scene)
    this.orbGroup = scene.physics.add.group()
  }

  /** 氷SFX再生フックを登録する（GameAudioSystem から渡す）。 */
  setAudioHooks(hooks: OrbitingOrbAudioHooks): void {
    this.audioHooks = hooks
  }

  /** 敵グループとの overlap を1回だけ登録する。 */
  setupOverlap(enemyGroup: Phaser.Physics.Arcade.Group): void {
    if (this.enemyOverlapCollider !== null) {
      return
    }
    this.enemyOverlapCollider = this.scene.physics.add.overlap(
      this.orbGroup,
      enemyGroup,
      (orbObject, enemyObject) => {
        this.handleOrbEnemyOverlap(
          orbObject as Phaser.Physics.Arcade.Image,
          enemyObject as Phaser.GameObjects.Rectangle,
        )
      },
    )
  }

  /** 敵弾グループとの overlap を1回だけ登録する（破壊可能弾を消滅）。 */
  setupEnemyBulletOverlap(enemyBulletGroup: Phaser.Physics.Arcade.Group): void {
    if (this.enemyBulletOverlapCollider !== null) {
      return
    }
    this.enemyBulletOverlapCollider = this.scene.physics.add.overlap(
      this.orbGroup,
      enemyBulletGroup,
      (_orbObject, bulletObject) => {
        this.handleOrbEnemyBulletOverlap(bulletObject as EnemyBulletVisual)
      },
    )
  }

  setCombatContext(context: PlayerBulletCombatContext): void {
    this.combatContext = context
  }

  setAttackDamage(attackDamage: number): void {
    this.attackDamage = Math.max(1, Math.floor(attackDamage))
  }

  getLevel(): number {
    return this.level
  }

  getOrbCount(): number {
    return this.orbs.length
  }

  getOrbPositions(): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = []
    for (let index = 0; index < this.orbs.length; index++) {
      const orb = this.orbs[index]
      positions.push({ x: orb.x, y: orb.y })
    }
    return positions
  }

  /** ステージ開始時などにヒット履歴を空にする。 */
  resetHitHistory(): void {
    this.hitHistory.clear()
  }

  /**
   * 素材同期後のレベルを反映する。
   * 個数が変わる場合は Orb を作り直す（古い Orb は破棄）。
   * 角速度は update で毎回 getOrbitingOrbStatsForLevel から読むため、
   * 個数が同じでも次フレームから新速度になる。角度はリセットしない。
   */
  syncLevel(orbitingOrbLevel: number): void {
    const safeLevel = Math.max(ORBITING_ORB_LEVEL_START, Math.floor(orbitingOrbLevel))
    const previousCount = this.orbs.length
    const nextStats = getOrbitingOrbStatsForLevel(safeLevel)
    this.level = safeLevel

    if (nextStats.orbCount === previousCount) {
      return
    }

    this.destroyOrbsOnly()
    for (let index = 0; index < nextStats.orbCount; index++) {
      this.orbs.push(this.createOrb())
    }
  }

  /**
   * 1フレーム分の回転と位置更新。
   * overlap は物理ステップ内で発火するため、ここは位置同期が主。
   */
  update(
    playerX: number,
    playerY: number,
    deltaSeconds: number,
    enemyGroup: Phaser.Physics.Arcade.Group,
    _nowMs: number,
  ): void {
    this.hitFrameUids.clear()

    if (this.level <= ORBITING_ORB_LEVEL_START) {
      this.pruneHitHistory(enemyGroup)
      return
    }

    const stats = getOrbitingOrbStatsForLevel(this.level)
    this.angleRadians = this.angleRadians + stats.angularSpeed * deltaSeconds
    const positions = calculateOrbitingOrbPositions(
      playerX,
      playerY,
      stats.orbCount,
      stats.radius,
      this.angleRadians,
    )

    for (let index = 0; index < this.orbs.length; index++) {
      const orb = this.orbs[index]
      const position = positions[index]
      if (position === undefined) {
        continue
      }
      orb.setPosition(position.x, position.y)
      const body = orb.body as Phaser.Physics.Arcade.Body | null
      if (body !== null) {
        body.reset(position.x, position.y)
      }
    }

    this.pruneHitHistory(enemyGroup)
  }

  /** プレイヤー死亡・クリア・シーン終了時にすべて破棄する。 */
  destroy(): void {
    this.destroyOrbsOnly()
    this.hitHistory.clear()
    this.combatContext = null
    this.audioHooks = null
    if (this.enemyOverlapCollider !== null) {
      this.enemyOverlapCollider.destroy()
      this.enemyOverlapCollider = null
    }
    if (this.enemyBulletOverlapCollider !== null) {
      this.enemyBulletOverlapCollider.destroy()
      this.enemyBulletOverlapCollider = null
    }
    if (this.orbGroup !== null) {
      this.orbGroup.destroy(true)
      this.orbGroup = null as unknown as Phaser.Physics.Arcade.Group
    }
    this.level = ORBITING_ORB_LEVEL_START
  }

  private createOrb(): Phaser.Physics.Arcade.Image {
    ensureOrbitingOrbTexture(this.scene)
    const orb = this.scene.physics.add.image(0, 0, ORBITING_ORB_TEXTURE_KEY)
    orb.setDepth(ORBITING_ORB_DEPTH)
    applyDevEntityDepth(orb)
    this.orbGroup.add(orb)
    const body = orb.body as Phaser.Physics.Arcade.Body
    setupCircleHitbox(
      body,
      ORBITING_ORB_HITBOX_RADIUS,
      ORBITING_ORB_TEXTURE_SIZE,
      ORBITING_ORB_TEXTURE_SIZE,
    )
    body.moves = false
    body.setAllowGravity(false)
    return orb
  }

  private destroyOrbsOnly(): void {
    for (let index = 0; index < this.orbs.length; index++) {
      if (this.orbs[index].active) {
        this.orbs[index].destroy()
      }
    }
    this.orbs = []
    if (this.orbGroup !== null) {
      this.orbGroup.clear(true, true)
    }
  }

  private pruneHitHistory(enemyGroup: Phaser.Physics.Arcade.Group): void {
    const activeUids = new Set<number>()
    const children = enemyGroup.getChildren()
    for (let index = 0; index < children.length; index++) {
      const enemy = children[index] as Phaser.GameObjects.Rectangle
      if (!enemy.active || enemy.getData('isDefeated') === true) {
        continue
      }
      const enemyUid = enemy.getData('enemyUid') as number
      if (typeof enemyUid === 'number') {
        activeUids.add(enemyUid)
      }
    }
    pruneOrbitingOrbHitHistory(this.hitHistory, activeUids)
  }

  private handleOrbEnemyBulletOverlap(bullet: EnemyBulletVisual): void {
    if (this.level <= ORBITING_ORB_LEVEL_START) {
      return
    }
    if (!isDestructibleEnemyBullet(bullet)) {
      return
    }
    if (this.audioHooks !== null) {
      this.audioHooks.playShatter()
    }
    recycleEnemyBullet(bullet)
  }

  private handleOrbEnemyOverlap(
    _orb: Phaser.Physics.Arcade.Image,
    enemy: Phaser.GameObjects.Rectangle,
  ): void {
    if (this.level <= ORBITING_ORB_LEVEL_START) {
      return
    }
    if (!enemy.active || enemy.getData('isDefeated') === true) {
      return
    }

    const enemyUid = enemy.getData('enemyUid') as number
    if (typeof enemyUid !== 'number') {
      return
    }

    // 同じフレームに複数 Orb が触れても 1 回だけ
    if (this.hitFrameUids.has(enemyUid)) {
      return
    }

    const nowMs = this.scene.time.now
    const lastHitAtMs = this.hitHistory.get(enemyUid)
    if (!canOrbitingOrbHitEnemy(lastHitAtMs, nowMs, ORBITING_ORB_HIT_COOLDOWN_MS)) {
      return
    }

    const stats = getOrbitingOrbStatsForLevel(this.level)
    const damage = calculateOrbitingOrbDamage(this.attackDamage, stats.damageMultiplier)
    if (damage <= 0) {
      return
    }

    this.hitFrameUids.add(enemyUid)
    this.hitHistory.set(enemyUid, nowMs)

    if (this.audioHooks !== null) {
      this.audioHooks.playHit()
    }

    const enemyX = enemy.x
    const enemyY = enemy.y
    const isDead = applyDamageToEnemy(enemy, damage)
    playDamageNumber(this.scene, enemyX, enemyY - 8, damage)

    const ctx = this.combatContext
    if (ctx === null) {
      return
    }

    if (isDead) {
      recordEnemyDefeated()
      clearLockedTargetIfEnemyDestroyed(ctx.attackState, enemy)
      const xpDropMultiplier = getEnemyXpDropMultiplier(enemy)
      ctx.playEnemyDefeat()
      playEnemyDefeatFadeOut(ctx.scene, enemy, () => {
        spawnExperienceCoinsAt(ctx, enemyX, enemyY, xpDropMultiplier)
      })
    }
  }
}
