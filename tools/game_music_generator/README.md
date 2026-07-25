# Game Music Generator

Python だけでゲーム向けループ BGM（MIDI）を生成する OSS 向けライブラリです。

- AI API 不要
- 完全無料の依存（pretty_midi / music21 / numpy）
- 商用ゲーム利用を想定（MIT）
- ループしやすい小節数に丸める
- **既定レンダラは FluidSynth + SoundFont**（なければ SoftSynth に自動フォールバック）

## リポジトリ方針（大容量は Git 外）

このツール配下の次は **Git 管理対象外**（ルート `.gitignore` でも除外）:

| パス | 内容 | 目安サイズ |
|------|------|------------|
| `.venv` / `.venv312` | Python 仮想環境 | 数百 MB |
| `soundfonts/*.sf2` | SoundFont | 数 MB〜 |
| `output/` | 生成 MIDI/WAV/OGG | 百 MB 級になり得る |
| `input/` | 作業用入力 | 可変 |

ゲーム本体に載せる完成音源は `public/assets/audio/` のみ。生成バックアップ（`*_backup.ogg` 等）も Git 外。

別リポジトリや Git LFS へ移す場合も、上記をそちら側で管理する想定です。

## インストール

```bash
cd tools/game_music_generator
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# SoundFont レンダー用（推奨）
brew install fluid-synth
# soundfonts/TimGM6mb.sf2 が無い場合は pretty_midi 同梱のものをコピー
```

## 使い方

```bash
# 平原 BGM（SoundFont で OGG）
python main.py plains --ogg

# 旧 SoftSynth（正弦波）で出す
python main.py plains --ogg --renderer soft

# シード固定・長さ・テンポ指定
python main.py plains --seed 42 --length 60 --tempo 110 --ogg
```

## ゲーム用アセット一括入れ替え（SoundFont）

```bash
cd tools/game_music_generator
source .venv312/bin/activate   # 環境に合わせて
python scripts/install_soundfont_audio.py
```

- 現行の `public/assets/audio/*.ogg` は `public/assets/audio/_softsynth_backup/latest/` に退避
- FluidSynth + `soundfonts/TimGM6mb.sf2` で再レンダーして上書き

### SoftSynth 版に戻す

```bash
python scripts/restore_softsynth_audio.py
# 特定時刻のバックアップから戻す場合
python scripts/restore_softsynth_audio.py --from 20260724_105000
```

## テーマ / ジングル

BGM: `plains` / `forest` / `dungeon` / `town` / `boss` / `castle` / `desert` / `ice` / `volcano` / `title`

SFX: `game_over` / `level_up` / `stage_clear` / `area_clear`（長い結果ジングルのみ MIDI）

### 短尺 SE（波形合成・唯一の生成元）

外部 SE 素材は使わず、Python 波形合成だけで管理します。

```bash
# a/b/c 候補を public/assets/audio/candidates/ へ
python tools/game_music_generator/scripts/regen_element_bullet_sfx.py --preview-pack

# 候補を正式ファイルへ採用
python tools/game_music_generator/scripts/regen_element_bullet_sfx.py --install enemy_defeat=b

# 全短尺 SE を候補 a で正式採用
python tools/game_music_generator/scripts/regen_element_bullet_sfx.py --install-all a
```

対象: 属性弾・敵撃破／命中／防御・コイン・被弾・メニュー移動／キャンセル・ショップ購入。
戦闘 SE は最大 0.2s、UI SE は最大 0.3s。mono / 44.1kHz / OGG。ffmpeg で末尾無音除去とピーク -1dB 正規化。
ゲーム内: Settings → SFX Preview → Synth Candidates で a/b/c を聴き比べ。

## 今後のロードマップ

1. Phase 1: MIDI 生成（平原 MVP）✅
2. Phase 2: 全テーマの生成品質チューニング
3. Phase 3: ループ継ぎ目の改善・複数パターン一括生成
4. Phase 4: SoundFont による高品質 WAV/OGG 書き出し
5. Phase 5: 簡易 GUI（テーマ・テンポ・雰囲気）

## License

MIT License
