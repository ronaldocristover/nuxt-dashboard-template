import { describe, expect, it } from 'vitest'
import type { BoardCard } from '#shared/types'
import { isOverdue, moveCard, nextPosition, repack } from '#shared/board'

/**
 * Position maths for the kanban board.
 *
 * This is the part of a board that breaks quietly: a move that leaves two cards
 * claiming the same position renders them in an arbitrary order, and nobody
 * notices until a card appears to jump on reload. The same function runs on the
 * client (optimistically) and on the server (authoritatively), so it is worth
 * pinning hard.
 */

function card(id: string, columnId: string, position: number): BoardCard {
  return {
    id,
    columnId,
    position,
    title: id,
    account: 'Acme',
    mrr: 100,
    ownerName: 'Test Owner',
    ownerColor: '#2d5bff',
    dueAt: null,
    labels: [],
    notes: '',
    commentCount: 0
  }
}

/** Applies a move result so the outcome can be asserted as a layout. */
function layout(cards: BoardCard[], changed: Array<{ id: string, columnId: string, position: number }>) {
  const byId = new Map(changed.map(change => [change.id, change]))
  const next = cards.map((item) => {
    const change = byId.get(item.id)
    return change ? { ...item, columnId: change.columnId, position: change.position } : item
  })

  const columns: Record<string, string[]> = {}
  for (const item of next.slice().sort((a, b) => a.position - b.position)) {
    columns[item.columnId] ??= []
    columns[item.columnId]!.push(item.id)
  }
  return columns
}

const BOARD = [
  card('a', 'todo', 0),
  card('b', 'todo', 1),
  card('c', 'todo', 2),
  card('x', 'done', 0),
  card('y', 'done', 1)
]

describe('moveCard between columns', () => {
  it('inserts at the requested index', () => {
    const { changed } = moveCard(BOARD, 'b', 'done', 1)
    expect(layout(BOARD, changed)).toEqual({ todo: ['a', 'c'], done: ['x', 'b', 'y'] })
  })

  it('appends when the index is the column length', () => {
    const { changed } = moveCard(BOARD, 'a', 'done', 2)
    expect(layout(BOARD, changed)).toEqual({ todo: ['b', 'c'], done: ['x', 'y', 'a'] })
  })

  it('closes the gap in the source column', () => {
    // The whole point: after removing 'a', 'b' and 'c' must become 0 and 1, not
    // stay at 1 and 2 with a hole at the top.
    const { changed } = moveCard(BOARD, 'a', 'done', 0)
    const moved = changed.filter(change => change.columnId === 'todo')
    expect(moved.map(change => [change.id, change.position])).toEqual([['b', 0], ['c', 1]])
  })

  it('moves into an empty column', () => {
    const { changed } = moveCard(BOARD, 'a', 'archive', 0)
    expect(layout(BOARD, changed).archive).toEqual(['a'])
  })
})

describe('moveCard within a column', () => {
  it('moves a card down', () => {
    const { changed } = moveCard(BOARD, 'a', 'todo', 2)
    expect(layout(BOARD, changed).todo).toEqual(['b', 'c', 'a'])
  })

  it('moves a card up', () => {
    const { changed } = moveCard(BOARD, 'c', 'todo', 0)
    expect(layout(BOARD, changed).todo).toEqual(['c', 'a', 'b'])
  })

  it('reports nothing when the card does not actually move', () => {
    // A drag that ends where it started must not write to the database.
    expect(moveCard(BOARD, 'a', 'todo', 0).changed).toHaveLength(0)
  })
})

describe('moveCard is defensive', () => {
  it('clamps an index past the end', () => {
    // A stale drop index from a board that changed under the reader.
    const { changed } = moveCard(BOARD, 'a', 'done', 99)
    expect(layout(BOARD, changed).done).toEqual(['x', 'y', 'a'])
  })

  it('clamps a negative index', () => {
    const { changed } = moveCard(BOARD, 'c', 'todo', -5)
    expect(layout(BOARD, changed).todo).toEqual(['c', 'a', 'b'])
  })

  it('ignores an unknown card instead of throwing', () => {
    expect(moveCard(BOARD, 'nope', 'todo', 0).changed).toEqual([])
  })

  it('returns only the rows that changed', () => {
    // Rewriting forty untouched rows on every drag would turn a cosmetic action
    // into a visible pause.
    const { changed } = moveCard(BOARD, 'a', 'todo', 1)
    expect(changed).toHaveLength(2)
    expect(changed.map(change => change.id).sort()).toEqual(['a', 'b'])
  })

  it('always leaves every column densely packed from zero', () => {
    // Fuzzed, because this is the invariant that makes the board stable.
    for (let run = 0; run < 300; run++) {
      let cards = BOARD.map(item => ({ ...item }))
      for (let step = 0; step < 6; step++) {
        const pick = cards[Math.floor(Math.random() * cards.length)]!
        const column = ['todo', 'done', 'archive'][Math.floor(Math.random() * 3)]!
        const index = Math.floor(Math.random() * 5)
        const { changed } = moveCard(cards, pick.id, column, index)
        const byId = new Map(changed.map(change => [change.id, change]))
        cards = cards.map((item) => {
          const change = byId.get(item.id)
          return change ? { ...item, columnId: change.columnId, position: change.position } : item
        })
      }

      const grouped = new Map<string, number[]>()
      for (const item of cards) {
        grouped.set(item.columnId, [...(grouped.get(item.columnId) ?? []), item.position])
      }
      for (const [column, positions] of grouped) {
        const sorted = positions.slice().sort((a, b) => a - b)
        expect(sorted, `column ${column} is not densely packed`).toEqual(
          Array.from({ length: sorted.length }, (_, i) => i)
        )
      }
    }
  })
})

describe('repack', () => {
  it('renumbers from zero in the current order', () => {
    expect(repack([{ position: 5 }, { position: 2 }, { position: 9 }]))
      .toEqual([{ position: 0 }, { position: 1 }, { position: 2 }])
  })
})

describe('nextPosition', () => {
  it('is zero for an empty column', () => {
    expect(nextPosition([])).toBe(0)
  })

  it('follows the maximum, not the count', () => {
    // A gap left by a delete must not cause a collision.
    expect(nextPosition([{ position: 0 }, { position: 7 }])).toBe(8)
  })
})

describe('isOverdue', () => {
  const now = '2026-08-06T12:00:00.000Z'

  it('is false without a date', () => {
    expect(isOverdue(null, now)).toBe(false)
  })

  it('measures against the supplied clock, not the system one', () => {
    // Same reason as formatRelative: a card sitting on the boundary must not
    // render differently during SSR and after hydration.
    expect(isOverdue('2026-08-05T12:00:00.000Z', now)).toBe(true)
    expect(isOverdue('2026-08-07T12:00:00.000Z', now)).toBe(false)
  })
})
