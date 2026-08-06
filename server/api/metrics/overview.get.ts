import type { OverviewResponse } from '#shared/types'
import { buildOverview } from '~~/server/utils/metrics'
import { requireUser } from '~~/server/utils/session'

export default defineEventHandler(async (event): Promise<OverviewResponse> => {
  await requireUser(event)

  // One clock for the whole payload. Relative times are rendered against it on
  // the client, so SSR and hydration cannot disagree.
  return await buildOverview(new Date())
})
