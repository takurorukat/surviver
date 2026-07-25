import Phaser from 'phaser'
import { FONT_FAMILY_UI } from '../GameConstants'

// =============================================================================
// 縦画面時の「横向きでプレイ」案内
//
// - 横長ゲーム（960×540）向け。縦持ちのときだけ中央に表示する
// - scrollFactor 0 で UI 固定。resize イベントで位置を更新する
// =============================================================================

export type OrientationGuideView = {
  destroy: () => void
}

export function createOrientationGuide(scene: Phaser.Scene): OrientationGuideView {
  const messageText = scene.add
    .text(0, 0, '横向きでプレイしてください', {
      fontFamily: FONT_FAMILY_UI,
      fontSize: '20px',
      color: '#ffffff',
      align: 'center',
      backgroundColor: '#000000cc',
      padding: { x: 16, y: 12 },
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(9999)
    .setVisible(false)

  const updateLayout = (): void => {
    const scaleWidth = scene.scale.width
    const scaleHeight = scene.scale.height
    const isPortrait = scaleHeight > scaleWidth
    messageText.setVisible(isPortrait)
    messageText.setPosition(scaleWidth / 2, scaleHeight / 2)
  }

  updateLayout()
  scene.scale.on('resize', updateLayout)

  return {
    destroy: () => {
      scene.scale.off('resize', updateLayout)
      messageText.destroy()
    },
  }
}
