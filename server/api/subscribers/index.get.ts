import { z } from 'zod'
import type { SubscribersResponse } from '#shared/types'
import { db } from '~~/server/utils/db'
import { requireUser } from '~~/server/utils/session'

/**
 * Every field falls back to its default rather than rejecting the request.
 * A hand-edited or stale URL should show the default list, not an error page —
 * there is no state here worth failing over.
 */
const querySchema = z.object({
  q: z.string().trim().max(120).catch(''),
  plan: z.enum(['all', 'starter', 'growth', 'scale']).catch('all'),
  status: z.enum(['all', 'active', 'trialing', 'past_due', 'churned']).catch('all'),
  sort: z.enum(['name', 'company', 'mrr', 'seats', 'joinedAt']).catch('mrr'),
  order: z.enum(['asc', 'desc']).catch('desc'),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(5).max(100).catch(10)
})

export default defineEventHandler(async (event): Promise<SubscribersResponse> => {
  await requireUser(event)

  const query = await getValidatedQuery(event, querySchema.parse)

  // Filtering, sorting, paging and the totals all happen in SQL — two queries
  // per request regardless of how many subscribers exist.
  const { rows, total, page, totals } = await db.listSubscribers(query)

  return {
    generatedAt: new Date().toISOString(),
    rows,
    total,
    page,
    pageSize: query.pageSize,
    totals
  }
})
