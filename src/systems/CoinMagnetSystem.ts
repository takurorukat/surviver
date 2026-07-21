// ============================================================
// コイン吸引ルール（Phaser 任せ）
// ------------------------------------------------------------
// 1. 吸引範囲内のコインだけ body.setVelocity で動かす
// 2. 吸引中は magnetSpeed を毎フレーム加速させる
// 3. コイン生成時に magnetSpeed = 0 を必ずセットする（呼び出し元の責務）
// 4. 取得判定（overlap）は GameScene 側。ここは移動だけ
// GameScene: 通常は updateCoinMagnetMovement、クリア時は updateAllCoinsVacuumMovement
// ============================================================

import Phaser from 'phaser'
import {
  COIN_MAGNET_INITIAL_SPEED,
  COIN_MAGNET_MAX_SPEED,
  COIN_MAGNET_ACCELERATION,
  COIN_CLEAR_VACUUM_SPEED,
} from '../GameConstants'
import type { CoinView } from '../objects/Coin'

// 吸引速度をリセット（範囲外に出たときなど）
function resetCoinMagnetSpeed(coin: CoinView): void {
  coin.setData('magnetSpeed', 0)
}

// コインに保存した吸引速度を読む（未設定・NaN なら 0）
function readCoinMagnetSpeed(coin: CoinView): number {
  const storedSpeed = coin.getData('magnetSpeed') as number | undefined
  if (storedSpeed === undefined || Number.isNaN(storedSpeed)) {
    return 0
  }
  return storedSpeed
}

// 次フレームの吸引速度を計算する（初速 → 加速 → 上限でキャップ）
// deltaSeconds は実際のフレーム時間（秒）。120Hz でも速度がぶれないようにする
function calculateNextMagnetSpeed(currentSpeed: number, deltaSeconds: number): number {
  let nextSpeed = currentSpeed

  if (nextSpeed <= 0) {
    // 吸引開始直後は初速から
    nextSpeed = COIN_MAGNET_INITIAL_SPEED
  } else {
    // Python: next = current + accel * dt に相当
    nextSpeed = nextSpeed + COIN_MAGNET_ACCELERATION * deltaSeconds
  }

  if (nextSpeed > COIN_MAGNET_MAX_SPEED) {
    nextSpeed = COIN_MAGNET_MAX_SPEED
  }

  return nextSpeed
}

// プレイヤー近くのコインを吸い寄せる（吸引中は加速）
// 範囲外のコインは速度0・magnetSpeed リセット（再び入ったら初速から）
export function updateCoinMagnetMovement(
  coinGroup: Phaser.Physics.Arcade.Group,
  playerX: number,
  playerY: number,
  magnetRadius: number,
  deltaSeconds: number,
): void {
  const children = coinGroup.getChildren()

  for (let index = 0; index < children.length; index++) {
    const coin = children[index] as CoinView
    if (!coin.active) {
      continue
    }

    const body = coin.body as Phaser.Physics.Arcade.Body
    const dx = playerX - coin.x
    const dy = playerY - coin.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // 吸引半径の外 → 動かさない
    if (distance > magnetRadius) {
      resetCoinMagnetSpeed(coin)
      body.setVelocity(0, 0)
      continue
    }

    const currentSpeed = readCoinMagnetSpeed(coin)
    const nextSpeed = calculateNextMagnetSpeed(currentSpeed, deltaSeconds)
    coin.setData('magnetSpeed', nextSpeed)

    // ほぼ重なっているときは止める（振動・通り過ぎ防止）
    if (distance < 1) {
      body.setVelocity(0, 0)
      continue
    }

    // プレイヤー方向の単位ベクトル × 吸引速度
    body.setVelocity((dx / distance) * nextSpeed, (dy / distance) * nextSpeed)
  }
}

// ステージクリア時: 距離に関係なく全コインをプレイヤーへ集める
// 吸引半径チェック無し。速度は COIN_CLEAR_VACUUM_SPEED 固定
export function updateAllCoinsVacuumMovement(
  coinGroup: Phaser.Physics.Arcade.Group,
  playerX: number,
  playerY: number,
): void {
  const children = coinGroup.getChildren()

  for (let index = 0; index < children.length; index++) {
    const coin = children[index] as CoinView
    if (!coin.active) {
      continue
    }

    const body = coin.body as Phaser.Physics.Arcade.Body
    const dx = playerX - coin.x
    const dy = playerY - coin.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < 1) {
      body.setVelocity(0, 0)
      continue
    }

    coin.setData('magnetSpeed', COIN_CLEAR_VACUUM_SPEED)
    body.setVelocity((dx / distance) * COIN_CLEAR_VACUUM_SPEED, (dy / distance) * COIN_CLEAR_VACUUM_SPEED)
  }
}
