/**
 * エリア1回分の Run Progress / Run Result のメモリ上 SSoT。
 * Save / Best Time / Result UI には書き込まない。
 *
 * UnlockSaveSystem.clearRunProgress（旧セーブの run 消去）とは別物。
 */
import type { StageAreaId } from '../constants/areas'
import { getAreaFinalBossConfig } from '../constants/finalBossConfig'
import type { RunProgress, RunResult, RunResultType } from '../types/RunResult'

type StoreState = {
  areaId: StageAreaId | null
  elapsedTimeMs: number
  enemiesDefeated: number
  finalBossDefeated: boolean
  finalized: boolean
  result: RunResult | null
}

function createEmptyState(): StoreState {
  return {
    areaId: null,
    elapsedTimeMs: 0,
    enemiesDefeated: 0,
    finalBossDefeated: false,
    finalized: false,
    result: null,
  }
}

let state: StoreState = createEmptyState()

/** テスト用: ストアを完全に空へ戻す */
export function resetRunResultStoreForTests(): void {
  state = createEmptyState()
}

/**
 * 新しいエリアランを開始する（時間・撃破・確定をリセット）。
 * Stage 引き継ぎでは呼ばない。
 */
export function startAreaRun(areaId: StageAreaId): void {
  state = {
    areaId,
    elapsedTimeMs: 0,
    enemiesDefeated: 0,
    finalBossDefeated: false,
    finalized: false,
    result: null,
  }
}

/**
 * ラン進行を破棄する（Title へ戻る・Give Up など）。
 * 次の startAreaRun まで結果は取れない。
 */
export function resetAreaRun(): void {
  state = createEmptyState()
}

/** 現在の進行（読み取り専用コピー） */
export function getRunProgress(): RunProgress {
  return {
    areaId: state.areaId,
    elapsedTimeMs: state.elapsedTimeMs,
    enemiesDefeated: state.enemiesDefeated,
    finalBossDefeated: state.finalBossDefeated,
    finalized: state.finalized,
  }
}

/** 確定済み結果。未確定なら null */
export function getFinalizedRunResult(): RunResult | null {
  if (!state.finalized || state.result === null) {
    return null
  }
  return {
    areaId: state.result.areaId,
    resultType: state.result.resultType,
    elapsedTimeMs: state.result.elapsedTimeMs,
    playerLevel: state.result.playerLevel,
    enemiesDefeated: state.result.enemiesDefeated,
    bossDefeated: state.result.bossDefeated,
  }
}

/**
 * エリア通算時間を進める。
 * finalized 後、または未開始時は何もしない。
 * delta は game loop の ms（実時間 Date.now は使わない）。
 */
export function addRunElapsedMs(deltaMs: number): void {
  if (state.finalized) {
    return
  }
  if (state.areaId === null) {
    return
  }
  if (deltaMs <= 0) {
    return
  }
  state.elapsedTimeMs = state.elapsedTimeMs + deltaMs
}

/**
 * プレイヤーが敵を撃破確定したとき（lifetime stats とは別に呼ぶ）。
 * cleanup / despawn では呼ばないこと。
 */
export function recordRunEnemyDefeated(enemyKind: string): void {
  if (state.finalized) {
    return
  }
  if (state.areaId === null) {
    return
  }

  state.enemiesDefeated = state.enemiesDefeated + 1

  const bossConfig = getAreaFinalBossConfig(state.areaId)
  if (bossConfig !== null && enemyKind === bossConfig.finalBossEnemyId) {
    state.finalBossDefeated = true
  }
}

/**
 * Area Clear 確定時。すでに finalized なら null（再確定しない）。
 */
export function finalizeRunAsClear(playerLevel: number): RunResult | null {
  return finalizeRun('clear', playerLevel)
}

/**
 * Player Death 確定時。すでに finalized なら null。
 */
export function finalizeRunAsDefeat(playerLevel: number): RunResult | null {
  return finalizeRun('defeat', playerLevel)
}

function finalizeRun(
  resultType: RunResultType,
  playerLevel: number,
): RunResult | null {
  if (state.finalized) {
    return null
  }
  if (state.areaId === null) {
    return null
  }

  const safeLevel = Math.max(1, Math.floor(playerLevel))
  const result: RunResult = {
    areaId: state.areaId,
    resultType,
    elapsedTimeMs: state.elapsedTimeMs,
    playerLevel: safeLevel,
    enemiesDefeated: state.enemiesDefeated,
    bossDefeated: state.finalBossDefeated,
  }

  state.finalized = true
  state.result = result
  return getFinalizedRunResult()
}
