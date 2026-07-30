export type EnemyBulletSlotDecision = 'create' | 'release-inactive' | 'reject'

type EnemyBulletSlotState = {
  activeBulletCount: number
  maxActiveBullets: number
  groupIsFull: boolean
  hasInactiveBullet: boolean
}

/**
 * Group の maxSize は active / inactive の両方を数える。
 * active 上限には余裕があるのに inactive 弾が枠を塞ぐ場合だけ、その枠を解放する。
 */
export function decideEnemyBulletSlotAction(
  state: EnemyBulletSlotState,
): EnemyBulletSlotDecision {
  if (state.activeBulletCount >= state.maxActiveBullets) {
    return 'reject'
  }
  if (!state.groupIsFull) {
    return 'create'
  }
  if (state.hasInactiveBullet) {
    return 'release-inactive'
  }
  return 'reject'
}
