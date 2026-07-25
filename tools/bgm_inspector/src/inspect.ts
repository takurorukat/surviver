/**
 * ループ BGM の無音区間・ループ境界候補を非破壊で調査する CLI。
 * ファイルの読み取りと stdout 出力のみ。OGG の書き換えはしない。
 */

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TOOL_ROOT = path.resolve(__dirname, '..')
const REPO_ROOT = path.resolve(TOOL_ROOT, '../..')
const AUDIO_DIR = path.join(REPO_ROOT, 'public/assets/audio')

/** 調査対象（依頼指定の 5 曲） */
const TARGET_BGMS = [
  { id: 'title', file: 'title_bgm.ogg', cacheKey: 'bgm-title' },
  { id: 'plains', file: 'plains_bgm.ogg', cacheKey: 'bgm' },
  { id: 'forest', file: 'forest_bgm.ogg', cacheKey: 'bgm-forest' },
  { id: 'volcano', file: 'volcano_bgm.ogg', cacheKey: 'bgm-volcano' },
  { id: 'ruins', file: 'ruins_bgm.ogg', cacheKey: 'bgm-ruins' },
] as const

/** dBFS 以下を無音とみなすしきい値 */
const SILENCE_THRESHOLD_DB = -45
/** 解析用サンプルレート */
const ANALYSIS_SAMPLE_RATE = 22050
/** 先頭/末尾を走査する最大秒数 */
const EDGE_SCAN_SECONDS = 8
/** ループ境界候補として末尾/先頭を比較する秒数 */
const LOOP_COMPARE_SECONDS = 0.35
/** ウィンドウ RMS の長さ（秒） */
const WINDOW_SECONDS = 0.02

type SilenceRegion = {
  startSec: number
  endSec: number
  durationSec: number
}

type BgmAnalysis = {
  id: string
  file: string
  cacheKey: string
  path: string
  durationSec: number
  sampleRate: number
  leadingSilenceSec: number
  trailingSilenceSec: number
  firstSoundSec: number
  lastSoundSec: number
  silenceRegions: SilenceRegion[]
  loopCompareRmsDiffDb: number | null
  suggestedLoopStartSec: number | null
  suggestedLoopEndSec: number | null
  metadataReady: boolean
}

function checkCommand(name: string, args: string[]): boolean {
  const result = spawnSync(name, args, { encoding: 'utf8' })
  return !result.error && result.status === 0
}

function decodeToMonoPcm(filePath: string): { samples: Float32Array; sampleRate: number } | null {
  const args = [
    '-hide_banner',
    '-loglevel',
    'error',
    '-i',
    filePath,
    '-ac',
    '1',
    '-ar',
    String(ANALYSIS_SAMPLE_RATE),
    '-f',
    'f32le',
    'pipe:1',
  ]
  const result = spawnSync('ffmpeg', args, { encoding: 'buffer', maxBuffer: 1024 * 1024 * 256 })
  if (result.error || result.status !== 0 || result.stdout.length === 0) {
    return null
  }
  const byteLength = result.stdout.length - (result.stdout.length % 4)
  const samples = new Float32Array(
    result.stdout.buffer,
    result.stdout.byteOffset,
    byteLength / 4,
  )
  return { samples, sampleRate: ANALYSIS_SAMPLE_RATE }
}

function linearToDb(value: number): number {
  const abs = Math.abs(value)
  if (abs <= 1e-9) {
    return -120
  }
  return 20 * Math.log10(abs)
}

function windowRmsDb(samples: Float32Array, startIndex: number, windowSize: number): number {
  const end = Math.min(samples.length, startIndex + windowSize)
  if (end <= startIndex) {
    return -120
  }
  let sum = 0
  for (let i = startIndex; i < end; i++) {
    const v = samples[i]
    sum = sum + v * v
  }
  const rms = Math.sqrt(sum / (end - startIndex))
  return linearToDb(rms)
}

function isSilentWindow(samples: Float32Array, startIndex: number, windowSize: number): boolean {
  return windowRmsDb(samples, startIndex, windowSize) <= SILENCE_THRESHOLD_DB
}

function measureLeadingSilence(samples: Float32Array, sampleRate: number): number {
  const windowSize = Math.max(1, Math.floor(sampleRate * WINDOW_SECONDS))
  const maxIndex = Math.min(samples.length, Math.floor(sampleRate * EDGE_SCAN_SECONDS))
  let index = 0
  while (index < maxIndex) {
    if (!isSilentWindow(samples, index, windowSize)) {
      break
    }
    index = index + windowSize
  }
  return index / sampleRate
}

function measureTrailingSilence(samples: Float32Array, sampleRate: number): number {
  const windowSize = Math.max(1, Math.floor(sampleRate * WINDOW_SECONDS))
  const minIndex = Math.max(0, samples.length - Math.floor(sampleRate * EDGE_SCAN_SECONDS))
  let index = samples.length - windowSize
  while (index >= minIndex) {
    if (!isSilentWindow(samples, index, windowSize)) {
      break
    }
    index = index - windowSize
  }
  const lastSoundIndex = Math.min(samples.length - 1, index + windowSize)
  return (samples.length - lastSoundIndex) / sampleRate
}

function findLastSoundSec(samples: Float32Array, sampleRate: number): number {
  const windowSize = Math.max(1, Math.floor(sampleRate * WINDOW_SECONDS))
  for (let index = samples.length - windowSize; index >= 0; index = index - windowSize) {
    if (!isSilentWindow(samples, index, windowSize)) {
      return (index + windowSize) / sampleRate
    }
  }
  return 0
}

function findSilenceRegions(samples: Float32Array, sampleRate: number): SilenceRegion[] {
  const windowSize = Math.max(1, Math.floor(sampleRate * WINDOW_SECONDS))
  const regions: SilenceRegion[] = []
  let inSilence = false
  let regionStartIndex = 0

  for (let index = 0; index < samples.length; index = index + windowSize) {
    const silent = isSilentWindow(samples, index, windowSize)
    if (silent && !inSilence) {
      inSilence = true
      regionStartIndex = index
    }
    if (!silent && inSilence) {
      inSilence = false
      const startSec = regionStartIndex / sampleRate
      const endSec = index / sampleRate
      const durationSec = endSec - startSec
      if (durationSec >= 0.05) {
        regions.push({ startSec, endSec, durationSec })
      }
    }
  }

  if (inSilence) {
    const startSec = regionStartIndex / sampleRate
    const endSec = samples.length / sampleRate
    const durationSec = endSec - startSec
    if (durationSec >= 0.05) {
      regions.push({ startSec, endSec, durationSec })
    }
  }

  return regions
}

function compareLoopBoundary(samples: Float32Array, sampleRate: number, durationSec: number): number | null {
  const compareSamples = Math.floor(sampleRate * LOOP_COMPARE_SECONDS)
  if (compareSamples <= 0 || samples.length < compareSamples * 2) {
    return null
  }

  const tailStart = Math.max(0, Math.floor(durationSec * sampleRate) - compareSamples)
  const headStart = 0

  let tailEnergy = 0
  let headEnergy = 0
  for (let i = 0; i < compareSamples; i++) {
    const tailValue = samples[tailStart + i] ?? 0
    const headValue = samples[headStart + i] ?? 0
    tailEnergy = tailEnergy + tailValue * tailValue
    headEnergy = headEnergy + headValue * headValue
  }

  const tailRmsDb = linearToDb(Math.sqrt(tailEnergy / compareSamples))
  const headRmsDb = linearToDb(Math.sqrt(headEnergy / compareSamples))
  return Math.abs(tailRmsDb - headRmsDb)
}

function analyzeBgm(entry: (typeof TARGET_BGMS)[number]): BgmAnalysis | null {
  const filePath = path.join(AUDIO_DIR, entry.file)
  if (!existsSync(filePath)) {
    console.error(`MISSING: ${filePath}`)
    return null
  }

  const probe = spawnSync(
    'ffprobe',
    [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      filePath,
    ],
    { encoding: 'utf8' },
  )
  const durationSec = Number.parseFloat((probe.stdout || '').trim())
  if (!Number.isFinite(durationSec)) {
    console.error(`DURATION ERROR: ${entry.file}`)
    return null
  }

  const decoded = decodeToMonoPcm(filePath)
  if (decoded === null) {
    console.error(`DECODE ERROR: ${entry.file}`)
    return null
  }

  const { samples, sampleRate } = decoded
  const leadingSilenceSec = measureLeadingSilence(samples, sampleRate)
  const trailingSilenceSec = measureTrailingSilence(samples, sampleRate)
  const firstSoundSec = leadingSilenceSec
  const lastSoundSec = findLastSoundSec(samples, sampleRate)
  const silenceRegions = findSilenceRegions(samples, sampleRate)
  const loopCompareRmsDiffDb = compareLoopBoundary(samples, sampleRate, durationSec)

  // 候補値は参考表示のみ。metadataReady=false のまま本番設定には入れない。
  const suggestedLoopStartSec =
    leadingSilenceSec > 0.02 ? roundSec(firstSoundSec) : null
  const suggestedLoopEndSec =
    trailingSilenceSec > 0.02 ? roundSec(lastSoundSec) : null

  return {
    id: entry.id,
    file: entry.file,
    cacheKey: entry.cacheKey,
    path: filePath,
    durationSec,
    sampleRate,
    leadingSilenceSec,
    trailingSilenceSec,
    firstSoundSec,
    lastSoundSec,
    silenceRegions,
    loopCompareRmsDiffDb,
    suggestedLoopStartSec,
    suggestedLoopEndSec,
    metadataReady: false,
  }
}

function roundSec(value: number): number {
  return Math.round(value * 1000) / 1000
}

function formatSec(value: number): string {
  return `${roundSec(value).toFixed(3)}s`
}

function printReport(results: BgmAnalysis[]): void {
  console.log('=== BGM Inspector（非破壊） ===')
  console.log(`対象: ${AUDIO_DIR}`)
  console.log(`無音しきい値: ${SILENCE_THRESHOLD_DB} dBFS`)
  console.log('※ suggestedLoop* は参考値。本番 metadata には未検証の推測値を入れない。\n')

  for (const item of results) {
    console.log(`--- ${item.id} (${item.file}) ---`)
    console.log(`  cache key   : ${item.cacheKey}`)
    console.log(`  duration    : ${formatSec(item.durationSec)}`)
    console.log(`  leading     : ${formatSec(item.leadingSilenceSec)} (first sound @ ${formatSec(item.firstSoundSec)})`)
    console.log(`  trailing    : ${formatSec(item.trailingSilenceSec)} (last sound @ ${formatSec(item.lastSoundSec)})`)
    if (item.loopCompareRmsDiffDb !== null) {
      console.log(
        `  loop seam   : tail/head RMS diff ${item.loopCompareRmsDiffDb.toFixed(1)} dB (lower = smoother)`,
      )
    }
    const longSilences = item.silenceRegions.filter((r) => r.durationSec >= 0.15)
    if (longSilences.length > 0) {
      console.log('  silence >150ms:')
      for (const region of longSilences.slice(0, 6)) {
        console.log(
          `    ${formatSec(region.startSec)} – ${formatSec(region.endSec)} (${formatSec(region.durationSec)})`,
        )
      }
    } else {
      console.log('  silence >150ms: (none detected)')
    }
    if (item.suggestedLoopStartSec !== null || item.suggestedLoopEndSec !== null) {
      console.log(
        `  suggested   : loopStart=${item.suggestedLoopStartSec ?? '—'} loopEnd=${item.suggestedLoopEndSec ?? '—'} (REFERENCE ONLY)`,
      )
    }
    console.log(`  metadataReady: ${item.metadataReady}`)
    console.log('')
  }

  console.log('次のステップ（TODO）:')
  console.log('  1. game_music_generator で「イントロ + シームレスループ区間」を明示生成')
  console.log('  2. 生成 JSON に loopStart / loopEnd / introEnd を記録')
  console.log('  3. 耳確認後のみ src/games/survivor/constants/bgmLoop.ts へ反映')
  console.log('')
}

function main(): number {
  if (!checkCommand('ffmpeg', ['-version'])) {
    console.error('ffmpeg が必要です: brew install ffmpeg')
    return 1
  }
  if (!checkCommand('ffprobe', ['-version'])) {
    console.error('ffprobe が必要です（ffmpeg に同梱）')
    return 1
  }

  const results: BgmAnalysis[] = []
  for (const entry of TARGET_BGMS) {
    const analysis = analyzeBgm(entry)
    if (analysis !== null) {
      results.push(analysis)
    }
  }

  if (results.length === 0) {
    console.error('解析対象がありません')
    return 1
  }

  printReport(results)
  return 0
}

process.exit(main())
