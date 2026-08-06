import { defineConfig } from 'drizzle-kit'

/**
 * `DATABASE_URL` is a libsql URL. Locally that is a file; in production it can
 * point at Turso instead, which is the reason for choosing this driver — the
 * only change is the env var.
 */
export default defineConfig({
  dialect: 'turso',
  schema: './server/database/schema.ts',
  out: './server/database/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'file:./.data/cadence.db'
  },
  strict: true,
  verbose: true
})
