import type { OverviewResponse } from '#shared/types'
import { db } from '~~/server/utils/db'
import { buildMovement, buildMrrSeries, buildOverviewMetrics } from '~~/server/utils/metrics'
import { requireUser } from '~~/server/utils/session'

export default defineEventHandler(async (event): Promise<OverviewResponse> => {
  await requireUser(event)

  return {
    metrics: buildOverviewMetrics(),
    movement: buildMovement(),
    mrrSeries: buildMrrSeries(),
    activity: db.activity().slice(0, 8),
    invoices: db.invoices().slice(0, 6)
  }
})
