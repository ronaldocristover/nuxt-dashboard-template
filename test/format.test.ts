import { describe, expect, it } from 'vitest'
import {
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  formatNumber,
  formatPercent,
  formatRelative,
  formatSigned,
  formatSignedCurrency,
  initials,
  intlTag
} from '#shared/format'

describe('locale tags', () => {
  it('maps every shipped locale to a valid BCP 47 tag', () => {
    // `zh-Hans` alone is not a locale Intl can resolve a region for; the map
    // exists to stop that silently falling back to English.
    expect(intlTag('en')).toBe('en-US')
    expect(intlTag('id')).toBe('id-ID')
    expect(intlTag('zh-Hans')).toBe('zh-Hans-CN')
    expect(intlTag('zh-Hant')).toBe('zh-Hant-TW')
  })

  it('passes an unknown locale through rather than throwing', () => {
    expect(intlTag('fr')).toBe('fr')
  })
})

describe('number formatting follows the locale', () => {
  it('groups thousands the way each language does', () => {
    // Indonesian uses a full stop as the thousands separator. If this ever
    // returns "86,945" for `id`, the locale is not reaching Intl.
    expect(formatNumber(86945, 'en')).toBe('86,945')
    expect(formatNumber(86945, 'id')).toBe('86.945')
  })

  it('keeps currency fixed while the formatting moves', () => {
    // What a business bills in is not a property of the reader's language.
    expect(formatCurrency(86945, 'en')).toContain('86,945')
    expect(formatCurrency(86945, 'id')).toContain('86.945')
  })

  it('drops cents on dashboard figures', () => {
    expect(formatCurrency(1234.56, 'en')).toBe('$1,235')
  })

  it('compacts for axis ticks', () => {
    expect(formatCurrencyCompact(86945, 'en')).toMatch(/86\.9K/)
  })
})

describe('signed values always carry their sign', () => {
  it('uses a real minus sign, not a hyphen', () => {
    // U+2212. A hyphen next to tabular figures reads as a dash, not a negative.
    expect(formatSigned(-4, 'en')).toBe('−4.0%')
    expect(formatSigned(4, 'en')).toBe('+4.0%')
  })

  it('renders zero without a sign', () => {
    expect(formatSigned(0, 'en')).toBe('0.0%')
  })

  it('signs currency the same way', () => {
    expect(formatSignedCurrency(3345, 'en')).toBe('+$3,345')
    expect(formatSignedCurrency(-752, 'en')).toBe('−$752')
  })
})

describe('percentages', () => {
  it('takes a percentage, not a ratio', () => {
    // The metrics pipeline produces 99.4 meaning 99.4%, not 0.994.
    expect(formatPercent(99.4, 'en')).toBe('99.4%')
  })

  it('honours the requested precision', () => {
    expect(formatPercent(76, 'en', 0)).toBe('76%')
  })
})

describe('relative time is measured from a supplied clock', () => {
  const now = '2026-08-06T12:00:00.000Z'

  it('does not read the system clock', () => {
    // This is what keeps SSR and hydration agreeing. If `now` were ignored,
    // the two renders would disagree and Vue would warn.
    const threeHoursEarlier = '2026-08-06T09:00:00.000Z'
    expect(formatRelative(threeHoursEarlier, now, 'en')).toBe('3 hours ago')
  })

  it('translates', () => {
    const threeHoursEarlier = '2026-08-06T09:00:00.000Z'
    expect(formatRelative(threeHoursEarlier, now, 'id')).toContain('jam')
    expect(formatRelative(threeHoursEarlier, now, 'zh-Hans')).toContain('小时')
  })

  it('picks the largest unit that fits', () => {
    expect(formatRelative('2026-08-05T12:00:00.000Z', now, 'en')).toBe('yesterday')
    expect(formatRelative('2026-06-06T12:00:00.000Z', now, 'en')).toMatch(/months ago/)
  })

  it('says "now" for anything under a minute', () => {
    expect(formatRelative('2026-08-06T11:59:30.000Z', now, 'en')).toBe('now')
  })
})

describe('dates', () => {
  it('formats in the reader’s language', () => {
    expect(formatDate('2026-08-06T00:00:00.000Z', 'en')).toMatch(/Aug/)
    expect(formatDate('2026-08-06T00:00:00.000Z', 'zh-Hant')).toMatch(/2026/)
  })
})

describe('initials', () => {
  it('takes first and last for a Latin name', () => {
    expect(initials('Amara Adeyemi')).toBe('AA')
    expect(initials('Northwind Labs')).toBe('NL')
  })

  it('takes two letters from a single Latin word', () => {
    expect(initials('Cadence')).toBe('CA')
  })

  it('takes one character for a script without case', () => {
    // Slicing two Han characters reads as a truncated word, not an initialism.
    expect(initials('陳怡君')).toBe('陳')
  })

  it('never returns an empty string', () => {
    expect(initials('   ')).toBe('?')
    expect(initials('')).toBe('?')
  })
})
