import type { SignInResult } from '#shared/types'
import { signInSchema } from '#shared/schemas'
import { db, publicUser, TTL_MINUTES } from '~~/server/utils/db'
import { mailLocale } from '~~/server/utils/mail/locale'
import { twoStepCodeMail } from '~~/server/utils/mail/render'
import { sendMail } from '~~/server/utils/mail/send'
import { verifyPassword, generateCode } from '~~/server/utils/password'
import { limit } from '~~/server/utils/ratelimit'
import { setPendingSession, setUserSession } from '~~/server/utils/session'

export default defineEventHandler(async (event): Promise<SignInResult> => {
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
  const user = await db.findUserByEmail(email)

  // One message for both "no such account" and "wrong password", so the
  // response cannot be used to discover which addresses are registered.
  const invalid = createError({
    statusCode: 401,
    statusMessage: 'That email and password combination does not match an account'
  })

  if (!user || !verifyPassword(password, user.passwordHash)) throw invalid

  // A correct password is not a session when two-step is on. Store a challenge
  // instead — it carries no `userId`, so nothing is authorised by it.
  if (user.twoFactorEnabled) {
    const code = generateCode()
    await db.createTwoFactorCode(user.id, code)
    await setPendingSession(event, user.id, remember)

    // Email here; swap the driver for SMS or push if that is your second
    // factor. This is the only place a two-step code is created.
    await sendMail(twoStepCodeMail({
      to: user.email,
      locale: mailLocale(event),
      code,
      expiresInMinutes: TTL_MINUTES.code
    }))

    return {
      requiresTwoFactor: true,
      user: null,
      devCode: import.meta.dev ? code : undefined
    }
  }

  await setUserSession(event, user.id, remember)

  return { requiresTwoFactor: false, user: publicUser(user) }
})
