/**
 * 独立 SFX Preview ツールの起動入口。
 * Production Game / Settings には接続しない。
 */
import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '../../../src/games/survivor/GameConstants'
import { SfxPreviewSystem } from './SfxPreviewSystem'

class SfxPreviewHostScene extends Phaser.Scene {
  private preview: SfxPreviewSystem | null = null

  constructor() {
    super({ key: 'SfxPreviewHostScene' })
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x0f172a)
    this.preview = new SfxPreviewSystem(this, {
      audioSystem: {
        unlock: () => {
          // HTMLAudio 再生前のユーザー操作コンテキスト用（GameAudio には依存しない）
          try {
            this.sound.unlock()
          } catch (_error) {
            // unlock 失敗でも Catalog UI は開く
          }
        },
      },
      onClose: () => {
        // ツールでは閉じても再オープンできるようにする
        window.setTimeout(() => {
          if (this.preview !== null) {
            this.preview.open()
          }
        }, 200)
      },
    })
    this.preview.open()
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0f172a',
  scene: [SfxPreviewHostScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  audio: {
    disableWebAudio: false,
  },
})

void game
