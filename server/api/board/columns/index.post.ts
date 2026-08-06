import { columnInputSchema } from '#shared/board-schemas'
import { db } from '~~/server/utils/db'
import { requireUser } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  await requireUser(event)

  const body = await readValidatedBody(event, columnInputSchema.safeParse)

  if (!body.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Give the stage a name',
      data: { issues: body.error.issues }
    })
  }

  return { column: await db.createColumn(body.data.title, body.data.tone) }
})
