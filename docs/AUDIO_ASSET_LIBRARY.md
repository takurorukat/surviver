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
| 敵撃破 | `enemy_defeat_candidate.ogg` | Kenney Impact Sounds |
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

## BGM方針

BGMは生成器の微調整ではなく、ループ済みでライセンスが明確な完成楽曲を試聴・選定して差し替える。候補にはCC0のOpenGameArt音楽などを使用し、採用前にループ品質と世界観を確認する。BGMの正式差し替えは候補の試聴・採用判断後に行う。
