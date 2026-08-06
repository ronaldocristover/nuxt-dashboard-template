import { describe, expect, it } from 'vitest'
import {
  computeAnalytics,
  computeMovement,
  computeMrrSeries,
  computeOverviewMetrics
} from '~~/server/utils/metrics'

const NOW = new Date('2026-08-06T12:00:00.000Z')

/**
 * A 24-month walk ending on a known figure, so assertions can be exact.
 * These are pure functions now — no database, no seed, no clock.
 */
const HISTORY = [
  41500, 43200, 44100, 46000, 47800, 49100, 51000, 52400,
  54380, 56100, 58000, 60800, 61650, 62550, 64750, 67900,
  69450, 72900, 75700, 77150, 79300, 81200, 83600, 86945
]

const STATS = { activeCount: 128, mrrTotal: 86945 }

describe('MRR movement reconciles', () => {
  it('balances exactly: opening + gains − losses === closing', () => {
    // The property that makes the waterfall trustworthy. If it drifts, the
    // chart shows four bars that do not add up to the headline figure and the
    // dashboard stops being defensible.
    const m = computeMovement(HISTORY)
    expect(m.starting + m.new + m.expansion - m.contraction - m.churn).toBe(m.ending)
  })

  it('reconciles for any history, not just the seeded one', () => {
    // Fuzzed, because the invariant must hold for real data too — including
    // months where revenue fell.
    for (let i = 0; i < 500; i++) {
      const starting = Math.floor(Math.random() * 500_000)
      const ending = Math.floor(Math.random() * 500_000)
      const m = computeMovement([starting, ending])
      expect(m.starting + m.new + m.expansion - m.contraction - m.churn).toBe(m.ending)
    }
  })

  it('reports gains and losses as positive magnitudes', () => {
    // Direction is carried by the field name, not the sign — the component
    // negates the losses when it draws them.
    const m = computeMovement(HISTORY)
    for (const value of [m.contraction, m.churn]) {
      expect(value).toBeGreaterThanOrEqual(0)
    }
  })

  it('does not divide by zero on an empty history', () => {
    expect(() => computeMovement([])).not.toThrow()
    expect(computeMovement([])).toMatchObject({ starting: 0, ending: 0 })
  })
})

describe('overview metrics', () => {
  it('reports the closing month as MRR', () => {
    const mrr = computeOverviewMetrics(HISTORY, STATS).find(m => m.key === 'mrr')!
    expect(mrr.value).toBe(86945)
  })

  it('ends the trend series on the same figure', () => {
    const mrr = computeOverviewMetrics(HISTORY, STATS).find(m => m.key === 'mrr')!.value
    expect(computeMrrSeries(HISTORY, NOW).at(-1)!.value).toBe(mrr)
  })

  it('marks churn as a metric where rising is bad', () => {
    // Drives whether the delta is painted green or red. Getting this wrong
    // congratulates someone on losing revenue.
    const metrics = computeOverviewMetrics(HISTORY, STATS)
    expect(metrics.find(m => m.key === 'churn')!.riseIsGood).toBe(false)
    expect(metrics.find(m => m.key === 'mrr')!.riseIsGood).toBe(true)
  })

  it('sends no display text the client would have to translate', () => {
    for (const metric of computeOverviewMetrics(HISTORY, STATS)) {
      expect(metric).not.toHaveProperty('label')
      expect(metric).not.toHaveProperty('hint')
      expect(metric.key).toBeTruthy()
    }
  })

  it('survives a brand-new account with no history', () => {
    // Day one of a real deployment: one month of data, or none.
    expect(() => computeOverviewMetrics([], { activeCount: 0, mrrTotal: 0 })).not.toThrow()
    const metrics = computeOverviewMetrics([], { activeCount: 0, mrrTotal: 0 })
    expect(metrics.every(m => Number.isFinite(m.value))).toBe(true)
    expect(metrics.every(m => Number.isFinite(m.delta))).toBe(true)
  })
})

describe('analytics ranges', () => {
  const daily = Array.from({ length: 90 }, (_, i) => 2000 + i * 10)
  const planMix = [
    { plan: 'starter' as const, value: 2000 },
    { plan: 'growth' as const, value: 30000 },
    { plan: 'scale' as const, value: 54945 }
  ]
  const data = { daily, monthly: HISTORY, planMix }

  it('returns one point per day for day ranges', () => {
    expect(computeAnalytics('7d', NOW, data).revenue).toHaveLength(7)
    expect(computeAnalytics('30d', NOW, data).revenue).toHaveLength(30)
    expect(computeAnalytics('90d', NOW, data).revenue).toHaveLength(90)
  })

  it('switches to months for the trailing year', () => {
    const yearly = computeAnalytics('12m', NOW, data)
    expect(yearly.revenue).toHaveLength(12)
    expect(yearly.granularity).toBe('month')
  })

  it('sends timestamps, never printed labels', () => {
    // Month and day names differ per language, so the client builds them.
    for (const point of computeAnalytics('30d', NOW, data).revenue) {
      expect(point).not.toHaveProperty('label')
      expect(Number.isNaN(Date.parse(point.at))).toBe(false)
    }
  })

  it('orders points oldest first', () => {
    const points = computeAnalytics('30d', NOW, data).revenue
    for (let i = 1; i < points.length; i++) {
      expect(Date.parse(points[i]!.at)).toBeGreaterThan(Date.parse(points[i - 1]!.at))
    }
  })

  it('buckets signups weekly beyond a week, daily within one', () => {
    expect(computeAnalytics('7d', NOW, data).signupsGranularity).toBe('day')
    expect(computeAnalytics('30d', NOW, data).signupsGranularity).toBe('week')
  })

  it('sends channels as keys so they can be translated', () => {
    const keys = computeAnalytics('30d', NOW, data).channels.map(channel => channel.key)
    expect(keys).toEqual(['organic', 'direct', 'referral', 'partner', 'paidSocial'])
  })

  it('passes the plan mix through untouched', () => {
    expect(computeAnalytics('30d', NOW, data).planMix).toEqual(planMix)
  })

  it('starts cohort retention at 100% and only falls', () => {
    const retention = computeAnalytics('30d', NOW, data).retention
    expect(retention[0]).toEqual({ month: 0, value: 100 })
    for (let i = 1; i < retention.length; i++) {
      expect(retention[i]!.value).toBeLessThanOrEqual(retention[i - 1]!.value)
    }
  })

  it('copes with a range wider than the data it has', () => {
    // A two-week-old deployment asked for 90 days.
    const thin = { daily: [1000, 1100], monthly: [5000], planMix }
    expect(() => computeAnalytics('90d', NOW, thin)).not.toThrow()
    expect(computeAnalytics('90d', NOW, thin).revenue).toHaveLength(2)
  })
})
