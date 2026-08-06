import { z } from 'zod'
import { BOARD_LABELS } from './board'

/**
 * Board request shapes, shared by the client and the routes.
 *
 * Same contract as the auth schemas: one definition, used to validate the form
 * on the client and the body on the server, so the two cannot drift.
 */

export const boardToneSchema = z.enum(['risk', 'progress', 'neutral', 'won', 'lost'])

export const cardInputSchema = z.object({
  columnId: z.string().min(1),
  title: z.string().trim().min(2, 'validation.board.titleRequired').max(120, 'validation.board.titleTooLong'),
  account: z.string().trim().min(1, 'validation.board.accountRequired').max(120),
  mrr: z.number().int().min(0, 'validation.board.mrrNegative').max(10_000_000),
  ownerName: z.string().trim().min(1).max(80),
  ownerColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#2d5bff'),
  // A date-only string; the board never cares about the time of day.
  dueAt: z.string().datetime().nullable().default(null),
  labels: z.array(z.enum(BOARD_LABELS)).max(4, 'validation.board.tooManyLabels').default([])
})

export const cardPatchSchema = cardInputSchema
  .omit({ columnId: true })
  .partial()
  .extend({
    notes: z.string().max(2000).optional()
  })

export const cardMoveSchema = z.object({
  columnId: z.string().min(1),
  // Clamped server-side too — a stale index from a board that changed under the
  // reader must not create a gap.
  index: z.number().int().min(0).max(500)
})

export const columnInputSchema = z.object({
  title: z.string().trim().min(2, 'validation.board.columnTitleRequired').max(40),
  tone: boardToneSchema.default('neutral')
})

export type CardInput = z.output<typeof cardInputSchema>
export type CardPatch = z.output<typeof cardPatchSchema>
export type CardMove = z.output<typeof cardMoveSchema>
export type ColumnInput = z.output<typeof columnInputSchema>
