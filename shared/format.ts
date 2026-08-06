/**
 * Locale-aware formatters, as pure functions.
 *
 * Every one takes the locale explicitly rather than reading a global, so the
 * same call renders identically during SSR and after hydration. In components,
 * reach for `useFormat()` instead — it binds these to the active locale so you
 * are not passing it through every call site.
 *
 * Currency is deliberately NOT tied to the locale. What a business bills in is
 * a property of the business, not of the language its staff read. Change
 * `CURRENCY` to bill in something other than USD; the number formatting still
 * follows the reader's locale.
 */

export const CURRENCY = 'USD'

export type SupportedLocale = 'en' | 'id' | 'zh-Hans' | 'zh-Hant'

/** BCP 47 tags for `Intl`. The i18n codes above are not all valid on their own. */
const INTL_TAGS: Record<string, string> = {
  'en': 'en-US',
  'id': 'id-ID',
  'zh-Hans': 'zh-Hans-CN',
  'zh-Hant': 'zh-Hant-TW'
}

export function intlTag(locale: string): string {
  return INTL_TAGS[locale] ?? locale
}

/**
 * `Intl` constructors are expensive enough that rebuilding one per cell of a
 * 100-row table is measurable. Cache by locale plus a kind key.
 */
const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>()

function numberFormat(locale: string, kind: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}:n:${kind}`
  let formatter = cache.get(key) as Intl.NumberFormat | undefined
  if (!formatter) {
    formatter = new Intl.NumberFormat(intlTag(locale), options)
    cache.set(key, formatter)
  }
  return formatter
}

function dateFormat(locale: string, kind: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}:d:${kind}`
  let formatter = cache.get(key) as Intl.DateTimeFormat | undefined
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(intlTag(locale), options)
    cache.set(key, formatter)
  }
  return formatter
}

/** `$48,200`. Whole units — cents are noise on a dashboard. */
export function formatCurrency(value: number, locale: string): string {
  return numberFormat(locale, 'cur', {
    style: 'currency',
    currency: CURRENCY,
    maximumFractionDigits: 0
  }).format(value)
}

/** `$48.20`. Used on invoices, where cents matter. */
export function formatCurrencyExact(value: number, locale: string): string {
  return numberFormat(locale, 'curExact', {
    style: 'currency',
    currency: CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

/** `$48.2K`. For axis ticks and other tight spaces. */
export function formatCurrencyCompact(value: number, locale: string): string {
  return numberFormat(locale, 'curCompact', {
    style: 'currency',
    currency: CURRENCY,
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value)
}

export function formatNumber(value: number, locale: string): string {
  return numberFormat(locale, 'dec', {}).format(value)
}

export function formatPercent(value: number, locale: string, fractionDigits = 1): string {
  return numberFormat(locale, `pct${fractionDigits}`, {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(value / 100)
}

/** Always carries an explicit sign, because the sign is the point. */
export function formatSigned(value: number, locale: string, fractionDigits = 1): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${formatPercent(Math.abs(value), locale, fractionDigits)}`
}

export function formatSignedCurrency(value: number, locale: string): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${formatCurrency(Math.abs(value), locale)}`
}

export function formatDate(value: string | Date, locale: string): string {
  return dateFormat(locale, 'short', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(value))
}

/**
 * `3 hours ago`, in the reader's language.
 *
 * `now` is passed in rather than read from the clock so the server and the
 * client agree. Every API response that carries timestamps also carries the
 * moment it was generated; format against that and hydration cannot drift.
 */
export function formatRelative(value: string | Date, now: string | Date, locale: string): string {
  const then = new Date(value).getTime()
  const reference = new Date(now).getTime()
  const seconds = Math.round((reference - then) / 1000)

  const rtf = new Intl.RelativeTimeFormat(intlTag(locale), { numeric: 'auto' })

  if (Math.abs(seconds) < 60) {
    // `numeric: 'auto'` turns 0 seconds into "now" in every locale we ship.
    return rtf.format(0, 'second')
  }

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['minute', 60],
    ['hour', 3600],
    ['day', 86400],
    ['week', 604800],
    ['month', 2629800],
    ['year', 31557600]
  ]

  let chosen: [Intl.RelativeTimeFormatUnit, number] = units[0]!
  for (const unit of units) {
    if (Math.abs(seconds) >= unit[1]) chosen = unit
  }

  return rtf.format(-Math.round(seconds / chosen[1]), chosen[0])
}

/** Routes a `Metric` to the right formatter using its own `format` field. */
export function formatMetric(
  value: number,
  format: 'currency' | 'number' | 'percent',
  locale: string
): string {
  if (format === 'currency') return formatCurrency(value, locale)
  if (format === 'percent') return formatPercent(value, locale)
  return formatNumber(value, locale)
}

/**
 * `AC` from `Acme Corp`.
 *
 * Latin-only by design: for a script without a case distinction, such as Han,
 * the first character already reads as an abbreviation and slicing two of them
 * looks wrong. Falls back to the first character.
 */
export function initials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'

  // Latin letters, digits, spaces and common punctuation. Anything outside
  // that — Han, Cyrillic, Arabic — takes the single-character branch.
  if (!/^[A-Za-z\u00C0-\u024F0-9\s.,'’&()-]+$/.test(trimmed)) {
    return [...trimmed][0]!
  }

  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase()
}
