import { inviteSchema } from '#shared/schemas'
import { db } from '~~/server/utils/db'
import { requireUser } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  await requireUser(event)

  const body = await readValidatedBody(event, inviteSchema.safeParse)

  if (!body.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Enter a valid email address and role',
      data: { issues: body.error.issues }
    })
  }

  const existing = await db.findMemberByEmail(body.data.email)

  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'That person is already on the team' })
  }

  // Send the invitation email here.
  const member = await db.inviteMember(body.data.email, body.data.role)

  return { member }
})
