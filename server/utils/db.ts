import { and, asc, count, desc, eq, like, lt, or, sql, sum } from 'drizzle-orm'
import type {
  ActivityEvent,
  Invoice,
  NotificationPreferences,
  Plan,
  Subscriber,
  SubscriberStatus,
  TeamMember,
  User
} from '#shared/types'
import { schema, useDatabase } from '../database/client'

/**
 * ============================================================================
 * DATA ACCESS
 * ============================================================================
 *
 * Every read and write the app performs goes through this object. The API
 * routes call nothing else, so swapping SQLite for Postgres means changing the
 * dialect in `server/database/{client,schema}.ts` and the queries here —
 * no page, component or composable is affected.
 *
 * Filtering, sorting, paging and aggregation are done in SQL, not by pulling
 * rows into JavaScript. That is the whole reason for having a database: the
 * subscribers table has one query per request regardless of how many rows exist.
 */

const DEMO_EMAIL = 'demo@cadence.app'
const DEMO_PASSWORD = 'Cadence2026'

/** Row shape as stored — includes the hash, which must never leave the server. */
type StoredUser = typeof schema.users.$inferSelect

const RESET_TTL = 30 * 60 * 1000
const VERIFY_TTL = 24 * 60 * 60 * 1000
const CODE_TTL = 10 * 60 * 1000
const MAX_CODE_ATTEMPTS = 5

function expiry(ttl: number): string {
  return new Date(Date.now() + ttl).toISOString()
}

function nowIso(): string {
  return new Date().toISOString()
}

/** Maps a row to the API type, dropping anything the client must not see. */
function toUser(row: StoredUser): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    jobTitle: row.jobTitle,
    company: row.company,
    timezone: row.timezone,
    avatarColor: row.avatarColor,
    createdAt: row.createdAt,
    emailVerifiedAt: row.emailVerifiedAt,
    twoFactorEnabled: row.twoFactorEnabled
  }
}

export interface SubscriberQuery {
  q: string
  plan: 'all' | Plan
  status: 'all' | SubscriberStatus
  sort: 'name' | 'company' | 'mrr' | 'seats' | 'joinedAt'
  order: 'asc' | 'desc'
  page: number
  pageSize: number
}

export const db = {
  demoCredentials: { email: DEMO_EMAIL, password: DEMO_PASSWORD },

  // --- Users -----------------------------------------------------------------

  async findUserByEmail(email: string): Promise<StoredUser | undefined> {
    const [row] = await useDatabase()
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email.trim().toLowerCase()))
      .limit(1)
    return row
  },

  async findUserById(id: string): Promise<StoredUser | undefined> {
    const [row] = await useDatabase()
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1)
    return row
  },

  async createUser(input: { name: string, email: string, passwordHash: string }): Promise<StoredUser> {
    const database = useDatabase()

    const [counted] = await database.select({ total: count() }).from(schema.users)
    const total = counted?.total ?? 0
    const id = `usr_${String(total + 1).padStart(4, '0')}`

    const [row] = await database
      .insert(schema.users)
      .values({
        id,
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
        role: 'admin',
        avatarColor: AVATAR_COLORS[total % AVATAR_COLORS.length]!,
        createdAt: nowIso(),
        // A fresh sign-up is unverified. That is the point of the flow.
        emailVerifiedAt: null,
        twoFactorEnabled: false
      })
      .returning()

    return row!
  },

  async updateUser(id: string, patch: Partial<Omit<User, 'id'>>): Promise<StoredUser | undefined> {
    const [row] = await useDatabase()
      .update(schema.users)
      .set({
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.email !== undefined ? { email: patch.email.trim().toLowerCase() } : {}),
        ...(patch.jobTitle !== undefined ? { jobTitle: patch.jobTitle } : {}),
        ...(patch.company !== undefined ? { company: patch.company } : {}),
        ...(patch.timezone !== undefined ? { timezone: patch.timezone } : {})
      })
      .where(eq(schema.users.id, id))
      .returning()
    return row
  },

  async setPassword(id: string, passwordHash: string): Promise<boolean> {
    const rows = await useDatabase()
      .update(schema.users)
      .set({ passwordHash })
      .where(eq(schema.users.id, id))
      .returning({ id: schema.users.id })
    return rows.length > 0
  },

  async setEmailVerified(id: string): Promise<StoredUser | undefined> {
    const [row] = await useDatabase()
      .update(schema.users)
      .set({ emailVerifiedAt: nowIso() })
      .where(eq(schema.users.id, id))
      .returning()
    return row
  },

  async setTwoFactor(id: string, enabled: boolean): Promise<StoredUser | undefined> {
    const database = useDatabase()

    const [row] = await database
      .update(schema.users)
      .set({ twoFactorEnabled: enabled })
      .where(eq(schema.users.id, id))
      .returning()

    // Leaving a live code behind after disabling would let it still be used.
    if (!enabled) {
      await database.delete(schema.authTokens).where(
        and(eq(schema.authTokens.userId, id), eq(schema.authTokens.kind, 'two_factor'))
      )
    }

    return row
  },

  // --- Single-use credentials ------------------------------------------------

  async createResetToken(email: string, token: string): Promise<void> {
    const user = await this.findUserByEmail(email)
    if (!user) return
    await useDatabase().insert(schema.authTokens).values({
      id: token,
      kind: 'reset',
      userId: user.id,
      expiresAt: expiry(RESET_TTL)
    })
  },

  async consumeResetToken(token: string): Promise<string | undefined> {
    const user = await consumeToken(token, 'reset')
    return user?.email
  },

  async createVerifyToken(userId: string, token: string): Promise<void> {
    await useDatabase().insert(schema.authTokens).values({
      id: token,
      kind: 'verify',
      userId,
      expiresAt: expiry(VERIFY_TTL)
    })
  },

  async consumeVerifyToken(token: string): Promise<string | undefined> {
    const user = await consumeToken(token, 'verify')
    return user?.id
  },

  /** Replaces any live code for this user — one at a time, by design. */
  async createTwoFactorCode(userId: string, code: string): Promise<void> {
    const database = useDatabase()
    await database.delete(schema.authTokens).where(
      and(eq(schema.authTokens.userId, userId), eq(schema.authTokens.kind, 'two_factor'))
    )
    await database.insert(schema.authTokens).values({
      id: `2fa_${userId}_${Date.now()}`,
      kind: 'two_factor',
      userId,
      code,
      expiresAt: expiry(CODE_TTL),
      attempts: 0
    })
  },

  /**
   * Checks a submitted code, reporting *why* it failed so the page can tell
   * "wrong code" from "ask for a new one".
   */
  async verifyTwoFactorCode(
    userId: string,
    code: string
  ): Promise<'ok' | 'invalid' | 'expired' | 'exhausted'> {
    const database = useDatabase()

    const [row] = await database
      .select()
      .from(schema.authTokens)
      .where(and(eq(schema.authTokens.userId, userId), eq(schema.authTokens.kind, 'two_factor')))
      .limit(1)

    if (!row) return 'expired'

    const drop = () => database.delete(schema.authTokens).where(eq(schema.authTokens.id, row.id))

    if (new Date(row.expiresAt).getTime() < Date.now()) {
      await drop()
      return 'expired'
    }

    if (row.attempts >= MAX_CODE_ATTEMPTS) {
      await drop()
      return 'exhausted'
    }

    if (row.code !== code) {
      // Counting in SQL rather than read-modify-write, so two racing guesses
      // cannot both read the same attempt count.
      await database
        .update(schema.authTokens)
        .set({ attempts: sql`${schema.authTokens.attempts} + 1` })
        .where(eq(schema.authTokens.id, row.id))
      return 'invalid'
    }

    await drop()
    return 'ok'
  },

  /** Clears anything already past its expiry. Cheap, and keeps the table small. */
  async pruneExpiredTokens(): Promise<number> {
    const rows = await useDatabase()
      .delete(schema.authTokens)
      .where(lt(schema.authTokens.expiresAt, nowIso()))
      .returning({ id: schema.authTokens.id })
    return rows.length
  },

  // --- Subscribers -----------------------------------------------------------

  /**
   * One query for the page, one for the totals — filtering, sorting and paging
   * all in SQL. The previous in-memory version pulled every row and sliced it
   * in JavaScript, which is fine at 148 rows and hopeless at 148,000.
   */
  async listSubscribers(query: SubscriberQuery): Promise<{
    rows: Subscriber[]
    total: number
    page: number
    totals: { mrr: number, seats: number }
  }> {
    const database = useDatabase()

    const filters = []
    if (query.plan !== 'all') filters.push(eq(schema.subscribers.plan, query.plan))
    if (query.status !== 'all') filters.push(eq(schema.subscribers.status, query.status))
    if (query.q) {
      const needle = `%${query.q.toLowerCase()}%`
      filters.push(
        or(
          like(sql`lower(${schema.subscribers.name})`, needle),
          like(sql`lower(${schema.subscribers.email})`, needle),
          like(sql`lower(${schema.subscribers.company})`, needle)
        )!
      )
    }

    const where = filters.length ? and(...filters) : undefined

    const [aggregate] = await database
      .select({
        total: count(),
        mrr: sum(schema.subscribers.mrr),
        seats: sum(schema.subscribers.seats)
      })
      .from(schema.subscribers)
      .where(where)

    const total = aggregate?.total ?? 0

    // Clamp instead of returning an empty page: filtering down while on page 6
    // should land the reader on the last real page, not a blank one.
    const lastPage = Math.max(1, Math.ceil(total / query.pageSize))
    const page = Math.min(query.page, lastPage)

    const column = {
      name: schema.subscribers.name,
      company: schema.subscribers.company,
      mrr: schema.subscribers.mrr,
      seats: schema.subscribers.seats,
      joinedAt: schema.subscribers.joinedAt
    }[query.sort]

    const rows = await database
      .select()
      .from(schema.subscribers)
      .where(where)
      .orderBy(query.order === 'asc' ? asc(column) : desc(column))
      .limit(query.pageSize)
      .offset((page - 1) * query.pageSize)

    return {
      rows,
      total,
      page,
      totals: {
        // `sum` comes back as a string from SQLite, and as null on no rows.
        mrr: Number(aggregate?.mrr ?? 0),
        seats: Number(aggregate?.seats ?? 0)
      }
    }
  },

  /** Aggregates the metrics pipeline needs, computed in SQL. */
  async subscriberStats(): Promise<{ activeCount: number, mrrTotal: number }> {
    const [row] = await useDatabase()
      .select({ activeCount: count(), mrrTotal: sum(schema.subscribers.mrr) })
      .from(schema.subscribers)
      .where(sql`${schema.subscribers.status} != 'churned'`)

    return { activeCount: row?.activeCount ?? 0, mrrTotal: Number(row?.mrrTotal ?? 0) }
  },

  /** MRR per plan, for the plan-mix chart. Grouped in SQL. */
  async planMix(): Promise<Array<{ plan: Plan, value: number }>> {
    const rows = await useDatabase()
      .select({ plan: schema.subscribers.plan, value: sum(schema.subscribers.mrr) })
      .from(schema.subscribers)
      .where(sql`${schema.subscribers.status} != 'churned'`)
      .groupBy(schema.subscribers.plan)

    const byPlan = new Map(rows.map(row => [row.plan, Number(row.value ?? 0)]))
    // Always return all three in a stable order, so a plan with no subscribers
    // still appears as a zero slice rather than vanishing from the legend.
    return (['starter', 'growth', 'scale'] as Plan[]).map(plan => ({
      plan,
      value: byPlan.get(plan) ?? 0
    }))
  },

  // --- Read-only demo content -----------------------------------------------

  async activity(limit = 8): Promise<ActivityEvent[]> {
    const rows = await useDatabase()
      .select()
      .from(schema.activity)
      .orderBy(desc(schema.activity.at))
      .limit(limit)

    return rows.map(row => ({
      id: row.id,
      kind: row.kind,
      actor: row.actor,
      company: row.company,
      plan: row.plan,
      amount: row.amount ?? undefined,
      at: row.at
    }))
  },

  async invoices(limit = 6): Promise<Invoice[]> {
    return await useDatabase()
      .select()
      .from(schema.invoices)
      .orderBy(desc(schema.invoices.issuedAt))
      .limit(limit)
  },

  /** Monthly closing MRR, oldest first. */
  async mrrHistory(): Promise<number[]> {
    const rows = await useDatabase()
      .select({ value: schema.revenueHistory.value })
      .from(schema.revenueHistory)
      .where(eq(schema.revenueHistory.kind, 'month'))
      .orderBy(asc(schema.revenueHistory.seq))
    return rows.map(row => row.value)
  },

  /** Daily collected revenue, oldest first. */
  async dailyRevenue(): Promise<number[]> {
    const rows = await useDatabase()
      .select({ value: schema.revenueHistory.value })
      .from(schema.revenueHistory)
      .where(eq(schema.revenueHistory.kind, 'day'))
      .orderBy(asc(schema.revenueHistory.seq))
    return rows.map(row => row.value)
  },

  // --- Team ------------------------------------------------------------------

  async teamMembers(): Promise<TeamMember[]> {
    const rows = await useDatabase()
      .select()
      .from(schema.teamMembers)
      // Owner first, then admins, then members — the order people expect.
      .orderBy(
        sql`case ${schema.teamMembers.role} when 'owner' then 0 when 'admin' then 1 else 2 end`,
        asc(schema.teamMembers.name)
      )
    return rows
  },

  async inviteMember(email: string, role: 'admin' | 'member'): Promise<TeamMember> {
    const database = useDatabase()

    // A monotonic id, not `count + 1` — removing a member and inviting another
    // would otherwise reuse an id that is still referenced elsewhere.
    const [counted] = await database.select({ total: count() }).from(schema.teamMembers)
    const total = counted?.total ?? 0

    const [row] = await database
      .insert(schema.teamMembers)
      .values({
        id: `tm_${Date.now()}_${total + 1}`,
        name: email.split('@')[0]!.replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        email,
        role,
        status: 'invited',
        avatarColor: AVATAR_COLORS[total % AVATAR_COLORS.length]!,
        lastSeenAt: null
      })
      .returning()

    return row!
  },

  async findMemberByEmail(email: string): Promise<TeamMember | undefined> {
    const [row] = await useDatabase()
      .select()
      .from(schema.teamMembers)
      .where(eq(schema.teamMembers.email, email))
      .limit(1)
    return row
  },

  async removeMember(id: string): Promise<boolean> {
    // The owner cannot be removed: a workspace without one has no administrator.
    const rows = await useDatabase()
      .delete(schema.teamMembers)
      .where(and(eq(schema.teamMembers.id, id), sql`${schema.teamMembers.role} != 'owner'`))
      .returning({ id: schema.teamMembers.id })
    return rows.length > 0
  },

  // --- Notification preferences ---------------------------------------------

  async notifications(userId: string): Promise<NotificationPreferences> {
    const database = useDatabase()

    const [row] = await database
      .select()
      .from(schema.notificationPrefs)
      .where(eq(schema.notificationPrefs.userId, userId))
      .limit(1)

    if (row) return stripUserId(row)

    // First read for an account creates the row from the column defaults, so
    // the settings page never has to cope with "no preferences yet".
    const [created] = await database
      .insert(schema.notificationPrefs)
      .values({ userId })
      .returning()

    return stripUserId(created!)
  },

  async setNotifications(
    userId: string,
    next: NotificationPreferences
  ): Promise<NotificationPreferences> {
    const [row] = await useDatabase()
      .insert(schema.notificationPrefs)
      .values({ userId, ...next })
      .onConflictDoUpdate({ target: schema.notificationPrefs.userId, set: next })
      .returning()
    return stripUserId(row!)
  }
}

const AVATAR_COLORS = [
  '#2d5bff', '#0d9488', '#d97706', '#e11d48',
  '#7c3aed', '#0891b2', '#65a30d', '#c026d3'
] as const

export { AVATAR_COLORS }

/**
 * Deletes a single-use token and returns its user, or `undefined` if it was
 * missing or expired. Deleting first is deliberate: an expired token must be
 * cleared, not left to be retried.
 */
async function consumeToken(token: string, kind: 'reset' | 'verify') {
  const database = useDatabase()

  const [row] = await database
    .delete(schema.authTokens)
    .where(and(eq(schema.authTokens.id, token), eq(schema.authTokens.kind, kind)))
    .returning()

  if (!row) return undefined
  if (new Date(row.expiresAt).getTime() < Date.now()) return undefined

  return await db.findUserById(row.userId)
}

function stripUserId(row: typeof schema.notificationPrefs.$inferSelect): NotificationPreferences {
  const { userId: _userId, ...rest } = row
  return rest
}

/** Strips the password hash before a user object crosses the network. */
export function publicUser(user: StoredUser): User {
  return toUser(user)
}

/** Plan pricing per seat. Drives every MRR figure in the seed. */
export const PLAN_PRICING: Record<Plan, { label: string, perSeat: number }> = {
  starter: { label: 'Starter', perSeat: 12 },
  growth: { label: 'Growth', perSeat: 29 },
  scale: { label: 'Scale', perSeat: 64 }
}
