/**
 * Production build の入口。
 *
 * - 通常のローカル / CI: Feature Flag 未設定 → Support OFF
 * - Cloudflare Pages (CF_PAGES=1): Flag 未設定なら true を付けて Support ON
 * - 明示的に VITE_SURVIVOR_SUPPORT_LINK_ENABLED が付いている場合はそれを優先
 *
 * 実行時の配信先ドメインやブラウザ情報では判定しない。
 */
import { spawnSync } from 'node:child_process'

const env = { ...process.env }

if (
  env.CF_PAGES === '1' &&
  env.VITE_SURVIVOR_SUPPORT_LINK_ENABLED === undefined
) {
  env.VITE_SURVIVOR_SUPPORT_LINK_ENABLED = 'true'
}

const result = spawnSync('npm', ['run', 'build:vite'], {
  stdio: 'inherit',
  env,
  shell: process.platform === 'win32',
})

process.exit(result.status ?? 1)
