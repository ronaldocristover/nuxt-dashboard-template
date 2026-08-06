import { describe, expect, it } from 'vitest'
import { generateCode, generateToken, hashPassword, verifyPassword } from '~~/server/utils/password'

describe('password hashing', () => {
  it('round-trips', () => {
    const stored = hashPassword('Cadence2026')
    expect(verifyPassword('Cadence2026', stored)).toBe(true)
  })

  it('rejects the wrong password', () => {
    expect(verifyPassword('wrong', hashPassword('Cadence2026'))).toBe(false)
  })

  it('salts, so the same password hashes differently every time', () => {
    // Identical hashes would let anyone spot shared passwords across accounts.
    expect(hashPassword('same')).not.toBe(hashPassword('same'))
  })

  it('stores the scheme so the format can be migrated later', () => {
    expect(hashPassword('x').startsWith('scrypt:')).toBe(true)
  })

  it('returns false rather than throwing on a malformed record', () => {
    // `timingSafeEqual` throws on a length mismatch; a corrupt row must not
    // take the whole sign-in route down with a 500.
    for (const bad of ['', 'garbage', 'scrypt:only-two-parts', 'bcrypt:a:b']) {
      expect(() => verifyPassword('x', bad)).not.toThrow()
      expect(verifyPassword('x', bad)).toBe(false)
    }
  })
})

describe('generated secrets', () => {
  it('makes URL-safe tokens', () => {
    const token = generateToken()
    // base64url — safe to drop straight into a query string.
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(token.length).toBeGreaterThan(30)
  })

  it('makes six-digit codes, zero-padded', () => {
    for (let i = 0; i < 500; i++) {
      const code = generateCode()
      expect(code).toMatch(/^\d{6}$/)
    }
  })

  it('spreads codes across the range', () => {
    // A predictable code is worse than none, because it looks like protection.
    const seen = new Set(Array.from({ length: 300 }, generateCode))
    expect(seen.size).toBeGreaterThan(250)
  })
})
