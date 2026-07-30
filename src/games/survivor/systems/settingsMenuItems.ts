import { SUPPORT_DEVELOPER_LABEL } from '../constants/support'

export type SettingsMenuModeForItems = 'title' | 'game'

export type SettingsMenuButtonId =
  | 'bgm'
  | 'clearSave'
  | 'giveUp'
  | 'supportDeveloper'
  | 'credits'
  | 'back'

/**
 * Settings の表示順を純粋関数で決める。
 * Support は Feature Flag が true のときだけ Credits の直前に入る。
 */
export function listSettingsMenuButtonIds(options: {
  mode: SettingsMenuModeForItems
  supportEnabled: boolean
}): SettingsMenuButtonId[] {
  const ids: SettingsMenuButtonId[] = ['bgm']

  if (options.mode === 'title') {
    ids.push('clearSave')
  }
  if (options.mode === 'game') {
    ids.push('giveUp')
  }
  if (options.supportEnabled === true) {
    ids.push('supportDeveloper')
  }
  ids.push('credits')
  ids.push('back')
  return ids
}

export function listSettingsMenuButtonLabels(options: {
  mode: SettingsMenuModeForItems
  supportEnabled: boolean
  bgmEnabled: boolean
}): string[] {
  const ids = listSettingsMenuButtonIds({
    mode: options.mode,
    supportEnabled: options.supportEnabled,
  })
  const labels: string[] = []
  for (let index = 0; index < ids.length; index++) {
    const id = ids[index]
    if (id === 'bgm') {
      labels.push(options.bgmEnabled ? 'BGM: ON' : 'BGM: OFF')
      continue
    }
    if (id === 'clearSave') {
      labels.push('Clear Save')
      continue
    }
    if (id === 'giveUp') {
      labels.push('Give Up to Title')
      continue
    }
    if (id === 'supportDeveloper') {
      labels.push(SUPPORT_DEVELOPER_LABEL)
      continue
    }
    if (id === 'credits') {
      labels.push('Credits')
      continue
    }
    labels.push('Back')
  }
  return labels
}
