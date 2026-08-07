import { db, TTL_MINUTES } from '~~/server/utils/db'
import { mailLocale } from '~~/server/utils/mail/locale'
import { verifyEmailMail } from '~~/server/utils/mail/render'
import { sendMail } from '~~/server/utils/mail/send'
import { generateToken } from '~~/server/utils/password'
import { limit } from '~~/server/utils/ratelimit'
import { requireUser } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const current = await requireUser(event)
  limit(event, 'resend-verification', 3, 60_000)

  // Nothing to send, and saying so is fine — the caller is authenticated and
  // already knows the state of their own account.
  if (current.emailVerifiedAt) {
    return { ok: true, alreadyVerified: true }
  }

  const token = generateToken()
  await db.createVerifyToken(current.id, token)

  const url = `${useRuntimeConfig().public.appUrl}/verify-email?token=${token}`

  await sendMail(verifyEmailMail({
    to: current.email,
    locale: mailLocale(event),
    url,
    expiresInMinutes: TTL_MINUTES.verify
  }))

  return { ok: true, alreadyVerified: false, devUrl: import.meta.dev ? url : undefined }
})
