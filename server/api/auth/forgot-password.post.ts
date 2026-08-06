import { forgotPasswordSchema } from '#shared/schemas'
import { db } from '~~/server/utils/db'
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

    const resetUrl = `${config.appUrl}/reset-password?token=${token}`

    // ------------------------------------------------------------------
    // Send the email here. Any transactional provider works — Resend,
    // Postmark, SES. This is the only place a reset link is created.
    // ------------------------------------------------------------------
    console.info(`[cadence] password reset for ${user.email}: ${resetUrl}`)

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
