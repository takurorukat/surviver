# SFX Candidate Ranking — Batch 01

## Scope and method

対象は外部Candidateが10件ずつ存在する8 Entry、計80音源。全ファイルについて存在、duration、sample rate、channels、format、peak、平均音量、50 dB未満の先頭・末尾区間、SHA-256重複を確認した。

この順位は音源ファイル名が示す原収録物、波形上の長さ・音量・無音、ゲーム内で必要な役割から決めた**人間試聴前の暫定順位**である。実際の音色が魔法世界や既存BGMに合うかは、必ずCatalogで試聴して判断すること。Runtime採用またはPreferred指定を意味しない。

- 80件すべて再生可能。OGGは44.1/48 kHz・mono/stereo、WAVは44.1 kHz stereo。
- 最大ピークは0.0 dBFSで、0 dBFSを超える候補はない。0.0 dBFSの候補は試聴時に歪みを確認する。
- 対象80件とRuntime・既存Candidateを含む306音源のSHA-256完全重複は0件。
- 対象8 Entryはいずれも専用Runtime Variantを持たないため、試聴順のRuntime比較は省略する。共有先のRuntime音は必要なら別途比較する。

## `skill.blast`

**Gameplay role:** 強い魔法の範囲攻撃。短く爆発的で、火薬・銃・単純な素材衝突に寄りすぎない音が必要。

### Top 3

| Rank | Variant | Direction | Technical summary | Short reason |
|---:|---|---|---|---|
| 1 | `skill.blast-external-06` — Kenney Punch Heavy | balanced, strong, heavy | 649 ms, peak -1.0 dBFS, stereo | 十分な質量と持続があり、金属・木材より抽象的な強打として試しやすい。 |
| 2 | `skill.blast-external-02` — Kenney Glass Heavy | crystal, bright, short | 241 ms, peak -1.1 dBFS, stereo | 魔法的な結晶感を期待でき、短く範囲攻撃の輪郭を出しやすい。 |
| 3 | `skill.blast-external-07` — Kenney Soft Heavy | organic, strong | 505 ms, peak -0.9 dBFS, stereo | 金属感を避けた別方向。平均音量が高く、強さを確認しやすい。 |

### All candidates

| Variant | Direction | Assessment |
|---|---|---|
| external-01 Bell Heavy | bright, long | 1,480 ms。余韻が長く、攻撃より鐘・通知へ寄る可能性。 |
| external-02 Glass Heavy | crystal, bright, short | Rank 2。 |
| external-03 Metal Heavy | metallic, short | 168 msで明確だが、単純な金属衝突に聞こえる懸念。 |
| external-04 Mining Impact | heavy, long | 937 ms。強いが採掘・石材の意味が前に出る可能性。 |
| external-05 Plate Heavy | metallic, strong | 489 ms。金属板らしさを人間試聴で確認。 |
| external-06 Punch Heavy | balanced, strong, heavy | Rank 1。 |
| external-07 Soft Heavy | organic, strong | Rank 3。 |
| external-08 Wood Heavy | organic, unsuitable | 木材衝突の意味が明確すぎる。 |
| external-09 Generic Light | short, soft | 139 ms。Blastとして弱すぎる可能性。 |
| external-10 Tin Medium | metallic, short | 159 ms。薄い金属音へ寄る可能性。 |

**Candidates to deprioritize:** external-01（too long / wrong gameplay meaning）、external-08（too wooden）、external-10（too metallic）。

**Human listening order:** external-06 → external-02 → external-07 → external-05 → external-04 → external-03 → external-09 → external-10 → external-08 → external-01。共有中のEnemy Defeat／Power Hitとの識別性も確認する。

## `skill.pierce`

**Gameplay role:** 素早い貫通。短いSwishの中でも鋭さと十分な存在感が必要。

### Top 3

| Rank | Variant | Direction | Technical summary | Short reason |
|---:|---|---|---|---|
| 1 | `skill.pierce-external-03` — OpenGameArt Swish 3 | strong, short | 146 ms, peak -0.1 dBFS, mean -11.1 dBFS | 同パック内で平均音量が最も高く、貫通を明確に伝える候補。 |
| 2 | `skill.pierce-external-02` — OpenGameArt Swish 2 | short, balanced | 96 ms, peak -0.1 dBFS | 最短クラスで連続再生に向き、先頭の顕著な無音も検出されない。 |
| 3 | `skill.pierce-external-07` — OpenGameArt Swish 7 | strong, long | 187 ms, peak -0.1 dBFS | Top 2より厚みのある方向。末尾約53 msの無音を含むため体感確認が必要。 |

### All candidates

| Variant | Direction | Assessment |
|---|---|---|
| external-01 Swish 1 | balanced, short | 126 ms。先頭約22 msが静かで、反応が遅く感じないか確認。 |
| external-02 Swish 2 | short, balanced | Rank 2。 |
| external-03 Swish 3 | strong, short | Rank 1。 |
| external-04 Swish 4 | balanced, short | 146 ms。先頭約22 msが静か。 |
| external-05 Swish 5 | balanced, short | 127 ms。基準比較用。 |
| external-06 Swish 6 | balanced, short | 138 ms。基準比較用。 |
| external-07 Swish 7 | strong, long | Rank 3。 |
| external-08 Swish 8 | balanced, short | 154 ms。先頭約28 msが静か。 |
| external-09 Swish 9 | long | 197 ms。先頭・末尾とも静音区間があり、反応が鈍る可能性。 |
| external-10 Swish 10 | soft, short | 125 ms。末尾約25 msが静かで、平均音量も最小。 |

**Candidates to deprioritize:** external-09（excessive silence / longest）、external-10（too weak）、external-01（leading silence）。

**Human listening order:** external-03 → external-02 → external-07 → external-05 → external-06 → external-04 → external-08 → external-01 → external-10 → external-09。剣の斬撃へ限定されすぎないかを重点確認する。

## `skill.ricochet`

**Gameplay role:** 跳ね返り・反射を短く認識させる。金属だけでなく結晶・柔らかい反発も比較する。

### Top 3

| Rank | Variant | Direction | Technical summary | Short reason |
|---:|---|---|---|---|
| 1 | `skill.ricochet-external-01` — Kenney Glass Light | crystal, bright, short | 210 ms, peak -0.9 dBFS | 結晶的な反射を期待でき、魔法世界と跳ね返りの両方に合わせやすい。 |
| 2 | `skill.ricochet-external-04` — Kenney Metal Medium | metallic, short, strong | 143 ms, peak -1.2 dBFS | 最短で輪郭が明確。金属感が強すぎないかだけ試聴する。 |
| 3 | `skill.ricochet-external-09` — Kenney Soft Medium | soft, organic, short | 183 ms, peak -0.9 dBFS | 非金属の控えめな反射案としてTop 2と方向を分けられる。 |

### All candidates

| Variant | Direction | Assessment |
|---|---|---|
| external-01 Glass Light | crystal, bright, short | Rank 1。 |
| external-02 Glass Medium | crystal, long | 543 ms。結晶感候補だが高頻度では余韻が重なる可能性。 |
| external-03 Metal Light | metallic, short | 252 ms。明確だが金属へ寄る。 |
| external-04 Metal Medium | metallic, short, strong | Rank 2。 |
| external-05 Plank Medium | organic, long, unsuitable | 779 ms。木板の意味が強く、長い。 |
| external-06 Plate Light | metallic, long | 655 ms、平均音量も低い。 |
| external-07 Plate Medium | metallic, long | 616 ms。高頻度の反射には長い。 |
| external-08 Wood Medium | organic | 333 ms。反射より木材衝突に聞こえる懸念。 |
| external-09 Soft Medium | soft, organic, short | Rank 3。 |
| external-10 Wood Light | organic, short | 266 ms。外れ方は短いが木材感を確認。 |

**Candidates to deprioritize:** external-05（too wooden / too long）、external-06（too metallic / too long）、external-07（too metallic / too long）。

**Human listening order:** external-01 → external-04 → external-09 → external-03 → external-10 → external-02 → external-08 → external-07 → external-06 → external-05。

## `enemy.projectile.fire`

**Gameplay role:** 敵の魔法弾発射。プレイヤー発射音と区別でき、危険感があり、高頻度でも重ならないこと。

### Top 3

| Rank | Variant | Direction | Technical summary | Short reason |
|---:|---|---|---|---|
| 1 | `enemy.projectile.fire-external-01` — OpenGameArt Swish Fast | strong, short | 104 ms, peak -0.1 dBFS | 発射の瞬間を最も明確に伝えやすい。魔法弾ではなく単なる振り音に聞こえないか確認する。 |
| 2 | `enemy.projectile.fire-external-09` — Kenney Leather Whoosh 1 | organic, dark, short | 277 ms, peak -3.3 dBFS | 皮革由来の暗めで有機的な方向を期待でき、Player音との差別化候補。 |
| 3 | `enemy.projectile.fire-external-06` — Kenney Cloth Whoosh 1 | organic, strong, long | 661 ms, peak -3.5 dBFS | より厚い敵発射案。末尾約73 msの静音を含み、連射時の長さを重点確認する。 |

### All candidates

| Variant | Direction | Assessment |
|---|---|---|
| external-01 Swish Fast | strong, short | Rank 1。 |
| external-02 Swish Short | short, bright | 76 ms。明確だが敵らしい重さが不足する可能性。 |
| external-03 Swish Light | short, soft | 71 ms。短すぎて認識しにくい可能性。 |
| external-04 Draw Whoosh 2 | soft, unsuitable | peak -22.9 dBFS。極端に小さく、武器を抜く意味へ寄る。 |
| external-05 Draw Whoosh 3 | soft, long | 477 ms。先頭約48 msと長い末尾静音がある。 |
| external-06 Cloth Whoosh 1 | organic, strong, long | Rank 3。 |
| external-07 Cloth Whoosh 2 | organic, soft | 415 ms、peak -7.9 dBFS。 |
| external-08 Cloth Whoosh 3 | organic, soft | 477 ms、peak -10.1 dBFS。 |
| external-09 Leather Whoosh 1 | organic, dark, short | Rank 2。 |
| external-10 Leather Whoosh 2 | organic, dark, long | 477 ms。途中と末尾の静音を含む。 |

**Candidates to deprioritize:** external-04（too weak / wrong gameplay meaning）、external-05（excessive silence）、external-03（too short / too weak）。

**Human listening order:** external-01 → external-09 → external-06 → external-02 → external-10 → external-07 → external-08 → external-05 → external-03 → external-04。Player FireとのA/B比較を優先する。

## `enemy.projectile.hit`

**Gameplay role:** 敵弾の接触を短く伝えつつ、共有中のPlayer Hurtより前に出すぎず、銃弾・肉体損傷を避ける。

### Top 3

| Rank | Variant | Direction | Technical summary | Short reason |
|---:|---|---|---|---|
| 1 | `enemy.projectile.hit-external-01` — Kenney Soft Magic Contact | soft, balanced, short | 135 ms, peak -1.0 dBFS, mean -14.1 dBFS | 非金属で短く、Player Hurtと重ねても過密になりにくい第一候補。 |
| 2 | `enemy.projectile.hit-external-03` — Kenney Crystal Contact | crystal, bright, short | 210 ms, peak -1.1 dBFS | 魔法弾らしい別方向。末尾約52 msの静音を含む。 |
| 3 | `enemy.projectile.hit-external-10` — Kenney Bell Impact | arcane, bright | 301 ms, peak -1.1 dBFS | 接触を魔法的に区別する案。鐘らしさや通知音化を試聴で確認する。 |

### All candidates

| Variant | Direction | Assessment |
|---|---|---|
| external-01 Soft Magic Contact | soft, balanced, short | Rank 1。 |
| external-02 Generic Magic Contact | balanced, short | 140 ms。基準候補だが個性は弱い可能性。 |
| external-03 Crystal Contact | crystal, bright, short | Rank 2。 |
| external-04 Metallic Magic Contact | metallic, short | 213 ms。弾丸の金属着弾に聞こえないか確認。 |
| external-05 Rounded Impact | strong | 543 ms。Player Hurtと重なるには長く強い可能性。 |
| external-06 Organic Impact | organic | 333 ms。木材音へ寄る可能性。 |
| external-07 Bright Impact | bright, metallic, short | 174 ms。薄い金属音の懸念。 |
| external-08 Plate Impact | metallic, long | 534 ms。役割に対して長く金属的。 |
| external-09 Dark Stone Impact | dark, heavy, long | 830 ms、末尾約225 msが静か。高頻度命中には長い。 |
| external-10 Bell Impact | arcane, bright | Rank 3。 |

**Candidates to deprioritize:** external-09（too long / excessive silence）、external-08（too metallic / too long）、external-06（too wooden）。

**Human listening order:** external-01 → external-03 → external-10 → external-02 → external-07 → external-04 → external-05 → external-06 → external-08 → external-09。共有中のPlayer Hurtと連続して鳴らし、二重に聞こえないか確認する。

## `player.heal`

**Gameplay role:** 安心・回復・上昇を示し、UI決定音やLevel Upと区別する。

### Top 3

| Rank | Variant | Direction | Technical summary | Short reason |
|---:|---|---|---|---|
| 1 | `player.heal-external-02` — Kenney Rising Heal | bright, arcane, balanced | 526 ms, peak -0.9 dBFS | 上昇方向を示す原分類で、回復の意味を確認する第一候補。 |
| 2 | `player.heal-external-04` — Kenney Glass Heal Chime | crystal, bright, long | 692 ms, peak -1.1 dBFS | 魔法的で安心感のある結晶案。長さが許容できるか確認する。 |
| 3 | `player.heal-external-05` — Kenney Healing Pluck | soft, arcane, short | 165 ms, peak -0.5 dBFS | 短く控えめな案としてTop 2と方向を分けられる。 |

### All candidates

| Variant | Direction | Assessment |
|---|---|---|
| external-01 Confirmation Chime | bright, strong | 290 ms。明確だがUI決定音へ寄る。 |
| external-02 Rising Heal | bright, arcane, balanced | Rank 1。 |
| external-03 Select Spark | short, unsuitable | 47 ms。短すぎ、UI選択音の意味が強い。 |
| external-04 Glass Heal Chime | crystal, bright, long | Rank 2。 |
| external-05 Healing Pluck | soft, arcane, short | Rank 3。 |
| external-06 Gentle Rise | bright, strong | 491 ms。平均音量が高く、Level Upと競合する可能性。 |
| external-07 Soft Open | soft, short | 148 ms。回復より開閉・UIへ寄る可能性。 |
| external-08 Soft Toggle | soft, short, unsuitable | 139 ms。UI切替の意味が強い。 |
| external-09 Soft Drop | soft, organic, short | 191 ms。上昇より下降感を連想させる可能性。 |
| external-10 Coin Shimmer | bright, soft | 338 ms、peak -10.7 dBFS。Pickup音との競合と小ささを確認。 |

**Candidates to deprioritize:** external-03（too short / too UI-like）、external-08（too UI-like）、external-10（too weak / wrong gameplay meaning）。

**Human listening order:** external-02 → external-04 → external-05 → external-06 → external-01 → external-07 → external-09 → external-10 → external-08 → external-03。共有中のLevel Up音と必ずA/B比較する。

## `boss.attack`

**Gameplay role:** 通常敵より強く、低頻度の予兆または発動として存在感があること。単純な素材衝突へ限定されないこと。

### Top 3

| Rank | Variant | Direction | Technical summary | Short reason |
|---:|---|---|---|---|
| 1 | `boss.attack-external-05` — Kenney Heavy Stone Impact | heavy, strong, long | 992 ms, peak -1.0 dBFS | 最も長く重量があり、Boss用の存在感を確認する基準候補。末尾約355 msは静か。 |
| 2 | `boss.attack-external-01` — Kenney Heavy Punch | strong, balanced | 536 ms, peak -1.0 dBFS, mean -17.4 dBFS | 長すぎず十分強い、発動音として扱いやすい候補。 |
| 3 | `boss.attack-external-06` — Kenney Heavy Bell Impact | arcane, bright, heavy | 697 ms, peak -0.8 dBFS | 魔法的・予兆的な別方向。鐘そのものに聞こえすぎないか確認する。 |

### All candidates

| Variant | Direction | Assessment |
|---|---|---|
| external-01 Heavy Punch | strong, balanced | Rank 2。 |
| external-02 Heavy Metal Impact | metallic, short | 207 ms。Bossには短く、素材感が強い。 |
| external-03 Heavy Organic Impact | organic, strong | 313 ms。木材衝突へ寄る可能性。 |
| external-04 Heavy Plate Impact | metallic, heavy | 559 ms。存在感はあるが金属板らしさを確認。 |
| external-05 Heavy Stone Impact | heavy, strong, long | Rank 1。 |
| external-06 Heavy Bell Impact | arcane, bright, heavy | Rank 3。 |
| external-07 RPG Heavy Chop | strong, short | 240 ms、peak 0.0 dBFS。斧・物理攻撃に限定されやすい。 |
| external-08 RPG Resonant Metal | metallic, strong, long | 907 ms、peak 0.0 dBFS。金属容器の意味と歪みを確認。 |
| external-09 Low Bong Impact | dark, short, unsuitable | 123 ms。Boss用には短く、UI警告音へ寄る可能性。 |
| external-10 Dark Pulse Impact | dark, short | 139 ms。暗さはあるが攻撃の重量が不足する可能性。 |

**Candidates to deprioritize:** external-08（too metallic / clipping risk）、external-07（wrong gameplay meaning / clipping risk）、external-09（too short / too UI-like）。

**Human listening order:** external-05 → external-01 → external-06 → external-04 → external-10 → external-03 → external-02 → external-08 → external-07 → external-09。

## `enemy.summon`

**Gameplay role:** 出現・開放・湧き出る動きを示し、攻撃音と区別できる魔法的または不穏な音。

### Top 3

| Rank | Variant | Direction | Technical summary | Short reason |
|---:|---|---|---|---|
| 1 | `enemy.summon-external-01` — Kenney Arcane Open | arcane, balanced | 314 ms, peak -1.0 dBFS | 開放という意味と適度な長さが、召喚開始の第一候補になる。 |
| 2 | `enemy.summon-external-02` — Kenney Rising Summon | arcane, bright, short | 225 ms, peak -0.9 dBFS | 出現の上昇感を期待でき、短くテンポを阻害しにくい。 |
| 3 | `enemy.summon-external-03` — Kenney Mystery Tone | dark, arcane, strong | 332 ms, peak -0.9 dBFS, mean -10.0 dBFS | 不穏で明確な別方向。UI質問音に聞こえないか試聴する。 |

### All candidates

| Variant | Direction | Assessment |
|---|---|---|
| external-01 Arcane Open | arcane, balanced | Rank 1。 |
| external-02 Rising Summon | arcane, bright, short | Rank 2。 |
| external-03 Mystery Tone | dark, arcane, strong | Rank 3。 |
| external-04 Arcane Pluck | bright, short | 102 ms、peak -0.0 dBFS。召喚には短く、クリック的な可能性。 |
| external-05 Glass Summon | crystal, short | 111 ms。末尾静音が長く、有効音が短い。 |
| external-06 Dark Error Pulse | dark, unsuitable | 500 msだが約208 ms以降が静音。UIエラー音へ寄る。 |
| external-07 Spellbook Open | organic, soft, short | 154 ms、peak -11.5 dBFS。本を開く音そのものへ寄り、小さい。 |
| external-08 Dark Creak | dark, organic | 338 ms。魔法より扉・木材の軋みに聞こえる可能性。 |
| external-09 Spellbook Flip | organic, soft | 231 ms、平均 -32.1 dBFS。本の音へ限定される。 |
| external-10 Summoning Robe | organic, long | 753 ms。布音そのものへ寄り、末尾約206 msが静か。 |

**Candidates to deprioritize:** external-06（too UI-like / excessive silence）、external-07（too weak / wrong gameplay meaning）、external-10（wrong gameplay meaning / excessive silence）。

**Human listening order:** external-01 → external-02 → external-03 → external-08 → external-05 → external-04 → external-09 → external-10 → external-07 → external-06。

## Cross-entry listening notes

- Blast、Ricochet、Projectile Hit、Boss Attackは同じImpact Sounds由来が多い。各Entry内だけでなく、Top 3同士を連続再生して役割が混ざらないか確認する。
- PierceとEnemy Projectile FireのOpenGameArt Swishは別ファイルでSHA-256も異なるが、同一パックのため音色が近い可能性がある。
- HealとSummonはInterface Sounds由来が多い。UI決定・エラー・開閉に聞こえる候補は、ファンタジー用途として成立するかを厳しく判定する。
- 0.0 dBFSのBoss external-07/08、-0.0 dBFSのSummon external-04は、実再生で歪みや耳当たりを確認する。

## Recommended Cursor follow-up

人間試聴を効率化するため、Catalog表示だけに暫定ランキングを反映する小さな変更を行う。

1. 本レポートのTop 3を各Entryの先頭へ表示する。
2. Top 3へ`Recommended`バッジとRank 1〜3を表示する。
3. Runtimeパス、Runtime採用状態、音量、再生処理は変更しない。
4. 人間が実機でA/B試聴した後にのみPreferredを決定する。
