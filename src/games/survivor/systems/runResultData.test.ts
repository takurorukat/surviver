/**
 * Run Result Data Foundation の単体テスト。
 * Phaser / 実時間待機なし。delta 注入で時間を検証する。
 */
import { describe, it, expect, beforeEach } from 'vitest'
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
} from './RunResultStore'
import { getAreaFinalBossConfig } from '../constants/finalBossConfig'

describe('RunResultStore — 開始とリセット', () => {
  beforeEach(() => {
    resetRunResultStoreForTests()
  })

  it('新エリア開始時に elapsed / kills / finalized が初期化される', () => {
    startAreaRun('plains')
    const progress = getRunProgress()
    expect(progress.areaId).toBe('plains')
    expect(progress.elapsedTimeMs).toBe(0)
    expect(progress.enemiesDefeated).toBe(0)
    expect(progress.finalBossDefeated).toBe(false)
    expect(progress.finalized).toBe(false)
    expect(progress.reviveUsed).toBe(false)
    expect(progress.revivePending).toBe(false)
    expect(progress.deathSettled).toBe(false)
    expect(getFinalizedRunResult()).toBe(null)
  })

  it('別エリア開始で 0 に戻る', () => {
    startAreaRun('plains')
    addRunElapsedMs(1000)
    recordRunEnemyDefeated('slime')
    startAreaRun('forest')
    const progress = getRunProgress()
    expect(progress.areaId).toBe('forest')
    expect(progress.elapsedTimeMs).toBe(0)
    expect(progress.enemiesDefeated).toBe(0)
    expect(progress.finalized).toBe(false)
  })

  it('resetAreaRun で未開始状態に戻る（Retry / Title）', () => {
    startAreaRun('volcano')
    addRunElapsedMs(500)
    recordRunEnemyDefeated('chaosElemental')
    resetAreaRun()
    const progress = getRunProgress()
    expect(progress.areaId).toBe(null)
    expect(progress.elapsedTimeMs).toBe(0)
    expect(progress.enemiesDefeated).toBe(0)
    expect(getFinalizedRunResult()).toBe(null)
  })
})

describe('RunResultStore — 時間', () => {
  beforeEach(() => {
    resetRunResultStoreForTests()
    startAreaRun('plains')
  })

  it('delta に応じて時間が増える', () => {
    addRunElapsedMs(16.6)
    addRunElapsedMs(16.7)
    expect(getRunProgress().elapsedTimeMs).toBeCloseTo(33.3, 5)
  })

  it('Stage 間を模して startAreaRun せず維持される', () => {
    addRunElapsedMs(2000)
    recordRunEnemyDefeated('bee')
    // Stage 2 へ: startAreaRun は呼ばない
    addRunElapsedMs(3000)
    recordRunEnemyDefeated('bee')
    const progress = getRunProgress()
    expect(progress.elapsedTimeMs).toBe(5000)
    expect(progress.enemiesDefeated).toBe(2)
  })

  it('負の delta や 0 では増えない', () => {
    addRunElapsedMs(100)
    addRunElapsedMs(0)
    addRunElapsedMs(-50)
    expect(getRunProgress().elapsedTimeMs).toBe(100)
  })

  it('Clear 確定後は時間が増えない', () => {
    addRunElapsedMs(1000)
    finalizeRunAsClear(5)
    addRunElapsedMs(9999)
    expect(getFinalizedRunResult()?.elapsedTimeMs).toBe(1000)
    expect(getRunProgress().elapsedTimeMs).toBe(1000)
  })

  it('Death 確定後は時間が増えない', () => {
    addRunElapsedMs(800)
    finalizeRunAsDefeat(3)
    addRunElapsedMs(9999)
    expect(getFinalizedRunResult()?.elapsedTimeMs).toBe(800)
  })
})

describe('RunResultStore — 撃破数', () => {
  beforeEach(() => {
    resetRunResultStoreForTests()
    startAreaRun('ruins')
  })

  it('通常・特殊・ボス・召喚敵の撃破で +1', () => {
    recordRunEnemyDefeated('earthSlime')
    recordRunEnemyDefeated('earthMagmaRock')
    recordRunEnemyDefeated('earthDungeonBoss')
    recordRunEnemyDefeated('earthSkeleton')
    expect(getRunProgress().enemiesDefeated).toBe(4)
  })

  it('最終ボス撃破で finalBossDefeated が立つ（finalBossConfig）', () => {
    const bossId = getAreaFinalBossConfig('ruins')?.finalBossEnemyId
    expect(bossId).toBe('earthDungeonBoss')
    recordRunEnemyDefeated('earthSlime')
    expect(getRunProgress().finalBossDefeated).toBe(false)
    recordRunEnemyDefeated('earthDungeonBoss')
    expect(getRunProgress().finalBossDefeated).toBe(true)
  })

  it('確定後の撃破は増えない', () => {
    recordRunEnemyDefeated('earthSlime')
    finalizeRunAsDefeat(2)
    recordRunEnemyDefeated('earthSlime')
    expect(getFinalizedRunResult()?.enemiesDefeated).toBe(1)
  })
})

describe('RunResultStore — 結果確定', () => {
  beforeEach(() => {
    resetRunResultStoreForTests()
  })

  it('Area Clear で resultType=clear と playerLevel・bossDefeated', () => {
    startAreaRun('plains')
    addRunElapsedMs(12000)
    recordRunEnemyDefeated('bee')
    recordRunEnemyDefeated('windHiveBoss')
    const result = finalizeRunAsClear(7)
    expect(result).not.toBe(null)
    expect(result?.resultType).toBe('clear')
    expect(result?.areaId).toBe('plains')
    expect(result?.playerLevel).toBe(7)
    expect(result?.enemiesDefeated).toBe(2)
    expect(result?.elapsedTimeMs).toBe(12000)
    expect(result?.bossDefeated).toBe(true)
  })

  it('Player Death で resultType=defeat。ボス未撃破なら bossDefeated=false', () => {
    startAreaRun('forest')
    addRunElapsedMs(4000)
    recordRunEnemyDefeated('branch')
    const result = finalizeRunAsDefeat(4)
    expect(result?.resultType).toBe('defeat')
    expect(result?.playerLevel).toBe(4)
    expect(result?.bossDefeated).toBe(false)
  })

  it('RunResult は1回だけ確定する（clear 後に defeat しても無視）', () => {
    startAreaRun('volcano')
    recordRunEnemyDefeated('chaosElemental')
    const clear = finalizeRunAsClear(6)
    const defeat = finalizeRunAsDefeat(1)
    expect(clear?.resultType).toBe('clear')
    expect(defeat).toBe(null)
    expect(getFinalizedRunResult()?.resultType).toBe('clear')
    expect(getFinalizedRunResult()?.playerLevel).toBe(6)
  })

  it('defeat 後に clear しても無視（同時確定防止）', () => {
    startAreaRun('plains')
    const defeat = finalizeRunAsDefeat(2)
    const clear = finalizeRunAsClear(99)
    expect(defeat?.resultType).toBe('defeat')
    expect(clear).toBe(null)
    expect(getFinalizedRunResult()?.resultType).toBe('defeat')
  })

  it('途中 Stage Clear を模して finalize しなければ結果は null', () => {
    startAreaRun('plains')
    addRunElapsedMs(5000)
    recordRunEnemyDefeated('bee')
    // Stage Clear のみ: finalize しない
    expect(getFinalizedRunResult()).toBe(null)
    expect(getRunProgress().finalized).toBe(false)
  })

  it('Result UI 窓口用に確定値が Store から読める', () => {
    startAreaRun('forest')
    recordRunEnemyDefeated('gravestone')
    finalizeRunAsClear(5)
    expect(getFinalizedRunResult()?.bossDefeated).toBe(true)
    expect(getAreaFinalBossConfig('forest')?.finalBossEnemyId).toBe('gravestone')
  })
})
