/**
 * ステージの外側背景・枠・床を描画する。
 * GameScene.create から createStageBackgroundAndFloor を呼ぶ。
 */
import Phaser from 'phaser'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PLAY_AREA_ORIGIN_X,
  PLAY_AREA_ORIGIN_Y,
  PLAY_AREA_WIDTH,
  PLAY_AREA_HEIGHT,
  getStageFloorColor,
  FLOOR_DARKEN_ALPHA,
  VOLCANO_FLOOR_TILE_BLOCK_INDEX,
  VOLCANO_FLOOR_RED_OVERLAY_COLOR,
  getVolcanoFloorRedOverlayAlpha,
  getVolcanoFloorDarkenAlpha,
  PLAINS_FLOOR_TILESET_KEY,
  PLAINS_FLOOR_BLOCK_HEIGHT,
  PLAINS_FLOOR_BLOCK_COUNT,
  PLAINS_FLOOR_SOURCE_CROP_X,
  PLAINS_FLOOR_SOURCE_CROP_Y_OFFSET,
  PLAINS_FLOOR_SOURCE_CROP_SIZE,
  PLAINS_FLOOR_TILE_DISPLAY_SIZE,
  FLOOR_DETAIL_TILESET_KEY,
  FLOOR_DETAIL_TILE_SIZE,
  FLOOR_DETAIL_DISPLAY_SIZE,
  FOREST_DETAIL_TILES,
  FOREST_DETAIL_GRID_SIZE,
  FOREST_DETAIL_CHANCE,
} from '../../GameConstants'

/**
 * 外側背景＋枠＋床をまとめて作る。
 * areaId / stageNumber / areaStageCount で床の見た目が変わる。
 */
export function createStageBackgroundAndFloor(
  scene: Phaser.Scene,
  areaId: string,
  stageNumber: number,
  areaStageCount: number,
): void {
  createOuterBackground(scene)
  createPlayAreaFrame(scene)
  createFloor(scene, areaId, stageNumber, areaStageCount)
}

// 役割: 画面全体の暗い背景（プレイエリアの外側）を描く
function createOuterBackground(scene: Phaser.Scene): void {
  scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0f172a)
}

// 役割: プレイエリアの枠（少し大きめの半透明四角）を描く
function createPlayAreaFrame(scene: Phaser.Scene): void {
  const frameCenterX = PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH / 2
  const frameCenterY = PLAY_AREA_ORIGIN_Y + PLAY_AREA_HEIGHT / 2
  scene.add.rectangle(
    frameCenterX,
    frameCenterY,
    PLAY_AREA_WIDTH + 4,
    PLAY_AREA_HEIGHT + 4,
    0x000000,
    0.35,
  )
}

// 役割: ステージに応じた床をプレイエリアに敷く
// Plains / Forest / Volcano は Plains タイルシート。Forest は枝・葉、Volcano は赤→黒。
// 他エリアは従来の単色四角
function createFloor(
  scene: Phaser.Scene,
  areaId: string,
  stageNumber: number,
  areaStageCount: number,
): void {
  if (areaId === 'plains') {
    createTiledFloor(scene, areaId, stageNumber, areaStageCount, false)
    createFloorDarkenOverlay(scene, FLOOR_DARKEN_ALPHA)
    return
  }
  if (areaId === 'forest') {
    createTiledFloor(scene, areaId, stageNumber, areaStageCount, true)
    createFloorDarkenOverlay(scene, FLOOR_DARKEN_ALPHA)
    return
  }
  if (areaId === 'volcano') {
    // Plains と同じタイル（一番明るい色）＋ 赤オーバーレイ＋黒で徐々に暗く
    createTiledFloor(
      scene,
      areaId,
      stageNumber,
      areaStageCount,
      false,
      VOLCANO_FLOOR_TILE_BLOCK_INDEX,
    )
    createVolcanoFloorOverlays(scene, stageNumber)
    return
  }

  const floorColor = getStageFloorColor(stageNumber, areaStageCount)
  const floorCenterX = PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH / 2
  const floorCenterY = PLAY_AREA_ORIGIN_Y + PLAY_AREA_HEIGHT / 2

  scene.add.rectangle(
    floorCenterX,
    floorCenterY,
    PLAY_AREA_WIDTH,
    PLAY_AREA_HEIGHT,
    floorColor,
  )
  createFloorDarkenOverlay(scene, FLOOR_DARKEN_ALPHA)
}

// 役割: Volcano 用。明るい赤から、ステージが進むほど黒く見せる
function createVolcanoFloorOverlays(scene: Phaser.Scene, stageNumber: number): void {
  const centerX = PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH / 2
  const centerY = PLAY_AREA_ORIGIN_Y + PLAY_AREA_HEIGHT / 2
  const redAlpha = getVolcanoFloorRedOverlayAlpha(stageNumber)
  const darkAlpha = getVolcanoFloorDarkenAlpha(stageNumber)

  const redOverlay = scene.add.rectangle(
    centerX,
    centerY,
    PLAY_AREA_WIDTH,
    PLAY_AREA_HEIGHT,
    VOLCANO_FLOOR_RED_OVERLAY_COLOR,
    redAlpha,
  )
  redOverlay.setDepth(0)

  createFloorDarkenOverlay(scene, darkAlpha)
}

// 役割: 床の上に半透明の黒を重ねて、フィールド全体を暗めに見せる
function createFloorDarkenOverlay(scene: Phaser.Scene, darkenAlpha: number): void {
  const overlay = scene.add.rectangle(
    PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH / 2,
    PLAY_AREA_ORIGIN_Y + PLAY_AREA_HEIGHT / 2,
    PLAY_AREA_WIDTH,
    PLAY_AREA_HEIGHT,
    0x000000,
    darkenAlpha,
  )
  // 生成順で床の直後に追加しているため、キャラや弾より下に表示される
  overlay.setDepth(0)
}

// 役割: 床タイルを敷き詰めた1枚絵テクスチャを作って表示する
// タイルシートは縦に5色。Stage 1 = 一番上の色、Stage 2 = 2番目... と順に使う
// withForestDetails が true のときは枝・草・葉の装飾をランダムに散らす
// forceBlockIndex を渡すと、ステージ番号ではなく指定色ブロックを使う（Volcano 用）
function createTiledFloor(
  scene: Phaser.Scene,
  areaId: string,
  stageNumber: number,
  areaStageCount: number,
  withForestDetails: boolean,
  forceBlockIndex?: number,
): void {
  let blockIndex = Math.min(stageNumber - 1, PLAINS_FLOOR_BLOCK_COUNT - 1)
  if (forceBlockIndex !== undefined) {
    blockIndex = Math.min(
      Math.max(0, forceBlockIndex),
      PLAINS_FLOOR_BLOCK_COUNT - 1,
    )
  }
  const textureKey = `${areaId}-floor-stage-${blockIndex}`

  if (!scene.textures.exists(textureKey)) {
    const canvasTexture = scene.textures.createCanvas(
      textureKey,
      PLAY_AREA_WIDTH,
      PLAY_AREA_HEIGHT,
    )
    if (canvasTexture === null) {
      // 万一テクスチャが作れなければ従来の単色床にフォールバック
      const floorColor = getStageFloorColor(stageNumber, areaStageCount)
      scene.add.rectangle(
        PLAY_AREA_ORIGIN_X + PLAY_AREA_WIDTH / 2,
        PLAY_AREA_ORIGIN_Y + PLAY_AREA_HEIGHT / 2,
        PLAY_AREA_WIDTH,
        PLAY_AREA_HEIGHT,
        floorColor,
      )
      return
    }

    const context = canvasTexture.getContext()
    const sourceImage = scene.textures
      .get(PLAINS_FLOOR_TILESET_KEY)
      .getSourceImage() as HTMLImageElement
    // ドット絵がぼやけないよう補間を切る
    context.imageSmoothingEnabled = false

    // 右側のベタ塗りタイルの、完全に不透明な内側だけを使う（黒透けを防ぐ）
    const sourceY =
      blockIndex * PLAINS_FLOOR_BLOCK_HEIGHT + PLAINS_FLOOR_SOURCE_CROP_Y_OFFSET
    // Python: for y in range(0, H, size): for x in range(0, W, size): に相当
    for (let y = 0; y < PLAY_AREA_HEIGHT; y += PLAINS_FLOOR_TILE_DISPLAY_SIZE) {
      for (let x = 0; x < PLAY_AREA_WIDTH; x += PLAINS_FLOOR_TILE_DISPLAY_SIZE) {
        context.drawImage(
          sourceImage,
          PLAINS_FLOOR_SOURCE_CROP_X,
          sourceY,
          PLAINS_FLOOR_SOURCE_CROP_SIZE,
          PLAINS_FLOOR_SOURCE_CROP_SIZE,
          x,
          y,
          PLAINS_FLOOR_TILE_DISPLAY_SIZE,
          PLAINS_FLOOR_TILE_DISPLAY_SIZE,
        )
      }
    }

    if (withForestDetails) {
      drawForestDetailsOnFloor(scene, context)
    }
    canvasTexture.refresh()
  }

  const floorImage = scene.add.image(PLAY_AREA_ORIGIN_X, PLAY_AREA_ORIGIN_Y, textureKey)
  floorImage.setOrigin(0, 0)
}

// 役割: 床テクスチャの上に、枝・小枝・草・葉の装飾をランダムに描く
// 格子ごとに確率で1つ置き、位置を少しずらして自然に見せる
function drawForestDetailsOnFloor(
  scene: Phaser.Scene,
  context: CanvasRenderingContext2D,
): void {
  const detailSource = scene.textures
    .get(FLOOR_DETAIL_TILESET_KEY)
    .getSourceImage() as HTMLImageElement

  for (let y = 0; y < PLAY_AREA_HEIGHT; y += FOREST_DETAIL_GRID_SIZE) {
    for (let x = 0; x < PLAY_AREA_WIDTH; x += FOREST_DETAIL_GRID_SIZE) {
      if (Math.random() >= FOREST_DETAIL_CHANCE) {
        continue
      }

      const tile =
        FOREST_DETAIL_TILES[Phaser.Math.Between(0, FOREST_DETAIL_TILES.length - 1)]
      // 格子内でランダムにずらす（はみ出さない範囲）
      const maxOffset = FOREST_DETAIL_GRID_SIZE - FLOOR_DETAIL_DISPLAY_SIZE
      const offsetX = Phaser.Math.Between(0, maxOffset)
      const offsetY = Phaser.Math.Between(0, maxOffset)

      context.drawImage(
        detailSource,
        tile.column * FLOOR_DETAIL_TILE_SIZE,
        tile.row * FLOOR_DETAIL_TILE_SIZE,
        FLOOR_DETAIL_TILE_SIZE,
        FLOOR_DETAIL_TILE_SIZE,
        x + offsetX,
        y + offsetY,
        FLOOR_DETAIL_DISPLAY_SIZE,
        FLOOR_DETAIL_DISPLAY_SIZE,
      )
    }
  }
}
