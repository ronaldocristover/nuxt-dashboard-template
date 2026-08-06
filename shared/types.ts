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

export interface TeamMember {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'member'
  status: 'active' | 'invited'
  avatarColor: string
  /** `null` while an invitation is still outstanding. */
  lastSeenAt: string | null
}

export interface NotificationPreferences {
  productUpdates: boolean
  weeklyDigest: boolean
  paymentFailures: boolean
  churnAlerts: boolean
  newSignups: boolean
  channel: 'email' | 'slack' | 'both'
}
