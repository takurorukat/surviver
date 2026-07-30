import { describe, expect, it } from 'vitest'
import {
  FINAL_WAVE_EXTRA_PACK_GAP_SECONDS,
  FINAL_WAVE_EXTRA_PACK_GAP_SECONDS_FINAL_STAGE,
  FINAL_WAVE_REMAINING_SECONDS,
  STAGE_DURATION_SECONDS,
  STAGE_LAST_SPAWN_SECONDS,
  applyRuinsStage3SpawnCountFactor,
  getLastSpawnAtSeconds,
  getRecurringEnemyCountForStage,
  getSpawnScheduleForStage,
  shouldCloseSpawnsAfterFinalWave,
  shouldScatterRuinsStage3EnemySpawns,
} from '../GameConstants'
import {
  getFinalWaveExtraPackGapSecondsForStage,
  shouldAcceptScheduledSpawnAttempt,
  shouldClearFiniteWaveStage,
  shouldHoldClearWhileSpawnsPending,
} from './earthDungeonStage3WavePolicy'

describe('Earth Dungeon Stage3 final wave definition', () => {
  it('stopsSpawningAfterEarthStage3FinalWave: クローズ対象は ruins Stage3 だけ', () => {
    expect(shouldCloseSpawnsAfterFinalWave('ruins', 3)).toBe(true)
    expect(shouldCloseSpawnsAfterFinalWave('ruins', 1)).toBe(false)
    expect(shouldCloseSpawnsAfterFinalWave('ruins', 2)).toBe(false)
    expect(shouldCloseSpawnsAfterFinalWave('ruins', 5)).toBe(false)
    expect(shouldCloseSpawnsAfterFinalWave('plains', 3)).toBe(false)
    expect(shouldCloseSpawnsAfterFinalWave('forest', 3)).toBe(false)
    expect(shouldCloseSpawnsAfterFinalWave('volcano', 3)).toBe(false)
  })

  it('FINAL WAVE は残り10秒で開始する', () => {
    expect(FINAL_WAVE_REMAINING_SECONDS).toBe(10)
  })

  it('通常バーストはファイナルウェーブより前で終わり、他Stageは従来どおり', () => {
    const lastSpawn = getLastSpawnAtSeconds(3, 'ruins')
    const finalWaveAtElapsed =
      STAGE_DURATION_SECONDS - FINAL_WAVE_REMAINING_SECONDS
    expect(lastSpawn).toBeLessThan(finalWaveAtElapsed)
    expect(lastSpawn).toBe(15)
    expect(getLastSpawnAtSeconds(3, 'plains')).toBe(STAGE_LAST_SPAWN_SECONDS)
    expect(getLastSpawnAtSeconds(1, 'ruins')).toBe(STAGE_LAST_SPAWN_SECONDS)
    expect(getLastSpawnAtSeconds(2, 'ruins')).toBe(STAGE_LAST_SPAWN_SECONDS)
  })

  it('スケジュール最終バーストは lastSpawn 以下（最終ウェーブ前）', () => {
    const schedule = getSpawnScheduleForStage(3, 5, 'ruins')
    expect(schedule).not.toBeNull()
    if (schedule === null) {
      return
    }
    expect(schedule.length).toBeGreaterThan(1)
    const lastBurst = schedule[schedule.length - 1]
    expect(lastBurst.delaySeconds).toBeLessThanOrEqual(getLastSpawnAtSeconds(3, 'ruins'))
    expect(lastBurst.delaySeconds).toBeLessThan(
      STAGE_DURATION_SECONDS - FINAL_WAVE_REMAINING_SECONDS,
    )
  })

  it('Earth Stage3 の FINAL WAVE 追加パック間隔は他の非最終ステージと同じ共通値', () => {
    expect(FINAL_WAVE_EXTRA_PACK_GAP_SECONDS).toBe(1.6)
    expect(getFinalWaveExtraPackGapSecondsForStage('ruins', 3, false)).toBe(
      FINAL_WAVE_EXTRA_PACK_GAP_SECONDS,
    )
    expect(getFinalWaveExtraPackGapSecondsForStage('forest', 3, false)).toBe(
      FINAL_WAVE_EXTRA_PACK_GAP_SECONDS,
    )
    expect(getFinalWaveExtraPackGapSecondsForStage('plains', 2, false)).toBe(
      FINAL_WAVE_EXTRA_PACK_GAP_SECONDS,
    )
    expect(getFinalWaveExtraPackGapSecondsForStage('volcano', 4, false)).toBe(
      FINAL_WAVE_EXTRA_PACK_GAP_SECONDS,
    )
  })

  it('エリア最終ステージの FINAL WAVE 間隔は短縮値のまま', () => {
    expect(
      getFinalWaveExtraPackGapSecondsForStage('plains', 3, true),
    ).toBe(FINAL_WAVE_EXTRA_PACK_GAP_SECONDS_FINAL_STAGE)
    expect(
      getFinalWaveExtraPackGapSecondsForStage('forest', 5, true),
    ).toBe(FINAL_WAVE_EXTRA_PACK_GAP_SECONDS_FINAL_STAGE)
  })

  it('FINAL WAVE の追加総数は recurring×1.4（従来どおり）', () => {
    const base = getRecurringEnemyCountForStage(3, 5)
    const total = applyRuinsStage3SpawnCountFactor('ruins', 3, base)
    expect(total).toBe(Math.max(1, Math.round(base * 1.4)))
  })

  it('散開スポーンは ruins Stage3 のみ有効', () => {
    expect(shouldScatterRuinsStage3EnemySpawns('ruins', 3)).toBe(true)
    expect(shouldScatterRuinsStage3EnemySpawns('ruins', 2)).toBe(false)
    expect(shouldScatterRuinsStage3EnemySpawns('forest', 3)).toBe(false)
  })
})

describe('Earth Dungeon Stage3 spawn gate / clear policy', () => {
  it('doesNotRefillEnemiesAfterEarthStage3FinalWave: クローズ後は新規のみ拒否、リトライは許可', () => {
    expect(shouldAcceptScheduledSpawnAttempt(false, false)).toBe(true)
    expect(shouldAcceptScheduledSpawnAttempt(true, false)).toBe(false)
    expect(shouldAcceptScheduledSpawnAttempt(true, true)).toBe(true)
  })

  it('clearsEarthStage3AfterFinalWaveDefeated: スポーン完了＋敵0なら残り時間があってもクリア', () => {
    expect(
      shouldClearFiniteWaveStage({
        allSpawnsFinished: true,
        aliveEnemyCount: 0,
        playerDead: false,
        stageClearAlreadyStarted: false,
        remainingSeconds: 8,
      }),
    ).toBe(true)
  })

  it('最終ウェーブの敵が生存中はクリアしない', () => {
    expect(
      shouldClearFiniteWaveStage({
        allSpawnsFinished: true,
        aliveEnemyCount: 2,
        playerDead: false,
        stageClearAlreadyStarted: false,
        remainingSeconds: 8,
      }),
    ).toBe(false)
  })

  it('予約spawnが残っている間はクリアしない（敵が一時0でも）', () => {
    expect(
      shouldHoldClearWhileSpawnsPending({
        remainingScheduledSpawns: 3,
        pendingWarningSpawns: 0,
        aliveEnemyCount: 0,
      }),
    ).toBe(true)
    expect(
      shouldClearFiniteWaveStage({
        allSpawnsFinished: false,
        aliveEnemyCount: 0,
        playerDead: false,
        stageClearAlreadyStarted: false,
        remainingSeconds: 12,
      }),
    ).toBe(false)
  })

  it('warning 中の予約が残っていればクリアしない', () => {
    expect(
      shouldHoldClearWhileSpawnsPending({
        remainingScheduledSpawns: 0,
        pendingWarningSpawns: 1,
        aliveEnemyCount: 0,
      }),
    ).toBe(true)
  })

  it('Player死亡時はクリアしない', () => {
    expect(
      shouldClearFiniteWaveStage({
        allSpawnsFinished: true,
        aliveEnemyCount: 0,
        playerDead: true,
        stageClearAlreadyStarted: false,
        remainingSeconds: 5,
      }),
    ).toBe(false)
  })

  it('Stage Clear要求は1回だけ（既に開始済みなら false）', () => {
    expect(
      shouldClearFiniteWaveStage({
        allSpawnsFinished: true,
        aliveEnemyCount: 0,
        playerDead: false,
        stageClearAlreadyStarted: true,
        remainingSeconds: 5,
      }),
    ).toBe(false)
  })

  it('スポーン完了かつ敵0ならホールドしない', () => {
    expect(
      shouldHoldClearWhileSpawnsPending({
        remainingScheduledSpawns: 0,
        pendingWarningSpawns: 0,
        aliveEnemyCount: 0,
      }),
    ).toBe(false)
  })
})
