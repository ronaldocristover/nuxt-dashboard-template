/**
 * Small maths helpers shared by the SVG charts. Kept out of the components so
 * the drawing code stays about drawing.
 */

/**
 * Rounds a domain outward to human numbers (10, 25, 50, 100, …) and returns
 * evenly spaced ticks across it.
 *
 * Axis labels people can read beat labels that fit the data exactly.
 */
export function niceTicks(min: number, max: number, count = 4): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
    const base = Number.isFinite(max) ? max : 0
    return [base, base + 1]
  }

  const rawStep = (max - min) / count
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const normalised = rawStep / magnitude
  const step = (normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10) * magnitude

  const start = Math.floor(min / step) * step
  const end = Math.ceil(max / step) * step

  const ticks: number[] = []
  for (let value = start; value <= end + step / 2; value += step) {
    // Guard against float drift producing -0 or 0.30000000000000004.
    ticks.push(Number(value.toFixed(6)))
  }

  return ticks
}

/**
 * Builds a monotone cubic path through the points.
 *
 * Monotone rather than plain cubic because a revenue line must never dip below
 * a value it did not actually reach — an overshooting curve invents data.
 */
export function monotonePath(points: Array<{ x: number, y: number }>): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y}`

  const n = points.length
  const slopes: number[] = []
  const secants: number[] = []

  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1]!.x - points[i]!.x
    secants.push(dx === 0 ? 0 : (points[i + 1]!.y - points[i]!.y) / dx)
  }

  slopes[0] = secants[0]!
  for (let i = 1; i < n - 1; i++) {
    const previous = secants[i - 1]!
    const next = secants[i]!
    // A sign change means a local extremum; flatten so the curve turns there.
    slopes[i] = previous * next <= 0 ? 0 : (previous + next) / 2
  }
  slopes[n - 1] = secants[n - 2]!

  // Clamp each tangent to three times the neighbouring secant (Fritsch–Carlson).
  for (let i = 0; i < n - 1; i++) {
    const secant = secants[i]!
    if (secant === 0) {
      slopes[i] = 0
      slopes[i + 1] = 0
      continue
    }
    const alpha = slopes[i]! / secant
    const beta = slopes[i + 1]! / secant
    const magnitude = Math.hypot(alpha, beta)
    if (magnitude > 3) {
      slopes[i] = (3 / magnitude) * alpha * secant
      slopes[i + 1] = (3 / magnitude) * beta * secant
    }
  }

  let path = `M ${points[0]!.x} ${points[0]!.y}`

  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1]!.x - points[i]!.x
    const c1x = points[i]!.x + dx / 3
    const c1y = points[i]!.y + (slopes[i]! * dx) / 3
    const c2x = points[i + 1]!.x - dx / 3
    const c2y = points[i + 1]!.y - (slopes[i + 1]! * dx) / 3
    path += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${points[i + 1]!.x} ${points[i + 1]!.y}`
  }

  return path
}

/** Thins a label list down to at most `max` entries, keeping first and last. */
export function thinLabels(count: number, max: number): number[] {
  if (count <= max) return Array.from({ length: count }, (_, i) => i)

  const stride = Math.ceil(count / max)
  const kept: number[] = []

  for (let i = 0; i < count; i += stride) kept.push(i)
  if (kept[kept.length - 1] !== count - 1) kept.push(count - 1)

  return kept
}
