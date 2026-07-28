// tools/sfx_preview 専用 UI 定数（Production ui.ts からは除去）

export const SFX_PREVIEW_PANEL_WIDTH = 900
export const SFX_PREVIEW_PANEL_HEIGHT = 500
export const SFX_PREVIEW_DEPTH = 470
export const SFX_PREVIEW_ROW_HEIGHT = 22
export const SFX_PREVIEW_COMPARE_BUTTON_HEIGHT = 40
export const SFX_PREVIEW_VOLUME_STEP = 0.05
/** Preview 候補ディレクトリ（tools/sfx_preview/public 配下） */
export const SFX_CANDIDATE_DIR = 'assets/audio/candidates'
export const SFX_CANDIDATE_VARIANTS = ['a', 'b', 'c'] as const
export type SfxCandidateVariant = (typeof SFX_CANDIDATE_VARIANTS)[number]
