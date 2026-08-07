import { memberSchema } from '#shared/schemas'
import type { TeamMember } from '#shared/types'
import { db } from '~~/server/utils/db'
import { limit } from '~~/server/utils/ratelimit'
import { requireUser } from '~~/server/utils/session'

export default defineEventHandler(async (event): Promise<TeamMember> => {
  await requireUser(event)
  limit(event, 'member-update', 30, 60_000)

  const id = getRouterParam(event, 'id')
  const existing = id ? await db.findMember(id) : undefined

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'No such member' })
  }

  const body = await readValidatedBody(event, memberSchema.safeParse)

  if (!body.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Check the highlighted fields',
      data: { issues: body.error.issues }
    })
  }

  // A clash only matters if the address belongs to somebody else. Saving a form
  // without touching the email must not report a conflict with itself.
  const clash = await db.findMemberByEmail(body.data.email)
  if (clash && clash.id !== existing.id) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Someone with that email address is already on the team'
    })
  }

  // Demoting the last owner would leave the workspace with no administrator and
  // nobody able to appoint one. Checked here and not only in the interface,
  // because the interface is not the thing enforcing it.
  if (existing.role === 'owner' && body.data.role !== 'owner' && (await db.ownerCount()) <= 1) {
    throw createError({
      statusCode: 409,
      statusMessage: 'This is the only owner. Make someone else an owner first.'
    })
  }

  const updated = await db.updateMember(existing.id, body.data)

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'No such member' })
  }

  return updated
})
