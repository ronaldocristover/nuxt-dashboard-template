/**
 * Drag state for the board, shared between every column and card.
 *
 * Native HTML5 drag and drop rather than a library: it is the only approach
 * with no dependency, and a board does not need the animation a sortable
 * library buys. What HTML5 DnD does *not* give you is keyboard access, so the
 * board pairs this with explicit move shortcuts — see `KanbanCard`.
 *
 * `useState` rather than a module-level ref, so the state does not leak between
 * requests during SSR.
 */
export function useCardDrag() {
  const draggingId = useState<string | null>('board.dragging', () => null)
  /** `columnId:index` of the gap the card would drop into. */
  const dropTarget = useState<string | null>('board.dropTarget', () => null)

  function start(cardId: string) {
    draggingId.value = cardId
  }

  function end() {
    draggingId.value = null
    dropTarget.value = null
  }

  function hover(columnId: string, index: number) {
    dropTarget.value = `${columnId}:${index}`
  }

  function isTarget(columnId: string, index: number) {
    return dropTarget.value === `${columnId}:${index}`
  }

  return { draggingId, dropTarget, start, end, hover, isTarget }
}
