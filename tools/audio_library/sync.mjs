#!/usr/bin/env node

/**
 * CC0 音声ライブラリから、試聴・採用候補を同期する開発用スクリプト。
 * 既存の正式SE/BGMは上書きしない。採用は手動試聴後に定数のパスを切り替える。
 */
import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, copyFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const libraryDirectory = new URL('../../public/assets/audio/library/kenney/', import.meta.url)
const licensesDirectory = new URL('../../public/assets/audio/licenses/', import.meta.url)

const packs = [
  {
    id: 'rpg-audio',
    url: 'https://kenney.nl/media/pages/assets/rpg-audio/8e99002d76-1677590336/kenney_rpg-audio.zip',
    files: [
      ['Audio/handleCoins.ogg', 'coin_pickup_candidate.ogg'],
      ['Audio/drawKnife1.ogg', 'physical_fire_candidate.ogg'],
      ['Audio/knifeSlice.ogg', 'physical_hit_candidate.ogg'],
      ['Audio/metalClick.ogg', 'blocked_candidate.ogg'],
    ],
  },
  {
    id: 'impact-sounds',
    url: 'https://kenney.nl/media/pages/assets/impact-sounds/87b4ddecda-1677589768/kenney_impact-sounds.zip',
    files: [
      ['Audio/impactPunch_medium_001.ogg', 'enemy_hit_candidate.ogg'],
      ['Audio/impactWood_heavy_002.ogg', 'enemy_defeat_candidate.ogg'],
      ['Audio/impactMetal_light_003.ogg', 'blocked_metal_candidate.ogg'],
      ['Audio/impactMining_001.ogg', 'earth_hit_candidate.ogg'],
    ],
  },
  {
    id: 'interface-sounds',
    url: 'https://kenney.nl/media/pages/assets/interface-sounds/fa43c1dd4d-1677589452/kenney_interface-sounds.zip',
    files: [
      ['Audio/select_003.ogg', 'menu_move_candidate.ogg'],
      ['Audio/back_002.ogg', 'menu_cancel_candidate.ogg'],
      ['Audio/confirmation_002.ogg', 'purchase_candidate.ogg'],
      ['Audio/maximize_003.ogg', 'level_up_candidate.ogg'],
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

async function main() {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'survivor-audio-library-'))
  try {
    await mkdir(libraryDirectory, { recursive: true })
    await mkdir(licensesDirectory, { recursive: true })
    for (const pack of packs) {
      const archivePath = join(temporaryDirectory, `${pack.id}.zip`)
      const extractedDirectory = join(temporaryDirectory, pack.id)
      await download(pack.url, archivePath)
      await mkdir(extractedDirectory)
      execFileSync('unzip', ['-qq', archivePath, '-d', extractedDirectory])
      for (const [sourcePath, targetName] of pack.files) {
        await copyFile(join(extractedDirectory, sourcePath), new URL(targetName, libraryDirectory))
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
