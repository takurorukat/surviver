/**
 * 復活（Revive）機能の Feature Flag と数値。
 * Production 初期値は無効。広告 SDK は別タスク。
 */
/** Production では false。true のときだけ Game Over に REVIVE 導線を出せる */
export const REVIVE_FEATURE_ENABLED = false

/** 復活時の HP（最大 HP に対する割合） */
export const REVIVE_HP_RATIO = 0.5

/** 復活直後の無敵時間（ミリ秒） */
export const REVIVE_INVULNERABLE_MS = 2000

/** Game Over の復活ボタン文言（Feature Flag=true 時のみ使用） */
export const REVIVE_BUTTON_LABEL = 'REVIVE'

/** 補助文言（1ラン1回であることの明示。WATCH AD は出さない） */
export const REVIVE_BUTTON_HINT_LABEL = 'REVIVE ONCE'
