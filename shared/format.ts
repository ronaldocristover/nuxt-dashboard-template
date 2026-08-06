/**
 * Formatters shared by server and client so a figure looks identical whether
 * it was rendered during SSR or updated after a fetch.
 *
 * Change `LOCALE` and `CURRENCY` to localise every number in the template.
 */

export const LOCALE = 'en-US'
export const CURRENCY = 'USD'

const currencyFull = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 0
})

const currencyCents = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

const decimal = new Intl.NumberFormat(LOCALE)

const compact = new Intl.NumberFormat(LOCALE, {
  notation: 'compact',
  maximumFractionDigits: 1
})

const dateShort = new Intl.DateTimeFormat(LOCALE, {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
})

/** `$48,200`. Whole units — cents are noise on a dashboard. */
export function formatCurrency(value: number): string {
  return currencyFull.format(value)
}

/** `$48.20`. Used on invoices, where cents matter. */
export function formatCurrencyExact(value: number): string {
  return currencyCents.format(value)
}

/** `$48.2K`. For axis ticks and other tight spaces. */
export function formatCurrencyCompact(value: number): string {
  return `${CURRENCY === 'USD' ? '$' : ''}${compact.format(value)}`
}

export function formatNumber(value: number): string {
  return decimal.format(value)
}

export function formatPercent(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits)}%`
}

/** Always carries an explicit sign, because the sign is the point. */
export function formatSigned(value: number, fractionDigits = 1): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${Math.abs(value).toFixed(fractionDigits)}%`
}

export function formatSignedCurrency(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${currencyFull.format(Math.abs(value))}`
}

export function formatDate(value: string | Date): string {
  return dateShort.format(new Date(value))
}

/** `3 hours ago`. Computed server-side and shipped as a string. */
export function formatRelative(value: string | Date, now: Date = new Date()): string {
  const then = new Date(value).getTime()
  const seconds = Math.round((now.getTime() - then) / 1000)

  if (seconds < 60) return 'just now'

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['minute', 60],
    ['hour', 3600],
    ['day', 86400],
    ['week', 604800],
    ['month', 2629800],
    ['year', 31557600]
  ]

  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' })
  let chosen: [Intl.RelativeTimeFormatUnit, number] = units[0]!

  for (const unit of units) {
    if (seconds >= unit[1]) chosen = unit
  }

  return rtf.format(-Math.round(seconds / chosen[1]), chosen[0])
}

/** Routes a `Metric` to the right formatter using its own `format` field. */
export function formatMetric(value: number, format: 'currency' | 'number' | 'percent'): string {
  if (format === 'currency') return formatCurrency(value)
  if (format === 'percent') return formatPercent(value)
  return formatNumber(value)
}

/** `AC` from `Acme Corp`. Falls back to the first character. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase()
}
