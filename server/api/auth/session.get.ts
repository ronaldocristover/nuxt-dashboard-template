import { getCurrentUser } from '~~/server/utils/session'

/**
 * The single source of truth for "who is signed in". Returns `null` rather
 * than 401 so the client can call it on every load without treating an
 * anonymous visitor as an error.
 */
export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  return { user }
})
