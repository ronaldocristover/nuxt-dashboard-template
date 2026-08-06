import { getPendingUser } from '~~/server/utils/session'

/**
 * Describes the live challenge so `/two-factor` can render without guessing.
 *
 * Returns `null` rather than 401 when there is nothing pending — an expired
 * challenge is an ordinary state for that page, not an error.
 */
export default defineEventHandler(async (event) => {
  const pending = await getPendingUser(event)

  if (!pending) return { pending: false, email: null }

  // Only the masked address is exposed. The full one is already known to
  // whoever started this, and echoing it would leak on a shared screen.
  const [name = '', domain = ''] = pending.user.email.split('@')
  const masked = name.length <= 2
    ? `${name[0] ?? ''}***@${domain}`
    : `${name.slice(0, 2)}${'*'.repeat(Math.max(3, name.length - 2))}@${domain}`

  return { pending: true, email: masked }
})
