// ============================================================
// UnlockSaveSystem.ts
// ------------------------------------------------------------
// 実績・エリアクリア・生涯統計の永続セーブ（localStorage）。
// 途中ランの再開はしない（タイトルに戻ったら Stage 1 から）。
// ============================================================

import {
  UNLOCK_SAVE_STORAGE_KEY,
  SHOP_BASE_PRICE,
  SHOP_PRICE_INCREASE,
  MAX_HP_SHOP_PRICES,
  SKILL_CAP_SHOP_PRICES,
  SEAL_SLOT_BASE_PRICE,
  SEAL_SLOT_PRICE_INCREASE,
  PLAYER_HP,
  INITIAL_PRIMARY_SKILL_LEVEL_CAP,
  INITIAL_PIERCE_BLAST_SKILL_LEVEL_CAP,
  INITIAL_XP_BONUS_SKILL_LEVEL_CAP,
  ACHIEVEMENT_ID_PLAINS_CLEAR,
  ACHIEVEMENT_ID_UNTOUCHED,
  ACHIEVEMENT_ID_PURE_POWER,
  ACHIEVEMENT_ID_FOREST_UNTOUCHED,
  getAreaById,
  type StageAreaDef,
} from '../GameConstants'

const SAVE_DATA_VERSION = 7

export type ShopUpgradeId =
  | 'maxHp'
  | 'powerCap'
  | 'speedCap'
  | 'rangeCap'
  | 'pierceCap'
  | 'blastCap'
  | 'xpBonusCap'
  | 'sealSlots'

export type ShopUpgrades = {
  maxHp: number
  powerCap: number
  speedCap: number
  rangeCap: number
  pierceCap: number
  blastCap: number
  xpBonusCap: number
  sealSlots: number
}

export type LifetimeStats = {
  runStarts: number
  deaths: number
  enemiesDefeated: number
  stagesCleared: number
  gameClears: number
}

export type GameSaveData = {
  version: number
  unlockedAchievementIds: string[]
  clearedAreaIds: string[]
  gold: number
  // 初めてゴールドを得ると true。それまでタイトルの Shop はロック
  shopUnlocked: boolean
  // Shop 解放後の初回タイトル案内吹き出しを見たかどうか
  shopUnlockTipSeen: boolean
  shopUpgrades: ShopUpgrades
  sealedSkillIds: string[]
  /** 常に null。旧データ互換のためフィールドだけ残す */
  run: null
  lifetimeStats: LifetimeStats
}

// 旧形式（version / run なし）との互換用
export type UnlockSaveData = {
  unlockedAchievementIds: string[]
  clearedAreaIds: string[]
}

function createEmptyLifetimeStats(): LifetimeStats {
  return {
    runStarts: 0,
    deaths: 0,
    enemiesDefeated: 0,
    stagesCleared: 0,
    gameClears: 0,
  }
}

function createEmptyShopUpgrades(): ShopUpgrades {
  return {
    maxHp: 0,
    powerCap: 0,
    speedCap: 0,
    rangeCap: 0,
    pierceCap: 0,
    blastCap: 0,
    xpBonusCap: 0,
    sealSlots: 0,
  }
}

function createEmptyGameSaveData(): GameSaveData {
  return {
    version: SAVE_DATA_VERSION,
    unlockedAchievementIds: [],
    clearedAreaIds: [],
    gold: 0,
    shopUnlocked: false,
    shopUnlockTipSeen: false,
    shopUpgrades: createEmptyShopUpgrades(),
    sealedSkillIds: [],
    run: null,
    lifetimeStats: createEmptyLifetimeStats(),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readStringArray(value: unknown): string[] {
  const result: string[] = []
  if (!Array.isArray(value)) {
    return result
  }
  for (let index = 0; index < value.length; index++) {
    const item = value[index]
    if (typeof item === 'string') {
      result.push(item)
    }
  }
  return result
}

function readNumber(value: unknown, defaultValue: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  return defaultValue
}

function parseLifetimeStats(value: unknown): LifetimeStats {
  if (!isRecord(value)) {
    return createEmptyLifetimeStats()
  }
  return {
    runStarts: readNumber(value.runStarts, 0),
    deaths: readNumber(value.deaths, 0),
    enemiesDefeated: readNumber(value.enemiesDefeated, 0),
    stagesCleared: readNumber(value.stagesCleared, 0),
    gameClears: readNumber(value.gameClears, 0),
  }
}

function parseShopUpgrades(value: unknown): ShopUpgrades {
  if (!isRecord(value)) {
    return createEmptyShopUpgrades()
  }
  return {
    maxHp: Math.max(0, Math.floor(readNumber(value.maxHp, 0))),
    powerCap: Math.max(0, Math.floor(readNumber(value.powerCap, 0))),
    speedCap: Math.max(0, Math.floor(readNumber(value.speedCap, 0))),
    rangeCap: Math.max(0, Math.floor(readNumber(value.rangeCap, 0))),
    pierceCap: Math.max(0, Math.floor(readNumber(value.pierceCap, 0))),
    blastCap: Math.max(0, Math.floor(readNumber(value.blastCap, 0))),
    xpBonusCap: Math.max(0, Math.floor(readNumber(value.xpBonusCap, 0))),
    sealSlots: Math.max(0, Math.floor(readNumber(value.sealSlots, 0))),
  }
}

function parseGameSaveData(parsed: unknown): GameSaveData {
  if (!isRecord(parsed)) {
    return createEmptyGameSaveData()
  }

  const unlockedAchievementIds = readStringArray(parsed.unlockedAchievementIds)
  const clearedAreaIds = readStringArray(parsed.clearedAreaIds)
  // --- 旧セーブ移行（過去の ID / 条件から、今の実績 ID へ）---
  // 注意: 「今も進行中の解放条件」をここで先回り付与すると、
  // unlockAchievement が既解放扱いになり結果画面の UNLOCKED が出ない。
  // 付与してよいのは「もう使われない旧 ID」のリネームだけ。

  // 以前の版ですでに Plains をクリア済みなら Pierce / XP Bonus 実績を付ける
  if (
    clearedAreaIds.includes('plains') &&
    !unlockedAchievementIds.includes(ACHIEVEMENT_ID_PLAINS_CLEAR)
  ) {
    unlockedAchievementIds.push(ACHIEVEMENT_ID_PLAINS_CLEAR)
  }
  // 旧 ID untouched → plains_clear（Pierce）
  if (
    unlockedAchievementIds.includes(ACHIEVEMENT_ID_UNTOUCHED) &&
    !unlockedAchievementIds.includes(ACHIEVEMENT_ID_PLAINS_CLEAR)
  ) {
    unlockedAchievementIds.push(ACHIEVEMENT_ID_PLAINS_CLEAR)
  }
  // 旧 ID pure_power → forest_untouched（Blast）
  if (
    unlockedAchievementIds.includes(ACHIEVEMENT_ID_PURE_POWER) &&
    !unlockedAchievementIds.includes(ACHIEVEMENT_ID_FOREST_UNTOUCHED)
  ) {
    unlockedAchievementIds.push(ACHIEVEMENT_ID_FOREST_UNTOUCHED)
  }
  // ※ かつて Forest クリアで跳弾を渡していた移行（forest_clear → volcano_untouched）は削除。
  //   現行は Volcano ノーダメージが条件なのに、Forest クリアだけで Ricochet が
  //   解放済み扱いになり、UNLOCKED 表示も出なくなっていた。

  const gold = Math.max(0, Math.floor(readNumber(parsed.gold, 0)))
  const shopUpgrades = parseShopUpgrades(parsed.shopUpgrades)
  let shopUnlocked = parsed.shopUnlocked === true
  // 旧セーブ（フラグなし）で、すでに遊んだ形跡があればショップを開いたままにする
  if (!shopUnlocked) {
    if (
      gold > 0 ||
      clearedAreaIds.length > 0 ||
      hasAnyShopUpgradePurchase(shopUpgrades)
    ) {
      shopUnlocked = true
    }
  }

  let shopUnlockTipSeen = parsed.shopUnlockTipSeen === true
  // 旧セーブでショップがすでに使える状態だった場合は案内を出さない
  if (!shopUnlockTipSeen && shopUnlocked && parsed.shopUnlocked !== true) {
    shopUnlockTipSeen = true
  }

  return {
    // 旧セーブを読み込んだ時点で現在形式へ移行する
    version: SAVE_DATA_VERSION,
    unlockedAchievementIds,
    clearedAreaIds,
    gold,
    shopUnlocked,
    shopUnlockTipSeen,
    shopUpgrades,
    // 実装から外した旧 Bomb が封印枠を消費し続けないよう除外する
    sealedSkillIds: readStringArray(parsed.sealedSkillIds).filter(
      (skillId) => skillId !== 'groundBomb',
    ),
    // 途中再開はやめたので、旧 run があっても捨てる
    run: null,
    lifetimeStats: parseLifetimeStats(parsed.lifetimeStats),
  }
}

/** ショップで何か1回でも買ったことがあるか。 */
function hasAnyShopUpgradePurchase(upgrades: ShopUpgrades): boolean {
  return (
    upgrades.maxHp > 0 ||
    upgrades.powerCap > 0 ||
    upgrades.speedCap > 0 ||
    upgrades.rangeCap > 0 ||
    upgrades.pierceCap > 0 ||
    upgrades.blastCap > 0 ||
    upgrades.xpBonusCap > 0 ||
    upgrades.sealSlots > 0
  )
}

export function loadGameSaveData(): GameSaveData {
  try {
    const rawText = localStorage.getItem(UNLOCK_SAVE_STORAGE_KEY)
    if (rawText === null) {
      return createEmptyGameSaveData()
    }
    return parseGameSaveData(JSON.parse(rawText))
  } catch (_error) {
    return createEmptyGameSaveData()
  }
}

function saveGameSaveData(data: GameSaveData): void {
  try {
    // 途中ランは保存しない
    data.run = null
    localStorage.setItem(UNLOCK_SAVE_STORAGE_KEY, JSON.stringify(data))
  } catch (_error) {
    // プライベートモード等で書けなくてもゲームは続行する
  }
}

export function loadUnlockSaveData(): UnlockSaveData {
  const data = loadGameSaveData()
  return {
    unlockedAchievementIds: data.unlockedAchievementIds,
    clearedAreaIds: data.clearedAreaIds,
  }
}

/** 旧セーブに残った途中ランを消す（タイトル表示時など） */
export function clearRunProgress(): void {
  try {
    const rawText = localStorage.getItem(UNLOCK_SAVE_STORAGE_KEY)
    if (rawText === null) {
      return
    }
    const parsed = JSON.parse(rawText) as unknown
    if (!isRecord(parsed)) {
      return
    }
    if (parsed.run === null || parsed.run === undefined) {
      return
    }
    parsed.run = null
    localStorage.setItem(UNLOCK_SAVE_STORAGE_KEY, JSON.stringify(parsed))
  } catch (_error) {
    // 書けなくてもゲームは続行
  }
}

export function hasUnlockedAchievement(achievementId: string): boolean {
  const data = loadGameSaveData()
  for (let index = 0; index < data.unlockedAchievementIds.length; index++) {
    if (data.unlockedAchievementIds[index] === achievementId) {
      return true
    }
  }
  return false
}

export function unlockAchievement(achievementId: string): boolean {
  // ディスク上に「実際に保存済み」かだけを見る。
  // parse 時の旧セーブ移行でメモリに足されただけの ID は「今回の新規解放」として扱う。
  if (hasAchievementIdOnDisk(achievementId)) {
    return false
  }

  const data = loadGameSaveData()
  let alreadyInMemory = false
  for (let index = 0; index < data.unlockedAchievementIds.length; index++) {
    if (data.unlockedAchievementIds[index] === achievementId) {
      alreadyInMemory = true
      break
    }
  }
  if (!alreadyInMemory) {
    data.unlockedAchievementIds.push(achievementId)
  }
  saveGameSaveData(data)
  return true
}

/** localStorage に書かれた実績 ID を、移行処理なしで読む。 */
function hasAchievementIdOnDisk(achievementId: string): boolean {
  try {
    const rawText = localStorage.getItem(UNLOCK_SAVE_STORAGE_KEY)
    if (rawText === null) {
      return false
    }
    const parsed = JSON.parse(rawText) as unknown
    if (!isRecord(parsed)) {
      return false
    }
    const rawIds = readStringArray(parsed.unlockedAchievementIds)
    for (let index = 0; index < rawIds.length; index++) {
      if (rawIds[index] === achievementId) {
        return true
      }
    }
    return false
  } catch (_error) {
    return false
  }
}

export function hasClearedArea(areaId: string): boolean {
  const data = loadGameSaveData()
  for (let index = 0; index < data.clearedAreaIds.length; index++) {
    if (data.clearedAreaIds[index] === areaId) {
      return true
    }
  }
  return false
}

// エリアをゲームクリアしたことを保存する（新規なら true）
export function markAreaCleared(areaId: string): boolean {
  const data = loadGameSaveData()
  for (let index = 0; index < data.clearedAreaIds.length; index++) {
    if (data.clearedAreaIds[index] === areaId) {
      return false
    }
  }

  data.clearedAreaIds.push(areaId)
  saveGameSaveData(data)
  return true
}

// タイトルでそのエリアを開始できるか
export function isAreaPlayable(area: StageAreaDef): boolean {
  if (area.comingSoon) {
    return false
  }
  if (area.unlockRequiresClearedAreaId === null) {
    return true
  }
  return hasClearedArea(area.unlockRequiresClearedAreaId)
}

// タイトルで本名を表示してよいか。「?」の段階では false（選択も不可）
export function isAreaRevealed(area: StageAreaDef): boolean {
  if (area.hiddenUntilAreaPlayableId === null) {
    return true
  }

  const revealArea = getAreaById(area.hiddenUntilAreaPlayableId)
  if (revealArea === null) {
    return false
  }
  // 直前エリアが「開放済み（プレイ可能）」になったら名前を出す（未クリアならグレー）
  return isAreaPlayable(revealArea)
}

/** タイトルでキーボード／クリック選択できるか（? のエリアは不可） */
export function isAreaSelectableOnTitle(area: StageAreaDef): boolean {
  return isAreaRevealed(area)
}

export function clearAllUnlockAchievements(): void {
  saveGameSaveData(createEmptyGameSaveData())
}

export function clearAllSaveData(): void {
  saveGameSaveData(createEmptyGameSaveData())
}

/** 現在の永続ゴールド所持数を返す。 */
export function getGold(): number {
  return loadGameSaveData().gold
}

/**
 * ショップが解放済みか。
 * 初めてゴールドを得たあと（または旧セーブの移行後）に true。
 */
export function isShopUnlocked(): boolean {
  return loadGameSaveData().shopUnlocked
}

/** Shop 解放直後のタイトル吹き出し案内を、まだ見ていないか。 */
export function shouldShowShopUnlockTip(): boolean {
  const data = loadGameSaveData()
  return data.shopUnlocked && !data.shopUnlockTipSeen
}

/** Shop 解放案内の吹き出しを「見た」と記録する。 */
export function markShopUnlockTipSeen(): void {
  const data = loadGameSaveData()
  if (data.shopUnlockTipSeen) {
    return
  }
  data.shopUnlockTipSeen = true
  saveGameSaveData(data)
}

/**
 * ステージクリア報酬を即時保存し、加算後の所持数を返す。
 * ゴールドは死亡・タイトル遷移では減らさない。
 * 初めてゴールドを得たとき、Shop を解放する。
 */
export type AddGoldResult = {
  gold: number
  // 今回の加算で Shop が初めて開いたか
  shopJustUnlocked: boolean
}

export function addGold(amount: number): AddGoldResult {
  const safeAmount = Math.max(0, Math.floor(amount))
  const data = loadGameSaveData()
  let shopJustUnlocked = false
  data.gold = data.gold + safeAmount
  if (safeAmount > 0 && !data.shopUnlocked) {
    data.shopUnlocked = true
    shopJustUnlocked = true
  }
  saveGameSaveData(data)
  return {
    gold: data.gold,
    shopJustUnlocked,
  }
}

export function getShopUpgrades(): ShopUpgrades {
  const upgrades = loadGameSaveData().shopUpgrades
  return {
    maxHp: upgrades.maxHp,
    powerCap: upgrades.powerCap,
    speedCap: upgrades.speedCap,
    rangeCap: upgrades.rangeCap,
    pierceCap: upgrades.pierceCap,
    blastCap: upgrades.blastCap,
    xpBonusCap: upgrades.xpBonusCap,
    sealSlots: upgrades.sealSlots,
  }
}

export function getShopUpgradePrice(upgradeId: ShopUpgradeId): number {
  const purchases = getShopUpgrades()[upgradeId]
  if (upgradeId === 'sealSlots') {
    return calculateSealSlotPrice(purchases)
  }
  if (upgradeId === 'maxHp') {
    return calculateMaxHpShopPrice(purchases)
  }
  if (usesSkillCapShopPricing(upgradeId)) {
    return calculateSkillCapShopPrice(purchases)
  }
  return SHOP_BASE_PRICE + purchases * SHOP_PRICE_INCREASE
}

function usesSkillCapShopPricing(upgradeId: ShopUpgradeId): boolean {
  return (
    upgradeId === 'powerCap' ||
    upgradeId === 'speedCap' ||
    upgradeId === 'rangeCap' ||
    upgradeId === 'xpBonusCap' ||
    upgradeId === 'pierceCap'
  )
}

/** Max HP は 1G → 10G → 20G → 30G → 40G。それ以降も 40G。 */
function calculateMaxHpShopPrice(purchases: number): number {
  if (purchases < MAX_HP_SHOP_PRICES.length) {
    return MAX_HP_SHOP_PRICES[purchases]
  }
  return MAX_HP_SHOP_PRICES[MAX_HP_SHOP_PRICES.length - 1]
}

/** Power / Speed / Range / XP Bonus / Pierce Cap の価格。それ以降も 40G。 */
function calculateSkillCapShopPrice(purchases: number): number {
  if (purchases < SKILL_CAP_SHOP_PRICES.length) {
    return SKILL_CAP_SHOP_PRICES[purchases]
  }
  return SKILL_CAP_SHOP_PRICES[SKILL_CAP_SHOP_PRICES.length - 1]
}

/** 封印枠は倍増ではなく、購入済み枠ごとに10Gずつ上げる。 */
function calculateSealSlotPrice(purchases: number): number {
  return SEAL_SLOT_BASE_PRICE + purchases * SEAL_SLOT_PRICE_INCREASE
}

export type ShopPurchaseResult = {
  purchased: boolean
  remainingGold: number
}

/** ゴールドが足りる場合だけ購入し、価格と効果の両方を永続保存する。 */
export function purchaseShopUpgrade(upgradeId: ShopUpgradeId): ShopPurchaseResult {
  const data = loadGameSaveData()
  let price = SHOP_BASE_PRICE + data.shopUpgrades[upgradeId] * SHOP_PRICE_INCREASE
  if (upgradeId === 'sealSlots') {
    price = calculateSealSlotPrice(data.shopUpgrades.sealSlots)
  } else if (upgradeId === 'maxHp') {
    price = calculateMaxHpShopPrice(data.shopUpgrades.maxHp)
  } else if (usesSkillCapShopPricing(upgradeId)) {
    price = calculateSkillCapShopPrice(data.shopUpgrades[upgradeId])
  }
  if (data.gold < price) {
    return {
      purchased: false,
      remainingGold: data.gold,
    }
  }

  data.gold = data.gold - price
  data.shopUpgrades[upgradeId] = data.shopUpgrades[upgradeId] + 1
  saveGameSaveData(data)
  return {
    purchased: true,
    remainingGold: data.gold,
  }
}

export function getPurchasedMaxHp(): number {
  return PLAYER_HP + getShopUpgrades().maxHp
}

export function getPurchasedPowerCap(): number {
  return INITIAL_PRIMARY_SKILL_LEVEL_CAP + getShopUpgrades().powerCap
}

export function getPurchasedSpeedCap(): number {
  return INITIAL_PRIMARY_SKILL_LEVEL_CAP + getShopUpgrades().speedCap
}

export function getPurchasedRangeCap(): number {
  return INITIAL_PRIMARY_SKILL_LEVEL_CAP + getShopUpgrades().rangeCap
}

export function getPurchasedPierceCap(): number {
  return INITIAL_PIERCE_BLAST_SKILL_LEVEL_CAP + getShopUpgrades().pierceCap
}

export function getPurchasedBlastCap(): number {
  return INITIAL_PIERCE_BLAST_SKILL_LEVEL_CAP + getShopUpgrades().blastCap
}

export function getPurchasedXpBonusCap(): number {
  return INITIAL_XP_BONUS_SKILL_LEVEL_CAP + getShopUpgrades().xpBonusCap
}

export function getPurchasedSealSlotCount(): number {
  return getShopUpgrades().sealSlots
}

/** レベルアップ候補から封印中のスキルID一覧を返す。 */
export function getSealedSkillIds(): string[] {
  return [...loadGameSaveData().sealedSkillIds]
}

/**
 * スキルの封印状態を保存する。
 * 新たに封印するときだけ購入済み封印枠を確認する。解除はいつでも可能。
 */
export function setSkillSealed(skillId: string, shouldSeal: boolean): boolean {
  const data = loadGameSaveData()
  const existingIndex = data.sealedSkillIds.indexOf(skillId)

  if (!shouldSeal) {
    if (existingIndex >= 0) {
      data.sealedSkillIds.splice(existingIndex, 1)
      saveGameSaveData(data)
    }
    return true
  }

  if (existingIndex >= 0) {
    return true
  }
  if (data.sealedSkillIds.length >= data.shopUpgrades.sealSlots) {
    return false
  }

  data.sealedSkillIds.push(skillId)
  saveGameSaveData(data)
  return true
}

// スキル解放だけ消す（エリアクリアは残す）。
export function clearSkillUnlockAchievements(): void {
  const data = loadGameSaveData()
  data.unlockedAchievementIds = []
  saveGameSaveData(data)
}

/** タイトル実績パネル用の生涯統計を返す */
export function getLifetimeStats(): LifetimeStats {
  const data = loadGameSaveData()
  return {
    runStarts: data.lifetimeStats.runStarts,
    deaths: data.lifetimeStats.deaths,
    enemiesDefeated: data.lifetimeStats.enemiesDefeated,
    stagesCleared: data.lifetimeStats.stagesCleared,
    gameClears: data.lifetimeStats.gameClears,
  }
}

function bumpLifetimeStat(statKey: keyof LifetimeStats, amount: number): void {
  const data = loadGameSaveData()
  data.lifetimeStats[statKey] = data.lifetimeStats[statKey] + amount
  saveGameSaveData(data)
}

/** Stage 1 から新規ラン開始したとき */
export function recordRunStart(): void {
  bumpLifetimeStat('runStarts', 1)
}

/** プレイヤーが倒れたとき */
export function recordPlayerDeath(): void {
  bumpLifetimeStat('deaths', 1)
}

/** 敵を1体撃破したとき */
export function recordEnemyDefeated(): void {
  bumpLifetimeStat('enemiesDefeated', 1)
}

/** ステージをクリアしたとき */
export function recordStageCleared(): void {
  bumpLifetimeStat('stagesCleared', 1)
}

/** エリア最終ステージをクリアしたとき */
export function recordGameClear(): void {
  bumpLifetimeStat('gameClears', 1)
}
