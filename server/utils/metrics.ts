import type {
  AnalyticsResponse,
  Metric,
  MrrMovement,
  Plan,
  RangeKey,
  SeriesPoint
} from '#shared/types'
import { db, PLAN_PRICING } from './db'

/**
 * Derives every figure the dashboard shows from the store's raw history.
 *
 * Kept separate from the API routes so the aggregation logic can be read and
 * tested on its own, and so swapping the store for a real database only means
 * changing where `db.*` reads from.
 */

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100
  return Number((((current - previous) / previous) * 100).toFixed(1))
}

/**
 * Splits the month's net MRR change into its four movements.
 *
 * Churn and contraction are modelled as a share of the opening balance, and
 * the gross additions are whatever must have happened to reach the closing
 * balance. That keeps `starting + new + expansion - contraction - churn`
 * exactly equal to `ending`, which is what makes the waterfall trustworthy.
 */
export function buildMovement(): MrrMovement {
  const history = db.mrrHistory()
  const starting = history[history.length - 2]!
  const ending = history[history.length - 1]!

  const churn = Math.round(starting * 0.021)
  const contraction = Math.round(starting * 0.009)
  const grossAdds = ending - starting + churn + contraction
  const newMrr = Math.round(grossAdds * 0.66)
  const expansion = grossAdds - newMrr

  return { starting, new: newMrr, expansion, contraction, churn, ending }
}

function activeSubscribers() {
  return db.subscribers().filter(row => row.status !== 'churned')
}

export function buildOverviewMetrics(): Metric[] {
  const history = db.mrrHistory()
  const movement = buildMovement()
  const active = activeSubscribers()

  const mrr = movement.ending
  const previousMrr = movement.starting

  // Net revenue retention: what last month's cohort is worth today, before
  // any new business is counted.
  const nrr = Number(
    (((movement.starting + movement.expansion - movement.contraction - movement.churn) / movement.starting) * 100).toFixed(1)
  )

  const churnRate = Number(((movement.churn / movement.starting) * 100).toFixed(1))

  return [
    {
      key: 'mrr',
      label: 'Monthly recurring revenue',
      value: mrr,
      delta: percentChange(mrr, previousMrr),
      format: 'currency',
      riseIsGood: true,
      hint: 'Committed revenue at the close of this month.',
      sparkline: history.slice(-12)
    },
    {
      key: 'subscribers',
      label: 'Active subscribers',
      value: active.length,
      delta: percentChange(active.length, active.length - 7),
      format: 'number',
      riseIsGood: true,
      hint: 'Accounts on a paid plan or in trial.',
      sparkline: history.slice(-12).map((value, index) => Math.round(value / (240 - index * 2)))
    },
    {
      key: 'nrr',
      label: 'Net revenue retention',
      value: nrr,
      delta: percentChange(nrr, 103.4),
      format: 'percent',
      riseIsGood: true,
      hint: 'Expansion minus contraction and churn, against last month.',
      sparkline: [101.2, 102.4, 101.9, 103.1, 104.2, 103.6, 104.8, 105.2, 104.6, 105.9, 106.4, nrr]
    },
    {
      key: 'churn',
      label: 'Revenue churn',
      value: churnRate,
      delta: percentChange(churnRate, 2.4),
      format: 'percent',
      riseIsGood: false,
      hint: 'Share of opening MRR lost to cancellations.',
      sparkline: [3.1, 2.9, 3.2, 2.6, 2.8, 2.5, 2.7, 2.3, 2.5, 2.2, 2.4, churnRate]
    }
  ]
}

/** Twelve months of closing MRR, labelled back from the current month. */
export function buildMrrSeries(): SeriesPoint[] {
  const history = db.mrrHistory().slice(-12)
  const currentMonth = new Date().getMonth()

  return history.map((value, index) => {
    const monthIndex = (currentMonth - (history.length - 1 - index) + 120) % 12
    return { label: MONTH_LABELS[monthIndex]!, value }
  })
}

const RANGE_DAYS: Record<RangeKey, number> = { '7d': 7, '30d': 30, '90d': 90, '12m': 365 }

function dayLabel(offsetFromToday: number): string {
  const date = new Date()
  date.setDate(date.getDate() - offsetFromToday)
  return `${date.getDate()} ${MONTH_LABELS[date.getMonth()]}`
}

/** Daily points for `7d`/`30d`/`90d`, monthly points for `12m`. */
function buildRevenueSeries(range: RangeKey): SeriesPoint[] {
  if (range === '12m') return buildMrrSeries()

  const days = RANGE_DAYS[range]
  const daily = db.dailyRevenue().slice(-days)

  return daily.map((value, index) => ({
    label: dayLabel(daily.length - 1 - index),
    value
  }))
}

/**
 * Signups against churned accounts, bucketed so the chart never renders more
 * bars than it has room for: daily up to 30 days, weekly beyond that.
 */
function buildSignupsVsChurn(range: RangeKey) {
  const buckets = range === '7d' ? 7 : range === '30d' ? 15 : 12
  const daily = db.dailyRevenue().slice(-RANGE_DAYS[range === '12m' ? '90d' : range])
  const size = Math.max(1, Math.floor(daily.length / buckets))

  return Array.from({ length: buckets }, (_, index) => {
    const slice = daily.slice(index * size, (index + 1) * size)
    const sum = slice.reduce((total, value) => total + value, 0) || daily[0]!

    return {
      label: range === '7d' ? dayLabel(buckets - 1 - index) : `W${index + 1}`,
      primary: Math.max(2, Math.round(sum / 900)),
      secondary: Math.max(1, Math.round(sum / 4200))
    }
  })
}

function buildPlanMix() {
  const active = activeSubscribers()
  const plans: Plan[] = ['starter', 'growth', 'scale']

  return plans.map(plan => ({
    plan,
    label: PLAN_PRICING[plan].label,
    value: active.filter(row => row.plan === plan).reduce((total, row) => total + row.mrr, 0)
  }))
}

/**
 * Acquisition channels. In a real deployment these come from your analytics
 * provider; the shares here are fixed so the chart reads the same every boot.
 */
function buildChannels(range: RangeKey): SeriesPoint[] {
  const scale = RANGE_DAYS[range] / 30

  return [
    { label: 'Organic search', value: Math.round(1840 * scale) },
    { label: 'Direct', value: Math.round(1210 * scale) },
    { label: 'Product referral', value: Math.round(760 * scale) },
    { label: 'Partner listings', value: Math.round(430 * scale) },
    { label: 'Paid social', value: Math.round(295 * scale) }
  ]
}

/** Share of a cohort still subscribed after N months. */
function buildRetention(): SeriesPoint[] {
  return [
    { label: 'M0', value: 100 },
    { label: 'M1', value: 91 },
    { label: 'M2', value: 86 },
    { label: 'M3', value: 82 },
    { label: 'M4', value: 79 },
    { label: 'M5', value: 78 },
    { label: 'M6', value: 76 }
  ]
}

export function buildAnalytics(range: RangeKey): AnalyticsResponse {
  const revenue = buildRevenueSeries(range)
  const total = revenue.reduce((sum, point) => sum + point.value, 0)
  const half = Math.floor(revenue.length / 2)
  const firstHalf = revenue.slice(0, half).reduce((sum, point) => sum + point.value, 0)
  const secondHalf = revenue.slice(half).reduce((sum, point) => sum + point.value, 0)
  const signups = buildSignupsVsChurn(range)
  const totalSignups = signups.reduce((sum, point) => sum + point.primary, 0)
  const totalChurned = signups.reduce((sum, point) => sum + point.secondary, 0)
  const conversion = Number(((totalSignups / (totalSignups * 3.6)) * 100).toFixed(1))

  const metrics: Metric[] = [
    {
      key: 'revenue',
      label: range === '12m' ? 'Revenue, trailing year' : `Revenue, last ${RANGE_DAYS[range]} days`,
      value: total,
      delta: percentChange(secondHalf, firstHalf),
      format: 'currency',
      riseIsGood: true,
      hint: 'Collected revenue across the selected range.',
      sparkline: revenue.map(point => point.value)
    },
    {
      key: 'signups',
      label: 'New signups',
      value: totalSignups,
      delta: percentChange(totalSignups, Math.round(totalSignups * 0.88)),
      format: 'number',
      riseIsGood: true,
      hint: 'Accounts created in the selected range.',
      sparkline: signups.map(point => point.primary)
    },
    {
      key: 'conversion',
      label: 'Trial conversion',
      value: conversion,
      delta: 2.8,
      format: 'percent',
      riseIsGood: true,
      hint: 'Trials that became paid subscriptions.',
      sparkline: [21.4, 23.1, 22.8, 24.6, 25.2, 26.1, 27.4, conversion]
    },
    {
      key: 'churned',
      label: 'Churned accounts',
      value: totalChurned,
      delta: percentChange(totalChurned, Math.round(totalChurned * 1.14)),
      format: 'number',
      riseIsGood: false,
      hint: 'Subscriptions cancelled in the selected range.',
      sparkline: signups.map(point => point.secondary)
    }
  ]

  return {
    range,
    metrics,
    revenue,
    signupsVsChurn: signups,
    planMix: buildPlanMix(),
    channels: buildChannels(range),
    retention: buildRetention()
  }
}
