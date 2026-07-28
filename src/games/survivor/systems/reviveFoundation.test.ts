import { describe, expect, it, beforeEach } from 'vitest'
import {
  REVIVE_FEATURE_ENABLED,
  REVIVE_HP_RATIO,
  REVIVE_INVULNERABLE_MS,
  REVIVE_BUTTON_LABEL,
} from '../constants/revive'
import {
  startAreaRun,
  resetAreaRun,
  addRunElapsedMs,
  recordRunEnemyDefeated,
  finalizeRunAsClear,
  finalizeRunAsDefeat,
  getRunProgress,
  getFinalizedRunResult,
  resetRunResultStoreForTests,
  markRevivePending,
  markReviveUsed,
} from './RunResultStore'
import {
  canRevive,
  calculateReviveHp,
  getReviveInvulnerableMs,
  shouldFinalizeDefeatImmediately,
  applyReviveState,
  rejectRevive,
  isReviveFeatureEnabled,
} from './reviveLogic'
import { ReviveFlowSystem, type ReviveHost } from './ReviveFlowSystem'
import { createPlayerDamageState, startPlayerInvulnerability } from './PlayerDamageSystem'

function baseEligibleInput(
  overrides: Partial<Parameters<typeof canRevive>[0]> = {},
) {
  return {
    featureEnabled: true,
    reviveUsed: false,
    revivePending: false,
    deathSettled: false,
    runFinalized: false,
    playerDead: true,
    stageClearSettled: false,
    endingActive: false,
    sceneActive: true,
    ...overrides,
  }
}

describe('Revive foundation — Production flag', () => {
  it('Production では Feature Flag が false', () => {
    expect(REVIVE_FEATURE_ENABLED).toBe(false)
    expect(isReviveFeatureEnabled()).toBe(false)
  })

  it('Flag=false では canRevive 不可・即 defeat 確定', () => {
    expect(
      canRevive(baseEligibleInput({ featureEnabled: false })),
    ).toBe(false)
    expect(
      shouldFinalizeDefeatImmediately(
        baseEligibleInput({ featureEnabled: false }),
      ),
    ).toBe(true)
  })

  it('REVIVE 文言に WATCH AD を含めない', () => {
    expect(REVIVE_BUTTON_LABEL).toBe('REVIVE')
    expect(REVIVE_BUTTON_LABEL.toLowerCase().includes('watch')).toBe(false)
    expect(REVIVE_BUTTON_LABEL.toLowerCase().includes('ad')).toBe(false)
  })
})

describe('Revive foundation — eligibility', () => {
  it('条件を満たせば canRevive=true（Flag を明示 true）', () => {
    expect(canRevive(baseEligibleInput())).toBe(true)
  })

  it('未死亡・Clear 後・Ending・2回目・pending・finalized は不可', () => {
    expect(canRevive(baseEligibleInput({ playerDead: false }))).toBe(false)
    expect(canRevive(baseEligibleInput({ stageClearSettled: true }))).toBe(
      false,
    )
    expect(canRevive(baseEligibleInput({ endingActive: true }))).toBe(false)
    expect(canRevive(baseEligibleInput({ reviveUsed: true }))).toBe(false)
    expect(canRevive(baseEligibleInput({ revivePending: true }))).toBe(false)
    expect(canRevive(baseEligibleInput({ runFinalized: true }))).toBe(false)
    expect(canRevive(baseEligibleInput({ deathSettled: true }))).toBe(false)
    expect(canRevive(baseEligibleInput({ sceneActive: false }))).toBe(false)
  })
})

describe('Revive foundation — HP / invuln', () => {
  it('復活 HP は最大の50%（最低1）', () => {
    expect(REVIVE_HP_RATIO).toBe(0.5)
    expect(calculateReviveHp(3)).toBe(1)
    expect(calculateReviveHp(4)).toBe(2)
    expect(calculateReviveHp(10)).toBe(5)
    expect(calculateReviveHp(1)).toBe(1)
  })

  it('復活無敵は2000ms（既存 invuln 処理を再利用）', () => {
    expect(getReviveInvulnerableMs()).toBe(2000)
    expect(REVIVE_INVULNERABLE_MS).toBe(2000)
    const state = createPlayerDamageState()
    startPlayerInvulnerability(state, 1000, REVIVE_INVULNERABLE_MS)
    expect(state.isInvincible).toBe(true)
    expect(state.invincibleUntilMs).toBe(3000)
  })
})

describe('Revive foundation — run state', () => {
  beforeEach(() => {
    resetRunResultStoreForTests()
  })

  it('新Runでは reviveUsed/pending/deathSettled が false', () => {
    startAreaRun('plains')
    const progress = getRunProgress()
    expect(progress.reviveUsed).toBe(false)
    expect(progress.revivePending).toBe(false)
    expect(progress.deathSettled).toBe(false)
  })

  it('Stage 相当の進行（startAreaRun しない）では reviveUsed を維持', () => {
    startAreaRun('forest')
    markReviveUsed()
    addRunElapsedMs(5000)
    recordRunEnemyDefeated('stump')
    const progress = getRunProgress()
    expect(progress.reviveUsed).toBe(true)
    expect(progress.elapsedTimeMs).toBe(5000)
    expect(progress.enemiesDefeated).toBe(1)
  })

  it('Retry / Title（resetAreaRun）で false に戻る', () => {
    startAreaRun('volcano')
    markReviveUsed()
    markRevivePending()
    resetAreaRun()
    const progress = getRunProgress()
    expect(progress.reviveUsed).toBe(false)
    expect(progress.revivePending).toBe(false)
    expect(progress.deathSettled).toBe(false)
  })

  it('applyRevive 後は reviveUsed=true で defeat を作らない', () => {
    startAreaRun('ruins')
    addRunElapsedMs(1200)
    recordRunEnemyDefeated('earthSlime')
    markRevivePending()
    expect(applyReviveState()).toBe(true)
    expect(getRunProgress().reviveUsed).toBe(true)
    expect(getRunProgress().revivePending).toBe(false)
    expect(getFinalizedRunResult()).toBe(null)
    expect(getRunProgress().elapsedTimeMs).toBe(1200)
    expect(getRunProgress().enemiesDefeated).toBe(1)
  })

  it('2回目の apply は失敗', () => {
    startAreaRun('plains')
    expect(applyReviveState()).toBe(true)
    expect(applyReviveState()).toBe(false)
  })

  it('rejectRevive は defeat を1回だけ確定', () => {
    startAreaRun('plains')
    markRevivePending()
    rejectRevive(3)
    expect(getFinalizedRunResult()?.resultType).toBe('defeat')
    expect(getRunProgress().deathSettled).toBe(true)
    rejectRevive(3)
    expect(getFinalizedRunResult()?.resultType).toBe('defeat')
  })

  it('clear 確定後は revive できない（競合防止）', () => {
    startAreaRun('plains')
    finalizeRunAsClear(5)
    expect(
      canRevive(
        baseEligibleInput({
          runFinalized: true,
          deathSettled: true,
        }),
      ),
    ).toBe(false)
    expect(applyReviveState()).toBe(false)
  })

  it('Flag=false 相当: death で defeat 確定しても revive 状態は消費しないまま settled', () => {
    startAreaRun('plains')
    finalizeRunAsDefeat(2)
    expect(getFinalizedRunResult()?.resultType).toBe('defeat')
    expect(getRunProgress().reviveUsed).toBe(false)
    expect(getRunProgress().deathSettled).toBe(true)
  })
})

describe('ReviveFlowSystem — host apply', () => {
  beforeEach(() => {
    resetRunResultStoreForTests()
  })

  it('applyRevive で HP50%・無敵・弾cleanup・defeatなし・撃破数維持', () => {
    startAreaRun('plains')
    addRunElapsedMs(3000)
    recordRunEnemyDefeated('slime')
    markRevivePending()

    let currentHp = 0
    let invulnMs = 0
    let bulletsCleared = 0
    let resumed = false
    let hidden = false
    let playerDead = true
    let settledClear = false

    const host: ReviveHost = {
      getPlayerLevel: () => 4,
      getMaxHp: () => 10,
      setCurrentHp: (hp) => {
        currentHp = hp
      },
      updateHpHud: () => {},
      getNowMs: () => 5000,
      grantInvulnerabilityMs: (durationMs) => {
        invulnMs = durationMs
      },
      resetPlayerVelocity: () => {},
      clearPlayerDeadFlags: () => {
        playerDead = false
      },
      destroyEnemyProjectilesWithoutScoring: () => {
        bulletsCleared = bulletsCleared + 1
      },
      resumeGameplayAfterRevive: () => {
        resumed = true
      },
      hideGameOverUi: () => {
        hidden = true
      },
      isPlayerDead: () => playerDead,
      isStageClearSettled: () => settledClear,
      isEndingActive: () => false,
      isSceneActive: () => true,
    }

    const flow = new ReviveFlowSystem(host)
    expect(flow.applyRevive()).toBe(true)
    expect(currentHp).toBe(5)
    expect(invulnMs).toBe(2000)
    expect(bulletsCleared).toBe(1)
    expect(resumed).toBe(true)
    expect(hidden).toBe(true)
    expect(playerDead).toBe(false)
    expect(getFinalizedRunResult()).toBe(null)
    expect(getRunProgress().enemiesDefeated).toBe(1)
    expect(getRunProgress().elapsedTimeMs).toBe(3000)
    expect(getRunProgress().reviveUsed).toBe(true)
  })

  it('requestRevive は Flag=false では失敗する', () => {
    startAreaRun('plains')
    const host: ReviveHost = {
      getPlayerLevel: () => 1,
      getMaxHp: () => 3,
      setCurrentHp: () => {},
      updateHpHud: () => {},
      getNowMs: () => 0,
      grantInvulnerabilityMs: () => {},
      resetPlayerVelocity: () => {},
      clearPlayerDeadFlags: () => {},
      destroyEnemyProjectilesWithoutScoring: () => {},
      resumeGameplayAfterRevive: () => {},
      hideGameOverUi: () => {},
      isPlayerDead: () => true,
      isStageClearSettled: () => false,
      isEndingActive: () => false,
      isSceneActive: () => true,
    }
    const flow = new ReviveFlowSystem(host)
    expect(flow.isFeatureEnabled()).toBe(false)
    expect(flow.canRevive()).toBe(false)
    expect(flow.requestRevive()).toBe(false)
    expect(getRunProgress().revivePending).toBe(false)
  })
})
