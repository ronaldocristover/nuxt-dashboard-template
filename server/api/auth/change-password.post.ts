import { changePasswordSchema } from '#shared/schemas'
import { db } from '~~/server/utils/db'
import { hashPassword, verifyPassword } from '~~/server/utils/password'
import { limit } from '~~/server/utils/ratelimit'
import { requireUser } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const current = await requireUser(event)
  limit(event, 'change-password', 6, 60_000)

  const body = await readValidatedBody(event, changePasswordSchema.safeParse)

  if (!body.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Check the highlighted fields',
      data: { issues: body.error.issues }
    })
  }

  const stored = db.findUserById(current.id)

  if (!stored || !verifyPassword(body.data.currentPassword, stored.passwordHash)) {
    throw createError({ statusCode: 403, statusMessage: 'Your current password is incorrect' })
  }

  db.setPassword(current.id, hashPassword(body.data.password))

  return { ok: true, message: 'Password updated.' }
})
