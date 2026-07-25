# Architecture

## 起動とシーン遷移

```text
BootScene → PreloadScene → TitleScene → GameScene
                                      ↑        │
                                      └────────┘
```

- `BootScene`: Phaserの初期セットアップ。
- `PreloadScene`: 画像・音声・スプライトをロードする。
- `TitleScene`: エリア選択、設定、実績、開発用導線を提供する。初回ゲーム開始時に `GameScene` を遅延ロードする。
- `GameScene`: 1ステージの状態を保持し、各Systemを呼び出してゲームループを統括する。

## ゲームループ

`GameScene.update()` は状態に応じた早期returnを使い、以下の順で進行します。

1. 設定、確認ダイアログ、実績、死亡、結果表示、レベルアップなどの停止状態を処理
2. ステージ進行中ならタイマー、敵移動、プレイヤー攻撃、敵攻撃、コイン吸引、特殊敵更新、クリア判定を処理
3. HUD・射程表示・ヒットボックス表示を更新
4. 入力とノックバックを反映し、Arcade Physicsを固定ステップで1回更新

Arcade Physicsは重力なし・固定ステップで動作します。高速弾のすり抜け対策として物理FPSを描画FPSより高く設定しています。

## 状態管理

- `GameScene` がラン中のHP、XP、レベル、強化、停止フラグを所有する。
- `CarriedProgress` はステージ間で成長状態を引き継ぐ。通常エリアは次ステージ開始時に全快し、Ruinsだけは残HPを維持する。
- 永続データは `UnlockSaveSystem` がlocalStorageへ保存する。実績、解放、ゴールド、ショップ、統計を含む。
- `src/core/storage/` は将来の別ゲーム用の汎用保存基盤であり、現行Survivorの保存形式を直接置き換えてはいない。

## 主要な責務分割

| 層 | 主な責務 |
| --- | --- |
| `constants` | バランス、アセット、エリア、純粋計算 |
| `objects` | Phaserゲームオブジェクトの生成・表示・物理情報 |
| `systems` | 複数オブジェクトにまたがるゲームルール・UI・演出 |
| `scenes` | ライフサイクルと機能の接続 |
| `core` | Phaser非依存で再利用可能な保存・進行ロジック |

## 音声

- 実行時は `GameAudioSystem` がOGGをWeb Audio APIで再生する。
- BGMとSEは別に扱う。
- `tools/sfx_designer/` はTone.jsでSEをオフライン生成する開発専用ツール。BGMは生成対象外。
- `tools/game_music_generator/` はBGMと結果ジングル用。短尺SE生成器はdeprecated。

## テスト境界

- 保存移行、ショップ価格、エリア解放、レベルアップ候補、敵種別選択、Ruins HP進行はVitestで検証する。
- Phaserの実機操作・見た目・音の体感は自動テスト対象外であり、手動プレイ確認が必要。
