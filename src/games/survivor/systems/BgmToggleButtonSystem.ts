import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY_UI } from '../GameConstants'
import type { GameAudioSystem } from './GameAudioSystem'

// =============================================================================
// BGM ON/OFF の丸いスピーカーボタン（タイトル／バトル共通）
//
// - 1色アイコン
// - OFF のときは斜線
// - 上に「BGM ON / BGM OFF」の文字
// =============================================================================

export type BgmToggleButtonView = {
  refresh: () => void
  setSelected: (selected: boolean) => void
  toggle: () => void
}

export function createBgmToggleButton(
  scene: Phaser.Scene,
  audioSystem: GameAudioSystem,
  onFocus?: () => void,
  canToggle?: () => boolean,
): BgmToggleButtonView {
  const centerX = GAME_WIDTH - 30
  const centerY = GAME_HEIGHT - 30
  // アイコンは1色（薄いグレー）。ON/OFF は斜線と文字で表す
  const iconColor = 0xd4d4d8
  // バトル中の敵・弾・HUD より手前でクリックできるようにする
  const depth = 520

  const circle = scene.add.circle(centerX, centerY, 19, 0x111111, 0)
  circle.setStrokeStyle(2, iconColor)
  circle.setInteractive({ useHandCursor: true })
  circle.setDepth(depth)

  // スピーカーの形（四角い本体 + 三角のラッパ + 音波の弧）
  const speakerGraphics = scene.add.graphics()
  speakerGraphics.setDepth(depth)
  speakerGraphics.fillStyle(iconColor, 1)
  speakerGraphics.fillRect(centerX - 9, centerY - 4, 5, 8)
  speakerGraphics.fillTriangle(
    centerX - 4,
    centerY,
    centerX + 3,
    centerY - 8,
    centerX + 3,
    centerY + 8,
  )
  speakerGraphics.lineStyle(2, iconColor, 1)
  speakerGraphics.beginPath()
  speakerGraphics.arc(centerX + 4, centerY, 6, -0.9, 0.9)
  speakerGraphics.strokePath()

  // OFF のときだけ表示する斜線
  const slash = scene.add.graphics()
  slash.setDepth(depth + 1)
  slash.lineStyle(3, iconColor, 1)
  slash.beginPath()
  slash.moveTo(centerX - 13, centerY - 13)
  slash.lineTo(centerX + 13, centerY + 13)
  slash.strokePath()

  const statusText = scene.add.text(centerX, centerY - 30, 'BGM OFF', {
    fontFamily: FONT_FAMILY_UI,
    fontSize: '11px',
    color: '#d4d4d8',
  })
  statusText.setOrigin(0.5)
  statusText.setDepth(depth)

  let isSelected = false

  const refresh = (): void => {
    const enabled = audioSystem.getBgmEnabled()
    // Python: slash.visible = not enabled に相当
    slash.setVisible(!enabled)
    statusText.setText(enabled ? 'BGM ON' : 'BGM OFF')
    circle.setStrokeStyle(2, isSelected ? 0xfde68a : iconColor)
  }

  const toggle = (): void => {
    if (canToggle !== undefined && !canToggle()) {
      return
    }
    scene.sound.unlock()
    audioSystem.unlock()
    const nextEnabled = !audioSystem.getBgmEnabled()
    audioSystem.setBgmEnabled(nextEnabled)
    refresh()
  }

  const setSelected = (selected: boolean): void => {
    isSelected = selected
    refresh()
  }

  circle.on('pointerover', () => {
    onFocus?.()
  })

  circle.on('pointerdown', () => {
    onFocus?.()
    toggle()
  })

  refresh()
  return { refresh, setSelected, toggle }
}
