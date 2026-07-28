/**
 * Orbiting Orb / Ricochet 複合スキルのレベル式・配置・再ヒット・予告。
 */
import { describe, expect, it } from 'vitest'
import {
  ORBITING_ORB_HIT_COOLDOWN_MS,
  calculateBlastLevelFromPowerAndRange,
  calculateOrbitingOrbDamage,
  calculateOrbitingOrbLevelFromMoveAndPickup,
  calculateOrbitingOrbPositions,
  calculatePierceLevelFromMoveAndSpeed,
  calculateRicochetLevelFromXpBonusPickupAndSpeed,
  canOrbitingOrbHitEnemy,
  getOrbitingOrbStatsForLevel,
  pruneOrbitingOrbHitHistory,
} from './combat'
import {
  getComboBonusPreviewsForChoice,
  type LevelUpComboPreviewStats,
} from '../systems/comboSkillPreview'

const basePreviewStats: LevelUpComboPreviewStats = {
  attackDamage: 1,
  fireRateLevel: 1,
  rangeLevel: 1,
  moveLevel: 1,
  magnetLevel: 1,
  pierceLevel: 0,
  blastLevel: 0,
  orbitingOrbLevel: 0,
  ricochetLevel: 0,
  xpBonusLevel: 0,
}

describe('Orbiting Orb レベル式', () => {
  it('Move Lv1 + Pickup Lv1 では Lv0', () => {
    expect(calculateOrbitingOrbLevelFromMoveAndPickup(1, 1)).toBe(0)
  })

  it('Move Lv2 + Pickup Lv2 で Lv1', () => {
    expect(calculateOrbitingOrbLevelFromMoveAndPickup(2, 2)).toBe(1)
  })

  it('Move Lv3 + Pickup Lv2 で Lv1', () => {
    expect(calculateOrbitingOrbLevelFromMoveAndPickup(3, 2)).toBe(1)
  })

  it('Move Lv5 + Pickup Lv5 で Lv4', () => {
    expect(calculateOrbitingOrbLevelFromMoveAndPickup(5, 5)).toBe(4)
  })
})

describe('Orbiting Orb レベル別設定', () => {
  it('Orb数がレベル設定どおり', () => {
    expect(getOrbitingOrbStatsForLevel(1).orbCount).toBe(2)
    expect(getOrbitingOrbStatsForLevel(2).orbCount).toBe(3)
    expect(getOrbitingOrbStatsForLevel(3).orbCount).toBe(4)
    expect(getOrbitingOrbStatsForLevel(4).orbCount).toBe(4)
  })

  it('レベルが上がるほど角速度が段階的に速くなる', () => {
    expect(getOrbitingOrbStatsForLevel(1).angularSpeed).toBe(1.8)
    expect(getOrbitingOrbStatsForLevel(2).angularSpeed).toBe(2.15)
    expect(getOrbitingOrbStatsForLevel(3).angularSpeed).toBe(2.55)
    expect(getOrbitingOrbStatsForLevel(4).angularSpeed).toBe(3.0)
    // Lv4 超は Lv4 と同じ
    expect(getOrbitingOrbStatsForLevel(5).angularSpeed).toBe(3.0)
  })

  it('半径とダメージ倍率は既存値を維持する', () => {
    expect(getOrbitingOrbStatsForLevel(1).radius).toBe(70)
    expect(getOrbitingOrbStatsForLevel(1).damageMultiplier).toBe(0.5)
    expect(getOrbitingOrbStatsForLevel(2).radius).toBe(80)
    expect(getOrbitingOrbStatsForLevel(2).damageMultiplier).toBe(0.6)
    expect(getOrbitingOrbStatsForLevel(3).radius).toBe(85)
    expect(getOrbitingOrbStatsForLevel(3).damageMultiplier).toBe(0.6)
    expect(getOrbitingOrbStatsForLevel(4).radius).toBe(90)
    expect(getOrbitingOrbStatsForLevel(4).damageMultiplier).toBe(0.7)
  })

  it('Orbがプレイヤーの周囲へ均等配置される', () => {
    const positions = calculateOrbitingOrbPositions(100, 200, 4, 90, 0)
    expect(positions).toHaveLength(4)
    // 0°, 90°, 180°, 270°
    expect(positions[0].x).toBeCloseTo(190)
    expect(positions[0].y).toBeCloseTo(200)
    expect(positions[1].x).toBeCloseTo(100)
    expect(positions[1].y).toBeCloseTo(290)
    expect(positions[2].x).toBeCloseTo(10)
    expect(positions[2].y).toBeCloseTo(200)
    expect(positions[3].x).toBeCloseTo(100)
    expect(positions[3].y).toBeCloseTo(110)
  })

  it('ダメージは倍率を切り上げし最低1', () => {
    expect(calculateOrbitingOrbDamage(1, 0.5)).toBe(1)
    expect(calculateOrbitingOrbDamage(3, 0.5)).toBe(2)
    expect(calculateOrbitingOrbDamage(5, 0.7)).toBe(4)
  })
})

describe('Orbiting Orb 再ヒット間隔', () => {
  it('同じ敵へ500ms以内に重複ダメージを与えない', () => {
    expect(canOrbitingOrbHitEnemy(1000, 1000 + ORBITING_ORB_HIT_COOLDOWN_MS - 1)).toBe(
      false,
    )
  })

  it('500ms経過後は再度ダメージを与えられる', () => {
    expect(canOrbitingOrbHitEnemy(1000, 1000 + ORBITING_ORB_HIT_COOLDOWN_MS)).toBe(true)
  })

  it('破棄済み敵のUIDを履歴から落とせる', () => {
    const history = new Map<number, number>([
      [1, 100],
      [2, 200],
    ])
    pruneOrbitingOrbHitHistory(history, new Set([2]))
    expect(history.has(1)).toBe(false)
    expect(history.has(2)).toBe(true)
  })
})

describe('Ricochet 新条件', () => {
  it('XP Bonus Lv0 では成立しない', () => {
    expect(calculateRicochetLevelFromXpBonusPickupAndSpeed(0, 5, 5)).toBe(0)
  })

  it('Pickup Lv2 + Speed Lv2 + XP Bonus Lv1 で Lv1', () => {
    expect(calculateRicochetLevelFromXpBonusPickupAndSpeed(1, 2, 2)).toBe(1)
  })

  it('PowerレベルはRicochetレベルへ影響しない', () => {
    const withLowPowerIgnored = calculateRicochetLevelFromXpBonusPickupAndSpeed(2, 3, 3)
    expect(withLowPowerIgnored).toBe(2)
  })

  it('PickupまたはSpeedがLv1なら成立しない', () => {
    expect(calculateRicochetLevelFromXpBonusPickupAndSpeed(2, 1, 3)).toBe(0)
    expect(calculateRicochetLevelFromXpBonusPickupAndSpeed(2, 3, 1)).toBe(0)
  })

  it('XP Bonusを取得した結果、条件成立時にRicochet予告が出る', () => {
    const stats: LevelUpComboPreviewStats = {
      ...basePreviewStats,
      magnetLevel: 2,
      fireRateLevel: 2,
      xpBonusLevel: 0,
    }
    const previews = getComboBonusPreviewsForChoice('xpBonus', stats)
    expect(previews.some((preview) => preview.skillName === 'Ricochet')).toBe(true)
  })

  it('Powerを取得してもRicochet予告が出ない', () => {
    const stats: LevelUpComboPreviewStats = {
      ...basePreviewStats,
      attackDamage: 1,
      magnetLevel: 2,
      fireRateLevel: 2,
      xpBonusLevel: 1,
      ricochetLevel: 0,
    }
    const previews = getComboBonusPreviewsForChoice('damage', stats)
    expect(previews.some((preview) => preview.skillName === 'Ricochet')).toBe(false)
  })
})

describe('既存複合スキル条件の維持', () => {
  it('Blast条件が変わっていない', () => {
    expect(calculateBlastLevelFromPowerAndRange(1, 2)).toBe(0)
    expect(calculateBlastLevelFromPowerAndRange(2, 2)).toBe(1)
    expect(calculateBlastLevelFromPowerAndRange(3, 4)).toBe(2)
  })

  it('Pierce条件が変わっていない', () => {
    expect(calculatePierceLevelFromMoveAndSpeed(1, 2)).toBe(0)
    expect(calculatePierceLevelFromMoveAndSpeed(2, 2)).toBe(1)
    expect(calculatePierceLevelFromMoveAndSpeed(4, 3)).toBe(2)
  })

  it('MoveまたはPickup取得でOrbiting Orb予告が出る', () => {
    const movePreview = getComboBonusPreviewsForChoice('move', {
      ...basePreviewStats,
      moveLevel: 1,
      magnetLevel: 2,
    })
    expect(movePreview.some((preview) => preview.skillName === 'Orbiting Orb')).toBe(
      true,
    )

    const magnetPreview = getComboBonusPreviewsForChoice('magnet', {
      ...basePreviewStats,
      moveLevel: 2,
      magnetLevel: 1,
    })
    expect(magnetPreview.some((preview) => preview.skillName === 'Orbiting Orb')).toBe(
      true,
    )
  })
})
