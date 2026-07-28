/**
 * 復活フローの純粋ロジック（広告 SDK 非依存）。
 * GameScene / ReviveFlowSystem が参照する。Phaser に依存しない。
 */
import {
  REVIVE_FEATURE_ENABLED,
  REVIVE_HP_RATIO,
  REVIVE_INVULNERABLE_MS,
} from '../constants/revive'
import {
  clearRevivePending,
  finalizeRunAsDefeat,
  getFinalizedRunResult,
  getRunProgress,
  markDeathSettled,
  markRevivePending,
  markReviveUsed,
} from './RunResultStore'

/** canRevive / 死亡フロー判定に渡す実行時スナップショット */
export type ReviveEligibilityInput = {
  featureEnabled: boolean
  reviveUsed: boolean
  revivePending: boolean
  deathSettled: boolean
  runFinalized: boolean
  playerDead: boolean
  stageClearSettled: boolean
  endingActive: boolean
  sceneActive: boolean
}

/**
 * 復活できるか（Feature Flag・1回制限・Clear／Ending 競合を見る）。
 */
export function canRevive(input: ReviveEligibilityInput): boolean {
  if (!input.featureEnabled) {
    return false
  }
  if (input.reviveUsed) {
    return false
  }
  if (input.revivePending) {
    return false
  }
  if (input.deathSettled) {
    return false
  }
  if (input.runFinalized) {
    return false
  }
  if (!input.playerDead) {
    return false
  }
  if (input.stageClearSettled) {
    return false
  }
  if (input.endingActive) {
    return false
  }
  if (!input.sceneActive) {
    return false
  }
  return true
}

/**
 * 死亡直後にすぐ defeat 確定するか。
 * Feature Flag=false、または canRevive=false なら true（従来どおり）。
 */
export function shouldFinalizeDefeatImmediately(
  input: ReviveEligibilityInput,
): boolean {
  return !canRevive(input)
}

/** 最大 HP の 50%（最低 1） */
export function calculateReviveHp(maxHp: number): number {
  const safeMax = Math.max(1, Math.floor(maxHp))
  const half = Math.floor(safeMax * REVIVE_HP_RATIO)
  return Math.max(1, half)
}

export function getReviveInvulnerableMs(): number {
  return REVIVE_INVULNERABLE_MS
}

/** ストア＋実行時フラグから canRevive を組み立てる */
export function canReviveFromRunState(runtime: {
  playerDead: boolean
  stageClearSettled: boolean
  endingActive: boolean
  sceneActive: boolean
}): boolean {
  const progress = getRunProgress()
  return canRevive({
    featureEnabled: REVIVE_FEATURE_ENABLED,
    reviveUsed: progress.reviveUsed,
    revivePending: progress.revivePending,
    deathSettled: progress.deathSettled,
    runFinalized: progress.finalized,
    playerDead: runtime.playerDead,
    stageClearSettled: runtime.stageClearSettled,
    endingActive: runtime.endingActive,
    sceneActive: runtime.sceneActive,
  })
}

/**
 * 将来の広告開始入口。pending を立てるだけ。
 * Production UI（Flag=false）からは呼ばない。
 */
export function requestRevive(runtime: {
  playerDead: boolean
  stageClearSettled: boolean
  endingActive: boolean
  sceneActive: boolean
}): boolean {
  if (!canReviveFromRunState(runtime)) {
    return false
  }
  markRevivePending()
  return true
}

/**
 * 広告失敗／キャンセル。pending を戻し、まだなら defeat を1回だけ確定する。
 */
export function rejectRevive(playerLevel: number): void {
  clearRevivePending()
  if (getFinalizedRunResult() !== null) {
    markDeathSettled()
    return
  }
  finalizeRunAsDefeat(playerLevel)
  markDeathSettled()
}

/**
 * 広告成功後（または将来の無料復活）に呼ぶ前の状態更新。
 * HP／無敵の適用はホスト側。ここでは reviveUsed 消費のみ。
 * すでに defeat 確定済みなら false。
 */
export function applyReviveState(): boolean {
  const progress = getRunProgress()
  if (progress.finalized) {
    return false
  }
  if (progress.reviveUsed) {
    return false
  }
  markReviveUsed()
  return true
}

/**
 * Feature Flag の現在値（テストで「本番は false」を固定確認するため）。
 */
export function isReviveFeatureEnabled(): boolean {
  return REVIVE_FEATURE_ENABLED
}
