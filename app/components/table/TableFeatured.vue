<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import type { Subscriber, SubscribersResponse } from '#shared/types'
import { initials } from '#shared/format'

/**
 * `UTable` — the TanStack-backed component — with the features a real table
 * needs: sorting, selection, expandable rows, column visibility, pagination.
 *
 * The Subscribers page deliberately does NOT use this. It hand-builds its
 * markup so it can become a stacked card list on a phone, which a `<table>`
 * cannot do. This is the other trade-off: far less code, far more behaviour,
 * and a horizontal scroll on small screens.
 */

// Components used inside `cell` renderers have to be resolved, because those
// run outside the template's own resolution scope.
const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UCheckbox = resolveComponent('UCheckbox')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const { notifySuccess } = useApiError()
const fmt = useFormat()
const { t } = useI18n()

const page = ref(1)
const pageSize = ref(8)

const { data, status } = await useApiFetch<SubscribersResponse>(
  () => `/api/subscribers?page=${page.value}&pageSize=${pageSize.value}&sort=mrr&order=desc`,
  { watch: [page, pageSize] }
)

const rows = computed(() => data.value?.rows ?? [])
const loading = computed(() => status.value === 'pending')

const STATUS_COLOR = {
  active: 'success',
  trialing: 'info',
  past_due: 'warning',
  churned: 'neutral'
} as const

/** A sortable header is a button, so it is reachable by keyboard. */
function sortableHeader(label: string) {
  return ({ column }: { column: { getIsSorted: () => false | 'asc' | 'desc', toggleSorting: (desc?: boolean) => void } }) => {
    const sorted = column.getIsSorted()
    return h(UButton, {
      color: 'neutral',
      variant: 'ghost',
      size: 'sm',
      label,
      icon: sorted
        ? (sorted === 'asc' ? 'i-lucide-arrow-up-narrow-wide' : 'i-lucide-arrow-down-wide-narrow')
        : 'i-lucide-arrow-up-down',
      class: '-mx-2.5',
      onClick: () => column.toggleSorting(sorted === 'asc')
    })
  }
}

const columns = computed<TableColumn<Subscriber>[]>(() => [
  {
    id: 'select',
    header: ({ table }) => h(UCheckbox, {
      'modelValue': table.getIsSomePageRowsSelected() ? 'indeterminate' : table.getIsAllPageRowsSelected(),
      'onUpdate:modelValue': (value: boolean | 'indeterminate') => table.toggleAllPageRowsSelected(!!value),
      'aria-label': t('subscribers.selectAll')
    }),
    cell: ({ row }) => h(UCheckbox, {
      'modelValue': row.getIsSelected(),
      'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
      'aria-label': t('subscribers.selectRow', { name: row.original.company })
    }),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: 'company',
    header: sortableHeader(t('subscribers.columnAccount')),
    cell: ({ row }) => h('div', { class: 'flex items-center gap-2.5' }, [
      h(UAvatar, {
        text: initials(row.original.company),
        size: 'xs',
        style: { background: row.original.avatarColor, color: '#fff' }
      }),
      h('div', { class: 'min-w-0' }, [
        h('p', { class: 'truncate font-medium text-highlighted' }, row.original.company),
        h('p', { class: 'truncate text-xs text-dimmed' }, row.original.country)
      ])
    ])
  },
  {
    accessorKey: 'name',
    header: sortableHeader(t('subscribers.columnContact')),
    cell: ({ row }) => h('div', { class: 'min-w-0' }, [
      h('p', { class: 'truncate text-default' }, row.original.name),
      h('p', { class: 'truncate text-xs text-dimmed' }, row.original.email)
    ])
  },
  {
    accessorKey: 'plan',
    header: t('subscribers.detail.plan'),
    cell: ({ row }) => h(UBadge, {
      label: t(`plans.${row.original.plan}`),
      color: 'neutral',
      variant: 'subtle',
      size: 'sm'
    })
  },
  {
    accessorKey: 'mrr',
    header: sortableHeader(t('subscribers.columnMrr')),
    meta: { class: { th: 'text-right', td: 'text-right tnum font-medium text-highlighted' } },
    cell: ({ row }) => fmt.value.currency(row.original.mrr)
  },
  {
    accessorKey: 'seats',
    header: sortableHeader(t('subscribers.columnSeats')),
    meta: { class: { th: 'text-right', td: 'text-right tnum text-muted' } },
    cell: ({ row }) => fmt.value.number(row.original.seats)
  },
  {
    accessorKey: 'status',
    header: t('subscribers.columnStatus'),
    cell: ({ row }) => h(UBadge, {
      label: t(`status.${row.original.status}`),
      color: STATUS_COLOR[row.original.status],
      variant: 'subtle',
      size: 'sm'
    })
  },
  {
    id: 'actions',
    enableHiding: false,
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => h(UDropdownMenu, {
      'content': { align: 'end' },
      'items': [
        [{
          label: row.getIsExpanded() ? 'Collapse row' : 'Expand row',
          icon: row.getIsExpanded() ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down',
          onSelect: () => row.toggleExpanded()
        }, {
          label: 'Copy account ID',
          icon: 'i-lucide-clipboard',
          onSelect: () => {
            navigator.clipboard?.writeText(row.original.id)
            notifySuccess('Copied', row.original.id)
          }
        }],
        [{ label: 'Archive', icon: 'i-lucide-archive', color: 'error' as const }]
      ],
      'aria-label': `Actions for ${row.original.company}`
    }, () => h(UButton, {
      'icon': 'i-lucide-ellipsis-vertical',
      'color': 'neutral',
      'variant': 'ghost',
      'size': 'sm',
      'aria-label': `Actions for ${row.original.company}`
    }))
  }
])

// --- Table state -------------------------------------------------------------

/**
 * Only the slice of the TanStack API this component actually touches.
 *
 * Typing the template ref explicitly also breaks a circular inference: without
 * an annotation, `table` depends on `columnItems`, which depends on `table`.
 */
interface ColumnApi {
  id: string
  columnDef: { header?: unknown }
  getCanHide: () => boolean
  getIsVisible: () => boolean
  toggleVisibility: (value: boolean) => void
}

const table = useTemplateRef<{ tableApi?: { getAllColumns: () => ColumnApi[] } }>('table')

const rowSelection = ref<Record<string, boolean>>({})
const expanded = ref<Record<string, boolean>>({})
const sorting = ref([{ id: 'mrr', desc: true }])
const columnVisibility = ref<Record<string, boolean>>({})

// Selection is keyed by row index, so it must be cleared when the page turns —
// otherwise row 2 of page 2 inherits row 2 of page 1's tick.
watch([page, pageSize], () => {
  rowSelection.value = {}
  expanded.value = {}
})

const selectedCount = computed(() => Object.values(rowSelection.value).filter(Boolean).length)

const hideableColumns = computed<ColumnApi[]>(() =>
  table.value?.tableApi?.getAllColumns().filter(column => column.getCanHide()) ?? []
)

const columnItems = computed<DropdownMenuItem[]>(() =>
  hideableColumns.value.map(column => ({
    // A sortable header is a render function, so fall back to the column id.
    label: typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id,
    type: 'checkbox' as const,
    checked: column.getIsVisible(),
    onUpdateChecked: (checked: boolean) => column.toggleVisibility(checked),
    // Keep the menu open so several columns can be toggled in one go.
    onSelect: (event: Event) => event.preventDefault()
  }))
)

const total = computed(() => data.value?.total ?? 0)
</script>

<template>
  <PanelSection
    title="UTable"
    description="Sorting, selection, expandable rows, hideable columns and pagination — all from column definitions rather than markup. Click a header to sort, tick a row, expand one from its actions menu."
  >
    <div class="flex flex-wrap items-center gap-2 pb-3">
      <p v-if="selectedCount" class="text-sm font-medium text-highlighted">
        {{ $t('subscribers.selectedOnPage', { count: selectedCount }) }}
      </p>
      <p v-else class="text-sm text-muted">
        {{ $t('subscribers.showing', {
          from: (page - 1) * pageSize + 1,
          to: Math.min(page * pageSize, total),
          total
        }) }}
      </p>

      <div class="flex items-center gap-2 sm:ms-auto">
        <UButton
          v-if="selectedCount"
          :label="$t('subscribers.clearSelection')"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="rowSelection = {}"
        />
        <UDropdownMenu :items="columnItems" :content="{ align: 'end' }">
          <UButton
            label="Columns"
            icon="i-lucide-columns-3"
            color="neutral"
            variant="outline"
            size="sm"
          />
        </UDropdownMenu>
      </div>
    </div>

    <!-- A table cannot reflow, so it scrolls inside its own container rather
         than pushing the page sideways. -->
    <div class="overflow-x-auto rounded-[var(--ui-radius)] ring ring-default">
      <UTable
        ref="table"
        v-model:row-selection="rowSelection"
        v-model:expanded="expanded"
        v-model:sorting="sorting"
        v-model:column-visibility="columnVisibility"
        :data="rows"
        :columns="columns"
        :loading="loading"
        sticky
        class="min-w-3xl"
        :ui="{ tr: 'data-[selected=true]:bg-primary/5' }"
      >
        <!-- Expanded rows carry the detail that does not deserve a column. -->
        <template #expanded="{ row }">
          <div class="grid gap-4 bg-elevated/40 px-4 py-3 sm:grid-cols-3">
            <div>
              <p class="eyebrow text-dimmed">
                {{ $t('subscribers.detail.since') }}
              </p>
              <p class="tnum mt-0.5 text-sm text-default">
                {{ fmt.date(row.original.joinedAt) }}
              </p>
            </div>
            <div>
              <p class="eyebrow text-dimmed">
                {{ $t('subscribers.detail.lastSeen') }}
              </p>
              <p class="mt-0.5 text-sm text-default">
                {{ data ? fmt.relative(row.original.lastSeenAt, data.generatedAt) : '—' }}
              </p>
            </div>
            <div>
              <p class="eyebrow text-dimmed">
                Account ID
              </p>
              <p class="tnum mt-0.5 text-sm text-default">
                {{ row.original.id }}
              </p>
            </div>
          </div>
        </template>

        <template #empty>
          <EmptyState
            icon="i-lucide-users"
            :title="$t('subscribers.empty')"
            :description="$t('subscribers.emptyBody')"
          />
        </template>
      </UTable>
    </div>

    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-between gap-3">
        <USelect
          v-model="pageSize"
          :items="[8, 16, 32]"
          size="sm"
          class="w-20"
          :aria-label="$t('subscribers.rowsPerPage')"
        />
        <UPagination
          v-model:page="page"
          :total="total"
          :items-per-page="pageSize"
          :sibling-count="1"
          size="sm"
        />
      </div>
    </template>
  </PanelSection>
</template>
