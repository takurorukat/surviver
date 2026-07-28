# Skill System Overview

この文書は、2026-07-26時点の実装をコードから調査した結果である。「確認済み」は実行経路または参照箇所をコード上で確認できた事実、「推測／要確認」はコードだけでは設計意図を確定できない事項を表す。

現行のラン内スキルは、候補から選ぶ基本スキル6種と、素材レベルから自動算出される複合スキル3種で構成される。プレイヤーは敵が落とすXPコインでレベルアップし、通常は重複なしの最大3候補から1つを選ぶ。

| 区分 | スキル |
| --- | --- |
| 初期から候補に出る基本スキル | Power、Speed、Range |
| 実績／エリアクリア後に候補へ加わる基本スキル | Move、Pickup、XP Bonus |
| 素材レベルから自動同期される複合スキル | Pierce、Blast、Ricochet |
| 通常候補消滅時の代替報酬 | Gold（1 Gold。能力値は変化しない） |

共通の戦闘初期値は、攻撃力1、攻撃間隔800ms、射程225px（定義は`150 × WORLD_ENTITY_SCALE 1.5`）、移動速度165px/s、Pickup半径120px（`80 × 1.5`）、弾速480px/s、通常弾数1発、同時存在弾上限40である。スキルによる攻撃の持続時間という概念はなく、射程内の最寄り敵へクールダウンごとに自動発射する。

# Basic Skills

## 一覧

| 表示名 | 内部ID | 分類／属性 | 初期レベルと効果 | 1回取得時の変化 | 現行の最大レベル |
| --- | --- | --- | --- | --- | --- |
| Power | `damage` | 攻撃力／初期Power属性 | Lv1、弾ダメージ1 | ダメージ+1 | 初期3。Plainsクリア後5、Forestクリア後7。さらにショップの`powerCap`購入数を加算 |
| Speed | `fireRate` | 攻撃速度 | Lv1、800msごとに1回 | レベル+1。間隔=`800 / Lv` ms | Powerと同じ進行式。ショップは`speedCap` |
| Range | `range` | 射程 | Lv1、225px | レベル+1。射程を前Lvの1.25倍 | `3 + rangeCap購入数` |
| Move | `move` | 移動／風属性 | Lv1、165px/s | レベル+1。基準速度の50%（82.5px/s）ずつ増加 | 固定Lv5 |
| Pickup | `magnet` | 回収／水属性 | Lv1、吸引半径120px | レベル+1。半径+42px（`28 × 1.5`） | 固定Lv5 |
| XP Bonus | `xpBonus` | XP獲得／火属性 | Lv0、敵1体あたり通常1枚の1XPコイン | レベル+1。コイン枚数倍率を段階的に増加 | 初期Lv2。`2 + xpBonusCap購入数` |

Power、Speed、Rangeは常時解放済み。MoveはPlainsクリア、PickupはForestクリア、XP BonusはVolcanoクリア実績が必要である。未解放スキルは候補プールから除外される。

## レベル別数値

以下はショップ拡張後も同じ式を使う。px値には`WORLD_ENTITY_SCALE = 1.5`を反映済み。

| Lv | Power: 弾ダメージ | Speed: 攻撃間隔 | Range: 射程 | Move: 移動速度 | Pickup: 吸引半径 |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1 | 800ms | 225px | 165px/s | 120px |
| 2 | 2 | 400ms | 281.25px | 247.5px/s | 162px |
| 3 | 3 | 約266.67ms | 約351.56px | 330px/s | 204px |
| 4 | 4 | 200ms | 約439.45px | 412.5px/s | 246px |
| 5 | 5 | 160ms | 約549.32px | 495px/s | 288px |
| n | n | `800 / n` ms | `225 × 1.25^(n-1)` px | `165 × (1 + 0.5 × (n-1))` px/s | `120 + 42 × (n-1)` px |

Powerは実装上「レベル専用値」ではなく`currentAttackDamage`そのものを素材レベルとしても使う。したがってPower Lvと弾ダメージは常に同じ数値である。

### XP Bonus

各コインの価値は常に1XPで、レベルによりドロップ枚数が変わる。奇数レベルの50%抽選には`Math.random()`を使う。

| Lv | 通常敵1体のコイン枚数 | 全敵撃破ボーナス全体への倍率 |
| ---: | --- | ---: |
| 0 | 常に1枚 | ×1 |
| 1 | 50%で1枚、50%で2枚 | ×1 |
| 2 | 常に2枚 | ×2 |
| 3 | 50%で2枚、50%で3枚 | ×2 |
| 4 | 常に3枚 | ×3 |
| n | `floor(n/2)+1`枚、奇数Lvのみ50%でさらに+1枚 | `floor(n/2)+1` |

敵固有のXPドロップ倍率がある場合、上表の枚数へその倍率を掛ける。全敵撃破時は、固定ボーナスへ上記倍率を掛けた値を基礎に時間ボーナスも計算するため、固定分と時間分の両方が同じ倍率で増える。

## 弾の属性表示

属性は独立したダメージタイプではなく、取得済み基本スキルから弾の見た目・ヒット演出・SEを選ぶ分類である。優先順位は次の通り。

1. XP Bonus Lv1以上: `fireOrb`
2. Pickup Lv2以上: `waterOrb`
3. Move Lv2以上: `windVortex`
4. 上記未取得（全エリア共通）: `powerOrb`

属性別の耐性・弱点や属性固有ダメージ倍率は確認できない。`earthOrb` の見た目・SEはコードに残るが、現行の属性抽選では選ばれない。

## 関連実装

- 候補名・説明・候補解放: `src/games/survivor/systems/LevelUpChoicePool.ts`
- 選択適用・UI: `src/games/survivor/systems/LevelUpChoiceSystem.ts`
- 基礎値・計算式: `src/games/survivor/constants/combat.ts`
- 上限・ショップ購入値: `src/games/survivor/systems/UnlockSaveSystem.ts`
- 解放条件: `src/games/survivor/systems/AchievementSystem.ts`
- 発射処理: `src/games/survivor/systems/PlayerAttackSystem.ts`
- 弾生成・弾データ: `src/games/survivor/objects/PlayerBullet.ts`
- XPコイン生成: `src/games/survivor/systems/PlayerBulletCombatSystem.ts`

# Combined / Evolved Skills

複合スキルはレベルアップ候補へ直接入らない。基本スキルを1つ選択した直後、素材レベルから目標レベルを再計算し、現在値より高い場合に自動取得／自動強化される。

| 表示名／内部ID | 必要基本スキル | 成立条件・レベル式 | 確認済み効果 |
| --- | --- | --- | --- |
| Pierce / `pierce` | Move + Speed | 両方Lv2以上。`min(Move, Speed) - 1` | 1発が命中できる敵数=`Pierce Lv + 1`。1体目は通常ダメージ、2体目以降は元ダメージの半分を切り上げ |
| Blast / `blast` | Power + Range | 両方Lv2以上。`min(Power, Range) - 1` | 直撃地点で対象以外へ範囲ダメージ。半径=`42 + 18 × (Lv-1)`px。ダメージはその命中の実ダメージの半分を切り上げ |
| Orbiting Orb / `orbitingOrb` | Move + Pickup | 両方Lv2以上。`min(Move, Pickup) - 1` | プレイヤー周囲を回る氷Orb。接触で敵へダメージ、破壊可能な敵弾（蜂の針・小石など `destructible`）を消滅。Lv1:2個/半径70/角速度1.8/倍率0.5、Lv2:3/80/2.15/0.6、Lv3:4/85/2.55/0.6、Lv4+:4/90/3.0/0.7。同じ敵への再ヒット間隔500ms。Orb自体は接触しても消滅しない。専用SFX: 取得・敵命中・敵弾迎撃（Tone.js生成・氷系） |
| Ricochet / `ricochet` | XP Bonus + Pickup + Speed | Pickup・SpeedがLv2以上かつXP Bonus Lv1以上。`min(Pickup-1, Speed-1, XP Bonus)` | Lvと同じ回数だけ、命中地点から半径390px以内の未命中の最寄り敵へ跳弾 |

## 追加条件と解放

- Blastは初期候補のPowerとRangeだけで成立するため、最初のランでも取得可能。
- PierceにはPlainsクリア後に候補解放されるMoveが必要。
- Orbiting OrbにはForestクリア後に候補解放されるPickupが必要（MoveはPlainsクリア後）。
- RicochetにはVolcanoクリア後に候補解放されるXP Bonusが必要。Volcano内ではXP Bonusが出ないためRicochetは成立しない。
- 複合条件が初めて成立すると、対応する`pierce_unlock`、`blast_unlock`、`orbiting_orb_unlock`、`ricochet_unlock`実績をその場で保存する。過去に実績未解放であることは複合成立の前提ではない。
- 素材のいずれかを封印しても現在レベルは失われない。封印は以後その基本スキルが候補に出なくなるだけである。

## 元スキルから引き継ぐ要素

- すべての複合効果は通常弾のダメージ、攻撃間隔、射程、弾速、属性表示を維持したまま追加される（Orbiting Orbは弾を撃たず、周囲回転オブジェクトとして追加される）。
- Blastのダメージは固定値ではなく、Power由来の弾ダメージと、貫通／跳弾後の実ダメージを参照する。
- Orbiting Orbのダメージは`ceil(現在の攻撃力 × 倍率)`（最低1）。通常弾のダメージ処理とは独立。
- PierceとRicochetを同時所持した場合、1発へ両効果を混ぜず、同じクールダウンでPierce専用弾とRicochet専用弾の2発を左右に10pxずらして同時発射する。
- Ricochet弾は`初撃 + Ricochet Lv`回の命中枠を持つ。同じ敵UIDへは再命中しない。

## 複合スキルの表示

素材候補を選ぶことで複合レベルが上がる場合、レベルアップカード内に「+」、複合スキル名、共通アイコン、短い効果説明を予告表示する。初取得後は大きな`OBTAINED`バナー、2回目以降は`Lv.N`バナーを順番に表示する。同時に複数成立した場合の表示順はPierce、Blast、Orbiting Orb、Ricochet。

## 関連実装

- 複合レベル式: `src/games/survivor/constants/combat.ts`
- 自動同期・バナー順序: `src/games/survivor/scenes/GameScene.ts`
- 候補内の複合予告: `src/games/survivor/systems/comboSkillPreview.ts` / `LevelUpChoiceSystem.ts`
- Orbiting Orb本体: `src/games/survivor/systems/OrbitingOrbSystem.ts`（テクスチャ生成含む）
- 共通スキルアイコン: `src/games/survivor/constants/skillIcons.ts` / `ui/SkillIcon.ts`
- Pierce／Ricochet発射分岐: `src/games/survivor/systems/PlayerAttackSystem.ts`
- 命中、減衰、跳弾、Blast起動: `src/games/survivor/systems/PlayerBulletCombatSystem.ts`
- Blast範囲処理: `src/games/survivor/systems/HitBlastSystem.ts`

# Level-up Selection Logic

## XPと選択開始

- プレイヤーLv1から開始する。
- 次レベル必要XPは4、7、11、16、22…と増え、1回分の必要量は最終的に50XPで固定される。
- 一度に複数レベル分のXPを得た場合は`pendingLevelUps`へ積み、1件ずつ連続処理する。
- 通常エリアでは選択後にHP全回復。Earth Dungeon（`ruins`）では全回復しない。

## 候補プール

通常プールはPower、Speed、Range、Move、Pickup、XP Bonusの6種。Pierce、Blast、Ricochetは候補に入らない。

候補は次の順で除外される。

1. Seal Skillsで封印中
2. 現在値が上限以上
3. Move、Pickup、XP Bonusが未解放

残った候補から最大3件を等確率・重複なしで抽選する。レアリティ、個別ウェイト、段階別ウェイトは存在しない。候補数が3未満なら残数だけ表示する。

## 強制候補

一部Volcanoステージでは、不足素材を1枠へ先に入れてから残りをランダム抽選する。強制対象が未解放・封印・上限到達でプールに存在しなければ強制されない。

| 条件 | 優先候補 |
| --- | --- |
| Volcano Stage 1でMove Lv1 | Move |
| Volcano Stage 2でPower 2未満 | Power |
| Volcano Stage 3/4でRicochet未取得 | PickupがLv2未満ならPickup、次にPowerがLv2未満ならPower、次にSpeedがLv2未満ならSpeed |

## 再取得と最大レベル

- 同じ基本スキルを再取得すると対応値を1段階増やす。候補抽選内では同一スキルが2枚出ることはない。
- 上限到達した基本スキルは次回以降のプールから除外される。
- 通常候補がすべて上限、未解放、または封印で消えた場合、選択UIを出さず自動的に1 Goldを付与する。
- `LevelUpChoiceId`と`applyChoice()`にはPierce、Blast、Ricochetの直接加算分岐が残るが、現行プールからそのIDが渡る経路はない。

## UI

- 全画面を薄暗くし、最大3枚のカードを横並びで表示する。
- 各カードは共通スキルアイコン、名称、短い説明を表示する。
- 複合成立が見込まれるカードは、カードを縦に拡張して複合予告を表示する。3枚の高さは最大予告数に合わせて揃える。
- 初期選択は中央カード。キーボードとポインタ操作に対応する。
- レベルアップ中はゲーム時間と移動体を停止し、選択後に`ready`／`GO!`カウントダウンを経て再開する。

# Data and Code Locations

| 内容 | 主なファイル |
| --- | --- |
| スキル候補のID、表示名、説明、除外 | `src/games/survivor/systems/LevelUpChoicePool.ts` |
| 抽選、選択適用、カードUI、複合予告 | `src/games/survivor/systems/LevelUpChoiceSystem.ts` |
| レベルアップ開始、上限判定、複合同期、HP回復 | `src/games/survivor/scenes/GameScene.ts` |
| 戦闘基礎値、レベル計算、複合条件、XP Bonus | `src/games/survivor/constants/combat.ts` |
| XPレベル閾値、実績文言、スキル説明 | `src/games/survivor/constants/progression.ts` |
| 永続上限、ショップ購入、封印、実績保存 | `src/games/survivor/systems/UnlockSaveSystem.ts` |
| 解放条件とHUD用一覧 | `src/games/survivor/systems/AchievementSystem.ts` |
| ショップ表示と上限購入 | `src/games/survivor/systems/ShopSystem.ts` |
| Seal Skills対象 | `src/games/survivor/systems/SealSkillSystem.ts` |
| 自動発射、複合時の弾分割 | `src/games/survivor/systems/PlayerAttackSystem.ts` |
| 弾の命中可能数・跳弾回数 | `src/games/survivor/objects/PlayerBullet.ts` |
| 命中ダメージ、Blast、Ricochet、XPドロップ | `src/games/survivor/systems/PlayerBulletCombatSystem.ts` |
| スキルツリーと現在値表示 | `src/games/survivor/systems/HudSystem.ts` |
| アイコン原本と倍率 | `src/games/survivor/constants/skillIcons.ts`、`src/games/survivor/ui/SkillIcon.ts` |

# Possible Inconsistencies

以下はすべてコード上で確認できた事実であり、修正方針は未決定。

| 重要度 | 確認済みの不整合／分散 | 根拠 |
| --- | --- | --- |
| 高 | Pierce／Blastの購入上限が自動同期時に適用されない | `getMaxedLevelUpChoiceIds()`は上限判定するが両スキルは候補プール外。`syncPierceLevelFromMoveAndSpeed()`と`syncBlastLevelFromPowerAndRange()`は目標値を購入上限でclampしない |
| 高 | Ricochetの固定上限Lv5も自動同期時に適用されない | Ricochetはプール外で、同期処理は`DEFAULT_UNLOCKED_SKILL_LEVEL_CAP`を参照しない |
| 中 | Pierce／Blast／Ricochetが`LevelUpChoiceId`と`applyChoice()`に定義されているが、候補には存在しない | 直接取得用の分岐は到達不能な状態 |
| 中 | Max HPのレベルアップ用と思われる定数とRuins推奨値があるが、HP候補が存在しない | `HP_BONUS_PER_LEVEL_UP`と`getRecommendedMaxHpForRuins()`は定義済み。後者はテスト以外から未参照。`LevelUpChoiceId`にHPなし |
| 中 | XP Bonusの表示説明は「multiplier」だが、通常敵の奇数Lvは確率的なコイン枚数増加 | Lv1は通常ドロップが常時倍率ではなく50%で2枚。一方、全敵撃破ボーナスは偶数Lvごとの確定倍率 |
| 中 | Ricochetの2体目以降にもPierce用の半減式が適用される | 全命中が`calculatePierceHitDamage(originalDamage, hitEnemyUids.length)`を通るため、Pierceを持たないRicochet弾も跳弾後は半減 |
| 低 | Speedの「Fire Speed +1」とRangeの「Fire Range +1」は実数変化を表さない | Speedは間隔を`800/Lv`へ変更、Rangeは1.25倍。Moveも+82.5px/s、Pickupも+42px |
| 低 | Blastのレベルは半径だけを増やし、ダメージはPower依存 | 「Blast Lv上昇」が威力を直接増やす実装ではない |
| 低 | 上限設定が複数箇所に分散 | 初期値は`combat.ts`、購入加算は`UnlockSaveSystem.ts`、候補除外は`GameScene.ts`、ショップ表示は`ShopSystem.ts` |
| 低 | Volcanoの強制候補条件が`GameScene.ts`内の数値リテラルに分散 | Stage番号1〜4と必要Lv2／Power3が専用定数ではない |
| 低 | PierceとRicochet同時所持時の弾間隔オフセット10pxがローカル定数 | `PlayerAttackSystem.ts`内の`splitOffset = 10` |

そのほか、`usesSkillCapShopPricing()`に`blastCap`が含まれず、Blast Capだけ汎用の`1 + 購入数`価格になる。Power／Speed／Range／XP Bonus／Pierce Capの専用価格表とは異なるが、意図的な価格差か漏れかはコードだけでは判定できない。

# Open Questions

以下は設計判断が必要であり、この調査では結論を出していない。

1. Pierce／Blast／Ricochetの実レベルを、表示される購入上限／固定上限でclampするべきか。それとも素材レベルだけで無制限に同期する仕様か。
2. 複合スキルを今後も自動取得専用にするか、残っている直接選択用ID・適用分岐を候補として復活させるか、不要コードとして扱うか。
3. Ricochetの跳弾後ダメージ半減は意図したバランスか、Pierceだけに適用すべきか。
4. Blast Lvは半径だけでなくダメージ、持続、ヒット数なども伸ばすべきか。
5. XP Bonusの表示を、通常ドロップの確率増加と全敵撃破ボーナスの確定倍率が分かる説明へ変更するか。
6. `HP_BONUS_PER_LEVEL_UP`とRuins推奨Max HPを使い、Max HPをラン内候補へ追加する予定があるか。
7. Power／Speed上限だけがエリアクリアで3→5→7へ伸び、Rangeは3のままである差を維持するか。
8. Move／Pickup／Ricochetの固定Lv5にショップ拡張を追加する予定があるか。
9. Blast Capの価格体系が他のスキルCapと異なるのは意図したものか。
10. 属性表示（風・水・火・土）を将来ゲームプレイ上の属性相性へ発展させるか、視覚・音声分類のままにするか。
