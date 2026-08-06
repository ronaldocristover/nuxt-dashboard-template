import { db } from '~~/server/utils/db'
import { requireUser } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  await requireUser(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Which card?' })

  if (!await db.deleteCard(id)) {
    throw createError({ statusCode: 404, statusMessage: 'That card no longer exists' })
  }

  return { ok: true }
})
