# TODO

このファイルは、Cursorが人間またはChatGPT／Codexから個別の実装指示を受けていない場合に使用する唯一の実装作業キューです。ChatGPT／Codexは要件整理と実装指示の作成に使い、Google系AI／CLIは実行しません。

## 実行ルール

- Cursorは作業前に `docs/AI_HANDOFF.md` を読み、作業状態が `作業中` の場合は担当者以外が編集しない。
- 上から最初の未完了タスクを **1件だけ** 実施する。
- タスクに書かれていない仕様変更、アセットの正式更新、保存形式変更は行わない。
- 実装後は `npm run typecheck`、`npm test`、`npm run build`、`git diff --check` を実行する。
- 成功した場合のみ、このファイルの該当タスクを `[x]` にする。失敗時はチェックせず、失敗内容を簡潔に報告して終了する。
- 人間の判断待ちと明記された項目は、上の実装可能な未完了タスクがなくなった場合に限り、判断依頼だけを報告して終了する。
- Cursorは作業開始時と終了時に `docs/AI_HANDOFF.md` を更新し、対象TODO、変更内容、検証結果、次の担当への注意点を記録する。

## 実装可能な優先タスク

- [x] `src/games/survivor/` と `src/core/` への移行を統合確認する。旧 `src/` 配下の削除・移動との整合性を型チェック、テスト、ビルドで確認し、移行に起因する失敗だけを最小限修正する。既存の保存キーとゲーム仕様は変えない。2026-07-25に型チェック・65件のテスト・ビルドで確認済み。
- [x] マルチゲーム構成に合わせて `docs/PROJECT_CONTEXT.md`、`docs/ARCHITECTURE.md`、`docs/CURRENT_STATUS.md` を更新する。旧 `src/scenes/` / `src/systems/` の説明を現在の `src/games/survivor/` と `src/core/` の構成へ合わせる。2026-07-25に更新・検証済み。
- [x] CC0の既存音声ライブラリを自動同期する開発ツールとライセンス台帳を導入する。既存の正式音源を上書きせず、Kenney RPG Audio / Impact Sounds / Interface Soundsの試聴候補を同期する。2026-07-25に導入・検証済み。
- [x] BGM検査ツールを用いて title / plains / forest / volcano / ruins の無音末尾とループ境界を記録する。結果をドキュメント化し、各曲の正しい `loopStart` / `loopEnd` を決めるために必要な素材情報を明確にする。正式OGGは変更しない。
- [x] `SoundManager` のBGMフェード、ループ境界、SE同時発音制御を単体テストと実装の両面で確認する。不整合があれば、音源データを変えずに再生制御だけを最小限修正する。2026-07-25に再生制御を修正し、型チェック・70件のテスト・ビルドで確認済み。
- [x] Gold／Shop Runtime Disable: Version 1 向けに Gold 生成・取得・報酬・HUD・演出・Shop／Seal 導線を休止（完全削除しない）。`RUNTIME_ENABLE_GOLD_AND_SHOP = false`。セーブ互換・既存 Shop 強化適用・XP は維持。2026-07-28 実装・検証済み。
- [ ] Final Stage Completion Rules（Version 1 向けクリア条件の最終化）。
- [ ] Earth Dungeon Stage 2 の Burrower を、`docs/EARTH_DUNGEON_DESIGN.md` の確定済み仕様だけに従って実装し、敵選択・出現条件のテストを追加する。
- [ ] Rune Pillar と Ruins 混成Stageを、確定済み設計だけに従って実装し、出現ロジックのテストを追加する。
- [ ] Shop / Seal Skills の公開導線を、既存仕様とUIを変えずに確認し、公開フラグと到達導線のテストを追加する。（Gold／Shop Runtime 再有効化後）
- [ ] Volcano 除外中の `armored` / `charger`: 呼吸スプライト（または walk 有効化）で見た目を完成させ、表示確認後に `pickEnemyKind.ts` の Stage2 / Stage5 重みへ再追加する。
- [ ] Volcano 除外中の `runner` / `shielded`: 敵画像追加・テクスチャ登録・スプライト接続・表示確認後に `pickEnemyKind.ts` の Stage4 / Stage5 重みへ再追加する。

## Later / Polish（Version 1 完了後、または重大な音響不具合時のみ）

Audio Phase（Combat Core: cast / impact / defeat）は **FROZEN**。以下は Version 1 完成まで着手しない。

- [ ] 新規 SFX 候補の追加・Catalog 拡張・Asset Registry / Reuse Matrix の実装反映
- [ ] 他 Event（属性弾・Combined Skill・敵弾・UI・Pickup 分割など）への専用音追加
- [ ] Shared Audio Repository / BGM 再設計
- [ ] Catalog タグ付け・Cross-Event 物理統合

再開条件: Version 1 完成後、または実ゲーム上の重大な音響不具合。

## 人間の判断待ち

- [ ] Ruins Stage 1 の実機プレイ結果を基に、敵数・敵HP・プレイヤーHPの最終バランスを決定する。
- [ ] 推奨Max HP（Stage 1〜5: 4 / 4 / 5 / 5 / 6）をレベルアップ候補やUIへ反映するゲーム仕様を決定する。
- [ ] BGMを生成し直すか、ライセンス記録済みの外部素材へ置き換えるかを決定する。音源の正式更新は試聴・承認後だけ行う。
- [ ] Castle / Abyss のゲーム仕様、敵、報酬、解放条件を決定する。
- [ ] 次作のクリッカーで共有化が実証された範囲だけを `src/core/` へ抽出する。
