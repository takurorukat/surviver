import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY_UI } from '../GameConstants'

// =============================================================================
// Fullscreen ON/OFF の丸いボタン（タイトル画面用）
//
// - BGM ボタンの左隣に配置
// - ON のとき: 縮小アイコン（内向き矢印風）
// - OFF のとき: 拡大アイコン（外向き矢印風）
// =============================================================================

export type FullscreenToggleButtonView = {
  refresh: () => void
  setSelected: (selected: boolean) => void
  toggle: () => void
}

export function createFullscreenToggleButton(
  scene: Phaser.Scene,
  onFocus?: () => void,
): FullscreenToggleButtonView {
  // BGM ボタンが (GAME_WIDTH - 30, GAME_HEIGHT - 30) なので、その左に 50px 離す
  const centerX = GAME_WIDTH - 80
  const centerY = GAME_HEIGHT - 30
  const iconColor = 0xd4d4d8
  const depth = 520

  const circle = scene.add.circle(centerX, centerY, 19, 0x111111, 0)
  circle.setStrokeStyle(2, iconColor)
  circle.setInteractive({ useHandCursor: true })
  circle.setDepth(depth)

  // フルスクリーンアイコン（四隅の角）を Graphics で描く
  const iconGraphics = scene.add.graphics()
  iconGraphics.setDepth(depth)

  const statusText = scene.add.text(centerX, centerY - 30, '', {
    fontFamily: FONT_FAMILY_UI,
    fontSize: '11px',
    color: '#d4d4d8',
  })
  statusText.setOrigin(0.5)
  statusText.setDepth(depth)

  let isSelected = false

  /** 四隅の角マークを描画する */
  const drawIcon = (isFullscreen: boolean): void => {
    iconGraphics.clear()
    iconGraphics.lineStyle(2, iconColor, 1)

    const size = 6 // 角マークの辺の長さ
    if (isFullscreen) {
      // 縮小アイコン: 内向きの角（中央に寄る形）
      const inset = 4
      // 左上（内向き）
      iconGraphics.beginPath()
      iconGraphics.moveTo(centerX - inset - size, centerY - inset)
      iconGraphics.lineTo(centerX - inset, centerY - inset)
      iconGraphics.lineTo(centerX - inset, centerY - inset - size)
      iconGraphics.strokePath()
      // 右上
      iconGraphics.beginPath()
      iconGraphics.moveTo(centerX + inset + size, centerY - inset)
      iconGraphics.lineTo(centerX + inset, centerY - inset)
      iconGraphics.lineTo(centerX + inset, centerY - inset - size)
      iconGraphics.strokePath()
      // 左下
      iconGraphics.beginPath()
      iconGraphics.moveTo(centerX - inset - size, centerY + inset)
      iconGraphics.lineTo(centerX - inset, centerY + inset)
      iconGraphics.lineTo(centerX - inset, centerY + inset + size)
      iconGraphics.strokePath()
      // 右下
      iconGraphics.beginPath()
      iconGraphics.moveTo(centerX + inset + size, centerY + inset)
      iconGraphics.lineTo(centerX + inset, centerY + inset)
      iconGraphics.lineTo(centerX + inset, centerY + inset + size)
      iconGraphics.strokePath()
    } else {
      // 拡大アイコン: 外向きの角（四隅に広がる形）
      const edge = 10
      // 左上
      iconGraphics.beginPath()
      iconGraphics.moveTo(centerX - edge + size, centerY - edge)
      iconGraphics.lineTo(centerX - edge, centerY - edge)
      iconGraphics.lineTo(centerX - edge, centerY - edge + size)
      iconGraphics.strokePath()
      // 右上
      iconGraphics.beginPath()
      iconGraphics.moveTo(centerX + edge - size, centerY - edge)
      iconGraphics.lineTo(centerX + edge, centerY - edge)
      iconGraphics.lineTo(centerX + edge, centerY - edge + size)
      iconGraphics.strokePath()
      // 左下
      iconGraphics.beginPath()
      iconGraphics.moveTo(centerX - edge + size, centerY + edge)
      iconGraphics.lineTo(centerX - edge, centerY + edge)
      iconGraphics.lineTo(centerX - edge, centerY + edge + size)
      iconGraphics.strokePath()
      // 右下
      iconGraphics.beginPath()
      iconGraphics.moveTo(centerX + edge - size, centerY + edge)
      iconGraphics.lineTo(centerX + edge, centerY + edge)
      iconGraphics.lineTo(centerX + edge, centerY + edge + size)
      iconGraphics.strokePath()
    }
  }

  const refresh = (): void => {
    const isFullscreen = scene.scale.isFullscreen
    drawIcon(isFullscreen)
    statusText.setText(isFullscreen ? 'FULL ON' : 'FULL OFF')
    circle.setStrokeStyle(2, isSelected ? 0xfde68a : iconColor)
  }

  const toggle = (): void => {
    if (scene.scale.isFullscreen) {
      scene.scale.stopFullscreen()
    } else {
      scene.scale.startFullscreen()
    }
    // フルスクリーン切替は非同期なので少し待ってから表示を更新
    scene.time.delayedCall(100, refresh)
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
