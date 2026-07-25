// =============================================================================
// マルチゲーム起動エントリポイント
//
// ?game=survivor（デフォルト）で Survivor Stage を起動。
// 将来: ?game=clicker などを追加可能。
// =============================================================================

type SupportedGameId = 'survivor'

function getGameIdFromUrl(): SupportedGameId {
  const params = new URLSearchParams(window.location.search)
  const gameId = params.get('game')
  if (gameId === 'survivor' || gameId === null || gameId === '') {
    return 'survivor'
  }
  console.warn(`未知の game=${gameId}。survivor を起動します。`)
  return 'survivor'
}

async function bootstrap(): Promise<void> {
  const gameId = getGameIdFromUrl()

  if (gameId === 'survivor') {
    const { startSurvivorGame } = await import('./games/survivor/bootstrap')
    startSurvivorGame()
    return
  }
}

void bootstrap()
