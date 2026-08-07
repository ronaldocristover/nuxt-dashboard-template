import type { MemberDetail } from '#shared/types'
import { db } from '~~/server/utils/db'
import { requireUser } from '~~/server/utils/session'

/**
 * Everything the detail page's four tabs need, in one request.
 *
 * The record is small and the tabs switch instantly as a result. Fetching per
 * tab would trade a few kilobytes for a spinner every time somebody clicks.
 */
export default defineEventHandler(async (event): Promise<MemberDetail> => {
  await requireUser(event)

  const id = getRouterParam(event, 'id')
  const member = id ? await db.findMember(id) : undefined

  if (!member) {
    throw createError({ statusCode: 404, statusMessage: 'No such member' })
  }

  const [renewals, owners] = await Promise.all([
    db.memberRenewals(member.name),
    db.ownerCount()
  ])

  // Events on the accounts they own — which is what a renewal owner needs to
  // see, and the only member-scoped activity this data model actually holds.
  const activity = await db.memberActivity([...new Set(renewals.map(renewal => renewal.account))])

  // A workspace with no owner has nobody who can add one back. The last owner
  // can therefore be neither demoted nor deleted — and the page is told so it
  // can disable those controls rather than letting someone try and be refused.
  const isLastOwner = member.role === 'owner' && owners <= 1

  return {
    generatedAt: new Date().toISOString(),
    member,
    renewals,
    renewalMrr: renewals.reduce((sum, renewal) => sum + renewal.mrr, 0),
    activity,
    canChangeRole: !isLastOwner,
    canDelete: !isLastOwner && member.role !== 'owner'
  }
})
