<script setup lang="ts">
import type { BoardCard } from '#shared/types'
import { isOverdue } from '#shared/board'

/**
 * One renewal on the board.
 *
 * Draggable with a mouse, **movable with a keyboard**. HTML5 drag and drop is
 * mouse-only, so without the shortcuts below this card would be unreachable for
 * anyone not using one — which is most of the reason kanban boards score badly
 * on accessibility audits.
 */
const props = defineProps<{
  card: BoardCard
  index: number
  /** Position in the column list, for the announced label. */
  columnTitle: string
  columnCount: number
  generatedAt: string
  isFirstColumn: boolean
  isLastColumn: boolean
}>()

const emit = defineEmits<{
  open: [card: BoardCard]
  moveColumn: [direction: -1 | 1]
  moveWithin: [direction: -1 | 1]
}>()

const { t } = useI18n()
const fmt = useFormat()
const drag = useCardDrag()

const overdue = computed(() => isOverdue(props.card.dueAt, props.generatedAt))

const LABEL_TONE: Record<string, string> = {
  paymentFailed: 'error',
  usageDown: 'warning',
  championLeft: 'warning',
  contractEnding: 'info',
  priceObjection: 'neutral',
  competitor: 'error'
}

/**
 * Ctrl/Cmd + arrows move the card; plain arrows are left alone so the browser's
 * own scrolling still works.
 */
function onKeydown(event: KeyboardEvent) {
  if (!(event.ctrlKey || event.metaKey)) return

  const handled: Record<string, () => void> = {
    ArrowLeft: () => emit('moveColumn', -1),
    ArrowRight: () => emit('moveColumn', 1),
    ArrowUp: () => emit('moveWithin', -1),
    ArrowDown: () => emit('moveWithin', 1)
  }

  const action = handled[event.key]
  if (!action) return

  event.preventDefault()
  action()
}

const ariaLabel = computed(() =>
  t('board.cardAria', {
    title: props.card.title,
    position: props.index + 1,
    total: props.columnCount,
    column: props.columnTitle,
    mrr: fmt.value.currency(props.card.mrr)
  })
)
</script>

<template>
  <div
    class="group cursor-grab rounded-[var(--ui-radius)] bg-default p-3 ring ring-default transition-all hover:ring-accented focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:cursor-grabbing"
    :class="drag.draggingId.value === card.id ? 'opacity-40' : ''"
    draggable="true"
    role="button"
    tabindex="0"
    :aria-label="ariaLabel"
    @dragstart="drag.start(card.id)"
    @dragend="drag.end()"
    @click="emit('open', card)"
    @keydown="onKeydown"
    @keydown.enter.prevent="emit('open', card)"
    @keydown.space.prevent="emit('open', card)"
  >
    <div v-if="card.labels.length" class="mb-2 flex flex-wrap gap-1">
      <UBadge
        v-for="label in card.labels"
        :key="label"
        :label="$t(`board.labels.${label}`)"
        :color="(LABEL_TONE[label] ?? 'neutral') as never"
        variant="subtle"
        size="sm"
      />
    </div>

    <p class="text-sm font-medium leading-snug text-highlighted">
      {{ card.title }}
    </p>

    <p class="tnum mt-1 text-sm font-semibold text-highlighted">
      {{ fmt.currency(card.mrr) }}
      <span class="text-xs font-normal text-dimmed">{{ $t('board.atStake') }}</span>
    </p>

    <div class="mt-3 flex items-center justify-between gap-2">
      <UTooltip :text="card.ownerName">
        <UAvatar
          :text="card.ownerName.split(' ').map(part => part[0]).slice(0, 2).join('')"
          size="2xs"
          :style="{ background: card.ownerColor, color: '#fff' }"
        />
      </UTooltip>

      <div class="flex items-center gap-2.5 text-xs">
        <span v-if="card.commentCount" class="flex items-center gap-1 text-dimmed">
          <UIcon name="i-lucide-message-square" class="size-3.5" />
          <span class="tnum">{{ card.commentCount }}</span>
        </span>

        <!-- Overdue is colour plus an icon, so it survives greyscale and
             colour blindness. -->
        <span
          v-if="card.dueAt"
          class="flex items-center gap-1"
          :class="overdue ? 'font-medium text-error' : 'text-dimmed'"
        >
          <UIcon :name="overdue ? 'i-lucide-calendar-x' : 'i-lucide-calendar'" class="size-3.5" />
          {{ fmt.date(card.dueAt) }}
        </span>
      </div>
    </div>
  </div>
</template>
