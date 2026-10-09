/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Exact-match only, so the shim's own deep imports resolve to the real package.
    alias: [
      {
        find: /^@tabler\/icons-react$/,
        replacement: fileURLToPath(new URL('./tabler-icons.js', import.meta.url)),
      },
    ],
  },
  build: {
    // Main chunk is ~195 kB gzipped (mostly Mantine); acceptable for an internal tool. Charts are
    // already split into the lazily-loaded insights chunk.
    chunkSizeWarningLimit: 700,
  },
  server: {
    // In dev, proxy API calls to the FastAPI server so the browser sees a single origin (as on Vercel).
    proxy: { '/api': 'http://localhost:8000' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
