import { cardPatchSchema } from '#shared/board-schemas'
import { db } from '~~/server/utils/db'
import { requireUser } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  await requireUser(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Which card?' })

  const body = await readValidatedBody(event, cardPatchSchema.safeParse)

  if (!body.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Check the highlighted fields',
      data: { issues: body.error.issues }
    })
  }

  const card = await db.updateCard(id, body.data)

  if (!card) throw createError({ statusCode: 404, statusMessage: 'That card no longer exists' })

  return { card }
})
