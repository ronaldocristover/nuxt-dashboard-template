<script setup lang="ts">
import { CalendarDate, parseAbsolute, getLocalTimeZone } from '@internationalized/date'
import type { BoardCard, BoardColumn, BoardLabel } from '#shared/types'
import { BOARD_LABELS } from '#shared/board'

/**
 * Card editor. A slideover rather than a modal, because the board behind it is
 * the context — someone editing a renewal wants to still see where it sits.
 */
const props = defineProps<{
  card: BoardCard | null
  columns: BoardColumn[]
  /** Create mode: no card yet, and this is the stage it lands in. */
  createInColumn?: string | null
}>()

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  save: [payload: Record<string, unknown>]
  create: [payload: Record<string, unknown>]
  remove: [id: string]
}>()

const { t } = useI18n()
const fmt = useFormat()

const isCreate = computed(() => props.card === null)

const OWNERS = [
  { name: 'Hana Nakamura', color: '#0d9488' },
  { name: 'Mateo Rossi', color: '#d97706' },
  { name: 'Priya Ibrahim', color: '#7c3aed' },
  { name: 'Ronaldo Cristover', color: '#2d5bff' }
]

// `shallowReactive` because `dueDate` holds a CalendarDate class instance, and
// deep reactivity rewrites those into plain objects.
const form = shallowReactive({
  title: '',
  account: '',
  mrr: 0,
  ownerName: OWNERS[0]!.name,
  labels: [] as BoardLabel[],
  notes: '',
  dueDate: undefined as CalendarDate | undefined
})

const saving = ref(false)
const confirmDelete = ref(false)

function toCalendarDate(iso: string | null): CalendarDate | undefined {
  if (!iso) return undefined
  const zoned = parseAbsolute(iso, getLocalTimeZone())
  return new CalendarDate(zoned.year, zoned.month, zoned.day)
}

/** Reseeds the form whenever the slideover opens on a different card. */
watch([() => props.card, open], () => {
  if (!open.value) return

  const card = props.card
  form.title = card?.title ?? ''
  form.account = card?.account ?? ''
  form.mrr = card?.mrr ?? 0
  form.ownerName = card?.ownerName ?? OWNERS[0]!.name
  form.labels = [...(card?.labels ?? [])]
  form.notes = card?.notes ?? ''
  form.dueDate = toCalendarDate(card?.dueAt ?? null)
  confirmDelete.value = false
}, { immediate: true })

const labelItems = computed(() =>
  BOARD_LABELS.map(label => ({ label: t(`board.labels.${label}`), value: label }))
)

const ownerItems = computed(() => OWNERS.map(owner => ({ label: owner.name, value: owner.name })))

const valid = computed(() => form.title.trim().length >= 2 && form.account.trim().length >= 1)

function payload() {
  const owner = OWNERS.find(item => item.name === form.ownerName) ?? OWNERS[0]!
  return {
    title: form.title.trim(),
    account: form.account.trim(),
    mrr: Math.max(0, Math.round(form.mrr)),
    ownerName: owner.name,
    ownerColor: owner.color,
    labels: form.labels,
    notes: form.notes,
    // Midnight UTC of the chosen day — a renewal is a date, not a moment.
    dueAt: form.dueDate
      ? new Date(Date.UTC(form.dueDate.year, form.dueDate.month - 1, form.dueDate.day)).toISOString()
      : null
  }
}

async function submit() {
  if (!valid.value) return
  saving.value = true
  try {
    if (isCreate.value) {
      emit('create', { ...payload(), columnId: props.createInColumn })
    } else {
      emit('save', payload())
    }
    open.value = false
  } finally {
    saving.value = false
  }
}

const currentStage = computed(() =>
  props.columns.find(column => column.id === (props.card?.columnId ?? props.createInColumn))?.title ?? ''
)
</script>

<template>
  <USlideover
    v-model:open="open"
    :title="isCreate ? $t('board.newCard') : $t('board.editCard')"
    :description="currentStage"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField :label="$t('board.field.title')" required>
          <UInput v-model="form.title" :placeholder="$t('board.field.titlePlaceholder')" class="w-full" autofocus />
        </UFormField>

        <UFormField :label="$t('board.field.account')" required>
          <UInput v-model="form.account" placeholder="Northwind Labs" class="w-full" />
        </UFormField>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField :label="$t('board.field.mrr')" :help="$t('board.field.mrrHelp')">
            <UInputNumber
              v-model="form.mrr"
              :min="0"
              :step="50"
              class="w-full"
              :format-options="{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }"
            />
          </UFormField>

          <UFormField :label="$t('board.field.due')">
            <UInputDate v-model="form.dueDate" class="w-full" />
          </UFormField>
        </div>

        <UFormField :label="$t('board.field.owner')">
          <USelect v-model="form.ownerName" :items="ownerItems" class="w-full" />
        </UFormField>

        <UFormField :label="$t('board.field.labels')" :help="$t('board.field.labelsHelp')">
          <USelectMenu
            v-model="form.labels"
            :items="labelItems"
            value-key="value"
            multiple
            class="w-full"
          />
        </UFormField>

        <UFormField :label="$t('board.field.notes')" :hint="$t('common.optional')">
          <UTextarea
            v-model="form.notes"
            autoresize
            :rows="3"
            :maxrows="10"
            :placeholder="$t('board.field.notesPlaceholder')"
            class="w-full"
          />
        </UFormField>

        <div v-if="!isCreate && card" class="border-t border-default pt-4">
          <p class="eyebrow text-dimmed">
            {{ $t('board.field.activity') }}
          </p>
          <p class="mt-1 text-xs text-muted">
            {{ $t('board.field.commentCount', { count: card.commentCount }) }}
            <template v-if="card.dueAt">
              · {{ $t('board.field.renews', { date: fmt.date(card.dueAt) }) }}
            </template>
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center gap-2">
        <UButton
          v-if="!isCreate && card"
          :label="confirmDelete ? $t('board.confirmDelete') : $t('common.delete')"
          :color="confirmDelete ? 'error' : 'neutral'"
          :variant="confirmDelete ? 'solid' : 'ghost'"
          icon="i-lucide-trash-2"
          @click="confirmDelete ? (emit('remove', card.id), open = false) : (confirmDelete = true)"
        />
        <div class="ms-auto flex gap-2">
          <UButton :label="$t('common.cancel')" color="neutral" variant="ghost" @click="open = false" />
          <UButton
            :label="isCreate ? $t('board.createCard') : $t('common.save')"
            :loading="saving"
            :disabled="!valid"
            @click="submit"
          />
        </div>
      </div>
    </template>
  </USlideover>
</template>
