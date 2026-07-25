import { GenericPreloadScene } from '../../../core/scenes/GenericPreloadScene'
import { SURVIVOR_ASSET_MANIFEST } from '../constants/assetManifest'

/**
 * Survivor 用 Preload — core の GenericPreloadScene にマニフェストを渡す。
 */
export class PreloadScene extends GenericPreloadScene {
  constructor() {
    super({
      sceneKey: 'PreloadScene',
      manifest: SURVIVOR_ASSET_MANIFEST,
      nextSceneKey: 'TitleScene',
    })
  }
}
