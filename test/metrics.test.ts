import { describe, expect, it } from 'vitest'
import { db } from '~~/server/utils/db'
import { buildAnalytics, buildMovement, buildMrrSeries, buildOverviewMetrics } from '~~/server/utils/metrics'

const NOW = new Date('2026-08-06T12:00:00.000Z')

describe('MRR movement reconciles', () => {
  it('balances exactly: opening + gains − losses === closing', () => {
    // This is the property that makes the waterfall trustworthy. If it drifts,
    // the chart shows four bars that do not add up to the headline figure and
    // the whole dashboard stops being defensible.
    const m = buildMovement()
    expect(m.starting + m.new + m.expansion - m.contraction - m.churn).toBe(m.ending)
  })

  it('reports gains and losses as positive magnitudes', () => {
    // Direction is carried by the field name, not by the sign — the component
    // negates the losses when it draws them.
    const m = buildMovement()
    for (const value of [m.new, m.expansion, m.contraction, m.churn]) {
      expect(value).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('every headline figure agrees with the others', () => {
  it('headline MRR equals the MRR actually held by subscribers', () => {
    // The bug this locks down: a seeded history that ended at a different
    // number from the sum of the rows, so the donut and the KPI disagreed.
    const mrr = buildOverviewMetrics().find(metric => metric.key === 'mrr')!.value
    const held = db.subscribers().reduce((sum, row) => sum + row.mrr, 0)
    expect(mrr).toBe(held)
  })

  it('the trend series ends on the headline figure', () => {
    const mrr = buildOverviewMetrics().find(metric => metric.key === 'mrr')!.value
    const series = buildMrrSeries(NOW)
    expect(series.at(-1)!.value).toBe(mrr)
  })

  it('the plan mix totals the headline figure', () => {
    const mrr = buildOverviewMetrics().find(metric => metric.key === 'mrr')!.value
    const mix = buildAnalytics('30d', NOW).planMix.reduce((sum, slice) => sum + slice.value, 0)
    expect(mix).toBe(mrr)
  })

  it('churned accounts contribute nothing', () => {
    for (const row of db.subscribers()) {
      if (row.status === 'churned') expect(row.mrr).toBe(0)
    }
  })
})

describe('metrics carry keys, not prose', () => {
  it('sends no display text the client would have to translate', () => {
    for (const metric of buildOverviewMetrics()) {
      expect(metric).not.toHaveProperty('label')
      expect(metric).not.toHaveProperty('hint')
      expect(metric.key).toBeTruthy()
    }
  })

  it('marks churn as a metric where rising is bad', () => {
    // Drives whether the delta is painted green or red. Getting this wrong
    // congratulates someone on losing revenue.
    const metrics = buildOverviewMetrics()
    expect(metrics.find(m => m.key === 'churn')!.riseIsGood).toBe(false)
    expect(metrics.find(m => m.key === 'mrr')!.riseIsGood).toBe(true)
  })
})

describe('analytics ranges', () => {
  it('returns one point per day for day ranges', () => {
    expect(buildAnalytics('7d', NOW).revenue).toHaveLength(7)
    expect(buildAnalytics('30d', NOW).revenue).toHaveLength(30)
    expect(buildAnalytics('90d', NOW).revenue).toHaveLength(90)
  })

  it('switches to months for the trailing year', () => {
    const yearly = buildAnalytics('12m', NOW)
    expect(yearly.revenue).toHaveLength(12)
    expect(yearly.granularity).toBe('month')
  })

  it('sends timestamps, never printed labels', () => {
    // Month and day names differ per language, so the client builds them.
    for (const point of buildAnalytics('30d', NOW).revenue) {
      expect(point).not.toHaveProperty('label')
      expect(Number.isNaN(Date.parse(point.at))).toBe(false)
    }
  })

  it('buckets signups weekly beyond a week, daily within one', () => {
    expect(buildAnalytics('7d', NOW).signupsGranularity).toBe('day')
    expect(buildAnalytics('30d', NOW).signupsGranularity).toBe('week')
  })

  it('sends channels as keys so they can be translated', () => {
    const keys = buildAnalytics('30d', NOW).channels.map(channel => channel.key)
    expect(keys).toEqual(['organic', 'direct', 'referral', 'partner', 'paidSocial'])
  })

  it('starts cohort retention at 100% in month zero', () => {
    const retention = buildAnalytics('30d', NOW).retention
    expect(retention[0]).toEqual({ month: 0, value: 100 })
    // Retention can only fall.
    for (let i = 1; i < retention.length; i++) {
      expect(retention[i]!.value).toBeLessThanOrEqual(retention[i - 1]!.value)
    }
  })
})

describe('the seed is deterministic', () => {
  it('produces the same figures on every call', () => {
    // A demo whose numbers move between renders looks broken in a screenshot.
    expect(buildMovement()).toEqual(buildMovement())
    expect(buildMrrSeries(NOW)).toEqual(buildMrrSeries(NOW))
  })
})
