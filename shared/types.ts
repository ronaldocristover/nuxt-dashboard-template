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
  /** Preformatted on the server so relative labels can't drift at hydration. */
  lastSeenLabel: string
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

export interface SeriesPoint {
  label: string
  value: number
}

export interface DualSeriesPoint {
  label: string
  primary: number
  secondary: number
}

export interface Metric {
  key: string
  label: string
  value: number
  /** Percentage change against the previous period. */
  delta: number
  format: 'currency' | 'number' | 'percent'
  /** Whether a rise is good news. Churn rate rising is not. */
  riseIsGood: boolean
  hint: string
  sparkline: number[]
}

export interface ActivityEvent {
  id: string
  kind: 'signup' | 'upgrade' | 'downgrade' | 'churn' | 'payment' | 'invite'
  actor: string
  description: string
  amount?: number
  at: string
  atLabel: string
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
  signupsVsChurn: DualSeriesPoint[]
  planMix: Array<{ label: string, value: number, plan: Plan }>
  channels: SeriesPoint[]
  retention: SeriesPoint[]
}

export interface SubscribersResponse {
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
  lastSeenLabel: string
}

export interface NotificationPreferences {
  productUpdates: boolean
  weeklyDigest: boolean
  paymentFailures: boolean
  churnAlerts: boolean
  newSignups: boolean
  channel: 'email' | 'slack' | 'both'
}
