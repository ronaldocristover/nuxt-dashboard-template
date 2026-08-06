import type { OverviewResponse } from '#shared/types'
import { db } from '~~/server/utils/db'
import { buildMovement, buildMrrSeries, buildOverviewMetrics } from '~~/server/utils/metrics'
import { requireUser } from '~~/server/utils/session'

export default defineEventHandler(async (event): Promise<OverviewResponse> => {
  await requireUser(event)

  // One clock for the whole payload. Relative times are rendered against it on
  // the client, so SSR and hydration cannot disagree.
  const now = new Date()

  return {
    generatedAt: now.toISOString(),
    metrics: buildOverviewMetrics(),
    movement: buildMovement(),
    mrrSeries: buildMrrSeries(now),
    activity: db.activity().slice(0, 8),
    invoices: db.invoices().slice(0, 6)
  }
})
