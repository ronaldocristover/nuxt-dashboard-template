import { describe, expect, it } from 'vitest'
import {
  createSignInSchema,
  createSignUpSchema,
  createResetPasswordSchema,
  scorePassword
} from '#shared/schemas'

/** Stands in for `t`, so a message key can be asserted on directly. */
const key = (k: string) => k

describe('messages travel as keys', () => {
  it('emits the translation key, not English prose', () => {
    // The server calls these factories with no argument and never renders the
    // result; the client passes `t`. Neither side keeps a second copy of the
    // English strings.
    const result = createSignInSchema(key).safeParse({ email: '', password: '' })
    expect(result.success).toBe(false)
    const messages = result.error!.issues.map(issue => issue.message)
    expect(messages).toContain('validation.email.required')
    expect(messages).toContain('validation.password.required')
  })
})

describe('email handling', () => {
  it('lowercases and trims, so the same address is one account', () => {
    const parsed = createSignInSchema(key).parse({
      email: '  Demo@Cadence.APP  ',
      password: 'whatever'
    })
    expect(parsed.email).toBe('demo@cadence.app')
  })

  it('rejects something that is not an address', () => {
    const result = createSignInSchema(key).safeParse({ email: 'not-an-email', password: 'x' })
    expect(result.success).toBe(false)
  })
})

describe('sign-up enforces a strong password, sign-in does not', () => {
  const base = { name: 'Amara Adeyemi', email: 'a@b.com', terms: true }

  it('requires a mix on sign-up', () => {
    for (const password of ['alllowercase1', 'ALLUPPERCASE1', 'NoDigitsHere']) {
      expect(createSignUpSchema(key).safeParse({ ...base, password }).success).toBe(false)
    }
    expect(createSignUpSchema(key).safeParse({ ...base, password: 'Cadence2026' }).success).toBe(true)
  })

  it('does not re-check strength on sign-in', () => {
    // Applying sign-up rules at sign-in would lock out every account created
    // before the rules changed.
    expect(createSignInSchema(key).safeParse({ email: 'a@b.com', password: 'old' }).success).toBe(true)
  })

  it('will not accept unticked terms', () => {
    expect(createSignUpSchema(key).safeParse({ ...base, password: 'Cadence2026', terms: false }).success).toBe(false)
  })

  it('keeps `terms` typed as boolean so the box can start unchecked', () => {
    const parsed = createSignUpSchema(key).parse({ ...base, password: 'Cadence2026' })
    expect(typeof parsed.terms).toBe('boolean')
  })
})

describe('reset password', () => {
  it('reports a mismatch against the confirm field, not the first one', () => {
    // Otherwise the error appears under the field someone typed correctly.
    const result = createResetPasswordSchema(key).safeParse({
      token: 't',
      password: 'Cadence2026',
      confirmPassword: 'Cadence2027'
    })
    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.path).toEqual(['confirmPassword'])
  })

  it('needs a token', () => {
    expect(createResetPasswordSchema(key).safeParse({
      token: '',
      password: 'Cadence2026',
      confirmPassword: 'Cadence2026'
    }).success).toBe(false)
  })
})

describe('password strength meter', () => {
  it('scores 0 to 4 and never outside', () => {
    for (const value of ['', 'a', 'abcdefgh', 'Abcdefgh1', 'Abcdefghijkl1!', 'x'.repeat(200)]) {
      const score = scorePassword(value)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(4)
    }
  })

  it('rewards length and variety', () => {
    expect(scorePassword('')).toBe(0)
    expect(scorePassword('abcdefgh')).toBeLessThan(scorePassword('Abcdefghijkl1!'))
  })
})

describe('regression: whitespace around a pasted address', () => {
  it('accepts an address with surrounding whitespace', () => {
    // Was rejected as invalid because `.email()` ran before the trim. Pasting
    // from a spreadsheet or a mail client routinely brings a trailing space.
    for (const raw of [' demo@cadence.app', 'demo@cadence.app ', '\tdemo@cadence.app\n']) {
      const result = createSignInSchema(key).safeParse({ email: raw, password: 'x' })
      expect(result.success, `rejected ${JSON.stringify(raw)}`).toBe(true)
      expect(result.data!.email).toBe('demo@cadence.app')
    }
  })

  it('still rejects whitespace-only', () => {
    expect(createSignInSchema(key).safeParse({ email: '   ', password: 'x' }).success).toBe(false)
  })
})
