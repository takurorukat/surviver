/**
 * 矩形の見た目に円形の Arcade ヒットボックスを付けるユーティリティ。
 *
 * 見た目は Rectangle、当たり判定だけ円にしたいときに使う
 * （プレイヤー・敵・弾など）。offset は矩形中心と円中心が一致するよう計算する。
 */

/**
 * Body を円形にし、表示サイズに対して中央揃えのオフセットを設定する。
 *
 * @param radius 当たり判定の半径（見た目の半分であることが多い）
 * @param displayWidth 見た目の矩形幅（オフセット計算用）
 * @param displayHeight 見た目の矩形高さ（オフセット計算用）
 */
export function setupCircleHitbox(
  body: Phaser.Physics.Arcade.Body,
  radius: number,
  displayWidth: number,
  displayHeight: number,
): void {
  // 円の左上を矩形の中心に合わせるためのオフセット
  // Python: offset = (display/2 - radius) に相当
  const offsetX = displayWidth / 2 - radius
  const offsetY = displayHeight / 2 - radius
  body.setCircle(radius, offsetX, offsetY)
}
