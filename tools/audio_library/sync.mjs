#!/usr/bin/env node

/**
 * CC0 音声ライブラリから、試聴・採用候補を同期する開発用スクリプト。
 * 既存の正式SE/BGMは上書きしない。採用は手動試聴後に定数のパスを切り替える。
 *
 * - 採用済み／Runtime参照候補 → public/assets/audio/library/kenney/
 * - 未採用の試聴専用候補 → tools/audio_library/candidates/（Production に載せない）
 */
import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, copyFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const libraryDirectory = new URL('../../public/assets/audio/library/kenney/', import.meta.url)
const candidatesDirectory = new URL('./candidates/', import.meta.url)
const licensesDirectory = new URL('../../public/assets/audio/licenses/', import.meta.url)

/** @typedef {'public' | 'candidates'} SyncDestination */

const packs = [
  {
    id: 'rpg-audio',
    url: 'https://kenney.nl/media/pages/assets/rpg-audio/8e99002d76-1677590336/kenney_rpg-audio.zip',
    files: [
      // Runtime 採用済み
      ['Audio/handleCoins.ogg', 'coin_pickup_candidate.ogg', 'public'],
      // 未採用（試聴専用・Production 外）
      ['Audio/drawKnife1.ogg', 'physical_fire_candidate.ogg', 'candidates'],
      ['Audio/knifeSlice.ogg', 'physical_hit_candidate.ogg', 'candidates'],
      ['Audio/metalClick.ogg', 'blocked_candidate.ogg', 'candidates'],
    ],
  },
  {
    id: 'impact-sounds',
    url: 'https://kenney.nl/media/pages/assets/impact-sounds/87b4ddecda-1677589768/kenney_impact-sounds.zip',
    files: [
      ['Audio/impactPunch_medium_001.ogg', 'enemy_hit_candidate.ogg', 'public'],
      ['Audio/impactWood_heavy_002.ogg', 'enemy_defeat_candidate.ogg', 'public'],
      ['Audio/impactMetal_light_003.ogg', 'blocked_metal_candidate.ogg', 'public'],
      ['Audio/impactMining_001.ogg', 'earth_hit_candidate.ogg', 'public'],
    ],
  },
  {
    id: 'interface-sounds',
    url: 'https://kenney.nl/media/pages/assets/interface-sounds/fa43c1dd4d-1677589452/kenney_interface-sounds.zip',
    files: [
      ['Audio/select_003.ogg', 'menu_move_candidate.ogg', 'public'],
      ['Audio/back_002.ogg', 'menu_cancel_candidate.ogg', 'public'],
      ['Audio/confirmation_002.ogg', 'purchase_candidate.ogg', 'public'],
      ['Audio/maximize_003.ogg', 'level_up_candidate.ogg', 'public'],
    ],
  },
]

async function download(url, destination) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${url}`)
  }
  await writeFile(destination, new Uint8Array(await response.arrayBuffer()))
}

function resolveDestinationDirectory(destination) {
  if (destination === 'candidates') {
    return candidatesDirectory
  }
  return libraryDirectory
}

async function main() {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'survivor-audio-library-'))
  try {
    await mkdir(libraryDirectory, { recursive: true })
    await mkdir(candidatesDirectory, { recursive: true })
    await mkdir(licensesDirectory, { recursive: true })
    for (const pack of packs) {
      const archivePath = join(temporaryDirectory, `${pack.id}.zip`)
      const extractedDirectory = join(temporaryDirectory, pack.id)
      await download(pack.url, archivePath)
      await mkdir(extractedDirectory)
      execFileSync('unzip', ['-qq', archivePath, '-d', extractedDirectory])
      for (const [sourcePath, targetName, destination] of pack.files) {
        const targetDirectory = resolveDestinationDirectory(destination)
        await copyFile(join(extractedDirectory, sourcePath), new URL(targetName, targetDirectory))
      }
      await copyFile(
        join(extractedDirectory, 'License.txt'),
        new URL(`kenney-${pack.id}-CC0.txt`, licensesDirectory),
      )
    }
    console.log('Kenney CC0 candidate audio synchronized.')
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true })
  }
}

void main()
