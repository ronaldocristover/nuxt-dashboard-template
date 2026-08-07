<script setup lang="ts">
import type { Subscriber, SubscribersResponse } from '#shared/types'
import { initials } from '#shared/format'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { t } = useI18n()
const fmt = useFormat()
const { notifySuccess } = useApiError()

useSeoMeta({ title: () => t('subscribers.title'), robots: 'noindex' })

// --- Filters -----------------------------------------------------------------

type SortKey = 'name' | 'company' | 'mrr' | 'seats' | 'joinedAt'

const search = ref('')
const plan = ref<'all' | 'starter' | 'growth' | 'scale'>('all')
const status = ref<'all' | 'active' | 'trialing' | 'past_due' | 'churned'>('all')
const sort = ref<SortKey>('mrr')
const order = ref<'asc' | 'desc'>('desc')
const page = ref(1)
const pageSize = ref(10)

/**
 * Typing should not fire a request per keystroke. 300ms is long enough to
 * batch a word and short enough that the list still feels live.
 */
const debouncedSearch = ref('')
let searchTimer: ReturnType<typeof setTimeout> | undefined

watch(search, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    debouncedSearch.value = value
  }, 300)
})

onBeforeUnmount(() => clearTimeout(searchTimer))

// Any change to a filter invalidates the current page number.
watch([debouncedSearch, plan, status, sort, order, pageSize], () => {
  page.value = 1
})

const query = computed(() => new URLSearchParams({
  q: debouncedSearch.value,
  plan: plan.value,
  status: status.value,
  sort: sort.value,
  order: order.value,
  page: String(page.value),
  pageSize: String(pageSize.value)
}).toString())

const { data, status: fetchStatus, error, refresh } = await useApiFetch<SubscribersResponse>(
  () => `/api/subscribers?${query.value}`,
  { watch: [query] }
)

const pending = computed(() => fetchStatus.value === 'pending')
const rows = computed(() => data.value?.rows ?? [])

const hasFilters = computed(() =>
  debouncedSearch.value !== '' || plan.value !== 'all' || status.value !== 'all'
)

function clearFilters() {
  search.value = ''
  debouncedSearch.value = ''
  plan.value = 'all'
  status.value = 'all'
}

// --- Sorting -----------------------------------------------------------------

const COLUMNS = computed<Array<{ key: SortKey, label: string, sortable: boolean, align?: 'right' }>>(() => [
  { key: 'company', label: t('subscribers.columnAccount'), sortable: true },
  { key: 'name', label: t('subscribers.columnContact'), sortable: true },
  { key: 'mrr', label: t('subscribers.columnMrr'), sortable: true, align: 'right' },
  { key: 'seats', label: t('subscribers.columnSeats'), sortable: true, align: 'right' },
  { key: 'joinedAt', label: t('subscribers.columnStatus'), sortable: false }
])

function toggleSort(key: SortKey) {
  if (sort.value === key) {
    order.value = order.value === 'asc' ? 'desc' : 'asc'
  } else {
    sort.value = key
    // Text sorts read better ascending; money reads better descending.
    order.value = key === 'mrr' || key === 'seats' ? 'desc' : 'asc'
  }
}

function sortIcon(key: SortKey): string {
  if (sort.value !== key) return 'i-lucide-chevrons-up-down'
  return order.value === 'asc' ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'
}

/** Announced to screen readers so a sort is not a silent change. */
function ariaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
  if (sort.value !== key) return 'none'
  return order.value === 'asc' ? 'ascending' : 'descending'
}

// --- Selection ---------------------------------------------------------------

const selected = ref<Set<string>>(new Set())

// Selection is per-page: keeping ids across pagination would let someone
// act on rows they can no longer see.
watch(rows, () => {
  selected.value = new Set()
})

const allOnPageSelected = computed(() =>
  rows.value.length > 0 && rows.value.every(row => selected.value.has(row.id))
)

const someOnPageSelected = computed(() =>
  rows.value.some(row => selected.value.has(row.id)) && !allOnPageSelected.value
)

function toggleAll(checked: boolean) {
  selected.value = checked ? new Set(rows.value.map(row => row.id)) : new Set()
}

function toggleRow(id: string, checked: boolean) {
  const next = new Set(selected.value)
  if (checked) next.add(id)
  else next.delete(id)
  selected.value = next
}

/**
 * Builds a CSV in the browser from the rows already on screen. No round trip,
 * and it exports exactly what the reader can see.
 */
function exportSelected() {
  const chosen = rows.value.filter(row => selected.value.has(row.id))
  if (chosen.length === 0) return

  const header = ['Account', 'Contact', 'Email', 'Plan', 'Status', 'MRR', 'Seats', 'Country']
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`

  const csv = [
    header.join(','),
    ...chosen.map(row => [
      row.company, row.name, row.email, row.plan, row.status, row.mrr, row.seats, row.country
    ].map(escape).join(','))
  ].join('\n')

  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `cadence-subscribers-${chosen.length}.csv`
  link.click()
  URL.revokeObjectURL(url)

  notifySuccess(
    t('subscribers.exportReady'),
    chosen.length === 1
      ? t('subscribers.exportBodyOne')
      : t('subscribers.exportBody', { count: chosen.length })
  )
}

// --- Detail ------------------------------------------------------------------

const detailOpen = ref(false)
const detailRow = ref<Subscriber | null>(null)

function openDetail(row: Subscriber) {
  detailRow.value = row
  detailOpen.value = true
}

// --- Display -----------------------------------------------------------------

const PLAN_OPTIONS = computed(() => [
  { label: t('subscribers.allPlans'), value: 'all' },
  { label: t('plans.starter'), value: 'starter' },
  { label: t('plans.growth'), value: 'growth' },
  { label: t('plans.scale'), value: 'scale' }
])

const STATUS_OPTIONS = computed(() => [
  { label: t('subscribers.allStatuses'), value: 'all' },
  { label: t('status.active'), value: 'active' },
  { label: t('status.trialing'), value: 'trialing' },
  { label: t('status.past_due'), value: 'past_due' },
  { label: t('status.churned'), value: 'churned' }
])

const STATUS_COLOR = {
  active: 'success',
  trialing: 'info',
  past_due: 'warning',
  churned: 'neutral'
} as const

const showingFrom = computed(() => ((data.value?.page ?? 1) - 1) * pageSize.value + 1)
const showingTo = computed(() => Math.min(showingFrom.value + rows.value.length - 1, data.value?.total ?? 0))
</script>

<template>
  <UDashboardPanel id="subscribers">
    <template #header>
      <UDashboardNavbar :title="$t('subscribers.title')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            :loading="pending"
            :aria-label="$t('subscribers.refresh')"
            @click="refresh()"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <AppBreadcrumb />

      <div class="space-y-4">
        <!-- Totals reflect the whole filtered set, not just this page. -->
        <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <p class="eyebrow text-dimmed">
              {{ $t('subscribers.accounts') }}
            </p>
            <p class="tnum text-lg font-semibold text-highlighted">
              {{ fmt.number(data?.total ?? 0) }}
            </p>
          </div>
          <div>
            <p class="eyebrow text-dimmed">
              {{ $t('subscribers.combinedMrr') }}
            </p>
            <p class="tnum text-lg font-semibold text-highlighted">
              {{ fmt.currency(data?.totals.mrr ?? 0) }}
            </p>
          </div>
          <div>
            <p class="eyebrow text-dimmed">
              {{ $t('subscribers.seats') }}
            </p>
            <p class="tnum text-lg font-semibold text-highlighted">
              {{ fmt.number(data?.totals.seats ?? 0) }}
            </p>
          </div>
        </div>

        <!-- Filters -->
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            :placeholder="$t('subscribers.searchPlaceholder')"
            class="w-full sm:max-w-xs"
            :ui="{ trailing: 'pe-1' }"
          >
            <template v-if="search" #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                icon="i-lucide-x"
                :aria-label="$t('subscribers.clearSearch')"
                @click="search = ''"
              />
            </template>
          </UInput>

          <div class="flex gap-2">
            <USelect v-model="plan" :items="PLAN_OPTIONS" class="flex-1 sm:w-36" :aria-label="$t('subscribers.filterPlan')" />
            <USelect v-model="status" :items="STATUS_OPTIONS" class="flex-1 sm:w-40" :aria-label="$t('subscribers.filterStatus')" />
          </div>

          <UButton
            v-if="hasFilters"
            :label="$t('subscribers.clearFilters')"
            color="neutral"
            variant="ghost"
            icon="i-lucide-filter-x"
            class="sm:ms-auto"
            @click="clearFilters"
          />
        </div>

        <!-- Bulk action bar. Appears only when there is something to act on. -->
        <div
          v-if="selected.size > 0"
          class="flex flex-wrap items-center gap-3 rounded-[calc(var(--ui-radius)*1.5)] bg-primary/5 px-4 py-3 ring ring-primary/20"
        >
          <p class="text-sm font-medium text-highlighted">
            {{ $t('subscribers.selectedOnPage', { count: selected.size }) }}
          </p>
          <div class="flex flex-wrap gap-2 sm:ms-auto">
            <UButton
              :label="$t('subscribers.exportCsv')"
              icon="i-lucide-download"
              size="sm"
              variant="subtle"
              @click="exportSelected"
            />
            <UButton
              :label="$t('subscribers.clearSelection')"
              size="sm"
              color="neutral"
              variant="ghost"
              @click="selected = new Set()"
            />
          </div>
        </div>

        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          :title="$t('subscribers.loadFailed')"
          :description="$t('subscribers.loadFailedBody')"
          :actions="[{ label: $t('common.retry'), variant: 'subtle', color: 'error', onClick: () => refresh() }]"
        />

        <div v-else class="overflow-hidden rounded-[calc(var(--ui-radius)*1.5)] bg-default ring ring-default">
          <!-- ---------------------------------------------------------- -->
          <!-- Desktop: a real table.                                     -->
          <!-- ---------------------------------------------------------- -->
          <div class="hidden lg:block">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-default">
                  <th scope="col" class="w-10 ps-4">
                    <UCheckbox
                      :model-value="allOnPageSelected"
                      :indeterminate="someOnPageSelected"
                      :aria-label="$t('subscribers.selectAll')"
                      @update:model-value="toggleAll(Boolean($event))"
                    />
                  </th>
                  <th
                    v-for="column in COLUMNS"
                    :key="column.key"
                    scope="col"
                    class="px-3 py-2.5 font-medium text-muted"
                    :class="column.align === 'right' ? 'text-right' : 'text-left'"
                    :aria-sort="column.sortable ? ariaSort(column.key) : undefined"
                  >
                    <button
                      v-if="column.sortable"
                      type="button"
                      class="inline-flex items-center gap-1 rounded transition-colors hover:text-highlighted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      @click="toggleSort(column.key)"
                    >
                      {{ column.label }}
                      <UIcon :name="sortIcon(column.key as SortKey)" class="size-3.5" />
                    </button>
                    <span v-else>{{ column.label }}</span>
                  </th>
                  <th scope="col" class="w-10 pe-4">
                    <span class="sr-only">Open details</span>
                  </th>
                </tr>
              </thead>

              <tbody v-if="pending">
                <tr v-for="row in pageSize" :key="row" class="border-b border-default last:border-0">
                  <td colspan="7" class="px-4 py-3.5">
                    <div class="h-5 animate-pulse rounded bg-elevated" />
                  </td>
                </tr>
              </tbody>

              <tbody v-else>
                <tr
                  v-for="row in rows"
                  :key="row.id"
                  class="border-b border-default transition-colors last:border-0 hover:bg-elevated/50"
                  :class="selected.has(row.id) ? 'bg-primary/5' : ''"
                >
                  <td class="ps-4">
                    <UCheckbox
                      :model-value="selected.has(row.id)"
                      :aria-label="$t('subscribers.selectRow', { name: row.company })"
                      @update:model-value="toggleRow(row.id, Boolean($event))"
                    />
                  </td>
                  <td class="px-3 py-3">
                    <div class="flex items-center gap-2.5">
                      <UAvatar
                        :text="initials(row.company)"
                        size="xs"
                        :style="{ background: row.avatarColor, color: '#fff' }"
                      />
                      <div class="min-w-0">
                        <p class="truncate font-medium text-highlighted">
                          {{ row.company }}
                        </p>
                        <p class="truncate text-xs text-dimmed">
                          {{ $t(`plans.${row.plan}`) }} · {{ row.country }}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td class="px-3 py-3">
                    <p class="truncate text-default">
                      {{ row.name }}
                    </p>
                    <p class="truncate text-xs text-dimmed">
                      {{ row.email }}
                    </p>
                  </td>
                  <td class="tnum px-3 py-3 text-right font-medium text-highlighted">
                    {{ fmt.currency(row.mrr) }}
                  </td>
                  <td class="tnum px-3 py-3 text-right text-muted">
                    {{ fmt.number(row.seats) }}
                  </td>
                  <td class="px-3 py-3">
                    <UBadge
                      :label="$t(`status.${row.status}`)"
                      :color="STATUS_COLOR[row.status]"
                      variant="subtle"
                      size="sm"
                    />
                    <p class="mt-1 text-xs text-dimmed">
                      {{ $t('subscribers.seenAt', { when: data ? fmt.relative(row.lastSeenAt, data.generatedAt) : '' }) }}
                    </p>
                  </td>
                  <td class="pe-4 text-right">
                    <UButton
                      icon="i-lucide-chevron-right"
                      color="neutral"
                      variant="ghost"
                      size="sm"
                      :aria-label="$t('subscribers.openDetails', { name: row.company })"
                      @click="openDetail(row)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- ---------------------------------------------------------- -->
          <!-- Mobile: stacked cards, not a horizontally scrolling table. -->
          <!-- ---------------------------------------------------------- -->
          <div class="lg:hidden">
            <div v-if="pending" class="divide-y divide-default">
              <div v-for="row in 6" :key="row" class="animate-pulse space-y-2 p-4">
                <div class="h-4 w-2/3 rounded bg-elevated" />
                <div class="h-3 w-1/2 rounded bg-elevated" />
              </div>
            </div>

            <ul v-else class="divide-y divide-default">
              <li v-for="row in rows" :key="row.id" :class="selected.has(row.id) ? 'bg-primary/5' : ''">
                <div class="flex items-start gap-3 p-4">
                  <UCheckbox
                    :model-value="selected.has(row.id)"
                    class="mt-1"
                    :aria-label="$t('subscribers.selectRow', { name: row.company })"
                    @update:model-value="toggleRow(row.id, Boolean($event))"
                  />

                  <button
                    type="button"
                    class="min-w-0 flex-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    @click="openDetail(row)"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="truncate font-medium text-highlighted">
                          {{ row.company }}
                        </p>
                        <p class="truncate text-xs text-muted">
                          {{ row.name }} · {{ row.email }}
                        </p>
                      </div>
                      <span class="tnum shrink-0 text-sm font-semibold text-highlighted">
                        {{ fmt.currency(row.mrr) }}
                      </span>
                    </div>

                    <div class="mt-2 flex flex-wrap items-center gap-2">
                      <UBadge
                        :label="$t(`status.${row.status}`)"
                        :color="STATUS_COLOR[row.status]"
                        variant="subtle"
                        size="sm"
                      />
                      <span class="text-xs text-dimmed">
                        {{ $t(`plans.${row.plan}`) }} · {{ fmt.number(row.seats) }} · {{ $t('subscribers.seenAt', { when: data ? fmt.relative(row.lastSeenAt, data.generatedAt) : '' }) }}
                      </span>
                    </div>
                  </button>
                </div>
              </li>
            </ul>
          </div>

          <EmptyState
            v-if="!pending && rows.length === 0"
            icon="i-lucide-users"
            :title="hasFilters ? $t('subscribers.emptyFiltered') : $t('subscribers.empty')"
            :description="hasFilters ? $t('subscribers.emptyFilteredBody') : $t('subscribers.emptyBody')"
            :action-label="hasFilters ? $t('subscribers.clearFilters') : undefined"
            @action="clearFilters"
          />

          <!-- Pagination -->
          <div
            v-if="!pending && (data?.total ?? 0) > 0"
            class="flex flex-col gap-3 border-t border-default px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <p class="tnum text-xs text-muted">
              {{ $t('subscribers.showing', {
                from: fmt.number(showingFrom),
                to: fmt.number(showingTo),
                total: fmt.number(data?.total ?? 0)
              }) }}
            </p>

            <div class="flex items-center gap-3">
              <USelect
                v-model="pageSize"
                :items="[10, 25, 50]"
                size="sm"
                class="w-20"
                :aria-label="$t('subscribers.rowsPerPage')"
              />
              <UPagination
                v-model:page="page"
                :total="data?.total ?? 0"
                :items-per-page="pageSize"
                :sibling-count="1"
                size="sm"
              />
            </div>
          </div>
        </div>

        <!-- Inside the panel body so the page keeps a single root element.
             The slideover teleports to the app root regardless. -->
        <SubscriberDetail v-model:open="detailOpen" :subscriber="detailRow" :generated-at="data?.generatedAt" />
      </div>
    </template>
  </UDashboardPanel>
</template>
