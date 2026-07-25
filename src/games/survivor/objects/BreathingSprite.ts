/**
 * 静止PNGモンスターを「呼吸」させつつ、背面の黒シルエットで枠を太く見せる。
 *
 * アウトライン方式:
 *   同じ画像を少し大きくして黒く塗りつぶし、背面に重ねる（実行時・元PNGは触らない）。
 *   枠は中心基準で拡大する（足元基準だと上が厚く下が薄くなるため）。
 *
 * 本体の原点は足元（bottom center）。伸び縮みしても浮かない。
 *
 * 左右向き（新規敵のデフォルト）:
 *   元画像は左向き想定。移動中は進行方向、停止中はプレイヤーを向く。
 *   右向き画像だけ facesLeftByDefault: false を渡す。向きを固定したいときだけ
 *   flipWithHorizontalMove: false を渡す。
 */
import Phaser from 'phaser'

export type BreathingSpriteConfig = {
  textureKey: string
  displayHeight: number
  // 本体に対する黒シルエットの拡大率（例: 1.1）
  outlineScale: number
  // 伸びたときの scaleY
  breathScaleYMax: number
  // 縮んだときの scaleY
  breathScaleYMin: number
  // 1往復（伸び→縮み）の時間ミリ秒
  breathDurationMs: number
  // 省略時 true。横移動に合わせて左右反転する
  flipWithHorizontalMove?: boolean
  // 省略時 true（元画像は左向き）。右向き画像なら false
  facesLeftByDefault?: boolean
}

export class BreathingSprite {
  readonly outline: Phaser.GameObjects.Image
  readonly body: Phaser.GameObjects.Image
  private scene: Phaser.Scene
  private baseScale: number
  private outlineScaleMultiplier: number
  private breathTween: Phaser.Tweens.Tween | null = null
  private flipWithHorizontalMove: boolean
  private facesLeftByDefault: boolean

  constructor(scene: Phaser.Scene, x: number, y: number, config: BreathingSpriteConfig) {
    this.scene = scene

    const texture = scene.textures.get(config.textureKey)
    const source = texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement
    const sourceHeight = source.height
    this.baseScale = config.displayHeight / sourceHeight
    this.outlineScaleMultiplier = config.outlineScale
    // 省略時は ON（新規敵は左向きPNG＋移動向き追従が標準）
    this.flipWithHorizontalMove = config.flipWithHorizontalMove !== false
    this.facesLeftByDefault = config.facesLeftByDefault !== false

    // 枠は中心基準で拡大 → 上下左右の太さが均等になる
    this.outline = scene.add.image(x, y, config.textureKey)
    this.outline.setOrigin(0.5, 0.5)
    this.outline.setTint(0x000000)
    this.outline.setScale(this.baseScale * this.outlineScaleMultiplier)

    // 本体は足元基準。伸び縮みしても下端が動かない
    this.body = scene.add.image(x, y, config.textureKey)
    this.body.setOrigin(0.5, 1)
    this.body.setScale(this.baseScale)

    this.syncOutlineToBody()
    this.startBreathing(config.breathScaleYMin, config.breathScaleYMax, config.breathDurationMs)
  }

  /** 敵の中心座標へ追従（足元は中心の少し下）。 */
  followEnemyCenter(centerX: number, centerY: number, enemyHeight: number): void {
    const feetY = centerY + enemyHeight / 2
    this.body.setPosition(centerX, feetY)
    this.syncOutlineToBody()
  }

  /**
   * 向きを更新する（呼吸スプライト敵の標準）。
   * - 横に動いている: 進行方向を向く
   * - 止まっている（横速度ほぼ0）: プレイヤーの方を向く
   * 左向きの元画像は、右を向くときだけ flipX する。
   */
  updateFacing(velocityX: number, selfX: number, playerX: number): void {
    if (!this.flipWithHorizontalMove) {
      return
    }

    let faceRight = false
    if (Math.abs(velocityX) > 1) {
      // 移動中は進行方向
      faceRight = velocityX > 0
    } else {
      // 停止中はプレイヤー側
      // Python: face_right = player_x > self_x に相当
      faceRight = playerX > selfX
    }

    // 左向き画像: 右を向くとき反転 / 右向き画像: 左を向くとき反転
    let shouldFlip = false
    if (this.facesLeftByDefault) {
      shouldFlip = faceRight
    } else {
      shouldFlip = !faceRight
    }
    this.body.setFlipX(shouldFlip)
    this.outline.setFlipX(shouldFlip)
  }

  setDepth(depth: number): void {
    this.outline.setDepth(depth)
    this.body.setDepth(depth + 1)
  }

  /** 撃破演出用に、本体と枠の両方を返す。 */
  getTweenTargets(): Phaser.GameObjects.Image[] {
    return [this.outline, this.body]
  }

  /** 撃破前に呼吸アニメを止める（フェード中に伸び縮みしないようにする）。 */
  stopBreathing(): void {
    if (this.breathTween !== null) {
      this.breathTween.stop()
      this.breathTween = null
    }
  }

  destroy(): void {
    this.stopBreathing()
    if (this.outline.active) {
      this.outline.destroy()
    }
    if (this.body.active) {
      this.body.destroy()
    }
  }

  /**
   * 枠を本体の見た目中心に合わせ、同じ比率で少し大きくする。
   * 本体は足元原点なので、中心は「足元から displayHeight/2 だけ上」。
   */
  private syncOutlineToBody(): void {
    const centerX = this.body.x
    const centerY = this.body.y - this.body.displayHeight / 2
    this.outline.setPosition(centerX, centerY)
    this.outline.setScale(
      this.body.scaleX * this.outlineScaleMultiplier,
      this.body.scaleY * this.outlineScaleMultiplier,
    )
  }

  private startBreathing(
    scaleYMin: number,
    scaleYMax: number,
    durationMs: number,
  ): void {
    // 体積感: Yが伸びるとき X を少し減らす（平均1付近を保つ）
    // Python: scale_x = 2 - scale_y に相当
    const bodyScaleXAtMax = this.baseScale * (2 - scaleYMax)
    const bodyScaleXAtMin = this.baseScale * (2 - scaleYMin)
    const bodyScaleYAtMax = this.baseScale * scaleYMax
    const bodyScaleYAtMin = this.baseScale * scaleYMin

    this.body.setScale(bodyScaleXAtMin, bodyScaleYAtMin)
    this.syncOutlineToBody()

    this.breathTween = this.scene.tweens.add({
      targets: this.body,
      scaleX: bodyScaleXAtMax,
      scaleY: bodyScaleYAtMax,
      duration: durationMs,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
      onUpdate: () => {
        this.syncOutlineToBody()
      },
    })
  }
}
