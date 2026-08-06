import { profileSchema } from '#shared/schemas'
import { db, publicUser } from '~~/server/utils/db'
import { requireUser } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  const current = await requireUser(event)

  const body = await readValidatedBody(event, profileSchema.safeParse)

  if (!body.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Check the highlighted fields',
      data: { issues: body.error.issues }
    })
  }

  const taken = db.findUserByEmail(body.data.email)

  if (taken && taken.id !== current.id) {
    throw createError({ statusCode: 409, statusMessage: 'Another account already uses that email address' })
  }

  const updated = db.updateUser(current.id, body.data)

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Account not found' })
  }

  return { user: publicUser(updated) }
})
