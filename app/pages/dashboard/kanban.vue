<script setup lang="ts">
import type { BoardCard, BoardTone } from '#shared/types'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { t } = useI18n()
const fmt = useFormat()

useSeoMeta({ title: () => t('nav.kanban'), robots: 'noindex' })

const board = useBoard()

// --- Card editor -------------------------------------------------------------

const detailOpen = ref(false)
const detailCard = ref<BoardCard | null>(null)
const createInColumn = ref<string | null>(null)

function openCard(card: BoardCard) {
  detailCard.value = card
  createInColumn.value = null
  detailOpen.value = true
}

function openNewCard(columnId: string) {
  detailCard.value = null
  createInColumn.value = columnId
  detailOpen.value = true
}

// --- Moves -------------------------------------------------------------------

/**
 * Ctrl+←/→ on a card. Only this page knows the column order, so the columns
 * emit a direction and the translation to a target column happens here.
 */
function shiftCard(cardId: string, direction: -1 | 1) {
  const columns = board.columns.value
  const fromIndex = columns.findIndex(column => column.cards.some(card => card.id === cardId))
  if (fromIndex === -1) return

  const toIndex = fromIndex + direction
  // Silently ignore rather than wrapping around: a card at the last stage
  // jumping back to the first would be a surprise, not a shortcut.
  if (toIndex < 0 || toIndex >= columns.length) return

  const target = columns[toIndex]!
  board.move(cardId, target.id, target.cards.length)
}

// --- Stages ------------------------------------------------------------------

const stageModalOpen = ref(false)
const stageMode = ref<'create' | 'rename'>('create')
const stageId = ref<string | null>(null)
const stageTitle = ref('')
const stageTone = ref<BoardTone>('neutral')
const stageBusy = ref(false)

const TONES: BoardTone[] = ['risk', 'progress', 'neutral', 'won', 'lost']

function openNewStage() {
  stageMode.value = 'create'
  stageId.value = null
  stageTitle.value = ''
  stageTone.value = 'neutral'
  stageModalOpen.value = true
}

function openRenameStage(columnId: string) {
  const column = board.columns.value.find(item => item.id === columnId)
  if (!column) return
  stageMode.value = 'rename'
  stageId.value = columnId
  stageTitle.value = column.title
  stageTone.value = column.tone
  stageModalOpen.value = true
}

async function submitStage() {
  if (stageTitle.value.trim().length < 2) return
  stageBusy.value = true
  try {
    if (stageMode.value === 'create') {
      await board.createColumn(stageTitle.value.trim(), stageTone.value)
    } else if (stageId.value) {
      await board.renameColumn(stageId.value, stageTitle.value.trim())
    }
    stageModalOpen.value = false
  } catch {
    // The composable has already surfaced the failure as a toast.
  } finally {
    stageBusy.value = false
  }
}

// Deleting a stage takes its cards. That is worth a confirmation.
const removeStageId = ref<string | null>(null)

const removingStage = computed(() =>
  board.columns.value.find(column => column.id === removeStageId.value)
)

async function confirmRemoveStage() {
  if (!removeStageId.value) return
  await board.deleteColumn(removeStageId.value)
  removeStageId.value = null
}

// --- Header figures ----------------------------------------------------------

const totalsById = computed(() =>
  new Map(board.totals.value.map(total => [total.id, total]))
)

const atStake = computed(() =>
  board.columns.value
    // Only the stages still in play — a renewed or churned account is settled.
    .filter(column => column.tone !== 'won' && column.tone !== 'lost')
    .reduce((sum, column) => sum + column.cards.reduce((inner, card) => inner + card.mrr, 0), 0)
)

const cardCount = computed(() =>
  board.columns.value.reduce((sum, column) => sum + column.cards.length, 0)
)
</script>

<template>
  <UDashboardPanel id="kanban">
    <template #header>
      <UDashboardNavbar :title="$t('nav.kanban')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            :loading="board.pending.value"
            :aria-label="$t('common.refresh')"
            @click="board.refresh()"
          />
          <UButton
            :label="$t('board.addStage')"
            icon="i-lucide-plus"
            size="sm"
            @click="openNewStage"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex h-full flex-col gap-4">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 class="font-display text-xl font-semibold tracking-tight text-highlighted sm:text-2xl">
              {{ $t('board.heading') }}
            </h2>
            <p class="mt-1 max-w-2xl text-sm text-muted">
              {{ $t('board.intro') }}
            </p>
          </div>

          <dl class="flex gap-6">
            <div>
              <dt class="eyebrow text-dimmed">
                {{ $t('board.openRenewals') }}
              </dt>
              <dd class="tnum text-lg font-semibold text-highlighted">
                {{ fmt.number(cardCount) }}
              </dd>
            </div>
            <div>
              <dt class="eyebrow text-dimmed">
                {{ $t('board.mrrAtStake') }}
              </dt>
              <dd class="tnum text-lg font-semibold text-highlighted">
                {{ fmt.currency(atStake) }}
              </dd>
            </div>
          </dl>
        </div>

        <UAlert
          v-if="board.error.value"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          :title="$t('board.loadFailed')"
          :description="$t('board.loadFailedBody')"
          :actions="[{ label: $t('common.retry'), variant: 'subtle', color: 'error', onClick: () => board.refresh() }]"
        />

        <!-- Keyboard hint, stated rather than hidden in a tooltip. A board that
             only responds to a mouse is unusable for a lot of people. -->
        <p class="flex items-center gap-1.5 text-xs text-dimmed">
          <UIcon name="i-lucide-keyboard" class="size-3.5 shrink-0" />
          {{ $t('board.keyboardHint') }}
        </p>

        <div v-if="board.pending.value && !board.columns.value.length" class="flex gap-4">
          <div v-for="i in 4" :key="i" class="h-64 w-72 shrink-0 animate-pulse rounded-[calc(var(--ui-radius)*1.5)] bg-elevated" />
        </div>

        <!-- The board scrolls sideways in its own container, never the page. -->
        <div v-else class="-mx-1 flex flex-1 gap-4 overflow-x-auto px-1 pb-2">
          <KanbanColumn
            v-for="(column, index) in board.columns.value"
            :key="column.id"
            :column="column"
            :generated-at="board.generatedAt.value"
            :is-first="index === 0"
            :is-last="index === board.columns.value.length - 1"
            :total="totalsById.get(column.id) ?? { count: 0, mrr: 0 }"
            @open-card="openCard"
            @add-card="openNewCard"
            @move-card="board.move"
            @shift-card="shiftCard"
            @rename="openRenameStage"
            @remove="removeStageId = $event"
          />

          <button
            type="button"
            class="flex h-fit w-72 shrink-0 items-center justify-center gap-2 rounded-[calc(var(--ui-radius)*1.5)] border border-dashed border-accented p-4 text-sm text-dimmed transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            @click="openNewStage"
          >
            <UIcon name="i-lucide-plus" class="size-4" />
            {{ $t('board.addStage') }}
          </button>
        </div>
      </div>

      <!-- Inside the panel body so the page keeps a single root element. Every
           one of these teleports to the app root regardless. -->
      <KanbanCardDetail
        v-model:open="detailOpen"
        :card="detailCard"
        :columns="board.columns.value"
        :create-in-column="createInColumn"
        @create="board.createCard($event as never)"
        @save="detailCard && board.updateCard(detailCard.id, $event)"
        @remove="board.deleteCard"
      />

      <UModal
        v-model:open="stageModalOpen"
        :title="stageMode === 'create' ? $t('board.addStage') : $t('board.renameStage')"
      >
        <template #body>
          <div class="space-y-4">
            <UFormField :label="$t('board.field.stageName')" required>
              <UInput
                v-model="stageTitle"
                :placeholder="$t('board.field.stagePlaceholder')"
                class="w-full"
                autofocus
                @keydown.enter="submitStage"
              />
            </UFormField>

            <UFormField v-if="stageMode === 'create'" :label="$t('board.field.stageTone')">
              <div class="flex flex-wrap gap-2">
                <UButton
                  v-for="tone in TONES"
                  :key="tone"
                  :label="$t(`board.tones.${tone}`)"
                  size="sm"
                  :color="stageTone === tone ? 'primary' : 'neutral'"
                  :variant="stageTone === tone ? 'solid' : 'outline'"
                  :aria-pressed="stageTone === tone"
                  @click="stageTone = tone"
                />
              </div>
            </UFormField>
          </div>
        </template>
        <template #footer>
          <div class="flex w-full justify-end gap-2">
            <UButton :label="$t('common.cancel')" color="neutral" variant="ghost" @click="stageModalOpen = false" />
            <UButton
              :label="stageMode === 'create' ? $t('board.createStage') : $t('common.save')"
              :loading="stageBusy"
              :disabled="stageTitle.trim().length < 2"
              @click="submitStage"
            />
          </div>
        </template>
      </UModal>

      <UModal :open="removeStageId !== null" :title="$t('board.deleteStage')" @update:open="removeStageId = null">
        <template #body>
          <p class="text-sm text-muted">
            {{ $t('board.deleteStageBody', {
              stage: removingStage?.title ?? '',
              count: removingStage?.cards.length ?? 0
            }) }}
          </p>
        </template>
        <template #footer>
          <div class="flex w-full justify-end gap-2">
            <UButton :label="$t('common.cancel')" color="neutral" variant="ghost" @click="removeStageId = null" />
            <UButton :label="$t('board.deleteStage')" color="error" @click="confirmRemoveStage" />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
