<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

type Row = { invoice: string, account: string, amount: string }

const columns: TableColumn<Row>[] = [
  { accessorKey: 'invoice', header: 'Invoice' },
  { accessorKey: 'account', header: 'Account' },
  {
    accessorKey: 'amount',
    header: 'Amount',
    meta: { class: { th: 'text-right', td: 'text-right tnum' } }
  }
]

const filled: Row[] = [
  { invoice: 'CAD-2026-4180', account: 'Ironwood Digital', amount: '$174.00' },
  { invoice: 'CAD-2026-4181', account: 'Bellweather Group', amount: '$232.00' },
  { invoice: 'CAD-2026-4182', account: 'Northwind Digital', amount: '$36.00' }
]
</script>

<template>
  <PanelSection
    title="Every state a table has"
    description="A table is only finished when all four look right. The empty one is the state most often skipped, and the one people hit on their first day."
  >
    <div class="divide-y divide-default">
      <ReferenceRow title="Loading" description="A skeleton, not a spinner. It holds the shape so the page does not jump when data lands." wide>
        <div class="overflow-x-auto rounded-[var(--ui-radius)] ring ring-default">
          <UTable :data="[]" :columns="columns" loading class="min-w-md" />
        </div>
      </ReferenceRow>

      <ReferenceRow title="Loaded" description="The ordinary case. Money right-aligned and in tabular figures, so columns of digits line up." wide>
        <div class="overflow-x-auto rounded-[var(--ui-radius)] ring ring-default">
          <UTable :data="filled" :columns="columns" class="min-w-md" />
        </div>
      </ReferenceRow>

      <ReferenceRow title="Empty" description="Say why it is empty and what would fill it. “No data” tells someone nothing they had not already worked out." wide>
        <div class="overflow-x-auto rounded-[var(--ui-radius)] ring ring-default">
          <UTable :data="[]" :columns="columns" class="min-w-md">
            <template #empty>
              <EmptyState
                icon="i-lucide-receipt-text"
                title="No invoices in this period"
                description="Invoices appear here once your billing provider has settled them. Try a wider date range."
              />
            </template>
          </UTable>
        </div>
      </ReferenceRow>

      <ReferenceRow title="Failed" description="An error replaces the table rather than sitting above an empty one — two conflicting messages is worse than either." wide>
        <UAlert
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          :title="$t('subscribers.loadFailed')"
          :description="$t('subscribers.loadFailedBody')"
          :actions="[{ label: $t('common.retry'), variant: 'subtle', color: 'error' }]"
        />
      </ReferenceRow>
    </div>
  </PanelSection>
</template>
