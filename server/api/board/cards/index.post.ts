import { cardInputSchema } from '#shared/board-schemas'
import { db } from '~~/server/utils/db'
import { requireUser } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  await requireUser(event)

  const body = await readValidatedBody(event, cardInputSchema.safeParse)

  if (!body.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Check the highlighted fields',
      data: { issues: body.error.issues }
    })
  }

  return { card: await db.createCard(body.data) }
})
