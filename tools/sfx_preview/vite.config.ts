/**
 * SFX Preview 専用 Vite 設定。
 * - candidates: tools/sfx_preview/public
 * - Runtime 採用済み音源: リポジトリの public/ を追加で配信
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'

const toolRoot = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(toolRoot, '../..')
const repoPublic = path.resolve(repoRoot, 'public')

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.ogg') {
    return 'audio/ogg'
  }
  if (ext === '.mp3') {
    return 'audio/mpeg'
  }
  if (ext === '.wav') {
    return 'audio/wav'
  }
  if (ext === '.json') {
    return 'application/json'
  }
  if (ext === '.svg') {
    return 'image/svg+xml'
  }
  if (ext === '.png') {
    return 'image/png'
  }
  return 'application/octet-stream'
}

/** Runtime 音源など、本体 public 配下を /assets/... で読めるようにする */
function serveRepoPublicAssets(): Plugin {
  return {
    name: 'serve-repo-public-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url ?? ''
        const urlPath = rawUrl.split('?')[0]
        if (!urlPath.startsWith('/assets/')) {
          next()
          return
        }
        const filePath = path.resolve(repoPublic, '.' + urlPath)
        if (!filePath.startsWith(repoPublic)) {
          next()
          return
        }
        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
          // tools/sfx_preview/public（candidates）は Vite publicDir に任せる
          next()
          return
        }
        res.statusCode = 200
        res.setHeader('Content-Type', contentTypeFor(filePath))
        fs.createReadStream(filePath).pipe(res)
      })
    },
  }
}

export default defineConfig({
  root: toolRoot,
  base: './',
  publicDir: path.resolve(toolRoot, 'public'),
  server: {
    port: 5174,
    strictPort: true,
    fs: {
      allow: [repoRoot],
    },
  },
  plugins: [serveRepoPublicAssets()],
  resolve: {
    alias: {
      phaser: path.resolve(repoRoot, 'node_modules/phaser'),
    },
  },
})
