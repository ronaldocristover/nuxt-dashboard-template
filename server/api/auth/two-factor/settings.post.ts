import { z } from 'zod'
import { db, publicUser } from '~~/server/utils/db'
import { verifyPassword } from '~~/server/utils/password'
import { limit } from '~~/server/utils/ratelimit'
import { requireUser } from '~~/server/utils/session'

const bodySchema = z.object({
  enabled: z.boolean(),
  password: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  const current = await requireUser(event)
  limit(event, 'two-factor-settings', 6, 60_000)

  const body = await readValidatedBody(event, bodySchema.safeParse)

  if (!body.success) {
    throw createError({ statusCode: 422, statusMessage: 'Enter your password to continue' })
  }

  const stored = await db.findUserById(current.id)

  // Changing a security setting re-asks for the password. A stolen session
  // should not be able to switch two-step off.
  if (!stored || !verifyPassword(body.data.password, stored.passwordHash)) {
    throw createError({ statusCode: 403, statusMessage: 'Your password is incorrect' })
  }

  const updated = await db.setTwoFactor(current.id, body.data.enabled)

  return { user: updated ? publicUser(updated) : null }
})
