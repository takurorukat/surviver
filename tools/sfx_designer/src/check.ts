/**
 * 非破壊の事前検査（--check）。
 * 音声生成・バックアップ・正式 OGG の読み書きは一切しない。
 */

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { MANIFEST_ENTRIES, MANIFEST_META } from '../manifest.ts'
import {
  PRESET_BY_ID,
  PROTECTED_BGM_FILES,
  SFX_PRESETS,
} from '../presets.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TOOL_ROOT = path.resolve(__dirname, '..')
const REPO_ROOT = path.resolve(TOOL_ROOT, '../..')
const FORMAL_DIR = path.join(REPO_ROOT, 'public/assets/audio')
const OUTPUT_DIR = path.join(TOOL_ROOT, 'output')
const BACKUPS_DIR = path.join(TOOL_ROOT, 'backups')

/** patches.ts の case + generate 側のコピー専用 */
const KNOWN_PATCHES = new Set([
  'power_fire',
  'power_hit',
  'wind_fire',
  'wind_hit',
  'water_fire',
  'water_hit',
  'fire_fire',
  'fire_hit',
  'earth_fire',
  'earth_hit',
  'ice_obtain',
  'ice_hit',
  'ice_shatter',
  'enemy_defeat',
  'enemy_hit',
  'enemy_blocked',
  'coin_pickup',
  'player_hurt',
  'menu_move',
  'menu_cancel',
  'shop_purchase',
  'level_up',
  'stage_clear',
  'area_clear',
  'game_over',
  'copy_player_fire_power',
])

function checkCommand(name: string, args: string[]): { ok: boolean; detail: string } {
  const result = spawnSync(name, args, { encoding: 'utf8' })
  if (result.error || result.status !== 0) {
    return { ok: false, detail: result.error?.message || `exit ${result.status}` }
  }
  const first = (result.stdout || result.stderr || '').split('\n')[0]?.trim() || 'ok'
  return { ok: true, detail: first.slice(0, 80) }
}

export async function runCheck(): Promise<number> {
  const errors: string[] = []
  const notes: string[] = []

  console.log('=== SFX Designer --check（非破壊） ===')
  console.log('正式 OGG / BGM / バックアップ / 音声削除は行いません。\n')

  // 1. 必要条件
  const nodeV = process.versions.node
  console.log(`Node: ${nodeV}`)
  const npm = checkCommand('npm', ['--version'])
  console.log(`npm: ${npm.ok ? npm.detail : 'MISSING'}`)
  if (!npm.ok) errors.push('npm が見つかりません')

  const ffmpeg = checkCommand('ffmpeg', ['-version'])
  console.log(`ffmpeg: ${ffmpeg.ok ? ffmpeg.detail : 'MISSING'}`)
  if (!ffmpeg.ok) errors.push('ffmpeg が必要です（brew install ffmpeg）')

  const ffprobe = checkCommand('ffprobe', ['-version'])
  console.log(`ffprobe: ${ffprobe.ok ? ffprobe.detail : 'MISSING'}`)
  if (!ffprobe.ok) errors.push('ffprobe が必要です（ffmpeg に同梱）')

  // Tone は生成時のみ。検査では package の存在だけ見る（import しない＝IPC 問題を避ける）
  const tonePkg = path.join(TOOL_ROOT, 'node_modules/tone/package.json')
  const tsxPkg = path.join(TOOL_ROOT, 'node_modules/tsx/package.json')
  if (!existsSync(tonePkg)) {
    errors.push('tools/sfx_designer/node_modules/tone が未インストール（cd tools/sfx_designer && npm install）')
  } else {
    console.log('tone package: present')
  }
  if (!existsSync(tsxPkg)) {
    notes.push('tsx 未インストール。生成時に必要（npm install in tools/sfx_designer）')
  } else {
    console.log('tsx package: present')
  }

  // 2. パス
  console.log(`\nRepo root:     ${REPO_ROOT}`)
  console.log(`Formal audio:  ${path.relative(REPO_ROOT, FORMAL_DIR)}/  （--check では変更しない）`)
  console.log(`Output dir:    ${path.relative(REPO_ROOT, OUTPUT_DIR)}/  （生成時のみ使用）`)
  console.log(`Backups dir:   ${path.relative(REPO_ROOT, BACKUPS_DIR)}/  （生成時のみ使用）`)

  // 3. presets ↔ manifest 整合
  if (SFX_PRESETS.length === 0) errors.push('SFX_PRESETS が空です')
  if (MANIFEST_ENTRIES.length !== SFX_PRESETS.length) {
    errors.push(
      `manifest 件数 ${MANIFEST_ENTRIES.length} ≠ presets ${SFX_PRESETS.length}`,
    )
  }

  const seenIds = new Set<string>()
  for (const preset of SFX_PRESETS) {
    if (seenIds.has(preset.id)) errors.push(`重複 preset id: ${preset.id}`)
    seenIds.add(preset.id)

    if (!KNOWN_PATCHES.has(preset.patch)) {
      errors.push(`${preset.id}: 未知の patch "${preset.patch}"`)
    }
    if (preset.durationMin > preset.durationMax) {
      errors.push(`${preset.id}: durationMin > durationMax`)
    }
    if (preset.renderSeconds < preset.durationMax) {
      errors.push(`${preset.id}: renderSeconds < durationMax`)
    }

    const oggName = `${preset.id}.ogg`
    if ((PROTECTED_BGM_FILES as readonly string[]).includes(oggName)) {
      errors.push(`${preset.id}: BGM ファイル名が生成対象になっている（禁止）`)
    }

    const entry = MANIFEST_ENTRIES.find((e) => e.id === preset.id)
    if (!entry) {
      errors.push(`${preset.id}: manifest に無い`)
    } else if (entry.fileName !== oggName) {
      errors.push(`${preset.id}: manifest.fileName 不一致`)
    } else if (entry.patch !== preset.patch) {
      errors.push(`${preset.id}: manifest.patch 不一致`)
    }
  }

  for (const entry of MANIFEST_ENTRIES) {
    if (!PRESET_BY_ID[entry.id]) {
      errors.push(`manifest のみ存在: ${entry.id}`)
    }
  }

  // 4. BGM が対象外であること
  console.log('\nProtected BGM (never generated):')
  for (const name of PROTECTED_BGM_FILES) {
    console.log(`  - ${name}`)
    if (seenIds.has(name.replace(/\.ogg$/, ''))) {
      errors.push(`BGM id が SE プリセットに含まれる: ${name}`)
    }
  }
  console.log(`Manifest meta engine: ${MANIFEST_META.engine}`)

  // 5. まとめ
  console.log(`\nPresets: ${SFX_PRESETS.length}`)
  if (notes.length > 0) {
    console.log('\nNotes:')
    for (const n of notes) console.log(`  - ${n}`)
  }

  if (errors.length > 0) {
    console.error('\nCHECK FAILED:')
    for (const e of errors) console.error(`  - ${e}`)
    return 1
  }

  console.log('\nCHECK PASSED（非破壊・正式 SE 未変更）')
  console.log('実際の更新: npm run generate:sfx')
  console.log('（更新前に backups/<timestamp>/ が作られます。BGM は対象外です）')
  return 0
}
