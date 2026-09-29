import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // Reuse one jsdom environment per worker: creating a fresh jsdom per file
    // dominates runtime on small suites.
    pool: 'vmThreads',
    restoreMocks: true,
  },
})
