/**
 * Tone.js オフライン SE 生成のメインパイプライン。
 *
 * 1. 置換対象の正式 SE を backups/<timestamp>/ へコピー
 * 2. Tone.Offline で WAV を生成 → ffmpeg で OGG
 * 3. 長さ・ピーク・末尾無音を検査
 * 4. 合格したものだけ public/assets/audio/ へコピー
 * 5. BGM が変わっていないことをハッシュで確認
 *
 * ゲーム本体（src/）からは一切 import されない。
 */

import 'web-audio-api/polyfill'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CATEGORY_HARD_MAX,
  PRESET_BY_ID,
  PROTECTED_BGM_FILES,
  SFX_PRESETS,
  type SfxPreset,
} from '../presets.ts'
import { schedulePreset } from './patches.ts'

const Tone = await import('tone')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TOOL_ROOT = path.resolve(__dirname, '..')
const REPO_ROOT = path.resolve(TOOL_ROOT, '../..')
const FORMAL_DIR = path.join(REPO_ROOT, 'public/assets/audio')
const OUTPUT_DIR = path.join(TOOL_ROOT, 'output')
const BACKUPS_DIR = path.join(TOOL_ROOT, 'backups')
const SAMPLE_RATE = 44100
const PEAK_LINEAR = 10 ** (-1 / 20)
const TRAILING_SILENCE_FAIL_MS = 80
const SILENCE_THRESHOLD = 0.0004

type ProbeResult = {
  duration: number
  channels: number
  maxVolumeDb: number
  trailingSilenceMs: number
}

type RowResult = {
  id: string
  preset: string
  oggName: string
  duration: number
  channels: number
  maxVolumeDb: number
  trailingSilenceMs: number
  ok: boolean
  errors: string[]
}

function assertFfmpeg() {
  const result = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' })
  if (result.status !== 0) {
    throw new Error('ffmpeg が必要です（brew install ffmpeg）')
  }
}

function peakNormalizeMono(channelData: Float32Array): Float32Array {
  let peak = 0
  for (let i = 0; i < channelData.length; i++) {
    const abs = Math.abs(channelData[i])
    if (abs > peak) peak = abs
  }
  const out = new Float32Array(channelData.length)
  if (peak < 1e-8) return out
  // ffmpeg の alimiter 後も -1dB を確実に超えないよう、正規化目標を少し下げる
  const scale = (PEAK_LINEAR * 0.97) / peak
  for (let i = 0; i < channelData.length; i++) {
    out[i] = Math.max(-1, Math.min(1, channelData[i] * scale))
  }
  return out
}

function trimTrailingSilence(samples: Float32Array): Float32Array {
  let end = samples.length - 1
  while (end > 0 && Math.abs(samples[end]) < SILENCE_THRESHOLD) {
    end -= 1
  }
  // 末尾にごく短い余韻（10ms）を残す
  const pad = Math.floor(SAMPLE_RATE * 0.01)
  const cut = Math.min(samples.length, end + 1 + pad)
  return samples.subarray(0, cut)
}

function measureTrailingSilenceMs(samples: Float32Array): number {
  let end = samples.length - 1
  while (end > 0 && Math.abs(samples[end]) < SILENCE_THRESHOLD) {
    end -= 1
  }
  const silentSamples = samples.length - 1 - end
  return (silentSamples / SAMPLE_RATE) * 1000
}

async function writeWavMono(filePath: string, samples: Float32Array, sampleRate: number) {
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
  await writeFile(filePath, buffer)
}

function wavToOgg(wavPath: string, oggPath: string) {
  const result = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-i',
      wavPath,
      '-af',
      'highpass=f=80,alimiter=limit=0.85:level=disabled',
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
    throw new Error(`ffmpeg failed for ${path.basename(wavPath)}:\n${(result.stderr || '').slice(-600)}`)
  }

  // 変換後ピークが -1dB を超えていたら減衰して再エンコード
  let probe = probePeakOnly(oggPath)
  if (probe > -1.0) {
    const reduceDb = -1.05 - probe
    const tmp = `${oggPath}.tmp.ogg`
    const fix = spawnSync(
      'ffmpeg',
      [
        '-y',
        '-i',
        oggPath,
        '-af',
        `volume=${reduceDb}dB`,
        '-c:a',
        'libvorbis',
        '-q:a',
        '5',
        tmp,
      ],
      { encoding: 'utf8' },
    )
    if (fix.status !== 0) {
      throw new Error(`peak fix failed: ${(fix.stderr || '').slice(-400)}`)
    }
    spawnSync('mv', [tmp, oggPath])
  }
}

function probePeakOnly(oggPath: string): number {
  const volProc = spawnSync(
    'ffmpeg',
    ['-i', oggPath, '-af', 'volumedetect', '-f', 'null', '-'],
    { encoding: 'utf8' },
  )
  let maxVolumeDb = -99
  for (const line of (volProc.stderr || '').split('\n')) {
    if (line.includes('max_volume:')) {
      maxVolumeDb = Number.parseFloat(line.split('max_volume:')[1].replace('dB', '').trim())
    }
  }
  return maxVolumeDb
}

function probeOgg(oggPath: string): ProbeResult {
  const durProc = spawnSync(
    'ffprobe',
    [
      '-v',
      'error',
      '-show_entries',
      'format=duration:stream=channels',
      '-of',
      'json',
      oggPath,
    ],
    { encoding: 'utf8' },
  )
  let duration = 0
  let channels = 1
  try {
    const json = JSON.parse(durProc.stdout || '{}')
    duration = Number.parseFloat(json.format?.duration ?? '0')
    channels = Number(json.streams?.[0]?.channels ?? 1)
  } catch {
    duration = Number.parseFloat(
      spawnSync(
        'ffprobe',
        ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', oggPath],
        { encoding: 'utf8' },
      ).stdout.trim(),
    )
  }

  const volProc = spawnSync(
    'ffmpeg',
    ['-i', oggPath, '-af', 'volumedetect', '-f', 'null', '-'],
    { encoding: 'utf8' },
  )
  let maxVolumeDb = -99
  for (const line of (volProc.stderr || '').split('\n')) {
    if (line.includes('max_volume:')) {
      maxVolumeDb = Number.parseFloat(line.split('max_volume:')[1].replace('dB', '').trim())
    }
  }

  // 末尾無音: デコードして測る
  const pcmPath = oggPath.replace(/\.ogg$/, '.probe.raw')
  spawnSync(
    'ffmpeg',
    ['-y', '-i', oggPath, '-f', 'f32le', '-ac', '1', '-ar', String(SAMPLE_RATE), pcmPath],
    { encoding: 'utf8' },
  )
  let trailingSilenceMs = 0
  if (existsSync(pcmPath)) {
    const raw = spawnSync('node', [
      '-e',
      `
      const fs=require('fs');
      const b=fs.readFileSync(${JSON.stringify(pcmPath)});
      const n=b.length/4;
      const thr=${SILENCE_THRESHOLD};
      let end=n-1;
      for(;end>0;end--){ if(Math.abs(b.readFloatLE(end*4))>=thr) break; }
      const ms=((n-1-end)/${SAMPLE_RATE})*1000;
      process.stdout.write(String(ms));
      `,
    ], { encoding: 'utf8' })
    trailingSilenceMs = Number.parseFloat(raw.stdout || '0')
    spawnSync('rm', ['-f', pcmPath])
  }

  return { duration, channels, maxVolumeDb, trailingSilenceMs }
}

function validateProbe(preset: SfxPreset, probe: ProbeResult): string[] {
  const errors: string[] = []
  if (probe.channels !== 1) {
    errors.push(`channels=${probe.channels} (mono 必須)`)
  }
  if (probe.maxVolumeDb > -1.0) {
    errors.push(`peak ${probe.maxVolumeDb.toFixed(2)} dB > -1 dB`)
  }
  if (probe.duration < preset.durationMin - 0.005) {
    errors.push(`duration ${probe.duration.toFixed(3)}s < min ${preset.durationMin}`)
  }
  if (probe.duration > preset.durationMax + 0.02) {
    errors.push(`duration ${probe.duration.toFixed(3)}s > max ${preset.durationMax}`)
  }
  const hardMax = CATEGORY_HARD_MAX[preset.category]
  if (hardMax != null && probe.duration > hardMax) {
    errors.push(`category hard max ${hardMax}s exceeded (${probe.duration.toFixed(3)}s)`)
  }
  if (probe.trailingSilenceMs >= TRAILING_SILENCE_FAIL_MS) {
    errors.push(`trailing silence ${probe.trailingSilenceMs.toFixed(0)}ms >= ${TRAILING_SILENCE_FAIL_MS}ms`)
  }
  return errors
}

async function backupFormalTargets(
  stamp: string,
  presets: SfxPreset[],
): Promise<string> {
  const backupRoot = path.join(BACKUPS_DIR, stamp)
  await mkdir(backupRoot, { recursive: true })
  for (const preset of presets) {
    const src = path.join(FORMAL_DIR, `${preset.id}.ogg`)
    if (existsSync(src)) {
      await copyFile(src, path.join(backupRoot, `${preset.id}.ogg`))
    }
  }
  await writeFile(
    path.join(backupRoot, 'manifest.json'),
    JSON.stringify(
      {
        createdAt: stamp,
        files: presets.map((p) => `${p.id}.ogg`),
        note: 'Formal SE backup before Tone.js generate:sfx',
      },
      null,
      2,
    ),
  )
  return backupRoot
}

async function snapshotBgmHashes(): Promise<Record<string, { sha256: string; size: number }>> {
  const out: Record<string, { sha256: string; size: number }> = {}
  for (const name of PROTECTED_BGM_FILES) {
    const p = path.join(FORMAL_DIR, name)
    if (!existsSync(p)) {
      throw new Error(`保護対象 BGM が見つかりません: ${name}`)
    }
    const buf = await readFile(p)
    out[name] = {
      sha256: createHash('sha256').update(buf).digest('hex'),
      size: buf.length,
    }
  }
  return out
}

function assertBgmUnchanged(
  before: Record<string, { sha256: string; size: number }>,
  after: Record<string, { sha256: string; size: number }>,
) {
  for (const name of PROTECTED_BGM_FILES) {
    if (before[name].sha256 !== after[name].sha256 || before[name].size !== after[name].size) {
      throw new Error(`BGM が変更されました（禁止）: ${name}`)
    }
  }
}

async function renderPreset(preset: SfxPreset): Promise<Float32Array> {
  if (preset.patch === 'copy_player_fire_power') {
    throw new Error('copy patch は render しない')
  }

  const buffer = await Tone.Offline(
    () => {
      schedulePreset(Tone, preset)
    },
    preset.renderSeconds,
    1,
    SAMPLE_RATE,
  )

  // Offline 後に durationTarget まで無音パッドしない。音の実長を優先し、
  // 短すぎる場合はパッチ側でノート長を伸ばす。
  const channel = buffer.getChannelData(0)
  const maxSamples = Math.floor(SAMPLE_RATE * Math.min(preset.durationMax + 0.05, preset.renderSeconds))
  const sliced = channel.subarray(0, Math.min(channel.length, maxSamples))
  const trimmed = trimTrailingSilence(sliced)
  return peakNormalizeMono(trimmed)
}

async function generateOne(preset: SfxPreset): Promise<{ oggPath: string; metaPath: string }> {
  const wavPath = path.join(OUTPUT_DIR, `${preset.id}.wav`)
  const oggPath = path.join(OUTPUT_DIR, `${preset.id}.ogg`)
  const metaPath = path.join(OUTPUT_DIR, `${preset.id}.json`)

  if (preset.patch === 'copy_player_fire_power') {
    const src = path.join(OUTPUT_DIR, 'player_fire_power.ogg')
    if (!existsSync(src)) {
      throw new Error('player_fire_power.ogg が先に必要です')
    }
    await copyFile(src, oggPath)
    await writeFile(
      metaPath,
      JSON.stringify(
        {
          id: preset.id,
          preset: preset.id,
          sourcePreset: 'player_fire_power',
          patch: preset.patch,
          purpose: preset.purpose,
          generatedAt: new Date().toISOString(),
          engine: 'tone-offline',
          toneVersion: Tone.version,
        },
        null,
        2,
      ),
    )
    return { oggPath, metaPath }
  }

  const samples = await renderPreset(preset)
  // 末尾無音チェック用に raw でも測る
  const trailingMs = measureTrailingSilenceMs(samples)
  if (trailingMs >= TRAILING_SILENCE_FAIL_MS) {
    // 既に trim しているので通常ここには来ない
  }

  await writeWavMono(wavPath, samples, SAMPLE_RATE)
  wavToOgg(wavPath, oggPath)
  await writeFile(
    metaPath,
    JSON.stringify(
      {
        id: preset.id,
        preset: preset.id,
        patch: preset.patch,
        purpose: preset.purpose,
        category: preset.category,
        design: {
          durationTarget: preset.durationTarget,
          gain: preset.gain,
          attack: preset.attack,
          release: preset.release,
          pitchHz: preset.pitchHz,
          filterHz: preset.filterHz,
          filterQ: preset.filterQ,
          noiseAmount: preset.noiseAmount,
          resonance: preset.resonance,
          distortion: preset.distortion,
          variation: preset.variation,
        },
        blurb: preset.blurb,
        generatedAt: new Date().toISOString(),
        engine: 'tone-offline',
        toneVersion: Tone.version,
        sampleRate: SAMPLE_RATE,
        channels: 1,
      },
      null,
      2,
    ),
  )
  return { oggPath, metaPath }
}

async function writeManifest(stamp: string, rows: RowResult[], backupRoot: string) {
  const manifest = {
    generatedAt: stamp,
    engine: 'tone-offline',
    toneVersion: Tone.version,
    backupDir: path.relative(REPO_ROOT, backupRoot),
    outputDir: path.relative(REPO_ROOT, OUTPUT_DIR),
    formalDir: path.relative(REPO_ROOT, FORMAL_DIR),
    presets: SFX_PRESETS.map((p) => ({
      id: p.id,
      purpose: p.purpose,
      category: p.category,
      patch: p.patch,
      ogg: `${p.id}.ogg`,
      blurb: p.blurb,
    })),
    results: rows,
  }
  await writeFile(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  await writeFile(path.join(TOOL_ROOT, 'manifest.json'), JSON.stringify(manifest, null, 2))
}

async function promoteToFormal(rows: RowResult[]) {
  for (const row of rows) {
    if (!row.ok) continue
    const src = path.join(OUTPUT_DIR, row.oggName)
    const dest = path.join(FORMAL_DIR, row.oggName)
    // BGM 名と衝突しないこと
    if ((PROTECTED_BGM_FILES as readonly string[]).includes(row.oggName)) {
      throw new Error(`BGM ファイル名へのコピーは禁止: ${row.oggName}`)
    }
    await copyFile(src, dest)
  }
}

async function main() {
  assertFfmpeg()
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19)

  await mkdir(OUTPUT_DIR, { recursive: true })
  await mkdir(BACKUPS_DIR, { recursive: true })

  // --only=id1,id2 で対象を限定（他の正式 SE を上書きしない）
  let onlyIds: string[] | null = null
  for (let index = 0; index < process.argv.length; index++) {
    const arg = process.argv[index]
    if (arg.startsWith('--only=')) {
      onlyIds = arg
        .slice('--only='.length)
        .split(',')
        .map((part) => part.trim())
        .filter((part) => part.length > 0)
    }
  }

  console.log('=== Tone.js SFX Designer ===')
  console.log(`Tone ${Tone.version}`)
  console.log(`Presets: ${SFX_PRESETS.length}`)
  if (onlyIds !== null) {
    console.log(`Only: ${onlyIds.join(', ')}`)
  }

  const bgmBefore = await snapshotBgmHashes()
  console.log('BGM hashes captured.')

  // power を先に、player_fire コピーは後
  let ordered = [
    ...SFX_PRESETS.filter((p) => p.patch !== 'copy_player_fire_power'),
    ...SFX_PRESETS.filter((p) => p.patch === 'copy_player_fire_power'),
  ]
  if (onlyIds !== null) {
    ordered = ordered.filter((preset) => onlyIds.includes(preset.id))
    if (ordered.length === 0) {
      throw new Error(`--only に一致するプリセットがありません: ${onlyIds.join(', ')}`)
    }
  }

  const backupRoot = await backupFormalTargets(stamp, ordered)
  console.log(`Backup: ${path.relative(REPO_ROOT, backupRoot)}`)

  const rows: RowResult[] = []
  for (const preset of ordered) {
    process.stdout.write(`generate ${preset.id} ... `)
    try {
      await generateOne(preset)
      const oggPath = path.join(OUTPUT_DIR, `${preset.id}.ogg`)
      const probe = probeOgg(oggPath)
      const errors = validateProbe(preset, probe)
      const row: RowResult = {
        id: preset.id,
        preset: preset.id,
        oggName: `${preset.id}.ogg`,
        duration: probe.duration,
        channels: probe.channels,
        maxVolumeDb: probe.maxVolumeDb,
        trailingSilenceMs: probe.trailingSilenceMs,
        ok: errors.length === 0,
        errors,
      }
      rows.push(row)
      if (row.ok) {
        console.log(`OK  ${probe.duration.toFixed(3)}s  peak ${probe.maxVolumeDb.toFixed(1)} dB`)
      } else {
        console.log(`FAIL  ${errors.join('; ')}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      rows.push({
        id: preset.id,
        preset: preset.id,
        oggName: `${preset.id}.ogg`,
        duration: 0,
        channels: 0,
        maxVolumeDb: -99,
        trailingSilenceMs: 0,
        ok: false,
        errors: [message],
      })
      console.log(`ERROR  ${message}`)
    }
  }

  await writeManifest(stamp, rows, backupRoot)

  const failed = rows.filter((r) => !r.ok)
  if (failed.length > 0) {
    console.error('\n=== QC FAILED — formal へはコピーしません ===')
    for (const f of failed) {
      console.error(`- ${f.oggName}: ${f.errors.join('; ')}`)
    }
    process.exitCode = 1
  } else {
    console.log('\nQC passed. Promoting to public/assets/audio/ ...')
    await promoteToFormal(rows)
    console.log('Formal SE updated.')
  }

  const bgmAfter = await snapshotBgmHashes()
  assertBgmUnchanged(bgmBefore, bgmAfter)
  console.log('BGM unchanged: OK')

  console.log('\n=== SE report ===')
  console.log(
    `${'file'.padEnd(28)} ${'sec'.padStart(8)} ${'ch'.padStart(4)} ${'peak_dB'.padStart(10)} ${'trail_ms'.padStart(10)} ${'status'.padStart(8)}`,
  )
  for (const row of rows) {
    console.log(
      `${row.oggName.padEnd(28)} ${row.duration.toFixed(4).padStart(8)} ${String(row.channels).padStart(4)} ${row.maxVolumeDb.toFixed(1).padStart(10)} ${row.trailingSilenceMs.toFixed(0).padStart(10)} ${(row.ok ? 'OK' : 'FAIL').padStart(8)}`,
    )
  }

  console.log('\n=== element design ===')
  for (const id of [
    'player_fire_power',
    'player_fire_wind',
    'player_fire_water',
    'player_fire_fire',
    'player_fire_earth',
  ]) {
    const p = PRESET_BY_ID[id]
    console.log(`- ${id.replace('player_fire_', '')}: ${p.blurb}`)
  }

  console.log(`\nBackup: ${path.relative(REPO_ROOT, backupRoot)}`)
  console.log(`Output: ${path.relative(REPO_ROOT, OUTPUT_DIR)}`)
  if (failed.length === 0) {
    console.log('Done.')
  } else {
    console.log('Done with failures (formal not updated).')
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
