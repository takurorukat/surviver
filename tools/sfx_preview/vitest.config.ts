import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const toolRoot = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: toolRoot,
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
    clearMocks: true,
  },
})
