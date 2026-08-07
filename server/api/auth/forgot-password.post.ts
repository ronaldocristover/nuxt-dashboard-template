import { forgotPasswordSchema } from '#shared/schemas'
import { db, TTL_MINUTES } from '~~/server/utils/db'
import { mailLocale } from '~~/server/utils/mail/locale'
import { resetPasswordMail } from '~~/server/utils/mail/render'
import { sendMail } from '~~/server/utils/mail/send'
import { generateToken } from '~~/server/utils/password'
import { limit } from '~~/server/utils/ratelimit'

export default defineEventHandler(async (event) => {
  limit(event, 'forgot-password', 4, 60_000)

  const body = await readValidatedBody(event, forgotPasswordSchema.safeParse)

  if (!body.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Enter a valid email address',
      data: { issues: body.error.issues }
    })
  }

  const { email } = body.data
  const user = await db.findUserByEmail(email)
  const config = useRuntimeConfig()

  let devResetUrl: string | undefined

  if (user) {
    const token = generateToken()
    await db.createResetToken(user.email, token)

    const resetUrl = `${config.public.appUrl}/reset-password?token=${token}`

    // Not awaited for its result beyond logging: the response below must look
    // identical whether or not the account exists, so it cannot start
    // depending on whether a send succeeded.
    await sendMail(resetPasswordMail({
      to: user.email,
      locale: mailLocale(event),
      url: resetUrl,
      expiresInMinutes: TTL_MINUTES.reset
    }))

    // Surfaced in dev so the flow is testable without an email provider.
    if (import.meta.dev) devResetUrl = resetUrl
  }

  // Always the same response shape, whether or not the account exists —
  // otherwise this endpoint becomes a way to enumerate registered emails.
  return {
    ok: true,
    message: 'If that address has an account, a reset link is on its way.',
    devResetUrl
  }
})
