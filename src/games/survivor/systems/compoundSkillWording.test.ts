import { describe, expect, it } from 'vitest'
import {
  BLAST_UNLOCK_BANNER_TITLE,
  ORBITING_ORB_LEVEL_UP_BANNER_TITLE_PREFIX,
  ORBITING_ORB_UNLOCK_BANNER_TITLE,
  PIERCE_UNLOCK_BANNER_TITLE,
  RICOCHET_UNLOCK_BANNER_TITLE,
} from '../GameConstants'
import {
  ACHIEVEMENT_ID_ORBITING_ORB_UNLOCK,
  ACHIEVEMENT_TITLE_ORBITING_ORB,
  UNLOCK_SKILL_LABEL_ORBITING_ORB,
} from '../constants/progression'
import { ORBITING_ORB_TEXTURE_KEY } from '../constants/combat'

describe('複合スキル取得文言と Orbit 表示名', () => {
  it('複合スキル取得バナーは GET! を使う', () => {
    expect(PIERCE_UNLOCK_BANNER_TITLE).toBe('PIERCE GET!')
    expect(BLAST_UNLOCK_BANNER_TITLE).toBe('BLAST GET!')
    expect(RICOCHET_UNLOCK_BANNER_TITLE).toBe('RICOCHET GET!')
    expect(ORBITING_ORB_UNLOCK_BANNER_TITLE).toBe('ORBIT GET!')
    expect(PIERCE_UNLOCK_BANNER_TITLE.includes('OBTAINED')).toBe(false)
    expect(BLAST_UNLOCK_BANNER_TITLE.includes('OBTAINED')).toBe(false)
    expect(RICOCHET_UNLOCK_BANNER_TITLE.includes('OBTAINED')).toBe(false)
    expect(ORBITING_ORB_UNLOCK_BANNER_TITLE.includes('OBTAINED')).toBe(false)
  })

  it('プレイヤー向け表示名は Orbit（内部IDは維持）', () => {
    expect(UNLOCK_SKILL_LABEL_ORBITING_ORB).toBe('Orbit')
    expect(ACHIEVEMENT_TITLE_ORBITING_ORB).toBe('Orbit')
    expect(ORBITING_ORB_LEVEL_UP_BANNER_TITLE_PREFIX).toBe('ORBIT Lv.')
    expect(ACHIEVEMENT_ID_ORBITING_ORB_UNLOCK).toBe('orbiting_orb_unlock')
    expect(ORBITING_ORB_TEXTURE_KEY).toBe('orbitingOrb')
  })
})
