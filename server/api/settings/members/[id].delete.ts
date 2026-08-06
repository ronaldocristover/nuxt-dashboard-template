import { db } from '~~/server/utils/db'
import { requireUser } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  await requireUser(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Which member should be removed?' })
  }

  // `removeMember` also refuses to remove the owner, which would leave the
  // workspace without an administrator.
  if (!await db.removeMember(id)) {
    throw createError({ statusCode: 400, statusMessage: 'That member cannot be removed' })
  }

  return { ok: true }
})
