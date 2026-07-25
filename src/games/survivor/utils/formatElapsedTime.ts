/**
 * HUD 用の時間文字列フォーマット。
 *
 * GameScene / HUD が「残り時間」や「経過表示」を m:ss で出すときに使う。
 * ゲームロジックの秒計算自体はここではなく呼び出し側。
 */

/**
 * 残り秒数を「分:秒」（例: 0:30）の文字列に変換する。
 * 切り上げ（ceil）でカウントダウン表示するので、0.1 秒残っても 0:01 になる。
 */
export function formatRemainingSeconds(remainingSeconds: number): string {
  const wholeSeconds = Math.max(0, Math.ceil(remainingSeconds))
  const minutes = Math.floor(wholeSeconds / 60)
  const seconds = wholeSeconds % 60
  const secondsText = String(seconds).padStart(2, '0')
  return `${minutes}:${secondsText}`
}

/**
 * 秒数を「分:秒」（例: 1:30）の文字列に変換する（切り捨て）。
 * Python: f"{minutes}:{seconds:02d}" に相当。
 */
export function formatSecondsAsMinutesAndSeconds(totalSeconds: number): string {
  const wholeSeconds = Math.floor(totalSeconds)
  const minutes = Math.floor(wholeSeconds / 60)
  const seconds = wholeSeconds % 60
  const secondsText = String(seconds).padStart(2, '0')
  return `${minutes}:${secondsText}`
}
