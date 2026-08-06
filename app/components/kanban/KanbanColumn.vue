<script setup lang="ts">
import type { BoardCard, BoardColumn } from '#shared/types'

const props = defineProps<{
  column: BoardColumn
  generatedAt: string
  isFirst: boolean
  isLast: boolean
  total: { count: number, mrr: number }
}>()

const emit = defineEmits<{
  drop: [columnId: string, index: number]
  openCard: [card: BoardCard]
  addCard: [columnId: string]
  moveCard: [cardId: string, columnId: string, index: number]
  /** Shift+←/→ on a card. Only the page knows the column order. */
  shiftCard: [cardId: string, direction: -1 | 1]
  rename: [columnId: string]
  remove: [columnId: string]
}>()

const { t } = useI18n()
const fmt = useFormat()
const drag = useCardDrag()

const TONE_BAR: Record<string, string> = {
  risk: 'var(--cadence-churn)',
  progress: 'var(--cadence-contraction)',
  neutral: 'var(--ui-primary)',
  won: 'var(--cadence-expansion)',
  lost: 'var(--color-slate-400)'
}

/** Collapsed columns keep their header, so the board stays navigable. */
const collapsed = ref(false)

const menuItems = computed(() => [
  [
    { label: t('board.addCard'), icon: 'i-lucide-plus', onSelect: () => emit('addCard', props.column.id) },
    { label: t('board.renameStage'), icon: 'i-lucide-pencil', onSelect: () => emit('rename', props.column.id) },
    {
      label: collapsed.value ? t('board.expand') : t('board.collapse'),
      icon: collapsed.value ? 'i-lucide-chevrons-left-right' : 'i-lucide-chevrons-right-left',
      onSelect: () => { collapsed.value = !collapsed.value }
    }
  ],
  [{ label: t('board.deleteStage'), icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: () => emit('remove', props.column.id) }]
])

function onDrop(index: number) {
  const cardId = drag.draggingId.value
  drag.end()
  if (cardId) emit('moveCard', cardId, props.column.id, index)
}
</script>

<template>
  <section
    class="flex shrink-0 flex-col rounded-[calc(var(--ui-radius)*1.5)] bg-elevated/40 ring ring-default transition-[width]"
    :class="collapsed ? 'w-14' : 'w-72'"
    :aria-label="column.title"
  >
    <!-- Header -->
    <div class="flex items-center gap-2 border-b border-default p-3" :class="collapsed ? 'flex-col' : ''">
      <span class="h-4 w-1 shrink-0 rounded-full" :style="{ background: TONE_BAR[column.tone] }" />

      <template v-if="!collapsed">
        <div class="min-w-0 flex-1">
          <h3 class="truncate text-sm font-semibold text-highlighted">
            {{ column.title }}
          </h3>
          <p class="tnum mt-0.5 text-xs text-dimmed">
            {{ total.count }} · {{ fmt.currency(total.mrr) }}
          </p>
        </div>

        <UDropdownMenu :items="menuItems" :content="{ align: 'end' }">
          <UButton
            icon="i-lucide-ellipsis"
            color="neutral"
            variant="ghost"
            size="xs"
            :aria-label="$t('board.stageActions', { stage: column.title })"
          />
        </UDropdownMenu>
      </template>

      <UButton
        v-else
        icon="i-lucide-chevrons-left-right"
        color="neutral"
        variant="ghost"
        size="xs"
        :aria-label="$t('board.expand')"
        @click="collapsed = false"
      />
    </div>

    <template v-if="!collapsed">
      <!-- Cards. Each gap is its own drop zone, which is what lets a card be
           dropped *between* two others rather than only appended. -->
      <div class="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto p-2">
        <div
          class="h-1.5 shrink-0 rounded-full transition-colors"
          :class="drag.isTarget(column.id, 0) ? 'bg-primary' : 'bg-transparent'"
          @dragover.prevent="drag.hover(column.id, 0)"
          @drop.prevent="onDrop(0)"
        />

        <template v-for="(card, index) in column.cards" :key="card.id">
          <KanbanCard
            :card="card"
            :index="index"
            :column-title="column.title"
            :column-count="column.cards.length"
            :generated-at="generatedAt"
            :is-first-column="isFirst"
            :is-last-column="isLast"
            @open="emit('openCard', $event)"
            @move-column="emit('shiftCard', card.id, $event)"
            @move-within="emit('moveCard', card.id, column.id, index + $event)"
          />

          <div
            class="h-1.5 shrink-0 rounded-full transition-colors"
            :class="drag.isTarget(column.id, index + 1) ? 'bg-primary' : 'bg-transparent'"
            @dragover.prevent="drag.hover(column.id, index + 1)"
            @drop.prevent="onDrop(index + 1)"
          />
        </template>

        <!-- An empty column still needs a target, or cards can never enter it. -->
        <div
          v-if="column.cards.length === 0"
          class="flex flex-1 items-center justify-center rounded-[var(--ui-radius)] border border-dashed border-accented p-4 text-center text-xs text-dimmed"
          @dragover.prevent="drag.hover(column.id, 0)"
          @drop.prevent="onDrop(0)"
        >
          {{ $t('board.emptyStage') }}
        </div>
      </div>

      <div class="border-t border-default p-2">
        <UButton
          :label="$t('board.addCard')"
          icon="i-lucide-plus"
          color="neutral"
          variant="ghost"
          size="sm"
          block
          class="justify-start"
          @click="emit('addCard', column.id)"
        />
      </div>
    </template>
  </section>
</template>
