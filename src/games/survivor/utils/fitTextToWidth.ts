import Phaser from 'phaser'

/**
 * 多言語化（日本語・中国語・スペイン語など）で文言が長くなっても
 * 枠からはみ出さないようにするための共通ヘルパー。
 *
 * - shrinkTextToFitWidth … 1行想定。幅だけに収める
 * - shrinkTextToFitHeight … 高さだけに収める
 * - fitTextInBounds … 折り返し（任意）＋幅／高さに収まるまで縮小
 *
 * どれも setText のあとに呼ぶこと。再表示のたびに scale をいったん 1 に戻す。
 */

export type FitTextInBoundsOptions = {
  maxWidth: number
  /** 省略時は高さ制限なし */
  maxHeight?: number
  /** true なら先に maxWidth で折り返してから縮小する */
  wrap?: boolean
}

/**
 * テキストが指定幅からはみ出すときだけ、収まるまで縮小する。
 * 短い文字はそのままの大きさで表示される。
 * Python: scale = min(1, max_width / text_width) に相当
 */
export function shrinkTextToFitWidth(
  text: Phaser.GameObjects.Text,
  maxWidth: number,
): void {
  text.setScale(1)
  if (maxWidth <= 0) {
    return
  }
  if (text.width <= maxWidth) {
    return
  }
  text.setScale(maxWidth / text.width)
}

/**
 * テキストが指定高さからはみ出すときだけ、収まるまで縮小する。
 */
export function shrinkTextToFitHeight(
  text: Phaser.GameObjects.Text,
  maxHeight: number,
): void {
  text.setScale(1)
  if (maxHeight <= 0) {
    return
  }
  if (text.height <= maxHeight) {
    return
  }
  text.setScale(maxHeight / text.height)
}

/**
 * 枠内に収める。
 * 1. wrap=true なら maxWidth で折り返す
 * 2. それでも幅／高さがオーバーなら全体を縮小する
 *
 * タイトル1行 → wrap:false + maxWidth
 * 説明文 → wrap:true + maxWidth + maxHeight
 */
export function fitTextInBounds(
  text: Phaser.GameObjects.Text,
  options: FitTextInBoundsOptions,
): void {
  const maxWidth = options.maxWidth
  const maxHeight = options.maxHeight
  const shouldWrap = options.wrap === true

  text.setScale(1)

  if (shouldWrap && maxWidth > 0) {
    text.setStyle({
      wordWrap: { width: maxWidth },
    })
  }

  if (maxWidth <= 0 && (maxHeight === undefined || maxHeight <= 0)) {
    return
  }

  let scale = 1
  if (maxWidth > 0 && text.width > maxWidth) {
    scale = Math.min(scale, maxWidth / text.width)
  }
  if (maxHeight !== undefined && maxHeight > 0 && text.height > maxHeight) {
    scale = Math.min(scale, maxHeight / text.height)
  }

  if (scale < 1) {
    text.setScale(scale)
  }
}
