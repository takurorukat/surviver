import Phaser from 'phaser'
import {
  type AssetManifest,
  loadAssetManifest,
} from './AssetManifest'

export type GenericPreloadSceneConfig = {
  /** Phaser シーンキー */
  sceneKey: string
  manifest: AssetManifest
  /** 読み込み完了後に遷移するシーンキー（onComplete 未指定時） */
  nextSceneKey?: string
  /** 読み込み完了後のコールバック（指定時は nextSceneKey より優先） */
  onComplete?: (scene: Phaser.Scene) => void
}

/**
 * アセットマニフェストを受け取り動的にロードする汎用 Preload シーン。
 * ゲーム固有のキー名は manifest 側で定義する。
 */
export class GenericPreloadScene extends Phaser.Scene {
  private readonly preloadConfig: GenericPreloadSceneConfig

  constructor(config: GenericPreloadSceneConfig) {
    super({ key: config.sceneKey })
    this.preloadConfig = config
  }

  preload(): void {
    loadAssetManifest(this, this.preloadConfig.manifest)
  }

  create(): void {
    if (this.preloadConfig.onComplete) {
      this.preloadConfig.onComplete(this)
      return
    }
    if (this.preloadConfig.nextSceneKey) {
      this.scene.start(this.preloadConfig.nextSceneKey)
    }
  }
}

/**
 * 既存シーンクラスから manifest だけ差し替えて使うヘルパー。
 */
export function preloadFromManifest(
  scene: Phaser.Scene,
  manifest: AssetManifest,
): void {
  loadAssetManifest(scene, manifest)
}

export function finishPreloadScene(
  scene: Phaser.Scene,
  nextSceneKey: string,
): void {
  scene.scene.start(nextSceneKey)
}
