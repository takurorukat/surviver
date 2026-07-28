import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

type SurvivorE2EState = {
  currentScene: string | null
  sceneActive: boolean
  elapsedMs: number
  playerHp: number | null
  playerLevel: number | null
  enemyCount: number
  isLevelUpOpen: boolean
  isGameOver: boolean
  botEnabled: boolean
  lastUpdateAt: number
}

type SurvivorE2EApi = {
  getState: () => SurvivorE2EState
}

declare global {
  interface Window {
    __MAGE_SURVIVOR_TEST__?: SurvivorE2EApi
  }
}

const WATCH_MS = 60_000
const POLL_MS = 1_000

async function readState(page: import('@playwright/test').Page): Promise<SurvivorE2EState> {
  const state = await page.evaluate(() => {
    const api = window.__MAGE_SURVIVOR_TEST__
    if (api === undefined) {
      return null
    }
    return api.getState()
  })
  expect(state, 'window.__MAGE_SURVIVOR_TEST__ is missing').not.toBeNull()
  return state as SurvivorE2EState
}

test('survivor autoplay survives 60 seconds from title', async ({ page }, testInfo) => {
  const pageErrors: string[] = []
  const consoleErrors: string[] = []

  page.on('pageerror', (error) => {
    pageErrors.push(String(error))
  })
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text())
    }
  })

  await page.goto('/?game=survivor&e2e=1')
  await page.waitForSelector('canvas', { timeout: 30_000 })

  // タイトル画面の読み込み完了を待ち、通常どおり Enter で開始する
  await page.waitForTimeout(1500)
  await page.keyboard.press('Enter')

  await page.waitForFunction(
    () => {
      const api = window.__MAGE_SURVIVOR_TEST__
      if (api === undefined) {
        return false
      }
      const state = api.getState()
      return state.currentScene === 'GameScene' && state.botEnabled === true
    },
    undefined,
    { timeout: 30_000 },
  )

  // ステージ開始（カウントダウン後）まで待つ
  await page.waitForFunction(
    () => {
      const api = window.__MAGE_SURVIVOR_TEST__
      if (api === undefined) {
        return false
      }
      return api.getState().sceneActive === true
    },
    undefined,
    { timeout: 20_000 },
  )

  const watchStartedAt = Date.now()
  let previousElapsedMs = -1
  let previousLastUpdateAt = 0
  let sawElapsedAdvance = false

  while (Date.now() - watchStartedAt < WATCH_MS) {
    const state = await readState(page)

    expect(pageErrors, `pageerror: ${pageErrors.join(' | ')}`).toEqual([])
    expect(consoleErrors, `console.error: ${consoleErrors.join(' | ')}`).toEqual([])
    expect(state.currentScene).toBe('GameScene')
    expect(state.botEnabled).toBe(true)
    expect(state.isGameOver, 'player died during autoplay').toBe(false)

    expect(state.playerHp).not.toBeNull()
    expect(Number.isFinite(state.playerHp as number)).toBe(true)
    expect((state.playerHp as number) > 0).toBe(true)
    expect((state.playerHp as number) < 100_000).toBe(true)

    expect(state.playerLevel).not.toBeNull()
    expect(Number.isFinite(state.playerLevel as number)).toBe(true)
    expect((state.playerLevel as number) >= 1).toBe(true)
    expect((state.playerLevel as number) < 10_000).toBe(true)

    expect(Number.isFinite(state.elapsedMs)).toBe(true)
    expect(state.elapsedMs >= 0).toBe(true)
    expect(Number.isFinite(state.enemyCount)).toBe(true)
    expect(state.enemyCount >= 0).toBe(true)
    expect(Number.isFinite(state.lastUpdateAt)).toBe(true)

    if (previousLastUpdateAt > 0) {
      expect(
        state.lastUpdateAt,
        'GameScene update appears stalled (lastUpdateAt)',
      ).toBeGreaterThanOrEqual(previousLastUpdateAt)
    }
    previousLastUpdateAt = state.lastUpdateAt

    if (state.sceneActive && previousElapsedMs >= 0) {
      if (state.elapsedMs > previousElapsedMs) {
        sawElapsedAdvance = true
      }
      expect(
        state.elapsedMs,
        'stage elapsedMs went backwards',
      ).toBeGreaterThanOrEqual(previousElapsedMs)
    }
    if (state.sceneActive) {
      previousElapsedMs = state.elapsedMs
    }

    await page.waitForTimeout(POLL_MS)
  }

  const finalState = await readState(page)
  expect(finalState.isGameOver).toBe(false)
  expect(finalState.botEnabled).toBe(true)
  // ステージ1は約30秒でクリアし得る。壁時計60秒監視と elapsed 進行を合格条件にする
  expect(Date.now() - watchStartedAt).toBeGreaterThanOrEqual(WATCH_MS - 2_000)
  expect(finalState.elapsedMs).toBeGreaterThan(10_000)
  expect(sawElapsedAdvance, 'stage timer never advanced (player/world not running)').toBe(
    true,
  )
  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])

  const outDir = testInfo.outputDir
  fs.mkdirSync(outDir, { recursive: true })

  const jsonPath = path.join(outDir, 'survivor-autoplay-final.json')
  fs.writeFileSync(jsonPath, JSON.stringify(finalState, null, 2), 'utf8')
  await testInfo.attach('final-state', {
    path: jsonPath,
    contentType: 'application/json',
  })

  const screenshotPath = path.join(outDir, 'survivor-autoplay-final.png')
  await page.screenshot({ path: screenshotPath, fullPage: true })
  await testInfo.attach('final-screenshot', {
    path: screenshotPath,
    contentType: 'image/png',
  })
})
