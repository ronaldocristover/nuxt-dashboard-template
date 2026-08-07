<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Invoice } from '#shared/types'

/**
 * The Billing tab's table.
 *
 * `UTable` rather than hand-built markup, on purpose: this is tabular data with
 * no mobile card layout to preserve, so the TanStack component earns its keep —
 * sorting, filtering and paging for a fraction of the code. The member list one
 * screen away hand-builds its table because it *does* become a card stack on a
 * phone. Both approaches ship in this template; this is the case for each.
 *
 * The rows arrive with the member, so filtering and sorting happen here in the
 * browser. That is the right call for a few dozen invoices and the wrong one
 * for a few thousand — at which point this takes a query the way the member
 * list does.
 */

const props = defineProps<{
  invoices: Invoice[]
  totals: { paid: number, open: number, failed: number }
}>()

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

const { t } = useI18n()
const fmt = useFormat()

const search = ref('')
const page = ref(1)
const pageSize = 8

const STATUS_COLOR = {
  paid: 'success',
  open: 'info',
  failed: 'error'
} as const

const filtered = computed(() => {
  const needle = search.value.trim().toLowerCase()
  if (!needle) return props.invoices

  return props.invoices.filter(invoice =>
    invoice.number.toLowerCase().includes(needle)
    || invoice.subscriber.toLowerCase().includes(needle))
})

// Filtering while on page 3 should show the first page of the new result.
watch(search, () => {
  page.value = 1
})

const rows = computed(() =>
  filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))

/** A sortable header is a button, so the order is reachable by keyboard. */
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

const columns = computed<TableColumn<Invoice>[]>(() => [
  {
    accessorKey: 'number',
    header: sortableHeader(t('members.detail.invoiceNumber')),
    cell: ({ row }) => h('span', { class: 'tnum font-medium text-highlighted' }, row.original.number)
  },
  {
    accessorKey: 'subscriber',
    header: sortableHeader(t('members.detail.invoiceAccount')),
    cell: ({ row }) => h('span', { class: 'text-default' }, row.original.subscriber)
  },
  {
    accessorKey: 'amount',
    header: sortableHeader(t('members.detail.invoiceAmount')),
    // Money right-aligned and tabular, so the columns of digits line up.
    cell: ({ row }) => h('span', { class: 'tnum block text-right font-medium text-highlighted' },
      fmt.value.currency(row.original.amount)),
    meta: { class: { th: 'text-right', td: 'text-right' } }
  },
  {
    accessorKey: 'status',
    header: t('members.detail.invoiceStatus'),
    // Status is a word as well as a colour, never colour alone.
    cell: ({ row }) => h(UBadge, {
      color: STATUS_COLOR[row.original.status],
      variant: 'subtle',
      label: t(`members.detail.invoice${row.original.status[0]!.toUpperCase()}${row.original.status.slice(1)}`)
    })
  },
  {
    accessorKey: 'issuedAt',
    header: sortableHeader(t('members.detail.invoiceIssued')),
    cell: ({ row }) => h('span', { class: 'tnum text-muted' }, fmt.value.date(row.original.issuedAt))
  }
])

const summary = computed(() => [
  { key: 'paid', label: t('members.detail.invoicePaid'), value: props.totals.paid, class: 'text-success' },
  { key: 'open', label: t('members.detail.invoiceOpen'), value: props.totals.open, class: 'text-info' },
  { key: 'failed', label: t('members.detail.invoiceFailed'), value: props.totals.failed, class: 'text-error' }
])
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-muted">
      {{ $t('members.detail.invoicesNote') }}
    </p>

    <!-- Totals cover every invoice, not the page on screen. -->
    <div class="flex flex-wrap items-center gap-x-8 gap-y-2">
      <div v-for="item in summary" :key="item.key">
        <p class="eyebrow text-dimmed">
          {{ item.label }}
        </p>
        <p class="tnum text-lg font-semibold" :class="item.class">
          {{ fmt.currency(item.value) }}
        </p>
      </div>
    </div>

    <UInput
      v-model="search"
      icon="i-lucide-search"
      :placeholder="$t('members.detail.invoiceSearch')"
      class="max-w-sm"
    />

    <div class="overflow-x-auto rounded-[var(--ui-radius)] ring ring-default">
      <UTable
        :data="rows"
        :columns="columns"
        :empty="$t('members.detail.invoiceEmpty')"
      />
    </div>

    <div v-if="filtered.length > pageSize" class="flex justify-end">
      <UPagination
        v-model:page="page"
        :total="filtered.length"
        :items-per-page="pageSize"
      />
    </div>
  </div>
</template>
