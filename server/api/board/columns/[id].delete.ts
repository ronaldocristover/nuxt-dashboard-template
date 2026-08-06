import { db } from '~~/server/utils/db'
import { requireUser } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  await requireUser(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Which stage?' })

  // Cards go with the stage. An orphan card has nowhere to render, and silently
  // keeping them would leak MRR out of every board total.
  if (!await db.deleteColumn(id)) {
    throw createError({ statusCode: 404, statusMessage: 'That stage no longer exists' })
  }

  return { ok: true }
})
