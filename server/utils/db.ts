import { and, asc, count, desc, eq, inArray, like, lt, or, sql, sum } from 'drizzle-orm'
import type {
  ActivityEvent,
  BoardCard,
  BoardColumn,
  BoardLabel,
  BoardTone,
  Invoice,
  MemberDepartment,
  MemberRenewal,
  MemberRole,
  MembersResponse,
  MemberStatus,
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

/**
 * The same windows in minutes, for the emails that have to state them.
 *
 * Exported from here rather than retyped in the templates, because "this link
 * expires in 30 minutes" becoming a lie is the kind of drift nobody notices
 * until a user is locked out arguing with the copy.
 */
export const TTL_MINUTES = {
  reset: RESET_TTL / 60_000,
  verify: VERIFY_TTL / 60_000,
  code: CODE_TTL / 60_000
} as const

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

/** What `listMembers` accepts. Mirrors the query schema on the route. */
export interface MemberQuery {
  q: string
  role: MemberRole | 'all'
  status: MemberStatus | 'all'
  department: MemberDepartment | 'all'
  sort: 'name' | 'email' | 'role' | 'department' | 'joinedAt' | 'lastSeenAt'
  order: 'asc' | 'desc'
  page: number
  pageSize: number
}

/** The writable fields of a member — everything the form collects. */
export interface MemberInput {
  name: string
  email: string
  role: MemberRole
  status: MemberStatus
  department: MemberDepartment
  title: string
  phone: string
  location: string
  timezone: string
  notes: string
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

  // --- Member management -----------------------------------------------------

  /**
   * One page of members, filtered and sorted in SQL.
   *
   * Two queries: the page itself, and the counts the filter chips display.
   * Counting in SQL rather than over the returned rows is the difference
   * between a chip that says how many invited members exist and one that says
   * how many are on this page.
   */
  async listMembers(query: MemberQuery): Promise<{
    rows: TeamMember[]
    total: number
    page: number
    counts: MembersResponse['counts']
  }> {
    const database = useDatabase()
    const table = schema.teamMembers

    const filters = [
      query.q
        ? or(
            like(sql`lower(${table.name})`, `%${query.q.toLowerCase()}%`),
            like(sql`lower(${table.email})`, `%${query.q.toLowerCase()}%`),
            like(sql`lower(${table.title})`, `%${query.q.toLowerCase()}%`)
          )
        : undefined,
      query.role === 'all' ? undefined : eq(table.role, query.role),
      query.status === 'all' ? undefined : eq(table.status, query.status),
      query.department === 'all' ? undefined : eq(table.department, query.department)
    ].filter(Boolean)

    const where = filters.length ? and(...filters) : undefined

    const [counted] = await database.select({ total: count() }).from(table).where(where)
    const total = counted?.total ?? 0

    // Clamp rather than 404 — deleting the last member on page 3 should show
    // page 2, not an error.
    const pages = Math.max(1, Math.ceil(total / query.pageSize))
    const page = Math.min(query.page, pages)

    const direction = query.order === 'asc' ? asc : desc
    const column = {
      name: table.name,
      email: table.email,
      role: sql`case ${table.role} when 'owner' then 0 when 'admin' then 1 else 2 end`,
      department: table.department,
      joinedAt: table.joinedAt,
      lastSeenAt: table.lastSeenAt
    }[query.sort]

    const rows = await database
      .select()
      .from(table)
      .where(where)
      .orderBy(direction(column), asc(table.name))
      .limit(query.pageSize)
      .offset((page - 1) * query.pageSize)

    // Counts describe the whole table, not the filtered set: they are what the
    // filter chips are filtering *from*, so filtering by them must not change
    // the numbers written on them.
    const byStatus = await database
      .select({ status: table.status, total: count() })
      .from(table)
      .groupBy(table.status)

    const byRole = await database
      .select({ role: table.role, total: count() })
      .from(table)
      .groupBy(table.role)

    const statusTotals = Object.fromEntries(byStatus.map(row => [row.status, row.total]))
    const roleTotals = Object.fromEntries(byRole.map(row => [row.role, row.total]))

    return {
      rows,
      total,
      page,
      counts: {
        all: byStatus.reduce((sum, row) => sum + row.total, 0),
        active: statusTotals.active ?? 0,
        invited: statusTotals.invited ?? 0,
        byRole: {
          owner: roleTotals.owner ?? 0,
          admin: roleTotals.admin ?? 0,
          member: roleTotals.member ?? 0
        }
      }
    }
  },

  async findMember(id: string): Promise<TeamMember | undefined> {
    const [row] = await useDatabase()
      .select()
      .from(schema.teamMembers)
      .where(eq(schema.teamMembers.id, id))
      .limit(1)
    return row
  },

  /** How many owners exist. Guards the moves that would strand the workspace. */
  async ownerCount(): Promise<number> {
    const [row] = await useDatabase()
      .select({ total: count() })
      .from(schema.teamMembers)
      .where(eq(schema.teamMembers.role, 'owner'))
    return row?.total ?? 0
  },

  async createMember(input: MemberInput & { invitedBy: string }): Promise<TeamMember> {
    const database = useDatabase()

    const [counted] = await database.select({ total: count() }).from(schema.teamMembers)
    const total = counted?.total ?? 0

    const [row] = await database
      .insert(schema.teamMembers)
      .values({
        ...input,
        id: `tm_${Date.now()}_${total + 1}`,
        avatarColor: AVATAR_COLORS[total % AVATAR_COLORS.length]!,
        // Someone who has not signed in has not been seen, whatever the form said.
        lastSeenAt: input.status === 'active' ? nowIso() : null,
        joinedAt: nowIso()
      })
      .returning()

    return row!
  },

  async updateMember(id: string, input: Partial<MemberInput>): Promise<TeamMember | undefined> {
    const [row] = await useDatabase()
      .update(schema.teamMembers)
      .set(input)
      .where(eq(schema.teamMembers.id, id))
      .returning()
    return row
  },

  /** Renewals this member owns, newest deadline first, with the stage they sit in. */
  async memberRenewals(name: string): Promise<MemberRenewal[]> {
    const rows = await useDatabase()
      .select({
        id: schema.boardCards.id,
        title: schema.boardCards.title,
        account: schema.boardCards.account,
        mrr: schema.boardCards.mrr,
        dueAt: schema.boardCards.dueAt,
        columnTitle: schema.boardColumns.title,
        columnTone: schema.boardColumns.tone
      })
      .from(schema.boardCards)
      .innerJoin(schema.boardColumns, eq(schema.boardCards.columnId, schema.boardColumns.id))
      .where(eq(schema.boardCards.ownerName, name))
      .orderBy(asc(schema.boardColumns.position), asc(schema.boardCards.position))

    return rows
  },

  /**
   * Invoices raised against the accounts this member owns.
   *
   * A failed invoice is the earliest churn signal a renewal owner gets, so this
   * belongs on their page rather than only in the finance view. Newest first,
   * because that is the one that matters.
   */
  async memberInvoices(accounts: string[], take = 40): Promise<Invoice[]> {
    if (!accounts.length) return []

    return useDatabase()
      .select()
      .from(schema.invoices)
      .where(inArray(schema.invoices.subscriber, accounts))
      .orderBy(desc(schema.invoices.issuedAt))
      .limit(take)
  },

  /**
   * Recent events on the accounts this member owns.
   *
   * Not "things this member did" — `activity.actor` records the *customer*, so
   * matching it against a colleague's name would have returned an empty tab
   * forever. What a renewal owner actually needs is what moved on the accounts
   * they are responsible for, which is what this answers.
   */
  async memberActivity(accounts: string[], take = 10): Promise<ActivityEvent[]> {
    if (!accounts.length) return []

    const rows = await useDatabase()
      .select()
      .from(schema.activity)
      .where(inArray(schema.activity.company, accounts))
      .orderBy(desc(schema.activity.at))
      .limit(take)

    return rows.map(row => ({ ...row, amount: row.amount ?? undefined }))
  },

  // --- Kanban board ----------------------------------------------------------

  /**
   * The whole board in two queries — columns, then every card ordered by
   * column and position. Assembling in memory beats one query per column.
   */
  async board(): Promise<BoardColumn[]> {
    const database = useDatabase()

    const [columns, cards] = await Promise.all([
      database.select().from(schema.boardColumns).orderBy(asc(schema.boardColumns.position)),
      database
        .select()
        .from(schema.boardCards)
        .orderBy(asc(schema.boardCards.columnId), asc(schema.boardCards.position))
    ])

    const byColumn = new Map<string, BoardCard[]>()
    for (const card of cards) {
      const list = byColumn.get(card.columnId) ?? []
      list.push(card as BoardCard)
      byColumn.set(card.columnId, list)
    }

    return columns.map(column => ({
      ...column,
      cards: (byColumn.get(column.id) ?? []).sort((a, b) => a.position - b.position)
    }))
  },

  async allCards(): Promise<BoardCard[]> {
    const rows = await useDatabase().select().from(schema.boardCards)
    return rows as BoardCard[]
  },

  async findCard(id: string): Promise<BoardCard | undefined> {
    const [row] = await useDatabase()
      .select()
      .from(schema.boardCards)
      .where(eq(schema.boardCards.id, id))
      .limit(1)
    return row as BoardCard | undefined
  },

  async createCard(input: {
    columnId: string
    title: string
    account: string
    mrr: number
    ownerName: string
    ownerColor: string
    dueAt: string | null
    labels: BoardLabel[]
  }): Promise<BoardCard> {
    const database = useDatabase()

    // Append to the end of its column. Read the current max rather than the row
    // count, so a gap left by a delete cannot collide.
    const [last] = await database
      .select({ position: schema.boardCards.position })
      .from(schema.boardCards)
      .where(eq(schema.boardCards.columnId, input.columnId))
      .orderBy(desc(schema.boardCards.position))
      .limit(1)

    const [row] = await database
      .insert(schema.boardCards)
      .values({
        id: `card_${Date.now().toString(36)}_${Math.trunc(Number(`0.${Date.now()}`) * 1e6).toString(36)}`,
        columnId: input.columnId,
        position: last ? last.position + 1 : 0,
        title: input.title,
        account: input.account,
        mrr: input.mrr,
        ownerName: input.ownerName,
        ownerColor: input.ownerColor,
        dueAt: input.dueAt,
        labels: input.labels,
        notes: '',
        commentCount: 0
      })
      .returning()

    return row as BoardCard
  },

  async updateCard(id: string, patch: Partial<Omit<BoardCard, 'id' | 'position' | 'columnId'>>): Promise<BoardCard | undefined> {
    const [row] = await useDatabase()
      .update(schema.boardCards)
      .set(patch)
      .where(eq(schema.boardCards.id, id))
      .returning()
    return row as BoardCard | undefined
  },

  async deleteCard(id: string): Promise<boolean> {
    const rows = await useDatabase()
      .delete(schema.boardCards)
      .where(eq(schema.boardCards.id, id))
      .returning({ id: schema.boardCards.id })
    return rows.length > 0
  },

  /**
   * Applies a batch of position changes from `moveCard`.
   *
   * One statement per changed row, inside a transaction: a move that half-lands
   * would leave two cards claiming the same position, and the board would
   * render them in an arbitrary order until the next reload.
   */
  async applyCardPositions(changes: Array<{ id: string, columnId: string, position: number }>): Promise<void> {
    if (changes.length === 0) return

    const database = useDatabase()

    await database.transaction(async (tx) => {
      for (const change of changes) {
        await tx
          .update(schema.boardCards)
          .set({ columnId: change.columnId, position: change.position })
          .where(eq(schema.boardCards.id, change.id))
      }
    })
  },

  async createColumn(title: string, tone: BoardTone): Promise<BoardColumn> {
    const database = useDatabase()

    const [last] = await database
      .select({ position: schema.boardColumns.position })
      .from(schema.boardColumns)
      .orderBy(desc(schema.boardColumns.position))
      .limit(1)

    const [row] = await database
      .insert(schema.boardColumns)
      .values({
        id: `col_${Date.now().toString(36)}`,
        title,
        position: last ? last.position + 1 : 0,
        tone
      })
      .returning()

    return { ...row!, cards: [] }
  },

  async updateColumn(id: string, patch: { title?: string, tone?: BoardTone }): Promise<boolean> {
    const rows = await useDatabase()
      .update(schema.boardColumns)
      .set(patch)
      .where(eq(schema.boardColumns.id, id))
      .returning({ id: schema.boardColumns.id })
    return rows.length > 0
  },

  /** Cards go with it — the schema cascades, and an orphan card has nowhere to render. */
  async deleteColumn(id: string): Promise<boolean> {
    const database = useDatabase()
    await database.delete(schema.boardCards).where(eq(schema.boardCards.columnId, id))
    const rows = await database
      .delete(schema.boardColumns)
      .where(eq(schema.boardColumns.id, id))
      .returning({ id: schema.boardColumns.id })
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
