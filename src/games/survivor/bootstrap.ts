import Phaser from 'phaser'
import {
  ARCADE_PHYSICS_FPS,
  GAME_HEIGHT,
  GAME_WIDTH,
  PHYSICS_FPS,
} from './GameConstants'
import { BootScene } from './scenes/BootScene'
import { PreloadScene } from './scenes/PreloadScene'
import { TitleScene } from './scenes/TitleScene'
import { EndingScene } from './scenes/EndingScene'

/**
 * Survivor Stage の Phaser ゲームを起動する。
 */
export function startSurvivorGame(): Phaser.Game {
  const gameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#000000',
    fps: {
      target: PHYSICS_FPS,
      limit: PHYSICS_FPS,
      smoothStep: false,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
        fps: ARCADE_PHYSICS_FPS,
        fixedStep: true,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    audio: {
      disableWebAudio: false,
    },
    scene: [BootScene, PreloadScene, TitleScene, EndingScene],
  }

  return new Phaser.Game(gameConfig)
}
