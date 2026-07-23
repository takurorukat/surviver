# Game Music Generator

Python だけでゲーム向けループ BGM（MIDI）を生成する OSS 向けライブラリです。

- AI API 不要
- 完全無料の依存（pretty_midi / music21 / numpy）
- 商用ゲーム利用を想定（MIT）
- ループしやすい小節数に丸める

## インストール

```bash
cd tools/game_music_generator
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 使い方

```bash
# 平原 BGM（60秒 / 110BPM / Key=C）
python main.py plains

# シード固定・長さ・テンポ指定
python main.py plains --seed 42 --length 60 --tempo 110

# WAV / OGG も出す（OGG は ffmpeg が必要）
python main.py plains --seed 42 --wav --ogg
```

出力例:

```text
output/plains_001.mid
output/plains_001.wav
output/plains_001.ogg
```

## サンプルコード

```python
from game_music_generator import GameMusicComposer
from game_music_generator.midi_writer import MidiWriter

composer = GameMusicComposer()
arrangement = composer.compose("plains", length_seconds=60, seed=42)
MidiWriter().write(arrangement, "output/plains_demo.mid")
```

## テーマ

`plains` / `forest` / `dungeon` / `town` / `boss` / `castle` / `desert` / `ice` / `volcano`

各テーマに Key・既定 Tempo・代表コード進行 3 種を持たせています。

## スクリーンショット用説明

1. CLI で `python main.py plains --seed 1` を実行
2. `output/plains_001.mid` を DAW やブラウザ MIDI プレイヤーで再生
3. メロディ / コード / ベース / ドラムの 4 トラック構成を確認

## 今後のロードマップ

1. Phase 1: MIDI 生成（平原 MVP）✅
2. Phase 2: 全テーマの生成品質チューニング
3. Phase 3: ループ継ぎ目の改善・複数パターン一括生成
4. Phase 4: SoundFont による高品質 WAV/OGG 書き出し
5. Phase 5: 簡易 GUI（テーマ・テンポ・雰囲気）

## License

MIT License
