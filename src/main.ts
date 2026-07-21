import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT, ARCADE_PHYSICS_FPS } from './GameConstants'
import { BootScene } from './scenes/BootScene'
import { PreloadScene } from './scenes/PreloadScene'
import { TitleScene } from './scenes/TitleScene'
import { GameScene } from './scenes/GameScene'

// =============================================================================
// エントリポイント（このファイルがゲームの「起動スイッチ」）
//
// 役割:
//   Phaser.Game を1つ作り、画面サイズ・物理・シーン一覧を渡す。
//   以降の画面遷移は各 Scene が this.scene.start(...) で行う。
//
// シーンの流れ（配列の先頭から順に登録。最初に自動起動するのは BootScene）:
//   BootScene → PreloadScene → TitleScene → GameScene
//
// 関連:
//   - 画面サイズ定数は GameConstants.ts
//   - HTML 側の <div id="game-container"> にキャンバスが埋め込まれる
// =============================================================================

const gameConfig: Phaser.Types.Core.GameConfig = {
  // AUTO = WebGL が使えれば WebGL、ダメなら Canvas
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  // index.html 内の親要素 ID。ここに canvas が追加される
  parent: 'game-container',
  backgroundColor: '#000000',
  physics: {
    // このゲームは Arcade Physics（シンプルな速度ベースの物理）だけ使う
    default: 'arcade',
    arcade: {
      // サバイバー系なので重力なし（上から落ちない）
      gravity: { x: 0, y: 0 },
      debug: false,
      // 物理は 60fps × サブステップ数 の固定刻み。
      // 刻みを細かくするのは高速弾のすり抜け（トンネリング）対策で、
      // Arcade Physics に CCD がないための Phaser 公式推奨のやり方。
      // 速度は px/秒 指定なので、体感の移動速度は 60fps のときと同じ。
      fps: ARCADE_PHYSICS_FPS,
      fixedStep: true,
    },
  },
  scale: {
    // ウィンドウに合わせて縦横比を保ったまま拡大縮小
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // Web Audio を明示（HTML5 Audio だと BGM ループが不安定になりやすい）
  audio: {
    disableWebAudio: false,
  },
  // 登録順の先頭シーン（BootScene）が起動時に自動で create される
  scene: [BootScene, PreloadScene, TitleScene, GameScene],
}

// この1行で Phaser が動き始める（以降は各 Scene のライフサイクルに任せる）
new Phaser.Game(gameConfig)
