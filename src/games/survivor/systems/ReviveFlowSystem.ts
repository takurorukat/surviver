/**
 * 復活フローの境界（広告 SDK 非依存）。
 * GameScene がホストを渡し、canRevive / request / apply / reject を呼ぶ。
 */
import {
  calculateReviveHp,
  canReviveFromRunState,
  getReviveInvulnerableMs,
  isReviveFeatureEnabled,
  rejectRevive,
  requestRevive,
  applyReviveState,
  shouldFinalizeDefeatImmediately,
} from './reviveLogic'
import { getRunProgress } from './RunResultStore'

/** GameScene が実装する復活ホスト（Phaser 依存はここに閉じる） */
export type ReviveHost = {
  getPlayerLevel: () => number
  getMaxHp: () => number
  setCurrentHp: (hp: number) => void
  updateHpHud: () => void
  getNowMs: () => number
  grantInvulnerabilityMs: (durationMs: number) => void
  resetPlayerVelocity: () => void
  clearPlayerDeadFlags: () => void
  destroyEnemyProjectilesWithoutScoring: () => void
  resumeGameplayAfterRevive: () => void
  hideGameOverUi: () => void
  isPlayerDead: () => boolean
  isStageClearSettled: () => boolean
  isEndingActive: () => boolean
  isSceneActive: () => boolean
}

export class ReviveFlowSystem {
  private host: ReviveHost

  constructor(host: ReviveHost) {
    this.host = host
  }

  isFeatureEnabled(): boolean {
    return isReviveFeatureEnabled()
  }

  canRevive(): boolean {
    return canReviveFromRunState({
      playerDead: this.host.isPlayerDead(),
      stageClearSettled: this.host.isStageClearSettled(),
      endingActive: this.host.isEndingActive(),
      sceneActive: this.host.isSceneActive(),
    })
  }

  /** 死亡直後にすぐ defeat 確定するか（Flag=false なら常に true） */
  shouldFinalizeDefeatImmediately(): boolean {
    return shouldFinalizeDefeatImmediately({
      featureEnabled: isReviveFeatureEnabled(),
      reviveUsed: getRunProgress().reviveUsed,
      revivePending: getRunProgress().revivePending,
      deathSettled: getRunProgress().deathSettled,
      runFinalized: getRunProgress().finalized,
      playerDead: this.host.isPlayerDead(),
      stageClearSettled: this.host.isStageClearSettled(),
      endingActive: this.host.isEndingActive(),
      sceneActive: this.host.isSceneActive(),
    })
  }

  /**
   * 将来の広告開始入口。Production UI からは呼ばない。
   */
  requestRevive(): boolean {
    return requestRevive({
      playerDead: this.host.isPlayerDead(),
      stageClearSettled: this.host.isStageClearSettled(),
      endingActive: this.host.isEndingActive(),
      sceneActive: this.host.isSceneActive(),
    })
  }

  /**
   * 広告成功後に呼ぶ。HP・無敵・弾消去・操作再開。
   * defeat RunResult は作らない。
   */
  applyRevive(): boolean {
    if (!applyReviveState()) {
      return false
    }

    const reviveHp = calculateReviveHp(this.host.getMaxHp())
    this.host.setCurrentHp(reviveHp)
    this.host.updateHpHud()
    this.host.grantInvulnerabilityMs(getReviveInvulnerableMs())
    this.host.resetPlayerVelocity()
    this.host.clearPlayerDeadFlags()
    this.host.destroyEnemyProjectilesWithoutScoring()
    this.host.hideGameOverUi()
    this.host.resumeGameplayAfterRevive()
    return true
  }

  /**
   * 広告失敗／キャンセル。defeat を1回だけ確定する。
   */
  rejectRevive(): void {
    rejectRevive(this.host.getPlayerLevel())
  }
}
