import { z } from 'zod'
import type { Subscriber, SubscribersResponse } from '#shared/types'
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

  const { q, plan, status, sort, order, page, pageSize } = await getValidatedQuery(event, querySchema.parse)
  const needle = q.toLowerCase()

  const filtered = db.subscribers().filter((row) => {
    if (plan !== 'all' && row.plan !== plan) return false
    if (status !== 'all' && row.status !== status) return false
    if (!needle) return true
    return (
      row.name.toLowerCase().includes(needle)
      || row.email.toLowerCase().includes(needle)
      || row.company.toLowerCase().includes(needle)
    )
  })

  const direction = order === 'asc' ? 1 : -1

  const sorted = [...filtered].sort((a, b) => {
    const left = a[sort as keyof Subscriber]
    const right = b[sort as keyof Subscriber]

    if (typeof left === 'number' && typeof right === 'number') {
      return (left - right) * direction
    }
    return String(left).localeCompare(String(right)) * direction
  })

  // Clamp instead of returning an empty page: filtering down while on page 6
  // should land the reader on the last real page, not a blank one.
  const lastPage = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, lastPage)
  const start = (safePage - 1) * pageSize

  return {
    rows: sorted.slice(start, start + pageSize),
    total: sorted.length,
    page: safePage,
    pageSize,
    totals: {
      mrr: filtered.reduce((sum, row) => sum + row.mrr, 0),
      seats: filtered.reduce((sum, row) => sum + row.seats, 0)
    }
  }
})
