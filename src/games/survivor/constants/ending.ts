// constants/ending.ts
// Version 1 の4エリア全クリア・エンディング用アセットと表示定数

import type { StageAreaId } from './areas'

/** Version 1 全クリア判定の対象（最終ステージ castle/dungeon は含めない） */
export const FOUR_AREA_COMPLETION_IDS: readonly StageAreaId[] = [
  'plains',
  'forest',
  'volcano',
  'ruins',
]

export const ENDING_VICTORY_KEY = 'ending-victory'
export const ENDING_VICTORY_PATH = 'assets/images/ending_victory.jpg'

export const ENDING_FINAL_ASCENT_KEY = 'ending-final-ascent'
export const ENDING_FINAL_ASCENT_PATH = 'assets/images/ending_final_ascent.jpg'

/** フェードイン／アウト時間（ms） */
export const ENDING_FADE_MS = 700
/** 画面表示後、入力を受け付けるまでの最短時間（ms） */
export const ENDING_INPUT_LOCK_MS = 500

export const ENDING_CONTINUE_HINT = 'CLICK / PRESS ENTER TO CONTINUE'
export const TITLE_VIEW_ENDING_LABEL = 'VIEW ENDING'

/** Ending Victory: Wind Plains BGM を再利用（音量は戦闘より控えめ） */
export const ENDING_VICTORY_BGM_VOLUME = 0.11
/** Ending Final Ascent: Ruins BGM を再利用 */
export const ENDING_FINAL_ASCENT_BGM_VOLUME = 0.09
/** Victory → Final Ascent の BGM フェードアウト（ms） */
export const ENDING_VICTORY_TO_TEASER_BGM_FADE_MS = 400
/** Final Ascent → Title の BGM フェードアウト（ms） */
export const ENDING_TEASER_TO_TITLE_BGM_FADE_MS = 600
