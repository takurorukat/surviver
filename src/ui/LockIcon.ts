/**
 * タイトル画面などで使う南京錠アイコン。
 * 白いスプライトを tint でグレー／白に合わせて表示する。
 */
import Phaser from 'phaser'
import {
  UI_LOCK_ICON_KEY,
  TITLE_LOCK_ICON_DENIED_PULSE_SCALE,
  TITLE_LOCK_ICON_DENIED_PULSE_DURATION_MS,
} from '../GameConstants'

export type LockIconView = {
  container: Phaser.GameObjects.Container
  image: Phaser.GameObjects.Image
  size: number
}

export function createLockIcon(
  scene: Phaser.Scene,
  x: number,
  y: number,
  size: number,
  color: number,
): LockIconView {
  const image = scene.add.image(0, 0, UI_LOCK_ICON_KEY)
  image.setDisplaySize(size, size)
  image.setTint(color)

  const container = scene.add.container(x, y, [image])
  container.setVisible(false)

  return { container, image, size }
}

export function setLockIconVisible(lockIcon: LockIconView, isVisible: boolean): void {
  lockIcon.container.setVisible(isVisible)
}

export function setLockIconColor(lockIcon: LockIconView, color: number): void {
  lockIcon.image.setTint(color)
}

/**
 * ロック中のまま決定したときのフィードバック。
 * 南京錠を大きくしてすぐ戻す（ロック中だと分かる）。
 */
export function playLockIconDeniedPulse(
  scene: Phaser.Scene,
  lockIcon: LockIconView,
): void {
  if (!lockIcon.container.visible) {
    return
  }

  scene.tweens.killTweensOf(lockIcon.container)
  lockIcon.container.setScale(1)
  scene.tweens.add({
    targets: lockIcon.container,
    scaleX: TITLE_LOCK_ICON_DENIED_PULSE_SCALE,
    scaleY: TITLE_LOCK_ICON_DENIED_PULSE_SCALE,
    duration: TITLE_LOCK_ICON_DENIED_PULSE_DURATION_MS,
    yoyo: true,
    ease: 'Sine.easeOut',
  })
}

/** 左揃えテキストの右隣に南京錠を置く */
export function layoutLockIconAfterText(
  lockIcon: LockIconView,
  text: Phaser.GameObjects.Text,
  gap: number,
  showLock: boolean,
): void {
  setLockIconVisible(lockIcon, showLock)
  if (!showLock) {
    return
  }

  lockIcon.container.setPosition(
    text.x + text.width + gap + lockIcon.size / 2,
    text.y,
  )
}

/** 中央揃えテキストの左に南京錠を置く（Shop / Seal Skills 用） */
export function layoutLockIconWithCenteredText(
  lockIcon: LockIconView,
  text: Phaser.GameObjects.Text,
  centerX: number,
  centerY: number,
  gap: number,
  showLock: boolean,
): void {
  setLockIconVisible(lockIcon, showLock)

  if (!showLock) {
    text.setOrigin(0.5, 0.5)
    text.setPosition(centerX, centerY)
    return
  }

  text.setOrigin(0, 0.5)
  const totalWidth = lockIcon.size + gap + text.width
  const startX = centerX - totalWidth / 2

  lockIcon.container.setPosition(startX + lockIcon.size / 2, centerY)
  text.setPosition(startX + lockIcon.size + gap, centerY)
}
