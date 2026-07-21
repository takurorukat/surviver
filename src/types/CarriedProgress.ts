// ステージ跨ぎで引き継ぐ成長データ（死亡リトライ時は渡さない）
export type CarriedProgress = {
  currentLevel: number
  totalXp: number
  currentAttackDamage: number
  currentFireRateLevel: number
  currentRangeLevel: number
  currentMoveLevel: number
  currentMagnetLevel: number
  currentMagnetRadius: number
  maxHp: number
  currentAttackIntervalMs: number
  currentAttackRange: number
  currentMoveSpeed: number
  currentPierceLevel: number
  currentBlastLevel: number
  currentRicochetLevel: number
  currentXpBonusLevel: number
  tookDamageThisRun: boolean
  pickedPowerThisRun: boolean
  pickedPierceThisRun: boolean
  pickedBlastThisRun: boolean
  pierceAvailableAtRunStart: boolean
  blastAvailableAtRunStart: boolean
}
