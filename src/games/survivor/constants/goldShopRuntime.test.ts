import { describe, expect, it } from 'vitest'
import {
  RUNTIME_ENABLE_GOLD_AND_SHOP,
  TITLE_SHOW_SHOP_AND_SEAL,
} from './ui'
import { hasNoNormalLevelUpChoices } from '../systems/LevelUpChoicePool'

describe('Gold / Shop Runtime Disable', () => {
  it('Version 1 では Gold／Shop Runtime を休止する', () => {
    expect(RUNTIME_ENABLE_GOLD_AND_SHOP).toBe(false)
  })

  it('タイトル Shop／Seal 導線も非表示フラグのまま', () => {
    expect(TITLE_SHOW_SHOP_AND_SEAL).toBe(false)
  })

  it('通常候補が無いときも hasNoNormalLevelUpChoices は true（自動解決の前提）', () => {
    // GameScene は true のとき applyAutoExhaustedLevelUp へ進み、空 UI を出さない
    expect(
      hasNoNormalLevelUpChoices(['damage', 'fireRate', 'range']),
    ).toBe(true)
  })
})
