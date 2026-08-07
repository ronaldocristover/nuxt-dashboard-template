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

  // Both remaining tabs are scoped by the accounts they own, so the set is
  // computed once and the two queries run together.
  const accounts = [...new Set(renewals.map(renewal => renewal.account))]

  const [activity, invoices] = await Promise.all([
    db.memberActivity(accounts),
    db.memberInvoices(accounts)
  ])

  // Summed over every invoice, not the page the table happens to show — a
  // "failed" figure that only counts the visible rows is worse than none.
  const invoiceTotals = invoices.reduce(
    (totals, invoice) => ({ ...totals, [invoice.status]: totals[invoice.status] + invoice.amount }),
    { paid: 0, open: 0, failed: 0 }
  )

  // A workspace with no owner has nobody who can add one back. The last owner
  // can therefore be neither demoted nor deleted — and the page is told so it
  // can disable those controls rather than letting someone try and be refused.
  const isLastOwner = member.role === 'owner' && owners <= 1

  return {
    generatedAt: new Date().toISOString(),
    member,
    renewals,
    renewalMrr: renewals.reduce((sum, renewal) => sum + renewal.mrr, 0),
    invoices,
    invoiceTotals,
    activity,
    canChangeRole: !isLastOwner,
    canDelete: !isLastOwner && member.role !== 'owner'
  }
})
