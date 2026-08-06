import { cardMoveSchema } from '#shared/board-schemas'
import { moveCard } from '#shared/board'
import { db } from '~~/server/utils/db'
import { requireUser } from '~~/server/utils/session'

/**
 * Moves a card and repacks the affected columns.
 *
 * The position maths lives in `shared/board.ts` as a pure function, so the
 * client can apply the same move optimistically and land on exactly the layout
 * the server will confirm — no snap-back after a successful drag.
 */
export default defineEventHandler(async (event) => {
  await requireUser(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Which card?' })

  const body = await readValidatedBody(event, cardMoveSchema.safeParse)

  if (!body.success) {
    throw createError({ statusCode: 422, statusMessage: 'That move is not valid' })
  }

  const cards = await db.allCards()

  if (!cards.some(card => card.id === id)) {
    throw createError({ statusCode: 404, statusMessage: 'That card no longer exists' })
  }

  const { changed } = moveCard(cards, id, body.data.columnId, body.data.index)
  await db.applyCardPositions(changed)

  return { changed: changed.length }
})
