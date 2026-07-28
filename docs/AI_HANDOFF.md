# AI Handoff

ChatGPT／Codexが整理した実装指示を、開発主担当のCursorへ引き継ぐための共有記録です。会話ログの貼り付けや既存情報の全文再掲は不要です。

## AI開発体制

- ChatGPT／Codex: 要件整理、仕様設計、タスク分解、実装指示の作成、レビュー方針の策定を担当する。
- Cursor: コードの実装、修正、テスト、ビルド、リファクタリング、作業記録の更新を担当する。
- Google系AI／CLI: コード変更には関与せず、必要時のみ外部確認、別案、事実確認を行う。提案は採用前にChatGPT／CodexまたはCursorが確認する。
- 同じ調査・設計を複数AIで重複させず、原則として1回の実装につき未完了タスクを1件だけ扱う。

## 利用方法

- ChatGPT／Codexは、対象タスク、要件、対象範囲、受け入れ条件、検証方法を簡潔な実装指示としてCursorへ渡す。
- Cursorは`TODO.md`と本ファイルを読み、指定されたタスクだけを実装する。
- 同じ作業ツリーを複数のAIが同時に編集しない。`作業状態` が`作業中`の場合、担当Cursor以外は編集しない。
- Cursorは作業開始時に担当、対象TODO、開始日時を更新し、終了時に変更内容と検証結果を記録して、成功・失敗を問わず`待機中`へ戻す。
- 既存の未コミット変更の所有者を推測しない。削除・巻き戻し・上書きはしない。
- 不要な再調査、全文の再説明、過剰なコメントや報告を避ける。

## 現在の状態

- 作業状態: 待機中
- 担当AI: —
- 対象TODO: —
- 開始日時: —

## 直近の作業記録

### 2026-07-28 — Cursor

- 実施内容: Credits はみ出し修正。UI本文を作者／配布元／ライセンスの短文に整理（URL・パック名等はライセンス文書へ）。パネル高さの画面内クランプ、行間縮小、ロゴ幅180、収まらない場合のみ本文スクロール。Back固定。
- 変更ファイル: ui.ts / assets.ts / SettingsMenuSystem.ts / creditsAttribution.test.ts / endingBgmCredits.test.ts / unifiedSkillIcons.test.ts / opengameart-cc0-loop-pack.txt / credits-display.spec.ts / docs
- 検証: typecheck OK、tests 250 OK、build OK、git diff --check OK。Playwright で Credits 表示確認（tmp/credits-screenshots/*.png）。
- 未解決: なし（小画面でも短縮本文がスクロールなしで収まっている）
- 次の開発タスク: Full Game Verification / Area Clear Result UI（未着手）

### 2026-07-28 — Cursor

- 実施内容: Windy Plains Stage 3 ボス（`windHiveBoss`）強化。HP 25→75（×3）、表示 scale 1.5→2.25（×1.5）、2秒ごとに Hero 向け風の玉1発（標準敵弾速度／ダメージ、ホーミングなし）。蜂召喚・クリア条件・他ボスは未変更。
- 変更ファイル: enemies.ts / EnemyBullet.ts / EnemyAttackSystem.ts / windHiveBossLogic.ts / windHiveBoss.test.ts / spawnEnemyCommon.ts / spawnFactories.ts / GameScene.ts / TODO.md / docs/AI_HANDOFF.md
- 検証: typecheck OK、tests 247 OK、build OK、git diff --check OK。ブラウザ実機は未実施（手順は完了報告に記載）。
- 未解決: ブラウザでの見た目・発射タイミングの人間確認
- 次の開発タスク: Full Game Verification（未着手）

### 2026-07-28 — Cursor

- 実施内容: 基本スキルのプレイヤー向け表示名を効果名へ整理（Move Speed / Pickup Range / Attack Speed / Attack Range 等）。Level Up に属性タグ（Move=WIND・Pickup=WATER・XP=FIRE、根拠は SKILL_CATALOG）。Power／Attack Speed／Attack Range は属性未定義のためタグなし。内部ID・性能未変更。
- 変更ファイル: progression.ts / skillIcons.ts / ui.ts / LevelUpChoicePool / LevelUpChoiceSystem / HudSystem / SealSkillSystem / skillDisplayNames.test.ts / docs
- 検証: typecheck OK、tests 239 OK、build OK、git diff --check OK
- 未解決: HUD 長ラベルの実機読みやすさは人間確認
- 次の開発タスク: Full Game Verification（未着手）

### 2026-07-28 — Cursor

- 実施内容: Wind / Fire スキルアイコン色を直感的な属性色へ変更（Wind `#22C55E`、Fire `#EF4444`）。SSoT は `CORE_SKILL_ICONS` のみ。SVG・他スキル色・性能は未変更。
- 変更ファイル: skillIcons.ts / skillIcons.test.ts / docs
- 検証: typecheck OK、tests 234 OK、build OK、git diff --check OK。HUD/Level Up は SkillIcon→SSoT 参照。
- 未解決: 実ブラウザでの色味確認は人間向け
- 次の開発タスク: Area Clear Result UI または Production Build Asset Audit（未着手）

## 直近の作業記録

### 2026-07-28 — Cursor

- 実施内容: Wind / Fire スキルアイコン色を直感的な属性色へ変更（Wind `#22C55E`、Fire `#EF4444`）。SSoT は `CORE_SKILL_ICONS` のみ。SVG・他スキル色・性能は未変更。
- 変更ファイル: skillIcons.ts / skillIcons.test.ts / docs
- 検証: typecheck OK、tests 234 OK、build OK、git diff --check OK。HUD/Level Up は SkillIcon→SSoT 参照。
- 未解決: 実ブラウザでの色味確認は人間向け
- 次の開発タスク: Area Clear Result UI または Production Build Asset Audit（未着手）

### 2026-07-28 — Cursor

- 実施内容: 複合スキル取得バナーの「OBTAINED」→「GET!」。プレイヤー向け表示名「Orbiting Orb」→「Orbit」（内部ID・Save・性能は未変更）。HUD短縮ラベルは ORB→ORBIT。
- 変更ファイル: ui.ts / progression.ts / HudSystem / bannerコメント / orbitingOrb.test / compoundSkillWording.test / docs
- 検証: typecheck OK、tests 234 OK、build OK、git diff --check OK
- 未解決: 実機でのバナー見た目バランスは人間確認
- 次の開発タスク: Area Clear Result UI または Production Build Asset Audit（未着手）

### 2026-07-28 — Cursor

- 実施内容: SFX Preview を Production から完全分離。
- 変更ファイル: SettingsMenuSystem / ui.ts / package.json / .gitignore / tools/sfx_preview/** / tools/audio_archive/** / public audio 候補・未使用の移動 / settingsNoSfxPreview.test.ts / docs
- 検証: typecheck OK、tests 232 OK、test:sfx-preview 6 OK、build OK、dist に Preview 文字列・candidates・softsynth なし。dist 42.26MB→4.62MB。Preview ツール HTTP 200（index / runtime / candidates）
- 未解決: ブラウザでの聴感・SFX トグルは元々 Settings に無し（BGM/Credits/Back のみ）
- 次の開発タスク: Production Build Asset Audit（未着手）

### 2026-07-28 — Cursor

- 実施内容: Credits に「created by」＋ ROSSO ARGINE ロゴ画像を表示。旧「Created by TMFactory」文言を削除。アセットは添付 PNG（`public/assets/images/credits_rosso_argine.png`）を preload。
- 変更ファイル: assets.ts / ui.ts / assetManifest / SettingsMenuSystem / creditsRossoArgine.test.ts / 関連 Credits テスト
- 検証: typecheck OK、関連テスト OK、build OK、dist にロゴあり
- 未解決: ブラウザでの見た目確認は未実施（Settings → Credits）
- 次の開発タスク: （完了・コミット済み）

### 2026-07-28 — Cursor

- 実施内容: Skill Unlock 表示同期修正。根本原因は HUD が Pierce/Blast/Orb/Ricochet を「今ラン Lv>0」で鍵表示していたこと。`isSkillUnlocked`（`unlockedAchievementIds` + ALL_ACHIEVEMENTS）を SSoT に統一。スキルツリー／ステータス行／Achievements パネルの鍵を解放済みで非表示。合成解放直後に `refreshUnlockStatus`。条件・Save・ID 未変更。
- 変更ファイル: AchievementSystem / HudSystem / AchievementsPanelSystem / GameScene / skillUnlockDisplay.test.ts / docs
- 検証: typecheck OK、tests 233 OK、build OK、git diff --check OK
- 未解決: ブラウザ実機確認は未実施
- 次の開発タスク: Area Clear Result UI または Unused Achievement Cleanup（未着手）

### 2026-07-28 — Codex

- 実施内容: Wind / Water / Fire / Earth / Speed / Power / Range の7アイコンを、Game-icons.net の同一作者 Lorc（CC BY 3.0）へ統一。原本SVGを `assets-source/icons/skills/unified/`、64×64のRuntime SVGを `public/assets/icons/skills/unified/` に保存し、`skillIcons.ts` をSSoTとしてManifest・HUD・Level Up・Achievements/複合表示へ反映した。Creditsと詳細ライセンス記録も追加。
- 表示範囲: Power（内部ID `damage`）/ Speed（`fireRate`）/ Range は既存HUD・Level Upへ反映。4属性は現在、独立した取得枠を持たないためSSoTとpreloadへの登録までとし、ゲーム仕様や表示枠は追加していない。既存固有スキルアイコンは変更なし。
- 検証: typecheck OK、tests 223 OK、build OK、git diff --check OK。実ブラウザでHUD・Level Up・Credits、7 SVGのHTTP 200とconsole errorなしを確認。16/24/32/48px比較画像はgitignoredの `test-results/icon-review/` に保存。
- 未解決: 24px以下の最終的な判別性は人間による確認が必要。旧文字glyphは画像ロード失敗時の互換fallbackとして保持。
- 次の開発タスク: **Full Game Verification**（本タスクでは未着手）。

### 2026-07-28 — Cursor

- 実施内容: Run Result Data Foundation。エリア通算 elapsed / run kills / clear|defeat 確定 / bossDefeated(finalBossConfig) / Stage間維持。メモリ上 `RunResultStore` が SSoT。Save・Best Time・Result UI・Achievements・Audio・Ending 未変更。並行のアイコン未コミット差分は保護・コミット対象外。
- 変更ファイル: `types/RunResult.ts` / `RunResultStore.ts` / GameScene・TitleScene・StageClearFlow・StageResult・撃破3箇所 / `runResultData.test.ts` / docs
- 検証: typecheck OK、tests 223 OK、build OK、git diff --check OK
- 未解決: ブラウザ実プレイ未確認（手動手順を報告）
- 次の開発タスク: Area Clear Result UI（未着手）

### 2026-07-28 — Cursor

- 実施内容: Ending BGM（Victory=Plains 0.11 / Final Ascent=Ruins 0.09、fade 400/600ms）＋ Music Credits を obscure music (Gichco) CC0 へ修正。出所不明の `area_clear_bgm.ogg` を Runtime／manifest／ファイルから削除（短い Area Clear SFX は維持）。`stopSharedBgm({ fadeMs })` の最小拡張のみ。新音源なし。
- 変更ファイル: EndingScene / GameAudioSystem / SoundManager / ending・audio・ui・assetManifest / endingBgmCredits.test.ts / area_clear_bgm.ogg 削除 / AUDIO_ASSET_LIBRARY・GAME_SPEC
- 検証: typecheck OK、tests 203 OK、build OK、git diff --check OK、dist に plains/ruins あり・area_clear_bgm なし・area_clear.ogg あり
- 未解決: ブラウザでの聴感・Network は未自動確認（VIEW ENDING 手動手順を報告）。tools/sfx_designer の文字列言及は残置
- 次の開発タスク: Full Game Verification または Run Result Data（未着手）

### 2026-07-28 — Cursor

- 実施内容: Orbiting Orb 角速度を全レベルで2倍。Earth Stage4 `earthMagmaRock` の表示を判定scale(1.5)の1.5倍＝2.25へ（当たり判定は1.5のまま）。未コミットだった Stage4 マグマ岩実装も同梱。Stage3 Final Wave は先行コミット `fef60b2`。
- 変更ファイル: combat.ts / orbitingOrb.test.ts / enemies.ts（DISPLAY_SCALE）/ magma rock 実装一式 / sprite / tests / docs
- 検証: typecheck OK、tests 194+ OK、build OK
- 未解決: ブラウザ実プレイ未確認
- 次の開発タスク: Run Result Data または Area Clear Result UI（未着手）

## 直近の作業記録

### 2026-07-28 — Cursor

- 実施内容: Earth Dungeon Stage3 ファイナルウェーブ終了修正。原因は pack size=1＋1.4倍＋FINAL WAVE 1.6秒刻みで `areAllSpawnsFinished` が残り時間内に成立しないこと。前回修正はクローズ後にリトライも拒否してパックを捨てていた。通常バーストを15秒まで、FINAL WAVE は間隔0で有限予約、クローズ後はリトライのみ許可。敵ステ／他エリア／Stage4・5未変更。
- 変更ファイル: `difficulty.ts`（Stage3のみ）/ `WaveSystem.ts` / `earthDungeonStage3WavePolicy.ts` / `ruinsStage3FinalWave.test.ts` / docs
- 検証: typecheck OK（作業ツリー全体）、tests 193 OK、build OK
- 未解決: ブラウザ実プレイ未確認（手動手順を報告）
- 次の開発タスク: Earth Dungeon Stage 4 Enemy または Run Result Data（未着手）

## 直近の作業記録

### 2026-07-28 — Cursor

- 実施内容: Four-Area Ending Sequence。Victory → Final Ascent → Title。`isFourAreaCompletion` / `endingSeen` / `EndingScene` / Area Clear Continue 後に遷移 / タイトル左下 VIEW ENDING。画像は加工なし配置。Audio・Boss・Gold／Shop・Result Data 未変更。
- 変更ファイル: ending 定数・画像2枚 / EndingScene / fourAreaCompletion / endingSequence / UnlockSaveSystem(endingSeen v8) / StageClearFlow / StageResult / TitleScene / bootstrap / assetManifest / tests / docs
- 検証: typecheck OK、tests 184 OK、build OK、git diff --check OK
- 未解決: ブラウザでの4エリア実クリア導線は未確認（手動手順を報告）。マグマ岩など前回の未コミット差分は保護・別扱い。
- 次の開発タスク: Area Clear Result UI または Full Game Verification（未着手）

## 直近の作業記録

### 2026-07-28 — Cursor

- 実施内容: Four Area Final Boss 最終確認。採用済み runtime 画像は HTTP 200。未参照の旧案 `enemy_earth_golem_boss.png` / `_clean.png` を削除（clean は dungeon boss と同一SHA、どちらも code/manifest 未参照・未コミット）。ブラウザでの4ボス実プレイ確認は Autoplay が Stage ジャンプ非対応のため未実施。他の未コミット差分（Stage3 final wave / ボス拡大）は保護・未コミット。
- 変更ファイル: 未追跡 PNG 2件削除のみ（git に載っていたものはなし）
- 検証: typecheck / finalBoss 関連テスト / build
- 次の開発タスク: **Run Result Data**（未着手）

### 2026-07-28 — Cursor

- 実施内容: Earth Dungeon Stage3 のファイナルウェーブ後スポーン停止。通常バーストを経過15秒まで、残り10秒で FINAL WAVE、以降は新規スポーン／リトライ禁止。
- 変更ファイル: `difficulty.ts` / `WaveSystem.ts` / `ruinsStage3FinalWave.test.ts` / docs
- 検証: typecheck・関連テスト
- 次の開発タスク: Run Result Data（未着手）

### 2026-07-28 — Cursor

- 実施内容: Earth Dungeon Stage5 ボス表示・当たり判定スケールを 2 → 5（旧サイズの 2.5 倍）に変更。
- 変更ファイル: `constants/enemies.ts`（`ENEMY_EARTH_DUNGEON_BOSS_SIZE_SCALE`）
- 検証: typecheck OK、earthDungeonBoss テスト OK
- 次の開発タスク: Run Result Data（未着手）

### 2026-07-28 — Cursor

- 実施内容: Version 1 の4エリア最終ボスを統合。`finalBossConfig` SSoT（finalStage / bossId / defeat-boss）。Forest gravestone・Volcano chaosElemental に `isBoss` 付与。最終ステージはタイマー0ではクリアせずボス撃破必須。Wind／Earth は既存実装を維持しつつ出現判定を SSoT 経由に統一。プレイヤー基準スポーン。Audio／Gold／Shop／Result／Ending 未変更。
- 変更ファイル: `finalBossConfig.ts` / `stageClearRules.ts` / `spawnEnemyCommon.ts` / `updateSpecialEnemySpawns.ts` / `EnemySummonSystem.ts` / tests / docs / TODO
- 検証: typecheck OK、tests 153 OK、build OK、git diff --check OK
- 次の開発タスク: **Run Result Data**（未着手）

### 2026-07-28 — Cursor

- 実施内容: Earth Dungeon Stage 5 に最終ボス `earthDungeonBoss` を追加。HP100・速度=スライム×0.5・XP×20・呼吸スプライト。1秒ごとに Earth 通常敵（slime/rock/skeleton）を召喚（上限8・召喚敵XP0）。5秒ごとに既存小石弾を5連射（200ms間隔・発射時照準）。クリア条件はボス撃破のみ（`defeat-boss`）。Audio／Gold／Shop／Result／Ending／他エリアボスは未変更。
- 変更ファイル: `enemies.ts` / `difficulty.ts` / `assetManifest.ts` / `enemySprites` / `spawnFactories` / `spawnEnemyCommon` / `pickEnemyKind` / `EnemySummonSystem` / `EnemyAttackSystem` / `updateSpecialEnemySpawns` / `GameScene` / `stageClearRules` / `earthDungeonBoss*.ts` / `enemy_earth_dungeon_boss.png` / docs
- 検証: typecheck OK、tests 143 OK、build OK、git diff --check OK
- 次の開発タスク: **Run Result Data**（未着手）

### 2026-07-28 — Cursor

- 実施内容: Wind Plains Stage 3 に召喚ボス `windHiveBoss` を追加。HP25・速度=スライム×0.5・XP×10・呼吸スプライト。4秒ごとに蜂1体（上限5・召喚蜂XP0）。クリア条件はボス撃破のみ（`defeat-boss`）。他エリア・Audio・Gold／Shop 未変更。
- 変更ファイル: `enemies.ts` / `difficulty.ts` / `assetManifest.ts` / `enemySprites` / `spawnFactories` / `spawnEnemyCommon` / `EnemySummonSystem` / `updateSpecialEnemySpawns` / `stageClearRules` / `StageClearFlowSystem` / `PlayerBulletCombatSystem` / `GameScene` / `windHiveBoss*.ts` / sprite PNG / docs
- 検証: typecheck OK、tests 128 OK、build OK（dist に sprite あり）
- 次の開発タスク: **Run Result Data**（未着手）

### 2026-07-28 — Cursor

- 実施内容: Gold／Shop Runtime Disable。`RUNTIME_ENABLE_GOLD_AND_SHOP = false` を追加し、Gold 生成・取得・クリア報酬・HUD・+GOLD 演出・Shop／Seal 導線を Runtime から休止。全スキル上限時は報酬なしで自動レベルアップ（空 UI／無限待ち防止）。セーブの gold／shopUpgrades 読み取りと既存強化適用は維持。Coin.ts／XP は未変更。Audio／SFX Catalog／ステージ／クリア条件は未変更。
- 変更ファイル: `constants/ui.ts`、`GameScene.ts`、`StageClearFlowSystem.ts`、`TopBarSystem.ts`、`TitleScene.ts`、`ShopSystem.ts`、`SealSkillSystem.ts`、`LevelUpChoiceSystem.ts`、`goldShopRuntime.test.ts`、`docs/AI_HANDOFF.md`、`TODO.md`
- 検証: typecheck OK、関連25／全120テスト OK、build OK、git diff --check OK。ブラウザ実耳確認は手動。
- 次の開発タスク: **Final Stage Completion Rules**（未着手）。

### 2026-07-28 — Cursor

- 実施内容: Audio Phase Final Verification and Freeze。Combat Core 3音の Adopt↔Runtime SHA-256 一致再確認。発火経路（cast=didFire+powerOrb、impact=powerOrb命中のみ、defeat=弾/Blast/Orb+60ms gate）をコード確認。typecheck / 音響テスト27 / 全テスト117 / build 成功。dist に3 Runtime 音源あり。コード・Runtime ファイルは未変更。Audio Phase: **FROZEN**。
- 採用: cast=`skill.power.cast-external-03`→`player_fire_power.ogg` / impact=`skill.power.impact-external-01`→`player_hit_power.ogg` / defeat=`enemy.defeat-external-02`→`library/kenney/enemy_defeat_candidate.ogg`
- 変更ファイル: `docs/AI_HANDOFF.md`、`TODO.md`（Later/Polish 追記のみ）
- 検証: SHA ALL_OK、typecheck OK、tests 117 OK、build OK、dist assets OK。実耳確認は手動手順（ハードリロード後 Plains）。
- Deferred: 新規候補・Catalog拡張・Registry・他Event音・Shared Audio・BGM再設計は Version 1 まで凍結。
- 次の開発タスク: **Gold／Shop Runtime Disable**（完全削除ではなく Version 1 ループから休止）。実装は未着手。

### 2026-07-28 — Codex

- 実施内容: Audio Asset Registry / Cross-Event Reuse監査。Catalog 36 Entry・212 Variant、候補187ファイル、Runtime Variant 24パスを照合し、候補＋Runtimeの物理ファイル219件をSHA単位の216 Assetへ整理。音源・Catalog・Runtime・ゲームコードは未変更。
- 成果物: `docs/audio/sfx-asset-registry.json`（Assetメタデータ・暫定音響タグ・用途適合性）、`sfx-reuse-matrix.json`（24 Event Archetypeの候補・充足判定）、`sfx-source-packs.json`（12 Pack/Repository provenance group）。
- 重複: 完全重複3組・余剰コピー3件。すべて採用済みRuntimeと元External候補の一致（Power Cast external-03、Power Impact external-01、Enemy Defeat external-02）。削除・移動・統合は未実施。低信頼のNear Duplicate候補23組は同一パック・同系列・近い durationによる試聴対象。
- 既存Assetで候補化可能: `player.projectile.cast/impact`、`enemy.projectile.launch/impact/defeat/damage`、`skill.blast/pierce/ricochet/orbit/unlock`、`pickup.gold/heal`、`summon`、`shield.block`、`boss.attack/defeat`、`ui.confirm`。
- 不足: `pickup.xp`（7、最低8）、`ui.cancel`（5、最低6）、`ui.denied`（2、最低6）、`countdown`（0）、`stage.start`（0）、`stage.clear`（2、最低4）。追加取得を推奨するのはこの6 Archetypeだけ。
- 人間試聴: texture / tone / repetitionFatigue / voiceCharacter、および23 Near Duplicate組は自動解析・既存メタデータによる暫定値。全Assetの`reviewRequired`に明記。特にCreature系、0 dBFS超のデコードピーク、UI/魔法の意味競合を確認する。
- 次工程: まず既存Assetを別EventのCatalog候補として「同じパス参照」で登録する。物理ファイルはコピーしない。不足6 Archetypeの外部取得は、その再利用登録と人間試聴後に限定して行う。
- 検証: 3 JSON parse、assetId一意、SHA/localPath、Candidate/Entry参照、Reuse Matrix/Source Pack参照、score範囲、Event名統一、保護対象ファイルの作業前後SHA、`git diff --check`を確認。

## 直近の作業記録

### 2026-07-28 — Cursor

- 実施内容: `sfx-catalog-review-adoptions.json`（exportedAt 2026-07-28）の Adopt 3件を Runtime へ反映。cast=external-03、impact=external-01、defeat=external-02。SHA-256 一致確認。`audio.ts` パス変更なし。
- 変更ファイル: `public/assets/audio/player_fire_power.ogg`、`public/assets/audio/player_hit_power.ogg`、`public/assets/audio/library/kenney/enemy_defeat_candidate.ogg`、`docs/AI_HANDOFF.md`
- 検証: コピー後 checksum 一致。
- 注意点: undecided Entry は未反映。ハードリロード後にゲーム内で確認。

## 直近の作業記録

### 2026-07-28 — Cursor

- 実施内容: SFX Catalog Review の候補メタを折りたたみ表示に変更。初期は `variant.label`（例: Cast 13 — Synth Wide）のみ。ラベルクリックで ID・Source・License 等の詳細を展開／再クリックで閉じる。再生・Adopt 等の動作は変更なし。
- 変更ファイル: `SfxPreviewSystem.ts`、`docs/AI_HANDOFF.md`
- 検証: 表示変更のみ。必要ならハードリロード後に Review All で縦の短さを確認。
- 注意点: 候補データ・Runtime・Adopt は未変更。

## 直近の作業記録

### 2026-07-28 — Cursor

- 実施内容: Combat Core Candidate Catalog Registration。Manifest 外部候補45件を Catalog 登録（既存 Runtime/Revision/Repo候補は保持）。Recommended=外部 Rank1–3。`.gitignore` で当該3ディレクトリのみ追跡可能。生成スクリプトで定数分割。Runtime 音・audio.ts・sfxEvents・GameAudio は未変更。自動 Adopt なし。
- 変更ファイル: `combatCoreExternalCandidates.ts`、`sfxCatalog.ts`、`sfxCatalog.combatCoreExternal.test.ts`、`SfxPreviewSystem.ts`、`SfxCatalogReviewStore.ts`、`.gitignore`、`tools/sfx_catalog/generate_combat_core_external_candidates.mjs`、`docs/audio/combat-core-external-candidates.md`、未追跡の外部45音源ディレクトリ、`docs/AI_HANDOFF.md`
- 検証: typecheck / test 117 / build 成功。check-ignore: 45件非ignore・他候補 ignore 維持。dist に各15件。
- 注意点: Runtime 採用は未実施。ブラウザ UI は手動確認。再生成: `node tools/sfx_catalog/generate_combat_core_external_candidates.mjs`

## 直近の作業記録

### 2026-07-28 — Codex

- 実施内容: Combat Core 3 Entry（`skill.power.cast` / `skill.power.impact` / `enemy.defeat`）について、公式CC0パックを取得・解析し、Catalog登録前の確定候補を各15件（計45件）準備。Catalog・Runtime・ゲームコードは未変更。
- 確定候補一覧: `docs/audio/sfx-external-import.json` の対象Entry内 `candidates` が正。Candidate IDは各Entryの `-external-01`〜`-external-15`、`localPath` と `recommendationRank` も同じ配列に全件記録。
- 保存先: `public/assets/audio/candidates/external/skill-power-cast/`、`skill-power-impact/`、`enemy-defeat/`。各15ファイル。すべて元形式のままで、変換・トリム・音量加工なし。
- 解析・権利情報: duration / sample rate / channels / size / peak / RMS / leading・trailing silence / SHA-256 / 元ファイルSHA / 作者 / 配布元・download URL / CC0 URLをManifestへ記録。帰属表示は全件不要。
- 除外: Cast 72件（うち既存ExternalとSHA一致11件、長すぎ17件、laser/UI寄り18件、用途違い26件）、Impact 115件（既存重複5件ほか）、Defeat 145件（voice-like・特定クリーチャー依存60件ほか）。新規45件は相互・既存Runtime/CandidateとのSHA重複なし。
- Catalog登録時の注意: `sfxCatalog.ts`にはまだ登録しない状態。次工程ではManifestの`localPath`から先頭`public/`を除いたURLを使い、Candidate IDと推奨順位を保持すること。Runtime/Preferredへ自動採用しない。Castのsynth系とDefeatのcreature系は人間試聴で世界観・汎用性を最終確認する。
- 検証: 45ファイル存在・ffprobe/ffmpeg decode・0 byteなし・SHA-256・ID一意・各Entry 15件を確認。コード変更がないためtypecheck/buildは省略。
- Git注意: `public/assets/audio/candidates/` は既存`.gitignore`対象。実ファイルはローカルに存在するが、追跡方針は別タスク。

## 直近の作業記録

### 2026-07-27 — Cursor

- 実施内容: `sfx-catalog-review-adoptions.json` の Adopt を Runtime へ反映。cast=Candidate C（`player_fire_power.ogg`）、defeat=Candidate B（`enemy_defeat_b.ogg`→kenney runtime パス）、impact=Runtime 維持（コピーなし）。`audio.ts` / manifest パス変更なし。
- 変更ファイル: `public/assets/audio/player_fire_power.ogg`、`public/assets/audio/library/kenney/enemy_defeat_candidate.ogg`、`docs/AI_HANDOFF.md`
- 検証: コピー後 SHA-256 一致、`npm run typecheck` / `npm run build` 成功。
- 注意点: 他 Entry の undecided は未反映。候補ファイル自体は残置。

## 直近の作業記録

### 2026-07-27 — Cursor

- 実施内容: Combat Core Audio Workbench Phase 1 完成。`skill.power.cast` / `skill.power.impact` / `enemy.defeat` を Event Map・Runtime 発火・Catalog 独立 Entry（combat-core）・Adopt Export・反映手順まで縦通し。既存リポジトリ候補を再利用。Batch 1 Event は維持。
- 変更ファイル: `sfxEvents.ts`、`sfxEvents.test.ts`、`GameAudioSystem.ts`、`PlayerBulletCombatSystem.ts`、`sfxCatalog.ts`、`sfxCatalog.combatCore.test.ts`、`SfxCatalogReviewStore.ts`、`SfxPreviewSystem.ts`、`docs/audio/combat-core-runtime-adoption.md`、`docs/audio/sfx-external-import.json`、`docs/AI_HANDOFF.md`
- 検証: `npm run typecheck` / `npm test`（115） / `npm run build` 成功。Runtime 音源 HTTP 200（dev server）。Catalog UI の Chrome 自動操作は sandbox 制限のため手動確認手順を記載。
- 注意点: Adopt はレビューのみ。Runtime 反映は Export JSON + `docs/audio/combat-core-runtime-adoption.md`。Recommended の勝手採用なし。

## 直近の作業記録

### 2026-07-27 — Cursor

- 実施内容: SFX Event Routing Batch 1。7 Event ID（XP/Gold/接触/弾/撃破/level_up open・confirm）を型安全に定義し、既存 Runtime キーへマッピング。`GameAudioSystem.playEvent` 経由へ該当呼び出しのみ移行。音源・音量・ゲート・Catalog は未変更。
- 変更ファイル: `audio/sfxEvents.ts`（新規）、`sfxEvents.test.ts`（新規）、`GameAudioSystem.ts`、`GameScene.ts`、`docs/AI_HANDOFF.md`
- 検証: `npm run typecheck` 成功、`npm run build` 成功、関連テスト 7件成功。
- 注意点: wrapper（playCoinPickup 等）は残置。Batch 2 未着手。

## 直近の作業記録

### 2026-07-27 — Cursor

- 実施内容: Review All の Play 無音を修正。根本原因は Overlay の **capture** 段階イベント遮断が子ボタンの click より先に `stopImmediatePropagation` していたこと。bubble + `stopPropagation` のみへ変更。システム Chrome で 6 候補の `currentTime > 0` / volume 0.35 を実測確認。
- 変更ファイル: `SfxPreviewSystem.ts`、`docs/AI_HANDOFF.md`
- 検証: `npm run typecheck` 成功、`npm run build` 成功、Chrome channel Playwright で再生実測成功。
- 注意点: HTMLAudio 再生経路は維持。Runtime 未変更。

## 直近の作業記録

### 2026-07-27 — Cursor

- 実施内容: Review All の Play 無音を修正。原因は Preview が `scene.sound.play` を unlock なしで呼び、Current Playing だけ先に更新していたこと。HTMLAudioElement + public URL 正規化へ切替。play() 成功後のみ Current Playing 更新。Stop は Preview 専用。
- 変更ファイル: `SfxPreviewSystem.ts`、`docs/AI_HANDOFF.md`
- 検証: 候補8件 HTTP 200（localhost:5188）、`npm run typecheck` 成功、`npm run build` 成功。
- 注意点: Runtime / audio.ts 未変更。ブラウザで実聴確認が必要。

## 直近の作業記録

### 2026-07-27 — Cursor

- 実施内容: SFX Catalog の Browse を削除し Review All のみ化。Play クリックで Cancel→Title へ戻るバグを修正。原因は Phaser `MouseManager.onMouseDownWindow` が DOM クリックをゲーム入力として処理し、Settings 全画面 overlay の `close()` が発火していたこと。対策: Catalog 中 `scene.input.enabled=false`、DOM capture で pointer 遮断、Settings overlay のガード＋一時 disableInteractive。
- 変更ファイル: `SfxPreviewSystem.ts`、`SettingsMenuSystem.ts`、`docs/AI_HANDOFF.md`
- 検証: `npm run typecheck` 成功、`npm run build` 成功。
- 注意点: Runtime 音源・audio.ts 未変更。Adopt はレビュー記録のみ。

## 直近の作業記録

### 2026-07-27 — Cursor

- 実施内容: SFX Catalog に Codex Top 3 recommendations / deprioritized を登録し、Review All モードを追加。Adopt は localStorage（`mage-survivor-sfx-catalog-review-v1`）へ保存。Export / Copy / Clear 対応。Runtime 音源・audio.ts は未変更。
- 変更ファイル: `sfxCatalog.ts`、`SfxPreviewSystem.ts`、`SfxCatalogReviewStore.ts`（新規）、`docs/AI_HANDOFF.md`
- 検証: `npm run typecheck` 成功、`npm run build` 成功。
- 注意点: Adopt はレビュー記録のみ。Runtime 反映は Export JSON を渡す別タスク。

## 直近の作業記録

### 2026-07-26 — Codex

- 実施内容: 高頻度SFXの対象別クールダウンをSceneローカルの`SfxCooldownGate`へ集約。既存のPower発射55ms・敵撃破60ms・Orbiting Orb命中70msを維持し、XP／Gold取得へ60msを追加。UI・レベルアップ・クリア・被ダメ・BGMは対象外。
- 変更ファイル: `src/games/survivor/audio/SfxCooldownGate.ts`、`SfxCooldownGate.test.ts`、`constants/audio.ts`、`systems/GameAudioSystem.ts`、`docs/AI_HANDOFF.md`
- 検証: 関連テスト3件成功、`npm run typecheck`成功、`npm test` 108件成功、`npm run build`成功、`git diff --check`成功。
- 注意点: `performance.now()`を使いTimer／Listenerは追加していない。Gateは`GameAudioSystem`ごとに再作成されるため、Scene再作成時に状態を持ち越さない。

## 直近の作業記録

### 2026-07-26 — Cursor

- 実施内容: 高頻度SEの気持ちよさ改善。(1) Power発射音を既存候補 `player_fire_power_c` へ正式採用。(2) 敵撃破音を Tone.js 再生成（軽い破裂＋下降）。Power発射・撃破のみ短いクールダウン＋微小音量ゆらぎ。他スキル／BGM未変更。
- 変更ファイル: `public/assets/audio/player_fire_power.ogg`、`player_fire.ogg`、`enemy_defeat.ogg`、`audio.ts`、`GameAudioSystem.ts`、`tools/sfx_designer/presets.ts`、`patches.ts`、`docs/AUDIO_ASSET_LIBRARY.md`、`docs/AI_HANDOFF.md`
- 検証: `npm run typecheck` 成功、`npm test` 105件成功、`npm run build` 成功、`generate:sfx --check` 成功。
- 注意点: 旧 Kenney `enemy_defeat_candidate.ogg` はライブラリに残置。撃破の正式パスは `assets/audio/enemy_defeat.ogg`。

## 直近の作業記録

### 2026-07-26 — Cursor

- 実施内容: Orbiting Orb に氷属性専用SFXを追加（取得／敵命中／敵弾迎撃）。Tone.js オフライン生成（`--only`）。他スキルSE・BGMは未変更。命中・迎撃は短いクールダウン付き。
- 新規ファイル: `public/assets/audio/orbiting_orb_obtain.ogg`、`orbiting_orb_hit.ogg`、`orbiting_orb_shatter.ogg`
- 変更ファイル: `tools/sfx_designer/presets.ts`、`patches.ts`、`generate.ts`（`--only`）、`check.ts`、`audio.ts`、`assetManifest.ts`、`GameAudioSystem.ts`、`OrbitingOrbSystem.ts`、`GameScene.ts`、`docs/SKILL_CATALOG.md`、`docs/AI_HANDOFF.md`
- 検証: `npm run generate:sfx -- --check` 成功、`npm run typecheck` 成功、`npm test` 105件成功、`npm run build` 成功。
- 注意点: ライセンスは自作生成音（Tone.js）。既存正式SEの一括再生成は行っていない。

## 直近の作業記録

### 2026-07-26 — Cursor

- 実施内容: Orbiting Orb に氷属性専用SFXを追加（取得／敵命中／敵弾迎撃）。Tone.js オフライン生成（`--only`）。他スキルSE・BGMは未変更。命中・迎撃は短いクールダウン付き。
- 新規ファイル: `public/assets/audio/orbiting_orb_obtain.ogg`、`orbiting_orb_hit.ogg`、`orbiting_orb_shatter.ogg`
- 変更ファイル: `tools/sfx_designer/presets.ts`、`patches.ts`、`generate.ts`（`--only`）、`check.ts`、`audio.ts`、`assetManifest.ts`、`GameAudioSystem.ts`、`OrbitingOrbSystem.ts`、`GameScene.ts`、`docs/SKILL_CATALOG.md`、`docs/AI_HANDOFF.md`
- 検証: `npm run generate:sfx -- --check` 成功、`npm run typecheck` 成功、`npm test` 105件成功、`npm run build` 成功。
- 注意点: ライセンスは自作生成音（Tone.js）。既存正式SEの一括再生成は行っていない。

## 直近の作業記録

### 2026-07-26 — Cursor

- 実施内容: Earth Dungeon（ruins）開始時も他エリアと同じ無属性 `powerOrb` にする。`resolvePlayerBulletStyle` の ruins→`earthOrb` 特例を削除。属性切替は Move/Pickup/XP Bonus の既存優先順位のみ。
- 変更ファイル: `combat.ts`、`combat.test.ts`、`PlayerBullet.ts`（コメント）、`docs/SKILL_CATALOG.md`、`docs/AI_HANDOFF.md`
- 検証: `npm run typecheck` 成功、`npm test` 105件成功、`npm run build` 成功、`git diff --check` 成功。
- 注意点: `earthOrb` のテクスチャ・SEは残置（抽選からは外れます）。

## 直近の作業記録

### 2026-07-26 — Cursor

- 実施内容: Earth Dungeon（ruins）開始時も他エリアと同じ無属性 `powerOrb` にする。`resolvePlayerBulletStyle` の ruins→`earthOrb` 特例を削除。属性切替は Move/Pickup/XP Bonus の既存優先順位のみ。
- 変更ファイル: `combat.ts`、`combat.test.ts`、`PlayerBullet.ts`（コメント）、`docs/SKILL_CATALOG.md`、`docs/AI_HANDOFF.md`
- 検証: `npm run typecheck` 成功、`npm test` 105件成功、`npm run build` 成功、`git diff --check` 成功。
- 注意点: `earthOrb` のテクスチャ・SEは残置（抽選からは外れます）。

## 直近の作業記録

### 2026-07-26 — Cursor

- 実施内容: Orbiting Orb の個数を Lv2=3 / Lv3=4 に変更（Lv1=2、Lv4+=4 は維持）。半径・角速度・ダメージ倍率は未変更。
- 変更ファイル: `combat.ts`、`orbitingOrb.test.ts`、`docs/SKILL_CATALOG.md`、`docs/AI_HANDOFF.md`
- 検証: `npm run typecheck` 成功、`npm test` 103件成功、`npm run build` 成功、`git diff --check` 成功。
- 注意点: なし。

## 直近の作業記録

### 2026-07-26 — Cursor

- 実施内容: Orbiting Orb の個数を Lv2=3 / Lv3=4 に変更（Lv1=2、Lv4+=4 は維持）。半径・角速度・ダメージ倍率は未変更。
- 変更ファイル: `combat.ts`、`orbitingOrb.test.ts`、`docs/SKILL_CATALOG.md`、`docs/AI_HANDOFF.md`
- 検証: `npm run typecheck` 成功、`npm test` 103件成功、`npm run build` 成功、`git diff --check` 成功。
- 注意点: なし。

## 直近の作業記録

### 2026-07-26 — Cursor

- 実施内容: Orbiting Orb に (1) レベル別角速度 1.8/2.15/2.55/3.0 (2) `destructible` 敵弾との overlap で消滅 (3) ワールド／UI を氷見た目へ変更。取得条件・Orb数・半径・ダメージ倍率・他スキルは未変更。
- 変更ファイル: `combat.ts`、`OrbitingOrbSystem.ts`、`EnemyBullet.ts`、`GameScene.ts`、`SkillIcon.ts`、`skillIcons.ts`、`ui.ts`、`orbitingOrb.test.ts`、`skillIcons.test.ts`、`docs/SKILL_CATALOG.md`、`docs/AI_HANDOFF.md`
- 検証: `npm run typecheck` 成功、`npm test` 103件成功、`npm run build` 成功、`git diff --check` 成功。lintスクリプトなし。
- 注意点: 蜂の針は引き続き `destroyableByPlayer=false`（プレイヤー弾では壊せない）。Orb 用に `destructible=true` を追加。テクスチャキーは既存 `orbitingOrb`。

## 直近の作業記録

### 2026-07-26 — Cursor

- 実施内容: Volcano 本番スポーンから見た目未実装敵を一時除外。コード・Factory・行動は残置。候補テーブルから `armored` / `charger` / `runner` / `shielded` を外し、実装済み相対重みはそのまま（合計で自動正規化）。ボス `chaosElemental` と召喚抽選も同じ Stage5 テーブルを使う。
- 除外理由: 呼吸スプライト未接続、または walk スプライト無効のため色付き矩形のまま出ていた。
- 現在 Volcano 出現: S1 `spiritFire` / S2 `spiritThunder`,`spiritFire` / S3 `burningTree`,`spiritThunder`,`ranged` / S4 `ashKnight`,`spiritThunder` / S5 上記4種+`ranged` + ボス `chaosElemental`
- 再有効化: `pickEnemyKind.ts` の各 `VOLCANO_STAGE*_WEIGHTS` にエントリを戻す（見た目完成後）。一覧は `VOLCANO_SPAWN_EXCLUDED_UNFINISHED_VISUAL_KINDS`。
- 変更ファイル: `pickEnemyKind.ts`、`pickEnemyKindForArea.test.ts`、`TODO.md`、`docs/AI_HANDOFF.md`
- 検証: `npm run typecheck` 成功、`npm test` 101件成功、`npm run build` 成功、`git diff --check` 成功。lintスクリプトなし。
- 注意点: 他エリアの抽選は未変更。敵定義・HP・速度は未変更。共通フォールバック矩形処理自体は削除していない。

## 直近の作業記録

### 2026-07-26 — Cursor

- 実施内容: スキルアイコン内部描画を `createSkillIcon()` へ最小共通化。LevelUpChoice → Hud → Achievements の順。バナーは既に共通化済みのため未変更。`createSkillIcon` APIは拡張なし。`isSkillIconId` テストを追加。
- 変更ファイル: `LevelUpChoiceSystem.ts`、`HudSystem.ts`、`AchievementsPanelSystem.ts`、`comboSkillPreview.ts`（先行）、`skillIcons.ts`（`isSkillIconId`）、`skillIcons.test.ts`、`docs/AI_HANDOFF.md`
- 検証: `npm run typecheck` 成功、`npm test` 98件成功、`npm run build` 成功、`git diff --check` 成功。lintスクリプトなし。
- 注意点: 各UIの座標・サイズ・凍結veil・ロック南京錠・接続線はUI側に残置。ワールド用 Orbiting Orb テクスチャは SkillIcon へ未移動。敵／スポーン未変更。

## 直近の作業記録

### 2026-07-26 — Cursor

- 実施内容: 複合スキル Orbiting Orb（`orbitingOrb`）を追加。Move+Pickupから同期。プレイヤー周囲の回転Orb（Graphicsテクスチャ1回生成・再ヒット500ms）。Ricochet条件を XP Bonus+Pickup+Speed へ変更し最後の複合に。Volcano Stage3/4のRicochet強制候補を削除（XP BonusがVolcanoクリア後のため）。
- 変更ファイル: `combat.ts`、`skillIcons.ts`、`SkillIcon.ts`、`OrbitingOrbSystem.ts`、`OrbitingOrbUnlockBannerSystem.ts`、`comboSkillPreview.ts`、`LevelUpChoiceSystem.ts`、`GameScene.ts`、`HudSystem.ts`、`AchievementSystem.ts`、`progression.ts`、`ui.ts`、`CarriedProgress.ts`、`orbitingOrb.test.ts`、`docs/SKILL_CATALOG.md`、`docs/AI_HANDOFF.md` ほか。
- 検証: `npm run typecheck` 成功、`npm test` 97件成功、`npm run build` 成功、`git diff --check` 成功。
- 注意点: XP Bonus解放タイミングは未変更。Ricochetの跳弾効果自体は未変更。lintスクリプトはpackage.jsonに無し。

## 直近の作業記録

### 2026-07-26 — Cursor

- 実施内容: Earth Dungeon Stage3 に新敵 `earthSkeleton` を追加。HP10・カブトムシと同仕様の突進・経験値2倍。呼吸スプライト＋黒枠＋左右反転。出現は Ruins Stage3 のみ、スポーン数1.4倍、1体ずつ・地点間距離付きで分散。
- 変更ファイル: `public/assets/sprites/enemy_earth_skeleton_breath.png`、`types.ts`、`enemies.ts`、`difficulty.ts`、`enemySprites.ts`、`spawnEnemyCommon.ts`、`spawnFactories.ts`、`packSpawn.ts`、`pickEnemyKind.ts`、`pickEnemyKindForArea.test.ts`、`assetManifest.ts`、`EnemyMovementSystem.ts`、`WaveSystem.ts`、`docs/AI_HANDOFF.md`。
- 検証: `npm run typecheck` 成功、`npm test` 78件成功、`npm run build` 成功、`git diff --check` 成功。
- 注意点: Forest Stage3 のカブトムシ挙動は変更なし。他エリア／他Stageのスポーン設定は未変更。

## 直近の作業記録

### 2026-07-26 — Cursor

- 実施内容: Earth Dungeon Stage1 の `earthSlime` を見た目・当たり判定とも 1.5 倍に拡大。
- 変更ファイル: `src/games/survivor/constants/enemies.ts`、`src/games/survivor/objects/enemy/spawnEnemyCommon.ts`、`docs/AI_HANDOFF.md`。
- 検証: `npm run typecheck` 成功、`npm test` 77件成功、`npm run build` 成功、`git diff --check` 成功。

## 直近の作業記録

### 2026-07-26 — Cursor

- 実施内容: Earth Dungeon Stage2 に新敵 `earthRock` を追加。HP5・速度0.85倍・最初1発ブロック・約5秒ごとに小石弾。小石はコード生成テクスチャで、プレイヤー弾で破壊可能。
- 変更ファイル: `public/assets/sprites/enemy_earth_rock_breath.png`、`types.ts`、`enemies.ts`、`difficulty.ts`、`enemySprites.ts`、`spawnEnemyCommon.ts`、`spawnFactories.ts`、`packSpawn.ts`、`pickEnemyKind.ts`、`pickEnemyKindForArea.test.ts`、`assetManifest.ts`、`EnemyBullet.ts`、`EnemyAttackSystem.ts`、`GameScene.ts`、`docs/AI_HANDOFF.md`。
- 検証: `npm run typecheck` 成功、`npm test` 77件成功、`npm run build` 成功、`git diff --check` 成功。

## 直近の作業記録

### 2026-07-26 — Cursor

- 実施内容: Earth Dungeon Stage1 に新敵 `earthSlime` を追加。緑スライム相当のHP・速度・攻撃で出現。呼吸スプライト＋黒枠＋向き。Stage1の出現を `stoneGuard` から `earthSlime` へ変更（stoneGuard実装は残置）。
- 変更ファイル: `public/assets/sprites/enemy_earth_slime_breath.png`、`types.ts`、`enemies.ts`、`enemySprites.ts`、`spawnEnemyCommon.ts`、`spawnFactories.ts`、`packSpawn.ts`、`pickEnemyKind.ts`、`pickEnemyKindForArea.test.ts`、`assetManifest.ts`、`docs/AI_HANDOFF.md`。
- 検証: `npm run typecheck` 成功、`npm test` 76件成功、`npm run build` 成功、`git diff --check` 成功。

## 直近の作業記録

### 2026-07-26 — Cursor

- 実施内容: Fire Volcano Stage2〜5の敵出現比率を重み付き抽選へ変更。chaosElemental の最大HP・開始HPを2倍（75→150）。
- 変更ファイル: `src/games/survivor/objects/enemy/pickEnemyKind.ts`、`src/games/survivor/objects/enemy/pickEnemyKindForArea.test.ts`、`src/games/survivor/constants/enemies.ts`、`docs/AI_HANDOFF.md`。
- 検証: `npm run typecheck` 成功、`npm test` 76件成功、`npm run build` 成功、`git diff --check` 成功。
- 注意点: Fire Volcano以外・敵個別性能・報酬・スキル選択ルールは未変更。Stage2〜4のパック内は従来どおり同種1種類（パック単位で抽選）。

## 直近の作業記録

### 2026-07-25 — Codex

- 実施内容: Gemini CLIの中断で発生した19件の型エラーを解消し、スキルアイコンを一元化。
- 変更内容: `constants/skillIcons.ts` に全10種の記号・色・基準寸法・相対比率を集約。ツリー1倍、レベルアップ1.5倍、取得通知4.5倍、レベル上昇通知2.5倍として同じ原本を使用。Pierce / Blast / Ricochet通知は共通の `ui/SkillIcon.ts` で描画し、固有の別記号・別フォント・別比率を廃止。
- 変更ファイル: `src/games/survivor/constants/skillIcons.ts`、`src/games/survivor/constants/skillIcons.test.ts`、`src/games/survivor/ui/SkillIcon.ts`、関連するHUD・レベルアップ・実績・取得通知システム。
- 検証: `npm run typecheck` 成功、`npm test` 72件成功、`npm run build` 成功、`git diff --check` 成功。
- 注意点: スキルツリーの基準内寸は16pxを維持。全UIの相対比率変更は `skillIcons.ts`、各UIの倍率変更は `ui.ts` だけで行える。

## 直近の作業記録

### 2026-07-25 — Codex

- 実施内容: スキルツリーのシンボルを外枠から出ない18pxへ拡大し、中央配置と右マージンを再確認。
- 変更内容: 列間隔とツリー実幅を定数化。開始X=870px、実幅=82px、右端=952pxとなり、960px画面の右マージン8pxを確保。将来の定数変更でも右端を越えない位置補正を追加。
- 検証: `npm run typecheck` 成功、`npm test` 70件成功、`npm run build` 成功、`git diff --check` 成功。

## 直近の作業記録

### 2026-07-25 — Codex

- 実施内容: 画面外へはみ出したスキルツリーのアイコン寸法を元へ戻し、レベルアップ画面の拡大表示は維持。
- 変更内容: スキルツリー用（16px、シンボル16px）とレベルアップ用（24px、シンボル20px）の寸法定数を分離。シンボルの種類・フォント・位置合わせは引き続き共通。
- 検証: `npm run typecheck` 成功、`npm test` 70件成功、`npm run build` 成功、`git diff --check` 成功。

## 直近の作業記録

### 2026-07-25 — Codex

- 実施内容: Gemini CLIで中断されたスキルアイコンの共通化・拡大・中央配置修正を引き継いで完了。
- 変更内容: アイコン内寸、枠、外寸、余白、シンボル文字サイズ、XYオフセットを共通定数へ集約。スキルツリー・実績・レベルアップ画面で同じUIフォントと文字スタイルを使用。外枠を含む実寸で行幅と配置を計算し、左右マージンを揃えた。
- 変更ファイル: `src/games/survivor/constants/ui.ts`、`src/games/survivor/systems/HudSystem.ts`、`src/games/survivor/systems/AchievementsPanelSystem.ts`、`src/games/survivor/systems/LevelUpChoiceSystem.ts`、`docs/AI_HANDOFF.md`。
- 検証: `npm run typecheck` 成功、`npm test` 70件成功、`npm run build` 成功、`git diff --check` 成功。
- 注意点: 共通アイコンは内寸24px、枠2px、外寸28px、シンボル20px。微調整は `SKILL_ICON_*` 定数だけで全表示へ反映できる。

## 直近の作業記録

### 2026-07-25 — Gemini CLI

- 実施内容:
  - レベルアップUIのアイコンシンボル拡大。
  - `LEVEL_UP_CHOICE_ICON_SIZE` を 22 -> 32 に変更。
  - レベルアップUI内のアイコンシンボル文字サイズを 12px -> 18px に変更。
- 変更ファイル: `src/games/survivor/constants/ui.ts`, `src/games/survivor/systems/LevelUpChoiceSystem.ts`。
- 検証: `npm run typecheck` 成功、`npm run build` 成功。


## 直近の作業記録

### 2026-07-25 — Codex

- 実施TODO: `SoundManager` のBGMフェード、ループ境界、SE同時発音制御の単体テストと実装確認。
- 変更内容: `loopEnd` 単独指定を先頭からのループとして適用。BGM切替フェードが再生コマンドを自己無効化する不具合を修正。AudioContext再開待ち中にもSE同時発音上限を予約・適用するよう修正。
- 変更ファイル: `src/core/audio/SoundManager.ts`、`src/core/audio/SoundManager.test.ts`、`src/core/audio/bgmFade.ts`、`src/core/audio/bgmFade.test.ts`、`TODO.md`、`docs/AI_HANDOFF.md`。
- 検証: `npm run typecheck` 成功、`npm test` 70件成功、`npm run build` 成功、`git diff --check` 成功。
- 次の実装可能TODO: Earth Dungeon Stage 2 の Burrower 実装と敵選択・出現条件テスト。
- 注意点: 正式音源データは変更していない。既存の各BGM `loopEnd` 設定がランタイムへ反映されるようになった。

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
