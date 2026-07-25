/**
 * Tone.js オフライン試作ジェネレータ
 *
 * - ゲーム本体には依存しない（このディレクトリ専用の node_modules）
 * - 出力は public/assets/audio/candidates/ のみ
 * - 正式 OGG（public/assets/audio/*.ogg）は上書きしない
 */

import 'web-audio-api/polyfill'
import { createRequire } from 'node:module'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { ELEMENT_BLURBS, ELEMENT_SCHEDULES } from './elements.mjs'

const Tone = await import('tone')
const require = createRequire(import.meta.url)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TOOL_ROOT = path.resolve(__dirname, '..')
const REPO_ROOT = path.resolve(TOOL_ROOT, '../..')
const CANDIDATES_DIR = path.join(REPO_ROOT, 'public/assets/audio/candidates')
const FORMAL_DIR = path.join(REPO_ROOT, 'public/assets/audio')
const WORK_DIR = path.join(TOOL_ROOT, 'output')
const SAMPLE_RATE = 44100
const PEAK_LINEAR = 10 ** (-1 / 20)

const JOBS = [
  { id: 'player_fire_power', element: 'power', kind: 'fire' },
  { id: 'player_hit_power', element: 'power', kind: 'hit' },
  { id: 'player_fire_wind', element: 'wind', kind: 'fire' },
  { id: 'player_hit_wind', element: 'wind', kind: 'hit' },
  { id: 'player_fire_water', element: 'water', kind: 'fire' },
  { id: 'player_hit_water', element: 'water', kind: 'hit' },
  { id: 'player_fire_fire', element: 'fire', kind: 'fire' },
  { id: 'player_hit_fire', element: 'fire', kind: 'hit' },
  { id: 'player_fire_earth', element: 'earth', kind: 'fire' },
  { id: 'player_hit_earth', element: 'earth', kind: 'hit' },
]

function assertFfmpeg() {
  const result = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' })
  if (result.status !== 0) {
    throw new Error('ffmpeg が必要です（brew install ffmpeg）')
  }
}

function peakNormalizeMono(channelData) {
  let peak = 0
  for (let i = 0; i < channelData.length; i++) {
    const abs = Math.abs(channelData[i])
    if (abs > peak) peak = abs
  }
  const out = new Float32Array(channelData.length)
  if (peak < 1e-8) {
    return { samples: out, peakBefore: 0 }
  }
  const scale = PEAK_LINEAR / peak
  for (let i = 0; i < channelData.length; i++) {
    out[i] = Math.max(-1, Math.min(1, channelData[i] * scale))
  }
  return { samples: out, peakBefore: peak }
}

function writeWavMono(filePath, samples, sampleRate) {
  const dataSize = samples.length * 2
  const buffer = Buffer.alloc(44 + dataSize)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    buffer.writeInt16LE((s * 32767) | 0, 44 + i * 2)
  }
  return writeFile(filePath, buffer)
}

function wavToOgg(wavPath, oggPath) {
  const result = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-i',
      wavPath,
      '-af',
      'silenceremove=start_periods=0:stop_periods=-1:stop_duration=0.01:stop_threshold=-50dB,alimiter=limit=0.8913:level=disabled',
      '-ar',
      String(SAMPLE_RATE),
      '-ac',
      '1',
      '-c:a',
      'libvorbis',
      '-q:a',
      '5',
      oggPath,
    ],
    { encoding: 'utf8' },
  )
  if (result.status !== 0) {
    throw new Error(`ffmpeg failed for ${path.basename(wavPath)}:\n${result.stderr.slice(-600)}`)
  }
}

function probeOgg(oggPath) {
  const durProc = spawnSync(
    'ffprobe',
    [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      oggPath,
    ],
    { encoding: 'utf8' },
  )
  const duration = Number.parseFloat(durProc.stdout.trim())
  const volProc = spawnSync(
    'ffmpeg',
    ['-i', oggPath, '-af', 'volumedetect', '-f', 'null', '-'],
    { encoding: 'utf8' },
  )
  let maxVolume = null
  for (const line of (volProc.stderr || '').split('\n')) {
    if (line.includes('max_volume:')) {
      maxVolume = Number.parseFloat(line.split('max_volume:')[1].replace('dB', '').trim())
    }
  }
  return { duration, maxVolume }
}

function assertNotFormalOverwrite(candidatePath) {
  const base = path.basename(candidatePath)
  const formalPath = path.join(FORMAL_DIR, base)
  // candidates 配下への出力のみ許可。正式ディレクトリ直下へは書かない。
  if (!candidatePath.startsWith(CANDIDATES_DIR + path.sep) && candidatePath !== CANDIDATES_DIR) {
    throw new Error(`安全のため candidates 以外への出力を拒否: ${candidatePath}`)
  }
  if (path.dirname(candidatePath) === FORMAL_DIR) {
    throw new Error(`正式 OGG を上書きしようとしました: ${formalPath}`)
  }
}

async function renderJob(job) {
  const schedule = ELEMENT_SCHEDULES[job.element]
  let scheduledSeconds = 0.1
  const renderSeconds = job.kind === 'fire' ? 0.12 : 0.1

  const buffer = await Tone.Offline(
    () => {
      scheduledSeconds = schedule(Tone, job.kind)
    },
    renderSeconds,
    1,
    SAMPLE_RATE,
  )

  const channel = buffer.getChannelData(0)
  // 実際に音がある末尾をざっくり残しつつ max 長に収める
  const maxSamples = Math.floor(SAMPLE_RATE * Math.min(scheduledSeconds + 0.02, renderSeconds))
  const sliced = channel.subarray(0, Math.min(channel.length, maxSamples))
  const { samples } = peakNormalizeMono(sliced)

  const wavPath = path.join(WORK_DIR, `${job.id}.wav`)
  const oggPath = path.join(CANDIDATES_DIR, `${job.id}.ogg`)
  assertNotFormalOverwrite(oggPath)
  await writeWavMono(wavPath, samples, SAMPLE_RATE)
  wavToOgg(wavPath, oggPath)
  const probe = probeOgg(oggPath)
  return {
    id: job.id,
    element: job.element,
    kind: job.kind,
    path: path.relative(REPO_ROOT, oggPath),
    ...probe,
  }
}

async function snapshotFormalHashes() {
  const hashes = {}
  for (const job of JOBS) {
    const formal = path.join(FORMAL_DIR, `${job.id}.ogg`)
    if (existsSync(formal)) {
      const buf = await readFile(formal)
      hashes[job.id] = require('node:crypto').createHash('sha256').update(buf).digest('hex')
    }
  }
  return hashes
}

async function main() {
  assertFfmpeg()
  await mkdir(CANDIDATES_DIR, { recursive: true })
  await mkdir(WORK_DIR, { recursive: true })

  const before = await snapshotFormalHashes()
  console.log('=== Tone.js SFX Designer (prototype) ===')
  console.log(`Tone ${Tone.version}`)
  console.log(`Output: ${path.relative(REPO_ROOT, CANDIDATES_DIR)}/`)
  console.log('Formal OGGs will NOT be overwritten.\n')

  const rows = []
  for (const job of JOBS) {
    const row = await renderJob(job)
    rows.push(row)
    console.log(
      `wrote ${row.path}  ${row.duration?.toFixed(4)}s  peak ${row.maxVolume?.toFixed(1)} dB`,
    )
  }

  const after = await snapshotFormalHashes()
  for (const id of Object.keys(before)) {
    if (before[id] !== after[id]) {
      throw new Error(`正式ファイルが変化しました（禁止）: ${id}.ogg`)
    }
  }

  console.log('\n=== durations & peaks (candidates only) ===')
  console.log(`${'file'.padEnd(28)} ${'sec'.padStart(8)} ${'peak_dB'.padStart(10)}`)
  for (const row of rows) {
    console.log(
      `${`${row.id}.ogg`.padEnd(28)} ${row.duration.toFixed(4).padStart(8)} ${row.maxVolume.toFixed(1).padStart(10)}`,
    )
  }

  console.log('\n=== element design notes ===')
  for (const [element, blurb] of Object.entries(ELEMENT_BLURBS)) {
    console.log(`- ${element}: ${blurb}`)
  }

  console.log('\nFormal OGG hashes unchanged: OK')
  console.log('Done. Listen via Settings → SFX Preview → Synth Candidates if wired,')
  console.log('or open the candidate ogg files directly.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
