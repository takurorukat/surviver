/**
 * Vite のビルド／開発サーバ設定。
 * Phaser ゲームをブラウザで動かすためのフロントエンド用バンドラ設定。
 * base: './' は相対パス配信（サブディレクトリ配置）向け。
 */
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  server: {
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
})
