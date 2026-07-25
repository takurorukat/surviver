/**
 * ゲーム非依存のアセットマニフェスト型。
 * GenericPreloadScene が Phaser loader へ渡す。
 */

export type AssetManifestImage = {
  key: string
  path: string
}

export type AssetManifestSpritesheet = {
  key: string
  path: string
  frameWidth: number
  frameHeight: number
}

export type AssetManifestAudio = {
  key: string
  paths: string | string[]
}

export interface AssetManifest {
  images?: AssetManifestImage[]
  spritesheets?: AssetManifestSpritesheet[]
  audio?: AssetManifestAudio[]
}

/**
 * マニフェストに従って Phaser の loader に登録する。
 */
export function loadAssetManifest(
  scene: Phaser.Scene,
  manifest: AssetManifest,
): void {
  scene.load.on('loaderror', (file: Phaser.Loader.File) => {
    console.warn('アセットの読み込みに失敗:', file.key, file.url)
  })

  const images = manifest.images ?? []
  for (let index = 0; index < images.length; index++) {
    const item = images[index]
    scene.load.image(item.key, item.path)
  }

  const spritesheets = manifest.spritesheets ?? []
  for (let index = 0; index < spritesheets.length; index++) {
    const item = spritesheets[index]
    scene.load.spritesheet(item.key, item.path, {
      frameWidth: item.frameWidth,
      frameHeight: item.frameHeight,
    })
  }

  const audioItems = manifest.audio ?? []
  for (let index = 0; index < audioItems.length; index++) {
    const item = audioItems[index]
    scene.load.audio(item.key, item.paths)
  }
}
