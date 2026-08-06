import type { BoardResponse } from '#shared/types'
import { db } from '~~/server/utils/db'
import { requireUser } from '~~/server/utils/session'

export default defineEventHandler(async (event): Promise<BoardResponse> => {
  await requireUser(event)

  return {
    // Overdue styling is computed on the client against this, so SSR and
    // hydration cannot disagree about a card sitting on the boundary.
    generatedAt: new Date().toISOString(),
    columns: await db.board()
  }
})
