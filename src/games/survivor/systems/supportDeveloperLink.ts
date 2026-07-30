import { SURVIVOR_SUPPORT_LINK_ENABLED } from '../constants/support'

/** Feature Flag 有効ビルドだけで参照される固定URL。無効ビルドでは tree-shake 対象。 */
export const SUPPORT_DEVELOPER_URL = 'https://ko-fi.com/rossoargine'

export type OpenSupportDeveloperLinkResult =
  | 'opened'
  | 'blocked'
  | 'disabled'

type OpenWindowFn = (
  url?: string | URL,
  target?: string,
  features?: string,
) => Window | null

/**
 * Feature Flag と固定URLを受け取り、外部支援ページを開く純粋処理。
 * popup拒否時は 'blocked' を返し、ゲームは止めない。
 */
export function openExternalSupportLink(options: {
  enabled: boolean
  url: string
  openWindow: OpenWindowFn
}): OpenSupportDeveloperLinkResult {
  if (options.enabled !== true) {
    return 'disabled'
  }

  const openedWindow = options.openWindow(
    options.url,
    '_blank',
    'noopener,noreferrer',
  )
  if (openedWindow === null) {
    return 'blocked'
  }
  return 'opened'
}

/**
 * ユーザー操作のコールバック内だけで呼ぶ。
 * Feature Flag が無効なら URL を開かず、popup拒否でもゲームを止めない。
 */
export function openSupportDeveloperLink(
  openWindow: OpenWindowFn = window.open.bind(window),
): OpenSupportDeveloperLinkResult {
  return openExternalSupportLink({
    enabled: SURVIVOR_SUPPORT_LINK_ENABLED,
    url: SUPPORT_DEVELOPER_URL,
    openWindow,
  })
}

/** Settings メニュー項目の組み立て用。無効時はボタン定義ごと作らない。 */
export function shouldIncludeSupportDeveloperButton(
  enabled: boolean = SURVIVOR_SUPPORT_LINK_ENABLED,
): boolean {
  return enabled === true
}
