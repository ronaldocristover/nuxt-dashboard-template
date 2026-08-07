/**
 * Types shared by the Nuxt app and the Nitro server.
 *
 * These describe the API contract. Swapping the demo store in
 * `server/utils/db.ts` for a real database means keeping these shapes —
 * no page or component needs to change.
 */

export type Plan = 'starter' | 'growth' | 'scale'

export type SubscriberStatus = 'active' | 'trialing' | 'past_due' | 'churned'

export interface User {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'member'
  jobTitle: string
  company: string
  timezone: string
  avatarColor: string
  createdAt: string
  /** `null` until the address has been confirmed from an emailed link. */
  emailVerifiedAt: string | null
  /** When true, signing in only gets you a challenge, not a session. */
  twoFactorEnabled: boolean
}

/**
 * What `POST /api/auth/login` answers with.
 *
 * A password alone is not a session when two-step is on: the server stores a
 * pending challenge and the client is sent to `/two-factor`. `user` is absent
 * in that case, because nothing is authenticated yet.
 */
export interface SignInResult {
  requiresTwoFactor: boolean
  user: User | null
  /** Dev only — the code that would otherwise arrive by email. */
  devCode?: string
}

export interface Subscriber {
  id: string
  name: string
  email: string
  company: string
  plan: Plan
  status: SubscriberStatus
  /** Monthly recurring revenue in whole currency units. */
  mrr: number
  seats: number
  country: string
  avatarColor: string
  joinedAt: string
  lastSeenAt: string
}

/**
 * The four movements that turn last month's MRR into this month's.
 * `new + expansion` add, `contraction + churn` subtract.
 */
export interface MrrMovement {
  starting: number
  new: number
  expansion: number
  contraction: number
  churn: number
  ending: number
}

/**
 * A point carries a timestamp, not a printed label. Month and day names differ
 * per language, so the axis label is built on the client from `at` and the
 * response's `granularity`.
 */
export interface SeriesPoint {
  at: string
  value: number
}

export interface DualSeriesPoint {
  at: string
  primary: number
  secondary: number
}

export type Granularity = 'day' | 'week' | 'month'

/** Acquisition channels are a fixed set, so they travel as keys. */
export type ChannelKey = 'organic' | 'direct' | 'referral' | 'partner' | 'paidSocial'

export interface ChannelPoint {
  key: ChannelKey
  value: number
}

/** Months since a cohort signed up: 0 is the signup month. */
export interface RetentionPoint {
  month: number
  value: number
}

export interface Metric {
  /** Looked up in the `metrics.*` translations for its label and hint. */
  key: string
  value: number
  /** Percentage change against the previous period. */
  delta: number
  format: 'currency' | 'number' | 'percent'
  /** Whether a rise is good news. Churn rate rising is not. */
  riseIsGood: boolean
  sparkline: number[]
}

/**
 * The event carries its parts, not a sentence. The client composes the wording
 * so it can be written in the reader's language — a server-built string would
 * be stuck in whatever language the server chose.
 */
export interface ActivityEvent {
  id: string
  kind: 'signup' | 'upgrade' | 'downgrade' | 'churn' | 'payment' | 'invite'
  actor: string
  company: string
  plan: Plan
  amount?: number
  at: string
}

export interface Invoice {
  id: string
  number: string
  subscriber: string
  amount: number
  status: 'paid' | 'open' | 'failed'
  issuedAt: string
}

export interface OverviewResponse {
  /** The moment this payload was built. Relative times are measured from it,
      so the server and the client always agree on "3 hours ago". */
  generatedAt: string
  metrics: Metric[]
  movement: MrrMovement
  mrrSeries: SeriesPoint[]
  activity: ActivityEvent[]
  invoices: Invoice[]
}

export type RangeKey = '7d' | '30d' | '90d' | '12m'

export interface AnalyticsResponse {
  range: RangeKey
  metrics: Metric[]
  revenue: SeriesPoint[]
  /** How to label the revenue axis: daily ticks or monthly ones. */
  granularity: Granularity
  signupsVsChurn: DualSeriesPoint[]
  signupsGranularity: Granularity
  planMix: Array<{ plan: Plan, value: number }>
  channels: ChannelPoint[]
  retention: RetentionPoint[]
}

export interface SubscribersResponse {
  generatedAt: string
  rows: Subscriber[]
  total: number
  page: number
  pageSize: number
  /** Totals across the whole filtered set, not just the current page. */
  totals: { mrr: number, seats: number }
}

export type MemberRole = 'owner' | 'admin' | 'member'
export type MemberStatus = 'active' | 'invited'
export type MemberDepartment = 'revenue' | 'finance' | 'product' | 'support' | 'leadership'

export interface TeamMember {
  id: string
  name: string
  email: string
  role: MemberRole
  status: MemberStatus
  avatarColor: string
  /** `null` while an invitation is still outstanding. */
  lastSeenAt: string | null
  title: string
  department: MemberDepartment
  phone: string
  location: string
  timezone: string
  notes: string
  invitedBy: string
  joinedAt: string
}

/** One page of the member list, with the counts the filter bar shows. */
export interface MembersResponse {
  generatedAt: string
  rows: TeamMember[]
  total: number
  page: number
  pageSize: number
  counts: {
    all: number
    active: number
    invited: number
    byRole: Record<MemberRole, number>
  }
}

/** A renewal this member owns, for the detail page's Renewals tab. */
export interface MemberRenewal {
  id: string
  title: string
  account: string
  mrr: number
  dueAt: string | null
  columnTitle: string
  columnTone: 'risk' | 'progress' | 'neutral' | 'won' | 'lost'
}

/**
 * Everything the detail page needs, in one request.
 *
 * The tabs are rendered from one payload rather than fetching per tab: the
 * whole record is small, and four separate requests would make switching tabs
 * feel slower than it is.
 */
export interface MemberDetail {
  generatedAt: string
  member: TeamMember
  renewals: MemberRenewal[]
  renewalMrr: number
  /** Invoices raised against the accounts they own — the Billing tab's table. */
  invoices: Invoice[]
  /** Totals across every invoice above, not just the page shown. */
  invoiceTotals: { paid: number, open: number, failed: number }
  activity: ActivityEvent[]
  /** False when this is the only owner — the UI disables the moves that would strand the workspace. */
  canChangeRole: boolean
  canDelete: boolean
}

export interface NotificationPreferences {
  productUpdates: boolean
  weeklyDigest: boolean
  paymentFailures: boolean
  churnAlerts: boolean
  newSignups: boolean
  channel: 'email' | 'slack' | 'both'
}

// --- Kanban ------------------------------------------------------------------

export type BoardTone = 'risk' | 'progress' | 'neutral' | 'won' | 'lost'

/** Risk tags a renewal card can carry. Keys, so they translate. */
export type BoardLabel
  = | 'paymentFailed'
    | 'usageDown'
    | 'championLeft'
    | 'contractEnding'
    | 'priceObjection'
    | 'competitor'

export interface BoardCard {
  id: string
  columnId: string
  position: number
  title: string
  account: string
  /** MRR at stake, in whole currency units. */
  mrr: number
  ownerName: string
  ownerColor: string
  dueAt: string | null
  labels: BoardLabel[]
  notes: string
  commentCount: number
}

export interface BoardColumn {
  id: string
  title: string
  position: number
  tone: BoardTone
  cards: BoardCard[]
}

export interface BoardResponse {
  /** Relative due dates are measured from this, so SSR and hydration agree. */
  generatedAt: string
  columns: BoardColumn[]
}
