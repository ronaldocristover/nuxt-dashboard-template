import { db } from '~~/server/utils/db'
import { limit } from '~~/server/utils/ratelimit'
import { requireUser } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  limit(event, 'member-delete', 20, 60_000)

  const id = getRouterParam(event, 'id')
  const member = id ? await db.findMember(id) : undefined

  if (!member) {
    throw createError({ statusCode: 404, statusMessage: 'No such member' })
  }

  // `removeMember` already refuses to delete an owner in SQL. Saying so with a
  // 409 and a sentence is more use than a silent no-op that looks like success.
  if (member.role === 'owner') {
    throw createError({
      statusCode: 409,
      statusMessage: 'An owner cannot be removed. Change their role first.'
    })
  }

  const removed = await db.removeMember(member.id)

  if (!removed) {
    throw createError({ statusCode: 409, statusMessage: 'That member could not be removed' })
  }

  return { ok: true, id: member.id }
})
