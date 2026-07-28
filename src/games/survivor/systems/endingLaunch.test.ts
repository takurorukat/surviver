import { describe, expect, it } from 'vitest'
import { shouldStartEndingAfterAreaClear } from './endingLaunch'

describe('shouldStartEndingAfterAreaClear', () => {
  it('4エリア揃いで true', () => {
    expect(
      shouldStartEndingAfterAreaClear([
        'plains',
        'forest',
        'volcano',
        'ruins',
      ]),
    ).toBe(true)
  })

  it('不足なら false（Stage 間クリア相当）', () => {
    expect(shouldStartEndingAfterAreaClear(['plains'])).toBe(false)
  })
})
