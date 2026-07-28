# Combat Core External Candidates

Manifest（`docs/audio/sfx-external-import.json`）の Combat Core 3 Entry 外部候補を
Catalog 定数へ反映する手順。

## 再生成

```bash
node tools/sfx_catalog/generate_combat_core_external_candidates.mjs
```

出力:

- `src/games/survivor/constants/combatCoreExternalCandidates.ts`

`sfxCatalog.ts` は生成結果を import して Combat Core Entry の variants / recommendations に連結する。

## 注意

- Runtime では Manifest JSON を fetch しない
- Runtime 音源・`audio.ts`・`sfxEvents.ts` は変更しない
- Adopt の初期値は付けない（人間試聴後）
- Git 追跡は `.gitignore` で
  `skill-power-cast` / `skill-power-impact` / `enemy-defeat` のみ例外化
