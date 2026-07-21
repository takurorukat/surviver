import Phaser from 'phaser'

// =============================================================================
// BootScene — 最初に起動するシーン
//
// 役割:
//   ゲーム用フォント（Press Start 2P / Silkscreen）の読み込みを待ってから
//   PreloadScene へ渡す。待たないと最初に作った文字が別フォントで
//   描画されてしまい、ホバーなどで再描画したときだけ直るため。
//
// セーブデータ:
//   localStorage のセーブは保持する（Reset Save はタイトル画面から）。
// =============================================================================

// フォント読み込みの最大待ち時間（ミリ秒）。オフラインでも起動できるようにする
const FONT_LOAD_TIMEOUT_MS = 5000

// 実際にゲームで使う指定（太字も含む）。Plains など bold の文字はこれがないとズレる
const FONT_FACES_TO_LOAD = [
  '16px "Press Start 2P"',
  '16px "Silkscreen"',
  'bold 16px "Silkscreen"',
  '700 16px "Silkscreen"',
  // 開始カウントダウン用（初回表示のカクつき防止）
  'bold 72px "Silkscreen"',
  'bold 56px "Silkscreen"',
]

function waitMilliseconds(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

/** 指定のフォントがすべて使える状態になるまで待つ（時間切れあり）。 */
async function waitForGameFonts(): Promise<void> {
  // CSS の @font-face 登録が終わるのを待つ
  if (document.fonts !== undefined) {
    try {
      await document.fonts.ready
    } catch (_error) {
      // 古い環境でも先へ進む
    }

    // 通常・太字を明示的にロード（load しないと bold が後から差し替わる）
    const loadJobs: Promise<FontFace[]>[] = []
    for (let index = 0; index < FONT_FACES_TO_LOAD.length; index++) {
      loadJobs.push(document.fonts.load(FONT_FACES_TO_LOAD[index]))
    }
    try {
      await Promise.all(loadJobs)
    } catch (_error) {
      // 失敗してもタイムアウト側で進む
    }

    // check が true になるまで短く再確認（描画直前の取りこぼし対策）
    for (let attempt = 0; attempt < 30; attempt++) {
      let allReady = true
      for (let index = 0; index < FONT_FACES_TO_LOAD.length; index++) {
        if (!document.fonts.check(FONT_FACES_TO_LOAD[index])) {
          allReady = false
        }
      }
      if (allReady) {
        return
      }
      await waitMilliseconds(50)
    }
  }
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  create(): void {
    // Python: asyncio.wait_for(wait_for_game_fonts(), timeout=5) に相当
    Promise.race([waitForGameFonts(), waitMilliseconds(FONT_LOAD_TIMEOUT_MS)])
      .catch(() => undefined)
      .then(() => {
        this.scene.start('PreloadScene')
      })
  }
}
