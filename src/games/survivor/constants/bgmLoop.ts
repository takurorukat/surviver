/**
 * Survivor ループ BGM の loopStart / loopEnd（秒）。
 *
 * 未検証の推測値は入れない。値が無いキーは SoundManager が
 * 0〜duration のフルバッファループを使う。
 *
 * 検証済み値の追加手順は tools/bgm_inspector/README.md を参照。
 */

import {
  BGM_KEY,
  FOREST_BGM_KEY,
  RUINS_BGM_KEY,
  TITLE_BGM_KEY,
  VOLCANO_BGM_KEY,
} from './audio'
import type { BgmLoopBounds } from '../../../core/audio/bgmFade'

/** キャッシュキー → 検証済みループ区間（秒） */
export const SURVIVOR_BGM_LOOP_BOUNDS: Record<string, BgmLoopBounds> = {
  [TITLE_BGM_KEY]: { loopEnd: 9.6 },
  [BGM_KEY]: { loopEnd: 9.6 },
  [FOREST_BGM_KEY]: { loopEnd: 9.6 },
  [VOLCANO_BGM_KEY]: { loopEnd: 9.6 },
  [RUINS_BGM_KEY]: { loopEnd: 19.2 },
}

export function getSurvivorBgmLoopBounds(audioKey: string): BgmLoopBounds | undefined {
  return SURVIVOR_BGM_LOOP_BOUNDS[audioKey]
}

/**
 * game_music_generator 側で将来記録するメタデータの形（設計メモ）。
 * 生成パイプライン実装までは TODO。
 */
export type GeneratedBgmLoopMetadata = {
  themeId: string
  outputOgg: string
  durationSec: number
  /** イントロが終わる位置（秒）。ループ区間の手前。 */
  introEndSec?: number
  /** 検証済みシームレスループ開始（秒） */
  loopStartSec?: number
  /** 検証済みシームレスループ終了（秒） */
  loopEndSec?: number
  /** 耳確認済みか */
  verified: boolean
}
