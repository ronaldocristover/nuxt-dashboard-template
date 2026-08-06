import { db } from '~~/server/utils/db'
import { requireUser } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  // Preferences are per user now that they live in a table, so the row is
  // looked up by id rather than being a single global object.
  return await db.notifications(user.id)
})
