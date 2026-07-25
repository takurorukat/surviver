# Project Context

## 概要

**Mage Survivor** は、固定画面・ステージ制のサバイバーアクションゲームです。プレイヤーは自動攻撃を行い、敵の撃破で得たXPからレベルアップ強化を選択して各エリアを攻略します。

現在公開対象の進行は Plains → Forest → Volcano → Earth Dungeon（内部ID: `ruins`）です。Castle と Abyss は `comingSoon` であり、開始できません。

リポジトリは複数ゲームを収める構成へ移行済みです。現時点の実装ゲームはSurvivorだけで、`src/main.ts` は `?game=survivor`（省略時もSurvivor）を解決してSurvivorを遅延ロードします。次作は同じリポジトリの `src/games/` 配下へ追加します。

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
| `src/main.ts` | URLパラメータからゲームIDを解決し、対象ゲームの起動処理を遅延ロードする共通エントリポイント |
| `src/games/survivor/` | Survivor固有のすべての実装。`scenes/`、`systems/`、`objects/`、`constants/`、`types/`、`ui/`、`utils/` を含む |
| `src/games/survivor/scenes/game/` | `GameScene` から切り出した床生成・特殊敵更新 |
| `src/games/survivor/objects/enemy/` | 敵種別、スポーン、HPバー、敵専用描画 |
| `src/games/survivor/audio/` | Survivor固有のSEキー対応・音声選択 |
| `src/core/audio/` | ゲーム非依存のBGMフェード、SE再生ポリシー、Web Audio再生ヘルパー |
| `src/core/scenes/` | アセットマニフェストと汎用Preloadシーン |
| `src/core/storage/` | バージョン付きlocalStorageの汎用基盤 |
| `src/core/progression/` | オフライン進行などのゲーム非依存な純粋計算 |
| `public/assets/` | 実行時アセット。画像・音声 |
| `docs/` | 仕様、設計、現在の状態 |
| `tools/` | BGM/SE生成などの開発専用ツール |

## コーディング規則

- TypeScriptのstrict型検査を維持する。`any` と型抑制を避ける。
- Phaser依存のSurvivor処理は `src/games/survivor/scenes` / `objects` / `systems` に置き、計算ロジックは可能な限り純粋関数にする。
- Survivorの数値・アセットパス・ゲームバランスは `src/games/survivor/constants/` に集約する。
- 複数ゲームで実証済みの汎用処理だけを `src/core/` に置く。Survivor固有の戦闘・保存・難易度を先回りして共通化しない。
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
