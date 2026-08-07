import { memberSchema } from '#shared/schemas'
import type { TeamMember } from '#shared/types'
import { db } from '~~/server/utils/db'
import { limit } from '~~/server/utils/ratelimit'
import { requireUser } from '~~/server/utils/session'

export default defineEventHandler(async (event): Promise<TeamMember> => {
  const current = await requireUser(event)
  limit(event, 'member-create', 20, 60_000)

  const body = await readValidatedBody(event, memberSchema.safeParse)

  if (!body.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Check the highlighted fields',
      data: { issues: body.error.issues }
    })
  }

  // The unique index would reject this anyway, but a 409 with a sentence beats
  // a constraint violation surfacing as a 500.
  if (await db.findMemberByEmail(body.data.email)) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Someone with that email address is already on the team'
    })
  }

  return db.createMember({ ...body.data, invitedBy: current.name })
})
