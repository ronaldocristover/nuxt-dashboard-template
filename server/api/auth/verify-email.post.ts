import { z } from 'zod'
import { db, publicUser } from '~~/server/utils/db'
import { limit } from '~~/server/utils/ratelimit'

const bodySchema = z.object({
  token: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  limit(event, 'verify-email', 10, 60_000)

  const body = await readValidatedBody(event, bodySchema.safeParse)

  if (!body.success) {
    throw createError({ statusCode: 400, statusMessage: 'This verification link is missing its token' })
  }

  const userId = await db.consumeVerifyToken(body.data.token)

  if (!userId) {
    throw createError({
      statusCode: 410,
      statusMessage: 'This verification link has expired or has already been used'
    })
  }

  const updated = await db.setEmailVerified(userId)

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'That account no longer exists' })
  }

  return { user: publicUser(updated) }
})
