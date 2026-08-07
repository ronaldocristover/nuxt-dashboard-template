import { describe, expect, it } from 'vitest'
import {
  isMailLocale,
  resetPasswordMail,
  twoStepCodeMail,
  verifyEmailMail
} from '../server/utils/mail/render'

/**
 * The email templates are pure functions, which is the whole reason they can be
 * tested at all. What matters here is not that the markup is pretty — it is
 * that the things which quietly go wrong in transactional email do not:
 *
 *  - an untranslated message reaching someone in the wrong language
 *  - a `{placeholder}` shipping literally
 *  - a stated expiry that contradicts the code
 *  - HTML-only mail, which spam filters treat as a smell
 *  - unescaped input landing in the HTML part
 */

const LOCALES = ['en', 'id', 'zh-Hans', 'zh-Hant'] as const

describe('isMailLocale', () => {
  it('accepts the shipped locales', () => {
    for (const locale of LOCALES) expect(isMailLocale(locale)).toBe(true)
  })

  it('rejects anything else, including undefined', () => {
    expect(isMailLocale('fr')).toBe(false)
    expect(isMailLocale('')).toBe(false)
    expect(isMailLocale(undefined)).toBe(false)
  })
})

describe.each(LOCALES)('reset password mail — %s', (locale) => {
  const mail = resetPasswordMail({
    to: 'someone@example.com',
    locale,
    url: 'https://app.example.com/reset-password?token=abc123',
    expiresInMinutes: 30
  })

  it('carries both parts', () => {
    expect(mail.html).not.toBe('')
    expect(mail.text).not.toBe('')
  })

  it('states the real expiry', () => {
    expect(mail.text).toContain('30')
  })

  it('includes the link in both parts', () => {
    expect(mail.html).toContain('token=abc123')
    expect(mail.text).toContain('token=abc123')
  })

  it('leaves no unresolved placeholder', () => {
    expect(mail.subject).not.toMatch(/\{\w+\}/)
    expect(mail.text).not.toMatch(/\{\w+\}/)
    expect(mail.html).not.toMatch(/\{\w+\}/)
  })

  it('leaves no untranslated key', () => {
    // A missing key falls through as its own dotted path.
    expect(mail.subject).not.toMatch(/\bmail\.\w+/)
    expect(mail.text).not.toMatch(/\bmail\.\w+/)
  })

  it('sets the document language', () => {
    expect(mail.html).toContain(`lang="${locale}"`)
  })
})

describe.each(LOCALES)('verify email mail — %s', (locale) => {
  const mail = verifyEmailMail({
    to: 'someone@example.com',
    locale,
    url: 'https://app.example.com/verify-email?token=xyz789',
    expiresInMinutes: 24 * 60
  })

  it('states the window in hours, not minutes', () => {
    expect(mail.text).toContain('24')
    expect(mail.text).not.toContain('1440')
  })

  it('leaves no unresolved placeholder or untranslated key', () => {
    expect(mail.text).not.toMatch(/\{\w+\}/)
    expect(mail.text).not.toMatch(/\bmail\.\w+/)
  })
})

describe.each(LOCALES)('two-step code mail — %s', (locale) => {
  const mail = twoStepCodeMail({
    to: 'someone@example.com',
    locale,
    code: '481902',
    expiresInMinutes: 10
  })

  it('puts the code in the subject, where it is readable from a notification', () => {
    expect(mail.subject).toContain('481902')
  })

  it('carries the code in both parts', () => {
    expect(mail.html).toContain('481902')
    expect(mail.text).toContain('481902')
  })

  it('contains no link at all', () => {
    // A "someone is signing in" email with a link in it is what phishing looks
    // like. There is nothing to click here, so there is nothing to imitate.
    expect(mail.html).not.toContain('<a ')
    expect(mail.text).not.toContain('http')
  })

  it('leaves no unresolved placeholder or untranslated key', () => {
    expect(mail.subject).not.toMatch(/\{\w+\}/)
    expect(mail.text).not.toMatch(/\{\w+\}/)
    expect(mail.text).not.toMatch(/\bmail\.\w+/)
  })
})

describe('escaping', () => {
  it('does not let a crafted URL break out of the HTML', () => {
    const mail = resetPasswordMail({
      to: 'someone@example.com',
      locale: 'en',
      url: 'https://app.example.com/reset?token="><script>alert(1)</script>',
      expiresInMinutes: 30
    })

    expect(mail.html).not.toContain('<script>')
    expect(mail.html).toContain('&lt;script&gt;')
  })
})
