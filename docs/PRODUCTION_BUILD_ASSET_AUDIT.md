# Production Build Asset Audit

## Summary

- Audit date: 2026-07-29
- Public size: before 2.93MB (87 files) → after 2.78MB (80 files)
- Dist size: before 4.63MB (91 files) → after 4.47MB (84 files)
- Runtime assets: manifest 画像・音声パスはすべて public に実在。BGM／SE／スキルアイコン／ROSSO ロゴは dist に存在
- Unused confirmed: 未採用 Kenney 3 音源、旧 player_walk_* 3 枚、未使用 `vite.svg`
- Dev-only exposed: 上記が Vite `public/` コピー経由で dist に混入していた（修正済み）
- Fixes applied: Production 外へ移動＋`tools/audio_library/sync.mjs` の同期先分離＋回帰テスト
- Remaining unknowns: なし（`SurvivorAutoplayBridge` は Production bundle に残るが `import.meta.env.DEV` かつ `?e2e=1` でのみ有効。Preview UI／Tone.js／tools パスは dist に無し）

## Findings

| File／Category | Evidence | Action |
|---|---|---|
| `physical_fire_candidate.ogg` / `physical_hit_candidate.ogg` / `blocked_candidate.ogg` | audio 定数・manifest 未参照。sync 専用の未採用候補 | MOVE → `tools/audio_library/candidates/` |
| `player_walk_prev.png` / `prev2` / `legacy` | constants／manifest／src パス未参照。現行は `player_walk.png` | MOVE → `assets-source/sprites/unused/` |
| `public/vite.svg` | index.html／コード未参照の Vite 初期ファイル | MOVE → `assets-source/misc/vite.svg` |
| Kenney `*_candidate.ogg`（採用済み） | `audio.ts` / manifest が Runtime 参照（名前に candidate が残るだけ） | KEEP |
| `public/assets/audio/licenses/*` | 配布用 CC0 ライセンス文書 | KEEP（LICENSE_REQUIRED） |
| `tools/` / `tmp/` / `test-results/` / `assets-source/` | dist パスに無し。src から tools import 無し | KEEP（非 public） |
| SFX Preview / Tone.js | dist JS に `SfxPreview` / `Tone.js` 無し。`dev:sfx-preview` は別 Vite config | KEEP（変更なし） |
| source map | build 出力に `.map` 無し | KEEP |
| Autoplay bridge 文字列 | GameScene chunk に `autoplay` あり。DEV+`e2e=1` ゲート。到達不能な Preview UI ではない | KEEP（アーキ変更なし） |

## Metrics

| Metric | Before | After | Difference |
|---|---:|---:|---:|
| public files | 87 | 80 | -7 |
| public size | 2.93MB | 2.78MB | -0.15MB |
| dist files | 91 | 84 | -7 |
| dist size | 4.63MB | 4.47MB | -0.16MB |
| sourcemaps | 0 | 0 | 0 |
| JS bundles | ~1.69MB | ~1.69MB | 0 |

## Verification

- `npm run typecheck` / `npm test` / `npm run build` / `git diff --check` 成功
- dist に Runtime 必須画像・音声・スキル SVG・ROSSO ロゴあり
- dist に Preview UI / test-results / tmp / assets-source / tools / `.bak` / 未採用 3 音源 / 旧 walk 画像 / vite.svg なし
- `productionAssetAudit.test.ts` で未採用候補の manifest／定数混入を防止

## Notes

- Vite は `public/` を無条件コピーする。未使用ファイルは public 外へ出すのが最小の除外手段（plugin 追加なし）。
- 構造監査で「変更不要」とされた Runtime アーキ／フォルダ再編は今回も触っていない。
