import { columnInputSchema } from '#shared/board-schemas'
import { db } from '~~/server/utils/db'
import { requireUser } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  await requireUser(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Which stage?' })

  const body = await readValidatedBody(event, columnInputSchema.partial().safeParse)

  if (!body.success) {
    throw createError({ statusCode: 422, statusMessage: 'Give the stage a name' })
  }

  if (!await db.updateColumn(id, body.data)) {
    throw createError({ statusCode: 404, statusMessage: 'That stage no longer exists' })
  }

  return { ok: true }
})
