import { randomBytes, randomInt, scryptSync, timingSafeEqual } from 'node:crypto'

/**
 * Password hashing with scrypt from Node's standard library — no dependency,
 * and memory-hard by design.
 *
 * If you move the template onto a platform without `node:crypto` (Cloudflare
 * Workers, Deno Deploy), swap these two functions for your platform's
 * equivalent. Nothing else in the codebase touches hashing.
 */

const KEY_LENGTH = 64
const SALT_LENGTH = 16

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH).toString('hex')
  const derived = scryptSync(password, salt, KEY_LENGTH).toString('hex')
  return `scrypt:${salt}:${derived}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, digest] = stored.split(':')
  if (scheme !== 'scrypt' || !salt || !digest) return false

  const expected = Buffer.from(digest, 'hex')
  const actual = scryptSync(password, salt, KEY_LENGTH)

  // Lengths must match before `timingSafeEqual`, which throws otherwise.
  if (expected.length !== actual.length) return false
  return timingSafeEqual(expected, actual)
}

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url')
}

/**
 * A six-digit numeric code for the two-step challenge.
 *
 * Drawn from `randomInt`, not `Math.random`: this is a credential, and a
 * predictable one is worse than none because it looks like protection.
 */
export function generateCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0')
}
