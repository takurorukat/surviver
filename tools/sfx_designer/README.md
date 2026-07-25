# SFX Designer（Tone.js オフライン生成）

開発用の効果音生成ツールです。Tone.js は **このディレクトリだけ** で使い、ゲーム本体の `src/` や本番バンドルには入りません。

実行時のゲームは、これまでどおり `public/assets/audio/*.ogg` を Phaser / GameAudioSystem で再生します。

## 重要

- 本番ランタイムで Tone.js をリアルタイム合成しない
- **BGM は対象外**（`title_bgm` / `plains_bgm` / `forest_bgm` / `volcano_bgm` / `ruins_bgm` / `area_clear_bgm` は一切触らない）
- 正式 SE を更新するコマンドでは、先に `backups/<timestamp>/` へバックアップを作る
- 生成物は先に `output/` へ出し、品質検査に通ったものだけ正式配置する

## 事前検査（非破壊）

`--check` は **ファイルを書き変えません**。正式 OGG の上書き・バックアップ作成・音声削除は行いません。

```bash
npm run generate:sfx -- --check
```

または:

```bash
cd tools/sfx_designer
npm run check
```

確認内容の例:

- Node / npm / ffmpeg / ffprobe
- `presets.ts` と `manifest.ts` の整合
- 出力先・バックアップ先のパス表示
- BGM が生成対象に含まれていないこと

## 正式 SE を更新する（破壊的・要注意）

```bash
npm run generate:sfx
```

流れ:

1. `tools/sfx_designer/backups/<timestamp>/` へ既存正式 SE をコピー
2. `presets.ts` の設計値で Tone.Offline レンダー → WAV
3. ffmpeg で mono / 44.1kHz / OGG へ変換（`output/`）
4. 秒数・ピーク（-1dB以下）・末尾無音・チャンネルを検査
5. 合格ファイルだけ `public/assets/audio/` へコピー
6. BGM のハッシュ・サイズが変わっていないことを確認

初回のみツール依存のインストール:

```bash
cd tools/sfx_designer
npm install
```

### サンドボックス / tsx について

一部の制限付き環境では `tsx` が IPC 用ソケットで `EPERM` になることがあります（Cursor サンドボックス等）。その場合はローカルの通常ターミナルで同じコマンドを実行してください。生成方式自体（Tone.js オフライン）は変更しません。

## 設計データの場所

- `presets.ts` … 各 SE の duration / gain / filter / noise など
- `manifest.ts` … ファイル名・用途・生成方式
- `src/patches.ts` … Tone.js パッチ（音色差で属性を区別）
- `src/check.ts` … `--check` 非破壊検査
- `src/generate.ts` … バックアップ・生成・検査・配置
- `src/cli.ts` … `--check` / 生成の振り分け
- `output/*.json` … 生成ファイルごとのプリセット記録

## 旧 Python 生成器について

`tools/game_music_generator/scripts/regen_element_bullet_sfx.py` は **deprecated** です。
正式 SE の上書きはデフォルトで拒否します。必要なら `--force-legacy` を明示してください。
