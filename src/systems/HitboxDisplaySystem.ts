// ============================================================
// 当たり判定（円）の可視化
// ------------------------------------------------------------
// GameScene がプレイヤー座標と敵グループを渡して毎フレーム描画。
// 見た目だけ。実際の当たりは Arcade Physics の overlap / circle body。
// DEV_INVERT_LAYER_ORDER が true のときは塗りつぶし付きのデバッグ表示。
// ============================================================

import Phaser from 'phaser'
import {
  PLAYER_RADIUS,
  ENEMY_RADIUS,
  HITBOX_DISPLAY_DEPTH,
  DEV_INVERT_LAYER_ORDER,
  DEV_HITBOX_DISPLAY_DEPTH,
  DEV_HITBOX_PLAYER_COLOR,
  DEV_HITBOX_ENEMY_COLOR,
  DEV_HITBOX_FILL_ALPHA,
  DEV_HITBOX_STROKE_ALPHA,
  DEV_HITBOX_LINE_WIDTH,
} from '../GameConstants'

// プレイヤーと敵の円形当たり判定を枠線で表示する
export class HitboxDisplaySystem {
  private graphics: Phaser.GameObjects.Graphics

  // シーンに Graphics を追加し、表示用 depth を設定する
  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics()
    // 開発用フラグ時は手前に出して確認しやすくする
    const depth = DEV_INVERT_LAYER_ORDER ? DEV_HITBOX_DISPLAY_DEPTH : HITBOX_DISPLAY_DEPTH
    this.graphics.setDepth(depth)
  }

  // プレイヤーと全アクティブ敵のヒットボックス円を描く
  // テスト表示はオフ。再表示したいときは DEV_INVERT_LAYER_ORDER を true にする
  drawHitboxes(
    playerX: number,
    playerY: number,
    enemyGroup: Phaser.Physics.Arcade.Group,
  ): void {
    this.graphics.clear()

    if (!DEV_INVERT_LAYER_ORDER) {
      return
    }

    // 開発モード: 塗り + 枠で目立つ円
    this.drawDevCircle(playerX, playerY, PLAYER_RADIUS, DEV_HITBOX_PLAYER_COLOR)

    const children = enemyGroup.getChildren()
    for (let index = 0; index < children.length; index++) {
      const enemy = children[index] as Phaser.GameObjects.Rectangle
      if (!enemy.active) {
        continue
      }

      this.drawDevCircle(enemy.x, enemy.y, ENEMY_RADIUS, DEV_HITBOX_ENEMY_COLOR)
    }
  }

  // 開発用: 塗りつぶし円 + 枠線
  private drawDevCircle(centerX: number, centerY: number, radius: number, color: number): void {
    this.graphics.fillStyle(color, DEV_HITBOX_FILL_ALPHA)
    this.graphics.fillCircle(centerX, centerY, radius)
    this.graphics.lineStyle(DEV_HITBOX_LINE_WIDTH, color, DEV_HITBOX_STROKE_ALPHA)
    this.graphics.strokeCircle(centerX, centerY, radius)
  }
}
