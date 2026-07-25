# AI Handoff

Codex、Gemini CLI、Cursorの間で、作業状況を引き継ぐための共有記録です。会話ログの貼り付けは不要です。

> **全AIへの周知（2026-07-25）**: このプロジェクトでは、`TODO.md` と本ファイルを共有の作業キュー・引き継ぎ記録として使用します。Codex、Gemini CLI、Cursorは、次回の作業開始時からこのファイルを読み、終了時に更新してください。

## 利用方法

- 実装を始めるAIは、`TODO.md` とこのファイルを読んでから作業する。
- 同じ作業ツリーを複数のAIが同時に編集しない。`作業状態` が `作業中` かつ担当AIが自分以外なら、編集せずにその事実を報告して終了する。
- 作業を始めるAIは、担当AI・対象TODO・開始日時を更新してから編集する。
- 作業を終えるAIは、検証結果と次の担当への注意点を更新し、成功・失敗を問わず `待機中` に戻す。
- 既存の未コミット変更の所有者を推測しない。削除・巻き戻し・上書きはしない。
## 現在の状態

- 作業状態: 待機中
- 担当AI: なし
- 対象TODO: なし
- 開始日時: なし

## 直近の作業記録

### 2026-07-25 — Gemini CLI

- 実施内容: レベルアップSEをより明るい音源（Kenney `level_up_candidate.ogg`）へ変更。
- 変更ファイル: `src/games/survivor/constants/audio.ts`。
- 検証: `npm run typecheck` 成功、`npm test` 成功、`npm run build` 成功。

## 直近の作業記録

### 2026-07-25 — Codex

- 実施内容: レベルアップスキル選択時SEの不具合修正（イベント駆動の廃止と、GameSceneからの直接コールバック注入へ変更）。
- 変更ファイル: `src/games/survivor/systems/LevelUpChoiceSystem.ts`, `src/games/survivor/scenes/GameScene.ts`。
- 検証: `npm run typecheck` 成功、`npm test` 65件成功、`npm run build` 成功。
- 注意点: レベルアップSE再生は直接コールバック注入方式へ変更済み。

## 直近の作業記録

### 2026-07-25 — Gemini CLI

- 実施内容: スキルシンボルマークの拡大と配置調整（`UNLOCK_ICON_SIZE` を 13->16 に変更、`AchievementsPanelSystem` のフォントサイズを 13px->16px に調整）。
- 変更ファイル: `src/games/survivor/constants/ui.ts`, `src/games/survivor/systems/AchievementsPanelSystem.ts`。
- 検証: `npm run typecheck` 成功、`npm test` 成功、`npm run build` 成功。
- 次の実装可能TODO: `SoundManager` のBGMフェード・ループ境界制御の単体テストと実装確認。

## 直近の作業記録

### 2026-07-25 — Gemini CLI

- 実施内容: BGM検査ツールを用いた全BGMの無音/ループ境界調査と結果のドキュメント化（`docs/BGM_INSPECTION_RESULTS.md`）。
- 変更ファイル: `docs/BGM_INSPECTION_RESULTS.md`、`TODO.md`。
- 検証: `npm run typecheck` 成功、`npm test` 成功、`npm run build` 成功。
- 次の実装可能TODO: `SoundManager` のBGMフェード・ループ境界制御の単体テストと実装確認。
- 注意点: すべてのBGMにTrailing（末尾無音）があり、これが違和感の原因。ランタイムの `loopEnd` 制御実装が必要。
- 実施内容: 生成SE依存を減らすため、Kenney公式CC0音源の自動同期ツールを追加。
- 変更ファイル: `tools/audio_library/sync.mjs`、`package.json`、`docs/AUDIO_ASSET_LIBRARY.md`、`TODO.md`、`docs/AI_HANDOFF.md`、候補SEとライセンス原文。
- 結果: `npm run sync:audio-library` でKenney RPG Audio / Impact Sounds / Interface Soundsの候補12件を同期。既存の正式SE/BGMは未変更。
- 検証: `npm run typecheck` 成功、`npm test` 65件成功、`npm run build` 成功、`git diff --check` は終了時に実行する。
- 次の実装可能TODO: BGM検査ツールによるループ境界・無音末尾の記録。BGMの正式差し替えは試聴・採用判断後に行う。
- 注意点: BGMは完成楽曲の選定が必要。生成器や再生バックエンドの置換だけでは品質問題を解決しない。

### 2026-07-25 — Codex

- 実施TODO: マルチゲーム構成に合わせた共通ドキュメントの更新。
- 変更ファイル: `docs/PROJECT_CONTEXT.md`、`docs/ARCHITECTURE.md`、`docs/CURRENT_STATUS.md`、`TODO.md`、`docs/AI_HANDOFF.md`。
- 内容: 起動経路、Survivor固有層、共有`core`層、音声責務、現行テスト数を現行構成へ同期。
- 検証: `npm run typecheck` 成功、`npm test` 65件成功、`npm run build` 成功、`git diff --check` 成功。
- 次の実装可能TODO: BGM検査ツールを用いたループ境界・無音末尾の記録。正式OGGは変更しない。
- 注意点: ワークツリーの大規模な未コミット移行変更は保持すること。

### 2026-07-25 — Codex

- 実施内容: `TODO.md`、Codex/Gemini/Cursorの自律実行ルール、および本引き継ぎファイルを整備。
- 変更ファイル: `TODO.md`、`AGENTS.md`、`GEMINI.md`、`.cursor/rules/autonomy.mdc`、`docs/AI_HANDOFF.md`。
- 検証: `npm run typecheck` 成功、`npm test` 65件成功、`npm run build` 成功、`git diff --check` 成功。
- 次の実装可能TODO: マルチゲーム構成に合わせた共通ドキュメントの更新。
- 注意点: ワークツリーには、`src/games/survivor/` と `src/core/` への大規模移行を含む未コミット変更がある。絶対に削除・巻き戻しをしない。
