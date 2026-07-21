/**
 * Arcade Physics の「一定速度で動かす」ための共通ヘルパー。
 *
 * このゲームの移動ルール:
 * - プレイヤー／敵／コイン吸引はすべて body.setVelocity で動かす
 * - 物理は main.ts の fps（60×サブステップ数）, fixedStep: true で安定させる
 * - 1フレームの物理更新は stepArcadePhysicsOnce で最大1フレーム分に制限
 *   （内部では細かい固定ステップが複数回進む。高速弾のすり抜け対策）
 *
 * 使う場所: Player / Enemy 生成時の configure、GameScene の物理ステップ。
 */
import { PHYSICS_FPS } from '../GameConstants'

/**
 * 1描画フレームぶんの時間（ミリ秒）。
 * PHYSICS_FPS=60 なら約 16.67ms。stepArcadePhysicsOnce の上限に使う。
 */
export const PHYSICS_FIXED_STEP_MS = 1000 / PHYSICS_FPS

/**
 * velocity 前提で速度がぶれないよう、ボディの設定を揃える。
 * ドラッグ・加速度を切り、maxVelocity を指定速度に合わせる。
 *
 * @param maxSpeed そのエンティティの上限速度（プレイヤーは PLAYER_SPEED、敵は敵データ speed）
 */
export function configureArcadeBodyForConstantSpeed(
  body: Phaser.Physics.Arcade.Body,
  maxSpeed: number,
): void {
  body.setAllowDrag(false)
  body.setAcceleration(0, 0)
  body.setDrag(0, 0)
  body.setMaxVelocity(maxSpeed, maxSpeed)
}

/**
 * 遅延時の追い込みステップによる一時加速を防ぐ（1フレーム最大1フレーム分）。
 *
 * Phaser が rawDelta が大きいときに余分にステップを回すと一瞬速く見えるため、
 * delta を PHYSICS_FIXED_STEP_MS（1描画フレーム分）以下にキャップしてから
 * world.update する。物理エンジン自体は main.ts の fps 設定（60×サブステップ数）
 * に従って、この中で細かい固定ステップを複数回進める。
 * GameScene から毎フレーム1回だけ呼ぶ想定。
 */
export function stepArcadePhysicsOnce(
  world: Phaser.Physics.Arcade.World,
  nowMs: number,
  rawDeltaMs: number,
): void {
  const cappedDeltaMs = Math.min(rawDeltaMs, PHYSICS_FIXED_STEP_MS)
  world.update(nowMs, cappedDeltaMs)
}
