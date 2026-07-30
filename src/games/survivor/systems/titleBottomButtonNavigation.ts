export type TitleBottomButtonId = 'support' | 'debug' | 'bgm'

export type TitleBottomButtonAvailability = {
  supportEnabled: boolean
  debugEnabled: boolean
}

/** タイトル下部の丸ボタンを、画面の左から右の順で返す。 */
export function listTitleBottomButtonIds(
  availability: TitleBottomButtonAvailability,
): TitleBottomButtonId[] {
  const ids: TitleBottomButtonId[] = []
  if (availability.supportEnabled) {
    ids.push('support')
  }
  if (availability.debugEnabled) {
    ids.push('debug')
  }
  ids.push('bgm')
  return ids
}

/**
 * 下部ボタン上で左右移動した次の選択先を返す。
 * 端を越える入力では現在位置を維持する。
 */
export function moveTitleBottomButtonSelection(
  current: TitleBottomButtonId,
  direction: number,
  availability: TitleBottomButtonAvailability,
): TitleBottomButtonId {
  const ids = listTitleBottomButtonIds(availability)
  const currentIndex = ids.indexOf(current)
  if (currentIndex < 0) {
    return current
  }

  const step = direction < 0 ? -1 : 1
  const nextIndex = currentIndex + step
  if (nextIndex < 0 || nextIndex >= ids.length) {
    return current
  }
  return ids[nextIndex]
}

/** BGMの既存indexを変えず、その後ろへSupport用indexを追加する。 */
export function getTitleSupportSelectionIndex(
  bgmSelectionIndex: number,
  debugEnabled: boolean,
): number {
  const debugOffset = debugEnabled ? 1 : 0
  return bgmSelectionIndex + debugOffset + 1
}
