import { chromium } from '@playwright/test'

async function clickGamePoint(page, gameX, gameY) {
  const point = await page.evaluate(
    ({ gameX, gameY }) => {
      const canvas = document.querySelector('canvas')
      if (canvas === null) {
        throw new Error('canvas not found')
      }
      const rect = canvas.getBoundingClientRect()
      return {
        x: rect.left + (rect.width * gameX) / 960,
        y: rect.top + (rect.height * gameY) / 540,
      }
    },
    { gameX, gameY },
  )
  await page.mouse.click(point.x, point.y)
}

async function check(baseUrl, supportEnabled) {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const pageErrors = []
  const consoleErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.stack ?? String(error)))
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text())
    }
  })

  await page.goto(baseUrl)
  await page.waitForSelector('canvas', { timeout: 30_000 })
  await page.waitForTimeout(1500)
  await page.evaluate(() => {
    window.__supportOpenCalls = []
    window.open = (url, target, features) => {
      window.__supportOpenCalls.push({ url, target, features })
      return null
    }
    window.__supportRafCount = 0
    const tick = () => {
      window.__supportRafCount += 1
      window.requestAnimationFrame(tick)
    }
    window.requestAnimationFrame(tick)
  })

  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  await page.screenshot({
    path: supportEnabled
      ? 'tmp/support-settings-on.png'
      : 'tmp/support-settings-off.png',
  })

  const beforeRaf = await page.evaluate(() => window.__supportRafCount)
  await clickGamePoint(page, 820, 380)
  await page.waitForTimeout(300)
  const afterRaf = await page.evaluate(() => window.__supportRafCount)
  const calls = await page.evaluate(() => window.__supportOpenCalls)

  await clickGamePoint(page, 820, 432)
  await page.waitForTimeout(300)
  await page.screenshot({
    path: supportEnabled
      ? 'tmp/support-credits-on.png'
      : 'tmp/support-credits-off.png',
  })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(200)
  await clickGamePoint(page, 820, 484)
  await page.waitForTimeout(300)

  await browser.close()
  return {
    supportEnabled,
    calls,
    rafAdvancedAfterBlockedPopup: afterRaf > beforeRaf,
    pageErrors,
    consoleErrors,
  }
}

const off = await check('http://127.0.0.1:5203/?game=survivor', false)
const on = await check('http://127.0.0.1:5202/?game=survivor', true)
console.log(JSON.stringify({ off, on }, null, 2))
