# Starter Architecture（複数ゲーム共通化の方針）

Survivor を起点に、次作のクリッカーなどへ流用できるスターター構成を目指す。
**2本目で実際に重複したものだけを共通化する**（先回りの大規模抽象化はしない）。

## 1. 今後共通化する範囲

| 領域 | 置き場所（目安） | 内容 |
|------|------------------|------|
| 保存 | `src/core/storage/` | バージョン付き localStorage、キー命名 |
| 進行 | `src/core/progression/` | オフライン経過・収益など純粋計算 |
| 音声 | `src/core/audio/` または `tools/` | 開発時生成・ランタイム再生の分離 |
| UI 共通 | `src/core/ui/` | ボタン、モーダル、数値表示（将来） |
| 入力 | `src/core/input/` | キーボード/ポインタ抽象（将来） |
| デバッグ | `src/core/debug/` | DEV フラグ、進行ショートカット（将来） |
| ビルド/テスト | ルート | Vite、Vitest、TypeScript |

現時点で実装済み:

- `src/core/storage/versionedStorage.ts`
- `src/core/progression/offlineProgress.ts`

## 2. Survivor 専用として残す範囲

- 敵・Wave・戦闘・弾・当たり判定
- レベルアップ 3 択・ショップ・実績・エリア解放
- `UnlockSaveSystem` と既存 localStorage キー（例: `survivor-stage-unlocks`）
- `GameScene` / `TitleScene` / `GameAudioSystem` のゲームループ
- 難易度・ステージ構成・Earth Dungeon 等のコンテンツ

これらは **次作に持ち込まない**。必要なら設計を参考にするだけ。

## 3. クリッカーで新規に作る範囲

| 領域 | 説明 |
|------|------|
| economy | 通貨、生産量、コスト曲線 |
| upgrades | 永続・一時アップグレード、解錠 |
| automation | 自動クリック、オフライン蓄積 |
| prestige | 転生、倍率、メタ進行 |
| clicker UI | メイン画面、タブ、大数表示 |

Survivor の `src/systems/` や `GameScene` を流用せず、新シーンとして組み立てる。

## 4. 次作を始める際の推奨構成

```
project/
  src/
    core/           # ゲーム非依存（storage, progression, …）
    games/
      survivor/     # 既存 Survivor（段階的に移す場合）
      clicker/      # 新クリッカー
    main.ts         # エントリ or ルーティング
  docs/
    STARTER_ARCHITECTURE.md
  tools/            # 音声生成など開発専用
```

現リポジトリはまだ `src/games/` 分割前。**新規 core のみ追加**し、Survivor は従来パスを維持する。

## 5. 共通化の進め方

1. **1本目（Survivor）**: 動くゲームを優先。共通化は `core/` に小さく足すだけ。
2. **2本目（クリッカー）**: 保存・オフライン・UI で同じニーズが出たら `core/` へ抽出。
3. **置換は後から**: Survivor の `UnlockSaveSystem` をいきなり `versionedStorage` に差し替えない（セーブ互換リスク）。
4. **キーは namespace 分離**: `createStorageKey('mage-clicker', 'save')` のようにゲームごとに衝突回避。

## 使用例（新ゲーム側）

```typescript
import { createStorageKey, createVersionedStorage } from './core/storage/versionedStorage'
import {
  calculateOfflineElapsedMs,
  calculateOfflineGain,
} from './core/progression/offlineProgress'

type ClickerSave = { coins: number; lastSavedAtMs: number }

const saveStorage = createVersionedStorage<ClickerSave>({
  key: createStorageKey('mage-clicker', 'save'),
  version: 1,
  createDefault: () => ({ coins: 0, lastSavedAtMs: Date.now() }),
  validate: (v): v is ClickerSave =>
    typeof v === 'object' && v !== null &&
    typeof (v as ClickerSave).coins === 'number' &&
    typeof (v as ClickerSave).lastSavedAtMs === 'number',
})

const loaded = saveStorage.load()
const data = loaded.data

const elapsed = calculateOfflineElapsedMs(data.lastSavedAtMs, Date.now(), 8 * 60 * 60 * 1000)
const offlineCoins = calculateOfflineGain(5, elapsed) // 5 coins/sec
```

Survivor 既存キー・移行ロジックはこの例では触らない。
