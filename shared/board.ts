import type { BoardCard } from './types'

/**
 * Position maths for the board, kept pure so it can be tested without a
 * database and reasoned about without a browser.
 *
 * Positions are densely packed integers starting at 0. Every move rewrites the
 * affected columns, which is more writes than fractional indexing would need —
 * but a board holds tens of cards, and "the positions are 0,1,2,…" is a
 * property you can verify by eye when something looks wrong.
 */

export const BOARD_LABELS = [
  'paymentFailed',
  'usageDown',
  'championLeft',
  'contractEnding',
  'priceObjection',
  'competitor'
] as const

/** Renumbers a list 0..n-1 in its current order. */
export function repack<T extends { position: number }>(cards: T[]): T[] {
  return cards
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((card, index) => ({ ...card, position: index }))
}

export interface MoveResult {
  /** Every card whose position or column changed, ready to persist. */
  changed: Array<{ id: string, columnId: string, position: number }>
}

/**
 * Moves `cardId` to `targetIndex` of `targetColumnId` and returns only the
 * cards whose stored position or column actually changed.
 *
 * Returning a minimal diff matters: the board writes this straight to the
 * database, and rewriting forty unchanged rows on every drag would turn a
 * cosmetic action into a visible pause.
 */
export function moveCard(
  cards: BoardCard[],
  cardId: string,
  targetColumnId: string,
  targetIndex: number
): MoveResult {
  const moving = cards.find(card => card.id === cardId)
  if (!moving) return { changed: [] }

  const before = new Map(cards.map(card => [card.id, { columnId: card.columnId, position: card.position }]))

  // Source column without the card, target column with it inserted.
  const byColumn = new Map<string, BoardCard[]>()
  for (const card of cards) {
    if (card.id === cardId) continue
    const list = byColumn.get(card.columnId) ?? []
    list.push(card)
    byColumn.set(card.columnId, list)
  }
  for (const [key, list] of byColumn) {
    byColumn.set(key, list.slice().sort((a, b) => a.position - b.position))
  }

  const target = byColumn.get(targetColumnId) ?? []
  // Clamp rather than trusting the caller: a stale drop index from a board that
  // changed under the reader must not create a gap or throw.
  const index = Math.max(0, Math.min(targetIndex, target.length))
  target.splice(index, 0, { ...moving, columnId: targetColumnId })
  byColumn.set(targetColumnId, target)

  const changed: MoveResult['changed'] = []

  for (const [columnId, list] of byColumn) {
    list.forEach((card, position) => {
      const previous = before.get(card.id)
      if (!previous || previous.columnId !== columnId || previous.position !== position) {
        changed.push({ id: card.id, columnId, position })
      }
    })
  }

  return { changed }
}

/** Position for a card appended to a column. */
export function nextPosition(cardsInColumn: Array<{ position: number }>): number {
  return cardsInColumn.length === 0
    ? 0
    : Math.max(...cardsInColumn.map(card => card.position)) + 1
}

/**
 * Whether a renewal date has passed, measured against a supplied clock.
 *
 * Takes `now` for the same reason `formatRelative` does: read from the system
 * clock and SSR would disagree with hydration on a card sitting exactly on the
 * boundary.
 */
export function isOverdue(dueAt: string | null, now: string | Date): boolean {
  if (!dueAt) return false
  return new Date(dueAt).getTime() < new Date(now).getTime()
}
