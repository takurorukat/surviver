import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const GAME_WIDTH = 960
const GAME_HEIGHT = 540
const SETTINGS_MENU_WIDTH = 260
const SETTINGS_MENU_BUTTON_HEIGHT = 40
const SETTINGS_MENU_BUTTON_GAP = 12

async function clickGamePoint(
  page: import('@playwright/test').Page,
  gameX: number,
  gameY: number,
): Promise<void> {
  const canvas = page.locator('canvas').first()
  const box = await canvas.boundingBox()
  expect(box, 'canvas bounding box').not.toBeNull()
  if (box === null) {
    return
  }
  const pageX = box.x + (gameX / GAME_WIDTH) * box.width
  const pageY = box.y + (gameY / GAME_HEIGHT) * box.height
  await page.mouse.click(pageX, pageY)
}

async function openCreditsFromTitle(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/?game=survivor')
  await page.waitForSelector('canvas', { timeout: 30_000 })
  await page.waitForTimeout(1800)

  // 右上歯車（概ね SETTINGS_GEAR 位置）
  await clickGamePoint(page, GAME_WIDTH - 30, 12)
  await page.waitForTimeout(500)

  // Settings 内 Credits ボタン（Back の1つ上）
  const panelCenterX = GAME_WIDTH - SETTINGS_MENU_WIDTH / 2
  const backLocalY = GAME_HEIGHT / 2 - 56
  const creditsLocalY =
    backLocalY - SETTINGS_MENU_BUTTON_HEIGHT - SETTINGS_MENU_BUTTON_GAP
  const creditsWorldY = GAME_HEIGHT / 2 + creditsLocalY
  await clickGamePoint(page, panelCenterX, creditsWorldY)
  await page.waitForTimeout(600)
}

test('Credits panel fits and Back remains usable', async ({ page }, testInfo) => {
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

  const outDir = path.join(testInfo.outputDir, 'credits-screens')
  fs.mkdirSync(outDir, { recursive: true })
  const publicShotDir = path.join(process.cwd(), 'tmp', 'credits-screenshots')
  fs.mkdirSync(publicShotDir, { recursive: true })

  await page.setViewportSize({ width: 1280, height: 720 })
  await openCreditsFromTitle(page)

  const desktopPath = path.join(publicShotDir, 'credits-desktop.png')
  await page.screenshot({ path: desktopPath, fullPage: true })
  await page.screenshot({
    path: path.join(outDir, 'credits-desktop.png'),
    fullPage: true,
  })

  await page.setViewportSize({ width: 900, height: 560 })
  await page.waitForTimeout(400)
  const smallPath = path.join(publicShotDir, 'credits-small-screen.png')
  await page.screenshot({ path: smallPath, fullPage: true })

  // Back（Credits パネル下部中央）
  await clickGamePoint(page, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 420 / 2 - 34)
  await page.waitForTimeout(400)

  // 再度開いて最終行付近を撮影
  const panelCenterX = GAME_WIDTH - SETTINGS_MENU_WIDTH / 2
  const backLocalY = GAME_HEIGHT / 2 - 56
  const creditsLocalY =
    backLocalY - SETTINGS_MENU_BUTTON_HEIGHT - SETTINGS_MENU_BUTTON_GAP
  await clickGamePoint(page, GAME_WIDTH - 30, 12)
  await page.waitForTimeout(400)
  await clickGamePoint(page, panelCenterX, GAME_HEIGHT / 2 + creditsLocalY)
  await page.waitForTimeout(500)

  const bottomPath = path.join(publicShotDir, 'credits-bottom.png')
  await page.screenshot({ path: bottomPath, fullPage: true })

  expect(pageErrors, `page errors: ${pageErrors.join('\n')}`).toEqual([])
  expect(consoleErrors, `console errors: ${consoleErrors.join('\n')}`).toEqual([])
  expect(fs.existsSync(desktopPath)).toBe(true)
  expect(fs.existsSync(smallPath)).toBe(true)
  expect(fs.existsSync(bottomPath)).toBe(true)
})
