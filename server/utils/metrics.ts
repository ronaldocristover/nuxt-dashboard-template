import type {
  AnalyticsResponse,
  ChannelKey,
  DualSeriesPoint,
  Metric,
  MrrMovement,
  OverviewResponse,
  Plan,
  RangeKey,
  RetentionPoint,
  SeriesPoint
} from '#shared/types'
import { db } from './db'

/**
 * Derives every figure the dashboard shows.
 *
 * Split deliberately into two halves:
 *
 * - **Pure functions** (`computeMovement`, `computeOverviewMetrics`, …) take the
 *   raw series as arguments and return figures. No database, no clock beyond
 *   what is passed in — so the invariants below can be tested directly.
 * - **Loaders** (`buildOverview`, `buildAnalytics`) run the queries once and
 *   hand the results to those functions.
 *
 * Nothing here produces display text. Labels, units and month names differ by
 * language, so points carry timestamps and keys and the client renders the
 * wording. That is also what lets the language switch without a refetch.
 */

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100
  return Number((((current - previous) / previous) * 100).toFixed(1))
}

/**
 * Splits the month's net MRR change into its four movements.
 *
 * Churn and contraction are modelled as a share of the opening balance, and the
 * gross additions are whatever must have happened to reach the closing balance.
 * That keeps `starting + new + expansion - contraction - churn` exactly equal to
 * `ending`, which is what makes the waterfall trustworthy.
 */
export function computeMovement(history: number[]): MrrMovement {
  const starting = history[history.length - 2] ?? 0
  const ending = history[history.length - 1] ?? 0

  const churn = Math.round(starting * 0.021)
  const contraction = Math.round(starting * 0.009)
  const grossAdds = ending - starting + churn + contraction
  const newMrr = Math.round(grossAdds * 0.66)
  const expansion = grossAdds - newMrr

  return { starting, new: newMrr, expansion, contraction, churn, ending }
}

export function computeOverviewMetrics(
  history: number[],
  stats: { activeCount: number, mrrTotal: number }
): Metric[] {
  const movement = computeMovement(history)
  const mrr = movement.ending

  // Net revenue retention: what last month's cohort is worth today, before any
  // new business is counted.
  const nrr = movement.starting === 0
    ? 100
    : Number(
        (((movement.starting + movement.expansion - movement.contraction - movement.churn) / movement.starting) * 100).toFixed(1)
      )

  const churnRate = movement.starting === 0
    ? 0
    : Number(((movement.churn / movement.starting) * 100).toFixed(1))

  return [
    {
      key: 'mrr',
      value: mrr,
      delta: percentChange(mrr, movement.starting),
      format: 'currency',
      riseIsGood: true,
      sparkline: history.slice(-12)
    },
    {
      key: 'subscribers',
      value: stats.activeCount,
      delta: percentChange(stats.activeCount, stats.activeCount - 7),
      format: 'number',
      riseIsGood: true,
      sparkline: history.slice(-12).map((value, index) => Math.round(value / (240 - index * 2)))
    },
    {
      key: 'nrr',
      value: nrr,
      delta: percentChange(nrr, 103.4),
      format: 'percent',
      riseIsGood: true,
      sparkline: [101.2, 102.4, 101.9, 103.1, 104.2, 103.6, 104.8, 105.2, 104.6, 105.9, 106.4, nrr]
    },
    {
      key: 'churn',
      value: churnRate,
      delta: percentChange(churnRate, 2.4),
      format: 'percent',
      // Churn rising is bad news and must not be painted green.
      riseIsGood: false,
      sparkline: [3.1, 2.9, 3.2, 2.6, 2.8, 2.5, 2.7, 2.3, 2.5, 2.2, 2.4, churnRate]
    }
  ]
}

const DAY_MS = 86_400_000

/** Midnight UTC of the day `offset` days before `from`. */
function dayAt(from: Date, offset: number): string {
  const date = new Date(from.getTime() - offset * DAY_MS)
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString()
}

/** First of the month, `offset` months before `from`. */
function monthAt(from: Date, offset: number): string {
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() - offset, 1)).toISOString()
}

/** Twelve months of closing MRR, most recent last. */
export function computeMrrSeries(history: number[], now: Date): SeriesPoint[] {
  const recent = history.slice(-12)
  return recent.map((value, index) => ({
    at: monthAt(now, recent.length - 1 - index),
    value
  }))
}

const RANGE_DAYS: Record<RangeKey, number> = { '7d': 7, '30d': 30, '90d': 90, '12m': 365 }

function computeRevenueSeries(range: RangeKey, daily: number[], monthly: number[], now: Date): SeriesPoint[] {
  if (range === '12m') return computeMrrSeries(monthly, now)

  const window = daily.slice(-RANGE_DAYS[range])
  return window.map((value, index) => ({
    at: dayAt(now, window.length - 1 - index),
    value
  }))
}

/**
 * Signups against churned accounts, bucketed so the chart never renders more
 * bars than it has room for: daily over a week, weekly beyond that.
 */
function computeSignupsVsChurn(range: RangeKey, daily: number[], now: Date): DualSeriesPoint[] {
  const window = daily.slice(-RANGE_DAYS[range === '12m' ? '90d' : range])
  const buckets = range === '7d' ? 7 : range === '30d' ? 15 : 12
  const size = Math.max(1, Math.floor(window.length / buckets))

  return Array.from({ length: buckets }, (_, index) => {
    const slice = window.slice(index * size, (index + 1) * size)
    const total = slice.reduce((sum, value) => sum + value, 0) || window[0] || 0
    const daysBack = (buckets - 1 - index) * (range === '7d' ? 1 : size)

    return {
      at: dayAt(now, daysBack),
      primary: Math.max(2, Math.round(total / 900)),
      secondary: Math.max(1, Math.round(total / 4200))
    }
  })
}

/**
 * Acquisition channels. In a real deployment these come from your analytics
 * provider; the shares here are fixed so the chart reads the same every boot.
 */
function computeChannels(range: RangeKey) {
  const scale = RANGE_DAYS[range] / 30
  const base: Array<[ChannelKey, number]> = [
    ['organic', 1840],
    ['direct', 1210],
    ['referral', 760],
    ['partner', 430],
    ['paidSocial', 295]
  ]
  return base.map(([key, value]) => ({ key, value: Math.round(value * scale) }))
}

/** Share of a cohort still subscribed after N months. */
function computeRetention(): RetentionPoint[] {
  return [100, 91, 86, 82, 79, 78, 76].map((value, month) => ({ month, value }))
}

export function computeAnalytics(
  range: RangeKey,
  now: Date,
  data: { daily: number[], monthly: number[], planMix: Array<{ plan: Plan, value: number }> }
): AnalyticsResponse {
  const revenue = computeRevenueSeries(range, data.daily, data.monthly, now)
  const total = revenue.reduce((sum, point) => sum + point.value, 0)
  const half = Math.floor(revenue.length / 2)
  const firstHalf = revenue.slice(0, half).reduce((sum, point) => sum + point.value, 0)
  const secondHalf = revenue.slice(half).reduce((sum, point) => sum + point.value, 0)
  const signups = computeSignupsVsChurn(range, data.daily, now)
  const totalSignups = signups.reduce((sum, point) => sum + point.primary, 0)
  const totalChurned = signups.reduce((sum, point) => sum + point.secondary, 0)
  const conversion = Number(((totalSignups / (totalSignups * 3.6)) * 100).toFixed(1))

  const metrics: Metric[] = [
    {
      key: 'revenue',
      value: total,
      delta: percentChange(secondHalf, firstHalf),
      format: 'currency',
      riseIsGood: true,
      sparkline: revenue.map(point => point.value)
    },
    {
      key: 'signups',
      value: totalSignups,
      delta: percentChange(totalSignups, Math.round(totalSignups * 0.88)),
      format: 'number',
      riseIsGood: true,
      sparkline: signups.map(point => point.primary)
    },
    {
      key: 'conversion',
      value: conversion,
      delta: 2.8,
      format: 'percent',
      riseIsGood: true,
      sparkline: [21.4, 23.1, 22.8, 24.6, 25.2, 26.1, 27.4, conversion]
    },
    {
      key: 'churnedAccounts',
      value: totalChurned,
      delta: percentChange(totalChurned, Math.round(totalChurned * 1.14)),
      format: 'number',
      riseIsGood: false,
      sparkline: signups.map(point => point.secondary)
    }
  ]

  return {
    range,
    metrics,
    revenue,
    granularity: range === '12m' ? 'month' : 'day',
    signupsVsChurn: signups,
    signupsGranularity: range === '7d' ? 'day' : 'week',
    planMix: data.planMix,
    channels: computeChannels(range),
    retention: computeRetention()
  }
}

// --- Loaders -----------------------------------------------------------------

/**
 * One clock and one set of queries for the whole payload.
 *
 * `generatedAt` is what the client measures relative times against, so SSR and
 * hydration cannot disagree on "3 hours ago".
 */
export async function buildOverview(now: Date): Promise<OverviewResponse> {
  const [history, stats, activity, invoices] = await Promise.all([
    db.mrrHistory(),
    db.subscriberStats(),
    db.activity(8),
    db.invoices(6)
  ])

  return {
    generatedAt: now.toISOString(),
    metrics: computeOverviewMetrics(history, stats),
    movement: computeMovement(history),
    mrrSeries: computeMrrSeries(history, now),
    activity,
    invoices
  }
}

export async function buildAnalytics(range: RangeKey, now: Date): Promise<AnalyticsResponse> {
  const [daily, monthly, planMix] = await Promise.all([
    db.dailyRevenue(),
    db.mrrHistory(),
    db.planMix()
  ])

  return computeAnalytics(range, now, { daily, monthly, planMix })
}
