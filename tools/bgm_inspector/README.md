# BGM Inspector（非破壊）

ループ BGM の**曲頭・曲末の無音**と**ループ境界の違和感**を調査する開発用ツールです。

- `public/assets/audio/` の OGG を**読み取るだけ**（書き換え・削除なし）
- 対象: `title` / `plains` / `forest` / `volcano` / `ruins`
- ゲームランタイムには組み込まない

## 実行

```bash
# リポジトリルートから（sfx_designer の tsx を共用）
npm run inspect:bgm

# または tsx を直接
tools/sfx_designer/node_modules/.bin/tsx tools/bgm_inspector/src/inspect.ts
```

## 必要条件

- Node.js 18+
- ffmpeg / ffprobe（`brew install ffmpeg`）

## 出力の見方

| 項目 | 意味 |
|------|------|
| `leading` | 曲頭の無音長。長いと再生開始がポツッと遅れて聞こえる |
| `trailing` | 曲末の無音長。ループ時に無音の「穴」になりやすい |
| `loop seam` | 末尾と先頭の RMS 差（dB）。小さいほど波形のつなぎ目が近い |
| `suggested loopStart/loopEnd` | **参考値のみ**。自動検出の推測であり、本番設定には入れない |

## 本番ループ設定への反映フロー（TODO）

1. **生成側**（`tools/game_music_generator`）で「イントロ + シームレスループ区間」を明示的に出力する
2. 生成メタデータ JSON に `introEndSec` / `loopStartSec` / `loopEndSec` を記録する
3. ブラウザで耳確認後、のみ `src/games/survivor/constants/bgmLoop.ts` の
   `SURVIVOR_BGM_LOOP_BOUNDS` に検証済み値を追加する
4. 未検証の間は `SoundManager` はファイル全体（0〜duration）をループする

## 関連ファイル

- ランタイム: `src/core/audio/SoundManager.ts`（フェード + loop bounds）
- Survivor 設定: `src/games/survivor/constants/bgmLoop.ts`
- 定数: `src/games/survivor/constants/audio.ts`
