import { db } from '~~/server/utils/db'
import { generateCode } from '~~/server/utils/password'
import { limit } from '~~/server/utils/ratelimit'
import { getPendingUser } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  // Tighter than the verify limit: resending is what an attacker would spam to
  // flood someone's inbox.
  limit(event, 'two-factor-resend', 3, 60_000)

  const pending = await getPendingUser(event)

  if (!pending) {
    throw createError({
      statusCode: 401,
      statusMessage: 'That sign-in attempt has expired. Start again.'
    })
  }

  const code = generateCode()
  await db.createTwoFactorCode(pending.user.id, code)

  console.info(`[cadence] two-step code for ${pending.user.email}: ${code}`)

  return { ok: true, devCode: import.meta.dev ? code : undefined }
})
