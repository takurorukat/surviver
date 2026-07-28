# SFX Preview（開発専用ツール）

Production の Settings / GameScene / `dist` には **含まれません**。

効果音の一覧・試聴・候補比較・Review 記録だけを行う独立ツールです。

## 起動方法

リポジトリルートで:

```bash
npm run dev:sfx-preview
```

ブラウザで `http://localhost:5174/` を開きます。

## できること

- SFX Catalog（Review All）の表示
- Runtime 採用済み SFX と候補音源の試聴
- 評価・メモ・採用記録（localStorage）
- Export / Summary

## アセット配置ルール

| 種類 | 場所 | Production `dist` |
|---|---|---|
| Runtime 採用済み SFX / BGM | `public/assets/audio/`（本体） | 含まれる |
| Preview 候補音源 | `tools/sfx_preview/public/assets/audio/candidates/` | **含まれない** |
| 旧バックアップ等 | `tools/audio_archive/` | **含まれない** |

Review の localStorage キーは従来どおり  
`mage-survivor-sfx-catalog-review-v1`  
（Production Save のキーとは別）。

## Production との関係

- `Settings` に SFX Preview ボタンはありません
- `SfxPreviewSystem` / `sfxCatalog` は `tools/sfx_preview/` 配下のみ
- `npm run build`（本番）のバンドル・public コピーに Preview 専用コード／候補音源は入りません

## テスト

```bash
npm run test:sfx-preview
```

## 注意

このツールは開発者向けです。音の好み・最終採用判断は人間が行ってください。
