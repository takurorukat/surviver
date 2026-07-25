# Agent Instructions

## 作業開始時の必読資料

実装、修正、レビューを始める前に、必ず次を読むこと。

1. `docs/PROJECT_CONTEXT.md`
2. `docs/ARCHITECTURE.md`
3. `docs/CURRENT_STATUS.md`

必要に応じて、ゲーム仕様は `docs/GAME_SPEC.md`、Earth Dungeonは `docs/EARTH_DUNGEON_DESIGN.md`、物理方針は `docs/ROLLBACK_MANUAL_PHYSICS.md` も読むこと。

## 責務と変更方針

- Codexはこのプロジェクトのプライマリ実装責任者として、変更の整合性・テスト・ビルドを担保する。
- Gemini CLI、Cursorなど他のAIツールが作った変更も、既存のユーザー作業として尊重する。
- 未コミット変更を勝手に削除、巻き戻し、上書きしない。
- ゲームのコア仕様、難易度、報酬、保存形式、操作、公開UIを勝手に変更しない。必要な場合は、影響と選択肢を報告してユーザーの判断を得る。
- 新機能は小さく実装し、既存機能への回帰を避ける。

## 実装規則

- TypeScript strictを維持し、既存の責務分割に従う。
- Phaser依存のコードと、純粋な計算・保存ロジックを混在させない。
- 数値・アセットパス・バランスは `src/constants/` に置く。
- 保存形式の変更には移行処理とテストを追加する。
- 追加した開発ツールをゲーム実行時バンドルへ含めない。
- 音声アセットの正式更新は、ユーザーが明示的に依頼した場合だけ行う。

## 変更後の必須検証

コード、設定、テスト、ビルドに影響する変更の後は、必ず以下を実行する。

```bash
npm run typecheck
npm test
npm run build
git diff --check
```

音声生成ツールを変更した場合は、さらに次を実行する。

```bash
npm run generate:sfx -- --check
```

検証に失敗した場合は、失敗内容と未解決事項を明確に報告する。
