# Current Status

最終更新: 2026-07-25

## 実装済み

- Phaser / TypeScript / Vite のゲーム起動・ビルド
- `src/main.ts` によるゲームID選択と、Survivor bootstrapの遅延ロード
- Survivor固有コードの `src/games/survivor/` への分離
- `src/core/` のゲーム非依存基盤（バージョン付き保存、オフライン進行、音声再生ポリシー、アセットマニフェスト／汎用Preload）
- 固定画面のサバイバー戦闘、Arcade Physics、キーボード・ポインタ操作
- Plains、Forest、Volcano、Earth Dungeonのエリア選択と解放進行
- 敵、弾、コイン、XP、レベルアップ、複合スキル、ステージクリア・敗北処理
- ゴールド、ショップ、実績、スキル封印、localStorage保存と保存移行
- 設定、BGM切替、SEプレビュー、開発時のみの進行解放ボタン
- BGM/SEアセットと、開発用の音声生成ツール
- 定数・敵・ステージ進行のモジュール分割
- Vitestによる保存、解放、ショップ、レベルアップ、敵選択、Ruins HP進行のテスト

## Earth Dungeon

- Stage 1: Stone Guardを実装済み。遅く、通常敵より少し硬い基本追跡敵。
- Ruins: レベルアップ時に全回復せず、ステージ間でも残HPを維持する。
- 推奨Max HP: Stage 1〜5で `4 / 4 / 5 / 5 / 6`。
- Stage 2以降のBurrower、Rune Pillar、混成ウェーブは未実装。
- 詳細な設計は `EARTH_DUNGEON_DESIGN.md` を参照する。

## 未実装・要判断

| 優先度 | 項目 | 状態 |
| --- | --- | --- |
| 高 | Ruins Stage 1の実機バランス確認 | 自動テスト済み、プレイ感の確認待ち |
| 高 | Ruins Stage 2のBurrower | 設計済み、未実装 |
| 中 | Rune PillarとRuins混成Stage | 設計済み、未実装 |
| 中 | 推奨Max HPをレベルアップ候補へどう反映するか | 数値は定義済み、ゲーム仕様の決定待ち |
| 中 | Shop / Seal Skills公開 | ロジック実装済み、`TITLE_SHOW_SHOP_AND_SEAL = false`で非表示 |
| 低 | Castle / Abyss | `comingSoon`、専用コンテンツ未実装 |
| 低 | 共通スターターの実証 | `core/storage`、`core/progression`、`core/audio`、`core/scenes` を追加済み。次作で実証してから拡張 |

## 品質確認

直近の確認結果:

- `npm run typecheck`: passed
- `npm test`: 65 tests passed
- `npm run build`: passed
- `git diff --check`: passed
- `npm run generate:sfx -- --check`: passed（正式OGGは未変更）

## 注意事項

- ワークツリーには大規模な未コミット変更がある。変更の削除・巻き戻しはユーザーの明示指示がある場合のみ行う。
- SEの正式再生成は `npm run generate:sfx` で行う。音の試聴・承認前に実行しない。
- 仕様上の詳細は `GAME_SPEC.md`、物理方針は `ROLLBACK_MANUAL_PHYSICS.md` を参照する。
