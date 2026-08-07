import { signUpSchema } from '#shared/schemas'
import { db, publicUser, TTL_MINUTES } from '~~/server/utils/db'
import { mailLocale } from '~~/server/utils/mail/locale'
import { verifyEmailMail } from '~~/server/utils/mail/render'
import { sendMail } from '~~/server/utils/mail/send'
import { generateToken, hashPassword } from '~~/server/utils/password'
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

  if (await db.findUserByEmail(email)) {
    throw createError({
      statusCode: 409,
      statusMessage: 'An account already uses that email address'
    })
  }

  const user = await db.createUser({ name, email, passwordHash: hashPassword(password) })
  await setUserSession(event, user.id)

  // Signed in but unverified. The session is real — locking someone out of the
  // product until they check their email loses more sign-ups than it protects.
  const token = generateToken()
  await db.createVerifyToken(user.id, token)

  const url = `${useRuntimeConfig().public.appUrl}/verify-email?token=${token}`

  // A failed send must not fail the registration — the account exists, the
  // session is live, and Settings can resend. `sendMail` never throws.
  await sendMail(verifyEmailMail({
    to: user.email,
    locale: mailLocale(event),
    url,
    expiresInMinutes: TTL_MINUTES.verify
  }))

  return {
    user: publicUser(user),
    devVerifyUrl: import.meta.dev ? url : undefined
  }
})
