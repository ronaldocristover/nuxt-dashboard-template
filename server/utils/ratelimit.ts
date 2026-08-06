import type { H3Event } from 'h3'

/**
 * Fixed-window rate limiter for the auth routes, held in process memory.
 *
 * Good enough to blunt credential stuffing against a single instance. Behind a
 * load balancer or on serverless, move the counter to Redis or your platform's
 * rate limiter — the `limit()` signature can stay the same.
 */

interface Window {
  count: number
  resetAt: number
}

const windows = new Map<string, Window>()

/** Sweep expired windows occasionally so the map cannot grow without bound. */
function sweep(now: number) {
  if (windows.size < 5_000) return
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key)
  }
}

function clientIp(event: H3Event): string {
  const forwarded = getRequestHeader(event, 'x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  return getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
}

/**
 * Throws 429 once `max` requests share a `scope` within `windowMs`.
 * The response carries `Retry-After` so clients can back off properly.
 */
export function limit(event: H3Event, scope: string, max = 8, windowMs = 60_000): void {
  const now = Date.now()
  sweep(now)

  const key = `${scope}:${clientIp(event)}`
  const window = windows.get(key)

  if (!window || window.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs })
    return
  }

  window.count++

  if (window.count > max) {
    const retryAfter = Math.ceil((window.resetAt - now) / 1000)
    setResponseHeader(event, 'Retry-After', retryAfter)
    throw createError({
      statusCode: 429,
      statusMessage: `Too many attempts. Try again in ${retryAfter} seconds.`
    })
  }
}
