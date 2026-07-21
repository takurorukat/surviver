// ============================================================
// VirtualJoystick.ts
// ------------------------------------------------------------
// タッチ専用のフローティング仮想ジョイスティック。
// Phaser 標準の Pointer（wasTouch / pointerdown・move・up）だけで実装する。
// 外部プラグインは使わない。
//
// 使い方:
//   指を置いた位置にベースを出し、ドラッグ方向（0〜1）を返す。
//   マウス操作では start しない（GameScene 側で wasTouch を見る）。
// ============================================================

import Phaser from 'phaser'
import {
  VIRTUAL_JOYSTICK_BASE_RADIUS,
  VIRTUAL_JOYSTICK_THUMB_RADIUS,
  VIRTUAL_JOYSTICK_MAX_OFFSET,
  VIRTUAL_JOYSTICK_DEAD_ZONE,
  VIRTUAL_JOYSTICK_DEPTH,
  VIRTUAL_JOYSTICK_BASE_COLOR,
  VIRTUAL_JOYSTICK_BASE_ALPHA,
  VIRTUAL_JOYSTICK_THUMB_COLOR,
  VIRTUAL_JOYSTICK_THUMB_ALPHA,
  VIRTUAL_JOYSTICK_BASE_STROKE_COLOR,
  VIRTUAL_JOYSTICK_BASE_STROKE_ALPHA,
  VIRTUAL_JOYSTICK_BASE_STROKE_WIDTH,
} from '../GameConstants'

export class VirtualJoystick {
  private baseCircle: Phaser.GameObjects.Arc
  private thumbCircle: Phaser.GameObjects.Arc
  private activePointerId: number | null = null
  private originX = 0
  private originY = 0
  // 長さ 0〜1 の方向ベクトル（デッドゾーン内は 0）
  private forceX = 0
  private forceY = 0

  constructor(scene: Phaser.Scene) {
    this.baseCircle = scene.add.circle(
      0,
      0,
      VIRTUAL_JOYSTICK_BASE_RADIUS,
      VIRTUAL_JOYSTICK_BASE_COLOR,
      VIRTUAL_JOYSTICK_BASE_ALPHA,
    )
    this.baseCircle.setStrokeStyle(
      VIRTUAL_JOYSTICK_BASE_STROKE_WIDTH,
      VIRTUAL_JOYSTICK_BASE_STROKE_COLOR,
      VIRTUAL_JOYSTICK_BASE_STROKE_ALPHA,
    )
    this.baseCircle.setScrollFactor(0)
    this.baseCircle.setDepth(VIRTUAL_JOYSTICK_DEPTH)
    this.baseCircle.setVisible(false)

    this.thumbCircle = scene.add.circle(
      0,
      0,
      VIRTUAL_JOYSTICK_THUMB_RADIUS,
      VIRTUAL_JOYSTICK_THUMB_COLOR,
      VIRTUAL_JOYSTICK_THUMB_ALPHA,
    )
    this.thumbCircle.setScrollFactor(0)
    this.thumbCircle.setDepth(VIRTUAL_JOYSTICK_DEPTH + 1)
    this.thumbCircle.setVisible(false)
  }

  /** タッチ開始。マウスでは呼ばない想定。 */
  start(pointer: Phaser.Input.Pointer): void {
    this.activePointerId = pointer.id
    this.originX = pointer.x
    this.originY = pointer.y
    this.forceX = 0
    this.forceY = 0

    this.baseCircle.setPosition(this.originX, this.originY)
    this.baseCircle.setVisible(true)
    this.thumbCircle.setPosition(this.originX, this.originY)
    this.thumbCircle.setVisible(true)
  }

  /** 指の移動。別ポインタは無視。 */
  updatePointer(pointer: Phaser.Input.Pointer): void {
    if (this.activePointerId === null || pointer.id !== this.activePointerId) {
      return
    }

    const dx = pointer.x - this.originX
    const dy = pointer.y - this.originY
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < VIRTUAL_JOYSTICK_DEAD_ZONE) {
      this.forceX = 0
      this.forceY = 0
      this.thumbCircle.setPosition(this.originX, this.originY)
      return
    }

    // スティック位置は最大オフセット内に収める
    let thumbOffsetX = dx
    let thumbOffsetY = dy
    if (distance > VIRTUAL_JOYSTICK_MAX_OFFSET) {
      const scale = VIRTUAL_JOYSTICK_MAX_OFFSET / distance
      thumbOffsetX = dx * scale
      thumbOffsetY = dy * scale
    }

    this.thumbCircle.setPosition(this.originX + thumbOffsetX, this.originY + thumbOffsetY)

    // 力の大きさは 0〜1（最大オフセットで満タン）
    const clampedDistance = Math.min(distance, VIRTUAL_JOYSTICK_MAX_OFFSET)
    const strength = clampedDistance / VIRTUAL_JOYSTICK_MAX_OFFSET
    this.forceX = (dx / distance) * strength
    this.forceY = (dy / distance) * strength
  }

  /** 指を離したら非表示＆力ゼロ。 */
  stop(pointer: Phaser.Input.Pointer): void {
    if (this.activePointerId === null || pointer.id !== this.activePointerId) {
      return
    }
    this.hideAndReset()
  }

  /** 強制停止（ポーズやシーン終了時）。 */
  cancel(): void {
    this.hideAndReset()
  }

  isActive(): boolean {
    return this.activePointerId !== null
  }

  /** 長さ 0〜1 の力ベクトル。 */
  getForce(): { x: number; y: number } {
    return { x: this.forceX, y: this.forceY }
  }

  destroy(): void {
    this.baseCircle.destroy()
    this.thumbCircle.destroy()
    this.activePointerId = null
  }

  private hideAndReset(): void {
    this.activePointerId = null
    this.forceX = 0
    this.forceY = 0
    this.baseCircle.setVisible(false)
    this.thumbCircle.setVisible(false)
  }
}
