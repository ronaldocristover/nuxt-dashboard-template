import { signUpSchema } from '#shared/schemas'
import { db, publicUser } from '~~/server/utils/db'
import { hashPassword } from '~~/server/utils/password'
import { limit } from '~~/server/utils/ratelimit'
import { setUserSession } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  limit(event, 'register', 5, 60_000)

  const body = await readValidatedBody(event, signUpSchema.safeParse)

  if (!body.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Check the highlighted fields',
      data: { issues: body.error.issues }
    })
  }

  const { name, email, password } = body.data

  if (db.findUserByEmail(email)) {
    throw createError({
      statusCode: 409,
      statusMessage: 'An account already uses that email address'
    })
  }

  const user = db.createUser({ name, email, passwordHash: hashPassword(password) })
  await setUserSession(event, user.id)

  return { user: publicUser(user) }
})
