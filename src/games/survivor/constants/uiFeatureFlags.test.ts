import { describe, expect, it } from 'vitest'
import { TITLE_SHOW_DEBUG_PROGRESS } from './ui'

describe('Survivor UI Feature Flags', () => {
  it('進行デバッグボタンを表示しない', () => {
    expect(TITLE_SHOW_DEBUG_PROGRESS).toBe(false)
  })
})
