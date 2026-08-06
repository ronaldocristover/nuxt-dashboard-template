import { migrate } from 'drizzle-orm/libsql/migrator'
import { useDatabase } from '../database/client'

/**
 * Applies pending migrations on boot — in development only.
 *
 * This is what makes `git clone && npm install && npm run dev` work with no
 * database step. In production migrations are a deploy concern: run
 * `npm run db:migrate` before starting the server, so a rollout that fails
 * halfway does not leave a half-migrated schema behind a live process.
 *
 * The migrator reads the SQL files from disk, which a bundled server output
 * does not carry — another reason this stays a dev-only convenience.
 */
export default defineNitroPlugin(async () => {
  if (!import.meta.dev) return

  try {
    await migrate(useDatabase(), { migrationsFolder: 'server/database/migrations' })
  } catch (error) {
    console.error('[cadence] migrations failed', error)
    throw error
  }
})
