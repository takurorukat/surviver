/**
 * Ending 画面の進行状態（純粋関数）。
 * Phaser Scene から切り離してテストできるようにする。
 */

export type EndingScreenId = 'victory' | 'finalAscent'

export type EndingSequenceState = {
  screen: EndingScreenId
  /** true のあいだは入力で進めない */
  inputLocked: boolean
  /** true ならタイトルへ戻るタイミング */
  finished: boolean
}

export function createEndingSequenceState(): EndingSequenceState {
  return {
    screen: 'victory',
    inputLocked: true,
    finished: false,
  }
}

/** 入力ロックを解除する（最低表示時間経過後） */
export function unlockEndingInput(state: EndingSequenceState): EndingSequenceState {
  if (state.finished) {
    return state
  }
  return {
    screen: state.screen,
    inputLocked: false,
    finished: false,
  }
}

/**
 * 1回の決定入力。ロック中・終了済みなら変化なし。
 * Victory → Final Ascent → finished。
 */
export function advanceEndingOnInput(state: EndingSequenceState): EndingSequenceState {
  if (state.finished || state.inputLocked) {
    return state
  }

  if (state.screen === 'victory') {
    return {
      screen: 'finalAscent',
      inputLocked: true,
      finished: false,
    }
  }

  return {
    screen: 'finalAscent',
    inputLocked: true,
    finished: true,
  }
}
