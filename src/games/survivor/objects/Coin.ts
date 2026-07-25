/**
 * コイン（経験値ドロップ）の Group 生成とスポーン。
 *
 * 接続先:
 * - 敵撃破時などに trySpawnCoinAt
 * - 吸引: CoinMagnetSystem が magnetSpeed を増やしつつ body.setVelocity で引き寄せる
 * - 取得: overlap（プレイヤー × コイン）で XP 加算して destroy
 *
 * 重要: 生成時に必ず magnetSpeed = 0 をセットする（吸引ルール）。
 * 見た目は複数形があるが、内容はどれも同じ（1 XP）。
 * 座標は直接書き換えず、物理 velocity で動かす。
 */
import Phaser from 'phaser'
import {
  COIN_SIZE_MIN,
  COIN_SIZE_MAX,
  COIN_COLOR,
  COIN_XP_VALUE,
  MAX_COINS,
  ENTITY_OUTLINE_COLOR,
  ENTITY_OUTLINE_WIDTH,
  COIN_SPARKLE_SCALE,
  COIN_SPARKLE_DURATION_MS,
  COIN_SPARKLE_DELAY_MIN_MS,
  COIN_SPARKLE_DELAY_MAX_MS,
} from '../GameConstants'
import { applyDevEntityDepth } from '../utils/applyDevEntityDepth'

// 見た目だけ違うコイン（中身の XP は共通）
export type CoinView = Phaser.GameObjects.Shape

const COIN_SHAPE_COUNT = 5

/**
 * コイン用の Arcade Group を作る。
 * GameScene 起動時に1回作成し、ドロップのたびに trySpawnCoinAt で追加する。
 */
export function createCoinGroup(scene: Phaser.Scene): Phaser.Physics.Arcade.Group {
  return scene.physics.add.group()
}

/**
 * 画面上のコインが上限なら、いちばん古い1枚を消して枠を空ける。
 * 消したコインの XP は戻り値で返し、新しいコインへ引き継ぐ（経験値ロスト防止）。
 */
function takeOldestActiveCoinXp(coinGroup: Phaser.Physics.Arcade.Group): number {
  const children = coinGroup.getChildren()
  for (let index = 0; index < children.length; index++) {
    const coin = children[index] as CoinView
    if (!coin.active) {
      continue
    }

    const rawXp = coin.getData('xpValue')
    let xpValue = COIN_XP_VALUE
    if (typeof rawXp === 'number') {
      xpValue = Math.max(0, Math.floor(rawXp))
    }
    coin.destroy()
    return xpValue
  }
  return 0
}

// 役割: コイン1枚ごとの見た目サイズを決める（少しばらつかせる）
// Python: random.uniform(COIN_SIZE_MIN, COIN_SIZE_MAX) に相当
function pickRandomCoinSize(): number {
  return COIN_SIZE_MIN + Math.random() * (COIN_SIZE_MAX - COIN_SIZE_MIN)
}

// 役割: 見た目の形だけランダムに作る（中身は後で同じ xpValue を付ける）
function createCoinShape(
  scene: Phaser.Scene,
  spawnX: number,
  spawnY: number,
  size: number,
): CoinView {
  // Python: random.randint(0, COIN_SHAPE_COUNT - 1) に相当
  const shapeIndex = Math.floor(Math.random() * COIN_SHAPE_COUNT)
  const half = size / 2

  if (shapeIndex === 0) {
    // 四角（従来）
    return scene.add.rectangle(spawnX, spawnY, size, size, COIN_COLOR)
  }

  if (shapeIndex === 1) {
    // 円
    return scene.add.circle(spawnX, spawnY, half, COIN_COLOR)
  }

  if (shapeIndex === 2) {
    // ダイヤ（ひし形）
    return scene.add.polygon(
      spawnX,
      spawnY,
      [0, -half, half, 0, 0, half, -half, 0],
      COIN_COLOR,
    )
  }

  if (shapeIndex === 3) {
    // 星
    return scene.add.star(spawnX, spawnY, 5, half * 0.45, half, COIN_COLOR)
  }

  // 三角
  return scene.add.triangle(
    spawnX,
    spawnY,
    0,
    -half,
    half,
    half,
    -half,
    half,
    COIN_COLOR,
  )
}

// 役割: 待ち時間をランダムに決める（全コインが同時に光らないようにする）
// Python: random.uniform(min_ms, max_ms) に相当
function pickRandomSparkleDelayMs(): number {
  return (
    COIN_SPARKLE_DELAY_MIN_MS +
    Math.random() * (COIN_SPARKLE_DELAY_MAX_MS - COIN_SPARKLE_DELAY_MIN_MS)
  )
}

/**
 * コインを時々キラッと光らせる（拡大 + 白色化を短時間だけ行い、すぐ戻す）。
 * コインが小さくて見つけにくい問題への対策。コインが破棄されたら自動で止まる。
 */
function attachCoinSparkle(scene: Phaser.Scene, coin: CoinView): void {
  const sparkleTween = scene.tweens.add({
    targets: coin,
    scaleX: COIN_SPARKLE_SCALE,
    scaleY: COIN_SPARKLE_SCALE,
    duration: COIN_SPARKLE_DURATION_MS,
    yoyo: true,
    repeat: -1,
    delay: pickRandomSparkleDelayMs(),
    repeatDelay: pickRandomSparkleDelayMs(),
    // 光り始めに白へ、戻り始めに元の色へ切り替える
    onStart: () => {
      coin.setFillStyle(0xffffff)
    },
    onYoyo: () => {
      coin.setFillStyle(COIN_COLOR)
    },
    onRepeat: () => {
      coin.setFillStyle(0xffffff)
    },
  })

  coin.once('destroy', () => {
    sparkleTween.stop()
  })
}

/**
 * 指定座標にコインを1枚出す。上限時は古い1枚を消してから出す（ドロップは止めない）。
 * 見た目はランダムな形・大きさ。取得 XP は基本 COIN_XP_VALUE（1）。
 * 上限で古いコインを消すとき、その XP は新しいコインへ足し込む（消えて無くならない）。
 *
 * @param allowOverLimit true なら上限超過でも古いコインを消さず追加する
 * @returns 生成したコイン
 */
export function trySpawnCoinAt(
  scene: Phaser.Scene,
  coinGroup: Phaser.Physics.Arcade.Group,
  spawnX: number,
  spawnY: number,
  allowOverLimit: boolean = false,
): CoinView | null {
  let carriedXp = 0
  const activeCoinCount = countActiveCoins(coinGroup)
  if (activeCoinCount >= MAX_COINS && !allowOverLimit) {
    // 上限でもドロップを止めない。古いコインの XP は新しいコインへ引き継ぐ
    carriedXp = takeOldestActiveCoinXp(coinGroup)
  }

  const coinSize = pickRandomCoinSize()
  const coin = createCoinShape(scene, spawnX, spawnY, coinSize)
  coin.setDepth(6)
  // 床タイルに溶け込まないよう黒枠で囲む
  coin.setStrokeStyle(ENTITY_OUTLINE_WIDTH, ENTITY_OUTLINE_COLOR)

  scene.physics.add.existing(coin)
  const body = coin.body as Phaser.Physics.Arcade.Body
  body.moves = true
  body.setAllowGravity(false)
  body.setVelocity(0, 0)
  // 見た目の大きさに合わせた当たり判定
  body.setSize(coinSize, coinSize)

  // 基本1 XP。上限で消した古いコイン分があれば足す
  coin.setData('xpValue', COIN_XP_VALUE + carriedXp)
  // 吸引開始前の初期速度。CoinMagnetSystem がここから加速する
  coin.setData('magnetSpeed', 0)
  coinGroup.add(coin)
  body.updateFromGameObject()
  applyDevEntityDepth(coin)
  // 小さくて見失いやすいので、時々キラッと光らせる
  attachCoinSparkle(scene, coin)

  return coin
}

/**
 * 全敵撃破の時間ボーナスコインを、中央付近の床へ上から落とす。
 * 着地後は通常コインと同じく吸引で拾える（1枚 = 1 XP）。
 */
export function spawnClearTimeBonusCoinRain(
  scene: Phaser.Scene,
  coinGroup: Phaser.Physics.Arcade.Group,
  centerX: number,
  centerY: number,
  coinCount: number,
  fallHeight: number,
  spreadRadius: number,
  fallDurationMs: number,
): void {
  const safeCount = Math.max(0, Math.floor(coinCount))
  for (let index = 0; index < safeCount; index++) {
    const angle = Math.random() * Math.PI * 2
    const distance = Math.random() * spreadRadius
    const landX = centerX + Math.cos(angle) * distance
    const landY = centerY + Math.sin(angle) * distance
    const startY = landY - fallHeight

    const coin = trySpawnCoinAt(scene, coinGroup, landX, startY, true)
    if (coin === null) {
      continue
    }

    // 落下中は動かさない（吸引開始前に着地させる）
    const body = coin.body as Phaser.Physics.Arcade.Body
    body.moves = false
    body.setVelocity(0, 0)

    scene.tweens.add({
      targets: coin,
      y: landY,
      duration: fallDurationMs,
      ease: 'Cubic.In',
      delay: Math.floor(Math.random() * 80),
      onComplete: () => {
        if (!coin.active || coin.body === null) {
          return
        }
        const landedBody = coin.body as Phaser.Physics.Arcade.Body
        landedBody.moves = true
        landedBody.setVelocity(0, 0)
        coin.setData('magnetSpeed', 0)
      },
    })
  }
}

/**
 * active なコイン数を数える（上限判定用）。
 */
export function countActiveCoins(coinGroup: Phaser.Physics.Arcade.Group): number {
  const children = coinGroup.getChildren()
  let activeCount = 0

  for (let index = 0; index < children.length; index++) {
    const coin = children[index] as CoinView
    if (coin.active) {
      activeCount = activeCount + 1
    }
  }

  return activeCount
}
