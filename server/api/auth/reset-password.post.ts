import { resetPasswordSchema } from '#shared/schemas'
import { db } from '~~/server/utils/db'
import { hashPassword } from '~~/server/utils/password'
import { limit } from '~~/server/utils/ratelimit'

export default defineEventHandler(async (event) => {
  limit(event, 'reset-password', 6, 60_000)

  const body = await readValidatedBody(event, resetPasswordSchema.safeParse)

  if (!body.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Check the highlighted fields',
      data: { issues: body.error.issues }
    })
  }

  const { token, password } = body.data
  const email = db.consumeResetToken(token)

  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'This reset link has expired or has already been used'
    })
  }

  const user = db.findUserByEmail(email)

  if (!user) {
    throw createError({ statusCode: 400, statusMessage: 'This reset link is no longer valid' })
  }

  db.setPassword(user.id, hashPassword(password))

  return { ok: true, message: 'Password updated. Sign in with your new password.' }
})
