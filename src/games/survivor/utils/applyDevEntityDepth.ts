/**
 * 開発用: エンティティの描画 depth を下げるヘルパー。
 *
 * DEV_INVERT_LAYER_ORDER が true のとき、キャラを背面に回し、
 * ヒットボックス表示（前面）が見やすくなる。本番確認後は定数を false に戻す想定。
 *
 * プレイヤー／敵／弾／コイン生成直後に呼ぶ。
 */
import Phaser from 'phaser'
import { DEV_INVERT_LAYER_ORDER, DEV_ENTITY_DEPTH } from '../GameConstants'

/**
 * 開発フラグがオンなら gameObject の depth を DEV_ENTITY_DEPTH に上書きする。
 * オフのときは何もしない（各オブジェクトが設定した通常 depth のまま）。
 */
export function applyDevEntityDepth(
  gameObject: Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Depth,
): void {
  if (DEV_INVERT_LAYER_ORDER) {
    gameObject.setDepth(DEV_ENTITY_DEPTH)
  }
}
