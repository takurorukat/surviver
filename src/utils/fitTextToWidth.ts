import Phaser from 'phaser'

/**
 * テキストが指定幅からはみ出すときだけ、収まるまで縮小する。
 * 短い文字はそのままの大きさで表示される。
 * Python: scale = min(1, max_width / text_width) に相当
 */
export function shrinkTextToFitWidth(
  text: Phaser.GameObjects.Text,
  maxWidth: number,
): void {
  if (text.width <= maxWidth) {
    return
  }
  const scale = maxWidth / text.width
  text.setScale(scale)
}
