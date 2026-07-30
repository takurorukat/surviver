# Audio Asset Library

生成SEだけに依存せず、明確なライセンスを持つ既存素材を試聴・採用するための運用です。

## 同期

```bash
npm run sync:audio-library
```

このコマンドはKenney公式のCC0パックから候補SEを `public/assets/audio/library/kenney/` に同期し、ライセンス原文を `public/assets/audio/licenses/` に保存します。既存の正式SE/BGMは上書きしません。

## 採用済み素材

| 用途 | 候補ファイル | 配布元 |
| --- | --- | --- |
| 敵ヒット | `enemy_hit_candidate.ogg` | Kenney Impact Sounds |
| 敵撃破 | `enemy_defeat.ogg`（Tone.js 再生成。旧候補 `enemy_defeat_candidate.ogg` はライブラリに残置） | Repository 生成 |
| 土属性ヒット | `earth_hit_candidate.ogg` | Kenney Impact Sounds |
| コイン | `coin_pickup_candidate.ogg` | Kenney RPG Audio |
| メニュー移動／戻る／購入 | `menu_move_candidate.ogg`、`menu_cancel_candidate.ogg`、`purchase_candidate.ogg` | Kenney Interface Sounds |
| レベルアップ | `level_up_candidate.ogg` | Kenney Interface Sounds |

## 採用ルール

採用済みSEは `src/games/survivor/constants/audio.ts` からKenneyライブラリを参照する。属性魔法の発射音、レベルアップ音、BGMは、世界観・ループを試聴してから採用する。

## ライセンス

KenneyのRPG Audio、Impact Sounds、Interface SoundsはCC0です。商用利用・改変・クレジットなしでの利用が可能です。ライセンス原文と取得元は `public/assets/audio/licenses/` に保存します。

- RPG Audio: <https://kenney.nl/assets/rpg-audio>
- Impact Sounds: <https://kenney.nl/assets/impact-sounds>
- Interface Sounds: <https://kenney.nl/assets/interface-sounds>

## XP Bonus Fire Cast（2026-07-29）

- 用途: XP Bonus取得後の `fireOrb` 発射音
- 配布元: Kenney
- パック: Sci-Fi Sounds 1.0
- 公式ページ: <https://kenney.nl/assets/sci-fi-sounds>
- 実際の取得元: Kenney本人のOpenGameArt公開版
  <https://opengameart.org/content/sci-fi-sounds>
- ダウンロードURL:
  <https://opengameart.org/sites/default/files/sci-fi_sounds.zip>
- ライセンス: Creative Commons Zero（CC0）
- 取得日: 2026-07-29
- 原音: `Audio/thrusterFire_000.ogg`（5.000秒、mono、44100Hz）
- 原音SHA-256:
  `0fdc474d93f209debf1fc4ea77765a669dcb7676db31b4d8a0a509685bccf374`
- 加工: 先頭140msを使用、音量+4dB、末尾25ms fade-out、mono OGG Vorbis 44100Hz
- Runtime音源: `assets/audio/library/kenney/player_fire_fire_kenney.ogg`
- Runtime SHA-256:
  `158284640c88eb09bd4640ef0b45098bf7c9c219f92af8d3c4d7f205eac3e939`
- ライセンス原文:
  `public/assets/audio/licenses/kenney-sci-fi-sounds-CC0.txt`
- 未採用候補:
  `tools/audio_library/candidates/kenney-sci-fi-sounds/`
  （Production対象外）
  - `thrusterFire_001.ogg`: 5.000秒 /
    `924636edc923fe4aab5829b69dc5dc1c5d659dec5739865434dabee752a3bb79`
  - `laserSmall_000.ogg`: 0.239206秒 /
    `72b589eadd41781257ac859e4f4d030222e623390e4a1a83f6d05329a6e026f1`

### Rollback

- New: `assets/audio/library/kenney/player_fire_fire_kenney.ogg`
- Previous: `assets/audio/player_fire_fire.ogg`
- Previous SHA-256:
  `0bf51620e3ec94f762861cb681f8a91337b783318a3bc36fbabe324544b03d33`
- 戻し方: `SFX_PATH_PLAYER_FIRE_FIRE`をPreviousのパスへ戻す
- 旧音源は削除・上書きせず保持する

## BGM方針

BGMは生成器の微調整ではなく、ループ済みでライセンスが明確な完成楽曲を試聴・選定して差し替える。候補にはCC0のOpenGameArt音楽などを使用し、採用前にループ品質と世界観を確認する。BGMの正式差し替えは候補の試聴・採用判断後に行う。

## Runtime BGM（採用済み）

Title / Plains / Forest / Volcano / Ruins の5曲は同一パック由来です。

| 用途 | Runtime key | パス |
| --- | --- | --- |
| Title | `bgm-title` | `library/cc0-loop-pack/title.ogg` |
| Wind Plains | `bgm` | `library/cc0-loop-pack/plains.ogg` |
| Water Forest | `bgm-forest` | `library/cc0-loop-pack/forest.ogg` |
| Fire Volcano | `bgm-volcano` | `library/cc0-loop-pack/volcano.ogg` |
| Earth Dungeon | `bgm-ruins` | `library/cc0-loop-pack/ruins.ogg` |

- パック名: “Pack of loopable game music”
- 作者: obscure music (Gichco)
- 配布元: OpenGameArt.org
- ライセンス: CC0 1.0 / Public Domain（クレジット義務はないが自主的に Credits へ表示）
- 元ページ: <https://opengameart.org/content/pack-of-loopable-game-music>
- 証拠ファイル: `public/assets/audio/licenses/opengameart-cc0-loop-pack.txt`

### Ending での再利用

- Victory 画面: Plains BGM（`bgm`）を再利用（新しい音源コピーは作らない）
- Final Ascent 画面: Ruins BGM（`bgm-ruins`）を再利用
- `area_clear_bgm.ogg` は出所が不確定のため Ending では使用せず、Runtime／build 対象からも除外済み
- 短い Area Clear SFX（`area_clear.ogg` / `sfx-area-clear`）は別物で維持
