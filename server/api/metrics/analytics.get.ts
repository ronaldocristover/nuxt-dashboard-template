import { z } from 'zod'
import type { AnalyticsResponse } from '#shared/types'
import { buildAnalytics } from '~~/server/utils/metrics'
import { requireUser } from '~~/server/utils/session'

const querySchema = z.object({
  range: z.enum(['7d', '30d', '90d', '12m']).default('30d')
})

export default defineEventHandler(async (event): Promise<AnalyticsResponse> => {
  await requireUser(event)

  const query = await getValidatedQuery(event, querySchema.safeParse)

  // An unrecognised range is a bad link, not a server error — fall back.
  return buildAnalytics(query.success ? query.data.range : '30d', new Date())
})
