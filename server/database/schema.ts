import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

/**
 * The database schema.
 *
 * Conventions used throughout, and the reasoning:
 *
 * - **Timestamps are ISO 8601 strings, not integers.** SQLite has no date type,
 *   and the API already speaks ISO strings. Storing epoch millis would mean
 *   converting at every boundary and losing readability in `sqlite3` sessions.
 * - **Money is an integer of whole currency units.** Floats and money do not mix;
 *   `0.1 + 0.2` is the reason. Switch to minor units (cents) if you need them —
 *   still an integer.
 * - **Booleans are integers**, because SQLite has no boolean. Drizzle's
 *   `{ mode: 'boolean' }` handles the conversion at the edge so application code
 *   never sees a 0 or 1.
 * - **Ids are the same text ids the in-memory store used** (`usr_0001`,
 *   `sub_0042`). Keeping them makes the demo data and every screenshot stable,
 *   and a text primary key costs nothing at this scale.
 */

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  // Stored already lowercased and trimmed by the Zod schema, so the unique
  // index below genuinely prevents duplicate accounts.
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['owner', 'admin', 'member'] }).notNull().default('admin'),
  jobTitle: text('job_title').notNull().default(''),
  company: text('company').notNull().default(''),
  timezone: text('timezone').notNull().default('Asia/Jakarta'),
  avatarColor: text('avatar_color').notNull(),
  createdAt: text('created_at').notNull(),
  emailVerifiedAt: text('email_verified_at'),
  twoFactorEnabled: integer('two_factor_enabled', { mode: 'boolean' }).notNull().default(false)
}, table => [
  uniqueIndex('users_email_unique').on(table.email)
])

export const subscribers = sqliteTable('subscribers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  company: text('company').notNull(),
  plan: text('plan', { enum: ['starter', 'growth', 'scale'] }).notNull(),
  status: text('status', { enum: ['active', 'trialing', 'past_due', 'churned'] }).notNull(),
  mrr: integer('mrr').notNull(),
  seats: integer('seats').notNull(),
  country: text('country').notNull(),
  avatarColor: text('avatar_color').notNull(),
  joinedAt: text('joined_at').notNull(),
  lastSeenAt: text('last_seen_at').notNull()
}, table => [
  // The list is filtered by these two and sorted by mrr on nearly every request.
  index('subscribers_status_idx').on(table.status),
  index('subscribers_plan_idx').on(table.plan),
  index('subscribers_mrr_idx').on(table.mrr)
])

export const activity = sqliteTable('activity', {
  id: text('id').primaryKey(),
  kind: text('kind', {
    enum: ['signup', 'upgrade', 'downgrade', 'churn', 'payment', 'invite']
  }).notNull(),
  actor: text('actor').notNull(),
  company: text('company').notNull(),
  plan: text('plan', { enum: ['starter', 'growth', 'scale'] }).notNull(),
  amount: integer('amount'),
  at: text('at').notNull()
}, table => [
  index('activity_at_idx').on(table.at)
])

export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey(),
  number: text('number').notNull(),
  subscriber: text('subscriber').notNull(),
  amount: integer('amount').notNull(),
  status: text('status', { enum: ['paid', 'open', 'failed'] }).notNull(),
  issuedAt: text('issued_at').notNull()
}, table => [
  index('invoices_issued_at_idx').on(table.issuedAt)
])

export const teamMembers = sqliteTable('team_members', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: text('role', { enum: ['owner', 'admin', 'member'] }).notNull(),
  status: text('status', { enum: ['active', 'invited'] }).notNull(),
  avatarColor: text('avatar_color').notNull(),
  lastSeenAt: text('last_seen_at')
}, table => [
  uniqueIndex('team_members_email_unique').on(table.email)
])

/**
 * Revenue history, one row per period.
 *
 * `kind` separates the monthly MRR walk from the daily revenue series so both
 * can live in one table without a join — they are read independently and never
 * together.
 */
export const revenueHistory = sqliteTable('revenue_history', {
  kind: text('kind', { enum: ['month', 'day'] }).notNull(),
  // Sequence rather than a date: the series is relative to "now", and the seed
  // owns what index 0 means. 0 is the oldest.
  seq: integer('seq').notNull(),
  value: integer('value').notNull()
}, table => [
  uniqueIndex('revenue_history_kind_seq').on(table.kind, table.seq)
])

/**
 * Notification preferences.
 *
 * One row per user in a real product. Here it is keyed by user id with the
 * demo owner as the only row, which keeps the shape right for when you add
 * per-user settings without pretending to support them yet.
 */
export const notificationPrefs = sqliteTable('notification_prefs', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  productUpdates: integer('product_updates', { mode: 'boolean' }).notNull().default(true),
  weeklyDigest: integer('weekly_digest', { mode: 'boolean' }).notNull().default(true),
  paymentFailures: integer('payment_failures', { mode: 'boolean' }).notNull().default(true),
  churnAlerts: integer('churn_alerts', { mode: 'boolean' }).notNull().default(true),
  newSignups: integer('new_signups', { mode: 'boolean' }).notNull().default(false),
  channel: text('channel', { enum: ['email', 'slack', 'both'] }).notNull().default('email')
})

/**
 * Single-use, time-limited credentials: password resets, email confirmations
 * and two-step codes.
 *
 * These were in a `Map` before, which meant every restart signed everyone's
 * pending flows out and nothing worked across more than one instance. In a
 * table they survive both.
 *
 * The token itself is the primary key for resets and confirmations. Two-step
 * codes are keyed by user instead — one live code per account, so asking for a
 * new one invalidates the old.
 */
export const authTokens = sqliteTable('auth_tokens', {
  id: text('id').primaryKey(),
  kind: text('kind', { enum: ['reset', 'verify', 'two_factor'] }).notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  /** The code, for two-step. Null for tokens, where the id *is* the secret. */
  code: text('code'),
  expiresAt: text('expires_at').notNull(),
  /** Guess counter. Five wrong two-step codes burn the whole attempt. */
  attempts: integer('attempts').notNull().default(0)
}, table => [
  index('auth_tokens_user_kind_idx').on(table.userId, table.kind)
])

/**
 * Kanban board — the renewal pipeline.
 *
 * Columns are rows, not an enum, because a team's stages are theirs to name.
 * `position` is a plain integer, densely packed and rewritten on every move
 * within the affected columns. Fractional indexing would avoid those writes,
 * but a board has tens of cards, not thousands, and "the numbers are 0,1,2…"
 * is a property you can check by eye when something goes wrong.
 */
export const boardColumns = sqliteTable('board_columns', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  position: integer('position').notNull(),
  /** Accent for the column header. Maps to the movement palette. */
  tone: text('tone', { enum: ['risk', 'progress', 'neutral', 'won', 'lost'] }).notNull().default('neutral')
}, table => [
  index('board_columns_position_idx').on(table.position)
])

export const boardCards = sqliteTable('board_cards', {
  id: text('id').primaryKey(),
  columnId: text('column_id').notNull().references(() => boardColumns.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  title: text('title').notNull(),
  account: text('account').notNull(),
  /** MRR at stake, in whole currency units. The figure the board exists for. */
  mrr: integer('mrr').notNull().default(0),
  ownerName: text('owner_name').notNull(),
  ownerColor: text('owner_color').notNull(),
  /** Renewal date. Null for cards not yet dated. */
  dueAt: text('due_at'),
  /** Risk tags. JSON because SQLite has no array type. */
  labels: text('labels', { mode: 'json' }).$type<string[]>().notNull().default([]),
  notes: text('notes').notNull().default(''),
  commentCount: integer('comment_count').notNull().default(0)
}, table => [
  // Every read is "cards of this column, in order".
  index('board_cards_column_position_idx').on(table.columnId, table.position)
])
