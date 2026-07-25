# Project Context

## 概要

**Mage Survivor** は、固定画面・ステージ制のサバイバーアクションゲームです。プレイヤーは自動攻撃を行い、敵の撃破で得たXPからレベルアップ強化を選択して各エリアを攻略します。

現在公開対象の進行は Plains → Forest → Volcano → Earth Dungeon（内部ID: `ruins`）です。Castle と Abyss は `comingSoon` であり、開始できません。

## 技術スタック

- TypeScript（strict）
- Phaser 3（Arcade Physics）
- Vite
- Vitest + happy-dom
- Web Audio APIによるゲーム内再生
- Tone.jsベースの開発用SE生成ツール（`tools/sfx_designer/`）
- PythonベースのBGM生成ツール（`tools/game_music_generator/`）

## 主要ディレクトリ

| パス | 役割 |
| --- | --- |
| `src/scenes/` | Phaserシーン。起動、ロード、タイトル、ゲーム進行を担当 |
| `src/scenes/game/` | `GameScene` から切り出した床生成・特殊敵更新 |
| `src/objects/` | プレイヤー、弾、コイン、敵のゲームオブジェクト |
| `src/objects/enemy/` | 敵種別、スポーン、HPバー、敵専用描画 |
| `src/systems/` | 戦闘、Wave、HUD、保存、設定、音声、ステージ進行 |
| `src/constants/` | エリア、戦闘、敵、音声、UI、難易度の定数と純粋関数 |
| `src/core/` | 将来の別ゲームにも再利用する保存・進行ユーティリティ |
| `src/types/` | シーン間で引き継ぐ型 |
| `src/utils/` | Phaser依存の小さな補助関数 |
| `public/assets/` | 実行時アセット。画像・音声 |
| `docs/` | 仕様、設計、現在の状態 |
| `tools/` | BGM/SE生成などの開発専用ツール |

## コーディング規則

- TypeScriptのstrict型検査を維持する。`any` と型抑制を避ける。
- Phaser依存の処理は `scenes` / `objects` / `systems` に置き、計算ロジックは可能な限り純粋関数にする。
- 数値・アセットパス・ゲームバランスは `src/constants/` に集約する。
- 新しいロジックには、必要に応じてVitestの単体テストを追加する。
- 既存のlocalStorage保存形式を変更する場合は、移行処理とテストを必ず追加する。
- 開発専用ツールを `src/` へimportしない。ゲーム実行時に不要な依存を含めない。
- 未コミットの変更はユーザーの作業として扱い、明示的な依頼なしに削除・巻き戻ししない。

## 開発コマンド

```bash
npm run typecheck
npm test
npm run build
npm run generate:sfx -- --check
```

`generate:sfx -- --check` は非破壊検査です。正式SEを更新する `npm run generate:sfx` は、音の確認と明示的な許可がある場合だけ実行します。
