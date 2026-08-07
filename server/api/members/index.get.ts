import { z } from 'zod'
import type { MembersResponse } from '#shared/types'
import { db } from '~~/server/utils/db'
import { requireUser } from '~~/server/utils/session'

/**
 * Every field falls back to its default rather than rejecting the request — a
 * hand-edited or stale URL should show the default list, not an error page.
 */
const querySchema = z.object({
  q: z.string().trim().max(120).catch(''),
  role: z.enum(['all', 'owner', 'admin', 'member']).catch('all'),
  status: z.enum(['all', 'active', 'invited']).catch('all'),
  department: z.enum(['all', 'revenue', 'finance', 'product', 'support', 'leadership']).catch('all'),
  sort: z.enum(['name', 'email', 'role', 'department', 'joinedAt', 'lastSeenAt']).catch('role'),
  order: z.enum(['asc', 'desc']).catch('asc'),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(5).max(100).catch(10)
})

export default defineEventHandler(async (event): Promise<MembersResponse> => {
  await requireUser(event)

  const query = await getValidatedQuery(event, querySchema.parse)
  const { rows, total, page, counts } = await db.listMembers(query)

  return {
    // Relative times ("last seen 3 hours ago") are measured from this, so the
    // server and the client cannot disagree about when "now" was.
    generatedAt: new Date().toISOString(),
    rows,
    total,
    page,
    pageSize: query.pageSize,
    counts
  }
})
