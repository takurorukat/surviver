import Phaser from 'phaser'
import {
  BGM_TOGGLE_BUTTON_CENTER_X,
  BOTTOM_CORNER_BUTTON_CENTER_Y,
  BOTTOM_CORNER_BUTTON_DEPTH,
  BOTTOM_CORNER_BUTTON_ICON_COLOR,
  BOTTOM_CORNER_BUTTON_ICON_CSS_COLOR,
  BOTTOM_CORNER_BUTTON_LABEL_FONT_SIZE,
  BOTTOM_CORNER_BUTTON_LABEL_OFFSET_Y,
  BOTTOM_CORNER_BUTTON_RADIUS,
  BOTTOM_CORNER_BUTTON_SELECTED_COLOR,
  BOTTOM_CORNER_BUTTON_STROKE_WIDTH,
  FONT_FAMILY_UI,
} from '../GameConstants'
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
  const centerX = BGM_TOGGLE_BUTTON_CENTER_X
  const centerY = BOTTOM_CORNER_BUTTON_CENTER_Y
  // アイコンは1色（薄いグレー）。ON/OFF は斜線と文字で表す
  const iconColor = BOTTOM_CORNER_BUTTON_ICON_COLOR
  // バトル中の敵・弾・HUD より手前でクリックできるようにする
  const depth = BOTTOM_CORNER_BUTTON_DEPTH

  const circle = scene.add.circle(
    centerX,
    centerY,
    BOTTOM_CORNER_BUTTON_RADIUS,
    0x111111,
    0,
  )
  circle.setStrokeStyle(BOTTOM_CORNER_BUTTON_STROKE_WIDTH, iconColor)
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

  const statusText = scene.add.text(
    centerX,
    centerY - BOTTOM_CORNER_BUTTON_LABEL_OFFSET_Y,
    'BGM OFF',
    {
      fontFamily: FONT_FAMILY_UI,
      fontSize: BOTTOM_CORNER_BUTTON_LABEL_FONT_SIZE,
      color: BOTTOM_CORNER_BUTTON_ICON_CSS_COLOR,
    },
  )
  statusText.setOrigin(0.5)
  statusText.setDepth(depth)

  let isSelected = false

  const refresh = (): void => {
    const enabled = audioSystem.getBgmEnabled()
    // Python: slash.visible = not enabled に相当
    slash.setVisible(!enabled)
    statusText.setText(enabled ? 'BGM ON' : 'BGM OFF')
    circle.setStrokeStyle(
      BOTTOM_CORNER_BUTTON_STROKE_WIDTH,
      isSelected ? BOTTOM_CORNER_BUTTON_SELECTED_COLOR : iconColor,
    )
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
