import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * Unit tests only, and deliberately so.
 *
 * Everything under test here is a pure module — formatters, schemas, chart
 * maths, password hashing, metric aggregation. None of it needs a Nuxt
 * runtime, so the suite starts in milliseconds and can run on every commit
 * without anyone resenting it.
 *
 * Rendering and flows are covered by the manual passes documented in the
 * README; adding `@nuxt/test-utils` here would triple the install size for
 * assertions that a screenshot already makes better.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts']
  },
  resolve: {
    alias: {
      // Mirrors the `#shared` alias Nuxt provides at build time.
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
      '~~': fileURLToPath(new URL('.', import.meta.url)),
      '~': fileURLToPath(new URL('./app', import.meta.url))
    }
  }
})
