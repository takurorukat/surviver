// ============================================================
// プレイヤー被ダメージまわり（HP・無敵・ノックバック・点滅）
// ------------------------------------------------------------
// GameScene が敵接触 / 敵弾ヒット時に呼ぶ。
// - applyPlayerDamage で HP を減らし、無敵時間を開始
// - startPlayerKnockbackAwayFromEnemy で敵と反対方向へ弾く
// - 毎フレーム: applyPlayerKnockbackIfActive → updatePlayerInvincibilityBlink
// 移動中はノックバックが優先（true の間は通常移動をスキップ）
// ============================================================

import Phaser from 'phaser'
import {
  PLAYER_INVINCIBLE_SECONDS,
  PLAYER_INVINCIBLE_BLINK_INTERVAL_MS,
  PLAYER_KNOCKBACK_SPEED,
  PLAYER_KNOCKBACK_DURATION_MS,
  ENEMY_MELEE_DAMAGE,
} from '../GameConstants'
import { configureArcadeBodyForConstantSpeed } from '../utils/arcadePhysicsHelpers'

// 被ダメージ・無敵時間・ノックバックの状態
// Python: self.is_invincible に相当する「今の状態をまとめた辞書」
// GameScene が1つだけ保持し、このファイルの関数へ渡す
export type PlayerDamageState = {
  isInvincible: boolean // 無敵中か（点滅演出のオンオフにも使う）
  invincibleUntilMs: number // 無敵が終わる時刻（scene.time.now と同じ単位のミリ秒）
  knockbackRemainingMs: number // ノックバックが残っている時間（ミリ秒）
  knockbackVx: number // ノックバック中に毎フレームセットする速度 X
  knockbackVy: number // ノックバック中に毎フレームセットする速度 Y
}

// 初期状態を作る（ゲーム開始時に GameScene が呼ぶ）
export function createPlayerDamageState(): PlayerDamageState {
  return {
    isInvincible: false,
    invincibleUntilMs: 0,
    knockbackRemainingMs: 0,
    knockbackVx: 0,
    knockbackVy: 0,
  }
}

// 敵との接触や敵弾でダメージを受けられるか判定する
// 無敵中でも、期限が過ぎていれば受けられる（期限切れをここで検知）
export function canPlayerTakeDamageNow(
  damageState: PlayerDamageState,
  nowMs: number,
): boolean {
  if (!damageState.isInvincible) {
    return true
  }
  // 無敵フラグは残っていても、時刻が過ぎていればダメージ可
  if (nowMs >= damageState.invincibleUntilMs) {
    return true
  }
  return false
}

// ダメージを適用して無敵時間を開始する
// 戻り値は減算後の HP。GameScene 側で playerHp に代入する
// damageAmount を省略すると近接ダメージ定数 ENEMY_MELEE_DAMAGE を使う
export function applyPlayerDamage(
  currentHp: number,
  damageState: PlayerDamageState,
  nowMs: number,
  damageAmount: number = ENEMY_MELEE_DAMAGE,
): number {
  const newHp = currentHp - damageAmount
  damageState.isInvincible = true
  // 秒 → ミリ秒に変換して「今から何ミリ秒後まで無敵か」を記録
  damageState.invincibleUntilMs = nowMs + PLAYER_INVINCIBLE_SECONDS * 1000
  return newHp
}

// 接触した敵と反対方向へノックバックを開始する
// 座標は書き換えず、body.setVelocity で速度だけ変える（移動ルール準拠）
export function startPlayerKnockbackAwayFromEnemy(
  player: Phaser.GameObjects.Rectangle,
  enemy: { x: number; y: number },
  playerBody: Phaser.Physics.Arcade.Body,
  damageState: PlayerDamageState,
): void {
  // 敵 → プレイヤーのベクトル（反対方向に飛ばすため）
  let dx = player.x - enemy.x
  let dy = player.y - enemy.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  // 完全に重なっているときは方向が決まらないので、下方向へ逃がす
  if (distance < 0.001) {
    dx = 0
    dy = 1
  } else {
    // 単位ベクトル化（長さ1）してから速度を掛ける
    // Python: dx, dy = dx/dist, dy/dist に相当
    dx = dx / distance
    dy = dy / distance
  }

  damageState.knockbackVx = dx * PLAYER_KNOCKBACK_SPEED
  damageState.knockbackVy = dy * PLAYER_KNOCKBACK_SPEED
  damageState.knockbackRemainingMs = PLAYER_KNOCKBACK_DURATION_MS

  // 通常移動より速いノックバックが maxVelocity で止まらないようにする
  configureArcadeBodyForConstantSpeed(playerBody, PLAYER_KNOCKBACK_SPEED)
  playerBody.setVelocity(damageState.knockbackVx, damageState.knockbackVy)
}

// ノックバック中なら速度を維持して true。終わっていれば false（通常移動へ）
// GameScene の移動更新で、true のときは applyPlayerMovement を呼ばない
export function applyPlayerKnockbackIfActive(
  playerBody: Phaser.Physics.Arcade.Body,
  damageState: PlayerDamageState,
  deltaMs: number,
): boolean {
  if (damageState.knockbackRemainingMs <= 0) {
    return false
  }

  // 残り時間を減らす（deltaMs = このフレームの経過ミリ秒）
  damageState.knockbackRemainingMs -= deltaMs
  if (damageState.knockbackRemainingMs <= 0) {
    // ノックバック終了：速度をクリアして通常移動に戻す合図
    damageState.knockbackRemainingMs = 0
    damageState.knockbackVx = 0
    damageState.knockbackVy = 0
    return false
  }

  // 毎フレーム同じノックバック速度を再セット（他処理で上書きされても維持）
  configureArcadeBodyForConstantSpeed(playerBody, PLAYER_KNOCKBACK_SPEED)
  playerBody.setVelocity(damageState.knockbackVx, damageState.knockbackVy)
  return true
}

// 無敵中の点滅演出を更新する（見た目だけ。当たり判定は canPlayerTakeDamageNow）
// 期限が過ぎたら isInvincible を false に戻し、透明度を通常へ
export function updatePlayerInvincibilityBlink(
  player: Phaser.GameObjects.Rectangle,
  damageState: PlayerDamageState,
  nowMs: number,
): void {
  if (!damageState.isInvincible) {
    player.setAlpha(1)
    return
  }

  if (nowMs >= damageState.invincibleUntilMs) {
    damageState.isInvincible = false
    player.setAlpha(1)
    return
  }

  // 一定間隔で半透明 ↔ 不透明を切り替え（点滅）
  // Python: (now // interval) % 2 に相当
  const blinkPhase = Math.floor(nowMs / PLAYER_INVINCIBLE_BLINK_INTERVAL_MS) % 2
  if (blinkPhase === 0) {
    player.setAlpha(0.35)
  } else {
    player.setAlpha(1)
  }
}
