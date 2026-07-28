# Combat Core Runtime Adoption

Combat Core（`skill.power.cast` / `skill.power.impact` / `enemy.defeat`）の
**Review Adopt** 結果を Runtime へ反映する手順です。

重要:

- Catalog の Adopt は localStorage のレビュー記録だけです。ゲーム音は変わりません。
- ブラウザ UI からソースファイルを自動上書きしません。
- ユーザーが Export した JSON を、明示的な Cursor 作業で反映します。

## 1. Catalog で Adopt する

1. Settings → SFX Preview → Review All を開く
2. Category: `combat-core` または先頭の 3 Entry を確認
3. 各 Entry で Runtime / Candidate を試聴し、Adopt を選ぶ
4. Reload 後も Adopt が残ることを確認
5. **Export Adoption JSON** を押して JSON を保存

## 2. Export JSON の形

```json
{
  "version": 1,
  "exportedAt": "2026-07-27T00:00:00.000Z",
  "purpose": "sfx-catalog-adoption-for-runtime-apply",
  "note": "Review Adopt only. Does not modify Runtime files. Hand to Cursor with docs/audio/combat-core-runtime-adoption.md.",
  "catalogEntryCount": 11,
  "decidedEntryCount": 3,
  "entries": {
    "skill.power.cast": {
      "eventId": "skill.power.cast",
      "runtimeKey": "sfx-player-fire-power",
      "runtimePath": "assets/audio/player_fire_power.ogg",
      "adoptedVariantId": "skill.power.cast-cand-b",
      "variantLabel": "Candidate B",
      "sourcePath": "assets/audio/candidates/player_fire_power_b.ogg",
      "checksumSha256": null,
      "recommendationRank": 2
    },
    "skill.power.impact": {
      "eventId": "skill.power.impact",
      "runtimeKey": "sfx-player-hit-power",
      "runtimePath": "assets/audio/player_hit_power.ogg",
      "adoptedVariantId": "skill.power.impact-cand-a",
      "variantLabel": "Candidate A",
      "sourcePath": "assets/audio/candidates/player_hit_power_a.ogg",
      "checksumSha256": null,
      "recommendationRank": 1
    },
    "enemy.defeat": {
      "eventId": "enemy.defeat",
      "runtimeKey": "sfx-enemy-defeat",
      "runtimePath": "assets/audio/library/kenney/enemy_defeat_candidate.ogg",
      "adoptedVariantId": "enemy.defeat-rev",
      "variantLabel": "Revision",
      "sourcePath": "assets/audio/enemy_defeat.ogg",
      "checksumSha256": null,
      "recommendationRank": 1
    }
  }
}
```

## 3. Cursor への反映依頼（作業単位）

次を Cursor に渡す:

1. この文書
2. Export した JSON
3. 「Combat Core の Adopt を Runtime へ反映。他 Event は触らない」

Cursor が行うこと（1 Entry ずつ）:

1. `sourcePath`（`public/` 配下）を確認
2. `runtimePath` へコピー（必要なら事前に diff で現状を記録）
3. `audio.ts` のパス定数が既に正しいか確認（キー名は変えない）
4. `assetManifest.ts` が同じパスを参照しているか確認
5. `npm run typecheck` / `npm run build`
6. ゲームで cast / impact / defeat を耳で確認

## 4. やってはいけないこと

- Recommended を勝手に正式採用しない
- Catalog / Event Map 以外の SFX を同時に書き換えない
- SoundManager を変更しない
- git stash / restore / reset で他の未コミット変更を消さない
