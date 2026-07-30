// ============================================================
// SurvivorAutoplayBridge.ts
// ------------------------------------------------------------
// 開発専用（import.meta.env.DEV かつ ?e2e=1）の自動プレイ橋渡し。
// Bot 移動・レベルアップ自動選択・読み取り専用状態 API のみ担当する。
// ============================================================

import type Phaser from 'phaser'

export type AutoplayVector = {
  x: number
  y: number
}

export type SurvivorE2EState = {
  areaId: string
  stageNumber: number
  currentScene: string | null
  sceneActive: boolean
  sceneVisible: boolean
  scenePaused: boolean
  sceneSleeping: boolean
  elapsedMs: number
  playerHp: number | null
  playerLevel: number | null
  enemyCount: number
  enemyBulletCount: number
  playerBulletCount: number
  pendingLevelUps: number
  bossAlive: boolean
  activeEnemyKinds: string[]
  isLevelUpOpen: boolean
  isSettingsOpen: boolean
  isAchievementsOpen: boolean
  isConfirmDialogOpen: boolean
  isGameOver: boolean
  isLevelUpPaused: boolean
  isResumeCountdownActive: boolean
  isStartCountdownActive: boolean
  isStageSettled: boolean
  timePaused: boolean
  physicsPaused: boolean
  documentVisibility: DocumentVisibilityState
  documentHasFocus: boolean
  bgmActive: boolean
  botEnabled: boolean
  lastUpdateAt: number
  lastCompletedUpdateAt: number
}

export type SurvivorE2EApi = {
  getState: () => SurvivorE2EState
  startEarthStage5: () => void
}

export type SurvivorAutoplayHost = {
  getAreaId: () => string
  getStageNumber: () => number
  getSceneKey: () => string
  isSceneActive: () => boolean
  isSceneVisible: () => boolean
  isScenePaused: () => boolean
  isSceneSleeping: () => boolean
  getElapsedMs: () => number
  getPlayerHp: () => number
  getPlayerLevel: () => number
  getPlayerX: () => number
  getPlayerY: () => number
  getPlayAreaLeft: () => number
  getPlayAreaTop: () => number
  getPlayAreaWidth: () => number
  getPlayAreaHeight: () => number
  getEnemyChildren: () => readonly Phaser.GameObjects.GameObject[]
  getEnemyBulletCount: () => number
  getPlayerBulletCount: () => number
  getPendingLevelUps: () => number
  isBossAlive: () => boolean
  isLevelUpOpen: () => boolean
  isSettingsOpen: () => boolean
  isAchievementsOpen: () => boolean
  isConfirmDialogOpen: () => boolean
  isGameOver: () => boolean
  isLevelUpPaused: () => boolean
  isResumeCountdownActive: () => boolean
  isStartCountdownActive: () => boolean
  isStageSettled: () => boolean
  isTimePaused: () => boolean
  isPhysicsPaused: () => boolean
  isBgmActive: () => boolean
  confirmLevelUpFirstChoice: () => boolean
  startEarthStage5: () => void
}

declare global {
  interface Window {
    __MAGE_SURVIVOR_TEST__?: SurvivorE2EApi
  }
}

const EDGE_MARGIN_PX = 64
const ENEMY_FLEE_DISTANCE_PX = 240
const CIRCLE_SPEED = 0.7
const DIRECTION_FLIP_MS = 5000

/** DEV かつ URL に e2e=1 があるときだけ有効 */
export function isSurvivorE2EEnabled(): boolean {
  if (import.meta.env.DEV !== true) {
    return false
  }
  if (typeof window === 'undefined') {
    return false
  }
  return new URLSearchParams(window.location.search).get('e2e') === '1'
}

export class SurvivorAutoplayBridge {
  private host: SurvivorAutoplayHost
  private lastUpdateAt = 0
  private lastCompletedUpdateAt = 0
  private levelUpLatchOpen = false
  private circleSign = 1
  private nextDirectionFlipAt = 0

  private constructor(host: SurvivorAutoplayHost) {
    this.host = host
    this.nextDirectionFlipAt = Date.now() + DIRECTION_FLIP_MS
    this.registerWindowApi()
  }

  /** 条件を満たすときだけ Bridge を作る。通常プレイでは null */
  static createIfEnabled(host: SurvivorAutoplayHost): SurvivorAutoplayBridge | null {
    if (!isSurvivorE2EEnabled()) {
      return null
    }
    return new SurvivorAutoplayBridge(host)
  }

  isEnabled(): boolean {
    return true
  }

  /** 毎フレーム呼ぶ。状態時刻の更新とレベルアップ自動選択 */
  onFrame(): void {
    this.lastUpdateAt = Date.now()
    this.tryConfirmLevelUp()
  }

  onFrameCompleted(): void {
    this.lastCompletedUpdateAt = Date.now()
  }

  /**
   * 正規化された移動ベクトルを返す。
   * 近敵回避 → 境界回避 → 緩やかな周回。
   */
  getMoveVector(nowMs: number): AutoplayVector {
    const playerX = this.host.getPlayerX()
    const playerY = this.host.getPlayerY()
    if (!Number.isFinite(playerX) || !Number.isFinite(playerY)) {
      return { x: 0, y: 0 }
    }

    // 近くの敵全体から離れることを最優先（60秒生存が目的）
    const flee = this.computeFleeFromNearbyEnemies(playerX, playerY)
    if (flee !== null) {
      return this.steerAwayFromEdges(playerX, playerY, flee.x, flee.y)
    }

    let moveX = 0
    let moveY = 0
    const left = this.host.getPlayAreaLeft()
    const top = this.host.getPlayAreaTop()
    const right = left + this.host.getPlayAreaWidth()
    const bottom = top + this.host.getPlayAreaHeight()

    if (playerX < left + EDGE_MARGIN_PX) {
      moveX = moveX + 1
    }
    if (playerX > right - EDGE_MARGIN_PX) {
      moveX = moveX - 1
    }
    if (playerY < top + EDGE_MARGIN_PX) {
      moveY = moveY + 1
    }
    if (playerY > bottom - EDGE_MARGIN_PX) {
      moveY = moveY - 1
    }

    if (Math.abs(moveX) < 0.001 && Math.abs(moveY) < 0.001) {
      if (nowMs >= this.nextDirectionFlipAt) {
        this.circleSign = this.circleSign * -1
        this.nextDirectionFlipAt = nowMs + DIRECTION_FLIP_MS
      }
      const angle = (nowMs / 1000) * CIRCLE_SPEED * this.circleSign
      moveX = Math.cos(angle)
      moveY = Math.sin(angle)
    }

    return this.normalizeOrZero(moveX, moveY)
  }

  destroy(): void {
    if (window.__MAGE_SURVIVOR_TEST__ !== undefined) {
      delete window.__MAGE_SURVIVOR_TEST__
    }
  }

  /** 逃走ベクトルを境界の内側へ軽く補正する */
  private steerAwayFromEdges(
    playerX: number,
    playerY: number,
    moveX: number,
    moveY: number,
  ): AutoplayVector {
    let x = moveX
    let y = moveY
    const left = this.host.getPlayAreaLeft()
    const top = this.host.getPlayAreaTop()
    const right = left + this.host.getPlayAreaWidth()
    const bottom = top + this.host.getPlayAreaHeight()

    if (playerX < left + EDGE_MARGIN_PX) {
      x = x + 1.2
    }
    if (playerX > right - EDGE_MARGIN_PX) {
      x = x - 1.2
    }
    if (playerY < top + EDGE_MARGIN_PX) {
      y = y + 1.2
    }
    if (playerY > bottom - EDGE_MARGIN_PX) {
      y = y - 1.2
    }
    return this.normalizeOrZero(x, y)
  }

  private tryConfirmLevelUp(): void {
    const isOpen = this.host.isLevelUpOpen()
    if (!isOpen) {
      this.levelUpLatchOpen = false
      return
    }
    if (this.levelUpLatchOpen) {
      return
    }
    const confirmed = this.host.confirmLevelUpFirstChoice()
    if (confirmed) {
      this.levelUpLatchOpen = true
    }
  }

  /** 近距離の敵から合成した逃走方向。いなければ null */
  private computeFleeFromNearbyEnemies(
    playerX: number,
    playerY: number,
  ): AutoplayVector | null {
    const children = this.host.getEnemyChildren()
    let sumX = 0
    let sumY = 0
    let nearCount = 0

    for (let index = 0; index < children.length; index++) {
      const child = children[index] as Phaser.GameObjects.Sprite
      if (child === undefined || child.active !== true) {
        continue
      }
      const enemyX = child.x
      const enemyY = child.y
      if (!Number.isFinite(enemyX) || !Number.isFinite(enemyY)) {
        continue
      }
      const dx = playerX - enemyX
      const dy = playerY - enemyY
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance >= ENEMY_FLEE_DISTANCE_PX || distance <= 0.001) {
        continue
      }
      // 近い敵ほど強く避ける（1/distance）
      const weight = 1 / distance
      sumX = sumX + (dx / distance) * weight
      sumY = sumY + (dy / distance) * weight
      nearCount = nearCount + 1
    }

    if (nearCount === 0) {
      return null
    }
    return this.normalizeOrZero(sumX, sumY)
  }

  private normalizeOrZero(x: number, y: number): AutoplayVector {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return { x: 0, y: 0 }
    }
    const length = Math.sqrt(x * x + y * y)
    if (length < 0.0001) {
      return { x: 0, y: 0 }
    }
    return { x: x / length, y: y / length }
  }

  private registerWindowApi(): void {
    window.__MAGE_SURVIVOR_TEST__ = {
      getState: () => this.buildState(),
      startEarthStage5: () => this.host.startEarthStage5(),
    }
  }

  private buildState(): SurvivorE2EState {
    let enemyCount = 0
    const children = this.host.getEnemyChildren()
    for (let index = 0; index < children.length; index++) {
      const child = children[index]
      if (child !== undefined && child.active === true) {
        enemyCount = enemyCount + 1
      }
    }

    const playerHp = this.host.getPlayerHp()
    const playerLevel = this.host.getPlayerLevel()
    const activeEnemyKinds: string[] = []
    for (let index = 0; index < children.length; index++) {
      const child = children[index]
      if (child === undefined || child.active !== true) {
        continue
      }
      const enemyKind = child.getData('enemyKind')
      if (typeof enemyKind === 'string' && !activeEnemyKinds.includes(enemyKind)) {
        activeEnemyKinds.push(enemyKind)
      }
    }

    return {
      areaId: this.host.getAreaId(),
      stageNumber: this.host.getStageNumber(),
      currentScene: this.host.getSceneKey(),
      sceneActive: this.host.isSceneActive(),
      sceneVisible: this.host.isSceneVisible(),
      scenePaused: this.host.isScenePaused(),
      sceneSleeping: this.host.isSceneSleeping(),
      elapsedMs: this.host.getElapsedMs(),
      playerHp: Number.isFinite(playerHp) ? playerHp : null,
      playerLevel: Number.isFinite(playerLevel) ? playerLevel : null,
      enemyCount,
      enemyBulletCount: this.host.getEnemyBulletCount(),
      playerBulletCount: this.host.getPlayerBulletCount(),
      pendingLevelUps: this.host.getPendingLevelUps(),
      bossAlive: this.host.isBossAlive(),
      activeEnemyKinds,
      isLevelUpOpen: this.host.isLevelUpOpen(),
      isSettingsOpen: this.host.isSettingsOpen(),
      isAchievementsOpen: this.host.isAchievementsOpen(),
      isConfirmDialogOpen: this.host.isConfirmDialogOpen(),
      isGameOver: this.host.isGameOver(),
      isLevelUpPaused: this.host.isLevelUpPaused(),
      isResumeCountdownActive: this.host.isResumeCountdownActive(),
      isStartCountdownActive: this.host.isStartCountdownActive(),
      isStageSettled: this.host.isStageSettled(),
      timePaused: this.host.isTimePaused(),
      physicsPaused: this.host.isPhysicsPaused(),
      documentVisibility: document.visibilityState,
      documentHasFocus: document.hasFocus(),
      bgmActive: this.host.isBgmActive(),
      botEnabled: true,
      lastUpdateAt: this.lastUpdateAt,
      lastCompletedUpdateAt: this.lastCompletedUpdateAt,
    }
  }
}
