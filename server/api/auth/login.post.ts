import { signInSchema } from '#shared/schemas'
import { db, publicUser } from '~~/server/utils/db'
import { verifyPassword } from '~~/server/utils/password'
import { limit } from '~~/server/utils/ratelimit'
import { setUserSession } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  limit(event, 'login', 8, 60_000)

  const body = await readValidatedBody(event, signInSchema.safeParse)

  if (!body.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Check the highlighted fields',
      data: { issues: body.error.issues }
    })
  }

  const { email, password, remember } = body.data
  const user = db.findUserByEmail(email)

  // One message for both "no such account" and "wrong password", so the
  // response cannot be used to discover which addresses are registered.
  const invalid = createError({
    statusCode: 401,
    statusMessage: 'That email and password combination does not match an account'
  })

  if (!user || !verifyPassword(password, user.passwordHash)) throw invalid

  await setUserSession(event, user.id, remember)

  return { user: publicUser(user) }
})
