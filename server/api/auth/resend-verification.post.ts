import { db } from '~~/server/utils/db'
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
  db.createVerifyToken(current.id, token)

  const url = `${useRuntimeConfig().appUrl}/verify-email?token=${token}`

  // ------------------------------------------------------------------
  // Send the email here. This is the only place a verification link is made.
  // ------------------------------------------------------------------
  console.info(`[cadence] verification link for ${current.email}: ${url}`)

  return { ok: true, alreadyVerified: false, devUrl: import.meta.dev ? url : undefined }
})
