// ============================================================
// 攻撃射程・コイン吸引範囲の可視化（薄い円）
// ------------------------------------------------------------
// GameScene がプレイヤー位置と現在の射程・吸引半径を渡して毎フレーム描画。
// 見た目だけ。実際の判定は PlayerAttackSystem / CoinMagnetSystem 側。
// ============================================================

import Phaser from 'phaser'
import {
  RANGE_CIRCLE_COLOR,
  RANGE_CIRCLE_ALPHA,
  RANGE_CIRCLE_LINE_WIDTH,
  COIN_MAGNET_CIRCLE_COLOR,
  COIN_MAGNET_CIRCLE_ALPHA,
  COIN_MAGNET_CIRCLE_LINE_WIDTH,
} from '../GameConstants'

// 攻撃射程とコイン吸引範囲を薄い円で表示する
export class RangeDisplaySystem {
  // Phaser の線画用オブジェクト（毎フレーム clear → strokeCircle）
  private graphics: Phaser.GameObjects.Graphics

  // シーンに Graphics を1つ追加する（create 時に1回だけ）
  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics()
    // depth 5: 地面より上・キャラより下くらい（他 UI より奥）
    this.graphics.setDepth(5)
  }

  // 攻撃射程（白）とコイン吸引範囲（金）をプレイヤー中心に描く
  // centerX/Y は通常プレイヤー座標。半径はレベルアップ等で変わりうる
  drawRangeCircles(
    centerX: number,
    centerY: number,
    attackRange: number,
    coinMagnetRadius: number,
  ): void {
    // 前フレームの線を消してから描き直す（残像防止）
    this.graphics.clear()

    // 白い円 = 自動攻撃が届く距離
    this.graphics.lineStyle(RANGE_CIRCLE_LINE_WIDTH, RANGE_CIRCLE_COLOR, RANGE_CIRCLE_ALPHA)
    this.graphics.strokeCircle(centerX, centerY, attackRange)

    // 金色の円 = コインが吸い寄せられる距離
    this.graphics.lineStyle(
      COIN_MAGNET_CIRCLE_LINE_WIDTH,
      COIN_MAGNET_CIRCLE_COLOR,
      COIN_MAGNET_CIRCLE_ALPHA,
    )
    this.graphics.strokeCircle(centerX, centerY, coinMagnetRadius)
  }

  // 円を消す（デバッグオフや非表示にしたいとき）
  hideRangeCircles(): void {
    this.graphics.clear()
  }
}
