import { describe, expect, it, vi } from 'vitest'
import {
  SUPPORT_DEVELOPER_LABEL,
  SURVIVOR_SUPPORT_LINK_ENABLED,
  isSupportDeveloperLinkEnabled,
} from '../constants/support'
import {
  listSettingsMenuButtonIds,
  listSettingsMenuButtonLabels,
} from './settingsMenuItems'
import {
  SUPPORT_DEVELOPER_URL,
  openExternalSupportLink,
  openSupportDeveloperLink,
  shouldIncludeSupportDeveloperButton,
} from './supportDeveloperLink'

describe('Support Developer Feature Flag', () => {
  it('未設定相当・false・未知値は無効、trueだけ有効', () => {
    expect(isSupportDeveloperLinkEnabled(undefined)).toBe(false)
    expect(isSupportDeveloperLinkEnabled('')).toBe(false)
    expect(isSupportDeveloperLinkEnabled('false')).toBe(false)
    expect(isSupportDeveloperLinkEnabled('TRUE')).toBe(false)
    expect(isSupportDeveloperLinkEnabled(' true')).toBe(false)
    expect(isSupportDeveloperLinkEnabled('true ')).toBe(false)
    expect(isSupportDeveloperLinkEnabled('1')).toBe(false)
    expect(isSupportDeveloperLinkEnabled('yes')).toBe(false)
    expect(isSupportDeveloperLinkEnabled(true)).toBe(false)
    expect(isSupportDeveloperLinkEnabled('true')).toBe(true)
  })

  it('通常の開発／テスト実行では Feature Flag は無効', () => {
    expect(SURVIVOR_SUPPORT_LINK_ENABLED).toBe(false)
    expect(shouldIncludeSupportDeveloperButton()).toBe(false)
    expect(shouldIncludeSupportDeveloperButton(false)).toBe(false)
    expect(shouldIncludeSupportDeveloperButton(true)).toBe(true)
  })
})

describe('Support Developer Settings layout', () => {
  it('false時はSupportボタンを生成せず Credits／Back を維持する', () => {
    expect(
      listSettingsMenuButtonIds({ mode: 'title', supportEnabled: false }),
    ).toEqual(['bgm', 'clearSave', 'credits', 'back'])
    expect(
      listSettingsMenuButtonIds({ mode: 'game', supportEnabled: false }),
    ).toEqual(['bgm', 'giveUp', 'credits', 'back'])
    expect(
      listSettingsMenuButtonLabels({
        mode: 'title',
        supportEnabled: false,
        bgmEnabled: true,
      }),
    ).toEqual(['BGM: ON', 'Clear Save', 'Credits', 'Back'])
  })

  it('true時だけSupportをCredits直前へ入れる', () => {
    expect(
      listSettingsMenuButtonIds({ mode: 'title', supportEnabled: true }),
    ).toEqual(['bgm', 'clearSave', 'supportDeveloper', 'credits', 'back'])
    expect(
      listSettingsMenuButtonLabels({
        mode: 'game',
        supportEnabled: true,
        bgmEnabled: false,
      }),
    ).toEqual([
      'BGM: OFF',
      'Give Up to Title',
      SUPPORT_DEVELOPER_LABEL,
      'Credits',
      'Back',
    ])
  })
})

describe('Support Developer external link', () => {
  it('Flag falseでは外部リンクを開かない', () => {
    const openWindow = vi.fn(() => ({ closed: false }) as Window)
    expect(openSupportDeveloperLink(openWindow)).toBe('disabled')
    expect(openWindow).not.toHaveBeenCalled()
  })

  it('true時の操作で固定Ko-fi URLを1回だけ開き、_blankとnoopener,noreferrerを使う', () => {
    const openWindow = vi.fn(() => ({ closed: false }) as Window)
    expect(
      openExternalSupportLink({
        enabled: true,
        url: SUPPORT_DEVELOPER_URL,
        openWindow,
      }),
    ).toBe('opened')
    expect(openWindow).toHaveBeenCalledTimes(1)
    expect(openWindow).toHaveBeenCalledWith(
      'https://ko-fi.com/rossoargine',
      '_blank',
      'noopener,noreferrer',
    )
  })

  it('popup拒否でもゲームを止めず blocked を返す', () => {
    const openWindow = vi.fn(() => null)
    expect(
      openExternalSupportLink({
        enabled: true,
        url: SUPPORT_DEVELOPER_URL,
        openWindow,
      }),
    ).toBe('blocked')
  })

  it('固定Ko-fi URLとラベル定義がある', () => {
    expect(SUPPORT_DEVELOPER_URL).toBe('https://ko-fi.com/rossoargine')
    expect(SUPPORT_DEVELOPER_LABEL).toBe('SUPPORT DEVELOPER')
  })
})
