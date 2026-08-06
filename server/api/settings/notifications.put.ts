import { notificationSchema } from '#shared/schemas'
import { db } from '~~/server/utils/db'
import { requireUser } from '~~/server/utils/session'

export default defineEventHandler(async (event) => {
  await requireUser(event)

  const body = await readValidatedBody(event, notificationSchema.safeParse)

  if (!body.success) {
    throw createError({ statusCode: 422, statusMessage: 'Those notification settings are not valid' })
  }

  return db.setNotifications(body.data)
})
