import { mkdirSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'

/**
 * Ensures the directory for a `file:` database exists.
 *
 * libsql will create the database file but not its parent directory, and fails
 * with a bare "unable to open connection" if it is missing — which is exactly
 * what a fresh clone hits, because `.data/` is gitignored.
 */
export function ensureDatabaseDirectory(url: string): void {
  if (!url.startsWith('file:')) return

  const path = url.slice('file:'.length)
  // `file::memory:` and `:memory:` have no directory to create.
  if (!path || path.startsWith(':')) return

  const absolute = isAbsolute(path) ? path : resolve(process.cwd(), path)
  mkdirSync(dirname(absolute), { recursive: true })
}
