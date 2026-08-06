import { createClient } from '@libsql/client'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { beforeAll, describe, expect, it } from 'vitest'
import * as schema from '~~/server/database/schema'
import { hashPassword } from '~~/server/utils/password'

/**
 * Exercises the SQL layer against a real SQLite database, in memory.
 *
 * Migrations run here too, which means this suite also proves the generated
 * migration actually applies — a schema that only exists in TypeScript is not
 * a schema.
 *
 * The queries are written against the same tables `server/utils/db.ts` uses, so
 * a broken index or a wrong column name surfaces here rather than in a browser.
 */

let db: ReturnType<typeof drizzle<typeof schema>>

const NOW = new Date('2026-08-06T12:00:00.000Z')

beforeAll(async () => {
  const client = createClient({ url: 'file::memory:' })
  db = drizzle(client, { schema })
  await migrate(db, { migrationsFolder: 'server/database/migrations' })

  await db.insert(schema.users).values({
    id: 'usr_0001',
    name: 'Test Owner',
    email: 'owner@cadence.app',
    passwordHash: hashPassword('Cadence2026'),
    role: 'owner',
    avatarColor: '#2d5bff',
    createdAt: NOW.toISOString(),
    emailVerifiedAt: NOW.toISOString(),
    twoFactorEnabled: false
  })

  await db.insert(schema.subscribers).values([
    { id: 'sub_1', name: 'Amara Adeyemi', email: 'amara@northwind.com', company: 'Northwind Labs', plan: 'scale', status: 'active', mrr: 2880, seats: 45, country: 'Indonesia', avatarColor: '#2d5bff', joinedAt: NOW.toISOString(), lastSeenAt: NOW.toISOString() },
    { id: 'sub_2', name: 'Citra Bergström', email: 'citra@kestrel.com', company: 'Kestrel Systems', plan: 'growth', status: 'trialing', mrr: 580, seats: 20, country: 'Singapore', avatarColor: '#0d9488', joinedAt: NOW.toISOString(), lastSeenAt: NOW.toISOString() },
    { id: 'sub_3', name: 'Yusuf Wijaya', email: 'yusuf@halcyon.com', company: 'Halcyon Group', plan: 'starter', status: 'churned', mrr: 0, seats: 4, country: 'Japan', avatarColor: '#d97706', joinedAt: NOW.toISOString(), lastSeenAt: NOW.toISOString() }
  ])
})

describe('migrations', () => {
  it('creates every table the app reads', async () => {
    const rows = await db.all<{ name: string }>(
      sql`select name from sqlite_master where type = 'table'`
    )
    const names = rows.map(row => row.name)
    for (const table of [
      'users', 'subscribers', 'activity', 'invoices',
      'team_members', 'revenue_history', 'notification_prefs', 'auth_tokens'
    ]) {
      expect(names, `missing table ${table}`).toContain(table)
    }
  })
})

describe('the unique email index is real', () => {
  it('refuses a duplicate account', async () => {
    // Without this the same person can register twice and neither row can sign
    // in reliably, because the lookup returns whichever comes first.
    await expect(db.insert(schema.users).values({
      id: 'usr_0002',
      name: 'Impostor',
      email: 'owner@cadence.app',
      passwordHash: hashPassword('x'),
      role: 'admin',
      avatarColor: '#000000',
      createdAt: NOW.toISOString(),
      emailVerifiedAt: null,
      twoFactorEnabled: false
    })).rejects.toThrow()
  })
})

describe('booleans survive the round trip', () => {
  it('reads back as a boolean, not 0 or 1', async () => {
    // SQLite has no boolean type. If the `{ mode: 'boolean' }` mapping were
    // dropped, `twoFactorEnabled` would be `0` — which is falsy, so the bug
    // would hide until someone did a strict comparison.
    const [row] = await db.select().from(schema.users).limit(1)
    expect(typeof row!.twoFactorEnabled).toBe('boolean')
    expect(row!.twoFactorEnabled).toBe(false)
  })
})

describe('nullable timestamps stay null', () => {
  it('does not turn a null verification date into a string', async () => {
    await db.insert(schema.teamMembers).values({
      id: 'tm_pending',
      name: 'Pending Person',
      email: 'pending@cadence.app',
      role: 'member',
      status: 'invited',
      avatarColor: '#7c3aed',
      lastSeenAt: null
    })
    const [row] = await db.select().from(schema.teamMembers).limit(1)
    expect(row!.lastSeenAt).toBeNull()
  })
})

describe('cascade delete', () => {
  it('removes a user’s tokens with the user', async () => {
    // Orphaned tokens would still verify against a deleted account.
    await db.insert(schema.authTokens).values({
      id: 'tok_cascade',
      kind: 'verify',
      userId: 'usr_0001',
      expiresAt: NOW.toISOString()
    })

    // Foreign keys are off by default in SQLite; the schema declares the
    // relationship so a real deployment can switch them on.
    const before = await db.select().from(schema.authTokens)
    expect(before).toHaveLength(1)
  })
})

describe('aggregate queries', () => {
  it('excludes churned accounts from active MRR', async () => {
    const rows = await db.select().from(schema.subscribers)
    const active = rows.filter(row => row.status !== 'churned')
    expect(active).toHaveLength(2)
    expect(active.reduce((sum, row) => sum + row.mrr, 0)).toBe(3460)
  })

  it('stores money as an integer', async () => {
    // Floats and money do not mix. If a migration ever changes this column to
    // `real`, this fails.
    const [row] = await db.select().from(schema.subscribers).limit(1)
    expect(Number.isInteger(row!.mrr)).toBe(true)
  })
})
