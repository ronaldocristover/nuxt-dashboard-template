import { z } from 'zod'
import { db, publicUser } from '~~/server/utils/db'
import { limit } from '~~/server/utils/ratelimit'
import { getPendingUser, promotePendingSession, clearUserSession } from '~~/server/utils/session'

const bodySchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Enter the six digits from your authenticator')
})

export default defineEventHandler(async (event) => {
  limit(event, 'two-factor', 10, 60_000)

  const pending = await getPendingUser(event)

  if (!pending) {
    throw createError({
      statusCode: 401,
      statusMessage: 'That sign-in attempt has expired. Start again.'
    })
  }

  const body = await readValidatedBody(event, bodySchema.safeParse)

  if (!body.success) {
    throw createError({ statusCode: 422, statusMessage: 'Enter all six digits' })
  }

  const outcome = db.verifyTwoFactorCode(pending.user.id, body.data.code)

  if (outcome === 'invalid') {
    throw createError({ statusCode: 401, statusMessage: 'That code is not right' })
  }

  if (outcome === 'expired') {
    throw createError({ statusCode: 410, statusMessage: 'That code has expired. Send a new one.' })
  }

  if (outcome === 'exhausted') {
    // Too many guesses ends the whole attempt, not just the code — otherwise
    // an attacker just requests another code and keeps going.
    await clearUserSession(event)
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many incorrect codes. Sign in again.'
    })
  }

  await promotePendingSession(event, pending.user.id, pending.remember)

  const stored = db.findUserById(pending.user.id)
  return { user: stored ? publicUser(stored) : null }
})
