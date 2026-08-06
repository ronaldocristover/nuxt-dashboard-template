import { describe, expect, it } from 'vitest'
import { monotonePath, niceTicks, thinLabels } from '~/utils/chart'

describe('niceTicks', () => {
  it('rounds outward to human numbers', () => {
    const ticks = niceTicks(0, 86945, 4)
    expect(ticks[0]).toBe(0)
    // The top tick must sit at or above the data, never below it.
    expect(ticks.at(-1)!).toBeGreaterThanOrEqual(86945)
    // Evenly spaced, so the gridlines are not lying about scale.
    const step = ticks[1]! - ticks[0]!
    for (let i = 1; i < ticks.length; i++) {
      expect(ticks[i]! - ticks[i - 1]!).toBeCloseTo(step, 6)
    }
  })

  it('survives a flat series', () => {
    // A chart of identical values must not divide by a zero span.
    const ticks = niceTicks(50, 50)
    expect(ticks.length).toBeGreaterThanOrEqual(2)
    expect(ticks.every(Number.isFinite)).toBe(true)
  })

  it('survives non-finite input', () => {
    expect(niceTicks(Number.NaN, Number.NaN).every(Number.isFinite)).toBe(true)
  })

  it('produces no float drift in the labels', () => {
    // `0.30000000000000004` on an axis is the classic giveaway.
    for (const tick of niceTicks(0, 1, 4)) {
      expect(String(tick)).not.toMatch(/0{6,}\d|9{6,}\d/)
    }
  })
})

describe('monotonePath', () => {
  it('returns nothing for an empty series', () => {
    expect(monotonePath([])).toBe('')
  })

  it('returns a bare move for one point', () => {
    expect(monotonePath([{ x: 1, y: 2 }])).toBe('M 1 2')
  })

  it('starts at the first point and ends at the last', () => {
    const points = [{ x: 0, y: 10 }, { x: 10, y: 5 }, { x: 20, y: 8 }]
    const path = monotonePath(points)
    expect(path.startsWith('M 0 10')).toBe(true)
    expect(path.endsWith('20 8')).toBe(true)
  })

  it('flattens the tangent at a local extremum', () => {
    // This is why monotone and not plain cubic: an overshooting curve would
    // dip below a value the data never reached, which invents revenue.
    const path = monotonePath([{ x: 0, y: 10 }, { x: 10, y: 0 }, { x: 20, y: 10 }])
    const numbers = path.match(/-?\d+(\.\d+)?/g)!.map(Number)
    // Nothing in the control points may go below the minimum y of 0.
    expect(Math.min(...numbers)).toBeGreaterThanOrEqual(0)
  })
})

describe('thinLabels', () => {
  it('keeps everything when it fits', () => {
    expect(thinLabels(5, 10)).toEqual([0, 1, 2, 3, 4])
  })

  it('always keeps the first and last', () => {
    // An axis missing its endpoints cannot be read.
    const kept = thinLabels(90, 8)
    expect(kept[0]).toBe(0)
    expect(kept.at(-1)).toBe(89)
  })

  it('never exceeds the cap by more than the retained endpoint', () => {
    const kept = thinLabels(90, 8)
    expect(kept.length).toBeLessThanOrEqual(9)
  })
})
