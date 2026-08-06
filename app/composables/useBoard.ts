import type { BoardCard, BoardColumn, BoardLabel, BoardResponse, BoardTone } from '#shared/types'
import { moveCard } from '#shared/board'

/**
 * Board state and every mutation it supports.
 *
 * Moves are applied **optimistically**: the pure `moveCard` helper runs against
 * local state first, the card lands where it was dropped, and only then does the
 * request go out. Because the server runs the same function over the same data,
 * the confirmed layout matches what the reader already sees — no snap-back on
 * success. On failure the board is refetched, which is the only honest way to
 * recover from a move that did not happen.
 */
export function useBoard() {
  const { notify, notifySuccess } = useApiError()
  const { t } = useI18n()

  const { data, status, error, refresh } = useApiFetch<BoardResponse>('/api/board')

  const columns = computed(() => data.value?.columns ?? [])
  const generatedAt = computed(() => data.value?.generatedAt ?? new Date().toISOString())
  const pending = computed(() => status.value === 'pending')

  /** Flat list, which is what the position maths operates on. */
  const flatCards = computed<BoardCard[]>(() => columns.value.flatMap(column => column.cards))

  const totals = computed(() =>
    columns.value.map(column => ({
      id: column.id,
      count: column.cards.length,
      mrr: column.cards.reduce((sum, card) => sum + card.mrr, 0)
    }))
  )

  /**
   * Rewrites local state from a set of position changes.
   *
   * Builds a whole new payload and assigns it, rather than mutating cards in
   * place. Nuxt 4 backs `useFetch().data` with a `shallowRef`, so nested
   * mutation does not trigger a re-render — the request would succeed and the
   * board would sit there showing the old layout until something else happened
   * to invalidate it.
   */
  function applyLocally(changes: Array<{ id: string, columnId: string, position: number }>) {
    const current = data.value
    if (!current) return

    const byId = new Map(changes.map(change => [change.id, change]))

    const moved = current.columns
      .flatMap(column => column.cards)
      .map((card) => {
        const change = byId.get(card.id)
        return change ? { ...card, columnId: change.columnId, position: change.position } : card
      })

    data.value = {
      ...current,
      columns: current.columns.map(column => ({
        ...column,
        cards: moved
          .filter(card => card.columnId === column.id)
          .sort((a, b) => a.position - b.position)
      }))
    }
  }

  async function move(cardId: string, targetColumnId: string, targetIndex: number) {
    const { changed } = moveCard(flatCards.value, cardId, targetColumnId, targetIndex)
    if (changed.length === 0) return

    applyLocally(changed)

    try {
      await $fetch(`/api/board/cards/${cardId}/move`, {
        method: 'PATCH',
        body: { columnId: targetColumnId, index: targetIndex }
      })
    } catch (cause) {
      notify(cause, t('board.moveFailed'))
      // The optimistic layout is now a guess. Replace it with the truth.
      await refresh()
    }
  }

  async function createCard(input: {
    columnId: string
    title: string
    account: string
    mrr: number
    ownerName: string
    ownerColor: string
    dueAt: string | null
    labels: BoardLabel[]
  }) {
    try {
      await $fetch('/api/board/cards', { method: 'POST', body: input })
      await refresh()
      notifySuccess(t('board.cardCreated'))
    } catch (cause) {
      notify(cause, t('board.cardCreateFailed'))
      throw cause
    }
  }

  async function updateCard(id: string, patch: Record<string, unknown>) {
    try {
      await $fetch(`/api/board/cards/${id}`, { method: 'PATCH', body: patch })
      await refresh()
      notifySuccess(t('board.cardSaved'))
    } catch (cause) {
      notify(cause, t('board.cardSaveFailed'))
      throw cause
    }
  }

  async function deleteCard(id: string) {
    try {
      await $fetch(`/api/board/cards/${id}`, { method: 'DELETE' })
      await refresh()
      notifySuccess(t('board.cardDeleted'))
    } catch (cause) {
      notify(cause, t('board.cardDeleteFailed'))
    }
  }

  async function createColumn(title: string, tone: BoardTone) {
    try {
      await $fetch('/api/board/columns', { method: 'POST', body: { title, tone } })
      await refresh()
      notifySuccess(t('board.stageCreated'))
    } catch (cause) {
      notify(cause, t('board.stageCreateFailed'))
      throw cause
    }
  }

  async function renameColumn(id: string, title: string) {
    try {
      await $fetch(`/api/board/columns/${id}`, { method: 'PATCH', body: { title } })
      await refresh()
    } catch (cause) {
      notify(cause, t('board.stageSaveFailed'))
    }
  }

  async function deleteColumn(id: string) {
    try {
      await $fetch(`/api/board/columns/${id}`, { method: 'DELETE' })
      await refresh()
      notifySuccess(t('board.stageDeleted'))
    } catch (cause) {
      notify(cause, t('board.stageDeleteFailed'))
    }
  }

  return {
    columns,
    totals,
    generatedAt,
    pending,
    error,
    refresh,
    move,
    createCard,
    updateCard,
    deleteCard,
    createColumn,
    renameColumn,
    deleteColumn
  }
}

export type BoardApi = ReturnType<typeof useBoard>
export type { BoardColumn }
