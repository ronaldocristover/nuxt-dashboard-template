import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { ensureDatabaseDirectory } from './paths'
import * as schema from './schema'

/**
 * The Drizzle client, created once per process.
 *
 * `libsql` rather than `better-sqlite3` for two reasons: it ships prebuilt, so
 * `npm install` needs no compiler; and the same driver talks to a local file or
 * to Turso, which makes going from `file:./.data/cadence.db` to a hosted
 * database a change of one environment variable rather than a change of driver.
 */

export type Database = ReturnType<typeof drizzle<typeof schema>>

let instance: Database | undefined

function databaseUrl(): string {
  const url = process.env.DATABASE_URL ?? 'file:./.data/cadence.db'

  // A `file:` URL that is not absolute resolves against the process cwd, which
  // differs between `nuxt dev` and a built server. Leave it to the caller to
  // set an absolute path in production; warn rather than guess.
  if (!import.meta.dev && url.startsWith('file:') && !url.startsWith('file:/')) {
    console.warn(
      `[cadence] DATABASE_URL is a relative file path (${url}). `
      + 'In production prefer an absolute path or a Turso URL, or the database '
      + 'will be created wherever the process happens to start.'
    )
  }

  return url
}

export function useDatabase(): Database {
  if (instance) return instance

  const url = databaseUrl()
  ensureDatabaseDirectory(url)

  const client = createClient({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN
  })

  instance = drizzle(client, { schema })
  return instance
}

export { schema }
