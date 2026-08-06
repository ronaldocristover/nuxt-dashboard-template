import type { Granularity } from '#shared/types'
import {
  formatCurrency,
  intlTag,
  formatCurrencyCompact,
  formatCurrencyExact,
  formatDate,
  formatMetric,
  formatNumber,
  formatPercent,
  formatRelative,
  formatSigned,
  formatSignedCurrency
} from '#shared/format'

/**
 * The formatters from `shared/format.ts`, bound to the active locale.
 *
 * Components call `fmt.currency(value)` and never think about locale. Because
 * the binding is a computed on `locale`, every figure on screen re-renders
 * when the language changes — no reload, no stale numbers.
 */
export function useFormat() {
  const { locale } = useI18n()

  return computed(() => {
    const tag = locale.value

    /**
     * Axis ticks. Day and month names are language-specific, so the chart is
     * handed a timestamp and builds the label here rather than the server
     * sending "8 Jul" to a reader who does not use that calendar wording.
     */
    const axis = (at: string, granularity: Granularity) => {
      const date = new Date(at)
      if (granularity === 'month') {
        return new Intl.DateTimeFormat(intlTag(tag), { month: 'short', timeZone: 'UTC' }).format(date)
      }
      return new Intl.DateTimeFormat(intlTag(tag), { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date)
    }

    return {
      axis,
      currency: (value: number) => formatCurrency(value, tag),
      currencyExact: (value: number) => formatCurrencyExact(value, tag),
      currencyCompact: (value: number) => formatCurrencyCompact(value, tag),
      number: (value: number) => formatNumber(value, tag),
      percent: (value: number, digits?: number) => formatPercent(value, tag, digits),
      signed: (value: number, digits?: number) => formatSigned(value, tag, digits),
      signedCurrency: (value: number) => formatSignedCurrency(value, tag),
      date: (value: string | Date) => formatDate(value, tag),
      relative: (value: string | Date, now: string | Date) => formatRelative(value, now, tag),
      metric: (value: number, format: 'currency' | 'number' | 'percent') => formatMetric(value, format, tag)
    }
  })
}
